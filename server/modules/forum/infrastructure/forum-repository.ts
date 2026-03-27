import { Prisma, UserRole } from '#server/generated/prisma/client'
import { createUniqueForumSlug, createUniqueTopicSlug } from './slugs'
import { usePrisma } from '#server/utils/prisma'
import { FORUM_PAGE_SIZE } from '#shared/types/forum'

const userSummarySelect = {
  id: true,
  username: true,
  avatarUrl: true,
} satisfies Prisma.UserSelect

export function isUniqueConstraintError(error: unknown) {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002'
}

export async function findActorById(userId: string) {
  const prisma = usePrisma()

  return prisma.user.findUnique({
    where: {
      id: userId,
    },
    select: {
      id: true,
      username: true,
      role: true,
    },
  })
}

export async function listForumsWithTopicCount() {
  const prisma = usePrisma()

  return prisma.forum.findMany({
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
}

export async function findForumBySlug(forumSlug: string) {
  const prisma = usePrisma()

  return prisma.forum.findUnique({
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
}

export async function findForumById(forumId: string) {
  const prisma = usePrisma()

  return prisma.forum.findUnique({
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
}

export async function findForumByName(name: string) {
  const prisma = usePrisma()

  return prisma.forum.findUnique({
    where: {
      name,
    },
    select: {
      id: true,
    },
  })
}

export async function countTopicsInForum(forumId: string) {
  const prisma = usePrisma()

  return prisma.topic.count({
    where: {
      forumId,
    },
  })
}

export async function listTopicsInForumPage(forumId: string, page: number) {
  const prisma = usePrisma()

  return prisma.topic.findMany({
    where: {
      forumId,
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
}

export async function findTopicForRead(forumId: string, topicSlug: string) {
  const prisma = usePrisma()

  return prisma.topic.findUnique({
    where: {
      forumId_slug: {
        forumId,
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
}

export async function listMessagesInTopicPage(topicId: string, page: number) {
  const prisma = usePrisma()

  return prisma.message.findMany({
    where: {
      topicId,
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
}

export async function createTopicWithFirstMessage(input: {
  forumId: string
  authorId: string
  title: string
  content: string
  createdAt: Date
}) {
  const prisma = usePrisma()

  return prisma.$transaction(async (transaction) => {
    const slug = await createUniqueTopicSlug(transaction, input.forumId, input.title)
    const topic = await transaction.topic.create({
      data: {
        forumId: input.forumId,
        authorId: input.authorId,
        title: input.title,
        slug,
        createdAt: input.createdAt,
        lastMessageAt: input.createdAt,
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
        authorId: input.authorId,
        content: input.content,
        createdAt: input.createdAt,
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
}

export async function findTopicForReply(forumId: string, topicSlug: string) {
  const prisma = usePrisma()

  return prisma.topic.findUnique({
    where: {
      forumId_slug: {
        forumId,
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
}

export async function createReplyAndUpdateTopic(input: {
  topicId: string
  authorId: string
  content: string
  createdAt: Date
}) {
  const prisma = usePrisma()

  return prisma.$transaction(async (transaction) => {
    const message = await transaction.message.create({
      data: {
        topicId: input.topicId,
        authorId: input.authorId,
        content: input.content,
        createdAt: input.createdAt,
      },
      select: {
        id: true,
      },
    })

    await transaction.topic.update({
      where: {
        id: input.topicId,
      },
      data: {
        lastMessageAt: input.createdAt,
      },
    })

    const totalMessages = await transaction.message.count({
      where: {
        topicId: input.topicId,
      },
    })

    return {
      messageId: message.id,
      totalMessages,
    }
  })
}

export async function findMessageForUpdate(messageId: string) {
  const prisma = usePrisma()

  return prisma.message.findUnique({
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
}

export async function updateMessageContent(messageId: string, content: string, editedAt: Date) {
  const prisma = usePrisma()

  return prisma.message.update({
    where: {
      id: messageId,
    },
    data: {
      content,
      editedAt,
    },
    select: {
      editedAt: true,
    },
  })
}

export async function countMessagesUpToPosition(
  topicId: string,
  createdAt: Date,
  messageId: string,
) {
  const prisma = usePrisma()

  return prisma.message.count({
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
}

export async function createForumRecord(input: { name: string; description: string | null }) {
  const prisma = usePrisma()

  return prisma.$transaction(async (transaction) => {
    const slug = await createUniqueForumSlug(transaction, input.name)

    return transaction.forum.create({
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
  })
}

export async function updateForumRecord(input: {
  forumId: string
  name: string
  description: string | null
}) {
  const prisma = usePrisma()

  return prisma.forum.update({
    where: {
      id: input.forumId,
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
}

export async function deleteForumRecord(forumId: string) {
  const prisma = usePrisma()

  await prisma.forum.delete({
    where: {
      id: forumId,
    },
  })
}

export async function findUserByUsername(username: string) {
  const prisma = usePrisma()

  return prisma.user.findUnique({
    where: {
      username,
    },
    select: {
      id: true,
    },
  })
}

export async function createAdminUserRecord(input: { username: string; passwordHash: string }) {
  const prisma = usePrisma()

  return prisma.user.create({
    data: {
      username: input.username,
      passwordHash: input.passwordHash,
      role: UserRole.ADMIN,
    },
    select: {
      id: true,
      username: true,
      role: true,
      createdAt: true,
    },
  })
}

export async function findTopicById(topicId: string) {
  const prisma = usePrisma()

  return prisma.topic.findUnique({
    where: {
      id: topicId,
    },
    select: {
      id: true,
    },
  })
}

export async function deleteTopicRecord(topicId: string) {
  const prisma = usePrisma()

  await prisma.topic.delete({
    where: {
      id: topicId,
    },
  })
}

export async function findMessageForModeration(messageId: string) {
  const prisma = usePrisma()

  return prisma.message.findUnique({
    where: {
      id: messageId,
    },
    select: {
      id: true,
      deletedAt: true,
    },
  })
}

export async function markMessageDeleted(input: {
  messageId: string
  actorId: string
  deletedAt: Date
}) {
  const prisma = usePrisma()

  await prisma.message.update({
    where: {
      id: input.messageId,
    },
    data: {
      deletedAt: input.deletedAt,
      deletedByUserId: input.actorId,
    },
  })
}
