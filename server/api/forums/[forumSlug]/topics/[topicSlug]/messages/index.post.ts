import { createReply } from '#server/services/forum-service'
import { requireForumActor } from '#server/utils/forum-auth'
import { validateCreateMessageInput, validateTopicSlugParams } from '#server/utils/forum-validation'
import {
  defineEventHandler,
  getValidatedRouterParams,
  readValidatedBody,
  setResponseStatus,
} from 'h3'

export default defineEventHandler(async (event) => {
  const { forumSlug, topicSlug } = await getValidatedRouterParams(event, validateTopicSlugParams)
  const input = await readValidatedBody(event, validateCreateMessageInput)
  const actor = await requireForumActor(event)
  const result = await createReply(actor, forumSlug, topicSlug, input)

  setResponseStatus(event, 201)

  return result
})
