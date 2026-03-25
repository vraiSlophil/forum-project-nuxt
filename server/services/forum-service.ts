import { hashPassword } from '#imports'
import { Prisma, UserRole } from '#server/generated/prisma/client'
import {
  buildViewerState,
  canEditMessage,
  canModerate,
  type ForumActor,
  type SessionForumUser,
} from '#server/utils/forum-auth'
import { createUniqueForumSlug, createUniqueTopicSlug } from '#server/utils/forum-slug'
import { usePrisma } from '#server/utils/prisma'
import {
  FORUM_PAGE_SIZE,
  type AdminUserResponse,
  type CreateAdminUserInput,
  type CreateForumInput,
  type CreateMessageInput,
  type CreateTopicInput,
  type ForumAdminResponse,
  type ForumAdminSummary,
  type ForumPageResponse,
  type ForumsResponse,
  type ForumUserSummary,
  type MessageMutationResponse,
  type PaginationInfo,
  type QuotedMessageSummary,
  type TopicMessage,
  type TopicMutationResponse,
  type TopicPageResponse,
  type UpdateForumInput,
  type UpdateMessageInput,
} from '#shared/types/forum'
import { createError } from 'h3'

const deletedMessagePlaceholder = 'Ce message a ete supprime par la moderation.'

const userSummarySelect = {
  id: true,
  username: true,
  avatarUrl: true,
} satisfies Prisma.UserSelect

type UserSummaryRecord = {
  id: string
  username: string
  avatarUrl: string | null
}

function toIsoString(value: Date | null) {
  return value ? value.toISOString() : null
}

function serializeUserSummary(user: UserSummaryRecord): ForumUserSummary {
  return {
    id: user.id,
    username: user.username,
    avatarUrl: user.avatarUrl,
  }
}

function serializeForumSummary(forum: {
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

function createPagination(page: number, totalItems: number): PaginationInfo {
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

function assertPageInRange(page: number, totalItems: number) {
  const pagination = createPagination(page, totalItems)

  if (page > pagination.totalPages) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Page not found',
    })
  }

  return pagination
}

function buildTopicPath(forumSlug: string, topicSlug: string) {
  return `/forums/${forumSlug}/topics/${topicSlug}`
}

function buildMessageRedirect(
  forumSlug: string,
  topicSlug: string,
  page: number,
  messageId: string,
) {
  const pageSuffix = page > 1 ? `?page=${page}` : ''

  return `${buildTopicPath(forumSlug, topicSlug)}${pageSuffix}#message-${messageId}`
}

function rethrowUniqueConstraint(error: unknown, message: string): never {
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
    throw createError({
      statusCode: 409,
      statusMessage: message,
    })
  }

  throw error
}

async function getForumBySlugOrThrow(forumSlug: string) {
  const prisma = usePrisma()
  const forum = await prisma.forum.findUnique({
    where: {
      slug: forumSlug,
    },
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      createdAt: true,
      updatedAt: true,
    },
  })

  if (!forum) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Forum not found',
    })
  }

  return forum
}

async function getMessagePage(topicId: string, createdAt: Date, messageId: string) {
  const prisma = usePrisma()
  const position = await prisma.message.count({
    where: {
      topicId,
      OR: [
        {
          createdAt: {
            lt: createdAt,
          },
        },
        {
          AND: [
            {
              createdAt,
            },
            {
              id: {
                lte: messageId,
              },
            },
          ],
        },
      ],
    },
  })

  return Math.max(1, Math.ceil(position / FORUM_PAGE_SIZE))
}

function serializeQuotedMessage(
  quotedMessage: {
    id: string
    content: string
    createdAt: Date
    deletedAt: Date | null
    author: UserSummaryRecord
  },
  viewer: SessionForumUser | null,
): QuotedMessageSummary {
  const messageIsDeleted = quotedMessage.deletedAt !== null

  return {
    id: quotedMessage.id,
    content:
      messageIsDeleted && !canModerate(viewer) ? deletedMessagePlaceholder : quotedMessage.content,
    createdAt: quotedMessage.createdAt.toISOString(),
    author: serializeUserSummary(quotedMessage.author),
    isDeleted: messageIsDeleted,
  }
}

