<script setup lang="ts">
import type { TopicPageResponse } from '#shared/types/forum'
import {
  buildPageHref,
  formatCount,
  formatForumDateTime,
  readPageQueryParam,
} from '~/utils/forum-ui'

definePageMeta({
  key: (route) => route.fullPath,
})

const route = useRoute()
const forumSlug = String(route.params.forumSlug)
const topicSlug = String(route.params.topicSlug)
const pageQuery = readPageQueryParam(route.query.page)
const authHeaders = import.meta.server ? useRequestHeaders(['cookie']) : undefined
const topicPage = await $fetch<TopicPageResponse>(`/api/forums/${forumSlug}/topics/${topicSlug}`, {
  headers: authHeaders,
  query: pageQuery ? { page: pageQuery } : undefined,
})
const viewerStateSource = await useForumViewer(() => topicPage.viewer)
const viewerState = reactive(viewerStateSource)
const threadStateSource = useTopicThread(topicPage, viewerStateSource)
const threadState = reactive(threadStateSource)
const preparedQuote = computed(() => threadStateSource.preparedQuote.value)
const preparedQuoteMessageId = computed(() => threadStateSource.selectedQuoteMessageId.value)

function handleQuote(message: TopicPageResponse['messages'][number]) {
  threadStateSource.prepareQuote(message)
}

useSeoMeta({
  title: `${topicPage.topic.title} | ${topicPage.forum.name}`,
  description: `Lecture paginée du sujet ${topicPage.topic.title} dans le forum ${topicPage.forum.name}.`,
})
</script>

