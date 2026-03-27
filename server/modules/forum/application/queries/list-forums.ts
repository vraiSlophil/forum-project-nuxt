import { presentViewer } from '#server/modules/forum/application/shared/presenters'
import type { SessionForumUser } from '#server/modules/forum/domain/actors'
import { listForumsWithTopicCount } from '#server/modules/forum/infrastructure/forum-repository'
import type { ForumsResponse } from '#shared/types/forum'

export async function listForums(viewer: SessionForumUser | null): Promise<ForumsResponse> {
  const forums = await listForumsWithTopicCount()

  return {
    viewer: presentViewer(viewer),
    forums: forums.map((forum) => ({
      id: forum.id,
      name: forum.name,
      slug: forum.slug,
      description: forum.description,
      topicCount: forum._count.topics,
      createdAt: forum.createdAt.toISOString(),
      updatedAt: forum.updatedAt.toISOString(),
    })),
  }
}
