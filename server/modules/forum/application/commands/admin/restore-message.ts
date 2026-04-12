import { requireAdminPrivileges } from '#server/modules/forum/application/shared/guards'
import type { ForumActor } from '#server/modules/forum/domain/actors'
import {
  findMessageForModeration,
  restoreMessageRecord,
} from '#server/modules/forum/infrastructure/forum-repository'
import { createForumApplicationError } from '../../shared/errors'

export async function restoreMessage(actor: ForumActor, messageId: string) {
  requireAdminPrivileges(actor)

  const message = await findMessageForModeration(messageId)

  if (!message) {
    throw createForumApplicationError('MESSAGE_NOT_FOUND')
  }

  if (!message.deletedAt) {
    throw createForumApplicationError('CONFLICT', 'Only moderated messages can be restored')
  }

  await restoreMessageRecord(message.id)
}
