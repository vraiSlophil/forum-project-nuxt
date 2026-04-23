import { requirePageInRange } from '#server/modules/forum/application/shared/guards'
import {
  presentTopicMessage,
  presentUserSummary,
  presentViewer,
} from '#server/modules/forum/application/shared/presenters'
import { canModerate, type SessionForumUser } from '#server/modules/forum/domain/actors'
import {
  findForumBySlug,
  findTopicForRead,
  listMessagesInTopicPage,
} from '#server/modules/forum/infrastructure/forum-repository'
import type { TopicPageResponse } from '#shared/types/forum'
import { createForumApplicationError } from '../shared/errors'

export async function getTopicPage(
  forumSlug: string,
  topicSlug: string,
  page: number,
  viewer: SessionForumUser | null,
): Promise<TopicPageResponse> {
  const forum = await findForumBySlug(forumSlug)

  if (!forum) {
    throw createForumApplicationError('FORUM_NOT_FOUND')
  }

  const topic = await findTopicForRead(forum.id, topicSlug)

  if (!topic) {
    throw createForumApplicationError('TOPIC_NOT_FOUND')
  }

  const pagination = requirePageInRange(page, topic._count.messages)
  const messages = await listMessagesInTopicPage(topic.id, page)
  const viewerCanModerate = canModerate(viewer)

  return {
    viewer: presentViewer(viewer),
    forum: {
      id: forum.id,
      name: forum.name,
      slug: forum.slug,
      description: forum.description,
    },
    topic: {
      id: topic.id,
      title: topic.title,
      slug: topic.slug,
      isLocked: topic.isLocked,
      createdAt: topic.createdAt.toISOString(),
      updatedAt: topic.updatedAt.toISOString(),
      lastMessageAt: topic.lastMessageAt.toISOString(),
      author: presentUserSummary(topic.author),
      messageCount: topic._count.messages,
      permissions: {
        canReply: viewer !== null && !topic.isLocked,
        canModerate: viewerCanModerate,
        canDelete: viewerCanModerate,
      },
    },
    messages: messages.map((message, index) =>
      presentTopicMessage(message, viewer, {
        canDeleteOwn: page === 1 && index === 0 ? false : undefined,
      }),
    ),
    pagination,
  }
}