function serializeTopicMessage(
  message: {
    id: string
    authorId: string
    content: string
    createdAt: Date
    updatedAt: Date
    editedAt: Date | null
    deletedAt: Date | null
    author: UserSummaryRecord
    quotedMessage: {
      id: string
      content: string
      createdAt: Date
      deletedAt: Date | null
      author: UserSummaryRecord
    } | null
  },
  viewer: SessionForumUser | null,
): TopicMessage {
  const messageIsDeleted = message.deletedAt !== null

  return {
    id: message.id,
    content: messageIsDeleted && !canModerate(viewer) ? deletedMessagePlaceholder : message.content,
    createdAt: message.createdAt.toISOString(),
    updatedAt: message.updatedAt.toISOString(),
    editedAt: toIsoString(message.editedAt),
    deletedAt: toIsoString(message.deletedAt),
    isDeleted: messageIsDeleted,
    author: serializeUserSummary(message.author),
    quotedMessage: message.quotedMessage
      ? serializeQuotedMessage(message.quotedMessage, viewer)
      : null,
    permissions: {
      canEdit: canEditMessage(viewer, message.authorId, messageIsDeleted),
      canDelete: canModerate(viewer) && !messageIsDeleted,
    },
  }
}

export async function listForums(viewer: SessionForumUser | null): Promise<ForumsResponse> {
  const prisma = usePrisma()
  const forums = await prisma.forum.findMany({
    orderBy: [
      {
        name: 'asc',
      },
    ],
    include: {
      _count: {
        select: {
          topics: true,
        },
      },
    },
  })

  return {
    viewer: buildViewerState(viewer),
    forums: forums.map((forum) => ({
      id: forum.id,
      name: forum.name,
      slug: forum.slug,
      description: forum.description,
      topicCount: forum._count.topics,
      createdAt: forum.createdAt.toISOString(),
      updatedAt: forum.updatedAt.toISOString(),
    })),
  }
}

export async function getForumPage(
  forumSlug: string,
  page: number,
  viewer: SessionForumUser | null,
): Promise<ForumPageResponse> {
  const prisma = usePrisma()
  const forum = await getForumBySlugOrThrow(forumSlug)
  const totalTopics = await prisma.topic.count({
    where: {
      forumId: forum.id,
    },
  })
  const pagination = assertPageInRange(page, totalTopics)
  const topics = await prisma.topic.findMany({
    where: {
      forumId: forum.id,
    },
    skip: (page - 1) * FORUM_PAGE_SIZE,
    take: FORUM_PAGE_SIZE,
    orderBy: [
      {
        lastMessageAt: 'desc',
      },
      {
        createdAt: 'desc',
      },
      {
        id: 'desc',
      },
    ],
    select: {
      id: true,
      title: true,
      slug: true,
      isLocked: true,
      createdAt: true,
      updatedAt: true,
      lastMessageAt: true,
      author: {
        select: userSummarySelect,
      },
      _count: {
        select: {
          messages: true,
        },
      },
      messages: {
        take: 1,
        orderBy: [
          {
            createdAt: 'desc',
          },
          {
            id: 'desc',
          },
        ],
        select: {
          id: true,
          createdAt: true,
          author: {
            select: userSummarySelect,
          },
        },
      },
    },
  })

  return {
    viewer: buildViewerState(viewer),
    forum: {
      id: forum.id,
      name: forum.name,
      slug: forum.slug,
      description: forum.description,
      createdAt: forum.createdAt.toISOString(),
      updatedAt: forum.updatedAt.toISOString(),
      permissions: {
        canCreateTopic: viewer !== null,
      },
    },
    topics: topics.map((topic) => ({
      id: topic.id,
      title: topic.title,
      slug: topic.slug,
      isLocked: topic.isLocked,
      createdAt: topic.createdAt.toISOString(),
      updatedAt: topic.updatedAt.toISOString(),
      lastMessageAt: topic.lastMessageAt.toISOString(),
      author: serializeUserSummary(topic.author),
      lastMessage: topic.messages[0]
        ? {
            createdAt: topic.messages[0].createdAt.toISOString(),
            author: serializeUserSummary(topic.messages[0].author),
          }
        : null,
      messageCount: topic._count.messages,
    })),
    pagination,
  }
}

