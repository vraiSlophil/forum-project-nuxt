import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createReply } from '#server/modules/forum/application/commands/create-reply'
import * as forumRepository from '#server/modules/forum/infrastructure/forum-repository'

vi.mock('#server/modules/forum/infrastructure/forum-repository', () => ({
  createReplyAndUpdateTopic: vi.fn(),
  findForumBySlug: vi.fn(),
  findQuotedMessageInTopic: vi.fn(),
  findTopicForReply: vi.fn(),
}))

const actor = {
  id: 'user-1',
  username: 'alice',
  role: 'USER',
} as const

const frozenNow = new Date('2026-03-12T12:45:00.000Z')

describe('createReply', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(frozenNow)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('creates a reply with a quoted message and returns its redirect target', async () => {
    vi.mocked(forumRepository.findForumBySlug).mockResolvedValue({
      id: 'forum-1',
      name: 'General',
      slug: 'general',
      description: 'Discussions generales',
      createdAt: new Date('2026-03-01T00:00:00.000Z'),
      updatedAt: new Date('2026-03-01T00:00:00.000Z'),
    })
    vi.mocked(forumRepository.findTopicForReply).mockResolvedValue({
      id: 'topic-1',
      title: 'Bienvenue',
      slug: 'bienvenue',
      isLocked: false,
    })
    vi.mocked(forumRepository.findQuotedMessageInTopic).mockResolvedValue({
      id: 'message-1',
    })
    vi.mocked(forumRepository.createReplyAndUpdateTopic).mockResolvedValue({
      messageId: 'message-2',
      totalMessages: 2,
    })

    const result = await createReply(actor, 'general', 'bienvenue', {
      content: 'Je reponds avec citation',
      quotedMessageId: 'message-1',
    })

    expect(forumRepository.findQuotedMessageInTopic).toHaveBeenCalledWith('topic-1', 'message-1')
    expect(forumRepository.createReplyAndUpdateTopic).toHaveBeenCalledWith({
      topicId: 'topic-1',
      authorId: 'user-1',
      content: 'Je reponds avec citation',
      createdAt: frozenNow,
      quotedMessageId: 'message-1',
    })
    expect(result.redirectTo).toBe('/forums/general/topics/bienvenue#message-message-2')
  })

  it('stores null when no quoted message is provided', async () => {
    vi.mocked(forumRepository.findForumBySlug).mockResolvedValue({
      id: 'forum-1',
      name: 'General',
      slug: 'general',
      description: 'Discussions generales',
      createdAt: new Date('2026-03-01T00:00:00.000Z'),
      updatedAt: new Date('2026-03-01T00:00:00.000Z'),
    })
    vi.mocked(forumRepository.findTopicForReply).mockResolvedValue({
      id: 'topic-1',
      title: 'Bienvenue',
      slug: 'bienvenue',
      isLocked: false,
    })
    vi.mocked(forumRepository.createReplyAndUpdateTopic).mockResolvedValue({
      messageId: 'message-2',
      totalMessages: 2,
    })

    await createReply(actor, 'general', 'bienvenue', {
      content: 'Reponse simple',
    })

    expect(forumRepository.findQuotedMessageInTopic).not.toHaveBeenCalled()
    expect(forumRepository.createReplyAndUpdateTopic).toHaveBeenCalledWith({
      topicId: 'topic-1',
      authorId: 'user-1',
      content: 'Reponse simple',
      createdAt: frozenNow,
      quotedMessageId: null,
    })
  })

  it('rejects a quoted message outside the topic', async () => {
    vi.mocked(forumRepository.findForumBySlug).mockResolvedValue({
      id: 'forum-1',
      name: 'General',
      slug: 'general',
      description: 'Discussions generales',
      createdAt: new Date('2026-03-01T00:00:00.000Z'),
      updatedAt: new Date('2026-03-01T00:00:00.000Z'),
    })
    vi.mocked(forumRepository.findTopicForReply).mockResolvedValue({
      id: 'topic-1',
      title: 'Bienvenue',
      slug: 'bienvenue',
      isLocked: false,
    })
    vi.mocked(forumRepository.findQuotedMessageInTopic).mockResolvedValue(null)

    await expect(
      createReply(actor, 'general', 'bienvenue', {
        content: 'Reponse invalide',
        quotedMessageId: 'missing-message',
      }),
    ).rejects.toMatchObject({
      code: 'MESSAGE_NOT_FOUND',
    })

    expect(forumRepository.createReplyAndUpdateTopic).not.toHaveBeenCalled()
  })
})
