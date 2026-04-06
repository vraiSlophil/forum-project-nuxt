<script setup lang="ts">
import type {
  CreateMessageInput,
  MessageMutationResponse,
  TopicMutationResponse,
  TopicPageResponse,
  UpdateMessageInput,
} from '#shared/types/forum'
import { readApiErrorMessage } from '~/utils/api-error'
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
const { fetch: fetchUserSession, loggedIn, user } = useUserSession()

await fetchUserSession()

const topicPage = await $fetch<TopicPageResponse>(`/api/forums/${forumSlug}/topics/${topicSlug}`, {
  query: pageQuery ? { page: pageQuery } : undefined,
})

useSeoMeta({
  title: `${topicPage.topic.title} | ${topicPage.forum.name}`,
  description: `Lecture paginee du sujet ${topicPage.topic.title} dans le forum ${topicPage.forum.name}.`,
})

const replyForm = reactive<CreateMessageInput>({
  content: '',
})

const editForm = reactive<UpdateMessageInput>({
  content: '',
})

const isReplyOpen = ref(topicPage.topic.permissions.canReply && topicPage.messages.length < 2)
const replyPending = ref(false)
const replyError = ref('')
const editingMessageId = ref<string | null>(null)
const editPending = ref(false)
const editError = ref('')

const forumPath = `/forums/${topicPage.forum.slug}`
const topicPath = `${forumPath}/topics/${topicPage.topic.slug}`
const isAuthenticated = computed(() => topicPage.viewer.isAuthenticated || loggedIn.value)
const canReply = computed(() => topicPage.topic.permissions.canReply || loggedIn.value)
const canModerate = computed(
  () => topicPage.topic.permissions.canModerate || user.value?.role === 'ADMIN',
)
const canDeleteTopic = computed(
  () => topicPage.topic.permissions.canDelete || user.value?.role === 'ADMIN',
)

async function goToAuth() {
  await navigateTo('/auth')
}

async function goToRegister() {
  await navigateTo('/auth?mode=register')
}

function startEditing(messageId: string, content: string) {
  editingMessageId.value = messageId
  editForm.content = content
  editError.value = ''
}

function cancelEditing() {
  editingMessageId.value = null
  editForm.content = ''
  editError.value = ''
}

async function submitReply() {
  replyPending.value = true
  replyError.value = ''

  try {
    const result = await $fetch<TopicMutationResponse>(`${topicPath}/messages`, {
      method: 'POST',
      body: replyForm,
    })

    await navigateTo(result.redirectTo)
  } catch (error) {
    replyError.value = readApiErrorMessage(error, 'Envoi de la reponse impossible')
  } finally {
    replyPending.value = false
  }
}

async function submitEdit(messageId: string) {
  editPending.value = true
  editError.value = ''

  try {
    const result = await $fetch<MessageMutationResponse>(`/api/messages/${messageId}`, {
      method: 'PATCH',
      body: editForm,
    })

    cancelEditing()
    await navigateTo(result.redirectTo)
  } catch (error) {
    editError.value = readApiErrorMessage(error, 'Modification impossible')
  } finally {
    editPending.value = false
  }
}

async function deleteTopic() {
  if (!window.confirm(`Supprimer le sujet "${topicPage.topic.title}" et tous ses messages ?`)) {
    return
  }

  try {
    await $fetch(`/api/admin/topics/${topicPage.topic.id}`, {
      method: 'DELETE',
    })

    await navigateTo(forumPath)
  } catch (error) {
    replyError.value = readApiErrorMessage(error, 'Suppression du sujet impossible')
  }
}

async function deleteMessage(messageId: string) {
  if (!window.confirm('Supprimer ce message ?')) {
    return
  }

  try {
    await $fetch(`/api/admin/messages/${messageId}`, {
      method: 'DELETE',
    })

    await navigateTo(route.fullPath, {
      replace: true,
    })
  } catch (error) {
    editError.value = readApiErrorMessage(error, 'Suppression du message impossible')
  }
}
</script>

