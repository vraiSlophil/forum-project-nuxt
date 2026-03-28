import { describe, expect, it, vi } from 'vitest'
import { UserRole } from '#server/generated/prisma/client'
import {
  DEFAULT_ADMIN_PASSWORD,
  DEFAULT_ADMIN_USERNAME,
  ensureDefaultAdminUser,
} from '#server/modules/auth/application/commands/ensure-default-admin-user'
import * as authRepository from '#server/modules/auth/infrastructure/auth-repository'
import * as passwordUtils from '#server/utils/password'

vi.mock('#server/modules/auth/infrastructure/auth-repository', () => ({
  createUserRecord: vi.fn(),
  findAnyAdminUser: vi.fn(),
  findUserByUsername: vi.fn(),
  isUniqueConstraintError: vi.fn(),
}))

vi.mock('#server/utils/password', () => ({
  hashAppPassword: vi.fn(),
}))

describe('ensureDefaultAdminUser', () => {
  it('creates the default admin when it does not exist', async () => {
    vi.mocked(authRepository.findAnyAdminUser).mockResolvedValue(null)
    vi.mocked(authRepository.findUserByUsername).mockResolvedValue(null)
    vi.mocked(passwordUtils.hashAppPassword).mockResolvedValue('hashed-admin-password')
    vi.mocked(authRepository.createUserRecord).mockResolvedValue({
      id: 'admin-1',
      username: DEFAULT_ADMIN_USERNAME,
      role: 'ADMIN',
      createdAt: new Date('2026-03-20T08:00:00.000Z'),
    })

    const result = await ensureDefaultAdminUser()

    expect(passwordUtils.hashAppPassword).toHaveBeenCalledWith(DEFAULT_ADMIN_PASSWORD)
    expect(authRepository.createUserRecord).toHaveBeenCalledWith({
      username: DEFAULT_ADMIN_USERNAME,
      passwordHash: 'hashed-admin-password',
      role: UserRole.ADMIN,
    })
    expect(result).toEqual({
      created: true,
      user: {
        id: 'admin-1',
        username: 'admin',
        role: 'ADMIN',
        createdAt: new Date('2026-03-20T08:00:00.000Z'),
      },
    })
  })

  it('does nothing when an admin already exists', async () => {
    vi.mocked(authRepository.findAnyAdminUser).mockResolvedValue({
      id: 'admin-2',
      username: 'root',
      role: 'ADMIN',
      createdAt: new Date('2026-03-20T08:00:00.000Z'),
    })

    const result = await ensureDefaultAdminUser()

    expect(passwordUtils.hashAppPassword).not.toHaveBeenCalled()
    expect(authRepository.createUserRecord).not.toHaveBeenCalled()
    expect(result.created).toBe(false)
  })

  it('fails when the default username is already taken by a non-admin user', async () => {
    vi.mocked(authRepository.findAnyAdminUser).mockResolvedValue(null)
    vi.mocked(passwordUtils.hashAppPassword).mockResolvedValue('hashed-admin-password')
    vi.mocked(authRepository.createUserRecord).mockRejectedValue(new Error('duplicate'))
    vi.mocked(authRepository.isUniqueConstraintError).mockReturnValue(true)
    vi.mocked(authRepository.findUserByUsername).mockResolvedValue({
      id: 'user-1',
      username: DEFAULT_ADMIN_USERNAME,
      role: 'USER',
      createdAt: new Date('2026-03-20T08:00:00.000Z'),
    })

    await expect(ensureDefaultAdminUser()).rejects.toMatchObject({
      code: 'CONFLICT',
      message: 'Cannot create the default admin because username "admin" is already taken',
    })
  })
})
