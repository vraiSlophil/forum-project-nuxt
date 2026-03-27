import type { Prisma } from '#server/generated/prisma/client'

const FORUM_SLUG_MAX_LENGTH = 160
const TOPIC_SLUG_MAX_LENGTH = 200
const MAX_SUFFIX_ATTEMPTS = 1000

type SlugClient = Pick<Prisma.TransactionClient, 'forum' | 'topic'>

function toBaseSlug(input: string, fallback: string, maxLength: number) {
  const baseSlug = input
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

  const trimmedSlug = baseSlug.slice(0, maxLength).replace(/-+$/g, '')

  return trimmedSlug || fallback
}

function withNumericSuffix(baseSlug: string, attempt: number, maxLength: number) {
  if (attempt === 0) {
    return baseSlug
  }

  const suffix = `-${attempt + 1}`
  const prefixLength = Math.max(1, maxLength - suffix.length)
  const prefix = baseSlug.slice(0, prefixLength).replace(/-+$/g, '')

  return `${prefix || baseSlug.slice(0, 1)}${suffix}`
}

async function generateUniqueSlug(
  baseSlug: string,
  maxLength: number,
  exists: (candidate: string) => Promise<boolean>,
) {
  for (let attempt = 0; attempt < MAX_SUFFIX_ATTEMPTS; attempt += 1) {
    const candidate = withNumericSuffix(baseSlug, attempt, maxLength)

    if (!(await exists(candidate))) {
      return candidate
    }
  }

  throw new Error('Unable to generate a unique slug')
}

export async function createUniqueForumSlug(prisma: SlugClient, name: string) {
  const baseSlug = toBaseSlug(name, 'forum', FORUM_SLUG_MAX_LENGTH)

  return generateUniqueSlug(baseSlug, FORUM_SLUG_MAX_LENGTH, async (candidate) => {
    const forum = await prisma.forum.findUnique({
      where: {
        slug: candidate,
      },
      select: {
        id: true,
      },
    })

    return forum !== null
  })
}

export async function createUniqueTopicSlug(prisma: SlugClient, forumId: string, title: string) {
  const baseSlug = toBaseSlug(title, 'topic', TOPIC_SLUG_MAX_LENGTH)

  return generateUniqueSlug(baseSlug, TOPIC_SLUG_MAX_LENGTH, async (candidate) => {
    const topic = await prisma.topic.findUnique({
      where: {
        forumId_slug: {
          forumId,
          slug: candidate,
        },
      },
      select: {
        id: true,
      },
    })

    return topic !== null
  })
}
