<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    variant?: 'panel' | 'plain'
    padding?: 'md' | 'lg'
  }>(),
  {
    variant: 'plain',
    padding: 'md',
  },
)

const variantClasses = {
  panel:
    'rounded-[2.5rem] border border-[color-mix(in_srgb,var(--p-primary-color)_30%,transparent)] bg-zinc-950 text-white shadow-[0_28px_80px_rgba(28,25,23,0.24)] dark:border-[color-mix(in_srgb,var(--p-primary-color)_34%,transparent)] dark:bg-zinc-900',
  plain: 'rounded-[2rem] bg-zinc-950 text-white dark:bg-zinc-100 dark:text-zinc-950',
}

const paddingClasses = {
  md: 'p-6',
  lg: 'p-7',
}
</script>

<template>
  <div :class="[variantClasses[props.variant], paddingClasses[props.padding]]">
    <slot />
  </div>
</template>
