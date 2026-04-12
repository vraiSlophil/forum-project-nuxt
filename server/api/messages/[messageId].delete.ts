import { deleteMessage } from '#server/modules/forum/application/commands/delete-message'
import { defineForumHttpHandler } from '#server/modules/forum/http/handler'
import { validateMessageIdParams } from '#server/modules/forum/http/validation'
import { findMessageRealtimeRecordById } from '#server/modules/forum/infrastructure/forum-repository'
import { requireForumActor } from '#server/modules/forum/infrastructure/session'
import {
  publishDeletedMessageSnapshot,
  publishTopicBumped,
} from '#server/modules/forum/realtime/publish'
import { presentTopicMessage } from '#server/modules/forum/application/shared/presenters'
import { getValidatedRouterParams } from 'h3'

export default defineForumHttpHandler(async (event) => {
  const actor = await requireForumActor(event)
  const { messageId } = await getValidatedRouterParams(event, validateMessageIdParams)
  const snapshot = await findMessageRealtimeRecordById(messageId)
  const result = await deleteMessage(actor, messageId)

  if (snapshot) {
    publishDeletedMessageSnapshot(presentTopicMessage(snapshot, null), snapshot.topicId)
  }

  await publishTopicBumped(result.topic.id)

  return result
})
