import { requirePageInRange } from '#server/modules/forum/application/shared/guards'
import {
  presentUserSummary,
  presentViewer,
} from '#server/modules/forum/application/shared/presenters'
import type { SessionForumUser } from '#server/modules/forum/domain/actors'
import {
  countTopicsInForum,
  findForumBySlug,
  listTopicsInForumPage,
} from '#server/modules/forum/infrastructure/forum-repository'
import type { ForumPageResponse } from '#shared/types/forum'
import { createForumApplicationError } from '../shared/errors'

export async function getForumPage(
  forumSlug: string,
  page: number,
  viewer: SessionForumUser | null,
): Promise<ForumPageResponse> {
  const forum = await findForumBySlug(forumSlug)

  if (!forum) {
    throw createForumApplicationError('FORUM_NOT_FOUND')
  }

  const totalTopics = await countTopicsInForum(forum.id)
  const pagination = requirePageInRange(page, totalTopics)
  const topics = await listTopicsInForumPage(forum.id, page)

  return {
    viewer: presentViewer(viewer),
    forum: {
      id: forum.id,
      name: forum.name,
      slug: forum.slug,
      description: forum.description,
      createdAt: forum.createdAt.toISOString(),
      updatedAt: forum.updatedAt.toISOString(),
      permissions: {
        canCreateTopic: viewer !== null,
      },
    },
    topics: topics.map((topic) => ({
      id: topic.id,
      title: topic.title,
      slug: topic.slug,
      isLocked: topic.isLocked,
      createdAt: topic.createdAt.toISOString(),
      updatedAt: topic.updatedAt.toISOString(),
      lastMessageAt: topic.lastMessageAt.toISOString(),
      author: presentUserSummary(topic.author),
      lastMessage: topic.messages[0]
        ? {
            createdAt: topic.messages[0].createdAt.toISOString(),
            author: presentUserSummary(topic.messages[0].author),
          }
        : null,
      messageCount: topic._count.messages,
    })),
    pagination,
  }
}
