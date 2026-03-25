import { createAdminUser } from '#server/services/forum-service'
import { requireAdminActor } from '#server/utils/forum-auth'
import { validateCreateAdminUserInput } from '#server/utils/forum-validation'
import { defineEventHandler, readValidatedBody, setResponseStatus } from 'h3'

export default defineEventHandler(async (event) => {
  await requireAdminActor(event)

  const input = await readValidatedBody(event, validateCreateAdminUserInput)
  const result = await createAdminUser(input)

  setResponseStatus(event, 201)

  return result
})
