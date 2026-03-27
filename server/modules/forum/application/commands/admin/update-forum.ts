import { requireAdminPrivileges } from '#server/modules/forum/application/shared/guards'
import { presentForumAdminSummary } from '#server/modules/forum/application/shared/presenters'
import type { ForumActor } from '#server/modules/forum/domain/actors'
import {
  findForumById,
  findForumByName,
  isUniqueConstraintError,
  updateForumRecord,
} from '#server/modules/forum/infrastructure/forum-repository'
import type { ForumAdminResponse, UpdateForumInput } from '#shared/types/forum'
import { createForumApplicationError } from '../../shared/errors'

export async function updateForum(
  actor: ForumActor,
  forumId: string,
  input: UpdateForumInput,
): Promise<ForumAdminResponse> {
  requireAdminPrivileges(actor)

  const forum = await findForumById(forumId)

  if (!forum) {
    throw createForumApplicationError('FORUM_NOT_FOUND')
  }

  if (forum.name !== input.name) {
    const conflictingForum = await findForumByName(input.name)

    if (conflictingForum && conflictingForum.id !== forum.id) {
      throw createForumApplicationError('CONFLICT', 'A forum with this name already exists')
    }
  }

  if (forum.name === input.name && forum.description === input.description) {
    return {
      forum: presentForumAdminSummary(forum),
    }
  }

  try {
    const updatedForum = await updateForumRecord({
      forumId: forum.id,
      name: input.name,
      description: input.description,
    })

    return {
      forum: presentForumAdminSummary(updatedForum),
    }
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      throw createForumApplicationError('CONFLICT', 'A forum with this name already exists')
    }

    throw error
  }
}
