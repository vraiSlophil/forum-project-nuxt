import { updateMessage } from '#server/modules/forum/application/commands/update-message'
import { defineForumHttpHandler } from '#server/modules/forum/http/handler'
import {
  validateMessageIdParams,
  validateUpdateMessageInput,
} from '#server/modules/forum/http/validation'
import { requireForumActor } from '#server/modules/forum/infrastructure/session'
import { getValidatedRouterParams, readValidatedBody } from 'h3'

export default defineForumHttpHandler(async (event) => {
  const { messageId } = await getValidatedRouterParams(event, validateMessageIdParams)
  const input = await readValidatedBody(event, validateUpdateMessageInput)
  const actor = await requireForumActor(event)

  return updateMessage(actor, messageId, input)
})
