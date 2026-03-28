import { UserRole } from '#server/generated/prisma/client'
import {
  createUserRecord,
  findUserByUsername,
  isUniqueConstraintError,
} from '#server/modules/auth/infrastructure/auth-repository'
import { hashAppPassword } from '#server/utils/password'
import type { AuthSessionResponse, AuthSessionUser, RegisterUserInput } from '#shared/types/auth'
import { createAuthApplicationError } from '../shared/errors'
import { buildAuthSessionUser, presentAuthUser } from '../shared/presenters'

export async function registerUser(input: RegisterUserInput): Promise<{
  response: AuthSessionResponse
  sessionUser: AuthSessionUser
}> {
  const existingUser = await findUserByUsername(input.username)

  if (existingUser) {
    throw createAuthApplicationError('CONFLICT', 'A user with this username already exists')
  }

  const loggedInAt = new Date().toISOString()

  try {
    const user = await createUserRecord({
      username: input.username,
      passwordHash: await hashAppPassword(input.password),
      role: UserRole.USER,
    })

    return {
      response: {
        user: presentAuthUser(user),
        loggedInAt,
      },
      sessionUser: buildAuthSessionUser(user),
    }
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      throw createAuthApplicationError('CONFLICT', 'A user with this username already exists')
    }

    throw error
  }
}
