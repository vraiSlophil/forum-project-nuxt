import {
  canDeleteOwnMessage,
  canEditMessage,
  canModerate,
  isAdminActor,
  type SessionForumUser,
} from '#server/modules/forum/domain/actors'
import type {
  ForumAdminSummary,
  ForumUserSummary,
  ForumViewer,
  QuotedMessageSummary,
  TopicSummary,
  TopicMessage,
} from '#shared/types/forum'

const deletedMessagePlaceholder = 'Ce message a été supprimé par la modération.'

function toIsoString(value: Date | null) {
  return value ? value.toISOString() : null
}

function buildTopicPath(forumSlug: string, topicSlug: string) {
  return `/forums/${forumSlug}/topics/${topicSlug}`
}

export function buildTopicRedirect(forumSlug: string, topicSlug: string, page: number) {
  const pageSuffix = page > 1 ? `?page=${page}` : ''

  return `${buildTopicPath(forumSlug, topicSlug)}${pageSuffix}`
}

export function buildMessageRedirect(
  forumSlug: string,
  topicSlug: string,
  page: number,
  messageId: string,
) {
  return `${buildTopicRedirect(forumSlug, topicSlug, page)}#message-${messageId}`
}

export function presentViewer(viewer: SessionForumUser | null): ForumViewer {
  return {
    isAuthenticated: viewer !== null,
    userId: viewer?.id ?? null,
    username: viewer?.username ?? null,
    role: viewer?.role ?? null,
    isAdmin: isAdminActor(viewer),
  }
}

export function presentUserSummary(user: {
  id: string
  username: string
  avatarUrl: string | null
}): ForumUserSummary {
  return {
    id: user.id,
    username: user.username,
    avatarUrl: user.avatarUrl,
  }
}

export function presentForumAdminSummary(forum: {
  id: string
  name: string
  slug: string
  description: string | null
  createdAt: Date
  updatedAt: Date
}): ForumAdminSummary {
  return {
    id: forum.id,
    name: forum.name,
    slug: forum.slug,
    description: forum.description,
    createdAt: forum.createdAt.toISOString(),
    updatedAt: forum.updatedAt.toISOString(),
  }
}

export function presentTopicSummary(topic: {
  id: string
  title: string
  slug: string
  isLocked: boolean
  createdAt: Date
  updatedAt: Date
  lastMessageAt: Date
  author: {
    id: string
    username: string
    avatarUrl: string | null
  }
  _count: {
    messages: number
  }
  messages: Array<{
    id: string
    createdAt: Date
    author: {
      id: string
      username: string
      avatarUrl: string | null
    }
  }>
}): TopicSummary {
  return {
    id: topic.id,
    title: topic.title,
    slug: topic.slug,
    isLocked: topic.isLocked,
    createdAt: topic.createdAt.toISOString(),
    updatedAt: topic.updatedAt.toISOString(),
    lastMessageAt: topic.lastMessageAt.toISOString(),
    author: presentUserSummary(topic.author),
    lastMessage: topic.messages[0]
      ? {
          createdAt: topic.messages[0].createdAt.toISOString(),
          author: presentUserSummary(topic.messages[0].author),
        }
      : null,
    messageCount: topic._count.messages,
  }
}

function presentQuotedMessage(
  quotedMessage: {
    id: string
    content: string
    createdAt: Date
    deletedAt: Date | null
    author: {
      id: string
      username: string
      avatarUrl: string | null
    }
  },
  viewer: SessionForumUser | null,
): QuotedMessageSummary {
  const isDeleted = quotedMessage.deletedAt !== null

  return {
    id: quotedMessage.id,
    content: isDeleted && !canModerate(viewer) ? deletedMessagePlaceholder : quotedMessage.content,
    createdAt: quotedMessage.createdAt.toISOString(),
    author: presentUserSummary(quotedMessage.author),
    isDeleted,
  }
}

export function presentTopicMessage(
  message: {
    id: string
    authorId: string
    content: string
    createdAt: Date
    updatedAt: Date
    editedAt: Date | null
    deletedAt: Date | null
    author: {
      id: string
      username: string
      avatarUrl: string | null
    }
    quotedMessage: {
      id: string
      content: string
      createdAt: Date
      deletedAt: Date | null
      author: {
        id: string
        username: string
        avatarUrl: string | null
      }
    } | null
  },
  viewer: SessionForumUser | null,
  options: {
    canDeleteOwn?: boolean
  } = {},
): TopicMessage {
  const isDeleted = message.deletedAt !== null

  return {
    id: message.id,
    content: isDeleted && !canModerate(viewer) ? deletedMessagePlaceholder : message.content,
    createdAt: message.createdAt.toISOString(),
    updatedAt: message.updatedAt.toISOString(),
    editedAt: toIsoString(message.editedAt),
    deletedAt: toIsoString(message.deletedAt),
    isDeleted,
    author: presentUserSummary(message.author),
    quotedMessage: message.quotedMessage
      ? presentQuotedMessage(message.quotedMessage, viewer)
      : null,
    permissions: {
      canEdit: canEditMessage(viewer, message.authorId, isDeleted),
      canDeleteOwn:
        options.canDeleteOwn ?? canDeleteOwnMessage(viewer, message.authorId, isDeleted),
      canModerate: canModerate(viewer),
      canRestore: canModerate(viewer) && isDeleted,
    },
  }
}
