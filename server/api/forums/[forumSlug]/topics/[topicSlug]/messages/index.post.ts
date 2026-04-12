import { createReply } from '#server/modules/forum/application/commands/create-reply'
import { defineForumHttpHandler } from '#server/modules/forum/http/handler'
import {
  validateCreateMessageInput,
  validateTopicSlugParams,
} from '#server/modules/forum/http/validation'
import { requireForumActor } from '#server/modules/forum/infrastructure/session'
import { publishMessageCreated, publishTopicBumped } from '#server/modules/forum/realtime/publish'
import { getValidatedRouterParams, readValidatedBody, setResponseStatus } from 'h3'

export default defineForumHttpHandler(async (event) => {
  const { forumSlug, topicSlug } = await getValidatedRouterParams(event, validateTopicSlugParams)
  const input = await readValidatedBody(event, validateCreateMessageInput)
  const actor = await requireForumActor(event)
  const result = await createReply(actor, forumSlug, topicSlug, input)

  await publishMessageCreated(result.message.id)
  await publishTopicBumped(result.topic.id)

  setResponseStatus(event, 201)

  return result
})
