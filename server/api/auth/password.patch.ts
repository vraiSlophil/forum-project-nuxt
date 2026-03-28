import { changePassword } from '#server/modules/auth/application/commands/change-password'
import { requireAuthenticatedActor } from '#server/modules/auth/infrastructure/current-user'
import { defineAuthHttpHandler } from '#server/modules/auth/http/handler'
import { validateChangePasswordInput } from '#server/modules/auth/http/validation'
import { readValidatedBody } from 'h3'

export default defineAuthHttpHandler(async (event) => {
  const actor = await requireAuthenticatedActor(event)
  const input = await readValidatedBody(event, validateChangePasswordInput)

  return changePassword(actor, input)
})
