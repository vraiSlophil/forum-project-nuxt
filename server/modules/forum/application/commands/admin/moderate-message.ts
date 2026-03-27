import { requireAdminPrivileges } from '#server/modules/forum/application/shared/guards'
import type { ForumActor } from '#server/modules/forum/domain/actors'
import {
  findMessageForModeration,
  markMessageDeleted,
} from '#server/modules/forum/infrastructure/forum-repository'
import { createForumApplicationError } from '../../shared/errors'

export async function moderateMessage(actor: ForumActor, messageId: string) {
  requireAdminPrivileges(actor)

  const message = await findMessageForModeration(messageId)

  if (!message) {
    throw createForumApplicationError('MESSAGE_NOT_FOUND')
  }

  if (message.deletedAt) {
    return
  }

  await markMessageDeleted({
    messageId: message.id,
    actorId: actor.id,
    deletedAt: new Date(),
  })
}
