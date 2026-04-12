import { requireAdminPrivileges } from '#server/modules/forum/application/shared/guards'
import type { ForumActor } from '#server/modules/forum/domain/actors'
import {
  deleteTopicRecord,
  findTopicById,
} from '#server/modules/forum/infrastructure/forum-repository'
import { createForumApplicationError } from '../../shared/errors'

export async function deleteTopic(actor: ForumActor, topicId: string) {
  requireAdminPrivileges(actor)

  const topic = await findTopicById(topicId)

  if (!topic) {
    throw createForumApplicationError('TOPIC_NOT_FOUND')
  }

  await deleteTopicRecord(topic.id)

  return {
    forumId: topic.forumId,
    topicId: topic.id,
  }
}
