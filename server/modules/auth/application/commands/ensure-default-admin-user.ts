import { UserRole } from '#server/generated/prisma/client'
import {
  createUserRecord,
  findAnyAdminUser,
  findUserByUsername,
  isUniqueConstraintError,
} from '#server/modules/auth/infrastructure/auth-repository'
import { hashAppPassword } from '#server/utils/password'
import { createAuthApplicationError } from '../shared/errors'

export const DEFAULT_ADMIN_USERNAME = 'admin'
export const DEFAULT_ADMIN_PASSWORD = 'admin'

export async function ensureDefaultAdminUser() {
  const existingAdmin = await findAnyAdminUser()

  if (existingAdmin) {
    return {
      created: false,
      user: existingAdmin,
    }
  }

  try {
    const user = await createUserRecord({
      username: DEFAULT_ADMIN_USERNAME,
      passwordHash: await hashAppPassword(DEFAULT_ADMIN_PASSWORD),
      role: UserRole.ADMIN,
    })

    return {
      created: true,
      user,
    }
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      const concurrentUser = await findUserByUsername(DEFAULT_ADMIN_USERNAME)

      if (concurrentUser) {
        if (concurrentUser.role !== UserRole.ADMIN) {
          throw createAuthApplicationError(
            'CONFLICT',
            `Cannot create the default admin because username "${DEFAULT_ADMIN_USERNAME}" is already taken`,
          )
        }

        return {
          created: false,
          user: concurrentUser,
        }
      }
    }

    throw error
  }
}
