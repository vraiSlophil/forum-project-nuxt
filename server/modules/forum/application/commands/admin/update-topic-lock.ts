import { requireAdminPrivileges } from '#server/modules/forum/application/shared/guards'
import type { ForumActor } from '#server/modules/forum/domain/actors'
import {
  findTopicById,
  updateTopicLockState,
} from '#server/modules/forum/infrastructure/forum-repository'
import type { TopicAdminResponse, UpdateTopicLockInput } from '#shared/types/forum'
import { createForumApplicationError } from '../../shared/errors'

export async function updateTopicLock(
  actor: ForumActor,
  topicId: string,
  input: UpdateTopicLockInput,
): Promise<TopicAdminResponse> {
  requireAdminPrivileges(actor)

  const topic = await findTopicById(topicId)

  if (!topic) {
    throw createForumApplicationError('TOPIC_NOT_FOUND')
  }

  if (topic.isLocked === input.isLocked) {
    return {
      topic: {
        id: topic.id,
        isLocked: topic.isLocked,
      },
    }
  }

  const updatedTopic = await updateTopicLockState(topic.id, input.isLocked)

  return {
    topic: {
      id: updatedTopic.id,
      isLocked: updatedTopic.isLocked,
    },
  }
}
