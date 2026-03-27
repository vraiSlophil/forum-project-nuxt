import { createForum } from '#server/modules/forum/application/commands/admin/create-forum'
import { defineForumHttpHandler } from '#server/modules/forum/http/handler'
import { validateCreateForumInput } from '#server/modules/forum/http/validation'
import { requireForumActor } from '#server/modules/forum/infrastructure/session'
import { readValidatedBody, setResponseStatus } from 'h3'

export default defineForumHttpHandler(async (event) => {
  const actor = await requireForumActor(event)
  const input = await readValidatedBody(event, validateCreateForumInput)
  const result = await createForum(actor, input)

  setResponseStatus(event, 201)

  return result
})
