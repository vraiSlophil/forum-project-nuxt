import { describe, expect, it, vi } from 'vitest'
import { loginUser } from '#server/modules/auth/application/commands/login-user'
import * as authRepository from '#server/modules/auth/infrastructure/auth-repository'
import * as passwordUtils from '#server/utils/password'

vi.mock('#server/modules/auth/infrastructure/auth-repository', () => ({
  findUserCredentialsByUsername: vi.fn(),
}))

vi.mock('#server/utils/password', () => ({
  verifyAppPassword: vi.fn(),
}))

describe('loginUser', () => {
  it('returns a session payload when credentials are valid', async () => {
    vi.mocked(authRepository.findUserCredentialsByUsername).mockResolvedValue({
      id: 'user-1',
      username: 'alice',
      passwordHash: 'hashed-password',
      role: 'USER',
      createdAt: new Date('2026-03-20T08:00:00.000Z'),
    })
    vi.mocked(passwordUtils.verifyAppPassword).mockResolvedValue(true)

    const result = await loginUser({
      username: 'alice',
      password: 'secret',
    })

    expect(passwordUtils.verifyAppPassword).toHaveBeenCalledWith('hashed-password', 'secret')
    expect(result.sessionUser).toEqual({
      id: 'user-1',
      username: 'alice',
      role: 'USER',
    })
    expect(result.response.user).toEqual({
      id: 'user-1',
      username: 'alice',
      role: 'USER',
      createdAt: '2026-03-20T08:00:00.000Z',
    })
  })

  it('rejects an unknown username', async () => {
    vi.mocked(authRepository.findUserCredentialsByUsername).mockResolvedValue(null)

    await expect(
      loginUser({
        username: 'ghost',
        password: 'secret',
      }),
    ).rejects.toMatchObject({
      code: 'INVALID_CREDENTIALS',
      message: 'Invalid username or password',
    })
  })

  it('rejects an invalid password', async () => {
    vi.mocked(authRepository.findUserCredentialsByUsername).mockResolvedValue({
      id: 'user-1',
      username: 'alice',
      passwordHash: 'hashed-password',
      role: 'USER',
      createdAt: new Date('2026-03-20T08:00:00.000Z'),
    })
    vi.mocked(passwordUtils.verifyAppPassword).mockResolvedValue(false)

    await expect(
      loginUser({
        username: 'alice',
        password: 'wrong-password',
      }),
    ).rejects.toMatchObject({
      code: 'INVALID_CREDENTIALS',
      message: 'Invalid username or password',
    })
  })
})
