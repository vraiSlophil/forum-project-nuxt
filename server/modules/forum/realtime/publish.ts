import {
  presentTopicMessage,
  presentTopicSummary,
} from '#server/modules/forum/application/shared/presenters'
import {
  findMessageRealtimeRecordById,
  findTopicRealtimeSummaryById,
} from '#server/modules/forum/infrastructure/forum-repository'
import type {
  ForumRealtimeEnvelope,
  ForumTopicRealtimeEvent,
  ForumTopicRealtimeEventType,
  TopicMessage,
  TopicMessageRealtimeEvent,
  TopicMessageRealtimeEventType,
} from '#shared/types/forum'
import { buildForumTopicsChannel, buildTopicMessagesChannel } from './channels'
import { broadcastToChannel } from './registry'

function broadcastEnvelope(channel: string, envelope: ForumRealtimeEnvelope) {
  broadcastToChannel(channel, envelope)
}

async function broadcastTopicEvent(type: ForumTopicRealtimeEventType, topicId: string) {
  const topic = await findTopicRealtimeSummaryById(topicId)

  if (!topic) {
    return
  }

  const channel = buildForumTopicsChannel(topic.forumId)
  const event: ForumTopicRealtimeEvent = {
    forumId: topic.forumId,
    topicId: topic.id,
    type,
    topic: presentTopicSummary(topic),
  }

  broadcastEnvelope(channel, {
    channel,
    event,
  })
}

function broadcastTopicDeletedEvent(forumId: string, topicId: string) {
  const channel = buildForumTopicsChannel(forumId)
  const event: ForumTopicRealtimeEvent = {
    forumId,
    topicId,
    type: 'topic.deleted',
    topic: null,
  }

  broadcastEnvelope(channel, {
    channel,
    event,
  })
}

async function broadcastMessageEvent(type: TopicMessageRealtimeEventType, messageId: string) {
  const message = await findMessageRealtimeRecordById(messageId)

  if (!message) {
    return
  }

  const channel = buildTopicMessagesChannel(message.topicId)
  const event: TopicMessageRealtimeEvent = {
    topicId: message.topicId,
    type,
    message: presentTopicMessage(message, null),
  }

  broadcastEnvelope(channel, {
    channel,
    event,
  })
}

export function publishDeletedMessageSnapshot(message: TopicMessage, topicId: string) {
  const channel = buildTopicMessagesChannel(topicId)
  const event: TopicMessageRealtimeEvent = {
    topicId,
    type: 'message.deleted',
    message,
  }

  broadcastEnvelope(channel, {
    channel,
    event,
  })
}

export async function publishTopicCreated(topicId: string) {
  await broadcastTopicEvent('topic.created', topicId)
}

export async function publishTopicBumped(topicId: string) {
  await broadcastTopicEvent('topic.bumped', topicId)
}

export async function publishTopicDeleted(forumId: string, topicId: string) {
  broadcastTopicDeletedEvent(forumId, topicId)
}

export async function publishMessageCreated(messageId: string) {
  await broadcastMessageEvent('message.created', messageId)
}

export async function publishMessageUpdated(messageId: string) {
  await broadcastMessageEvent('message.updated', messageId)
}

export async function publishMessageModerated(messageId: string) {
  await broadcastMessageEvent('message.moderated', messageId)
}

export async function publishMessageRestored(messageId: string) {
  await broadcastMessageEvent('message.restored', messageId)
}
