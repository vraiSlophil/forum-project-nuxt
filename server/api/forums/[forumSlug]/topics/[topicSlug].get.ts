import { getTopicPage } from '#server/services/forum-service'
import { getViewerSessionUser } from '#server/utils/forum-auth'
import { validatePageQuery, validateTopicSlugParams } from '#server/utils/forum-validation'
import { defineEventHandler, getValidatedQuery, getValidatedRouterParams } from 'h3'

export default defineEventHandler(async (event) => {
  const { forumSlug, topicSlug } = await getValidatedRouterParams(event, validateTopicSlugParams)
  const { page } = await getValidatedQuery(event, validatePageQuery)
  const viewer = await getViewerSessionUser(event)

  return getTopicPage(forumSlug, topicSlug, page, viewer)
})
