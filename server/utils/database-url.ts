function readRequired(source: Record<string, string | undefined>, name: string) {
  const value = source[name]

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`)
  }

  return value
}

export function buildPostgresConnectionString(
  source: Record<string, string | undefined> = process.env,
) {
  const user = readRequired(source, 'POSTGRES_USER')
  const password = readRequired(source, 'POSTGRES_PASSWORD')
  const host = readRequired(source, 'POSTGRES_HOST')
  const port = readRequired(source, 'POSTGRES_PORT')
  const database = readRequired(source, 'POSTGRES_DB')

  const url = new URL('postgresql://localhost')
  url.username = user
  url.password = password
  url.hostname = host
  url.port = port
  url.pathname = `/${database}`

  return url.toString()
}

export function buildPostgresDatasourceUrl(
  source: Record<string, string | undefined> = process.env,
) {
  const url = new URL(buildPostgresConnectionString(source))
  const schema = source.POSTGRES_SCHEMA

  if (schema) {
    url.searchParams.set('schema', schema)
  }

  return url.toString()
}
