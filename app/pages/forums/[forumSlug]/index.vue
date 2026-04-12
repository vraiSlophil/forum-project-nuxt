<script setup lang="ts">
import type { ForumPageResponse } from '#shared/types/forum'
import { formatCount, formatForumDateTime, readPageQueryParam } from '~/utils/forum-ui'

definePageMeta({
  key: (route) => route.fullPath,
})

const route = useRoute()
const forumSlug = String(route.params.forumSlug)
const pageQuery = readPageQueryParam(route.query.page)
const authHeaders = import.meta.server ? useRequestHeaders(['cookie']) : undefined
const forumPage = await $fetch<ForumPageResponse>(`/api/forums/${forumSlug}`, {
  headers: authHeaders,
  query: pageQuery ? { page: pageQuery } : undefined,
})
const viewerStateSource = await useForumViewer(() => forumPage.viewer)
const viewerState = reactive(viewerStateSource)
const forumState = reactive(useForumPage(forumPage, viewerStateSource))

useSeoMeta({
  title: `${forumPage.forum.name} | Horizon Forum`,
  description: forumPage.forum.description ?? `Liste des sujets du forum ${forumPage.forum.name}.`,
})
</script>

<template>
  <div
    class="min-h-dvh bg-[linear-gradient(180deg,#fbf7ef_0%,#f4eee5_52%,#eee6db_100%)] text-zinc-950 dark:bg-[linear-gradient(180deg,#0b0b0c_0%,#101114_48%,#16181d_100%)] dark:text-zinc-100"
  >
    <ForumTopbar :viewer="viewerState.effectiveViewer" />

    <main class="px-6 pb-20 pt-8 lg:px-10">
      <div class="mx-auto flex max-w-6xl flex-col gap-6">
        <nav class="flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400">
          <NuxtLink
            to="/"
            class="hover:text-zinc-950 dark:hover:text-white"
          >
            Forums
          </NuxtLink>
          <span>/</span>
          <span class="font-medium text-zinc-700 dark:text-zinc-200">
            {{ forumPage.forum.name }}
          </span>
        </nav>

        <LandingWhiteCard
          kind="cta"
          noise
        >
          <div class="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <LandingPill variant="glass">Forum</LandingPill>
              <LandingHeading
                as="h1"
                size="hero"
                class="mt-6"
              >
                {{ forumPage.forum.name }}
              </LandingHeading>
              <p class="mt-5 max-w-3xl text-lg leading-8 text-zinc-600 dark:text-zinc-300">
                {{
                  forumPage.forum.description ??
                  'Ce forum accueille les sujets de discussion du site.'
                }}
              </p>
            </div>

            <div class="flex flex-wrap gap-3">
              <LandingPill variant="accent">
                {{ formatCount(forumPage.pagination.totalItems, 'sujet') }}
              </LandingPill>
              <div
                v-if="viewerState.isAuthenticated"
                class="flex flex-wrap gap-3"
              >
                <LandingButton
                  icon="add_comment"
                  @click="forumState.toggleComposer"
                >
                  {{ forumState.isComposerOpen ? 'Fermer' : 'Nouveau sujet' }}
                </LandingButton>

                <LandingButton
                  v-if="forumState.canManageForum"
                  variant="outlined"
                  icon="admin_panel_settings"
                  @click="viewerState.goToAdmin"
                >
                  Gerer les forums
                </LandingButton>
              </div>
            </div>
          </div>
        </LandingWhiteCard>

        <LandingWhiteCard v-if="forumState.canCreateTopic && forumState.isComposerOpen">
          <form
            class="mt-6 space-y-4"
            @submit.prevent="forumState.submitTopic"
          >
            <p
              v-if="forumState.submitError"
              class="rounded-[1.4rem] border border-rose-200/70 bg-rose-50/80 px-4 py-3 text-sm font-medium text-rose-700 dark:border-rose-500/25 dark:bg-rose-500/10 dark:text-rose-200"
            >
              {{ forumState.submitError }}
            </p>

            <div class="space-y-2">
              <label
                for="topic-title"
                class="block text-sm font-semibold tracking-[-0.02em]"
              >
                Titre
              </label>
              <input
                id="topic-title"
                v-model="forumState.topicForm.title"
                type="text"
                class="w-full rounded-[1.35rem] border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-950 outline-none transition focus:border-[var(--p-primary-color)] focus:ring-4 focus:ring-[color-mix(in_srgb,var(--p-primary-color)_18%,white)] dark:border-white/10 dark:bg-zinc-950/70 dark:text-white dark:focus:ring-[color-mix(in_srgb,var(--p-primary-color)_18%,transparent)]"
                placeholder="Titre du sujet"
              />
            </div>

            <div class="space-y-2">
              <label
                for="topic-content"
                class="block text-sm font-semibold tracking-[-0.02em]"
              >
                Premier message
              </label>
              <textarea
                id="topic-content"
                v-model="forumState.topicForm.content"
                rows="6"
                class="w-full rounded-[1.35rem] border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-950 outline-none transition focus:border-[var(--p-primary-color)] focus:ring-4 focus:ring-[color-mix(in_srgb,var(--p-primary-color)_18%,white)] dark:border-white/10 dark:bg-zinc-950/70 dark:text-white dark:focus:ring-[color-mix(in_srgb,var(--p-primary-color)_18%,transparent)]"
                placeholder="Premier message du sujet"
              />
            </div>

            <LandingButton
              type="submit"
              size="lg"
              icon="send"
              :disabled="forumState.isSubmitting"
            >
              {{ forumState.isSubmitting ? 'Publication...' : 'Publier le sujet' }}
            </LandingButton>
          </form>
        </LandingWhiteCard>

        <LandingWhiteCard v-else-if="!viewerState.isAuthenticated">
          <LandingEyebrow>Participation</LandingEyebrow>
          <LandingHeading
            as="h2"
            size="card"
            class="mt-4"
          >
            Connectez-vous pour ouvrir un sujet
          </LandingHeading>
          <p class="mt-4 text-sm leading-7 text-zinc-600 dark:text-zinc-300">
            La lecture des sujets est publique, mais la creation d'un sujet est reservee aux
            utilisateurs authentifies.
          </p>
          <div class="mt-6 flex flex-wrap gap-3">
            <LandingButton
              size="sm"
              icon="person_add"
              @click="viewerState.goToRegister"
            >
              Creer un compte
            </LandingButton>
            <LandingButton
              variant="outlined"
              size="sm"
              @click="viewerState.goToAuth"
            >
              Se connecter
            </LandingButton>

            <LandingButton
              v-if="forumState.canManageForum"
              variant="outlined"
              size="sm"
              icon="admin_panel_settings"
              @click="viewerState.goToAdmin"
            >
              Administration
            </LandingButton>
          </div>
        </LandingWhiteCard>

        <div class="space-y-4">
          <NuxtLink
            v-for="topic in forumPage.topics"
            :key="topic.id"
            :to="`${forumState.forumPath}/topics/${topic.slug}`"
            class="block transition hover:-translate-y-1"
          >
            <LandingWhiteCard>
              <div class="flex flex-wrap items-start justify-between gap-4">
                <div class="max-w-3xl">
                  <div class="flex flex-wrap items-center gap-3">
                    <h2 class="text-2xl font-semibold tracking-[-0.05em]">
                      {{ topic.title }}
                    </h2>

                    <LandingTag
                      v-if="topic.isLocked"
                      tone="secondary"
                      size="sm"
                      icon="lock"
                    >
                      Verrouille
                    </LandingTag>
                  </div>

                  <p class="mt-3 text-sm leading-7 text-zinc-600 dark:text-zinc-300">
                    Ouvert par {{ topic.author.username }} le
                    {{ formatForumDateTime(topic.createdAt) }}
                  </p>
                </div>

                <LandingPill variant="accent">
                  {{ formatCount(topic.messageCount, 'message') }}
                </LandingPill>
              </div>

              <div
                class="mt-6 grid gap-3 rounded-[1.75rem] border border-zinc-200/70 bg-zinc-50/70 p-4 text-sm text-zinc-600 dark:border-white/10 dark:bg-zinc-950/35 dark:text-zinc-300 md:grid-cols-2"
              >
                <p>
                  Dernier message :
                  <span class="font-semibold text-zinc-900 dark:text-white">
                    {{
                      topic.lastMessage
                        ? formatForumDateTime(topic.lastMessage.createdAt)
                        : 'Aucun message'
                    }}
                  </span>
                </p>
                <p>
                  Dernier auteur :
                  <span class="font-semibold text-zinc-900 dark:text-white">
                    {{
                      topic.lastMessage ? topic.lastMessage.author.username : topic.author.username
                    }}
                  </span>
                </p>
              </div>
            </LandingWhiteCard>
          </NuxtLink>

          <LandingWhiteCard v-if="forumPage.topics.length === 0">
            <LandingEyebrow>Aucun sujet</LandingEyebrow>
            <LandingHeading
              as="h2"
              size="card"
              class="mt-4"
            >
              Ce forum ne contient encore aucun sujet.
            </LandingHeading>
            <p class="mt-4 text-sm leading-7 text-zinc-600 dark:text-zinc-300">
              {{
                viewerState.isAuthenticated
                  ? 'Vous pouvez ouvrir le premier sujet de ce forum.'
                  : 'Connectez-vous pour lancer la premiere discussion.'
              }}
            </p>
          </LandingWhiteCard>
        </div>

        <ForumPagination
          :base-path="forumState.forumPath"
          :pagination="forumPage.pagination"
        />
      </div>
    </main>
  </div>
</template>
