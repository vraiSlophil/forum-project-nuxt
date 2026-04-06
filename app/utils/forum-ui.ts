export function readPageQueryParam(value: unknown) {
  if (typeof value !== 'string') {
    return undefined
  }

  return /^[1-9]\d*$/.test(value) ? value : undefined
}

export function buildPageHref(path: string, page: number) {
  return page <= 1 ? path : `${path}?page=${page}`
}

export function formatForumDate(value: string) {
  return new Intl.DateTimeFormat('fr-FR', {
    dateStyle: 'medium',
  }).format(new Date(value))
}

export function formatForumDateTime(value: string) {
  return new Intl.DateTimeFormat('fr-FR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

export function formatCount(value: number, singular: string, plural = `${singular}s`) {
  return `${value} ${value > 1 ? plural : singular}`
}
