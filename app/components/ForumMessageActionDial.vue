<script setup lang="ts">
import type { MenuItem } from 'primevue/menuitem'

type ForumMessageActionTone = 'default' | 'danger' | 'moderation'

export interface ForumMessageAction {
  icon: string
  key: string
  label: string
  onSelect: () => void
  tone?: ForumMessageActionTone
}

const props = defineProps<{
  actions: ForumMessageAction[]
  triggerIcon: string
  triggerLabel: string
  variant?: 'default' | 'moderation'
}>()

const emit = defineEmits<{
  show: []
  hide: []
}>()

const menuModel = computed<MenuItem[]>(() =>
  props.actions.map((action) => ({
    key: action.key,
    label: action.label,
    icon: 'custom',
    iconName: action.icon,
    tone: action.tone ?? 'default',
    command: () => action.onSelect(),
  })),
)

const dialRadius = computed(() => (props.actions.length <= 1 ? 48 : 56))

const triggerButtonProps = computed(() => ({
  rounded: true,
  variant: 'outlined',
  size: 'small',
  class:
    '!h-9 !w-9 !border !px-0 !transition !duration-200 !justify-center !bg-amber-50 hover:!bg-amber-100 dark:!bg-zinc-900 dark:hover:!bg-zinc-800',
}))

const actionButtonProps = computed(() => ({
  rounded: true,
  variant: 'outlined',
  size: 'small',
  class:
    '!h-9 !w-9 !border !px-0 !transition !duration-200 !justify-center !bg-amber-50 hover:!bg-amber-100 dark:!bg-zinc-900 dark:hover:!bg-zinc-800',
}))
</script>

<template>
  <SpeedDial
    v-if="props.actions.length > 0"
    :model="menuModel"
    direction="down"
    :radius="dialRadius"
    :hide-on-click-outside="true"
    :aria-label="props.triggerLabel"
    :button-props="triggerButtonProps"
    :action-button-props="actionButtonProps"
    show-icon="custom"
    hide-icon="custom"
    class="!relative z-10"
    :pt="{
      list: {
        class: 'absolute top-[calc(100%+0.5rem)]',
      },
    }"
    @show="emit('show')"
    @hide="emit('hide')"
  >
    <template #icon="{ visible }">
      <LandingIcon
        :name="visible ? 'close' : props.triggerIcon"
        size="sm"
      />
    </template>

    <template #itemicon="{ item, class: iconClass }">
      <LandingIcon
        :name="item.iconName"
        size="sm"
        :class="iconClass"
      />
    </template>
  </SpeedDial>
</template>