export async function getTopicPage(
  forumSlug: string,
  topicSlug: string,
  page: number,
  viewer: SessionForumUser | null,
): Promise<TopicPageResponse> {
  const prisma = usePrisma()
  const forum = await getForumBySlugOrThrow(forumSlug)
  const topic = await prisma.topic.findUnique({
    where: {
      forumId_slug: {
        forumId: forum.id,
        slug: topicSlug,
      },
    },
    select: {
      id: true,
      title: true,
      slug: true,
      isLocked: true,
      createdAt: true,
      updatedAt: true,
      lastMessageAt: true,
      author: {
        select: userSummarySelect,
      },
      _count: {
        select: {
          messages: true,
        },
      },
    },
  })

  if (!topic) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Topic not found',
    })
  }

  const pagination = assertPageInRange(page, topic._count.messages)
  const messages = await prisma.message.findMany({
    where: {
      topicId: topic.id,
    },
    skip: (page - 1) * FORUM_PAGE_SIZE,
    take: FORUM_PAGE_SIZE,
    orderBy: [
      {
        createdAt: 'asc',
      },
      {
        id: 'asc',
      },
    ],
    select: {
      id: true,
      authorId: true,
      content: true,
      createdAt: true,
      updatedAt: true,
      editedAt: true,
      deletedAt: true,
      author: {
        select: userSummarySelect,
      },
      quotedMessage: {
        select: {
          id: true,
          content: true,
          createdAt: true,
          deletedAt: true,
          author: {
            select: userSummarySelect,
          },
        },
      },
    },
  })

  const viewerCanModerate = canModerate(viewer)

  return {
    viewer: buildViewerState(viewer),
    forum: {
      id: forum.id,
      name: forum.name,
      slug: forum.slug,
      description: forum.description,
    },
    topic: {
      id: topic.id,
      title: topic.title,
      slug: topic.slug,
      isLocked: topic.isLocked,
      createdAt: topic.createdAt.toISOString(),
      updatedAt: topic.updatedAt.toISOString(),
      lastMessageAt: topic.lastMessageAt.toISOString(),
      author: serializeUserSummary(topic.author),
      messageCount: topic._count.messages,
      permissions: {
        canReply: viewer !== null && !topic.isLocked,
        canModerate: viewerCanModerate,
        canDelete: viewerCanModerate,
      },
    },
    messages: messages.map((message) => serializeTopicMessage(message, viewer)),
    pagination,
  }
}

export async function createTopic(
  actor: ForumActor,
  forumSlug: string,
  input: CreateTopicInput,
): Promise<TopicMutationResponse> {
  const prisma = usePrisma()
  const forum = await getForumBySlugOrThrow(forumSlug)
  const now = new Date()

  try {
    const result = await prisma.$transaction(async (transaction) => {
      const slug = await createUniqueTopicSlug(transaction, forum.id, input.title)
      const topic = await transaction.topic.create({
        data: {
          forumId: forum.id,
          authorId: actor.id,
          title: input.title,
          slug,
          createdAt: now,
          lastMessageAt: now,
        },
        select: {
          id: true,
          title: true,
          slug: true,
        },
      })
      const message = await transaction.message.create({
        data: {
          topicId: topic.id,
          authorId: actor.id,
          content: input.content,
          createdAt: now,
        },
        select: {
          id: true,
        },
      })

      return {
        topic,
        message,
      }
    })

    return {
      topic: {
        id: result.topic.id,
        slug: result.topic.slug,
        title: result.topic.title,
        forumId: forum.id,
        forumSlug: forum.slug,
      },
      message: {
        id: result.message.id,
        page: 1,
      },
      redirectTo: buildMessageRedirect(forum.slug, result.topic.slug, 1, result.message.id),
    }
  } catch (error) {
    rethrowUniqueConstraint(error, 'A topic with the same URL already exists in this forum')
  }
}

