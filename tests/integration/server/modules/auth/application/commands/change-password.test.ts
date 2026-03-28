import { describe, expect, it, vi } from 'vitest'
import { changePassword } from '#server/modules/auth/application/commands/change-password'
import * as authRepository from '#server/modules/auth/infrastructure/auth-repository'
import * as passwordUtils from '#server/utils/password'

vi.mock('#server/modules/auth/infrastructure/auth-repository', () => ({
  findUserCredentialsById: vi.fn(),
  updateUserPasswordHash: vi.fn(),
}))

vi.mock('#server/utils/password', () => ({
  hashAppPassword: vi.fn(),
  verifyAppPassword: vi.fn(),
}))

const actor = {
  id: 'user-1',
  username: 'alice',
  role: 'USER',
} as const

describe('changePassword', () => {
  it('updates the password when the current password is valid', async () => {
    vi.mocked(authRepository.findUserCredentialsById).mockResolvedValue({
      id: 'user-1',
      username: 'alice',
      passwordHash: 'old-hash',
      role: 'USER',
      createdAt: new Date('2026-03-20T08:00:00.000Z'),
    })
    vi.mocked(passwordUtils.verifyAppPassword).mockResolvedValue(true)
    vi.mocked(passwordUtils.hashAppPassword).mockResolvedValue('new-hash')
    vi.mocked(authRepository.updateUserPasswordHash).mockResolvedValue({
      id: 'user-1',
      username: 'alice',
      role: 'USER',
      createdAt: new Date('2026-03-20T08:00:00.000Z'),
      updatedAt: new Date('2026-03-20T09:30:00.000Z'),
    })

    const result = await changePassword(actor, {
      currentPassword: 'old-secret',
      newPassword: 'new-secret',
    })

    expect(passwordUtils.verifyAppPassword).toHaveBeenCalledWith('old-hash', 'old-secret')
    expect(authRepository.updateUserPasswordHash).toHaveBeenCalledWith({
      userId: 'user-1',
      passwordHash: 'new-hash',
    })
    expect(result).toEqual({
      user: {
        id: 'user-1',
        username: 'alice',
        role: 'USER',
        createdAt: '2026-03-20T08:00:00.000Z',
      },
      changedAt: '2026-03-20T09:30:00.000Z',
    })
  })

  it('rejects an invalid current password', async () => {
    vi.mocked(authRepository.findUserCredentialsById).mockResolvedValue({
      id: 'user-1',
      username: 'alice',
      passwordHash: 'old-hash',
      role: 'USER',
      createdAt: new Date('2026-03-20T08:00:00.000Z'),
    })
    vi.mocked(passwordUtils.verifyAppPassword).mockResolvedValue(false)

    await expect(
      changePassword(actor, {
        currentPassword: 'wrong-password',
        newPassword: 'new-secret',
      }),
    ).rejects.toMatchObject({
      code: 'INVALID_CREDENTIALS',
      message: 'Current password is incorrect',
    })
  })

  it('rejects reusing the current password', async () => {
    vi.mocked(authRepository.findUserCredentialsById).mockResolvedValue({
      id: 'user-1',
      username: 'alice',
      passwordHash: 'old-hash',
      role: 'USER',
      createdAt: new Date('2026-03-20T08:00:00.000Z'),
    })
    vi.mocked(passwordUtils.verifyAppPassword).mockResolvedValue(true)

    await expect(
      changePassword(actor, {
        currentPassword: 'same-secret',
        newPassword: 'same-secret',
      }),
    ).rejects.toMatchObject({
      code: 'CONFLICT',
      message: 'The new password must be different from the current password',
    })
  })
})
