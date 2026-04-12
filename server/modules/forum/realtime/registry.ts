import type { ForumRealtimeEnvelope } from '#shared/types/forum'

export interface RealtimePeer {
  send: (message: string) => void
}

const channelsByPeer = new Map<RealtimePeer, Set<string>>()
const peersByChannel = new Map<string, Set<RealtimePeer>>()

export function subscribePeer(peer: RealtimePeer, channels: string[]) {
  let peerChannels = channelsByPeer.get(peer)

  if (!peerChannels) {
    peerChannels = new Set<string>()
    channelsByPeer.set(peer, peerChannels)
  }

  for (const channel of channels) {
    if (peerChannels.has(channel)) {
      continue
    }

    peerChannels.add(channel)

    const channelPeers = peersByChannel.get(channel) ?? new Set<RealtimePeer>()
    channelPeers.add(peer)
    peersByChannel.set(channel, channelPeers)
  }
}

export function unsubscribePeer(peer: RealtimePeer, channels: string[]) {
  const peerChannels = channelsByPeer.get(peer)

  if (!peerChannels) {
    return
  }

  for (const channel of channels) {
    peerChannels.delete(channel)

    const channelPeers = peersByChannel.get(channel)

    if (!channelPeers) {
      continue
    }

    channelPeers.delete(peer)

    if (channelPeers.size === 0) {
      peersByChannel.delete(channel)
    }
  }

  if (peerChannels.size === 0) {
    channelsByPeer.delete(peer)
  }
}

export function removePeer(peer: RealtimePeer) {
  const peerChannels = channelsByPeer.get(peer)

  if (!peerChannels) {
    return
  }

  unsubscribePeer(peer, [...peerChannels])
}

export function broadcastToChannel(channel: string, envelope: ForumRealtimeEnvelope) {
  const peers = peersByChannel.get(channel)

  if (!peers || peers.size === 0) {
    return
  }

  const payload = JSON.stringify(envelope)

  for (const peer of peers) {
    try {
      peer.send(payload)
    } catch {
      removePeer(peer)
    }
  }
}

export function resetRealtimeRegistry() {
  channelsByPeer.clear()
  peersByChannel.clear()
}
