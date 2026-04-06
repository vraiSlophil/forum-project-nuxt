<script setup lang="ts">
import type { ForumViewer } from '#shared/types/forum'

const props = defineProps<{
  viewer: ForumViewer
}>()

const { clear, fetch: fetchUserSession, loggedIn, user } = useUserSession()

await fetchUserSession()

const effectiveViewer = computed<ForumViewer>(() => {
  if (!loggedIn.value || !user.value) {
    return props.viewer
  }

  return {
    isAuthenticated: true,
    userId: user.value.id,
    username: user.value.username,
    role: user.value.role,
    isAdmin: user.value.role === 'ADMIN',
  }
})

async function goToAuth() {
  await navigateTo('/auth')
}

async function goToRegister() {
  await navigateTo('/auth?mode=register')
}

async function goToAccount() {
  await navigateTo('/account')
}

async function goToAdmin() {
  await navigateTo('/admin')
}

async function logout() {
  await clear()
  await navigateTo('/')
}
</script>

<template>
  <header class="sticky top-0 z-50 px-4 pt-5">
    <nav
      class="mx-auto flex max-w-6xl items-center justify-between gap-4 overflow-hidden rounded-full border border-[color-mix(in_srgb,var(--p-primary-color)_16%,white)] bg-white/70 px-4 py-3 shadow-[0_18px_40px_rgba(120,113,108,0.14)] backdrop-blur-2xl dark:border-[color-mix(in_srgb,var(--p-primary-color)_24%,transparent)] dark:bg-zinc-900/60 dark:shadow-[0_18px_40px_rgba(0,0,0,0.35)]"
    >
      <NuxtLink
        to="/"
        class="flex items-center gap-3"
      >
        <div
          class="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--p-primary-color)] text-[var(--p-primary-contrast-color)] shadow-[0_16px_40px_color-mix(in_srgb,var(--p-primary-color)_24%,transparent)]"
        >
          <LandingIcon
            name="forum"
            size="sm"
          />
        </div>

        <div>
          <p class="text-sm font-semibold tracking-[-0.03em]">Horizon Forum</p>
          <p class="text-xs text-zinc-500 dark:text-zinc-400">
            {{
              effectiveViewer.isAuthenticated
                ? `Session de ${effectiveViewer.username}`
                : 'Lecture publique, publication avec compte'
            }}
          </p>
        </div>
      </NuxtLink>

      <div class="flex items-center gap-2">
        <LandingTag
          v-if="effectiveViewer.isAdmin"
          tone="contrast"
          size="sm"
          icon="verified_user"
        >
          Admin
        </LandingTag>

        <LandingButton
          v-if="effectiveViewer.isAdmin"
          variant="outlined"
          size="sm"
          @click="goToAdmin"
        >
          Administration
        </LandingButton>

        <LandingButton
          v-if="!effectiveViewer.isAuthenticated"
          variant="outlined"
          size="sm"
          @click="goToAuth"
        >
          Connexion
        </LandingButton>

        <LandingButton
          v-if="!effectiveViewer.isAuthenticated"
          size="sm"
          icon="person_add"
          @click="goToRegister"
        >
          Inscription
        </LandingButton>

        <LandingButton
          v-if="effectiveViewer.isAuthenticated"
          variant="outlined"
          size="sm"
          @click="goToAccount"
        >
          Mon compte
        </LandingButton>

        <LandingButton
          v-if="effectiveViewer.isAuthenticated"
          size="sm"
          icon="logout"
          @click="logout"
        >
          Deconnexion
        </LandingButton>
      </div>
    </nav>
  </header>
</template>
