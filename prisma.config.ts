import 'dotenv/config'
import { defineConfig, env } from 'prisma/config'
import { buildPostgresDatasourceUrl } from './server/utils/database-url'

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    url: buildPostgresDatasourceUrl({
      POSTGRES_DB: env('POSTGRES_DB'),
      POSTGRES_HOST: env('POSTGRES_HOST'),
      POSTGRES_PASSWORD: env('POSTGRES_PASSWORD'),
      POSTGRES_PORT: env('POSTGRES_PORT'),
      POSTGRES_SCHEMA: process.env.POSTGRES_SCHEMA,
      POSTGRES_USER: env('POSTGRES_USER'),
    }),
  },
})
