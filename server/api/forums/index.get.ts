import { listForums } from '#server/modules/forum/application/queries/list-forums'
import { defineForumHttpHandler } from '#server/modules/forum/http/handler'
import { getViewerSessionUser } from '#server/modules/forum/infrastructure/session'

export default defineForumHttpHandler(async (event) => {
  const viewer = await getViewerSessionUser(event)

  return listForums(viewer)
})
