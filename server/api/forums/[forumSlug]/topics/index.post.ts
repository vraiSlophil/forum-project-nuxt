import { createTopic } from '#server/services/forum-service'
import { requireForumActor } from '#server/utils/forum-auth'
import { validateCreateTopicInput, validateForumSlugParams } from '#server/utils/forum-validation'
import {
  defineEventHandler,
  getValidatedRouterParams,
  readValidatedBody,
  setResponseStatus,
} from 'h3'

export default defineEventHandler(async (event) => {
  const { forumSlug } = await getValidatedRouterParams(event, validateForumSlugParams)
  const input = await readValidatedBody(event, validateCreateTopicInput)
  const actor = await requireForumActor(event)
  const result = await createTopic(actor, forumSlug, input)

  setResponseStatus(event, 201)

  return result
})
