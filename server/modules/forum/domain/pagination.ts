import { FORUM_PAGE_SIZE, type PaginationInfo } from '#shared/types/forum'

export function createPagination(page: number, totalItems: number): PaginationInfo {
  const totalPages = Math.max(1, Math.ceil(totalItems / FORUM_PAGE_SIZE))

  return {
    page,
    pageSize: FORUM_PAGE_SIZE,
    totalItems,
    totalPages,
    hasPreviousPage: page > 1,
    hasNextPage: page < totalPages,
  }
}

export function isPageOutOfRange(page: number, pagination: PaginationInfo) {
  return page > pagination.totalPages
}

export function calculatePageFromPosition(position: number) {
  return Math.max(1, Math.ceil(position / FORUM_PAGE_SIZE))
}
