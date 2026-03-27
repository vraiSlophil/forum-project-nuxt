import {
  createError,
  defineEventHandler,
  isError,
  type EventHandlerRequest,
  type H3Event,
} from 'h3'
import {
  isForumApplicationError,
  type ForumApplicationErrorCode,
} from '#server/modules/forum/application/shared/errors'

const statusByCode: Record<ForumApplicationErrorCode, number> = {
  CONFLICT: 409,
  FORBIDDEN: 403,
  FORUM_NOT_FOUND: 404,
  MESSAGE_NOT_FOUND: 404,
  PAGE_NOT_FOUND: 404,
  TOPIC_LOCKED: 423,
  TOPIC_NOT_FOUND: 404,
  UNAUTHENTICATED: 401,
}

function toForumHttpError(error: unknown) {
  if (isForumApplicationError(error)) {
    return createError({
      statusCode: statusByCode[error.code],
      statusMessage: error.message,
    })
  }

  if (isError(error)) {
    return error
  }

  return error
}

export function defineForumHttpHandler<T>(
  handler: (event: H3Event<EventHandlerRequest>) => Promise<T>,
) {
  return defineEventHandler(async (event) => {
    try {
      return await handler(event)
    } catch (error) {
      throw toForumHttpError(error)
    }
  })
}
