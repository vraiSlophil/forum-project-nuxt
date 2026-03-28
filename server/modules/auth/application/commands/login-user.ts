import { findUserCredentialsByUsername } from '#server/modules/auth/infrastructure/auth-repository'
import { verifyAppPassword } from '#server/utils/password'
import type { AuthSessionResponse, AuthSessionUser, LoginUserInput } from '#shared/types/auth'
import { createAuthApplicationError } from '../shared/errors'
import { buildAuthSessionUser, presentAuthUser } from '../shared/presenters'

export async function loginUser(input: LoginUserInput): Promise<{
  response: AuthSessionResponse
  sessionUser: AuthSessionUser
}> {
  const user = await findUserCredentialsByUsername(input.username)

  if (!user) {
    throw createAuthApplicationError('INVALID_CREDENTIALS', 'Invalid username or password')
  }

  const isValidPassword = await verifyAppPassword(user.passwordHash, input.password)

  if (!isValidPassword) {
    throw createAuthApplicationError('INVALID_CREDENTIALS', 'Invalid username or password')
  }

  const loggedInAt = new Date().toISOString()

  return {
    response: {
      user: presentAuthUser(user),
      loggedInAt,
    },
    sessionUser: buildAuthSessionUser(user),
  }
}