export async function createReply(
  actor: ForumActor,
  forumSlug: string,
  topicSlug: string,
  input: CreateMessageInput,
): Promise<TopicMutationResponse> {
  const prisma = usePrisma()
  const forum = await getForumBySlugOrThrow(forumSlug)
  const topic = await prisma.topic.findUnique({
    where: {
      forumId_slug: {
        forumId: forum.id,
        slug: topicSlug,
      },
    },
    select: {
      id: true,
      title: true,
      slug: true,
      isLocked: true,
    },
  })

  if (!topic) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Topic not found',
    })
  }

  if (topic.isLocked) {
    throw createError({
      statusCode: 423,
      statusMessage: 'Topic is locked',
    })
  }

  const now = new Date()
  const result = await prisma.$transaction(async (transaction) => {
    const message = await transaction.message.create({
      data: {
        topicId: topic.id,
        authorId: actor.id,
        content: input.content,
        createdAt: now,
      },
      select: {
        id: true,
      },
    })

    await transaction.topic.update({
      where: {
        id: topic.id,
      },
      data: {
        lastMessageAt: now,
      },
    })

    const totalMessages = await transaction.message.count({
      where: {
        topicId: topic.id,
      },
    })

    return {
      messageId: message.id,
      page: Math.max(1, Math.ceil(totalMessages / FORUM_PAGE_SIZE)),
    }
  })

  return {
    topic: {
      id: topic.id,
      slug: topic.slug,
      title: topic.title,
      forumId: forum.id,
      forumSlug: forum.slug,
    },
    message: {
      id: result.messageId,
      page: result.page,
    },
    redirectTo: buildMessageRedirect(forum.slug, topic.slug, result.page, result.messageId),
  }
}

export async function updateMessage(
  actor: ForumActor,
  messageId: string,
  input: UpdateMessageInput,
): Promise<MessageMutationResponse> {
  const prisma = usePrisma()
  const message = await prisma.message.findUnique({
    where: {
      id: messageId,
    },
    select: {
      id: true,
      topicId: true,
      authorId: true,
      content: true,
      createdAt: true,
      editedAt: true,
      deletedAt: true,
      topic: {
        select: {
          id: true,
          title: true,
          slug: true,
          forumId: true,
          forum: {
            select: {
              slug: true,
            },
          },
        },
      },
    },
  })

  if (!message) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Message not found',
    })
  }

  if (message.deletedAt) {
    throw createError({
      statusCode: 409,
      statusMessage: 'Deleted messages cannot be edited',
    })
  }

  if (actor.role !== UserRole.ADMIN && actor.id !== message.authorId) {
    throw createError({
      statusCode: 403,
      statusMessage: 'You cannot edit this message',
    })
  }

  let editedAt = message.editedAt

  if (message.content !== input.content) {
    const updatedMessage = await prisma.message.update({
      where: {
        id: message.id,
      },
      data: {
        content: input.content,
        editedAt: new Date(),
      },
      select: {
        editedAt: true,
      },
    })

    editedAt = updatedMessage.editedAt
  }

  const page = await getMessagePage(message.topicId, message.createdAt, message.id)

  return {
    topic: {
      id: message.topic.id,
      slug: message.topic.slug,
      title: message.topic.title,
      forumId: message.topic.forumId,
      forumSlug: message.topic.forum.slug,
    },
    message: {
      id: message.id,
      page,
      editedAt: toIsoString(editedAt),
    },
    redirectTo: buildMessageRedirect(
      message.topic.forum.slug,
      message.topic.slug,
      page,
      message.id,
    ),
  }
}

