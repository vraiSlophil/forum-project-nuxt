import {
  findUserCredentialsById,
  updateUserPasswordHash,
} from '#server/modules/auth/infrastructure/auth-repository'
import { hashAppPassword, verifyAppPassword } from '#server/utils/password'
import type {
  AuthSessionUser,
  ChangePasswordInput,
  PasswordChangeResponse,
} from '#shared/types/auth'
import { createAuthApplicationError } from '../shared/errors'
import { presentAuthUser } from '../shared/presenters'

export async function changePassword(
  actor: AuthSessionUser,
  input: ChangePasswordInput,
): Promise<PasswordChangeResponse> {
  const user = await findUserCredentialsById(actor.id)

  if (!user) {
    throw createAuthApplicationError('UNAUTHENTICATED', 'User no longer exists')
  }

  const isCurrentPasswordValid = await verifyAppPassword(user.passwordHash, input.currentPassword)

  if (!isCurrentPasswordValid) {
    throw createAuthApplicationError('INVALID_CREDENTIALS', 'Current password is incorrect')
  }

  if (input.currentPassword === input.newPassword) {
    throw createAuthApplicationError(
      'CONFLICT',
      'The new password must be different from the current password',
    )
  }

  const updatedUser = await updateUserPasswordHash({
    userId: user.id,
    passwordHash: await hashAppPassword(input.newPassword),
  })

  return {
    user: presentAuthUser(updatedUser),
    changedAt: updatedUser.updatedAt.toISOString(),
  }
}
