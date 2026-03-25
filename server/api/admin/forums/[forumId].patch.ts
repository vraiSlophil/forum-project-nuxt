import { updateForum } from '#server/services/forum-service'
import { requireAdminActor } from '#server/utils/forum-auth'
import { validateForumIdParams, validateUpdateForumInput } from '#server/utils/forum-validation'
import { defineEventHandler, getValidatedRouterParams, readValidatedBody } from 'h3'

export default defineEventHandler(async (event) => {
  await requireAdminActor(event)

  const { forumId } = await getValidatedRouterParams(event, validateForumIdParams)
  const input = await readValidatedBody(event, validateUpdateForumInput)

  return updateForum(forumId, input)
})
