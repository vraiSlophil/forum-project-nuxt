import type {
  ForumPageResponse,
  ForumTopicRealtimeEvent,
  PaginationInfo,
  TopicSummary,
  CreateTopicInput,
  TopicMutationResponse,
} from '#shared/types/forum'
import { buildPageHref } from '~/utils/forum-ui'
import { readApiErrorMessage } from '~/utils/api-error'

type ForumViewerState = {
  isAdmin: Readonly<Ref<boolean>>
  isAuthenticated: Readonly<Ref<boolean>>
}

type RealtimeNotice = {
  href: string
  label: string
  message: string
}

function cloneTopic(topic: TopicSummary): TopicSummary {
  return {
    ...topic,
    author: {
      ...topic.author,
    },
    lastMessage: topic.lastMessage
      ? {
          ...topic.lastMessage,
          author: {
            ...topic.lastMessage.author,
          },
        }
      : null,
  }
}

function cloneTopics(topics: TopicSummary[]) {
  return topics.map((topic) => cloneTopic(topic))
}

function clonePagination(pagination: PaginationInfo): PaginationInfo {
  return {
    ...pagination,
  }
}

function sortTopics(topics: TopicSummary[]) {
  return [...topics].sort((left, right) => {
    if (left.lastMessageAt === right.lastMessageAt) {
      if (left.createdAt === right.createdAt) {
        return right.id.localeCompare(left.id)
      }

      return right.createdAt.localeCompare(left.createdAt)
    }

    return right.lastMessageAt.localeCompare(left.lastMessageAt)
  })
}

function withPaginationTotal(pagination: PaginationInfo, totalItems: number): PaginationInfo {
  const totalPages = Math.max(1, Math.ceil(totalItems / pagination.pageSize))

  return {
    ...pagination,
    totalItems,
    totalPages,
    hasPreviousPage: pagination.page > 1,
    hasNextPage: pagination.page < totalPages,
  }
}

function isForumTopicRealtimeEvent(event: unknown): event is ForumTopicRealtimeEvent {
  if (!event || typeof event !== 'object' || Array.isArray(event)) {
    return false
  }

  const candidate = event as Record<string, unknown>

  return (
    typeof candidate.forumId === 'string' &&
    typeof candidate.topicId === 'string' &&
    typeof candidate.type === 'string' &&
    candidate.type.startsWith('topic.')
  )
}

export function useForumPage(forumPage: ForumPageResponse, viewerState: ForumViewerState) {
  const topicForm = reactive<CreateTopicInput>({
    title: '',
    content: '',
  })

  const isComposerOpen = ref(
    forumPage.forum.permissions.canCreateTopic && forumPage.topics.length === 0,
  )
  const isSubmitting = ref(false)
  const submitError = ref('')
  const topics = ref(cloneTopics(forumPage.topics))
  const pagination = ref(clonePagination(forumPage.pagination))
  const realtimeNotice = ref<RealtimeNotice | null>(null)

  const forumPath = `/forums/${forumPage.forum.slug}`
  const realtimeChannel = computed(() => `forums:${forumPage.forum.id}:topics`)
  const canCreateTopic = computed(
    () => forumPage.forum.permissions.canCreateTopic || viewerState.isAuthenticated.value,
  )
  const canManageForum = computed(() => forumPage.viewer.isAdmin || viewerState.isAdmin.value)
  const isFirstPage = computed(() => pagination.value.page === 1)

  function toggleComposer() {
    isComposerOpen.value = !isComposerOpen.value
  }

  function showRealtimeNotice(
    message: string,
    href = buildPageHref(forumPath, pagination.value.page),
  ) {
    realtimeNotice.value = {
      href,
      label: href === forumPath ? 'Voir la page 1' : 'Recharger cette page',
      message,
    }
  }

  function upsertTopic(topic: TopicSummary) {
    const nextTopic = cloneTopic(topic)
    const topicIndex = topics.value.findIndex((candidate) => candidate.id === nextTopic.id)

    if (topicIndex === -1) {
      topics.value = sortTopics([...topics.value, nextTopic]).slice(0, pagination.value.pageSize)
      return
    }

    topics.value.splice(topicIndex, 1, nextTopic)
    topics.value = sortTopics(topics.value)
  }

  function removeTopic(topicId: string) {
    topics.value = topics.value.filter((topic) => topic.id !== topicId)
  }

  function applyRealtimeEvent(event: ForumTopicRealtimeEvent) {
    if (event.forumId !== forumPage.forum.id) {
      return
    }

    if (event.type === 'topic.created') {
      pagination.value = withPaginationTotal(pagination.value, pagination.value.totalItems + 1)

      if (!isFirstPage.value || !event.topic) {
        showRealtimeNotice('De nouveaux sujets sont disponibles.', forumPath)
        return
      }

      upsertTopic(event.topic)
      return
    }

    if (event.type === 'topic.deleted') {
      pagination.value = withPaginationTotal(
        pagination.value,
        Math.max(0, pagination.value.totalItems - 1),
      )

      if (!isFirstPage.value) {
        showRealtimeNotice(
          'La liste des sujets a changé.',
          buildPageHref(forumPath, pagination.value.page),
        )
        return
      }

      removeTopic(event.topicId)
      return
    }

    if (!event.topic) {
      return
    }

    if (!isFirstPage.value) {
      showRealtimeNotice('Une activité récente est disponible dans ce forum.', forumPath)
      return
    }

    upsertTopic(event.topic)
  }

  async function submitTopic() {
    isSubmitting.value = true
    submitError.value = ''

    try {
      const result = await $fetch<TopicMutationResponse>(
        `/api/forums/${forumPage.forum.slug}/topics`,
        {
          method: 'POST',
          body: topicForm,
        },
      )

      await navigateTo(result.redirectTo)
    } catch (error) {
      submitError.value = readApiErrorMessage(error, 'Création du sujet impossible')
    } finally {
      isSubmitting.value = false
    }
  }

  if (import.meta.client) {
    const realtimeClient = useForumRealtimeClient()
    let unsubscribe: (() => void) | undefined

    onMounted(() => {
      if (!realtimeClient) {
        return
      }

      unsubscribe = realtimeClient.subscribe(realtimeChannel.value, (event) => {
        if (!isForumTopicRealtimeEvent(event)) {
          return
        }

        applyRealtimeEvent(event)
      })
    })

    onBeforeUnmount(() => {
      unsubscribe?.()
    })
  }

  return {
    applyRealtimeEvent,
    canCreateTopic,
    canManageForum,
    forumPath,
    isComposerOpen,
    isSubmitting,
    pagination,
    realtimeChannel,
    realtimeNotice,
    submitError,
    submitTopic,
    toggleComposer,
    topicForm,
    topics,
  }
}
