import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '../generated/prisma/client'
import { buildPostgresConnectionString } from './database-url'

type GlobalPrisma = typeof globalThis & {
  __prisma?: PrismaClient
}

function createPrismaClient() {
  const connectionString = buildPostgresConnectionString()

  return new PrismaClient({
    adapter: new PrismaPg({ connectionString }),
  })
}

export function usePrisma() {
  const globalScope = globalThis as GlobalPrisma

  if (!globalScope.__prisma) {
    globalScope.__prisma = createPrismaClient()
  }

  return globalScope.__prisma
}