export async function createForum(input: CreateForumInput): Promise<ForumAdminResponse> {
  const prisma = usePrisma()
  const existingForum = await prisma.forum.findUnique({
    where: {
      name: input.name,
    },
    select: {
      id: true,
    },
  })

  if (existingForum) {
    throw createError({
      statusCode: 409,
      statusMessage: 'A forum with this name already exists',
    })
  }

  try {
    const slug = await createUniqueForumSlug(prisma, input.name)
    const forum = await prisma.forum.create({
      data: {
        name: input.name,
        slug,
        description: input.description,
      },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    return {
      forum: serializeForumSummary(forum),
    }
  } catch (error) {
    rethrowUniqueConstraint(error, 'A forum with this name already exists')
  }
}

export async function updateForum(
  forumId: string,
  input: UpdateForumInput,
): Promise<ForumAdminResponse> {
  const prisma = usePrisma()
  const forum = await prisma.forum.findUnique({
    where: {
      id: forumId,
    },
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      createdAt: true,
      updatedAt: true,
    },
  })

  if (!forum) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Forum not found',
    })
  }

  if (forum.name !== input.name) {
    const conflictingForum = await prisma.forum.findUnique({
      where: {
        name: input.name,
      },
      select: {
        id: true,
      },
    })

    if (conflictingForum && conflictingForum.id !== forum.id) {
      throw createError({
        statusCode: 409,
        statusMessage: 'A forum with this name already exists',
      })
    }
  }

  if (forum.name === input.name && forum.description === input.description) {
    return {
      forum: serializeForumSummary(forum),
    }
  }

  try {
    const updatedForum = await prisma.forum.update({
      where: {
        id: forum.id,
      },
      data: {
        name: input.name,
        description: input.description,
      },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    return {
      forum: serializeForumSummary(updatedForum),
    }
  } catch (error) {
    rethrowUniqueConstraint(error, 'A forum with this name already exists')
  }
}

export async function deleteForum(forumId: string) {
  const prisma = usePrisma()
  const forum = await prisma.forum.findUnique({
    where: {
      id: forumId,
    },
    select: {
      id: true,
    },
  })

  if (!forum) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Forum not found',
    })
  }

  await prisma.forum.delete({
    where: {
      id: forum.id,
    },
  })
}

export async function createAdminUser(input: CreateAdminUserInput): Promise<AdminUserResponse> {
  const prisma = usePrisma()
  const existingUser = await prisma.user.findUnique({
    where: {
      username: input.username,
    },
    select: {
      id: true,
    },
  })

  if (existingUser) {
    throw createError({
      statusCode: 409,
      statusMessage: 'A user with this username already exists',
    })
  }

  try {
    const passwordHash = await hashPassword(input.password)
    const user = await prisma.user.create({
      data: {
        username: input.username,
        passwordHash,
        role: UserRole.ADMIN,
      },
      select: {
        id: true,
        username: true,
        role: true,
        createdAt: true,
      },
    })

    return {
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        createdAt: user.createdAt.toISOString(),
      },
    }
  } catch (error) {
    rethrowUniqueConstraint(error, 'A user with this username already exists')
  }
}

export async function deleteTopic(topicId: string) {
  const prisma = usePrisma()
  const topic = await prisma.topic.findUnique({
    where: {
      id: topicId,
    },
    select: {
      id: true,
    },
  })

  if (!topic) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Topic not found',
    })
  }

  await prisma.topic.delete({
    where: {
      id: topic.id,
    },
  })
}

export async function moderateMessage(actor: ForumActor, messageId: string) {
  const prisma = usePrisma()
  const message = await prisma.message.findUnique({
    where: {
      id: messageId,
    },
    select: {
      id: true,
      deletedAt: true,
    },
  })

  if (!message) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Message not found',
    })
  }

  if (message.deletedAt) {
    return
  }

  await prisma.message.update({
    where: {
      id: message.id,
    },
    data: {
      deletedAt: new Date(),
      deletedByUserId: actor.id,
    },
  })
}
