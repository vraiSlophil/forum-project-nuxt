<script setup lang="ts">
import type { TopicMessage } from '#shared/types/forum'
import type { ForumMessageAction } from '~/components/ForumMessageActionDial.vue'
import { formatForumDateTime } from '~/utils/forum-ui'

const props = defineProps<{
  canQuote: boolean
  editContent: string
  editError: string
  editPending: boolean
  isEditing: boolean
  isQuotePrepared: boolean
  showModerationMenu: boolean
  message: TopicMessage
}>()

const emit = defineEmits<{
  'delete-own': [messageId: string]
  'moderate-delete': [messageId: string]
  'moderate-restore': [messageId: string]
  'select-quote': [message: TopicMessage]
  'save-edit': [messageId: string]
  'start-edit': [message: TopicMessage]
  'update:edit-content': [value: string]
  'cancel-edit': []
}>()

const editContentModel = computed({
  get: () => props.editContent,
  set: (value: string) => emit('update:edit-content', value),
})

function handleQuoteClick() {
  emit('select-quote', props.message)
}

const deletedMessagePlaceholder = 'Ce message a ete supprime par la moderation.'
const canSeeModerationPreview = computed(
  () => props.message.isDeleted && props.message.permissions.canRestore,
)
const isActionsOpen = ref(false)

const userActions = computed<ForumMessageAction[]>(() => {
  const actions: ForumMessageAction[] = []

  if (props.canQuote) {
    actions.push({
      key: 'quote',
      label: 'Citer ce message',
      icon: 'format_quote',
      onSelect: handleQuoteClick,
    })
  }

  if (props.message.permissions.canEdit) {
    actions.push({
      key: 'edit',
      label: 'Modifier ce message',
      icon: 'edit',
      onSelect: () => emit('start-edit', props.message),
    })
  }

  if (props.message.permissions.canDeleteOwn) {
    actions.push({
      key: 'delete',
      label: 'Supprimer ce message',
      icon: 'delete',
      tone: 'danger',
      onSelect: () => emit('delete-own', props.message.id),
    })
  }

  return actions
})

const moderationActions = computed<ForumMessageAction[]>(() => {
  if (!props.showModerationMenu || !props.message.permissions.canModerate) {
    return []
  }

  const actions: ForumMessageAction[] = []

  if (props.message.permissions.canEdit) {
    actions.push({
      key: 'moderation-edit',
      label: 'Modifier en tant que moderateur',
      icon: 'edit',
      tone: 'moderation',
      onSelect: () => emit('start-edit', props.message),
    })
  }

  if (props.message.permissions.canRestore) {
    actions.push({
      key: 'moderate-restore',
      label: 'Restaurer le message',
      icon: 'settings_backup_restore',
      tone: 'moderation',
      onSelect: () => emit('moderate-restore', props.message.id),
    })
  } else {
    actions.push({
      key: 'moderate-delete',
      label: 'Supprimer par moderation',
      icon: 'gavel',
      tone: 'moderation',
      onSelect: () => emit('moderate-delete', props.message.id),
    })
  }

  return actions
})
</script>

