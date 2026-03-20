import 'dotenv/config'
import { defineConfig, env } from 'prisma/config'
import { buildPostgresConnectionString } from './server/utils/database-url'

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    url: buildPostgresConnectionString({
      POSTGRES_DB: env('POSTGRES_DB'),
      POSTGRES_HOST: env('POSTGRES_HOST'),
      POSTGRES_PASSWORD: env('POSTGRES_PASSWORD'),
      POSTGRES_PORT: env('POSTGRES_PORT'),
      POSTGRES_USER: env('POSTGRES_USER'),
    }),
  },
})
