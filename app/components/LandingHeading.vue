<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    as?: string
    size?: 'hero' | 'section' | 'card'
  }>(),
  {
    as: 'h2',
    size: 'section',
  },
)

const sizeClasses = {
  hero: 'text-5xl font-semibold tracking-[-0.08em] sm:text-6xl lg:text-7xl',
  section: 'text-4xl font-semibold tracking-[-0.06em] sm:text-5xl',
  card: 'text-3xl font-semibold tracking-[-0.05em]',
}
</script>

<template>
  <component
    :is="props.as"
    :class="sizeClasses[props.size]"
  >
    <slot />
  </component>
</template>
