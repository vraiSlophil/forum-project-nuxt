import { registerUser } from '#server/modules/auth/application/commands/register-user'
import { defineAuthHttpHandler } from '#server/modules/auth/http/handler'
import { validateRegisterUserInput } from '#server/modules/auth/http/validation'
import { replaceAppUserSession } from '#server/utils/user-session'
import { readValidatedBody, setResponseStatus } from 'h3'

export default defineAuthHttpHandler(async (event) => {
  const input = await readValidatedBody(event, validateRegisterUserInput)
  const result = await registerUser(input)

  await replaceAppUserSession(event, {
    user: result.sessionUser,
    loggedInAt: result.response.loggedInAt,
  })

  setResponseStatus(event, 201)

  return result.response
})
