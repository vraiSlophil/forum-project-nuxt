import { describe, expect, it, vi } from 'vitest'
import { createForum } from '#server/modules/forum/application/commands/admin/create-forum'
import * as forumRepository from '#server/modules/forum/infrastructure/forum-repository'

vi.mock('#server/modules/forum/infrastructure/forum-repository', () => ({
  createForumRecord: vi.fn(),
  findForumByName: vi.fn(),
  isUniqueConstraintError: vi.fn(),
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

describe('createForum', () => {
  it('creates a forum for an admin actor', async () => {
    vi.mocked(forumRepository.findForumByName).mockResolvedValue(null)
    vi.mocked(forumRepository.createForumRecord).mockResolvedValue({
      id: 'forum-1',
      name: 'Général',
      slug: 'general',
      description: 'Discussions générales',
      createdAt: new Date('2026-03-10T08:00:00.000Z'),
      updatedAt: new Date('2026-03-10T08:00:00.000Z'),
    })

    const result = await createForum(adminActor, {
      name: 'Général',
      description: 'Discussions générales',
    })

    expect(forumRepository.createForumRecord).toHaveBeenCalledWith({
      name: 'Général',
      description: 'Discussions générales',
    })
    expect(result).toEqual({
      forum: {
        id: 'forum-1',
        name: 'Général',
        slug: 'general',
        description: 'Discussions générales',
        createdAt: '2026-03-10T08:00:00.000Z',
        updatedAt: '2026-03-10T08:00:00.000Z',
      },
    })
  })

  it('rejects non-admin actors before any repository call', async () => {
    await expect(
      createForum(userActor, {
        name: 'Support',
        description: null,
      }),
    ).rejects.toMatchObject({
      code: 'FORBIDDEN',
      message: 'Admin access required',
    })

    expect(forumRepository.findForumByName).not.toHaveBeenCalled()
    expect(forumRepository.createForumRecord).not.toHaveBeenCalled()
  })

  it('rejects duplicate forum names', async () => {
    vi.mocked(forumRepository.findForumByName).mockResolvedValue({
      id: 'forum-1',
    })

    await expect(
      createForum(adminActor, {
        name: 'Général',
        description: null,
      }),
    ).rejects.toMatchObject({
      code: 'CONFLICT',
      message: 'A forum with this name already exists',
    })

    expect(forumRepository.createForumRecord).not.toHaveBeenCalled()
  })
})
