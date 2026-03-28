import {
  AUTH_PASSWORD_MAX_LENGTH,
  AUTH_PASSWORD_MIN_LENGTH,
  AUTH_USERNAME_MAX_LENGTH,
  AUTH_USERNAME_MIN_LENGTH,
  type ChangePasswordInput,
  type LoginUserInput,
  type RegisterUserInput,
} from '#shared/types/auth'
import { createError } from 'h3'

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
    minLength?: number
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

  if (options.minLength && parsedValue.length < options.minLength) {
    throw createError({
      statusCode: 400,
      statusMessage: `Field "${field}" must be at least ${options.minLength} characters`,
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

function readPassword(value: unknown, field: string) {
  if (typeof value !== 'string') {
    throw createError({
      statusCode: 400,
      statusMessage: `Field "${field}" must be a string`,
    })
  }

  if (!value.trim()) {
    throw createError({
      statusCode: 400,
      statusMessage: `Field "${field}" is required`,
    })
  }

  if (value.length < AUTH_PASSWORD_MIN_LENGTH) {
    throw createError({
      statusCode: 400,
      statusMessage: `Field "${field}" must be at least ${AUTH_PASSWORD_MIN_LENGTH} characters`,
    })
  }

  if (value.length > AUTH_PASSWORD_MAX_LENGTH) {
    throw createError({
      statusCode: 400,
      statusMessage: `Field "${field}" must not exceed ${AUTH_PASSWORD_MAX_LENGTH} characters`,
    })
  }

  return value
}

export function validateRegisterUserInput(value: unknown): RegisterUserInput {
  const body = readObject(value, 'request body')

  return {
    username: readRequiredString(body.username, 'username', {
      minLength: AUTH_USERNAME_MIN_LENGTH,
      maxLength: AUTH_USERNAME_MAX_LENGTH,
    }),
    password: readPassword(body.password, 'password'),
  }
}

export function validateLoginUserInput(value: unknown): LoginUserInput {
  const body = readObject(value, 'request body')

  return {
    username: readRequiredString(body.username, 'username', {
      minLength: AUTH_USERNAME_MIN_LENGTH,
      maxLength: AUTH_USERNAME_MAX_LENGTH,
    }),
    password: readPassword(body.password, 'password'),
  }
}

export function validateChangePasswordInput(value: unknown): ChangePasswordInput {
  const body = readObject(value, 'request body')

  return {
    currentPassword: readPassword(body.currentPassword, 'currentPassword'),
    newPassword: readPassword(body.newPassword, 'newPassword'),
  }
}
