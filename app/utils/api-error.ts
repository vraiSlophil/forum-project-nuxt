export function readApiErrorMessage(error: unknown, fallback: string) {
  if (!error || typeof error !== 'object') {
    return fallback
  }

  const candidate = error as {
    data?: { statusMessage?: unknown; message?: unknown }
    statusMessage?: unknown
    message?: unknown
  }

  if (typeof candidate.data?.statusMessage === 'string' && candidate.data.statusMessage) {
    return candidate.data.statusMessage
  }

  if (typeof candidate.data?.message === 'string' && candidate.data.message) {
    return candidate.data.message
  }

  if (typeof candidate.statusMessage === 'string' && candidate.statusMessage) {
    return candidate.statusMessage
  }

  if (typeof candidate.message === 'string' && candidate.message) {
    return candidate.message
  }

  return fallback
}
