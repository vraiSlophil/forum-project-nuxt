import { hashPassword } from '#imports'
import { requireAdminPrivileges } from '#server/modules/forum/application/shared/guards'
import type { ForumActor } from '#server/modules/forum/domain/actors'
import {
  createAdminUserRecord,
  findUserByUsername,
  isUniqueConstraintError,
} from '#server/modules/forum/infrastructure/forum-repository'
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
    const user = await createAdminUserRecord({
      username: input.username,
      passwordHash: await hashPassword(input.password),
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
