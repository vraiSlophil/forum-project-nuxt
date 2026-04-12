import type { ForumRealtimeEnvelope, ForumRealtimeEvent } from '#shared/types/forum'

type RealtimeHandler = (event: ForumRealtimeEvent) => void | Promise<void>
type ConnectionStatus = 'idle' | 'connecting' | 'open' | 'closed'

class ForumRealtimeClient {
  private socket: WebSocket | null = null
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null
  private closeTimer: ReturnType<typeof setTimeout> | null = null
  private reconnectAttempt = 0
  private readonly handlersByChannel = new Map<string, Set<RealtimeHandler>>()
  readonly status = ref<ConnectionStatus>('idle')

  subscribe(channel: string, handler: RealtimeHandler) {
    const handlers = this.handlersByChannel.get(channel) ?? new Set<RealtimeHandler>()
    handlers.add(handler)
    this.handlersByChannel.set(channel, handlers)

    this.ensureConnection()
    this.clearCloseTimer()
    this.sendCommand('subscribe', [channel])

    return () => {
      const registeredHandlers = this.handlersByChannel.get(channel)

      if (!registeredHandlers) {
        return
      }

      registeredHandlers.delete(handler)

      if (registeredHandlers.size === 0) {
        this.handlersByChannel.delete(channel)
        this.sendCommand('unsubscribe', [channel])
      }

      if (this.handlersByChannel.size === 0) {
        this.scheduleClose()
      }
    }
  }

  private ensureConnection() {
    if (this.socket || this.handlersByChannel.size === 0) {
      return
    }

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const url = `${protocol}//${window.location.host}/_ws`

    this.status.value = 'connecting'
    this.socket = new WebSocket(url)

    this.socket.addEventListener('open', this.handleOpen)
    this.socket.addEventListener('message', this.handleMessage)
    this.socket.addEventListener('close', this.handleClose)
    this.socket.addEventListener('error', this.handleError)
  }

  private readonly handleOpen = () => {
    this.status.value = 'open'
    this.reconnectAttempt = 0
    this.clearReconnectTimer()
    this.clearCloseTimer()

    const channels = [...this.handlersByChannel.keys()]

    if (channels.length > 0) {
      this.sendCommand('subscribe', channels)
    }
  }

  private readonly handleMessage = (event: MessageEvent) => {
    if (typeof event.data !== 'string') {
      return
    }

    let envelope: unknown

    try {
      envelope = JSON.parse(event.data)
    } catch {
      return
    }

    if (!this.isRealtimeEnvelope(envelope)) {
      return
    }

    const handlers = this.handlersByChannel.get(envelope.channel)

    if (!handlers || handlers.size === 0) {
      return
    }

    for (const handler of handlers) {
      void handler(envelope.event)
    }
  }

  private readonly handleClose = () => {
    this.detachSocket()
    this.status.value = 'closed'
    this.clearCloseTimer()

    if (this.handlersByChannel.size === 0) {
      return
    }

    const delay = Math.min(5000, 500 * 2 ** this.reconnectAttempt)
    this.reconnectAttempt += 1
    this.clearReconnectTimer()
    this.reconnectTimer = setTimeout(() => {
      this.ensureConnection()
    }, delay)
  }

  private readonly handleError = () => {
    this.socket?.close()
  }

  private scheduleClose() {
    this.clearCloseTimer()
    this.closeTimer = setTimeout(() => {
      if (this.handlersByChannel.size === 0) {
        this.close()
      }
    }, 2500)
  }

  private sendCommand(type: 'subscribe' | 'unsubscribe', channels: string[]) {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN || channels.length === 0) {
      return
    }

    this.socket.send(
      JSON.stringify({
        type,
        channels,
      }),
    )
  }

  private close() {
    this.clearReconnectTimer()
    this.clearCloseTimer()
    this.socket?.close()
    this.detachSocket()
    this.status.value = 'idle'
  }

  private detachSocket() {
    if (!this.socket) {
      return
    }

    this.socket.removeEventListener('open', this.handleOpen)
    this.socket.removeEventListener('message', this.handleMessage)
    this.socket.removeEventListener('close', this.handleClose)
    this.socket.removeEventListener('error', this.handleError)
    this.socket = null
  }

  private clearReconnectTimer() {
    if (this.reconnectTimer !== null) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }
  }

  private clearCloseTimer() {
    if (this.closeTimer !== null) {
      clearTimeout(this.closeTimer)
      this.closeTimer = null
    }
  }

  private isRealtimeEnvelope(value: unknown): value is ForumRealtimeEnvelope {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      return false
    }

    const envelope = value as Record<string, unknown>

    return (
      typeof envelope.channel === 'string' && !!envelope.event && typeof envelope.event === 'object'
    )
  }
}

let realtimeClient: ForumRealtimeClient | null = null

export function useForumRealtimeClient() {
  if (import.meta.server) {
    return null
  }

  realtimeClient ??= new ForumRealtimeClient()

  return realtimeClient
}
