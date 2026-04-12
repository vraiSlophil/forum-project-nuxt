import { describe, expect, it } from 'vitest'
import {
  buildForumTopicsChannel,
  buildTopicMessagesChannel,
  isSupportedRealtimeChannel,
} from '#server/modules/forum/realtime/channels'

describe('forum realtime channels', () => {
  it('builds forum and topic channel names from identifiers', () => {
    expect(buildForumTopicsChannel('00000000-0000-4000-8000-000000000010')).toBe(
      'forums:00000000-0000-4000-8000-000000000010:topics',
    )
    expect(buildTopicMessagesChannel('00000000-0000-4000-8000-000000000020')).toBe(
      'topics:00000000-0000-4000-8000-000000000020:messages',
    )
  })

  it('accepts only supported realtime channels', () => {
    expect(isSupportedRealtimeChannel('forums:00000000-0000-4000-8000-000000000010:topics')).toBe(
      true,
    )
    expect(isSupportedRealtimeChannel('topics:00000000-0000-4000-8000-000000000020:messages')).toBe(
      true,
    )

    expect(isSupportedRealtimeChannel('forums:00000000-0000-4000-8000-000000000010')).toBe(false)
    expect(isSupportedRealtimeChannel('topics:not-a-uuid:messages')).toBe(false)
    expect(isSupportedRealtimeChannel('topics:00000000-0000-4000-8000-000000000020:events')).toBe(
      false,
    )
    expect(isSupportedRealtimeChannel('admin:00000000-0000-4000-8000-000000000020:messages')).toBe(
      false,
    )
  })
})
