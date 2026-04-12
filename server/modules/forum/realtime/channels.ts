const FORUM_CHANNEL_PATTERN = /^forums:[0-9a-f-]{36}:topics$/i
const TOPIC_CHANNEL_PATTERN = /^topics:[0-9a-f-]{36}:messages$/i

export function buildForumTopicsChannel(forumId: string) {
  return `forums:${forumId}:topics`
}

export function buildTopicMessagesChannel(topicId: string) {
  return `topics:${topicId}:messages`
}

export function isSupportedRealtimeChannel(channel: string) {
  return FORUM_CHANNEL_PATTERN.test(channel) || TOPIC_CHANNEL_PATTERN.test(channel)
}
