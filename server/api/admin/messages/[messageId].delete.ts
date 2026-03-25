import { moderateMessage } from '#server/services/forum-service'
import { requireAdminActor } from '#server/utils/forum-auth'
import { validateMessageIdParams } from '#server/utils/forum-validation'
import { defineEventHandler, getValidatedRouterParams, sendNoContent } from 'h3'

export default defineEventHandler(async (event) => {
  const actor = await requireAdminActor(event)
  const { messageId } = await getValidatedRouterParams(event, validateMessageIdParams)

  await moderateMessage(actor, messageId)

  return sendNoContent(event)
})
