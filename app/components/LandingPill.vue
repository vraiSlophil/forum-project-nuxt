<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    variant?: 'glass' | 'solid' | 'ghost' | 'accent' | 'inverse'
    size?: 'sm' | 'lg' | 'block'
  }>(),
  {
    variant: 'glass',
    size: 'sm',
  },
)

const variantClasses = {
  glass:
    'border border-white/70 bg-white/70 text-zinc-700 shadow-[0_12px_30px_rgba(120,113,108,0.08)] backdrop-blur-xl dark:border-white/10 dark:bg-zinc-900/65 dark:text-zinc-200',
  solid:
    'bg-zinc-950 text-white shadow-[0_18px_45px_rgba(28,25,23,0.24)] dark:bg-white dark:text-zinc-950',
  ghost: 'border border-transparent text-zinc-600 dark:text-zinc-300',
  accent:
    'bg-[var(--p-primary-100)] text-[var(--p-primary-700)] dark:bg-[color-mix(in_srgb,var(--p-primary-color)_16%,transparent)] dark:text-[var(--p-primary-300)]',
  inverse: 'bg-white/10 text-white/80 dark:bg-zinc-950/8 dark:text-zinc-700',
}

const sizeClasses = {
  sm: 'gap-2 px-4 py-2 text-sm font-medium',
  lg: 'gap-2 px-6 py-3 text-base font-medium',
  block: 'gap-2 px-5 py-4 text-sm font-medium',
}
</script>

<template>
  <span
    class="inline-flex items-center rounded-full text-nowrap"
    :class="[variantClasses[props.variant], sizeClasses[props.size]]"
  >
    <slot />
  </span>
</template>
