import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

const rootDir = fileURLToPath(new URL('./', import.meta.url))

export default defineConfig({
  resolve: {
    alias: {
      '#server': fileURLToPath(new URL('./server', import.meta.url)),
      '#shared': fileURLToPath(new URL('./shared', import.meta.url)),
    },
  },
  test: {
    environment: 'node',
    globals: true,
    clearMocks: true,
    restoreMocks: true,
    mockReset: true,
    fileParallelism: false,
    testTimeout: 120000,
    hookTimeout: 120000,
    include: ['tests/**/*.test.ts'],
    exclude: ['.nuxt/**', '.output/**', 'node_modules/**'],
    root: rootDir,
  },
})
