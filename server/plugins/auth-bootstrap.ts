import { ensureDefaultAdminUser } from '#server/modules/auth/application/commands/ensure-default-admin-user'
import { defineNitroPlugin } from 'nitropack/runtime'

export default defineNitroPlugin(async () => {
  await ensureDefaultAdminUser()
})
