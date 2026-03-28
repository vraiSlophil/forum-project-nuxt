import type { AuthSessionUser } from '#shared/types/auth'
import { createError, type H3Event, useSession } from 'h3'

export interface AppUserSession {
  id: string
  user?: AuthSessionUser
  loggedInAt?: string
}

type UserSessionData = Omit<AppUserSession, 'id'>

function getSessionConfig() {
  return {
    name: 'nuxt-session',
    password: process.env.NUXT_SESSION_PASSWORD ?? '',
    cookie: {
      sameSite: 'lax' as const,
    },
  }
}

export async function getAppUserSession(event: H3Event) {
  const session = await useSession<UserSessionData>(event, getSessionConfig())

  return {
    ...session.data,
    id: session.id,
  }
}

export async function setAppUserSession(event: H3Event, data: UserSessionData) {
  const session = await useSession<UserSessionData>(event, getSessionConfig())

  await session.update({
    ...session.data,
    ...data,
  })

  return session.data
}

export async function replaceAppUserSession(event: H3Event, data: UserSessionData) {
  const session = await useSession<UserSessionData>(event, getSessionConfig())

  await session.clear()
  await session.update(data)

  return session.data
}

export async function clearAppUserSession(event: H3Event) {
  const session = await useSession<UserSessionData>(event, getSessionConfig())

  await session.clear()

  return true
}

export async function requireAppUserSession(
  event: H3Event,
  options: {
    statusCode?: number
    message?: string
  } = {},
) {
  const session = await getAppUserSession(event)

  if (!session.user) {
    throw createError({
      statusCode: options.statusCode ?? 401,
      statusMessage: options.message ?? 'Unauthorized',
    })
  }

  return session
}
