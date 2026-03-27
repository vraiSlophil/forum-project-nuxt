import { buildMessageRedirect } from '#server/modules/forum/application/shared/presenters'
import { calculatePageFromPosition } from '#server/modules/forum/domain/pagination'
import { isAdminActor, type ForumActor } from '#server/modules/forum/domain/actors'
import {
  countMessagesUpToPosition,
  findMessageForUpdate,
  updateMessageContent,
} from '#server/modules/forum/infrastructure/forum-repository'
import type { MessageMutationResponse, UpdateMessageInput } from '#shared/types/forum'
import { createForumApplicationError } from '../shared/errors'

export async function updateMessage(
  actor: ForumActor,
  messageId: string,
  input: UpdateMessageInput,
): Promise<MessageMutationResponse> {
  const message = await findMessageForUpdate(messageId)

  if (!message) {
    throw createForumApplicationError('MESSAGE_NOT_FOUND')
  }

  if (message.deletedAt) {
    throw createForumApplicationError('CONFLICT', 'Deleted messages cannot be edited')
  }

  if (!isAdminActor(actor) && actor.id !== message.authorId) {
    throw createForumApplicationError('FORBIDDEN', 'You cannot edit this message')
  }

  let editedAt = message.editedAt

  if (message.content !== input.content) {
    const updatedMessage = await updateMessageContent(message.id, input.content, new Date())

    editedAt = updatedMessage.editedAt
  }

  const position = await countMessagesUpToPosition(message.topicId, message.createdAt, message.id)
  const page = calculatePageFromPosition(position)

  return {
    topic: {
      id: message.topic.id,
      slug: message.topic.slug,
      title: message.topic.title,
      forumId: message.topic.forumId,
      forumSlug: message.topic.forum.slug,
    },
    message: {
      id: message.id,
      page,
      editedAt: editedAt ? editedAt.toISOString() : null,
    },
    redirectTo: buildMessageRedirect(
      message.topic.forum.slug,
      message.topic.slug,
      page,
      message.id,
    ),
  }
}
