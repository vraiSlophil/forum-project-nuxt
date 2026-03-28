import type { H3Event } from 'h3'
import type { ForumUserRole } from '#shared/types/forum'
import type { AuthSessionUser } from '#shared/types/auth'
import { createAuthApplicationError } from '#server/modules/auth/application/shared/errors'
import { findSessionActorById } from './auth-repository'
import { getAppUserSession, requireAppUserSession } from '#server/utils/user-session'

function isForumUserRole(value: unknown): value is ForumUserRole {
  return value === 'USER' || value === 'ADMIN'
}

function isAuthSessionUser(value: unknown): value is AuthSessionUser {
  if (!value || typeof value !== 'object') {
    return false
  }

  const user = value as Record<string, unknown>

  return (
    typeof user.id === 'string' &&
    user.id.length > 0 &&
    typeof user.username === 'string' &&
    user.username.length > 0 &&
    isForumUserRole(user.role)
  )
}

export async function getAuthenticatedViewer(event: H3Event): Promise<AuthSessionUser | null> {
  const session = await getAppUserSession(event)

  if (!isAuthSessionUser(session.user)) {
    return null
  }

  const actor = await findSessionActorById(session.user.id)

  return actor ?? null
}

export async function requireAuthenticatedActor(event: H3Event): Promise<AuthSessionUser> {
  let session: Awaited<ReturnType<typeof requireAppUserSession>>

  try {
    session = await requireAppUserSession(event)
  } catch {
    throw createAuthApplicationError('UNAUTHENTICATED')
  }

  if (!isAuthSessionUser(session.user)) {
    throw createAuthApplicationError('UNAUTHENTICATED', 'Invalid user session')
  }

  const actor = await findSessionActorById(session.user.id)

  if (!actor) {
    throw createAuthApplicationError('UNAUTHENTICATED', 'User no longer exists')
  }

  return actor
}
