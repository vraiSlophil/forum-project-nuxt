import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient, UserRole } from '../../../server/generated/prisma/client'
import { buildPostgresConnectionString } from '../../../server/utils/database-url'

type GlobalPrisma = typeof globalThis & {
  __forumTestPrisma?: PrismaClient
}

function createPrismaClient() {
  return new PrismaClient({
    adapter: new PrismaPg({
      connectionString: buildPostgresConnectionString(),
    }),
  })
}

export function getTestPrisma() {
  const globalScope = globalThis as GlobalPrisma

  if (!globalScope.__forumTestPrisma) {
    globalScope.__forumTestPrisma = createPrismaClient()
  }

  return globalScope.__forumTestPrisma
}

export async function resetForumDatabase() {
  const prisma = getTestPrisma()

  await prisma.message.deleteMany()
  await prisma.topic.deleteMany()
  await prisma.forum.deleteMany()
  await prisma.user.deleteMany()
}

export async function seedForumScenario() {
  const prisma = getTestPrisma()

  const admin = await prisma.user.create({
    data: {
      id: '00000000-0000-4000-8000-000000000001',
      username: 'admin',
      passwordHash: 'test-hash',
      role: UserRole.ADMIN,
    },
  })
  const user = await prisma.user.create({
    data: {
      id: '00000000-0000-4000-8000-000000000002',
      username: 'alice',
      passwordHash: 'test-hash',
      role: UserRole.USER,
    },
  })
  const forum = await prisma.forum.create({
    data: {
      id: '00000000-0000-4000-8000-000000000010',
      name: 'Général',
      slug: 'general',
      description: 'Discussions générales',
      createdAt: new Date('2026-03-01T10:00:00.000Z'),
      updatedAt: new Date('2026-03-01T10:00:00.000Z'),
    },
  })
  const topic = await prisma.topic.create({
    data: {
      id: '00000000-0000-4000-8000-000000000020',
      forumId: forum.id,
      authorId: user.id,
      title: 'Bienvenue',
      slug: 'bienvenue',
      createdAt: new Date('2026-03-01T10:00:00.000Z'),
      updatedAt: new Date('2026-03-01T10:00:00.000Z'),
      lastMessageAt: new Date('2026-03-01T10:00:00.000Z'),
    },
  })
  const message = await prisma.message.create({
    data: {
      id: '00000000-0000-4000-8000-000000000030',
      topicId: topic.id,
      authorId: user.id,
      content: 'Premier message',
      createdAt: new Date('2026-03-01T10:00:00.000Z'),
      updatedAt: new Date('2026-03-01T10:00:00.000Z'),
    },
  })

  return {
    admin,
    user,
    forum,
    topic,
    message,
  }
}

export async function disconnectForumDatabase() {
  const prisma = getTestPrisma()

  await prisma.$disconnect()
}
