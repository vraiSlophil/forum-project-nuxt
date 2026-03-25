import tailwindcss from '@tailwindcss/vite'
import { definePreset } from '@primeuix/themes'
import Aura from '@primeuix/themes/aura'

const amberPrimary = {
  50: '{amber.50}',
  100: '{amber.100}',
  200: '{amber.200}',
  300: '{amber.300}',
  400: '{amber.400}',
  500: '{amber.500}',
  600: '{amber.600}',
  700: '{amber.700}',
  800: '{amber.800}',
  900: '{amber.900}',
  950: '{amber.950}',
}

const neutralSurface = {
  0: '#ffffff',
  50: '{neutral.50}',
  100: '{neutral.100}',
  200: '{neutral.200}',
  300: '{neutral.300}',
  400: '{neutral.400}',
  500: '{neutral.500}',
  600: '{neutral.600}',
  700: '{neutral.700}',
  800: '{neutral.800}',
  900: '{neutral.900}',
  950: '{neutral.950}',
}

const forumPrimePreset = definePreset(Aura, {
  primitive: {
    borderRadius: {
      none: '0',
      xs: '0.5rem',
      sm: '0.75rem',
      md: '1.25rem',
      lg: '1.75rem',
      xl: '2.5rem',
    },
  },
  semantic: {
    primary: amberPrimary,
    formField: {
      paddingX: '0.75rem',
      paddingY: '0.4rem',
      sm: {
        paddingX: '0.625rem',
        paddingY: '0.3rem',
      },
      lg: {
        paddingX: '0.875rem',
        paddingY: '0.5rem',
      },
    },
    list: {
      padding: '0.3rem 0.3rem',
      header: {
        padding: '0.45rem 1rem 0.25rem 1rem',
      },
      option: {
        padding: '0.45rem 0.8rem',
      },
      optionGroup: {
        padding: '0.45rem 0.8rem',
      },
    },
    navigation: {
      list: {
        padding: '0.3rem 0.3rem',
      },
      item: {
        padding: '0.45rem 0.8rem',
      },
      submenuLabel: {
        padding: '0.45rem 0.8rem',
      },
    },
    overlay: {
      popover: {
        padding: '0.85rem',
      },
      modal: {
        padding: '2rem',
      },
    },
    colorScheme: {
      light: {
        surface: neutralSurface,
      },
      dark: {
        surface: neutralSurface,
      },
    },
  },
})

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  css: ['~/assets/css/main.css'],

  compatibilityDate: '2025-07-15',

  modules: ['@nuxt/eslint', 'nuxt-auth-utils', '@primevue/nuxt-module'],

  vite: {
    optimizeDeps: {
      include: ['@vue/devtools-core', '@vue/devtools-kit'],
    },
    plugins: [tailwindcss()],
  },

  nitro: {
    experimental: {
      websocket: true,
    },
  },

  primevue: {
    options: {
      ripple: true,
      theme: {
        preset: forumPrimePreset,
        options: {
          cssLayer: false,
          darkModeSelector: 'system',
        },
      },
    },
  },
})