<template>
  <div
    class="min-h-dvh bg-[linear-gradient(180deg,#fbf7ef_0%,#f4eee5_52%,#eee6db_100%)] text-zinc-950 dark:bg-[linear-gradient(180deg,#0b0b0c_0%,#101114_48%,#16181d_100%)] dark:text-zinc-100"
  >
    <ForumTopbar :viewer="viewerState.effectiveViewer" />

    <main class="px-6 pb-20 pt-8 lg:px-10">
      <div class="mx-auto flex max-w-6xl flex-col gap-6">
        <nav class="flex flex-wrap items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400">
          <NuxtLink
            to="/"
            class="hover:text-zinc-950 dark:hover:text-white"
          >
            Forums
          </NuxtLink>
          <span>/</span>
          <NuxtLink
            :to="threadState.forumPath"
            class="hover:text-zinc-950 dark:hover:text-white"
          >
            {{ topicPage.forum.name }}
          </NuxtLink>
          <span>/</span>
          <span class="font-medium text-zinc-700 dark:text-zinc-200">
            {{ threadState.topic.title }}
          </span>
        </nav>

        <LandingWhiteCard
          kind="cta"
          noise
        >
          <div class="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <div class="flex flex-wrap items-center gap-3">
                <LandingPill variant="glass">Sujet</LandingPill>
                <LandingTag
                  v-if="threadState.topic.isLocked"
                  tone="secondary"
                  size="sm"
                  icon="lock"
                >
                  Verrouillé
                </LandingTag>
              </div>

              <LandingHeading
                as="h1"
                size="hero"
                class="mt-6"
              >
                {{ threadState.topic.title }}
              </LandingHeading>

              <p class="mt-5 max-w-3xl text-lg leading-8 text-zinc-600 dark:text-zinc-300">
                Sujet ouvert par {{ threadState.topic.author.username }} le
                {{ formatForumDateTime(threadState.topic.createdAt) }}.
              </p>
            </div>

            <div class="flex flex-col items-start gap-3 lg:items-end">
              <div class="flex flex-wrap gap-3">
                <LandingPill variant="accent">
                  {{ formatCount(threadState.topic.messageCount, 'message') }}
                </LandingPill>
                <LandingPill
                  v-if="threadState.canReply"
                  variant="glass"
                >
                  Réponses ouvertes
                </LandingPill>
              </div>

              <p
                v-if="threadState.topicActionError"
                class="text-sm font-medium text-rose-700 dark:text-rose-200"
              >
                {{ threadState.topicActionError }}
              </p>

              <div
                v-if="threadState.canManageTopic"
                class="flex flex-wrap gap-2"
              >
                <LandingButton
                  variant="outlined"
                  size="sm"
                  :icon="threadState.topic.isLocked ? 'lock_open' : 'lock'"
                  :disabled="threadState.topicActionPending"
                  @click="threadState.toggleTopicLock(!threadState.topic.isLocked)"
                >
                  {{ threadState.topic.isLocked ? 'Déverrouiller' : 'Verrouiller' }}
                </LandingButton>

                <LandingButton
                  variant="outlined"
                  size="sm"
                  icon="delete"
                  :disabled="threadState.topicActionPending"
                  @click="threadState.deleteTopic"
                >
                  Supprimer le sujet
                </LandingButton>
              </div>
            </div>
          </div>
        </LandingWhiteCard>

        <LandingWhiteCard
          v-if="threadState.realtimeNotice"
          class="border-[color-mix(in_srgb,var(--p-primary-color)_28%,white)] bg-[color-mix(in_srgb,var(--p-primary-color)_10%,white)] dark:border-[color-mix(in_srgb,var(--p-primary-color)_22%,transparent)] dark:bg-[color-mix(in_srgb,var(--p-primary-color)_10%,transparent)]"
        >
          <div class="flex flex-wrap items-center justify-between gap-3">
            <p class="text-sm leading-7 text-zinc-700 dark:text-zinc-200">
              {{ threadState.realtimeNotice.message }}
            </p>
            <NuxtLink :to="threadState.realtimeNotice.href">
              <LandingButton
                variant="outlined"
                size="sm"
                icon="refresh"
              >
                {{ threadState.realtimeNotice.label }}
              </LandingButton>
            </NuxtLink>
          </div>
        </LandingWhiteCard>

        <div class="space-y-4">
          <ForumMessageCard
            v-for="message in threadState.messages"
            :key="message.id"
            :can-quote="threadState.canReply && !message.isDeleted"
            :edit-content="threadState.editForm.content"
            :edit-error="threadState.editError"
            :edit-pending="threadState.editPending"
            :is-editing="threadState.editingMessageId === message.id"
            :is-quote-prepared="preparedQuoteMessageId === message.id"
            :message="message"
            :show-moderation-menu="threadState.canModerate"
            @cancel-edit="threadState.cancelEditing"
            @delete-own="threadState.deleteOwnMessage"
            @moderate-delete="threadState.moderateMessage"
            @moderate-restore="threadState.restoreModeratedMessage"
            @select-quote="handleQuote"
            @save-edit="threadState.submitEdit"
            @start-edit="threadState.startEditing"
            @update:edit-content="threadState.setEditContent"
          />
        </div>

        <LandingWhiteCard v-if="threadState.canReply">
          <div class="flex flex-wrap items-center justify-between gap-4">
            <div>
              <LandingEyebrow>Répondre</LandingEyebrow>
              <p class="mt-3 text-sm leading-7 text-zinc-600 dark:text-zinc-300">
                Ajoutez une réponse au sujet. Les nouveaux messages sont affichés par ordre
                chronologique croissant.
              </p>
              <p class="mt-2 text-xs leading-6 text-zinc-500 dark:text-zinc-400">
                Le flux temps réel écoute le canal
                <code>{{ threadState.realtimeChannel }}</code
                >.
              </p>
            </div>

            <LandingButton
              size="sm"
              icon="reply"
              @click="threadState.isReplyOpen = !threadState.isReplyOpen"
            >
              {{ threadState.isReplyOpen ? 'Fermer' : 'Répondre' }}
            </LandingButton>
          </div>

          <div
            v-if="preparedQuote"
            class="mt-6 rounded-[1.5rem] border border-zinc-200/70 bg-zinc-50/80 px-4 py-4 text-sm text-zinc-600 dark:border-white/10 dark:bg-zinc-950/35 dark:text-zinc-300"
          >
            <div class="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p class="font-semibold text-zinc-900 dark:text-white">
                  Citation préparée de {{ preparedQuote.authorUsername }}
                </p>
                <p class="mt-2 whitespace-pre-wrap leading-7">
                  {{ preparedQuote.content }}
                </p>
                <p
                  v-if="!preparedQuote.isLoaded"
                  class="mt-2 text-xs leading-6 text-zinc-500 dark:text-zinc-400"
                >
                  Le message cité n'est pas chargé sur cette page pour l'instant.
                </p>
                <p class="mt-1 text-xs leading-6 text-zinc-500 dark:text-zinc-400">
                  La citation sera reprise dans le message publié.
                </p>
              </div>

              <LandingButton
                variant="outlined"
                size="sm"
                icon="close"
                @click.prevent="threadState.clearQuote"
              >
                Retirer
              </LandingButton>
            </div>
          </div>

          <form
            v-if="threadState.isReplyOpen"
            class="mt-6 space-y-4"
            @submit.prevent="threadState.submitReply"
          >
            <p
              v-if="threadState.replyError"
              class="rounded-[1.4rem] border border-rose-200/70 bg-rose-50/80 px-4 py-3 text-sm font-medium text-rose-700 dark:border-rose-500/25 dark:bg-rose-500/10 dark:text-rose-200"
            >
              {{ threadState.replyError }}
            </p>

            <div class="space-y-2">
              <label
                for="reply-content"
                class="block text-sm font-semibold tracking-[-0.02em]"
              >
                Votre réponse
              </label>
              <textarea
                id="reply-content"
                v-model="threadState.replyForm.content"
                rows="6"
                class="w-full rounded-[1.35rem] border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-950 outline-none transition focus:border-[var(--p-primary-color)] focus:ring-4 focus:ring-[color-mix(in_srgb,var(--p-primary-color)_18%,white)] dark:border-white/10 dark:bg-zinc-950/70 dark:text-white dark:focus:ring-[color-mix(in_srgb,var(--p-primary-color)_18%,transparent)]"
                placeholder="Ajouter une réponse au sujet"
              />
            </div>

            <LandingButton
              type="submit"
              size="lg"
              icon="send"
              :disabled="threadState.replyPending"
            >
              {{ threadState.replyPending ? 'Envoi...' : 'Publier la réponse' }}
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
            Connectez-vous pour répondre
          </LandingHeading>
          <p class="mt-4 text-sm leading-7 text-zinc-600 dark:text-zinc-300">
            La lecture du sujet est publique, mais la publication d'une réponse demande un compte.
          </p>
          <div class="mt-6 flex flex-wrap gap-3">
            <LandingButton
              size="sm"
              icon="person_add"
              @click="viewerState.goToRegister"
            >
              Créer un compte
            </LandingButton>
            <LandingButton
              variant="outlined"
              size="sm"
              @click="viewerState.goToAuth"
            >
              Se connecter
            </LandingButton>
          </div>
        </LandingWhiteCard>

        <LandingWhiteCard v-else>
          <LandingEyebrow>Sujet verrouillé</LandingEyebrow>
          <p class="mt-4 text-sm leading-7 text-zinc-600 dark:text-zinc-300">
            Ce sujet est verrouillé, aucune nouvelle réponse n'est autorisée.
          </p>
        </LandingWhiteCard>

        <ForumPagination
          :base-path="threadState.topicPath"
          :pagination="threadState.pagination"
        />

        <LandingWhiteCard
          v-if="threadState.pagination.hasNextPage"
          class="text-sm text-zinc-600 dark:text-zinc-300"
        >
          <p>
            Le dernier message du sujet se trouve plus bas dans la pagination.
            <NuxtLink
              :to="buildPageHref(threadState.topicPath, threadState.pagination.totalPages)"
              class="font-semibold text-zinc-950 underline dark:text-white"
            >
              Aller à la dernière page
            </NuxtLink>
          </p>
        </LandingWhiteCard>
      </div>
    </main>
  </div>
</template>
