import { listForums } from '#server/services/forum-service'
import { getViewerSessionUser } from '#server/utils/forum-auth'
import { defineEventHandler } from 'h3'

export default defineEventHandler(async (event) => {
  const viewer = await getViewerSessionUser(event)

  return listForums(viewer)
})
