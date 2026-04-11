export const FORUM_PAGE_SIZE = 20

export type ForumUserRole = 'USER' | 'ADMIN'

export interface ForumViewer {
  isAuthenticated: boolean
  userId: string | null
  username: string | null
  role: ForumUserRole | null
  isAdmin: boolean
}

export interface PaginationInfo {
  page: number
  pageSize: number
  totalItems: number
  totalPages: number
  hasPreviousPage: boolean
  hasNextPage: boolean
}

export interface ForumUserSummary {
  id: string
  username: string
  avatarUrl: string | null
}

export interface ForumSummary {
  id: string
  name: string
  slug: string
  description: string | null
  topicCount: number
  createdAt: string
  updatedAt: string
}

export interface ForumDetail {
  id: string
  name: string
  slug: string
  description: string | null
  createdAt: string
  updatedAt: string
  permissions: {
    canCreateTopic: boolean
  }
}

export interface TopicLastMessageSummary {
  createdAt: string
  author: ForumUserSummary
}

export interface TopicSummary {
  id: string
  title: string
  slug: string
  isLocked: boolean
  createdAt: string
  updatedAt: string
  lastMessageAt: string
  author: ForumUserSummary
  lastMessage: TopicLastMessageSummary | null
  messageCount: number
}

export interface TopicDetail {
  id: string
  title: string
  slug: string
  isLocked: boolean
  createdAt: string
  updatedAt: string
  lastMessageAt: string
  author: ForumUserSummary
  messageCount: number
  permissions: {
    canReply: boolean
    canModerate: boolean
    canDelete: boolean
  }
}

export interface QuotedMessageSummary {
  id: string
  content: string
  createdAt: string
  author: ForumUserSummary
  isDeleted: boolean
}

export interface TopicMessage {
  id: string
  content: string
  createdAt: string
  updatedAt: string
  editedAt: string | null
  deletedAt: string | null
  isDeleted: boolean
  author: ForumUserSummary
  quotedMessage: QuotedMessageSummary | null
  permissions: {
    canEdit: boolean
    canDelete: boolean
  }
}

export type TopicMessageRealtimeEventType =
  | 'message.created'
  | 'message.updated'
  | 'message.deleted'

export interface TopicMessageRealtimeEvent {
  topicId: string
  type: TopicMessageRealtimeEventType
  message: TopicMessage
}

export interface ForumsResponse {
  viewer: ForumViewer
  forums: ForumSummary[]
}

export interface ForumPageResponse {
  viewer: ForumViewer
  forum: ForumDetail
  topics: TopicSummary[]
  pagination: PaginationInfo
}

export interface TopicPageForumSummary {
  id: string
  name: string
  slug: string
  description: string | null
}

export interface TopicPageResponse {
  viewer: ForumViewer
  forum: TopicPageForumSummary
  topic: TopicDetail
  messages: TopicMessage[]
  pagination: PaginationInfo
}

export interface CreateTopicInput {
  title: string
  content: string
}

export interface CreateMessageInput {
  content: string
  quotedMessageId?: string | null
}

export interface UpdateMessageInput {
  content: string
}

export interface CreateForumInput {
  name: string
  description: string | null
}

export interface UpdateForumInput {
  name: string
  description: string | null
}

export interface CreateAdminUserInput {
  username: string
  password: string
}

export interface TopicMutationTopicSummary {
  id: string
  slug: string
  title: string
  forumId: string
  forumSlug: string
}

export interface MessageLocation {
  id: string
  page: number
}

export interface TopicMutationResponse {
  topic: TopicMutationTopicSummary
  message: MessageLocation
  redirectTo: string
}

export interface MessageMutationResponse {
  topic: TopicMutationTopicSummary
  message: MessageLocation & {
    editedAt: string | null
  }
  redirectTo: string
}

export interface ForumAdminSummary {
  id: string
  name: string
  slug: string
  description: string | null
  createdAt: string
  updatedAt: string
}

export interface ForumAdminResponse {
  forum: ForumAdminSummary
}

export interface AdminUserSummary {
  id: string
  username: string
  role: ForumUserRole
  createdAt: string
}

export interface AdminUserResponse {
  user: AdminUserSummary
}

export interface ForumSlugParams {
  forumSlug: string
}

export interface TopicSlugParams extends ForumSlugParams {
  topicSlug: string
}

export interface ForumIdParams {
  forumId: string
}

export interface TopicIdParams {
  topicId: string
}

export interface MessageIdParams {
  messageId: string
}

export interface PageQuery {
  page: number
}
