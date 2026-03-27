import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { updateMessage } from '#server/modules/forum/application/commands/update-message'
import * as forumRepository from '#server/modules/forum/infrastructure/forum-repository'

vi.mock('#server/modules/forum/infrastructure/forum-repository', () => ({
  countMessagesUpToPosition: vi.fn(),
  findMessageForUpdate: vi.fn(),
  updateMessageContent: vi.fn(),
}))

const authorActor = {
  id: 'user-1',
  username: 'alice',
  role: 'USER',
} as const

const otherUserActor = {
  id: 'user-2',
  username: 'bob',
  role: 'USER',
} as const

const frozenNow = new Date('2026-03-12T12:45:00.000Z')

describe('updateMessage', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(frozenNow)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('updates an author message and computes the redirect page', async () => {
    vi.mocked(forumRepository.findMessageForUpdate).mockResolvedValue({
      id: 'message-21',
      topicId: 'topic-1',
      authorId: 'user-1',
      content: 'Ancien contenu',
      createdAt: new Date('2026-03-01T09:00:00.000Z'),
      editedAt: null,
      deletedAt: null,
      topic: {
        id: 'topic-1',
        forumId: 'forum-1',
        title: 'Bienvenue',
        slug: 'bienvenue',
        forum: {
          slug: 'general',
        },
      },
    })
    vi.mocked(forumRepository.updateMessageContent).mockResolvedValue({
      editedAt: frozenNow,
    })
    vi.mocked(forumRepository.countMessagesUpToPosition).mockResolvedValue(21)

    const result = await updateMessage(authorActor, 'message-21', {
      content: 'Nouveau contenu',
    })

    expect(forumRepository.updateMessageContent).toHaveBeenCalledWith(
      'message-21',
      'Nouveau contenu',
      frozenNow,
    )
    expect(result).toEqual({
      topic: {
        id: 'topic-1',
        slug: 'bienvenue',
        title: 'Bienvenue',
        forumId: 'forum-1',
        forumSlug: 'general',
      },
      message: {
        id: 'message-21',
        page: 2,
        editedAt: '2026-03-12T12:45:00.000Z',
      },
      redirectTo: '/forums/general/topics/bienvenue?page=2#message-message-21',
    })
  })

  it('rejects edits on deleted messages', async () => {
    vi.mocked(forumRepository.findMessageForUpdate).mockResolvedValue({
      id: 'message-1',
      topicId: 'topic-1',
      authorId: 'user-1',
      content: 'Contenu',
      createdAt: new Date('2026-03-01T09:00:00.000Z'),
      editedAt: null,
      deletedAt: new Date('2026-03-02T10:00:00.000Z'),
      topic: {
        id: 'topic-1',
        forumId: 'forum-1',
        title: 'Bienvenue',
        slug: 'bienvenue',
        forum: {
          slug: 'general',
        },
      },
    })

    await expect(
      updateMessage(authorActor, 'message-1', {
        content: 'Nouveau contenu',
      }),
    ).rejects.toMatchObject({
      code: 'CONFLICT',
      message: 'Deleted messages cannot be edited',
    })

    expect(forumRepository.updateMessageContent).not.toHaveBeenCalled()
  })

  it('rejects edits from another non-admin user', async () => {
    vi.mocked(forumRepository.findMessageForUpdate).mockResolvedValue({
      id: 'message-1',
      topicId: 'topic-1',
      authorId: 'user-1',
      content: 'Contenu',
      createdAt: new Date('2026-03-01T09:00:00.000Z'),
      editedAt: null,
      deletedAt: null,
      topic: {
        id: 'topic-1',
        forumId: 'forum-1',
        title: 'Bienvenue',
        slug: 'bienvenue',
        forum: {
          slug: 'general',
        },
      },
    })

    await expect(
      updateMessage(otherUserActor, 'message-1', {
        content: 'Tentative interdite',
      }),
    ).rejects.toMatchObject({
      code: 'FORBIDDEN',
      message: 'You cannot edit this message',
    })

    expect(forumRepository.updateMessageContent).not.toHaveBeenCalled()
  })
})
