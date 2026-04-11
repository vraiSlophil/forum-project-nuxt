<script setup lang="ts">
import type { PaginationInfo } from '#shared/types/forum'
import { buildPageHref } from '~/utils/forum-ui'

const props = defineProps<{
  basePath: string
  pagination: PaginationInfo
}>()

const visiblePages = computed(() => {
  const totalPages = props.pagination.totalPages
  const currentPage = props.pagination.page

  let start = Math.max(1, currentPage - 2)
  const end = Math.min(totalPages, start + 4)

  start = Math.max(1, end - 4)

  return Array.from({ length: end - start + 1 }, (_, index) => start + index)
})

const firstVisiblePage = computed(() => visiblePages.value[0] ?? 1)
const lastVisiblePage = computed(
  () => visiblePages.value[visiblePages.value.length - 1] ?? props.pagination.totalPages,
)

const showLeadingEllipsis = computed(() => firstVisiblePage.value > 2)
const showTrailingEllipsis = computed(() => lastVisiblePage.value < props.pagination.totalPages - 1)
</script>

<template>
  <div
    v-if="props.pagination.totalPages > 1"
    class="flex flex-wrap items-center justify-between gap-4 rounded-[2rem] border border-[color-mix(in_srgb,var(--p-primary-color)_16%,white)] bg-white/70 px-5 py-4 shadow-[0_18px_45px_rgba(120,113,108,0.12)] backdrop-blur-2xl dark:border-[color-mix(in_srgb,var(--p-primary-color)_24%,transparent)] dark:bg-zinc-900/60"
  >
    <p class="text-sm font-medium text-zinc-600 dark:text-zinc-300">
      Page {{ props.pagination.page }} sur {{ props.pagination.totalPages }}
    </p>

    <div class="flex flex-wrap items-center gap-2">
      <NuxtLink
        v-if="props.pagination.hasPreviousPage"
        :to="buildPageHref(props.basePath, props.pagination.page - 1)"
        class="inline-flex min-h-10 items-center rounded-full border border-zinc-200 px-4 text-sm font-medium text-zinc-700 transition hover:border-[var(--p-primary-color)] hover:text-zinc-950 dark:border-white/10 dark:text-zinc-200"
      >
        Precedent
      </NuxtLink>

      <NuxtLink
        v-if="firstVisiblePage !== 1"
        :to="buildPageHref(props.basePath, 1)"
        class="inline-flex min-h-10 min-w-10 items-center justify-center rounded-full border border-zinc-200 px-3 text-sm font-medium text-zinc-700 transition hover:border-[var(--p-primary-color)] hover:text-zinc-950 dark:border-white/10 dark:text-zinc-200"
      >
        1
      </NuxtLink>

      <span
        v-if="showLeadingEllipsis"
        class="px-2 text-sm text-zinc-500 dark:text-zinc-400"
      >
        ...
      </span>

      <NuxtLink
        v-for="pageNumber in visiblePages"
        :key="pageNumber"
        :to="buildPageHref(props.basePath, pageNumber)"
        class="inline-flex min-h-10 min-w-10 items-center justify-center rounded-full border px-3 text-sm font-semibold transition"
        :class="
          pageNumber === props.pagination.page
            ? 'border-[var(--p-primary-color)] bg-[var(--p-primary-color)] text-[var(--p-primary-contrast-color)]'
            : 'border-zinc-200 text-zinc-700 hover:border-[var(--p-primary-color)] hover:text-zinc-950 dark:border-white/10 dark:text-zinc-200'
        "
      >
        {{ pageNumber }}
      </NuxtLink>

      <span
        v-if="showTrailingEllipsis"
        class="px-2 text-sm text-zinc-500 dark:text-zinc-400"
      >
        ...
      </span>

      <NuxtLink
        v-if="lastVisiblePage !== props.pagination.totalPages"
        :to="buildPageHref(props.basePath, props.pagination.totalPages)"
        class="inline-flex min-h-10 min-w-10 items-center justify-center rounded-full border border-zinc-200 px-3 text-sm font-medium text-zinc-700 transition hover:border-[var(--p-primary-color)] hover:text-zinc-950 dark:border-white/10 dark:text-zinc-200"
      >
        {{ props.pagination.totalPages }}
      </NuxtLink>

      <NuxtLink
        v-if="props.pagination.hasNextPage"
        :to="buildPageHref(props.basePath, props.pagination.page + 1)"
        class="inline-flex min-h-10 items-center rounded-full border border-zinc-200 px-4 text-sm font-medium text-zinc-700 transition hover:border-[var(--p-primary-color)] hover:text-zinc-950 dark:border-white/10 dark:text-zinc-200"
      >
        Suivant
      </NuxtLink>
    </div>
  </div>
</template>
