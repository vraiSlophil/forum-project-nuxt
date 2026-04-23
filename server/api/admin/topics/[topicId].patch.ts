import { updateTopicLock } from '#server/modules/forum/application/commands/admin/update-topic-lock'
import { defineForumHttpHandler } from '#server/modules/forum/http/handler'
import {
  validateTopicIdParams,
  validateUpdateTopicLockInput,
} from '#server/modules/forum/http/validation'
import { requireForumActor } from '#server/modules/forum/infrastructure/session'
import { publishTopicUpdated } from '#server/modules/forum/realtime/publish'
import { getValidatedRouterParams, readValidatedBody } from 'h3'

export default defineForumHttpHandler(async (event) => {
  const actor = await requireForumActor(event)
  const { topicId } = await getValidatedRouterParams(event, validateTopicIdParams)
  const input = await readValidatedBody(event, validateUpdateTopicLockInput)
  const result = await updateTopicLock(actor, topicId, input)

  await publishTopicUpdated(result.topic.id)

  return result
})
