import { deleteMessage } from '#server/modules/forum/application/commands/delete-message'
import { defineForumHttpHandler } from '#server/modules/forum/http/handler'
import { validateMessageIdParams } from '#server/modules/forum/http/validation'
import { requireForumActor } from '#server/modules/forum/infrastructure/session'
import { getValidatedRouterParams } from 'h3'

export default defineForumHttpHandler(async (event) => {
  const actor = await requireForumActor(event)
  const { messageId } = await getValidatedRouterParams(event, validateMessageIdParams)

  return deleteMessage(actor, messageId)
})
