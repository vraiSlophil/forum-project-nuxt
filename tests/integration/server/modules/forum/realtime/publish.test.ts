import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  publishMessageModerated,
  publishTopicCreated,
  publishTopicUpdated,
} from '#server/modules/forum/realtime/publish'
import * as forumRepository from '#server/modules/forum/infrastructure/forum-repository'
import * as realtimeRegistry from '#server/modules/forum/realtime/registry'

vi.mock('#server/modules/forum/infrastructure/forum-repository', () => ({
  findMessageRealtimeRecordById: vi.fn(),
  findTopicRealtimeSummaryById: vi.fn(),
}))

vi.mock('#server/modules/forum/realtime/registry', () => ({
  broadcastToChannel: vi.fn(),
}))

describe('forum realtime publish', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('broadcasts a public-safe moderated message payload', async () => {
    vi.mocked(forumRepository.findMessageRealtimeRecordById).mockResolvedValue({
      id: 'message-1',
      topicId: 'topic-1',
      authorId: 'user-1',
      content: 'Contenu original',
      createdAt: new Date('2026-04-12T10:00:00.000Z'),
      updatedAt: new Date('2026-04-12T10:00:00.000Z'),
      editedAt: null,
      deletedAt: new Date('2026-04-12T11:00:00.000Z'),
      author: {
        id: 'user-1',
        username: 'alice',
        avatarUrl: null,
      },
      quotedMessage: null,
    })

    await publishMessageModerated('message-1')

    expect(realtimeRegistry.broadcastToChannel).toHaveBeenCalledWith(
      'topics:topic-1:messages',
      expect.objectContaining({
        channel: 'topics:topic-1:messages',
        event: expect.objectContaining({
          type: 'message.moderated',
          topicId: 'topic-1',
          message: expect.objectContaining({
            id: 'message-1',
            content: 'Ce message a été supprimé par la modération.',
            isDeleted: true,
          }),
        }),
      }),
    )
  })

  it('broadcasts a topic.created event with a ready-to-render topic summary', async () => {
    vi.mocked(forumRepository.findTopicRealtimeSummaryById).mockResolvedValue({
      id: 'topic-1',
      forumId: 'forum-1',
      title: 'Nouveau sujet',
      slug: 'nouveau-sujet',
      isLocked: false,
      createdAt: new Date('2026-04-12T10:00:00.000Z'),
      updatedAt: new Date('2026-04-12T10:00:00.000Z'),
      lastMessageAt: new Date('2026-04-12T10:00:00.000Z'),
      author: {
        id: 'user-1',
        username: 'alice',
        avatarUrl: null,
      },
      _count: {
        messages: 1,
      },
      messages: [
        {
          id: 'message-1',
          createdAt: new Date('2026-04-12T10:00:00.000Z'),
          author: {
            id: 'user-1',
            username: 'alice',
            avatarUrl: null,
          },
        },
      ],
    })

    await publishTopicCreated('topic-1')

    expect(realtimeRegistry.broadcastToChannel).toHaveBeenCalledWith(
      'forums:forum-1:topics',
      expect.objectContaining({
        channel: 'forums:forum-1:topics',
        event: expect.objectContaining({
          forumId: 'forum-1',
          topicId: 'topic-1',
          type: 'topic.created',
          topic: expect.objectContaining({
            id: 'topic-1',
            title: 'Nouveau sujet',
            messageCount: 1,
          }),
        }),
      }),
    )
  })

  it('does not broadcast when the topic cannot be loaded anymore', async () => {
    vi.mocked(forumRepository.findTopicRealtimeSummaryById).mockResolvedValue(null)

    await publishTopicCreated('missing-topic')

    expect(realtimeRegistry.broadcastToChannel).not.toHaveBeenCalled()
  })

  it('does not broadcast when the message cannot be loaded anymore', async () => {
    vi.mocked(forumRepository.findMessageRealtimeRecordById).mockResolvedValue(null)

    await publishMessageModerated('missing-message')

    expect(realtimeRegistry.broadcastToChannel).not.toHaveBeenCalled()
  })

  it('broadcasts a topic.updated event when an admin locks a topic', async () => {
    vi.mocked(forumRepository.findTopicRealtimeSummaryById).mockResolvedValue({
      id: 'topic-1',
      forumId: 'forum-1',
      title: 'Sujet verrouille',
      slug: 'sujet-verrouille',
      isLocked: true,
      createdAt: new Date('2026-04-12T10:00:00.000Z'),
      updatedAt: new Date('2026-04-12T11:00:00.000Z'),
      lastMessageAt: new Date('2026-04-12T10:30:00.000Z'),
      author: {
        id: 'user-1',
        username: 'alice',
        avatarUrl: null,
      },
      _count: {
        messages: 3,
      },
      messages: [
        {
          id: 'message-3',
          createdAt: new Date('2026-04-12T10:30:00.000Z'),
          author: {
            id: 'user-2',
            username: 'bob',
            avatarUrl: null,
          },
        },
      ],
    })

    await publishTopicUpdated('topic-1')

    expect(realtimeRegistry.broadcastToChannel).toHaveBeenCalledWith(
      'forums:forum-1:topics',
      expect.objectContaining({
        channel: 'forums:forum-1:topics',
        event: expect.objectContaining({
          forumId: 'forum-1',
          topicId: 'topic-1',
          type: 'topic.updated',
          topic: expect.objectContaining({
            id: 'topic-1',
            isLocked: true,
            messageCount: 3,
          }),
        }),
      }),
    )
  })
})
