import { deleteForum } from '#server/modules/forum/application/commands/admin/delete-forum'
import { defineForumHttpHandler } from '#server/modules/forum/http/handler'
import { validateForumIdParams } from '#server/modules/forum/http/validation'
import { requireForumActor } from '#server/modules/forum/infrastructure/session'
import { getValidatedRouterParams, sendNoContent } from 'h3'

export default defineForumHttpHandler(async (event) => {
  const actor = await requireForumActor(event)
  const { forumId } = await getValidatedRouterParams(event, validateForumIdParams)

  await deleteForum(actor, forumId)

  return sendNoContent(event)
})
