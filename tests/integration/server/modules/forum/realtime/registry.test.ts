import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  broadcastToChannel,
  removePeer,
  resetRealtimeRegistry,
  subscribePeer,
  unsubscribePeer,
  type RealtimePeer,
} from '#server/modules/forum/realtime/registry'

function createPeer() {
  return {
    send: vi.fn(),
  } satisfies RealtimePeer
}

describe('forum realtime registry', () => {
  beforeEach(() => {
    resetRealtimeRegistry()
  })

  it('broadcasts only to peers subscribed to the target channel', () => {
    const forumPeer = createPeer()
    const topicPeer = createPeer()

    subscribePeer(forumPeer, ['forums:forum-1:topics'])
    subscribePeer(topicPeer, ['topics:topic-1:messages'])

    broadcastToChannel('forums:forum-1:topics', {
      channel: 'forums:forum-1:topics',
      event: {
        forumId: 'forum-1',
        topicId: 'topic-1',
        type: 'topic.created',
        topic: null,
      },
    })

    expect(forumPeer.send).toHaveBeenCalledTimes(1)
    expect(topicPeer.send).not.toHaveBeenCalled()
  })

  it('stops broadcasting to a peer after unsubscribe', () => {
    const peer = createPeer()

    subscribePeer(peer, ['topics:topic-1:messages'])
    unsubscribePeer(peer, ['topics:topic-1:messages'])

    broadcastToChannel('topics:topic-1:messages', {
      channel: 'topics:topic-1:messages',
      event: {
        topicId: 'topic-1',
        type: 'message.updated',
        message: {
          id: 'message-1',
          content: 'Bonjour',
          createdAt: '2026-04-12T10:00:00.000Z',
          updatedAt: '2026-04-12T10:00:00.000Z',
          editedAt: null,
          deletedAt: null,
          isDeleted: false,
          author: {
            id: 'user-1',
            username: 'alice',
            avatarUrl: null,
          },
          quotedMessage: null,
          permissions: {
            canEdit: false,
            canDeleteOwn: false,
            canModerate: false,
            canRestore: false,
          },
        },
      },
    })

    expect(peer.send).not.toHaveBeenCalled()
  })

  it('removes a peer entirely after removePeer', () => {
    const peer = createPeer()

    subscribePeer(peer, ['topics:topic-1:messages'])
    removePeer(peer)

    broadcastToChannel('topics:topic-1:messages', {
      channel: 'topics:topic-1:messages',
      event: {
        topicId: 'topic-1',
        type: 'message.deleted',
        message: {
          id: 'message-1',
          content: 'Bonjour',
          createdAt: '2026-04-12T10:00:00.000Z',
          updatedAt: '2026-04-12T10:00:00.000Z',
          editedAt: null,
          deletedAt: null,
          isDeleted: false,
          author: {
            id: 'user-1',
            username: 'alice',
            avatarUrl: null,
          },
          quotedMessage: null,
          permissions: {
            canEdit: false,
            canDeleteOwn: false,
            canModerate: false,
            canRestore: false,
          },
        },
      },
    })

    expect(peer.send).not.toHaveBeenCalled()
  })
})
