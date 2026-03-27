import { findActorById } from '#server/modules/forum/infrastructure/forum-repository'
import { setAppUserSession } from '#server/utils/user-session'
import { createError, defineEventHandler, readBody } from 'h3'

function ensureTestRoutesEnabled() {
  if (process.env.FORUM_ENABLE_TEST_ROUTES !== '1') {
    throw createError({
      statusCode: 404,
      statusMessage: 'Not found',
    })
  }
}

export default defineEventHandler(async (event) => {
  ensureTestRoutesEnabled()

  const body = await readBody(event)

  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid request body',
    })
  }

  const { userId } = body as { userId?: unknown }

  if (typeof userId !== 'string' || !userId.trim()) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Field "userId" is required',
    })
  }

  const actor = await findActorById(userId)

  if (!actor) {
    throw createError({
      statusCode: 404,
      statusMessage: 'User not found',
    })
  }

  await setAppUserSession(event, {
    user: actor,
  })

  return {
    user: actor,
  }
})
