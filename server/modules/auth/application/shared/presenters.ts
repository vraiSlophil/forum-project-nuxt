import type { AuthSessionUser, AuthUserSummary } from '#shared/types/auth'

export function buildAuthSessionUser(user: {
  id: string
  username: string
  role: AuthSessionUser['role']
}): AuthSessionUser {
  return {
    id: user.id,
    username: user.username,
    role: user.role,
  }
}

export function presentAuthUser(user: {
  id: string
  username: string
  role: AuthUserSummary['role']
  createdAt: Date
}): AuthUserSummary {
  return {
    id: user.id,
    username: user.username,
    role: user.role,
    createdAt: user.createdAt.toISOString(),
  }
}
