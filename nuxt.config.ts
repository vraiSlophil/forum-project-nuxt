import Aura from '@primeuix/themes/aura'

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',

  modules: ['@nuxt/eslint', 'nuxt-auth-utils', '@primevue/nuxt-module'],

  nitro: {
    experimental: {
      websocket: true,
    },
  },

  primevue: {
    options: {
      ripple: true,
      theme: {
        preset: Aura,
        options: {
          cssLayer: false,
          darkModeSelector: 'system',
        },
      },
    },
  },
})
