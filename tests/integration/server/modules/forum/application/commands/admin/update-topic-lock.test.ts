import { describe, expect, it, vi } from 'vitest'
import { updateTopicLock } from '#server/modules/forum/application/commands/admin/update-topic-lock'
import * as forumRepository from '#server/modules/forum/infrastructure/forum-repository'

vi.mock('#server/modules/forum/infrastructure/forum-repository', () => ({
  findTopicById: vi.fn(),
  updateTopicLockState: vi.fn(),
}))

const adminActor = {
  id: 'admin-1',
  username: 'admin',
  role: 'ADMIN',
} as const

const userActor = {
  id: 'user-1',
  username: 'alice',
  role: 'USER',
} as const

describe('updateTopicLock', () => {
  it('locks a topic for an admin actor', async () => {
    vi.mocked(forumRepository.findTopicById).mockResolvedValue({
      id: 'topic-1',
      forumId: 'forum-1',
      isLocked: false,
    })
    vi.mocked(forumRepository.updateTopicLockState).mockResolvedValue({
      id: 'topic-1',
      forumId: 'forum-1',
      isLocked: true,
    })

    const result = await updateTopicLock(adminActor, 'topic-1', {
      isLocked: true,
    })

    expect(forumRepository.updateTopicLockState).toHaveBeenCalledWith('topic-1', true)
    expect(result).toEqual({
      topic: {
        id: 'topic-1',
        isLocked: true,
      },
    })
  })

  it('returns the current state when the topic is already in the requested lock state', async () => {
    vi.mocked(forumRepository.findTopicById).mockResolvedValue({
      id: 'topic-1',
      forumId: 'forum-1',
      isLocked: true,
    })

    const result = await updateTopicLock(adminActor, 'topic-1', {
      isLocked: true,
    })

    expect(forumRepository.updateTopicLockState).not.toHaveBeenCalled()
    expect(result).toEqual({
      topic: {
        id: 'topic-1',
        isLocked: true,
      },
    })
  })

  it('rejects non-admin actors before any repository call', async () => {
    await expect(
      updateTopicLock(userActor, 'topic-1', {
        isLocked: true,
      }),
    ).rejects.toMatchObject({
      code: 'FORBIDDEN',
      message: 'Admin access required',
    })

    expect(forumRepository.findTopicById).not.toHaveBeenCalled()
    expect(forumRepository.updateTopicLockState).not.toHaveBeenCalled()
  })
})
