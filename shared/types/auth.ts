import type { ForumUserRole } from './forum'

export const AUTH_USERNAME_MIN_LENGTH = 3
export const AUTH_USERNAME_MAX_LENGTH = 50
export const AUTH_PASSWORD_MIN_LENGTH = 4
export const AUTH_PASSWORD_MAX_LENGTH = 255

export interface AuthSessionUser {
  id: string
  username: string
  role: ForumUserRole
}

export interface AuthUserSummary {
  id: string
  username: string
  role: ForumUserRole
  createdAt: string
}

export interface RegisterUserInput {
  username: string
  password: string
}

export interface LoginUserInput {
  username: string
  password: string
}

export interface ChangePasswordInput {
  currentPassword: string
  newPassword: string
}

export interface AuthSessionResponse {
  user: AuthUserSummary
  loggedInAt: string
}

export interface PasswordChangeResponse {
  user: AuthUserSummary
  changedAt: string
}