<template>
  <div
    class="min-h-dvh bg-[linear-gradient(180deg,#fbf7ef_0%,#f4eee5_52%,#eee6db_100%)] text-zinc-950 dark:bg-[linear-gradient(180deg,#0b0b0c_0%,#101114_48%,#16181d_100%)] dark:text-zinc-100"
  >
    <ForumTopbar :viewer="topicPage.viewer" />

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
            :to="forumPath"
            class="hover:text-zinc-950 dark:hover:text-white"
          >
            {{ topicPage.forum.name }}
          </NuxtLink>
          <span>/</span>
          <span class="font-medium text-zinc-700 dark:text-zinc-200">
            {{ topicPage.topic.title }}
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
                  v-if="topicPage.topic.isLocked"
                  tone="secondary"
                  size="sm"
                  icon="lock"
                >
                  Verrouille
                </LandingTag>
              </div>

              <LandingHeading
                as="h1"
                size="hero"
                class="mt-6"
              >
                {{ topicPage.topic.title }}
              </LandingHeading>

              <p class="mt-5 max-w-3xl text-lg leading-8 text-zinc-600 dark:text-zinc-300">
                Sujet ouvert par {{ topicPage.topic.author.username }} le
                {{ formatForumDateTime(topicPage.topic.createdAt) }}.
              </p>
            </div>

            <div class="flex flex-wrap gap-3">
              <LandingPill variant="accent">
                {{ formatCount(topicPage.topic.messageCount, 'message') }}
              </LandingPill>
              <LandingPill
                v-if="canReply"
                variant="glass"
              >
                Reponses ouvertes
              </LandingPill>
            </div>
          </div>
        </LandingWhiteCard>

        <LandingWhiteCard v-if="canReply">
          <div class="flex flex-wrap items-center justify-between gap-4">
            <div>
              <LandingEyebrow>Repondre</LandingEyebrow>
              <p class="mt-3 text-sm leading-7 text-zinc-600 dark:text-zinc-300">
                Ajoutez une reponse au sujet. Les nouveaux messages sont affiches par ordre
                chronologique croissant.
              </p>
            </div>

            <LandingButton
              size="sm"
              icon="reply"
              @click="isReplyOpen = !isReplyOpen"
            >
              {{ isReplyOpen ? 'Fermer' : 'Repondre' }}
            </LandingButton>

            <LandingButton
              v-if="canDeleteTopic"
              variant="outlined"
              size="sm"
              icon="delete"
              @click="deleteTopic"
            >
              Supprimer le sujet
            </LandingButton>
          </div>

          <form
            v-if="isReplyOpen"
            class="mt-6 space-y-4"
            @submit.prevent="submitReply"
          >
            <p
              v-if="replyError"
              class="rounded-[1.4rem] border border-rose-200/70 bg-rose-50/80 px-4 py-3 text-sm font-medium text-rose-700 dark:border-rose-500/25 dark:bg-rose-500/10 dark:text-rose-200"
            >
              {{ replyError }}
            </p>

            <div class="space-y-2">
              <label
                for="reply-content"
                class="block text-sm font-semibold tracking-[-0.02em]"
              >
                Votre reponse
              </label>
              <textarea
                id="reply-content"
                v-model="replyForm.content"
                rows="6"
                class="w-full rounded-[1.35rem] border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-950 outline-none transition focus:border-[var(--p-primary-color)] focus:ring-4 focus:ring-[color-mix(in_srgb,var(--p-primary-color)_18%,white)] dark:border-white/10 dark:bg-zinc-950/70 dark:text-white dark:focus:ring-[color-mix(in_srgb,var(--p-primary-color)_18%,transparent)]"
                placeholder="Ajouter une reponse au sujet"
              />
            </div>

            <LandingButton
              type="submit"
              size="lg"
              icon="send"
              :disabled="replyPending"
            >
              {{ replyPending ? 'Envoi...' : 'Publier la reponse' }}
            </LandingButton>
          </form>
        </LandingWhiteCard>

        <LandingWhiteCard v-else-if="!isAuthenticated">
          <LandingEyebrow>Participation</LandingEyebrow>
          <LandingHeading
            as="h2"
            size="card"
            class="mt-4"
          >
            Connectez-vous pour repondre
          </LandingHeading>
          <p class="mt-4 text-sm leading-7 text-zinc-600 dark:text-zinc-300">
            La lecture du sujet est publique, mais la publication d'une reponse demande un compte.
          </p>
          <div class="mt-6 flex flex-wrap gap-3">
            <LandingButton
              size="sm"
              icon="person_add"
              @click="goToRegister"
            >
              Creer un compte
            </LandingButton>
            <LandingButton
              variant="outlined"
              size="sm"
              @click="goToAuth"
            >
              Se connecter
            </LandingButton>
          </div>
        </LandingWhiteCard>

        <LandingWhiteCard v-else>
          <LandingEyebrow>Sujet verrouille</LandingEyebrow>
          <p class="mt-4 text-sm leading-7 text-zinc-600 dark:text-zinc-300">
            Ce sujet est verrouille, aucune nouvelle reponse n'est autorisee.
          </p>

          <div
            v-if="canDeleteTopic"
            class="mt-6"
          >
            <LandingButton
              variant="outlined"
              size="sm"
              icon="delete"
              @click="deleteTopic"
            >
              Supprimer le sujet
            </LandingButton>
          </div>
        </LandingWhiteCard>

        <div class="space-y-4">
          <LandingWhiteCard
            v-for="message in topicPage.messages"
            :id="`message-${message.id}`"
            :key="message.id"
          >
            <div class="flex flex-wrap items-start justify-between gap-4">
              <div class="flex items-start gap-4">
                <div
                  class="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[color-mix(in_srgb,var(--p-primary-color)_18%,white)] text-sm font-bold uppercase text-[var(--p-primary-700)] dark:bg-[color-mix(in_srgb,var(--p-primary-color)_18%,transparent)] dark:text-[var(--p-primary-300)]"
                >
                  {{ message.author.username.slice(0, 1) }}
                </div>

                <div>
                  <div class="flex flex-wrap items-center gap-2">
                    <p class="text-base font-semibold tracking-[-0.03em]">
                      {{ message.author.username }}
                    </p>

                    <LandingTag
                      v-if="message.isDeleted"
                      tone="secondary"
                      size="sm"
                    >
                      Modere
                    </LandingTag>

                    <LandingTag
                      v-if="message.editedAt"
                      tone="primary"
                      size="sm"
                    >
                      Modifie
                    </LandingTag>
                  </div>

                  <p class="mt-2 text-sm leading-7 text-zinc-500 dark:text-zinc-400">
                    {{ formatForumDateTime(message.createdAt) }}
                  </p>
                </div>
              </div>

              <LandingButton
                v-if="message.permissions.canEdit"
                variant="outlined"
                size="sm"
                icon="edit"
                @click="startEditing(message.id, message.content)"
              >
                Modifier
              </LandingButton>

              <LandingButton
                v-if="message.permissions.canDelete || canModerate"
                variant="outlined"
                size="sm"
                icon="delete"
                @click="deleteMessage(message.id)"
              >
                Supprimer
              </LandingButton>
            </div>

            <div
              v-if="message.quotedMessage"
              class="mt-5 rounded-[1.5rem] border border-zinc-200/70 bg-zinc-50/80 px-4 py-4 text-sm text-zinc-600 dark:border-white/10 dark:bg-zinc-950/35 dark:text-zinc-300"
            >
              <p class="font-semibold text-zinc-900 dark:text-white">
                Citation de {{ message.quotedMessage.author.username }}
              </p>
              <p class="mt-2 whitespace-pre-wrap leading-7">
                {{ message.quotedMessage.content }}
              </p>
            </div>

            <div
              v-if="editingMessageId === message.id"
              class="mt-5 space-y-4"
            >
              <p
                v-if="editError"
                class="rounded-[1.4rem] border border-rose-200/70 bg-rose-50/80 px-4 py-3 text-sm font-medium text-rose-700 dark:border-rose-500/25 dark:bg-rose-500/10 dark:text-rose-200"
              >
                {{ editError }}
              </p>

              <textarea
                v-model="editForm.content"
                rows="6"
                class="w-full rounded-[1.35rem] border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-950 outline-none transition focus:border-[var(--p-primary-color)] focus:ring-4 focus:ring-[color-mix(in_srgb,var(--p-primary-color)_18%,white)] dark:border-white/10 dark:bg-zinc-950/70 dark:text-white dark:focus:ring-[color-mix(in_srgb,var(--p-primary-color)_18%,transparent)]"
              />

              <div class="flex flex-wrap gap-3">
                <LandingButton
                  size="sm"
                  icon="save"
                  :disabled="editPending"
                  @click="submitEdit(message.id)"
                >
                  {{ editPending ? 'Enregistrement...' : 'Enregistrer' }}
                </LandingButton>

                <LandingButton
                  variant="outlined"
                  size="sm"
                  @click="cancelEditing"
                >
                  Annuler
                </LandingButton>
              </div>
            </div>

            <div
              v-else
              class="mt-5 whitespace-pre-wrap text-base leading-8 text-zinc-700 dark:text-zinc-200"
            >
              {{ message.content }}
            </div>
          </LandingWhiteCard>
        </div>

        <ForumPagination
          :base-path="topicPath"
          :pagination="topicPage.pagination"
        />

        <LandingWhiteCard
          v-if="topicPage.pagination.hasNextPage"
          class="text-sm text-zinc-600 dark:text-zinc-300"
        >
          <p>
            Le dernier message du sujet se trouve plus bas dans la pagination.
            <NuxtLink
              :to="buildPageHref(topicPath, topicPage.pagination.totalPages)"
              class="font-semibold text-zinc-950 underline dark:text-white"
            >
              Aller a la derniere page
            </NuxtLink>
          </p>
        </LandingWhiteCard>
      </div>
    </main>
  </div>
</template>
