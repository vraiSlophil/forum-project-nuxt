import { createError, type H3Event, useSession } from 'h3'

type UserSessionData = {
  user?: unknown
  [key: string]: unknown
}

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
