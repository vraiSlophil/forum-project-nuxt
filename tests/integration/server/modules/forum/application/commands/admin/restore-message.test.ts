import { describe, expect, it, vi } from 'vitest'
import { restoreMessage } from '#server/modules/forum/application/commands/admin/restore-message'
import * as forumRepository from '#server/modules/forum/infrastructure/forum-repository'

vi.mock('#server/modules/forum/infrastructure/forum-repository', () => ({
  findMessageForModeration: vi.fn(),
  restoreMessageRecord: vi.fn(),
}))

const adminActor = {
  id: 'admin-1',
  username: 'admin',
  role: 'ADMIN',
} as const

describe('restoreMessage', () => {
  it('restores a moderated message', async () => {
    vi.mocked(forumRepository.findMessageForModeration).mockResolvedValue({
      id: 'message-1',
      deletedAt: new Date('2026-03-02T10:00:00.000Z'),
    })

    await restoreMessage(adminActor, 'message-1')

    expect(forumRepository.restoreMessageRecord).toHaveBeenCalledWith('message-1')
  })

  it('rejects restoring a message that is not moderated', async () => {
    vi.mocked(forumRepository.findMessageForModeration).mockResolvedValue({
      id: 'message-1',
      deletedAt: null,
    })

    await expect(restoreMessage(adminActor, 'message-1')).rejects.toMatchObject({
      code: 'CONFLICT',
      message: 'Only moderated messages can be restored',
    })

    expect(forumRepository.restoreMessageRecord).not.toHaveBeenCalled()
  })
})
