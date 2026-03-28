import { Prisma, UserRole } from '#server/generated/prisma/client'
import { usePrisma } from '#server/utils/prisma'

export function isUniqueConstraintError(error: unknown) {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002'
}

export async function findSessionActorById(userId: string) {
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

export async function findAnyAdminUser() {
  const prisma = usePrisma()

  return prisma.user.findFirst({
    where: {
      role: UserRole.ADMIN,
    },
    orderBy: {
      createdAt: 'asc',
    },
    select: {
      id: true,
      username: true,
      role: true,
      createdAt: true,
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
      username: true,
      role: true,
      createdAt: true,
    },
  })
}

export async function findUserCredentialsByUsername(username: string) {
  const prisma = usePrisma()

  return prisma.user.findUnique({
    where: {
      username,
    },
    select: {
      id: true,
      username: true,
      passwordHash: true,
      role: true,
      createdAt: true,
    },
  })
}

export async function findUserCredentialsById(userId: string) {
  const prisma = usePrisma()

  return prisma.user.findUnique({
    where: {
      id: userId,
    },
    select: {
      id: true,
      username: true,
      passwordHash: true,
      role: true,
      createdAt: true,
    },
  })
}

export async function createUserRecord(input: {
  username: string
  passwordHash: string
  role: UserRole
}) {
  const prisma = usePrisma()

  return prisma.user.create({
    data: {
      username: input.username,
      passwordHash: input.passwordHash,
      role: input.role,
    },
    select: {
      id: true,
      username: true,
      role: true,
      createdAt: true,
    },
  })
}

export async function updateUserPasswordHash(input: { userId: string; passwordHash: string }) {
  const prisma = usePrisma()

  return prisma.user.update({
    where: {
      id: input.userId,
    },
    data: {
      passwordHash: input.passwordHash,
    },
    select: {
      id: true,
      username: true,
      role: true,
      createdAt: true,
      updatedAt: true,
    },
  })
}
