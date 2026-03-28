<script setup lang="ts">
import type { ButtonProps } from 'primevue/button'

type LandingButtonVariant = 'primary' | 'outlined'
type LandingButtonSize = 'sm' | 'md' | 'lg'
type LandingButtonAlign = 'center' | 'start'

const props = withDefaults(
  defineProps<{
    variant?: LandingButtonVariant
    size?: LandingButtonSize
    align?: LandingButtonAlign
    fluid?: boolean
    type?: ButtonProps['type']
    disabled?: boolean
    icon?: string
    iconSize?: 'sm' | 'md' | 'lg'
  }>(),
  {
    variant: 'primary',
    size: 'md',
    align: 'center',
    fluid: false,
    type: 'button',
    disabled: false,
    icon: undefined,
    iconSize: 'md',
  },
)

const primeVariants: Record<LandingButtonVariant, ButtonProps['variant'] | undefined> = {
  primary: undefined,
  outlined: 'outlined',
}

const primeSizes: Record<LandingButtonSize, ButtonProps['size'] | undefined> = {
  sm: 'small',
  md: undefined,
  lg: 'large',
}

const variantClasses: Record<LandingButtonVariant, string> = {
  primary:
    '!shadow-[0_18px_45px_color-mix(in_srgb,var(--p-primary-color)_28%,transparent)] hover:!shadow-[0_22px_55px_color-mix(in_srgb,var(--p-primary-color)_34%,transparent)]',
  outlined: '!bg-white/45 hover:!bg-white/60 dark:!bg-white/5 dark:hover:!bg-white/10',
}

const sizeClasses: Record<LandingButtonSize, string> = {
  sm: '!text-sm',
  md: '!text-sm',
  lg: '!text-base',
}
</script>

<template>
  <Button
    :type="props.type"
    rounded
    :variant="primeVariants[props.variant]"
    :size="primeSizes[props.size]"
    :fluid="props.fluid"
    :disabled="props.disabled"
    class="!border !font-medium !tracking-[-0.02em] !transition !duration-200"
    :class="[
      variantClasses[props.variant],
      sizeClasses[props.size],
      props.align === 'start' ? '!justify-start' : '',
    ]"
  >
    <span class="inline-flex items-center gap-2">
      <LandingIcon
        v-if="props.icon"
        :name="props.icon"
        :size="props.iconSize"
      />
      <slot />
    </span>
  </Button>
</template>
