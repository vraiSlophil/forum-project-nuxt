import { buildMessageRedirect } from '#server/modules/forum/application/shared/presenters'
import { calculatePageFromPosition } from '#server/modules/forum/domain/pagination'
import type { ForumActor } from '#server/modules/forum/domain/actors'
import {
  createReplyAndUpdateTopic,
  findForumBySlug,
  findTopicForReply,
} from '#server/modules/forum/infrastructure/forum-repository'
import type { CreateMessageInput, TopicMutationResponse } from '#shared/types/forum'
import { createForumApplicationError } from '../shared/errors'

export async function createReply(
  actor: ForumActor,
  forumSlug: string,
  topicSlug: string,
  input: CreateMessageInput,
): Promise<TopicMutationResponse> {
  const forum = await findForumBySlug(forumSlug)

  if (!forum) {
    throw createForumApplicationError('FORUM_NOT_FOUND')
  }

  const topic = await findTopicForReply(forum.id, topicSlug)

  if (!topic) {
    throw createForumApplicationError('TOPIC_NOT_FOUND')
  }

  if (topic.isLocked) {
    throw createForumApplicationError('TOPIC_LOCKED')
  }

  const result = await createReplyAndUpdateTopic({
    topicId: topic.id,
    authorId: actor.id,
    content: input.content,
    createdAt: new Date(),
  })
  const page = calculatePageFromPosition(result.totalMessages)

  return {
    topic: {
      id: topic.id,
      slug: topic.slug,
      title: topic.title,
      forumId: forum.id,
      forumSlug: forum.slug,
    },
    message: {
      id: result.messageId,
      page,
    },
    redirectTo: buildMessageRedirect(forum.slug, topic.slug, page, result.messageId),
  }
}
