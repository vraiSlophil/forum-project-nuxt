import type { ForumActor } from '#server/modules/forum/domain/actors'
import { isAdminActor } from '#server/modules/forum/domain/actors'
import { createPagination, isPageOutOfRange } from '#server/modules/forum/domain/pagination'
import { createForumApplicationError } from './errors'

export function requireAdminPrivileges(actor: ForumActor) {
  if (!isAdminActor(actor)) {
    throw createForumApplicationError('FORBIDDEN', 'Admin access required')
  }
}

export function requirePageInRange(page: number, totalItems: number) {
  const pagination = createPagination(page, totalItems)

  if (isPageOutOfRange(page, pagination)) {
    throw createForumApplicationError('PAGE_NOT_FOUND')
  }

  return pagination
}
