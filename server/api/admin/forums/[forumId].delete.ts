import { deleteForum } from '#server/services/forum-service'
import { requireAdminActor } from '#server/utils/forum-auth'
import { validateForumIdParams } from '#server/utils/forum-validation'
import { defineEventHandler, getValidatedRouterParams, sendNoContent } from 'h3'

export default defineEventHandler(async (event) => {
  await requireAdminActor(event)

  const { forumId } = await getValidatedRouterParams(event, validateForumIdParams)

  await deleteForum(forumId)

  return sendNoContent(event)
})