<template>
  <LandingWhiteCard
    :id="`message-${props.message.id}`"
    class="overflow-visible relative"
    :class="isActionsOpen ? 'z-30' : 'z-0'"
  >
    <div class="flex flex-wrap items-start justify-between gap-4">
      <div class="flex items-start gap-4">
        <div
          class="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[color-mix(in_srgb,var(--p-primary-color)_18%,white)] text-sm font-bold uppercase text-[var(--p-primary-700)] dark:bg-[color-mix(in_srgb,var(--p-primary-color)_18%,transparent)] dark:text-[var(--p-primary-300)]"
        >
          {{ props.message.author.username.slice(0, 1) }}
        </div>

        <div>
          <div class="flex flex-wrap items-center gap-2">
            <p class="text-base font-semibold tracking-[-0.03em]">
              {{ props.message.author.username }}
            </p>

            <LandingTag
              v-if="props.message.isDeleted"
              tone="secondary"
              size="sm"
            >
              Modere
            </LandingTag>

            <LandingTag
              v-if="props.message.editedAt"
              tone="primary"
              size="sm"
            >
              Modifie
            </LandingTag>

            <LandingTag
              v-if="props.isQuotePrepared"
              tone="contrast"
              size="sm"
              icon="format_quote"
            >
              Citation prete
            </LandingTag>
          </div>

          <p class="mt-2 text-sm leading-7 text-zinc-500 dark:text-zinc-400">
            {{ formatForumDateTime(props.message.createdAt) }}
          </p>
        </div>
      </div>

      <div class="flex items-start gap-2">
        <ForumMessageActionDial
          v-if="moderationActions.length > 0"
          trigger-icon="admin_panel_settings"
          trigger-label="Ouvrir les actions de moderation"
          variant="moderation"
          :actions="moderationActions"
          @show="isActionsOpen = true"
          @hide="isActionsOpen = false"
        />

        <ForumMessageActionDial
          v-if="userActions.length > 0"
          trigger-icon="more_horiz"
          trigger-label="Ouvrir les actions du message"
          :actions="userActions"
          @show="isActionsOpen = true"
          @hide="isActionsOpen = false"
        />
      </div>
    </div>

    <div
      v-if="props.message.quotedMessage"
      class="mt-5 rounded-[1.3rem] border border-zinc-200/70 bg-zinc-50/55 px-4 py-3 text-sm text-zinc-600 dark:border-white/10 dark:bg-zinc-950/30 dark:text-zinc-300"
    >
      <div
        class="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-zinc-500 dark:text-zinc-400"
      >
        <LandingIcon
          name="format_quote"
          size="sm"
        />
        <span>Citation de {{ props.message.quotedMessage.author.username }}</span>
      </div>
      <p
        class="mt-2 whitespace-pre-wrap border-l-2 border-[color-mix(in_srgb,var(--p-primary-color)_48%,white)] pl-3 text-sm leading-6 text-zinc-700 dark:border-[color-mix(in_srgb,var(--p-primary-color)_42%,transparent)] dark:text-zinc-200"
      >
        {{ props.message.quotedMessage.content }}
      </p>
    </div>

    <div
      v-if="props.isEditing"
      class="mt-5 space-y-4"
    >
      <p
        v-if="props.editError"
        class="rounded-[1.4rem] border border-rose-200/70 bg-rose-50/80 px-4 py-3 text-sm font-medium text-rose-700 dark:border-rose-500/25 dark:bg-rose-500/10 dark:text-rose-200"
      >
        {{ props.editError }}
      </p>

      <textarea
        v-model="editContentModel"
        rows="6"
        class="w-full rounded-[1.35rem] border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-950 outline-none transition focus:border-[var(--p-primary-color)] focus:ring-4 focus:ring-[color-mix(in_srgb,var(--p-primary-color)_18%,white)] dark:border-white/10 dark:bg-zinc-950/70 dark:text-white dark:focus:ring-[color-mix(in_srgb,var(--p-primary-color)_18%,transparent)]"
      />

      <div class="flex flex-wrap gap-3">
        <LandingButton
          size="sm"
          icon="save"
          :disabled="props.editPending"
          @click="emit('save-edit', props.message.id)"
        >
          {{ props.editPending ? 'Enregistrement...' : 'Enregistrer' }}
        </LandingButton>

        <LandingButton
          variant="outlined"
          size="sm"
          @click="emit('cancel-edit')"
        >
          Annuler
        </LandingButton>
      </div>
    </div>

    <div
      v-else
      class="mt-5 space-y-3"
    >
      <p
        v-if="props.message.isDeleted"
        class="rounded-[1.35rem] border border-amber-200/70 bg-amber-50/90 px-4 py-3 text-sm font-medium leading-7 text-amber-800 dark:border-amber-500/25 dark:bg-amber-500/10 dark:text-amber-200"
      >
        {{ deletedMessagePlaceholder }}
      </p>

      <div
        v-if="canSeeModerationPreview"
        class="rounded-[1.3rem] border border-zinc-200/70 bg-zinc-50/80 px-4 py-4 text-sm text-zinc-500 dark:border-white/10 dark:bg-zinc-950/35 dark:text-zinc-400"
      >
        <p class="text-xs font-semibold uppercase tracking-[0.12em]">
          Version originale visible pour la moderation
        </p>
        <p class="mt-2 whitespace-pre-wrap leading-7 text-zinc-600 dark:text-zinc-300">
          {{ props.message.content }}
        </p>
      </div>

      <p
        v-else-if="!props.message.isDeleted"
        class="whitespace-pre-wrap text-base leading-8 text-zinc-700 dark:text-zinc-200"
      >
        {{ props.message.content }}
      </p>
    </div>

    <p
      v-if="props.isQuotePrepared"
      class="mt-4 text-xs font-medium uppercase tracking-[0.14em] text-[var(--p-primary-color)]"
    >
      Message sélectionné pour la citation
    </p>
  </LandingWhiteCard>
</template>
