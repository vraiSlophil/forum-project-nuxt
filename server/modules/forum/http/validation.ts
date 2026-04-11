import type {
  PatchMessageInput,
  CreateAdminUserInput,
  CreateForumInput,
  CreateMessageInput,
  CreateTopicInput,
  ForumIdParams,
  ForumSlugParams,
  MessageIdParams,
  PageQuery,
  TopicIdParams,
  TopicSlugParams,
  UpdateForumInput,
  UpdateMessageInput,
} from '#shared/types/forum'
import { createError } from 'h3'

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

type JsonObject = Record<string, unknown>

function readObject(value: unknown, label: string): JsonObject {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw createError({
      statusCode: 400,
      statusMessage: `Invalid ${label}`,
    })
  }

  return value as JsonObject
}

function readRequiredString(
  value: unknown,
  field: string,
  options: {
    maxLength?: number
  } = {},
) {
  if (typeof value !== 'string') {
    throw createError({
      statusCode: 400,
      statusMessage: `Field "${field}" must be a string`,
    })
  }

  const parsedValue = value.trim()

  if (!parsedValue) {
    throw createError({
      statusCode: 400,
      statusMessage: `Field "${field}" is required`,
    })
  }

  if (options.maxLength && parsedValue.length > options.maxLength) {
    throw createError({
      statusCode: 400,
      statusMessage: `Field "${field}" must not exceed ${options.maxLength} characters`,
    })
  }

  return parsedValue
}

function readOptionalString(
  value: unknown,
  field: string,
  options: {
    maxLength?: number
  } = {},
) {
  if (value === undefined || value === null) {
    return null
  }

  if (typeof value !== 'string') {
    throw createError({
      statusCode: 400,
      statusMessage: `Field "${field}" must be a string`,
    })
  }

  const parsedValue = value.trim()

  if (!parsedValue) {
    return null
  }

  if (options.maxLength && parsedValue.length > options.maxLength) {
    throw createError({
      statusCode: 400,
      statusMessage: `Field "${field}" must not exceed ${options.maxLength} characters`,
    })
  }

  return parsedValue
}

function readPassword(value: unknown) {
  if (typeof value !== 'string') {
    throw createError({
      statusCode: 400,
      statusMessage: 'Field "password" must be a string',
    })
  }

  if (!value.trim()) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Field "password" is required',
    })
  }

  if (value.length > 255) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Field "password" must not exceed 255 characters',
    })
  }

  return value
}

function readSlug(value: unknown, field: string) {
  const slug = readRequiredString(value, field)

  if (!SLUG_PATTERN.test(slug)) {
    throw createError({
      statusCode: 400,
      statusMessage: `Field "${field}" must be a lowercase slug`,
    })
  }

  return slug
}

function readUuid(value: unknown, field: string) {
  const uuid = readRequiredString(value, field)

  if (!UUID_PATTERN.test(uuid)) {
    throw createError({
      statusCode: 400,
      statusMessage: `Field "${field}" must be a valid UUID`,
    })
  }

  return uuid
}

function readOptionalUuid(value: unknown, field: string) {
  if (value === undefined || value === null) {
    return null
  }

  if (typeof value !== 'string') {
    throw createError({
      statusCode: 400,
      statusMessage: `Field "${field}" must be a string`,
    })
  }

  const uuid = value.trim()

  if (!uuid) {
    return null
  }

  if (!UUID_PATTERN.test(uuid)) {
    throw createError({
      statusCode: 400,
      statusMessage: `Field "${field}" must be a valid UUID`,
    })
  }

  return uuid
}

export function validatePageQuery(value: unknown): PageQuery {
  const query = readObject(value, 'query')
  const rawPage = query.page

  if (rawPage === undefined) {
    return { page: 1 }
  }

  if (typeof rawPage !== 'string' || !/^[1-9]\d*$/.test(rawPage)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Query parameter "page" must be a positive integer',
    })
  }

  return {
    page: Number(rawPage),
  }
}

export function validateForumSlugParams(value: unknown): ForumSlugParams {
  const params = readObject(value, 'route params')

  return {
    forumSlug: readSlug(params.forumSlug, 'forumSlug'),
  }
}

export function validateTopicSlugParams(value: unknown): TopicSlugParams {
  const params = readObject(value, 'route params')

  return {
    forumSlug: readSlug(params.forumSlug, 'forumSlug'),
    topicSlug: readSlug(params.topicSlug, 'topicSlug'),
  }
}

export function validateForumIdParams(value: unknown): ForumIdParams {
  const params = readObject(value, 'route params')

  return {
    forumId: readUuid(params.forumId, 'forumId'),
  }
}

export function validateTopicIdParams(value: unknown): TopicIdParams {
  const params = readObject(value, 'route params')

  return {
    topicId: readUuid(params.topicId, 'topicId'),
  }
}

export function validateMessageIdParams(value: unknown): MessageIdParams {
  const params = readObject(value, 'route params')

  return {
    messageId: readUuid(params.messageId, 'messageId'),
  }
}

export function validateCreateTopicInput(value: unknown): CreateTopicInput {
  const body = readObject(value, 'request body')

  return {
    title: readRequiredString(body.title, 'title', {
      maxLength: 200,
    }),
    content: readRequiredString(body.content, 'content'),
  }
}

export function validateCreateMessageInput(value: unknown): CreateMessageInput {
  const body = readObject(value, 'request body')

  return {
    content: readRequiredString(body.content, 'content'),
    quotedMessageId: readOptionalUuid(body.quotedMessageId, 'quotedMessageId'),
  }
}

export function validateUpdateMessageInput(value: unknown): UpdateMessageInput {
  const body = readObject(value, 'request body')

  return {
    content: readRequiredString(body.content, 'content'),
  }
}

export function validatePatchMessageInput(value: unknown): PatchMessageInput {
  const body = readObject(value, 'request body')

  if (body.action === 'moderate-delete') {
    return {
      action: 'moderate-delete',
    }
  }

  return {
    content: readRequiredString(body.content, 'content'),
  }
}

export function validateCreateForumInput(value: unknown): CreateForumInput {
  const body = readObject(value, 'request body')

  return {
    name: readRequiredString(body.name, 'name', {
      maxLength: 120,
    }),
    description: readOptionalString(body.description, 'description'),
  }
}

export function validateUpdateForumInput(value: unknown): UpdateForumInput {
  const body = readObject(value, 'request body')

  return {
    name: readRequiredString(body.name, 'name', {
      maxLength: 120,
    }),
    description: readOptionalString(body.description, 'description'),
  }
}

export function validateCreateAdminUserInput(value: unknown): CreateAdminUserInput {
  const body = readObject(value, 'request body')

  return {
    username: readRequiredString(body.username, 'username', {
      maxLength: 50,
    }),
    password: readPassword(body.password),
  }
}
