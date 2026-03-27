import { requireAdminPrivileges } from '#server/modules/forum/application/shared/guards'
import { presentForumAdminSummary } from '#server/modules/forum/application/shared/presenters'
import type { ForumActor } from '#server/modules/forum/domain/actors'
import {
  createForumRecord,
  findForumByName,
  isUniqueConstraintError,
} from '#server/modules/forum/infrastructure/forum-repository'
import type { CreateForumInput, ForumAdminResponse } from '#shared/types/forum'
import { createForumApplicationError } from '../../shared/errors'

export async function createForum(
  actor: ForumActor,
  input: CreateForumInput,
): Promise<ForumAdminResponse> {
  requireAdminPrivileges(actor)

  const existingForum = await findForumByName(input.name)

  if (existingForum) {
    throw createForumApplicationError('CONFLICT', 'A forum with this name already exists')
  }

  try {
    const forum = await createForumRecord(input)

    return {
      forum: presentForumAdminSummary(forum),
    }
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      throw createForumApplicationError('CONFLICT', 'A forum with this name already exists')
    }

    throw error
  }
}
