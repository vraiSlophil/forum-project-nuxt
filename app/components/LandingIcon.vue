<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    name?: string
    size?: 'xs' | 'sm' | 'md' | 'lg'
  }>(),
  {
    name: '',
    size: 'md',
  },
)

const sizeClasses = {
  xs: '!text-[16px]',
  sm: '!text-[18px]',
  md: '!text-[20px]',
  lg: '!text-[24px]',
}
</script>

<template>
  <span
    class="material-symbols-rounded shrink-0"
    :class="sizeClasses[props.size]"
  >
    <slot>
      {{ props.name }}
    </slot>
  </span>
</template>
