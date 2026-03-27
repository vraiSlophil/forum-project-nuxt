import { createTopic } from '#server/modules/forum/application/commands/create-topic'
import { defineForumHttpHandler } from '#server/modules/forum/http/handler'
import {
  validateCreateTopicInput,
  validateForumSlugParams,
} from '#server/modules/forum/http/validation'
import { requireForumActor } from '#server/modules/forum/infrastructure/session'
import { getValidatedRouterParams, readValidatedBody, setResponseStatus } from 'h3'

export default defineForumHttpHandler(async (event) => {
  const { forumSlug } = await getValidatedRouterParams(event, validateForumSlugParams)
  const input = await readValidatedBody(event, validateCreateTopicInput)
  const actor = await requireForumActor(event)
  const result = await createTopic(actor, forumSlug, input)

  setResponseStatus(event, 201)

  return result
})
