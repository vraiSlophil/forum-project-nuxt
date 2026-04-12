<script setup lang="ts">
import type { ForumsResponse } from '#shared/types/forum'
import { formatCount, formatForumDate } from '~/utils/forum-ui'

useSeoMeta({
  title: 'Horizon Forum',
  description:
    'Liste des forums, lecture publique et navigation SSR dans la hierarchie Forums, Sujets et Messages.',
})

const authHeaders = import.meta.server ? useRequestHeaders(['cookie']) : undefined
const forumsResponse = await $fetch<ForumsResponse>('/api/forums', {
  headers: authHeaders,
})
const viewerStateSource = await useForumViewer(() => forumsResponse.viewer)
const viewerState = reactive(viewerStateSource)

const totalTopics = computed(() =>
  forumsResponse.forums.reduce((total, forum) => total + forum.topicCount, 0),
)

const canOpenAdmin = computed(() => viewerState.isAdmin)
const firstForumPath = computed(() => {
  const firstForum = forumsResponse.forums[0]

  return firstForum ? `/forums/${firstForum.slug}` : null
})
</script>

<template>
  <div
    class="min-h-dvh bg-[linear-gradient(180deg,#fbf7ef_0%,#f4eee5_52%,#eee6db_100%)] text-zinc-950 dark:bg-[linear-gradient(180deg,#0b0b0c_0%,#101114_48%,#16181d_100%)] dark:text-zinc-100"
  >
    <LandingOrbField />
    <ForumTopbar :viewer="viewerState.effectiveViewer" />

    <main class="relative z-10 px-6 pb-20 pt-8 lg:px-10">
      <div class="mx-auto flex max-w-6xl flex-col gap-8">
        <LandingWhiteCard
          kind="cta"
          noise
        >
          <div class="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
            <div>
              <LandingPill variant="glass">Accueil du forum</LandingPill>

              <LandingHeading
                as="h1"
                size="hero"
                class="mt-6"
              >
                Forums publics, sujets tries par activite, messages pagines.
              </LandingHeading>

              <p class="mt-6 max-w-3xl text-lg leading-8 text-zinc-600 dark:text-zinc-300">
                La page d'accueil liste les forums disponibles avec leur nombre de sujets. La
                lecture reste ouverte, mais un compte est necessaire pour creer un sujet, repondre
                et modifier ses propres messages.
              </p>
            </div>

            <LandingDarkCard variant="panel">
              <div class="grid gap-4 sm:grid-cols-2">
                <LandingMutedCard tone="inverse">
                  <p class="text-sm uppercase tracking-[0.2em] text-white/60 dark:text-zinc-400">
                    Forums
                  </p>
                  <p class="mt-3 text-4xl font-semibold tracking-[-0.06em]">
                    {{ forumsResponse.forums.length }}
                  </p>
                </LandingMutedCard>

                <LandingMutedCard tone="inverse">
                  <p class="text-sm uppercase tracking-[0.2em] text-white/60 dark:text-zinc-400">
                    Sujets visibles
                  </p>
                  <p class="mt-3 text-4xl font-semibold tracking-[-0.06em]">
                    {{ totalTopics }}
                  </p>
                </LandingMutedCard>
              </div>

              <p class="mt-5 text-sm leading-7 text-white/70 dark:text-zinc-300">
                {{
                  viewerState.isAuthenticated
                    ? `Session active pour ${viewerState.username}.`
                    : 'Connectez-vous pour participer aux discussions.'
                }}
              </p>

              <div class="mt-5 flex flex-wrap gap-3">
                <LandingButton
                  v-if="firstForumPath"
                  size="sm"
                  icon="forum"
                  @click="navigateTo(firstForumPath)"
                >
                  Ouvrir les forums
                </LandingButton>

                <LandingButton
                  v-else-if="canOpenAdmin"
                  size="sm"
                  icon="admin_panel_settings"
                  @click="navigateTo('/admin')"
                >
                  Créer le premier forum
                </LandingButton>

                <LandingButton
                  v-else-if="!viewerState.isAuthenticated"
                  size="sm"
                  icon="login"
                  @click="viewerState.goToAuth"
                >
                  Se connecter
                </LandingButton>

                <LandingButton
                  v-if="canOpenAdmin"
                  variant="outlined"
                  size="sm"
                  icon="verified_user"
                  @click="navigateTo('/admin')"
                >
                  Administration
                </LandingButton>
              </div>
            </LandingDarkCard>
          </div>
        </LandingWhiteCard>

        <LandingWhiteCard>
          <LandingEyebrow>Comment publier</LandingEyebrow>
          <LandingHeading
            as="h2"
            size="card"
            class="mt-4"
          >
            Les entrées de création dépendent du niveau de droit.
          </LandingHeading>

          <div class="mt-6 grid gap-4 lg:grid-cols-3">
            <LandingMutedCard>
              <LandingTag
                tone="primary"
                size="sm"
                icon="admin_panel_settings"
              >
                1. Forum
              </LandingTag>
              <p class="mt-4 text-sm leading-7 text-zinc-600 dark:text-zinc-300">
                Un administrateur crée un forum depuis la page Administration.
              </p>
              <div
                v-if="canOpenAdmin"
                class="mt-5"
              >
                <LandingButton
                  size="sm"
                  icon="add"
                  @click="navigateTo('/admin')"
                >
                  Aller à l'administration
                </LandingButton>
              </div>
            </LandingMutedCard>

            <LandingMutedCard>
              <LandingTag
                tone="primary"
                size="sm"
                icon="add_comment"
              >
                2. Sujet
              </LandingTag>
              <p class="mt-4 text-sm leading-7 text-zinc-600 dark:text-zinc-300">
                Une fois dans un forum, le bouton Nouveau sujet ouvre le formulaire de création.
              </p>
              <div
                v-if="firstForumPath"
                class="mt-5"
              >
                <LandingButton
                  size="sm"
                  icon="forum"
                  @click="navigateTo(firstForumPath)"
                >
                  Ouvrir un forum
                </LandingButton>
              </div>
            </LandingMutedCard>

            <LandingMutedCard>
              <LandingTag
                tone="primary"
                size="sm"
                icon="reply"
              >
                3. Message
              </LandingTag>
              <p class="mt-4 text-sm leading-7 text-zinc-600 dark:text-zinc-300">
                Dans un sujet, le bouton Répondre ouvre le formulaire pour publier un message.
              </p>
              <p class="mt-5 text-xs leading-6 text-zinc-500 dark:text-zinc-400">
                La lecture est publique. La publication demande une session ouverte.
              </p>
            </LandingMutedCard>
          </div>
        </LandingWhiteCard>

        <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <NuxtLink
            v-for="forum in forumsResponse.forums"
            :key="forum.id"
            :to="`/forums/${forum.slug}`"
            class="block transition hover:-translate-y-1"
          >
            <LandingWhiteCard class="h-full">
              <div class="flex items-start justify-between gap-4">
                <div>
                  <LandingTag
                    tone="primary"
                    size="sm"
                    icon="folder_open"
                  >
                    Forum
                  </LandingTag>

                  <h2 class="mt-5 text-2xl font-semibold tracking-[-0.05em]">
                    {{ forum.name }}
                  </h2>
                </div>

                <LandingPill variant="accent">
                  {{ formatCount(forum.topicCount, 'sujet') }}
                </LandingPill>
              </div>

              <p class="mt-4 min-h-16 text-sm leading-7 text-zinc-600 dark:text-zinc-300">
                {{ forum.description ?? 'Ce forum est pret a accueillir de nouveaux sujets.' }}
              </p>

              <div
                class="mt-6 flex items-center justify-between border-t border-zinc-200/70 pt-4 text-sm text-zinc-500 dark:border-white/10 dark:text-zinc-400"
              >
                <span>Mis a jour le {{ formatForumDate(forum.updatedAt) }}</span>
                <span class="font-medium text-zinc-700 dark:text-zinc-200">Ouvrir</span>
              </div>
            </LandingWhiteCard>
          </NuxtLink>
        </div>

        <LandingWhiteCard v-if="forumsResponse.forums.length === 0">
          <LandingEyebrow>Aucun forum</LandingEyebrow>
          <LandingHeading
            as="h2"
            size="card"
            class="mt-4"
          >
            Aucun forum n'est encore disponible.
          </LandingHeading>
          <p class="mt-4 text-sm leading-7 text-zinc-600 dark:text-zinc-300">
            Un administrateur doit creer le premier forum avant d'ouvrir les discussions.
          </p>

          <div
            v-if="canOpenAdmin"
            class="mt-6"
          >
            <LandingButton
              size="sm"
              icon="admin_panel_settings"
              @click="navigateTo('/admin')"
            >
              Ouvrir l’administration
            </LandingButton>
          </div>
        </LandingWhiteCard>
      </div>
    </main>
  </div>
</template>
