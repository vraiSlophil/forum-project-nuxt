<script setup lang="ts">
import type {
  AdminUserResponse,
  CreateAdminUserInput,
  CreateForumInput,
  ForumAdminResponse,
  ForumsResponse,
  UpdateForumInput,
} from '#shared/types/forum'
import { readApiErrorMessage } from '~/utils/api-error'
import { formatCount, formatForumDateTime } from '~/utils/forum-ui'

useSeoMeta({
  title: 'Administration | Horizon Forum',
  description:
    'Creer, renommer et supprimer des forums ainsi que creer des comptes administrateurs.',
})

const { fetch: fetchUserSession, loggedIn, user } = useUserSession()

await fetchUserSession()

if (!loggedIn.value) {
  await navigateTo('/auth')
}

if (user.value?.role !== 'ADMIN') {
  await navigateTo('/')
}

const forumsEndpoint: string = '/api/forums'
const forumsResponse = ref<ForumsResponse>(await $fetch<ForumsResponse>(forumsEndpoint))
const viewerStateSource = await useForumViewer(() => forumsResponse.value.viewer)
const viewerState = reactive(viewerStateSource)

const createForumForm = reactive<CreateForumInput>({
  name: '',
  description: '',
})

const createAdminForm = reactive<CreateAdminUserInput>({
  username: '',
  password: '',
})

const forumDrafts = reactive<Record<string, UpdateForumInput>>({})
const createForumPending = ref(false)
const createAdminPending = ref(false)
const forumActionPendingId = ref<string | null>(null)
const createForumError = ref('')
const createAdminError = ref('')
const feedbackMessage = ref('')

function syncForumDrafts() {
  for (const forum of forumsResponse.value.forums) {
    forumDrafts[forum.id] = {
      name: forum.name,
      description: forum.description,
    }
  }
}

syncForumDrafts()

function forumDraft(forumId: string): UpdateForumInput {
  const draft = forumDrafts[forumId]

  if (draft) {
    return draft
  }

  const fallback: UpdateForumInput = {
    name: '',
    description: '',
  }

  forumDrafts[forumId] = fallback

  return fallback
}

async function reloadForums() {
  forumsResponse.value = await $fetch<ForumsResponse>(forumsEndpoint)
  syncForumDrafts()
}

async function submitCreateForum() {
  createForumPending.value = true
  createForumError.value = ''
  feedbackMessage.value = ''

  try {
    await $fetch<ForumAdminResponse>('/api/admin/forums', {
      method: 'POST',
      body: createForumForm,
    })

    createForumForm.name = ''
    createForumForm.description = ''
    feedbackMessage.value = 'Forum cree.'
    await reloadForums()
  } catch (error) {
    createForumError.value = readApiErrorMessage(error, 'Creation du forum impossible')
  } finally {
    createForumPending.value = false
  }
}

async function submitCreateAdmin() {
  createAdminPending.value = true
  createAdminError.value = ''
  feedbackMessage.value = ''

  try {
    const result = await $fetch<AdminUserResponse>('/api/admin/users', {
      method: 'POST',
      body: createAdminForm,
    })

    createAdminForm.username = ''
    createAdminForm.password = ''
    feedbackMessage.value = `Administrateur ${result.user.username} cree.`
  } catch (error) {
    createAdminError.value = readApiErrorMessage(error, "Creation de l'administrateur impossible")
  } finally {
    createAdminPending.value = false
  }
}

async function updateForum(forumId: string) {
  forumActionPendingId.value = forumId
  feedbackMessage.value = ''

  try {
    await $fetch<ForumAdminResponse>(`/api/admin/forums/${forumId}`, {
      method: 'PATCH',
      body: forumDraft(forumId),
    })

    feedbackMessage.value = 'Forum mis a jour.'
    await reloadForums()
  } catch (error) {
    createForumError.value = readApiErrorMessage(error, 'Mise a jour du forum impossible')
  } finally {
    forumActionPendingId.value = null
  }
}

async function deleteForum(forumId: string, forumName: string) {
  if (!window.confirm(`Supprimer le forum "${forumName}" et tout son contenu ?`)) {
    return
  }

  forumActionPendingId.value = forumId
  feedbackMessage.value = ''

  try {
    await $fetch(`/api/admin/forums/${forumId}`, {
      method: 'DELETE',
    })

    feedbackMessage.value = 'Forum supprime.'
    await reloadForums()
  } catch (error) {
    createForumError.value = readApiErrorMessage(error, 'Suppression du forum impossible')
  } finally {
    forumActionPendingId.value = null
  }
}
</script>

