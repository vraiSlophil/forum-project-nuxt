import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { disconnectForumDatabase, resetForumDatabase } from './utils/db'
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

function extractSessionCookie(response: Response) {
  const setCookie = response.headers.get('set-cookie')

  if (!setCookie) {
    throw new Error('Missing session cookie in response')
  }

  return setCookie.split(';', 1)[0]
}

describe('authentication API', () => {
  beforeAll(async () => {
    await resetForumDatabase()
    await startForumServer()
  })

  afterAll(async () => {
    await resetForumDatabase()
    await disconnectForumDatabase()
    await stopForumServer()
  })

  it('creates the default admin account on first boot', async () => {
    const { response, body } = await requestJson('/api/auth/login', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        username: 'admin',
        password: 'admin',
      }),
    })

    expect(response.status).toBe(200)
    expect(body).toMatchObject({
      user: {
        username: 'admin',
        role: 'ADMIN',
      },
    })
  })

  describe('credential flows', () => {
    beforeEach(async () => {
      await resetForumDatabase()
    })

    it('registers a user and opens a session', async () => {
      const { response, body } = await requestJson('/api/auth/register', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          username: 'alice',
          password: 'secret',
        }),
      })

      expect(response.status).toBe(201)
      expect(body).toMatchObject({
        user: {
          username: 'alice',
          role: 'USER',
        },
      })

      const cookie = extractSessionCookie(response)
      const sessionResponse = await requestJson('/api/_auth/session', {
        headers: {
          cookie,
        },
      })

      expect(sessionResponse.response.status).toBe(200)
      expect(sessionResponse.body).toMatchObject({
        user: {
          username: 'alice',
          role: 'USER',
        },
      })
    })

    it('rejects invalid login credentials', async () => {
      await requestJson('/api/auth/register', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          username: 'alice',
          password: 'secret',
        }),
      })

      const { response } = await requestJson('/api/auth/login', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          username: 'alice',
          password: 'wrong-password',
        }),
      })

      expect(response.status).toBe(401)
    })

    it('logs in again after a logout', async () => {
      const registerResponse = await requestJson('/api/auth/register', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          username: 'alice',
          password: 'secret',
        }),
      })
      const cookie = extractSessionCookie(registerResponse.response)

      const logoutResponse = await requestJson('/api/_auth/session', {
        method: 'DELETE',
        headers: {
          cookie,
        },
      })

      expect(logoutResponse.response.status).toBe(200)
      expect(logoutResponse.body).toEqual({
        loggedOut: true,
      })

      const loginResponse = await requestJson('/api/auth/login', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          username: 'alice',
          password: 'secret',
        }),
      })

      expect(loginResponse.response.status).toBe(200)
      expect(loginResponse.body).toMatchObject({
        user: {
          username: 'alice',
        },
      })
    })

    it('changes the password using the current password', async () => {
      const registerResponse = await requestJson('/api/auth/register', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          username: 'alice',
          password: 'secret',
        }),
      })
      const cookie = extractSessionCookie(registerResponse.response)

      const rejectedChange = await requestJson('/api/auth/password', {
        method: 'PATCH',
        headers: {
          'content-type': 'application/json',
          cookie,
        },
        body: JSON.stringify({
          currentPassword: 'wrong-password',
          newPassword: 'new-secret',
        }),
      })

      expect(rejectedChange.response.status).toBe(401)

      const acceptedChange = await requestJson('/api/auth/password', {
        method: 'PATCH',
        headers: {
          'content-type': 'application/json',
          cookie,
        },
        body: JSON.stringify({
          currentPassword: 'secret',
          newPassword: 'new-secret',
        }),
      })

      expect(acceptedChange.response.status).toBe(200)
      expect(acceptedChange.body).toMatchObject({
        user: {
          username: 'alice',
        },
      })

      await requestJson('/api/_auth/session', {
        method: 'DELETE',
        headers: {
          cookie,
        },
      })

      const oldPasswordLogin = await requestJson('/api/auth/login', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          username: 'alice',
          password: 'secret',
        }),
      })

      expect(oldPasswordLogin.response.status).toBe(401)

      const newPasswordLogin = await requestJson('/api/auth/login', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          username: 'alice',
          password: 'new-secret',
        }),
      })

      expect(newPasswordLogin.response.status).toBe(200)
    })
  })
})
