import { createReply } from '#server/modules/forum/application/commands/create-reply'
import { defineForumHttpHandler } from '#server/modules/forum/http/handler'
import {
  validateCreateMessageInput,
  validateTopicSlugParams,
} from '#server/modules/forum/http/validation'
import { requireForumActor } from '#server/modules/forum/infrastructure/session'
import { getValidatedRouterParams, readValidatedBody, setResponseStatus } from 'h3'

export default defineForumHttpHandler(async (event) => {
  const { forumSlug, topicSlug } = await getValidatedRouterParams(event, validateTopicSlugParams)
  const input = await readValidatedBody(event, validateCreateMessageInput)
  const actor = await requireForumActor(event)
  const result = await createReply(actor, forumSlug, topicSlug, input)

  setResponseStatus(event, 201)

  return result
})
