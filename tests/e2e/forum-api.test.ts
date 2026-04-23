import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import {
  disconnectForumDatabase,
  getTestPrisma,
  resetForumDatabase,
  seedForumScenario,
} from './utils/db'
import { getForumServerUrl, startForumServer, stopForumServer } from './utils/server'

type JsonValue = null | boolean | number | string | JsonValue[] | { [key: string]: JsonValue }

async function requestJson(path: string, init?: RequestInit) {
  const response = await fetch(`${getForumServerUrl()}${path}`, init)
  const body = (await response.json()) as JsonValue

  return {
    response,
    body,
  }
}

async function requestText(path: string, init?: RequestInit) {
  const response = await fetch(`${getForumServerUrl()}${path}`, init)
  const body = await response.text()

  return {
    response,
    body,
  }
}

async function createSessionCookie(userId: string) {
  const { response } = await requestJson('/api/__test__/session', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
    },
    body: JSON.stringify({ userId }),
  })

  expect(response.status).toBe(200)

  const setCookie = response.headers.get('set-cookie')

  if (!setCookie) {
    throw new Error('Missing session cookie in test response')
  }

  return setCookie.split(';', 1)[0]
}

describe('forum server API', () => {
  beforeAll(async () => {
    await startForumServer()
  })

  beforeEach(async () => {
    await resetForumDatabase()
    await seedForumScenario()
  })

  afterAll(async () => {
    await resetForumDatabase()
    await disconnectForumDatabase()
    await stopForumServer()
  })

  it('lists forums for a public visitor', async () => {
    const { response, body } = await requestJson('/api/forums')

    expect(response.status).toBe(200)
    expect(body).toMatchObject({
      viewer: {
        isAuthenticated: false,
        isAdmin: false,
      },
      forums: [
        {
          name: 'Général',
          slug: 'general',
          topicCount: 1,
        },
      ],
    })
  })

  it('rejects topic creation without a session', async () => {
    const { response } = await requestJson('/api/forums/general/topics', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        title: 'Sujet sans session',
        content: 'Refus attendu',
      }),
    })

    expect(response.status).toBe(401)
  })

  it('creates a topic for an authenticated user', async () => {
    const cookie = await createSessionCookie('00000000-0000-4000-8000-000000000002')
    const { response, body } = await requestJson('/api/forums/general/topics', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        cookie,
      },
      body: JSON.stringify({
        title: 'Sujet de test',
        content: 'Premier message du sujet',
      }),
    })

    expect(response.status).toBe(201)
    expect(body).toMatchObject({
      topic: {
        forumSlug: 'general',
        title: 'Sujet de test',
      },
      message: {
        page: 1,
      },
    })

    const createdTopic = await getTestPrisma().topic.findUnique({
      where: {
        id: (body as { topic: { id: string } }).topic.id,
      },
      include: {
        messages: true,
      },
    })

    expect(createdTopic?.messages).toHaveLength(1)
  })

  it('creates a reply for an authenticated user', async () => {
    const cookie = await createSessionCookie('00000000-0000-4000-8000-000000000002')
    const { response, body } = await requestJson('/api/forums/general/topics/bienvenue/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        cookie,
      },
      body: JSON.stringify({
        content: 'Deuxième message du sujet',
      }),
    })

    expect(response.status).toBe(201)
    expect(body).toMatchObject({
      topic: {
        forumSlug: 'general',
        slug: 'bienvenue',
      },
      message: {
        page: 1,
      },
    })

    const topic = await getTestPrisma().topic.findUnique({
      where: {
        forumId_slug: {
          forumId: '00000000-0000-4000-8000-000000000010',
          slug: 'bienvenue',
        },
      },
      include: {
        messages: true,
      },
    })

    expect(topic?.messages).toHaveLength(2)
  })

  it('hard deletes a non-initial author message through DELETE /api/messages/:id', async () => {
    const cookie = await createSessionCookie('00000000-0000-4000-8000-000000000002')
    const createdReply = await requestJson('/api/forums/general/topics/bienvenue/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        cookie,
      },
      body: JSON.stringify({
        content: 'Deuxieme message a supprimer',
      }),
    })

    expect(createdReply.response.status).toBe(201)

    const messageId = (createdReply.body as { message: { id: string } }).message.id

    const { response, body } = await requestJson(`/api/messages/${messageId}`, {
      method: 'DELETE',
      headers: {
        cookie,
      },
    })

    expect(response.status).toBe(200)
    expect(body).toMatchObject({
      redirectTo: '/forums/general/topics/bienvenue',
    })

    const deletedMessage = await getTestPrisma().message.findUnique({
      where: {
        id: messageId,
      },
    })

    expect(deletedMessage).toBeNull()
  })

  it('rejects deletion of the initial topic message', async () => {
    const cookie = await createSessionCookie('00000000-0000-4000-8000-000000000002')
    const { response } = await requestJson('/api/messages/00000000-0000-4000-8000-000000000030', {
      method: 'DELETE',
      headers: {
        cookie,
      },
    })

    expect(response.status).toBe(409)

    const initialMessage = await getTestPrisma().message.findUnique({
      where: {
        id: '00000000-0000-4000-8000-000000000030',
      },
    })

    expect(initialMessage).not.toBeNull()
  })

  it('moderates a message through PATCH /api/messages/:id', async () => {
    const cookie = await createSessionCookie('00000000-0000-4000-8000-000000000001')
    const { response } = await requestJson('/api/messages/00000000-0000-4000-8000-000000000030', {
      method: 'PATCH',
      headers: {
        'content-type': 'application/json',
        cookie,
      },
      body: JSON.stringify({
        action: 'moderate-delete',
      }),
    })

    expect(response.status).toBe(200)

    const moderatedMessage = await getTestPrisma().message.findUnique({
      where: {
        id: '00000000-0000-4000-8000-000000000030',
      },
    })

    expect(moderatedMessage?.deletedAt).not.toBeNull()
    expect(moderatedMessage?.content).toBe('Premier message')
  })

  it('restores a moderated message through PATCH /api/messages/:id', async () => {
    const cookie = await createSessionCookie('00000000-0000-4000-8000-000000000001')

    await requestJson('/api/messages/00000000-0000-4000-8000-000000000030', {
      method: 'PATCH',
      headers: {
        'content-type': 'application/json',
        cookie,
      },
      body: JSON.stringify({
        action: 'moderate-delete',
      }),
    })

    const { response } = await requestJson('/api/messages/00000000-0000-4000-8000-000000000030', {
      method: 'PATCH',
      headers: {
        'content-type': 'application/json',
        cookie,
      },
      body: JSON.stringify({
        action: 'moderate-restore',
      }),
    })

    expect(response.status).toBe(200)

    const restoredMessage = await getTestPrisma().message.findUnique({
      where: {
        id: '00000000-0000-4000-8000-000000000030',
      },
    })

    expect(restoredMessage?.deletedAt).toBeNull()
    expect(restoredMessage?.deletedByUserId).toBeNull()
  })

  it('shows the original moderated message to admins and the placeholder to regular users', async () => {
    const adminCookie = await createSessionCookie('00000000-0000-4000-8000-000000000001')

    await requestJson('/api/messages/00000000-0000-4000-8000-000000000030', {
      method: 'PATCH',
      headers: {
        'content-type': 'application/json',
        cookie: adminCookie,
      },
      body: JSON.stringify({
        action: 'moderate-delete',
      }),
    })

    const { response: adminPageResponse, body: adminBody } = await requestText(
      '/forums/general/topics/bienvenue',
      {
        headers: {
          cookie: adminCookie,
        },
      },
    )
    const userCookie = await createSessionCookie('00000000-0000-4000-8000-000000000002')
    const { response: userPageResponse, body: userBody } = await requestText(
      '/forums/general/topics/bienvenue',
      {
        headers: {
          cookie: userCookie,
        },
      },
    )

    expect(adminPageResponse.status).toBe(200)
    expect(adminBody).toContain('Ce message a été supprimé par la modération.')
    expect(adminBody).toContain('Premier message')
    expect(adminBody).toContain('Version originale visible pour la modération')
    expect(userPageResponse.status).toBe(200)
    expect(userBody).toContain('Ce message a été supprimé par la modération.')
    expect(userBody).not.toContain('Premier message')
  })

  it('renders the quoted message inside the topic page after a quoted reply', async () => {
    const cookie = await createSessionCookie('00000000-0000-4000-8000-000000000002')
    const { response } = await requestJson('/api/forums/general/topics/bienvenue/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        cookie,
      },
      body: JSON.stringify({
        content: 'Je cite le premier message',
        quotedMessageId: '00000000-0000-4000-8000-000000000030',
      }),
    })

    expect(response.status).toBe(201)

    const { response: pageResponse, body } = await requestText('/forums/general/topics/bienvenue')

    expect(pageResponse.status).toBe(200)
    expect(body).toContain('Citation de alice')
    expect(body).toContain('Premier message')
    expect(body).toContain('Je cite le premier message')
  })

  it('locks a topic for regular users until an admin unlocks it', async () => {
    const adminCookie = await createSessionCookie('00000000-0000-4000-8000-000000000001')
    const userCookie = await createSessionCookie('00000000-0000-4000-8000-000000000002')

    let result = await requestJson('/api/admin/topics/00000000-0000-4000-8000-000000000020', {
      method: 'PATCH',
      headers: {
        'content-type': 'application/json',
        cookie: adminCookie,
      },
      body: JSON.stringify({
        isLocked: true,
      }),
    })

    expect(result.response.status).toBe(200)
    expect(result.body).toMatchObject({
      topic: {
        id: '00000000-0000-4000-8000-000000000020',
        isLocked: true,
      },
    })

    const lockedReply = await requestJson('/api/forums/general/topics/bienvenue/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        cookie: userCookie,
      },
      body: JSON.stringify({
        content: 'Refus attendu',
      }),
    })

    expect(lockedReply.response.status).toBe(423)

    result = await requestJson('/api/admin/topics/00000000-0000-4000-8000-000000000020', {
      method: 'PATCH',
      headers: {
        'content-type': 'application/json',
        cookie: adminCookie,
      },
      body: JSON.stringify({
        isLocked: false,
      }),
    })

    expect(result.response.status).toBe(200)
    expect(result.body).toMatchObject({
      topic: {
        id: '00000000-0000-4000-8000-000000000020',
        isLocked: false,
      },
    })

    const unlockedReply = await requestJson('/api/forums/general/topics/bienvenue/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        cookie: userCookie,
      },
      body: JSON.stringify({
        content: 'Reponse apres deverrouillage',
      }),
    })

    expect(unlockedReply.response.status).toBe(201)
  })

  it('renders the topic detail page with its messages', async () => {
    const { response, body } = await requestText('/forums/general/topics/bienvenue')

    expect(response.status).toBe(200)
    expect(body).toContain('Bienvenue')
    expect(body).toContain('Premier message')
    expect(body).toContain('Connectez-vous pour répondre')
  })

  it('returns 403 when a regular user hits an admin route', async () => {
    const cookie = await createSessionCookie('00000000-0000-4000-8000-000000000002')
    const { response } = await requestJson('/api/admin/forums', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        cookie,
      },
      body: JSON.stringify({
        name: 'Administration',
        description: 'Réservé aux admins',
      }),
    })

    expect(response.status).toBe(403)
  })

  it('creates a forum for an admin user', async () => {
    const cookie = await createSessionCookie('00000000-0000-4000-8000-000000000001')
    const { response, body } = await requestJson('/api/admin/forums', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        cookie,
      },
      body: JSON.stringify({
        name: 'Administration',
        description: 'Réservé aux admins',
      }),
    })

    expect(response.status).toBe(201)
    expect(body).toMatchObject({
      forum: {
        name: 'Administration',
        slug: 'administration',
      },
    })
  })

  it('returns 400 for an invalid message identifier', async () => {
    const cookie = await createSessionCookie('00000000-0000-4000-8000-000000000002')
    const { response } = await requestJson('/api/messages/not-a-uuid', {
      method: 'PATCH',
      headers: {
        'content-type': 'application/json',
        cookie,
      },
      body: JSON.stringify({
        content: 'Contenu',
      }),
    })

    expect(response.status).toBe(400)
  })
})
