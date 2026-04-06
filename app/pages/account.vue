<script setup lang="ts">
import type { ChangePasswordInput } from '#shared/types/auth'
import { readApiErrorMessage } from '~/utils/api-error'

useSeoMeta({
  title: 'Mon compte | Horizon Forum',
  description: 'Consulter la session courante et changer son mot de passe sur Horizon Forum.',
})

const { loggedIn, user, session, fetch: fetchUserSession, clear } = useUserSession()

await fetchUserSession()

if (!loggedIn.value) {
  await navigateTo('/auth')
}

const passwordForm = reactive<ChangePasswordInput>({
  currentPassword: '',
  newPassword: '',
})

const pending = ref(false)
const errorMessage = ref('')
const successMessage = ref('')

const roleLabel = computed(() => (user.value?.role === 'ADMIN' ? 'Administrateur' : 'Membre'))
const isAdmin = computed(() => user.value?.role === 'ADMIN')

const formattedLoggedInAt = computed(() => {
  if (!session.value?.loggedInAt) {
    return null
  }

  return new Intl.DateTimeFormat('fr-FR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(session.value.loggedInAt))
})

async function submitPasswordChange() {
  pending.value = true
  errorMessage.value = ''
  successMessage.value = ''

  try {
    await $fetch('/api/auth/password', {
      method: 'PATCH',
      body: passwordForm,
    })

    passwordForm.currentPassword = ''
    passwordForm.newPassword = ''
    successMessage.value = 'Mot de passe mis a jour.'
  } catch (error) {
    errorMessage.value = readApiErrorMessage(error, 'Mise a jour impossible')
  } finally {
    pending.value = false
  }
}

async function logout() {
  await clear()
  await navigateTo('/')
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
        Retour a l'accueil
      </NuxtLink>

      <LandingButton
        variant="outlined"
        size="sm"
        icon="logout"
        @click="logout"
      >
        Deconnexion
      </LandingButton>
    </div>

    <div class="mx-auto mt-10 grid max-w-6xl gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-start">
      <div class="space-y-6">
        <LandingPill variant="glass">Session active</LandingPill>

        <LandingHeading
          as="h1"
          size="hero"
          class="mt-6"
        >
          Votre compte garde la main sur ce que vous publiez.
        </LandingHeading>

        <p class="text-lg leading-8 text-zinc-600 dark:text-zinc-300">
          Retrouvez votre session, votre role et mettez a jour votre mot de passe avec l'ancien mot
          de passe.
        </p>

        <LandingDarkCard variant="panel">
          <LandingTag
            tone="contrast"
            icon="verified_user"
          >
            {{ roleLabel }}
          </LandingTag>

          <h2 class="mt-5 text-3xl font-semibold tracking-[-0.05em]">
            {{ user?.username }}
          </h2>

          <p
            v-if="formattedLoggedInAt"
            class="mt-3 text-sm leading-7 text-white/70 dark:text-zinc-300"
          >
            Session ouverte le {{ formattedLoggedInAt }}.
          </p>
        </LandingDarkCard>

        <LandingWhiteCard>
          <LandingEyebrow>Actions rapides</LandingEyebrow>

          <LandingHeading
            as="h2"
            size="card"
            class="mt-4"
          >
            Où créer les ressources du forum
          </LandingHeading>

          <div class="mt-6 space-y-4 text-sm leading-7 text-zinc-600 dark:text-zinc-300">
            <p v-if="isAdmin">
              En tant qu'administrateur, vous créez et gérez les forums depuis la page
              Administration.
            </p>
            <p v-else>
              En tant que membre, vous ne créez pas de forum. Ouvrez un forum existant pour créer un
              sujet, puis ouvrez un sujet pour publier des messages.
            </p>
          </div>

          <div class="mt-6 flex flex-wrap gap-3">
            <LandingButton
              v-if="isAdmin"
              size="sm"
              icon="admin_panel_settings"
              @click="navigateTo('/admin')"
            >
              Gérer les forums
            </LandingButton>

            <LandingButton
              size="sm"
              icon="forum"
              @click="navigateTo('/')"
            >
              Ouvrir les forums
            </LandingButton>
          </div>
        </LandingWhiteCard>
      </div>

      <LandingWhiteCard
        kind="cta"
        noise
      >
        <LandingEyebrow>Mot de passe</LandingEyebrow>

        <LandingHeading
          as="h2"
          size="card"
          class="mt-4"
        >
          Changer votre mot de passe
        </LandingHeading>

        <p class="mt-4 text-sm leading-7 text-zinc-600 dark:text-zinc-300">
          Comme aucun email n'est stocke dans le profil, la verification passe par votre mot de
          passe actuel.
        </p>

        <p
          v-if="errorMessage"
          class="mt-5 rounded-[1.6rem] border border-rose-200/70 bg-rose-50/80 px-4 py-3 text-sm font-medium text-rose-700 dark:border-rose-500/25 dark:bg-rose-500/10 dark:text-rose-200"
        >
          {{ errorMessage }}
        </p>

        <p
          v-if="successMessage"
          class="mt-5 rounded-[1.6rem] border border-emerald-200/70 bg-emerald-50/80 px-4 py-3 text-sm font-medium text-emerald-700 dark:border-emerald-500/25 dark:bg-emerald-500/10 dark:text-emerald-200"
        >
          {{ successMessage }}
        </p>

        <form
          class="mt-6 space-y-4"
          @submit.prevent="submitPasswordChange"
        >
          <div class="space-y-2">
            <label
              for="current-password"
              class="block text-sm font-semibold tracking-[-0.02em]"
            >
              Mot de passe actuel
            </label>
            <input
              id="current-password"
              v-model="passwordForm.currentPassword"
              type="password"
              autocomplete="current-password"
              class="w-full rounded-[1.35rem] border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-950 outline-none transition focus:border-[var(--p-primary-color)] focus:ring-4 focus:ring-[color-mix(in_srgb,var(--p-primary-color)_18%,white)] dark:border-white/10 dark:bg-zinc-950/70 dark:text-white dark:focus:ring-[color-mix(in_srgb,var(--p-primary-color)_18%,transparent)]"
              placeholder="Votre mot de passe actuel"
            />
          </div>

          <div class="space-y-2">
            <label
              for="new-password"
              class="block text-sm font-semibold tracking-[-0.02em]"
            >
              Nouveau mot de passe
            </label>
            <input
              id="new-password"
              v-model="passwordForm.newPassword"
              type="password"
              autocomplete="new-password"
              class="w-full rounded-[1.35rem] border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-950 outline-none transition focus:border-[var(--p-primary-color)] focus:ring-4 focus:ring-[color-mix(in_srgb,var(--p-primary-color)_18%,white)] dark:border-white/10 dark:bg-zinc-950/70 dark:text-white dark:focus:ring-[color-mix(in_srgb,var(--p-primary-color)_18%,transparent)]"
              placeholder="Choisissez un nouveau mot de passe"
            />
          </div>

          <LandingButton
            type="submit"
            size="lg"
            icon="key"
            :disabled="pending"
          >
            {{ pending ? 'Mise a jour...' : 'Mettre a jour le mot de passe' }}
          </LandingButton>
        </form>
      </LandingWhiteCard>
    </div>
  </div>
</template>
