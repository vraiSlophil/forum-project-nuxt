<script setup lang="ts">
import type { LoginUserInput, RegisterUserInput } from '#shared/types/auth'
import { readApiErrorMessage } from '~/utils/api-error'

useSeoMeta({
  title: 'Connexion | Horizon Forum',
  description: 'Créer un compte, se connecter et ouvrir une session sur Horizon Forum.',
})

const route = useRoute()
const { loggedIn, fetch: fetchUserSession } = useUserSession()

await fetchUserSession()

if (loggedIn.value) {
  await navigateTo('/account')
}

const activeMode = ref<'login' | 'register'>(route.query.mode === 'register' ? 'register' : 'login')

const loginForm = reactive<LoginUserInput>({
  username: '',
  password: '',
})

const registerForm = reactive<RegisterUserInput>({
  username: '',
  password: '',
})

const pendingMode = ref<'login' | 'register' | null>(null)
const errorMessage = ref('')

function switchMode(mode: 'login' | 'register') {
  activeMode.value = mode
  errorMessage.value = ''
}

async function submitLogin() {
  pendingMode.value = 'login'
  errorMessage.value = ''

  try {
    await $fetch('/api/auth/login', {
      method: 'POST',
      body: loginForm,
    })

    await fetchUserSession()
    await navigateTo('/account')
  } catch (error) {
    errorMessage.value = readApiErrorMessage(error, 'Connexion impossible')
  } finally {
    pendingMode.value = null
  }
}

async function submitRegister() {
  pendingMode.value = 'register'
  errorMessage.value = ''

  try {
    await $fetch('/api/auth/register', {
      method: 'POST',
      body: registerForm,
    })

    await fetchUserSession()
    await navigateTo('/account')
  } catch (error) {
    errorMessage.value = readApiErrorMessage(error, 'Inscription impossible')
  } finally {
    pendingMode.value = null
  }
}
</script>

