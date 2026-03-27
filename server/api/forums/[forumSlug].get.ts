import { getForumPage } from '#server/modules/forum/application/queries/get-forum-page'
import { defineForumHttpHandler } from '#server/modules/forum/http/handler'
import { validateForumSlugParams, validatePageQuery } from '#server/modules/forum/http/validation'
import { getViewerSessionUser } from '#server/modules/forum/infrastructure/session'
import { getValidatedQuery, getValidatedRouterParams } from 'h3'

export default defineForumHttpHandler(async (event) => {
  const { forumSlug } = await getValidatedRouterParams(event, validateForumSlugParams)
  const { page } = await getValidatedQuery(event, validatePageQuery)
  const viewer = await getViewerSessionUser(event)

  return getForumPage(forumSlug, page, viewer)
})
