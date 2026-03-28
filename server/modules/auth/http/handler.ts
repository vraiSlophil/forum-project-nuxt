import {
  createError,
  defineEventHandler,
  isError,
  type EventHandlerRequest,
  type H3Event,
} from 'h3'
import {
  isAuthApplicationError,
  type AuthApplicationErrorCode,
} from '#server/modules/auth/application/shared/errors'

const statusByCode: Record<AuthApplicationErrorCode, number> = {
  CONFLICT: 409,
  INVALID_CREDENTIALS: 401,
  UNAUTHENTICATED: 401,
}

function toAuthHttpError(error: unknown) {
  if (isAuthApplicationError(error)) {
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

export function defineAuthHttpHandler<T>(
  handler: (event: H3Event<EventHandlerRequest>) => Promise<T>,
) {
  return defineEventHandler(async (event) => {
    try {
      return await handler(event)
    } catch (error) {
      throw toAuthHttpError(error)
    }
  })
}
