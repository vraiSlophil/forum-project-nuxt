import { requireAdminPrivileges } from '#server/modules/forum/application/shared/guards'
import type { ForumActor } from '#server/modules/forum/domain/actors'
import {
  deleteForumRecord,
  findForumById,
} from '#server/modules/forum/infrastructure/forum-repository'
import { createForumApplicationError } from '../../shared/errors'

export async function deleteForum(actor: ForumActor, forumId: string) {
  requireAdminPrivileges(actor)

  const forum = await findForumById(forumId)

  if (!forum) {
    throw createForumApplicationError('FORUM_NOT_FOUND')
  }

  await deleteForumRecord(forum.id)
}
