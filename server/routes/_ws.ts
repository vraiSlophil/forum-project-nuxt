import { isSupportedRealtimeChannel } from '#server/modules/forum/realtime/channels'
import {
  removePeer,
  subscribePeer,
  unsubscribePeer,
  type RealtimePeer,
} from '#server/modules/forum/realtime/registry'

type RealtimeSocketCommand = {
  type: 'subscribe' | 'unsubscribe'
  channels: string[]
}

type IncomingRealtimeMessage = {
  text: () => string
}

function parseRealtimeCommand(raw: string): RealtimeSocketCommand | null {
  let parsed: unknown

  try {
    parsed = JSON.parse(raw)
  } catch {
    return null
  }

  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    return null
  }

  const candidate = parsed as Record<string, unknown>

  if (candidate.type !== 'subscribe' && candidate.type !== 'unsubscribe') {
    return null
  }

  if (!Array.isArray(candidate.channels)) {
    return null
  }

  const channels = candidate.channels
    .filter((value): value is string => typeof value === 'string')
    .map((value) => value.trim())
    .filter((value) => value.length > 0 && isSupportedRealtimeChannel(value))

  if (channels.length === 0) {
    return null
  }

  return {
    type: candidate.type,
    channels: [...new Set(channels)],
  }
}

export default defineWebSocketHandler({
  open(peer) {
    subscribePeer(peer as RealtimePeer, [])
  },
  message(peer, message) {
    const command = parseRealtimeCommand((message as IncomingRealtimeMessage).text())

    if (!command) {
      return
    }

    if (command.type === 'subscribe') {
      subscribePeer(peer as RealtimePeer, command.channels)
      return
    }

    unsubscribePeer(peer as RealtimePeer, command.channels)
  },
  close(peer) {
    removePeer(peer as RealtimePeer)
  },
  error(peer) {
    removePeer(peer as RealtimePeer)
  },
})
