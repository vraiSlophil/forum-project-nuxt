import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { UserRole } from '#server/generated/prisma/client'
import { registerUser } from '#server/modules/auth/application/commands/register-user'
import * as authRepository from '#server/modules/auth/infrastructure/auth-repository'
import * as passwordUtils from '#server/utils/password'

vi.mock('#server/modules/auth/infrastructure/auth-repository', () => ({
  createUserRecord: vi.fn(),
  findUserByUsername: vi.fn(),
  isUniqueConstraintError: vi.fn(),
}))

vi.mock('#server/utils/password', () => ({
  hashAppPassword: vi.fn(),
}))

const frozenNow = new Date('2026-03-20T09:00:00.000Z')

describe('registerUser', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(frozenNow)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('creates a regular user and returns a session payload', async () => {
    vi.mocked(authRepository.findUserByUsername).mockResolvedValue(null)
    vi.mocked(passwordUtils.hashAppPassword).mockResolvedValue('hashed-password')
    vi.mocked(authRepository.createUserRecord).mockResolvedValue({
      id: 'user-1',
      username: 'alice',
      role: UserRole.USER,
      createdAt: new Date('2026-03-20T08:00:00.000Z'),
    })

    const result = await registerUser({
      username: 'alice',
      password: 'secret',
    })

    expect(passwordUtils.hashAppPassword).toHaveBeenCalledWith('secret')
    expect(authRepository.createUserRecord).toHaveBeenCalledWith({
      username: 'alice',
      passwordHash: 'hashed-password',
      role: UserRole.USER,
    })
    expect(result).toEqual({
      response: {
        user: {
          id: 'user-1',
          username: 'alice',
          role: 'USER',
          createdAt: '2026-03-20T08:00:00.000Z',
        },
        loggedInAt: '2026-03-20T09:00:00.000Z',
      },
      sessionUser: {
        id: 'user-1',
        username: 'alice',
        role: 'USER',
      },
    })
  })

  it('rejects an already taken username', async () => {
    vi.mocked(authRepository.findUserByUsername).mockResolvedValue({
      id: 'user-1',
      username: 'alice',
      role: 'USER',
      createdAt: new Date('2026-03-20T08:00:00.000Z'),
    })

    await expect(
      registerUser({
        username: 'alice',
        password: 'secret',
      }),
    ).rejects.toMatchObject({
      code: 'CONFLICT',
      message: 'A user with this username already exists',
    })

    expect(authRepository.createUserRecord).not.toHaveBeenCalled()
  })
})
