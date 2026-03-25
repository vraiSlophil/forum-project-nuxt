import { getForumPage } from '#server/services/forum-service'
import { getViewerSessionUser } from '#server/utils/forum-auth'
import { validateForumSlugParams, validatePageQuery } from '#server/utils/forum-validation'
import { defineEventHandler, getValidatedQuery, getValidatedRouterParams } from 'h3'

export default defineEventHandler(async (event) => {
  const { forumSlug } = await getValidatedRouterParams(event, validateForumSlugParams)
  const { page } = await getValidatedQuery(event, validatePageQuery)
  const viewer = await getViewerSessionUser(event)

  return getForumPage(forumSlug, page, viewer)
})