<template>
  <div
    class="min-h-dvh bg-[linear-gradient(180deg,#fbf7ef_0%,#f4eee5_52%,#eee6db_100%)] text-zinc-950 dark:bg-[linear-gradient(180deg,#0b0b0c_0%,#101114_48%,#16181d_100%)] dark:text-zinc-100"
  >
    <ForumTopbar :viewer="viewerState.effectiveViewer" />

    <main class="px-6 pb-20 pt-8 lg:px-10">
      <div class="mx-auto flex max-w-6xl flex-col gap-6">
        <LandingWhiteCard
          kind="cta"
          noise
        >
          <div class="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <LandingPill variant="glass">Administration</LandingPill>
              <LandingHeading
                as="h1"
                size="hero"
                class="mt-6"
              >
                Gerer les forums et les administrateurs.
              </LandingHeading>
              <p class="mt-5 max-w-3xl text-lg leading-8 text-zinc-600 dark:text-zinc-300">
                Cette page regroupe les interfaces manquantes pour creer des forums, les renommer,
                les supprimer et ouvrir d’autres comptes administrateurs.
              </p>
            </div>

            <LandingDarkCard variant="panel">
              <p class="text-sm uppercase tracking-[0.2em] text-white/60 dark:text-zinc-400">
                Forums disponibles
              </p>
              <p class="mt-3 text-4xl font-semibold tracking-[-0.06em]">
                {{ forumsResponse.forums.length }}
              </p>
              <p class="mt-3 text-sm leading-7 text-white/70 dark:text-zinc-300">
                {{
                  formatCount(
                    forumsResponse.forums.reduce((count, forum) => count + forum.topicCount, 0),
                    'sujet',
                  )
                }}
                visibles sur l’accueil.
              </p>
            </LandingDarkCard>
          </div>
        </LandingWhiteCard>

        <p
          v-if="feedbackMessage"
          class="rounded-[1.6rem] border border-emerald-200/70 bg-emerald-50/80 px-4 py-3 text-sm font-medium text-emerald-700 dark:border-emerald-500/25 dark:bg-emerald-500/10 dark:text-emerald-200"
        >
          {{ feedbackMessage }}
        </p>

        <div class="grid gap-6 xl:grid-cols-2">
          <LandingWhiteCard>
            <LandingEyebrow>Nouveau forum</LandingEyebrow>
            <LandingHeading
              as="h2"
              size="card"
              class="mt-4"
            >
              Creer un forum
            </LandingHeading>

            <p
              v-if="createForumError"
              class="mt-5 rounded-[1.6rem] border border-rose-200/70 bg-rose-50/80 px-4 py-3 text-sm font-medium text-rose-700 dark:border-rose-500/25 dark:bg-rose-500/10 dark:text-rose-200"
            >
              {{ createForumError }}
            </p>

            <form
              class="mt-6 space-y-4"
              @submit.prevent="submitCreateForum"
            >
              <div class="space-y-2">
                <label
                  for="forum-name"
                  class="block text-sm font-semibold tracking-[-0.02em]"
                >
                  Nom du forum
                </label>
                <input
                  id="forum-name"
                  v-model="createForumForm.name"
                  type="text"
                  class="w-full rounded-[1.35rem] border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-950 outline-none transition focus:border-[var(--p-primary-color)] focus:ring-4 focus:ring-[color-mix(in_srgb,var(--p-primary-color)_18%,white)] dark:border-white/10 dark:bg-zinc-950/70 dark:text-white dark:focus:ring-[color-mix(in_srgb,var(--p-primary-color)_18%,transparent)]"
                />
              </div>

              <div class="space-y-2">
                <label
                  for="forum-description"
                  class="block text-sm font-semibold tracking-[-0.02em]"
                >
                  Description
                </label>
                <textarea
                  id="forum-description"
                  v-model="createForumForm.description"
                  rows="4"
                  class="w-full rounded-[1.35rem] border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-950 outline-none transition focus:border-[var(--p-primary-color)] focus:ring-4 focus:ring-[color-mix(in_srgb,var(--p-primary-color)_18%,white)] dark:border-white/10 dark:bg-zinc-950/70 dark:text-white dark:focus:ring-[color-mix(in_srgb,var(--p-primary-color)_18%,transparent)]"
                />
              </div>

              <LandingButton
                type="submit"
                size="lg"
                icon="add"
                :disabled="createForumPending"
              >
                {{ createForumPending ? 'Creation...' : 'Creer le forum' }}
              </LandingButton>
            </form>
          </LandingWhiteCard>

          <LandingWhiteCard>
            <LandingEyebrow>Administrateurs</LandingEyebrow>
            <LandingHeading
              as="h2"
              size="card"
              class="mt-4"
            >
              Creer un compte administrateur
            </LandingHeading>

            <p
              v-if="createAdminError"
              class="mt-5 rounded-[1.6rem] border border-rose-200/70 bg-rose-50/80 px-4 py-3 text-sm font-medium text-rose-700 dark:border-rose-500/25 dark:bg-rose-500/10 dark:text-rose-200"
            >
              {{ createAdminError }}
            </p>

            <form
              class="mt-6 space-y-4"
              @submit.prevent="submitCreateAdmin"
            >
              <div class="space-y-2">
                <label
                  for="admin-username"
                  class="block text-sm font-semibold tracking-[-0.02em]"
                >
                  Nom d'utilisateur
                </label>
                <input
                  id="admin-username"
                  v-model="createAdminForm.username"
                  type="text"
                  class="w-full rounded-[1.35rem] border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-950 outline-none transition focus:border-[var(--p-primary-color)] focus:ring-4 focus:ring-[color-mix(in_srgb,var(--p-primary-color)_18%,white)] dark:border-white/10 dark:bg-zinc-950/70 dark:text-white dark:focus:ring-[color-mix(in_srgb,var(--p-primary-color)_18%,transparent)]"
                />
              </div>

              <div class="space-y-2">
                <label
                  for="admin-password"
                  class="block text-sm font-semibold tracking-[-0.02em]"
                >
                  Mot de passe
                </label>
                <input
                  id="admin-password"
                  v-model="createAdminForm.password"
                  type="password"
                  class="w-full rounded-[1.35rem] border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-950 outline-none transition focus:border-[var(--p-primary-color)] focus:ring-4 focus:ring-[color-mix(in_srgb,var(--p-primary-color)_18%,white)] dark:border-white/10 dark:bg-zinc-950/70 dark:text-white dark:focus:ring-[color-mix(in_srgb,var(--p-primary-color)_18%,transparent)]"
                />
              </div>

              <LandingButton
                type="submit"
                size="lg"
                icon="verified_user"
                :disabled="createAdminPending"
              >
                {{ createAdminPending ? 'Creation...' : 'Creer l’administrateur' }}
              </LandingButton>
            </form>
          </LandingWhiteCard>
        </div>

        <div class="space-y-4">
          <LandingWhiteCard
            v-for="forum in forumsResponse.forums"
            :key="forum.id"
          >
            <div class="flex flex-wrap items-start justify-between gap-4">
              <div>
                <LandingTag
                  tone="primary"
                  size="sm"
                  icon="folder_open"
                >
                  {{ formatCount(forum.topicCount, 'sujet') }}
                </LandingTag>

                <h2 class="mt-5 text-2xl font-semibold tracking-[-0.05em]">
                  {{ forum.name }}
                </h2>

                <p class="mt-3 text-sm leading-7 text-zinc-600 dark:text-zinc-300">
                  Derniere mise a jour le {{ formatForumDateTime(forum.updatedAt) }}.
                </p>
              </div>

              <NuxtLink
                :to="`/forums/${forum.slug}`"
                class="text-sm font-semibold text-zinc-700 underline dark:text-zinc-200"
              >
                Ouvrir le forum
              </NuxtLink>
            </div>

            <form
              class="mt-6 grid gap-4 lg:grid-cols-[1fr_1.4fr_auto]"
              @submit.prevent="updateForum(forum.id)"
            >
              <input
                v-model="forumDraft(forum.id).name"
                type="text"
                class="rounded-[1.35rem] border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-950 outline-none transition focus:border-[var(--p-primary-color)] focus:ring-4 focus:ring-[color-mix(in_srgb,var(--p-primary-color)_18%,white)] dark:border-white/10 dark:bg-zinc-950/70 dark:text-white dark:focus:ring-[color-mix(in_srgb,var(--p-primary-color)_18%,transparent)]"
              />

              <input
                v-model="forumDraft(forum.id).description"
                type="text"
                class="rounded-[1.35rem] border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-950 outline-none transition focus:border-[var(--p-primary-color)] focus:ring-4 focus:ring-[color-mix(in_srgb,var(--p-primary-color)_18%,white)] dark:border-white/10 dark:bg-zinc-950/70 dark:text-white dark:focus:ring-[color-mix(in_srgb,var(--p-primary-color)_18%,transparent)]"
              />

              <div class="flex gap-3">
                <LandingButton
                  type="submit"
                  size="sm"
                  icon="save"
                  :disabled="forumActionPendingId === forum.id"
                >
                  Enregistrer
                </LandingButton>

                <LandingButton
                  variant="outlined"
                  size="sm"
                  icon="delete"
                  :disabled="forumActionPendingId === forum.id"
                  @click.prevent="deleteForum(forum.id, forum.name)"
                >
                  Supprimer
                </LandingButton>
              </div>
            </form>
          </LandingWhiteCard>
        </div>
      </div>
    </main>
  </div>
</template>
