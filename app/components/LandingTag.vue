<script setup lang="ts">
import type { TagProps } from 'primevue/tag'

type LandingTagTone = 'primary' | 'contrast' | 'secondary'
type LandingTagSize = 'sm' | 'md'

const props = withDefaults(
  defineProps<{
    tone?: LandingTagTone
    size?: LandingTagSize
    icon?: string
  }>(),
  {
    tone: 'primary',
    size: 'md',
    icon: undefined,
  },
)

const severities: Record<LandingTagTone, TagProps['severity'] | undefined> = {
  primary: undefined,
  contrast: 'contrast',
  secondary: 'secondary',
}

const sizeClasses: Record<LandingTagSize, string> = {
  sm: '!text-xs',
  md: '!text-sm',
}
</script>

<template>
  <Tag
    rounded
    :severity="severities[props.tone]"
    class="!font-semibold !tracking-[-0.02em]"
    :class="sizeClasses[props.size]"
  >
    <span class="inline-flex items-center gap-2 text-nowrap">
      <LandingIcon
        v-if="props.icon"
        :name="props.icon"
        size="xs"
      />
      <slot />
    </span>
  </Tag>
</template>
