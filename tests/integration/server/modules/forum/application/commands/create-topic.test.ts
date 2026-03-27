import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createTopic } from '#server/modules/forum/application/commands/create-topic'
import * as forumRepository from '#server/modules/forum/infrastructure/forum-repository'

vi.mock('#server/modules/forum/infrastructure/forum-repository', () => ({
  createTopicWithFirstMessage: vi.fn(),
  findForumBySlug: vi.fn(),
  isUniqueConstraintError: vi.fn(),
}))

const actor = {
  id: 'user-1',
  username: 'alice',
  role: 'USER',
} as const

const frozenNow = new Date('2026-03-11T09:30:00.000Z')

describe('createTopic', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(frozenNow)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('creates a topic and returns its redirect target', async () => {
    vi.mocked(forumRepository.findForumBySlug).mockResolvedValue({
      id: 'forum-1',
      name: 'Général',
      slug: 'general',
      description: 'Discussions générales',
      createdAt: new Date('2026-03-01T00:00:00.000Z'),
      updatedAt: new Date('2026-03-01T00:00:00.000Z'),
    })
    vi.mocked(forumRepository.createTopicWithFirstMessage).mockResolvedValue({
      topic: {
        id: 'topic-1',
        title: 'Bienvenue',
        slug: 'bienvenue',
      },
      message: {
        id: 'message-1',
      },
    })

    const result = await createTopic(actor, 'general', {
      title: 'Bienvenue',
      content: 'Premier message',
    })

    expect(forumRepository.createTopicWithFirstMessage).toHaveBeenCalledWith({
      forumId: 'forum-1',
      authorId: 'user-1',
      title: 'Bienvenue',
      content: 'Premier message',
      createdAt: frozenNow,
    })
    expect(result).toEqual({
      topic: {
        id: 'topic-1',
        slug: 'bienvenue',
        title: 'Bienvenue',
        forumId: 'forum-1',
        forumSlug: 'general',
      },
      message: {
        id: 'message-1',
        page: 1,
      },
      redirectTo: '/forums/general/topics/bienvenue#message-message-1',
    })
  })

  it('rejects an unknown forum slug', async () => {
    vi.mocked(forumRepository.findForumBySlug).mockResolvedValue(null)

    await expect(
      createTopic(actor, 'missing-forum', {
        title: 'Sujet',
        content: 'Contenu',
      }),
    ).rejects.toMatchObject({
      code: 'FORUM_NOT_FOUND',
    })

    expect(forumRepository.createTopicWithFirstMessage).not.toHaveBeenCalled()
  })

  it('maps slug collisions to a conflict error', async () => {
    const duplicateError = new Error('duplicate slug')

    vi.mocked(forumRepository.findForumBySlug).mockResolvedValue({
      id: 'forum-1',
      name: 'Général',
      slug: 'general',
      description: null,
      createdAt: new Date('2026-03-01T00:00:00.000Z'),
      updatedAt: new Date('2026-03-01T00:00:00.000Z'),
    })
    vi.mocked(forumRepository.createTopicWithFirstMessage).mockRejectedValue(duplicateError)
    vi.mocked(forumRepository.isUniqueConstraintError).mockReturnValue(true)

    await expect(
      createTopic(actor, 'general', {
        title: 'Bienvenue',
        content: 'Premier message',
      }),
    ).rejects.toMatchObject({
      code: 'CONFLICT',
      message: 'A topic with the same URL already exists in this forum',
    })
  })
})
