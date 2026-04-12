import type {
  CreateMessageInput,
  MessageDeletionResponse,
  MessageMutationResponse,
  ModerateMessageInput,
  PaginationInfo,
  TopicDetail,
  TopicMessage,
  TopicMessageRealtimeEvent,
  TopicPageResponse,
  TopicMutationResponse,
  UpdateMessageInput,
} from '#shared/types/forum'
import { readApiErrorMessage } from '~/utils/api-error'
import { buildPageHref } from '~/utils/forum-ui'

type TopicViewerState = {
  isAdmin: Readonly<Ref<boolean>>
  isAuthenticated: Readonly<Ref<boolean>>
}

type RealtimeNotice = {
  href: string
  label: string
  message: string
}

export interface PreparedTopicQuote {
  authorUsername: string
  content: string
  isLoaded: boolean
  messageId: string
}

function cloneQuotedMessage(message: NonNullable<TopicMessage['quotedMessage']>) {
  return {
    ...message,
    author: {
      ...message.author,
    },
  }
}

function cloneMessage(message: TopicMessage): TopicMessage {
  return {
    ...message,
    author: {
      ...message.author,
    },
    permissions: {
      ...message.permissions,
    },
    quotedMessage: message.quotedMessage ? cloneQuotedMessage(message.quotedMessage) : null,
  }
}

function hydrateMessagePermissions(
  message: TopicMessage,
  viewerState: TopicViewerState,
  viewerUserId: string | null,
): TopicMessage {
  const isAdmin = viewerState.isAdmin.value
  const isAuthor = viewerState.isAuthenticated.value && viewerUserId === message.author.id

  return {
    ...message,
    permissions: {
      ...message.permissions,
      canEdit: !message.isDeleted && (isAdmin || isAuthor),
      canDeleteOwn: !message.isDeleted && isAuthor,
      canModerate: isAdmin,
      canRestore: isAdmin && message.isDeleted,
    },
  }
}

function cloneMessages(messages: TopicMessage[]) {
  return messages.map((message) => cloneMessage(message))
}

function cloneTopic(topic: TopicDetail): TopicDetail {
  return {
    ...topic,
    author: {
      ...topic.author,
    },
    permissions: {
      ...topic.permissions,
    },
  }
}

function clonePagination(pagination: PaginationInfo): PaginationInfo {
  return {
    ...pagination,
  }
}

