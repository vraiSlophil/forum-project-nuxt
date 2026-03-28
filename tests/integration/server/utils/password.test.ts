import { describe, expect, it } from 'vitest'
import { hashAppPassword, verifyAppPassword } from '#server/utils/password'

describe('app password hashing', () => {
  it('hashes passwords with argon2id', async () => {
    const hash = await hashAppPassword('secret-password')

    expect(hash).toMatch(/^\$argon2id\$/)
    await expect(verifyAppPassword(hash, 'secret-password')).resolves.toBe(true)
  })

  it('rejects an invalid password', async () => {
    const hash = await hashAppPassword('secret-password')

    await expect(verifyAppPassword(hash, 'wrong-password')).resolves.toBe(false)
  })
})
