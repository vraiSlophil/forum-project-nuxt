import type { AuthSessionUser } from './auth'

declare module '#auth-utils' {
  interface User extends AuthSessionUser {}

  interface UserSession {
    loggedInAt?: string
  }
}

export {}
