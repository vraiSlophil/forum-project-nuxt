import { buildMessageRedirect } from '#server/modules/forum/application/shared/presenters'
import type { ForumActor } from '#server/modules/forum/domain/actors'
import {
  createTopicWithFirstMessage,
  findForumBySlug,
  isUniqueConstraintError,
} from '#server/modules/forum/infrastructure/forum-repository'
import type { CreateTopicInput, TopicMutationResponse } from '#shared/types/forum'
import { createForumApplicationError } from '../shared/errors'

export async function createTopic(
  actor: ForumActor,
  forumSlug: string,
  input: CreateTopicInput,
): Promise<TopicMutationResponse> {
  const forum = await findForumBySlug(forumSlug)

  if (!forum) {
    throw createForumApplicationError('FORUM_NOT_FOUND')
  }

  try {
    const result = await createTopicWithFirstMessage({
      forumId: forum.id,
      authorId: actor.id,
      title: input.title,
      content: input.content,
      createdAt: new Date(),
    })

    return {
      topic: {
        id: result.topic.id,
        slug: result.topic.slug,
        title: result.topic.title,
        forumId: forum.id,
        forumSlug: forum.slug,
      },
      message: {
        id: result.message.id,
        page: 1,
      },
      redirectTo: buildMessageRedirect(forum.slug, result.topic.slug, 1, result.message.id),
    }
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      throw createForumApplicationError(
        'CONFLICT',
        'A topic with the same URL already exists in this forum',
      )
    }

    throw error
  }
}
