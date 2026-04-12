import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { disconnectForumDatabase, resetForumDatabase, seedForumScenario } from './utils/db'
import { getForumServerUrl, startForumServer, stopForumServer } from './utils/server'

type RealtimeEnvelope = {
  channel: string
  event: {
    type: string
    topicId?: string
    forumId?: string
    topic?: {
      id: string
      title: string
      messageCount: number
    } | null
    message?: {
      id: string
      content: string
      isDeleted: boolean
    }
  }
}

async function requestJson(path: string, init?: RequestInit) {
  const response = await fetch(`${getForumServerUrl()}${path}`, init)
  const body = await response.json()

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

async function openRealtimeSocket() {
  const websocketUrl = `${getForumServerUrl().replace('http://', 'ws://')}/_ws`
  const socket = new WebSocket(websocketUrl)

  await new Promise<void>((resolve, reject) => {
    const onOpen = () => {
      cleanup()
      resolve()
    }
    const onError = () => {
      cleanup()
      reject(new Error('WebSocket connection failed'))
    }
    const cleanup = () => {
      socket.removeEventListener('open', onOpen)
      socket.removeEventListener('error', onError)
    }

    socket.addEventListener('open', onOpen)
    socket.addEventListener('error', onError)
  })

  return socket
}

async function waitForEnvelope(
  socket: WebSocket,
  predicate: (envelope: RealtimeEnvelope) => boolean,
  timeoutMs = 10000,
) {
  return await new Promise<RealtimeEnvelope>((resolve, reject) => {
    const timer = setTimeout(() => {
      cleanup()
      reject(new Error('Timed out waiting for realtime event'))
    }, timeoutMs)

    const onMessage = (event: MessageEvent) => {
      if (typeof event.data !== 'string') {
        return
      }

      const envelope = JSON.parse(event.data) as RealtimeEnvelope

      if (!predicate(envelope)) {
        return
      }

      cleanup()
      resolve(envelope)
    }

    const cleanup = () => {
      clearTimeout(timer)
      socket.removeEventListener('message', onMessage)
    }

    socket.addEventListener('message', onMessage)
  })
}

function subscribe(socket: WebSocket, channels: string[]) {
  socket.send(
    JSON.stringify({
      type: 'subscribe',
      channels,
    }),
  )
}

describe('forum realtime websocket', () => {
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

  it('broadcasts topic.created after a new topic is created', async () => {
    const socket = await openRealtimeSocket()
    const cookie = await createSessionCookie('00000000-0000-4000-8000-000000000002')

    subscribe(socket, ['forums:00000000-0000-4000-8000-000000000010:topics'])

    try {
      const waitForTopicCreated = waitForEnvelope(
        socket,
        (envelope) => envelope.event.type === 'topic.created',
      )

      const { response } = await requestJson('/api/forums/general/topics', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          cookie,
        },
        body: JSON.stringify({
          title: 'Sujet temps reel',
          content: 'Creation live',
        }),
      })

      expect(response.status).toBe(201)

      const envelope = await waitForTopicCreated

      expect(envelope).toMatchObject({
        channel: 'forums:00000000-0000-4000-8000-000000000010:topics',
        event: {
          type: 'topic.created',
          forumId: '00000000-0000-4000-8000-000000000010',
          topic: {
            title: 'Sujet temps reel',
            messageCount: 1,
          },
        },
      })
    } finally {
      socket.close()
    }
  })

  it('broadcasts message.created and topic.bumped after a reply', async () => {
    const socket = await openRealtimeSocket()
    const cookie = await createSessionCookie('00000000-0000-4000-8000-000000000002')

    subscribe(socket, [
      'topics:00000000-0000-4000-8000-000000000020:messages',
      'forums:00000000-0000-4000-8000-000000000010:topics',
    ])

    try {
      const waitForMessageCreated = waitForEnvelope(
        socket,
        (envelope) => envelope.event.type === 'message.created',
      )
      const waitForTopicBumped = waitForEnvelope(
        socket,
        (envelope) => envelope.event.type === 'topic.bumped',
      )

      const { response } = await requestJson('/api/forums/general/topics/bienvenue/messages', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          cookie,
        },
        body: JSON.stringify({
          content: 'Reponse temps reel',
        }),
      })

      expect(response.status).toBe(201)

      const [messageEnvelope, topicEnvelope] = await Promise.all([
        waitForMessageCreated,
        waitForTopicBumped,
      ])

      expect(messageEnvelope.event).toMatchObject({
        type: 'message.created',
        topicId: '00000000-0000-4000-8000-000000000020',
        message: {
          content: 'Reponse temps reel',
          isDeleted: false,
        },
      })
      expect(topicEnvelope.event).toMatchObject({
        type: 'topic.bumped',
        topicId: '00000000-0000-4000-8000-000000000020',
        topic: {
          title: 'Bienvenue',
          messageCount: 2,
        },
      })
    } finally {
      socket.close()
    }
  })

  it('broadcasts update, delete, moderation and restore events with public-safe payloads', async () => {
    const socket = await openRealtimeSocket()
    const userCookie = await createSessionCookie('00000000-0000-4000-8000-000000000002')
    const adminCookie = await createSessionCookie('00000000-0000-4000-8000-000000000001')

    subscribe(socket, ['topics:00000000-0000-4000-8000-000000000020:messages'])

    try {
      const waitForUpdated = waitForEnvelope(
        socket,
        (envelope) => envelope.event.type === 'message.updated',
      )

      let response = await requestJson('/api/messages/00000000-0000-4000-8000-000000000030', {
        method: 'PATCH',
        headers: {
          'content-type': 'application/json',
          cookie: userCookie,
        },
        body: JSON.stringify({
          content: 'Premier message modifie',
        }),
      })

      expect(response.response.status).toBe(200)
      expect((await waitForUpdated).event).toMatchObject({
        type: 'message.updated',
        message: {
          id: '00000000-0000-4000-8000-000000000030',
          content: 'Premier message modifie',
          isDeleted: false,
        },
      })

      const waitForModerated = waitForEnvelope(
        socket,
        (envelope) => envelope.event.type === 'message.moderated',
      )

      response = await requestJson('/api/messages/00000000-0000-4000-8000-000000000030', {
        method: 'PATCH',
        headers: {
          'content-type': 'application/json',
          cookie: adminCookie,
        },
        body: JSON.stringify({
          action: 'moderate-delete',
        }),
      })

      expect(response.response.status).toBe(200)
      expect((await waitForModerated).event).toMatchObject({
        type: 'message.moderated',
        message: {
          id: '00000000-0000-4000-8000-000000000030',
          content: 'Ce message a ete supprime par la moderation.',
          isDeleted: true,
        },
      })

      const waitForRestored = waitForEnvelope(
        socket,
        (envelope) => envelope.event.type === 'message.restored',
      )

      response = await requestJson('/api/messages/00000000-0000-4000-8000-000000000030', {
        method: 'PATCH',
        headers: {
          'content-type': 'application/json',
          cookie: adminCookie,
        },
        body: JSON.stringify({
          action: 'moderate-restore',
        }),
      })

      expect(response.response.status).toBe(200)
      expect((await waitForRestored).event).toMatchObject({
        type: 'message.restored',
        message: {
          id: '00000000-0000-4000-8000-000000000030',
          content: 'Premier message modifie',
          isDeleted: false,
        },
      })

      const waitForDeleted = waitForEnvelope(
        socket,
        (envelope) => envelope.event.type === 'message.deleted',
      )

      response = await requestJson('/api/messages/00000000-0000-4000-8000-000000000030', {
        method: 'DELETE',
        headers: {
          cookie: userCookie,
        },
      })

      expect(response.response.status).toBe(200)
      expect((await waitForDeleted).event).toMatchObject({
        type: 'message.deleted',
        message: {
          id: '00000000-0000-4000-8000-000000000030',
          content: 'Premier message modifie',
          isDeleted: false,
        },
      })
    } finally {
      socket.close()
    }
  })
})
