<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    kind?: 'panel' | 'cta'
    noise?: boolean
  }>(),
  {
    kind: 'panel',
    noise: false,
  },
)

const kindClasses = {
  panel: 'rounded-[2.5rem] p-6',
  cta: 'rounded-[2.75rem] px-8 py-12 sm:px-10 sm:py-14',
}
</script>

<template>
  <div
    class="relative overflow-hidden border border-white/70 bg-white/70 shadow-[0_24px_70px_rgba(120,113,108,0.16)] backdrop-blur-2xl dark:border-white/10 dark:bg-zinc-900/65 dark:shadow-[0_24px_70px_rgba(0,0,0,0.34)]"
    :class="kindClasses[props.kind]"
  >
    <div
      v-if="props.noise"
      class="pointer-events-none absolute inset-0 rounded-[inherit] opacity-35 mix-blend-soft-light [background-image:radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.45),transparent_32%),radial-gradient(circle_at_80%_0%,rgba(255,255,255,0.24),transparent_22%),radial-gradient(rgba(24,24,27,0.08)_0.7px,transparent_0.7px),radial-gradient(rgba(255,255,255,0.18)_0.55px,transparent_0.55px)] [background-position:center,center,0_0,4px_5px] [background-size:auto,auto,12px_12px,9px_9px] dark:opacity-25"
    />

    <div :class="props.noise ? 'relative z-10' : ''">
      <slot />
    </div>
  </div>
</template>