<template>
  <div
    class="min-h-dvh bg-[linear-gradient(180deg,#fbf7ef_0%,#f4eee5_52%,#eee6db_100%)] px-6 py-10 text-zinc-950 dark:bg-[linear-gradient(180deg,#0b0b0c_0%,#101114_48%,#16181d_100%)] dark:text-zinc-100"
  >
    <div class="mx-auto flex max-w-6xl items-start justify-between gap-4">
      <NuxtLink
        to="/"
        class="inline-flex items-center gap-2 rounded-full border border-[color-mix(in_srgb,var(--p-primary-color)_18%,white)] bg-white/65 px-4 py-2 text-sm font-medium text-zinc-700 shadow-[0_18px_40px_rgba(120,113,108,0.12)] backdrop-blur-2xl transition hover:-translate-y-0.5 hover:text-zinc-950 dark:border-[color-mix(in_srgb,var(--p-primary-color)_24%,transparent)] dark:bg-zinc-900/60 dark:text-zinc-200"
      >
        <LandingIcon
          name="arrow_back"
          size="sm"
        />
        Retour à l'accueil
      </NuxtLink>
    </div>

    <div class="mx-auto mt-10 grid max-w-6xl gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
      <div class="max-w-xl">
        <LandingPill variant="glass">Accès membre</LandingPill>

        <LandingHeading
          as="h1"
          size="hero"
          class="mt-6"
        >
          Rejoignez la discussion avec une vraie session serveur.
        </LandingHeading>

        <p class="mt-6 text-lg leading-8 text-zinc-600 dark:text-zinc-300">
          Créez un compte, ouvrez une session et revenez facilement sur vos échanges.
        </p>

        <div class="mt-8 space-y-4">
          <LandingWhiteCard>
            <LandingEyebrow>Ce que la session débloque</LandingEyebrow>

            <div class="mt-5 grid gap-3 sm:grid-cols-2">
              <LandingMutedCard>
                <h2 class="text-lg font-semibold tracking-[-0.03em]">Poster des sujets</h2>
                <p class="mt-2 text-sm leading-6 text-zinc-500 dark:text-zinc-400">
                  La lecture reste ouverte, mais publier demande un compte.
                </p>
              </LandingMutedCard>

              <LandingMutedCard>
                <h2 class="text-lg font-semibold tracking-[-0.03em]">Retrouver votre rôle</h2>
                <p class="mt-2 text-sm leading-6 text-zinc-500 dark:text-zinc-400">
                  Les permissions reviennent avec votre session en cours.
                </p>
              </LandingMutedCard>
            </div>
          </LandingWhiteCard>
        </div>
      </div>

      <LandingWhiteCard
        kind="cta"
        noise
      >
        <div class="flex flex-wrap gap-3">
          <LandingButton
            :variant="activeMode === 'login' ? 'primary' : 'outlined'"
            size="sm"
            @click="switchMode('login')"
          >
            Connexion
          </LandingButton>

          <LandingButton
            :variant="activeMode === 'register' ? 'primary' : 'outlined'"
            size="sm"
            @click="switchMode('register')"
          >
            Inscription
          </LandingButton>
        </div>

        <p
          v-if="errorMessage"
          class="mt-5 rounded-[1.6rem] border border-rose-200/70 bg-rose-50/80 px-4 py-3 text-sm font-medium text-rose-700 dark:border-rose-500/25 dark:bg-rose-500/10 dark:text-rose-200"
        >
          {{ errorMessage }}
        </p>

        <form
          v-if="activeMode === 'login'"
          class="mt-6 space-y-4"
          @submit.prevent="submitLogin"
        >
          <div class="space-y-2">
            <label
              for="login-username"
              class="block text-sm font-semibold tracking-[-0.02em]"
            >
              Nom d'utilisateur
            </label>
            <input
              id="login-username"
              v-model="loginForm.username"
              type="text"
              autocomplete="username"
              class="w-full rounded-[1.35rem] border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-950 outline-none transition focus:border-[var(--p-primary-color)] focus:ring-4 focus:ring-[color-mix(in_srgb,var(--p-primary-color)_18%,white)] dark:border-white/10 dark:bg-zinc-950/70 dark:text-white dark:focus:ring-[color-mix(in_srgb,var(--p-primary-color)_18%,transparent)]"
              placeholder="alice"
            />
          </div>

          <div class="space-y-2">
            <label
              for="login-password"
              class="block text-sm font-semibold tracking-[-0.02em]"
            >
              Mot de passe
            </label>
            <input
              id="login-password"
              v-model="loginForm.password"
              type="password"
              autocomplete="current-password"
              class="w-full rounded-[1.35rem] border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-950 outline-none transition focus:border-[var(--p-primary-color)] focus:ring-4 focus:ring-[color-mix(in_srgb,var(--p-primary-color)_18%,white)] dark:border-white/10 dark:bg-zinc-950/70 dark:text-white dark:focus:ring-[color-mix(in_srgb,var(--p-primary-color)_18%,transparent)]"
              placeholder="Votre mot de passe"
            />
          </div>

          <LandingButton
            type="submit"
            size="lg"
            icon="login"
            :disabled="pendingMode === 'login'"
          >
            {{ pendingMode === 'login' ? 'Connexion...' : 'Se connecter' }}
          </LandingButton>
        </form>

        <form
          v-else
          class="mt-6 space-y-4"
          @submit.prevent="submitRegister"
        >
          <div class="space-y-2">
            <label
              for="register-username"
              class="block text-sm font-semibold tracking-[-0.02em]"
            >
              Nom d'utilisateur
            </label>
            <input
              id="register-username"
              v-model="registerForm.username"
              type="text"
              autocomplete="username"
              class="w-full rounded-[1.35rem] border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-950 outline-none transition focus:border-[var(--p-primary-color)] focus:ring-4 focus:ring-[color-mix(in_srgb,var(--p-primary-color)_18%,white)] dark:border-white/10 dark:bg-zinc-950/70 dark:text-white dark:focus:ring-[color-mix(in_srgb,var(--p-primary-color)_18%,transparent)]"
              placeholder="alice"
            />
          </div>

          <div class="space-y-2">
            <label
              for="register-password"
              class="block text-sm font-semibold tracking-[-0.02em]"
            >
              Mot de passe
            </label>
            <input
              id="register-password"
              v-model="registerForm.password"
              type="password"
              autocomplete="new-password"
              class="w-full rounded-[1.35rem] border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-950 outline-none transition focus:border-[var(--p-primary-color)] focus:ring-4 focus:ring-[color-mix(in_srgb,var(--p-primary-color)_18%,white)] dark:border-white/10 dark:bg-zinc-950/70 dark:text-white dark:focus:ring-[color-mix(in_srgb,var(--p-primary-color)_18%,transparent)]"
              placeholder="Choisissez un mot de passe"
            />
          </div>

          <LandingButton
            type="submit"
            size="lg"
            icon="person_add"
            :disabled="pendingMode === 'register'"
          >
            {{ pendingMode === 'register' ? 'Création...' : 'Créer mon compte' }}
          </LandingButton>
        </form>
      </LandingWhiteCard>
    </div>
  </div>
</template>
