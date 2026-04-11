import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import {
  disconnectForumDatabase,
  getTestPrisma,
  resetForumDatabase,
  seedForumScenario,
} from './utils/db'
import { getForumServerUrl, startForumServer, stopForumServer } from './utils/server'

process.env.NODE_ENV = 'test'
process.env.FORUM_ENABLE_TEST_ROUTES = '1'
process.env.POSTGRES_SCHEMA = 'forum_test'

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

  it('renders the topic detail page with its messages', async () => {
    const { response, body } = await requestText('/forums/general/topics/bienvenue')

    expect(response.status).toBe(200)
    expect(body).toContain('Bienvenue')
    expect(body).toContain('Premier message')
    expect(body).toContain('Connectez-vous pour repondre')
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
