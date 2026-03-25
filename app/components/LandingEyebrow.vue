<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    as?: string
    tone?: 'default' | 'inverse'
  }>(),
  {
    as: 'p',
    tone: 'default',
  },
)

const toneClasses = {
  default: 'text-zinc-400 dark:text-zinc-500',
  inverse: 'text-white/50 dark:text-zinc-500',
}
</script>

<template>
  <component
    :is="props.as"
    class="text-sm font-semibold uppercase tracking-[0.24em]"
    :class="toneClasses[props.tone]"
  >
    <slot />
  </component>
</template>
