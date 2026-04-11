import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { deleteMessage } from '#server/modules/forum/application/commands/delete-message'
import * as forumRepository from '#server/modules/forum/infrastructure/forum-repository'

vi.mock('#server/modules/forum/infrastructure/forum-repository', () => ({
  countMessagesUpToPosition: vi.fn(),
  deleteMessageRecord: vi.fn(),
  findMessageForDelete: vi.fn(),
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

describe('deleteMessage', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-04-11T10:00:00.000Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('hard deletes an author message and redirects to the remaining page', async () => {
    vi.mocked(forumRepository.findMessageForDelete).mockResolvedValue({
      id: 'message-21',
      topicId: 'topic-1',
      authorId: 'user-1',
      createdAt: new Date('2026-03-01T09:00:00.000Z'),
      deletedAt: null,
      topic: {
        id: 'topic-1',
        forumId: 'forum-1',
        title: 'Bienvenue',
        slug: 'bienvenue',
        createdAt: new Date('2026-03-01T08:00:00.000Z'),
        forum: {
          slug: 'general',
        },
      },
    })
    vi.mocked(forumRepository.countMessagesUpToPosition).mockResolvedValue(21)
    vi.mocked(forumRepository.deleteMessageRecord).mockResolvedValue({
      totalMessages: 20,
    })

    const result = await deleteMessage(authorActor, 'message-21')

    expect(forumRepository.deleteMessageRecord).toHaveBeenCalledWith({
      messageId: 'message-21',
      topicId: 'topic-1',
    })
    expect(result).toEqual({
      topic: {
        id: 'topic-1',
        slug: 'bienvenue',
        title: 'Bienvenue',
        forumId: 'forum-1',
        forumSlug: 'general',
      },
      redirectTo: '/forums/general/topics/bienvenue',
    })
  })

  it('rejects deletion from another regular user', async () => {
    vi.mocked(forumRepository.findMessageForDelete).mockResolvedValue({
      id: 'message-1',
      topicId: 'topic-1',
      authorId: 'user-1',
      createdAt: new Date('2026-03-01T09:00:00.000Z'),
      deletedAt: null,
      topic: {
        id: 'topic-1',
        forumId: 'forum-1',
        title: 'Bienvenue',
        slug: 'bienvenue',
        createdAt: new Date('2026-03-01T08:00:00.000Z'),
        forum: {
          slug: 'general',
        },
      },
    })

    await expect(deleteMessage(otherUserActor, 'message-1')).rejects.toMatchObject({
      code: 'FORBIDDEN',
      message: 'You cannot delete this message',
    })

    expect(forumRepository.deleteMessageRecord).not.toHaveBeenCalled()
  })

  it('rejects deletion of an already moderated message', async () => {
    vi.mocked(forumRepository.findMessageForDelete).mockResolvedValue({
      id: 'message-1',
      topicId: 'topic-1',
      authorId: 'user-1',
      createdAt: new Date('2026-03-01T09:00:00.000Z'),
      deletedAt: new Date('2026-03-02T10:00:00.000Z'),
      topic: {
        id: 'topic-1',
        forumId: 'forum-1',
        title: 'Bienvenue',
        slug: 'bienvenue',
        createdAt: new Date('2026-03-01T08:00:00.000Z'),
        forum: {
          slug: 'general',
        },
      },
    })

    await expect(deleteMessage(authorActor, 'message-1')).rejects.toMatchObject({
      code: 'CONFLICT',
      message: 'Deleted messages cannot be removed again',
    })
  })
})
