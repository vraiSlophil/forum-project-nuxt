import { buildTopicRedirect } from '#server/modules/forum/application/shared/presenters'
import { calculatePageFromPosition } from '#server/modules/forum/domain/pagination'
import type { ForumActor } from '#server/modules/forum/domain/actors'
import {
  countMessagesUpToPosition,
  deleteMessageRecord,
  findMessageForDelete,
} from '#server/modules/forum/infrastructure/forum-repository'
import type { MessageDeletionResponse } from '#shared/types/forum'
import { createForumApplicationError } from '../shared/errors'

export async function deleteMessage(
  actor: ForumActor,
  messageId: string,
): Promise<MessageDeletionResponse> {
  const message = await findMessageForDelete(messageId)

  if (!message) {
    throw createForumApplicationError('MESSAGE_NOT_FOUND')
  }

  if (message.deletedAt) {
    throw createForumApplicationError('CONFLICT', 'Deleted messages cannot be removed again')
  }

  if (actor.id !== message.authorId) {
    throw createForumApplicationError('FORBIDDEN', 'You cannot delete this message')
  }

  const messagePosition = await countMessagesUpToPosition(
    message.topicId,
    message.createdAt,
    message.id,
  )

  if (messagePosition === 1) {
    throw createForumApplicationError('CONFLICT', 'The initial topic message cannot be deleted')
  }

  const result = await deleteMessageRecord({
    messageId: message.id,
    topicId: message.topicId,
  })
  const targetPosition = Math.min(messagePosition, Math.max(1, result.totalMessages))
  const page = result.totalMessages > 0 ? calculatePageFromPosition(targetPosition) : 1

  return {
    topic: {
      id: message.topic.id,
      slug: message.topic.slug,
      title: message.topic.title,
      forumId: message.topic.forumId,
      forumSlug: message.topic.forum.slug,
    },
    redirectTo: buildTopicRedirect(message.topic.forum.slug, message.topic.slug, page),
  }
}
