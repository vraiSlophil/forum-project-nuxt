import { updateMessage } from '#server/modules/forum/application/commands/update-message'
import { moderateMessage } from '#server/modules/forum/application/commands/admin/moderate-message'
import { restoreMessage } from '#server/modules/forum/application/commands/admin/restore-message'
import { defineForumHttpHandler } from '#server/modules/forum/http/handler'
import {
  validatePatchMessageInput,
  validateMessageIdParams,
} from '#server/modules/forum/http/validation'
import { requireForumActor } from '#server/modules/forum/infrastructure/session'
import {
  publishMessageModerated,
  publishMessageRestored,
  publishMessageUpdated,
} from '#server/modules/forum/realtime/publish'
import { getValidatedRouterParams, readValidatedBody } from 'h3'

export default defineForumHttpHandler(async (event) => {
  const { messageId } = await getValidatedRouterParams(event, validateMessageIdParams)
  const input = await readValidatedBody(event, validatePatchMessageInput)
  const actor = await requireForumActor(event)

  if ('action' in input && input.action === 'moderate-delete') {
    await moderateMessage(actor, messageId)
    await publishMessageModerated(messageId)
    return {
      moderated: true,
    }
  }

  if ('action' in input && input.action === 'moderate-restore') {
    await restoreMessage(actor, messageId)
    await publishMessageRestored(messageId)
    return {
      restored: true,
    }
  }

  if ('content' in input) {
    const result = await updateMessage(actor, messageId, {
      content: input.content,
    })

    await publishMessageUpdated(messageId)

    return result
  }

  return {
    moderated: false,
  }
})
