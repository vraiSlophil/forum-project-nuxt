import type { H3Event } from 'h3'
import type { ForumActor, SessionForumUser } from '#server/modules/forum/domain/actors'
import { createForumApplicationError } from '#server/modules/forum/application/shared/errors'
import {
  getAuthenticatedViewer,
  requireAuthenticatedActor,
} from '#server/modules/auth/infrastructure/current-user'

export async function getViewerSessionUser(event: H3Event): Promise<SessionForumUser | null> {
  return getAuthenticatedViewer(event)
}

export async function requireForumActor(event: H3Event): Promise<ForumActor> {
  try {
    return await requireAuthenticatedActor(event)
  } catch {
    throw createForumApplicationError('UNAUTHENTICATED')
  }
}
