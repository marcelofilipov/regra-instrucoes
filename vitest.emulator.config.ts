import { defineConfig } from 'vitest/config'
import { fileURLToPath, URL } from 'node:url'

/**
 * Config isolada para testes que dependem do Firestore Emulator (Security Rules
 * e integração dos repositórios). Roda em ambiente node, via `firebase
 * emulators:exec`, sem jsdom nem o setup do Testing Library. Ver script
 * `test:emulator`.
 */
export default defineConfig({
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    testTimeout: 15000,
    hookTimeout: 30000,
  },
})
