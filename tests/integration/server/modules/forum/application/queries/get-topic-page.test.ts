import { describe, expect, it, vi } from 'vitest'
import { getTopicPage } from '#server/modules/forum/application/queries/get-topic-page'
import * as forumRepository from '#server/modules/forum/infrastructure/forum-repository'

vi.mock('#server/modules/forum/infrastructure/forum-repository', () => ({
  findForumBySlug: vi.fn(),
  findTopicForRead: vi.fn(),
  listMessagesInTopicPage: vi.fn(),
}))

describe('getTopicPage', () => {
  it('returns a paginated topic view and hides deleted content from regular users', async () => {
    vi.mocked(forumRepository.findForumBySlug).mockResolvedValue({
      id: 'forum-1',
      name: 'Général',
      slug: 'general',
      description: 'Discussions générales',
      createdAt: new Date('2026-03-01T00:00:00.000Z'),
      updatedAt: new Date('2026-03-01T00:00:00.000Z'),
    })
    vi.mocked(forumRepository.findTopicForRead).mockResolvedValue({
      id: 'topic-1',
      title: 'Bienvenue',
      slug: 'bienvenue',
      isLocked: false,
      createdAt: new Date('2026-03-01T10:00:00.000Z'),
      updatedAt: new Date('2026-03-02T10:00:00.000Z'),
      lastMessageAt: new Date('2026-03-03T10:00:00.000Z'),
      author: {
        id: 'user-1',
        username: 'alice',
        avatarUrl: null,
      },
      _count: {
        messages: 2,
      },
    })
    vi.mocked(forumRepository.listMessagesInTopicPage).mockResolvedValue([
      {
        id: 'message-1',
        authorId: 'user-1',
        content: 'Message visible',
        createdAt: new Date('2026-03-01T10:00:00.000Z'),
        updatedAt: new Date('2026-03-01T10:00:00.000Z'),
        editedAt: null,
        deletedAt: null,
        author: {
          id: 'user-1',
          username: 'alice',
          avatarUrl: null,
        },
        quotedMessage: null,
      },
      {
        id: 'message-2',
        authorId: 'user-2',
        content: 'Message supprimé',
        createdAt: new Date('2026-03-02T10:00:00.000Z'),
        updatedAt: new Date('2026-03-02T10:00:00.000Z'),
        editedAt: null,
        deletedAt: new Date('2026-03-03T10:00:00.000Z'),
        author: {
          id: 'user-2',
          username: 'bob',
          avatarUrl: null,
        },
        quotedMessage: null,
      },
    ])

    const result = await getTopicPage('general', 'bienvenue', 1, {
      id: 'user-1',
      username: 'alice',
      role: 'USER',
    })

    expect(result.viewer).toEqual({
      isAuthenticated: true,
      userId: 'user-1',
      username: 'alice',
      role: 'USER',
      isAdmin: false,
    })
    expect(result.topic.permissions).toEqual({
      canReply: true,
      canModerate: false,
      canDelete: false,
    })
    expect(result.messages).toHaveLength(2)
    expect(result.messages[0].permissions).toEqual({
      canEdit: true,
      canDeleteOwn: true,
      canModerate: false,
      canRestore: false,
    })
    expect(result.messages[1].content).toBe('Ce message a ete supprime par la moderation.')
    expect(result.messages[1].permissions).toEqual({
      canEdit: false,
      canDeleteOwn: false,
      canModerate: false,
      canRestore: false,
    })
    expect(result.pagination).toEqual({
      page: 1,
      pageSize: 20,
      totalItems: 2,
      totalPages: 1,
      hasPreviousPage: false,
      hasNextPage: false,
    })
  })

  it('rejects an unknown topic slug inside an existing forum', async () => {
    vi.mocked(forumRepository.findForumBySlug).mockResolvedValue({
      id: 'forum-1',
      name: 'Général',
      slug: 'general',
      description: null,
      createdAt: new Date('2026-03-01T00:00:00.000Z'),
      updatedAt: new Date('2026-03-01T00:00:00.000Z'),
    })
    vi.mocked(forumRepository.findTopicForRead).mockResolvedValue(null)

    await expect(getTopicPage('general', 'inconnu', 1, null)).rejects.toMatchObject({
      code: 'TOPIC_NOT_FOUND',
    })

    expect(forumRepository.listMessagesInTopicPage).not.toHaveBeenCalled()
  })

  it('shows moderated message content and restore permission to an admin', async () => {
    vi.mocked(forumRepository.findForumBySlug).mockResolvedValue({
      id: 'forum-1',
      name: 'General',
      slug: 'general',
      description: 'Discussions generales',
      createdAt: new Date('2026-03-01T00:00:00.000Z'),
      updatedAt: new Date('2026-03-01T00:00:00.000Z'),
    })
    vi.mocked(forumRepository.findTopicForRead).mockResolvedValue({
      id: 'topic-1',
      title: 'Bienvenue',
      slug: 'bienvenue',
      isLocked: false,
      createdAt: new Date('2026-03-01T10:00:00.000Z'),
      updatedAt: new Date('2026-03-02T10:00:00.000Z'),
      lastMessageAt: new Date('2026-03-03T10:00:00.000Z'),
      author: {
        id: 'user-1',
        username: 'alice',
        avatarUrl: null,
      },
      _count: {
        messages: 1,
      },
    })
    vi.mocked(forumRepository.listMessagesInTopicPage).mockResolvedValue([
      {
        id: 'message-2',
        authorId: 'user-2',
        content: 'Contenu original modere',
        createdAt: new Date('2026-03-02T10:00:00.000Z'),
        updatedAt: new Date('2026-03-02T10:00:00.000Z'),
        editedAt: null,
        deletedAt: new Date('2026-03-03T10:00:00.000Z'),
        author: {
          id: 'user-2',
          username: 'bob',
          avatarUrl: null,
        },
        quotedMessage: null,
      },
    ])

    const result = await getTopicPage('general', 'bienvenue', 1, {
      id: 'admin-1',
      username: 'admin',
      role: 'ADMIN',
    })

    expect(result.messages[0].content).toBe('Contenu original modere')
    expect(result.messages[0].permissions).toEqual({
      canEdit: false,
      canDeleteOwn: false,
      canModerate: true,
      canRestore: true,
    })
  })
})
