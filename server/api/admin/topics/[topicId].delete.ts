import { deleteTopic } from '#server/modules/forum/application/commands/admin/delete-topic'
import { defineForumHttpHandler } from '#server/modules/forum/http/handler'
import { validateTopicIdParams } from '#server/modules/forum/http/validation'
import { requireForumActor } from '#server/modules/forum/infrastructure/session'
import { publishTopicDeleted } from '#server/modules/forum/realtime/publish'
import { getValidatedRouterParams, sendNoContent } from 'h3'

export default defineForumHttpHandler(async (event) => {
  const actor = await requireForumActor(event)
  const { topicId } = await getValidatedRouterParams(event, validateTopicIdParams)
  const result = await deleteTopic(actor, topicId)

  await publishTopicDeleted(result.forumId, result.topicId)

  return sendNoContent(event)
})
