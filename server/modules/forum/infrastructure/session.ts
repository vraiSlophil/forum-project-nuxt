import { getUserSession, requireUserSession } from '#imports'
import type { H3Event } from 'h3'
import { findActorById } from './forum-repository'
import type { ForumUserRole } from '#shared/types/forum'
import type { ForumActor, SessionForumUser } from '#server/modules/forum/domain/actors'
import { createForumApplicationError } from '#server/modules/forum/application/shared/errors'

function isForumUserRole(value: unknown): value is ForumUserRole {
  return value === 'USER' || value === 'ADMIN'
}

function isSessionForumUser(value: unknown): value is SessionForumUser {
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

export async function getViewerSessionUser(event: H3Event): Promise<SessionForumUser | null> {
  const session = await getUserSession(event)

  if (!isSessionForumUser(session.user)) {
    return null
  }

  const actor = await findActorById(session.user.id)

  return actor ?? null
}

export async function requireForumActor(event: H3Event): Promise<ForumActor> {
  let session: Awaited<ReturnType<typeof requireUserSession>>

  try {
    session = await requireUserSession(event)
  } catch {
    throw createForumApplicationError('UNAUTHENTICATED')
  }

  if (!isSessionForumUser(session.user)) {
    throw createForumApplicationError('UNAUTHENTICATED', 'Invalid user session')
  }

  const actor = await findActorById(session.user.id)

  if (!actor) {
    throw createForumApplicationError('UNAUTHENTICATED', 'User no longer exists')
  }

  return actor
}
