import { updateMessage } from '#server/services/forum-service'
import { requireForumActor } from '#server/utils/forum-auth'
import { validateMessageIdParams, validateUpdateMessageInput } from '#server/utils/forum-validation'
import { defineEventHandler, getValidatedRouterParams, readValidatedBody } from 'h3'

export default defineEventHandler(async (event) => {
  const { messageId } = await getValidatedRouterParams(event, validateMessageIdParams)
  const input = await readValidatedBody(event, validateUpdateMessageInput)
  const actor = await requireForumActor(event)

  return updateMessage(actor, messageId, input)
})
