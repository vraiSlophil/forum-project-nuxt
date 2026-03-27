import { createAdminUser } from '#server/modules/forum/application/commands/admin/create-admin-user'
import { defineForumHttpHandler } from '#server/modules/forum/http/handler'
import { validateCreateAdminUserInput } from '#server/modules/forum/http/validation'
import { requireForumActor } from '#server/modules/forum/infrastructure/session'
import { readValidatedBody, setResponseStatus } from 'h3'

export default defineForumHttpHandler(async (event) => {
  const actor = await requireForumActor(event)
  const input = await readValidatedBody(event, validateCreateAdminUserInput)
  const result = await createAdminUser(actor, input)

  setResponseStatus(event, 201)

  return result
})
