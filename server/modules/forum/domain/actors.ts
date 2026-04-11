import type { ForumUserRole } from '#shared/types/forum'

export interface SessionForumUser {
  id: string
  username: string
  role: ForumUserRole
}

export type ForumActor = SessionForumUser

export function isAdminRole(role: ForumUserRole | null | undefined): role is 'ADMIN' {
  return role === 'ADMIN'
}

export function isAdminActor(
  actor: Pick<SessionForumUser, 'role'> | null | undefined,
): actor is Pick<SessionForumUser, 'role'> & { role: 'ADMIN' } {
  return isAdminRole(actor?.role)
}

export function canModerate(viewer: SessionForumUser | null) {
  return isAdminActor(viewer)
}

export function canEditMessage(
  viewer: SessionForumUser | null,
  authorId: string,
  isDeleted: boolean,
) {
  if (!viewer || isDeleted) {
    return false
  }

  return isAdminActor(viewer) || viewer.id === authorId
}

export function canDeleteOwnMessage(
  viewer: SessionForumUser | null,
  authorId: string,
  isDeleted: boolean,
) {
  if (!viewer || isDeleted) {
    return false
  }

  return viewer.id === authorId
}
