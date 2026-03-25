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
  default: 'border-zinc-200/80 bg-stone-50/80 dark:border-white/10 dark:bg-zinc-950/45',
  inverse: 'border-white/10 bg-white/5 text-white dark:bg-white/5',
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
