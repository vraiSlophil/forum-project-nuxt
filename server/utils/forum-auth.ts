import { getUserSession, requireUserSession } from '#imports'
import { UserRole } from '#server/generated/prisma/client'
import { usePrisma } from '#server/utils/prisma'
import type { ForumUserRole, ForumViewer } from '#shared/types/forum'
import { createError, type H3Event } from 'h3'

export interface SessionForumUser {
  id: string
  username: string
  role: ForumUserRole
}

export type ForumActor = SessionForumUser

function isForumUserRole(value: unknown): value is ForumUserRole {
  return value === UserRole.USER || value === UserRole.ADMIN
}

function isSessionForumUser(value: unknown): value is SessionForumUser {
  if (!value || typeof value !== 'object') {
    return false
  }

  const user = value as Record<string, unknown>

  return (
    typeof user.id === 'string' &&
    user.id.length > 0 &&
    typeof user.username === 'string' &&
    user.username.length > 0 &&
    isForumUserRole(user.role)
  )
}

export async function getViewerSessionUser(event: H3Event): Promise<SessionForumUser | null> {
  const session = await getUserSession(event)

  return isSessionForumUser(session.user) ? session.user : null
}

export function buildViewerState(viewer: SessionForumUser | null): ForumViewer {
  return {
    isAuthenticated: viewer !== null,
    userId: viewer?.id ?? null,
    username: viewer?.username ?? null,
    role: viewer?.role ?? null,
    isAdmin: viewer?.role === UserRole.ADMIN,
  }
}

export async function requireForumActor(event: H3Event): Promise<ForumActor> {
  const session = await requireUserSession(event)

  if (!isSessionForumUser(session.user)) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Invalid user session',
    })
  }

  const prisma = usePrisma()
  const actor = await prisma.user.findUnique({
    where: {
      id: session.user.id,
    },
    select: {
      id: true,
      username: true,
      role: true,
    },
  })

  if (!actor) {
    throw createError({
      statusCode: 401,
      statusMessage: 'User no longer exists',
    })
  }

  return actor
}

export async function requireAdminActor(event: H3Event): Promise<ForumActor> {
  const actor = await requireForumActor(event)

  if (actor.role !== UserRole.ADMIN) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Admin access required',
    })
  }

  return actor
}

export function canModerate(viewer: SessionForumUser | null) {
  return viewer?.role === UserRole.ADMIN
}

export function canEditMessage(
  viewer: SessionForumUser | null,
  authorId: string,
  isDeleted: boolean,
) {
  if (!viewer || isDeleted) {
    return false
  }

  return viewer.role === UserRole.ADMIN || viewer.id === authorId
}
