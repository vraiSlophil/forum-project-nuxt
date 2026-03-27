<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    padding?: 'md' | 'lg'
    tone?: 'default' | 'inverse'
  }>(),
  {
    padding: 'md',
    tone: 'default',
  },
)

const paddingClasses = {
  md: 'p-5',
  lg: 'p-6',
}

const toneClasses = {
  default:
    'border-[color-mix(in_srgb,var(--p-primary-color)_18%,white)] bg-stone-50/80 dark:border-[color-mix(in_srgb,var(--p-primary-color)_28%,transparent)] dark:bg-zinc-950/45',
  inverse:
    'border-[color-mix(in_srgb,var(--p-primary-color)_26%,transparent)] bg-white/5 text-white dark:bg-white/5',
}
</script>

<template>
  <div
    class="rounded-[2rem] border"
    :class="[paddingClasses[props.padding], toneClasses[props.tone]]"
  >
    <slot />
  </div>
</template>
