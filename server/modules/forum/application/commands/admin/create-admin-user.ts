import {
  createUserRecord,
  findUserByUsername,
  isUniqueConstraintError,
} from '#server/modules/auth/infrastructure/auth-repository'
import { UserRole } from '#server/generated/prisma/client'
import { requireAdminPrivileges } from '#server/modules/forum/application/shared/guards'
import type { ForumActor } from '#server/modules/forum/domain/actors'
import { hashAppPassword } from '#server/utils/password'
import type { AdminUserResponse, CreateAdminUserInput } from '#shared/types/forum'
import { createForumApplicationError } from '../../shared/errors'

export async function createAdminUser(
  actor: ForumActor,
  input: CreateAdminUserInput,
): Promise<AdminUserResponse> {
  requireAdminPrivileges(actor)

  const existingUser = await findUserByUsername(input.username)

  if (existingUser) {
    throw createForumApplicationError('CONFLICT', 'A user with this username already exists')
  }

  try {
    const user = await createUserRecord({
      username: input.username,
      passwordHash: await hashAppPassword(input.password),
      role: UserRole.ADMIN,
    })

    return {
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        createdAt: user.createdAt.toISOString(),
      },
    }
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      throw createForumApplicationError('CONFLICT', 'A user with this username already exists')
    }

    throw error
  }
}