function sortMessages(messages: TopicMessage[]) {
  return [...messages].sort((left, right) => {
    if (left.createdAt === right.createdAt) {
      return left.id.localeCompare(right.id)
    }

    return left.createdAt.localeCompare(right.createdAt)
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

function isTopicMessageRealtimeEvent(event: unknown): event is TopicMessageRealtimeEvent {
  if (!event || typeof event !== 'object' || Array.isArray(event)) {
    return false
  }

  const candidate = event as Record<string, unknown>

  return (
    typeof candidate.topicId === 'string' &&
    typeof candidate.type === 'string' &&
    candidate.type.startsWith('message.') &&
    !!candidate.message &&
    typeof candidate.message === 'object'
  )
}

export function useTopicThread(topicPage: TopicPageResponse, viewerState: TopicViewerState) {
  const topicPath = `/forums/${topicPage.forum.slug}/topics/${topicPage.topic.slug}`
  const forumPath = `/forums/${topicPage.forum.slug}`
  const topicApiPath = `/api/forums/${topicPage.forum.slug}/topics/${topicPage.topic.slug}`

  const topic = ref(cloneTopic(topicPage.topic))
  const pagination = ref(clonePagination(topicPage.pagination))
  const messages = useState<TopicMessage[]>(
    `topic-messages:${topicPage.topic.id}:${topicPage.pagination.page}`,
    () => cloneMessages(topicPage.messages),
  )
  const preparedQuote = useState<PreparedTopicQuote | null>(
    `topic-quote:${topicPage.topic.id}`,
    () => null,
  )

  messages.value = cloneMessages(topicPage.messages)

  const replyForm = reactive<CreateMessageInput>({
    content: '',
  })
  const editForm = reactive<UpdateMessageInput>({
    content: '',
  })

  const isReplyOpen = ref(topic.value.permissions.canReply && topicPage.messages.length < 2)
  const replyPending = ref(false)
  const replyError = ref('')
  const editingMessageId = ref<string | null>(null)
  const editPending = ref(false)
  const editError = ref('')
  const realtimeNotice = ref<RealtimeNotice | null>(null)
  const refreshPending = ref(false)

  const canReply = computed(() => viewerState.isAuthenticated.value && !topic.value.isLocked)
  const canModerate = computed(
    () => topic.value.permissions.canModerate || viewerState.isAdmin.value,
  )
  const canDeleteTopic = computed(
    () => topic.value.permissions.canDelete || viewerState.isAdmin.value,
  )
  const realtimeChannel = computed(() => `topics:${topic.value.id}:messages`)
  const selectedQuoteMessageId = computed(() => preparedQuote.value?.messageId ?? null)
  const isLastPage = computed(() => pagination.value.page >= pagination.value.totalPages)

  function showRealtimeNotice(
    message: string,
    href = buildPageHref(topicPath, pagination.value.page),
    label = 'Recharger cette page',
  ) {
    realtimeNotice.value = {
      href,
      label,
      message,
    }
  }

  function setTopicPageState(nextPage: TopicPageResponse) {
    topic.value = cloneTopic(nextPage.topic)
    pagination.value = clonePagination(nextPage.pagination)
    messages.value = cloneMessages(nextPage.messages)
  }

  async function refreshCurrentPage() {
    if (refreshPending.value) {
      return
    }

    refreshPending.value = true

    try {
      const nextPage = await $fetch<TopicPageResponse>(topicApiPath, {
        query: pagination.value.page > 1 ? { page: pagination.value.page } : undefined,
      })

      setTopicPageState(nextPage)
    } finally {
      refreshPending.value = false
    }
  }

  function updateMessageTotals(totalItems: number) {
    const normalizedTotal = Math.max(0, totalItems)

    topic.value = {
      ...topic.value,
      messageCount: normalizedTotal,
    }
    pagination.value = withPaginationTotal(pagination.value, normalizedTotal)
  }

  function setEditContent(value: string) {
    editForm.content = value
  }

  function startEditing(message: TopicMessage) {
    editingMessageId.value = message.id
    editForm.content = message.content
    editError.value = ''
  }

  function cancelEditing() {
    editingMessageId.value = null
    editForm.content = ''
    editError.value = ''
  }

  function prepareQuote(message: TopicMessage) {
    preparedQuote.value = {
      authorUsername: message.author.username,
      content: message.content,
      isLoaded: true,
      messageId: message.id,
    }
    isReplyOpen.value = true
    replyError.value = ''
  }

  function clearQuote() {
    preparedQuote.value = null
  }

  function mergeRealtimeMessage(message: TopicMessage) {
    const nextMessage = hydrateMessagePermissions(
      cloneMessage(message),
      viewerState,
      topicPage.viewer.userId,
    )
    const messageIndex = messages.value.findIndex((candidate) => candidate.id === nextMessage.id)

    if (messageIndex === -1) {
      messages.value = sortMessages([...messages.value, nextMessage])
      return
    }

    messages.value.splice(messageIndex, 1, nextMessage)
  }

  function unlinkQuotedMessageLocally(messageId: string) {
    messages.value = messages.value.map((message) =>
      message.quotedMessage?.id === messageId
        ? {
            ...message,
            quotedMessage: null,
          }
        : message,
    )
  }

  function removeMessageLocally(messageId: string) {
    messages.value = messages.value.filter((message) => message.id !== messageId)
    unlinkQuotedMessageLocally(messageId)

    if (editingMessageId.value === messageId) {
      cancelEditing()
    }

    if (preparedQuote.value?.messageId === messageId) {
      clearQuote()
    }
  }

  function markMessageModeratedLocally(messageId: string) {
    const deletedAt = new Date().toISOString()

    messages.value = messages.value.map((message) => {
      if (message.id !== messageId) {
        return message
      }

      return {
        ...message,
        deletedAt,
        isDeleted: true,
        permissions: {
          ...message.permissions,
          canDeleteOwn: false,
          canEdit: false,
          canModerate: true,
          canRestore: true,
        },
      }
    })

    if (preparedQuote.value?.messageId === messageId) {
      clearQuote()
    }
  }

  function restoreMessageLocally(messageId: string) {
    messages.value = messages.value.map((message) => {
      if (message.id !== messageId) {
        return message
      }

      return {
        ...message,
        deletedAt: null,
        isDeleted: false,
        permissions: {
          ...message.permissions,
          canDeleteOwn:
            viewerState.isAuthenticated.value && message.author.id === topicPage.viewer.userId,
          canEdit: true,
          canModerate: canModerate.value,
          canRestore: false,
        },
      }
    })
  }

  async function applyRealtimeEvent(event: TopicMessageRealtimeEvent) {
    if (event.topicId !== topic.value.id) {
      return
    }

    if (event.type === 'message.created') {
      updateMessageTotals(topic.value.messageCount + 1)

      if (!isLastPage.value) {
        showRealtimeNotice(
          'Un nouveau message est disponible dans ce sujet.',
          buildPageHref(topicPath, pagination.value.totalPages),
          'Voir la derniere page',
        )
        return
      }

      mergeRealtimeMessage(event.message)
      return
    }

    if (event.type === 'message.deleted') {
      updateMessageTotals(topic.value.messageCount - 1)

      if (pagination.value.page > pagination.value.totalPages) {
        showRealtimeNotice(
          'Le fil a change. La derniere page du sujet a ete deplacee.',
          buildPageHref(topicPath, pagination.value.totalPages),
          'Voir la nouvelle derniere page',
        )
        return
      }

      if (!isLastPage.value) {
        await refreshCurrentPage()
        showRealtimeNotice('Le fil a change sur cette page.')
        return
      }

      removeMessageLocally(event.message.id)
      return
    }

    const messageIsLoaded = messages.value.some((message) => message.id === event.message.id)

    if (event.type === 'message.moderated' || event.type === 'message.restored') {
      if (viewerState.isAdmin.value) {
        await refreshCurrentPage()
        return
      }
    }

    if (!messageIsLoaded) {
      showRealtimeNotice('Des mises a jour sont disponibles dans ce sujet.')
      return
    }

    mergeRealtimeMessage(event.message)
  }

  async function submitReply() {
    replyPending.value = true
    replyError.value = ''

    try {
      const result = await $fetch<TopicMutationResponse>(`${topicApiPath}/messages`, {
        method: 'POST',
        body: {
          content: replyForm.content,
          quotedMessageId: preparedQuote.value?.messageId ?? null,
        },
      })

      replyForm.content = ''
      clearQuote()
      await navigateTo(result.redirectTo)
    } catch (error) {
      replyError.value = readApiErrorMessage(error, 'Envoi de la reponse impossible')
    } finally {
      replyPending.value = false
    }
  }

  async function submitEdit(messageId: string) {
    editPending.value = true
    editError.value = ''

    try {
      const result = await $fetch<MessageMutationResponse>(`/api/messages/${messageId}`, {
        method: 'PATCH',
        body: editForm,
      })

      cancelEditing()
      await navigateTo(result.redirectTo)
    } catch (error) {
      editError.value = readApiErrorMessage(error, 'Modification impossible')
    } finally {
      editPending.value = false
    }
  }

  async function deleteTopic() {
    if (!window.confirm(`Supprimer le sujet "${topic.value.title}" et tous ses messages ?`)) {
      return
    }

    try {
      await $fetch(`/api/admin/topics/${topic.value.id}`, {
        method: 'DELETE',
      })

      await navigateTo(forumPath)
    } catch (error) {
      replyError.value = readApiErrorMessage(error, 'Suppression du sujet impossible')
    }
  }

  async function deleteOwnMessage(messageId: string) {
    if (!window.confirm('Supprimer ce message ?')) {
      return
    }

    try {
      const result = await $fetch<MessageDeletionResponse>(`/api/messages/${messageId}`, {
        method: 'DELETE',
      })

      removeMessageLocally(messageId)
      await navigateTo(result.redirectTo, { replace: true })
    } catch (error) {
      editError.value = readApiErrorMessage(error, 'Suppression du message impossible')
    }
  }

  async function moderateMessage(messageId: string) {
    if (!window.confirm('Supprimer ce message au titre de la moderation ?')) {
      return
    }

    try {
      await $fetch(`/api/messages/${messageId}`, {
        method: 'PATCH',
        body: {
          action: 'moderate-delete',
        },
      })

      markMessageModeratedLocally(messageId)
    } catch (error) {
      editError.value = readApiErrorMessage(error, 'Suppression de moderation impossible')
    }
  }

  async function restoreModeratedMessage(messageId: string) {
    if (!window.confirm('Restaurer ce message modere ?')) {
      return
    }

    try {
      await $fetch(`/api/messages/${messageId}`, {
        method: 'PATCH',
        body: {
          action: 'moderate-restore',
        } satisfies ModerateMessageInput,
      })

      restoreMessageLocally(messageId)
    } catch (error) {
      editError.value = readApiErrorMessage(error, 'Restauration du message impossible')
    }
  }

  if (import.meta.client) {
    const realtimeClient = useForumRealtimeClient()
    let unsubscribe: (() => void) | undefined

    onMounted(() => {
      if (!realtimeClient) {
        return
      }

      unsubscribe = realtimeClient.subscribe(realtimeChannel.value, async (event) => {
        if (!isTopicMessageRealtimeEvent(event)) {
          return
        }

        await applyRealtimeEvent(event)
      })
    })

    onBeforeUnmount(() => {
      unsubscribe?.()
    })
  }

  return {
    applyRealtimeEvent,
    canDeleteTopic,
    canModerate,
    canReply,
    cancelEditing,
    clearQuote,
    deleteOwnMessage,
    deleteTopic,
    editError,
    editForm,
    editPending,
    editingMessageId,
    forumPath,
    isReplyOpen,
    messages,
    moderateMessage,
    pagination,
    prepareQuote,
    preparedQuote,
    realtimeChannel,
    realtimeNotice,
    refreshCurrentPage,
    replyError,
    replyForm,
    replyPending,
    restoreModeratedMessage,
    selectedQuoteMessageId,
    setEditContent,
    startEditing,
    submitEdit,
    submitReply,
    topic,
    topicPath,
  }
}
