import { getTopicPage } from '#server/modules/forum/application/queries/get-topic-page'
import { defineForumHttpHandler } from '#server/modules/forum/http/handler'
import { validatePageQuery, validateTopicSlugParams } from '#server/modules/forum/http/validation'
import { getViewerSessionUser } from '#server/modules/forum/infrastructure/session'
import { getValidatedQuery, getValidatedRouterParams } from 'h3'

export default defineForumHttpHandler(async (event) => {
  const { forumSlug, topicSlug } = await getValidatedRouterParams(event, validateTopicSlugParams)
  const { page } = await getValidatedQuery(event, validatePageQuery)
  const viewer = await getViewerSessionUser(event)

  return getTopicPage(forumSlug, topicSlug, page, viewer)
})
