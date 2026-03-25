import { deleteTopic } from '#server/services/forum-service'
import { requireAdminActor } from '#server/utils/forum-auth'
import { validateTopicIdParams } from '#server/utils/forum-validation'
import { defineEventHandler, getValidatedRouterParams, sendNoContent } from 'h3'

export default defineEventHandler(async (event) => {
  await requireAdminActor(event)

  const { topicId } = await getValidatedRouterParams(event, validateTopicIdParams)

  await deleteTopic(topicId)

  return sendNoContent(event)
})
