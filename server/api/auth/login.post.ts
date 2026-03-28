import { loginUser } from '#server/modules/auth/application/commands/login-user'
import { defineAuthHttpHandler } from '#server/modules/auth/http/handler'
import { validateLoginUserInput } from '#server/modules/auth/http/validation'
import { replaceAppUserSession } from '#server/utils/user-session'
import { readValidatedBody } from 'h3'

export default defineAuthHttpHandler(async (event) => {
  const input = await readValidatedBody(event, validateLoginUserInput)
  const result = await loginUser(input)

  await replaceAppUserSession(event, {
    user: result.sessionUser,
    loggedInAt: result.response.loggedInAt,
  })

  return result.response
})
