export type AuthApplicationErrorCode = 'CONFLICT' | 'INVALID_CREDENTIALS' | 'UNAUTHENTICATED'

const defaultMessages: Record<AuthApplicationErrorCode, string> = {
  CONFLICT: 'Conflict',
  INVALID_CREDENTIALS: 'Invalid credentials',
  UNAUTHENTICATED: 'Authentication required',
}

export class AuthApplicationError extends Error {
  code: AuthApplicationErrorCode

  constructor(code: AuthApplicationErrorCode, message = defaultMessages[code]) {
    super(message)
    this.code = code
    this.name = 'AuthApplicationError'
  }
}

export function createAuthApplicationError(code: AuthApplicationErrorCode, message?: string) {
  return new AuthApplicationError(code, message)
}

export function isAuthApplicationError(error: unknown): error is AuthApplicationError {
  return error instanceof AuthApplicationError
}
