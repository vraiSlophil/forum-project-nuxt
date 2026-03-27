import { updateForum } from '#server/modules/forum/application/commands/admin/update-forum'
import { defineForumHttpHandler } from '#server/modules/forum/http/handler'
import {
  validateForumIdParams,
  validateUpdateForumInput,
} from '#server/modules/forum/http/validation'
import { requireForumActor } from '#server/modules/forum/infrastructure/session'
import { getValidatedRouterParams, readValidatedBody } from 'h3'

export default defineForumHttpHandler(async (event) => {
  const actor = await requireForumActor(event)
  const { forumId } = await getValidatedRouterParams(event, validateForumIdParams)
  const input = await readValidatedBody(event, validateUpdateForumInput)

  return updateForum(actor, forumId, input)
})
