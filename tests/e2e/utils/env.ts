export const E2E_POSTGRES_SCHEMA = 'forum_test'
export const E2E_POSTGRES_DB = 'forum_test'

export function buildE2EEnvironment(source: NodeJS.ProcessEnv = process.env) {
  return {
    ...source,
    NODE_ENV: 'test',
    FORUM_ENABLE_TEST_ROUTES: '1',
    POSTGRES_DB: E2E_POSTGRES_DB,
    POSTGRES_SCHEMA: E2E_POSTGRES_SCHEMA,
  }
}
