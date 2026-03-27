export type ForumApplicationErrorCode =
  | 'CONFLICT'
  | 'FORBIDDEN'
  | 'FORUM_NOT_FOUND'
  | 'MESSAGE_NOT_FOUND'
  | 'PAGE_NOT_FOUND'
  | 'TOPIC_LOCKED'
  | 'TOPIC_NOT_FOUND'
  | 'UNAUTHENTICATED'

const defaultMessages: Record<ForumApplicationErrorCode, string> = {
  CONFLICT: 'Conflict',
  FORBIDDEN: 'Forbidden',
  FORUM_NOT_FOUND: 'Forum not found',
  MESSAGE_NOT_FOUND: 'Message not found',
  PAGE_NOT_FOUND: 'Page not found',
  TOPIC_LOCKED: 'Topic is locked',
  TOPIC_NOT_FOUND: 'Topic not found',
  UNAUTHENTICATED: 'Authentication required',
}

export class ForumApplicationError extends Error {
  code: ForumApplicationErrorCode

  constructor(code: ForumApplicationErrorCode, message = defaultMessages[code]) {
    super(message)
    this.code = code
    this.name = 'ForumApplicationError'
  }
}

export function createForumApplicationError(code: ForumApplicationErrorCode, message?: string) {
  return new ForumApplicationError(code, message)
}

export function isForumApplicationError(error: unknown): error is ForumApplicationError {
  return error instanceof ForumApplicationError
}
