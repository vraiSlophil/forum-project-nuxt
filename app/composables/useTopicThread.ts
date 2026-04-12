import type {
  CreateMessageInput,
  MessageDeletionResponse,
  MessageMutationResponse,
  ModerateMessageInput,
  TopicMessage,
  TopicMessageRealtimeEvent,
  TopicPageResponse,
  TopicMutationResponse,
  UpdateMessageInput,
} from '#shared/types/forum'
import { readApiErrorMessage } from '~/utils/api-error'

type TopicViewerState = {
  isAdmin: Readonly<Ref<boolean>>
  isAuthenticated: Readonly<Ref<boolean>>
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

function cloneMessages(messages: TopicMessage[]) {
  return messages.map((message) => cloneMessage(message))
}

function sortMessages(messages: TopicMessage[]) {
  return [...messages].sort((left, right) => {
    if (left.createdAt === right.createdAt) {
      return left.id.localeCompare(right.id)
    }

    return left.createdAt.localeCompare(right.createdAt)
  })
}

export function useTopicThread(topicPage: TopicPageResponse, viewerState: TopicViewerState) {
  const topicPath = `/forums/${topicPage.forum.slug}/topics/${topicPage.topic.slug}`
  const forumPath = `/forums/${topicPage.forum.slug}`
  const topicApiPath = `/api/forums/${topicPage.forum.slug}/topics/${topicPage.topic.slug}`

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

  const isReplyOpen = ref(topicPage.topic.permissions.canReply && topicPage.messages.length < 2)
  const replyPending = ref(false)
  const replyError = ref('')
  const editingMessageId = ref<string | null>(null)
  const editPending = ref(false)
  const editError = ref('')

  const canReply = computed(() => viewerState.isAuthenticated.value && !topicPage.topic.isLocked)
  const canModerate = computed(
    () => topicPage.topic.permissions.canModerate || viewerState.isAdmin.value,
  )
  const canDeleteTopic = computed(
    () => topicPage.topic.permissions.canDelete || viewerState.isAdmin.value,
  )
  const realtimeChannel = computed(() => `topics:${topicPage.topic.id}:messages`)
  const selectedQuoteMessageId = computed(() => preparedQuote.value?.messageId ?? null)

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
    const nextMessage = cloneMessage(message)
    const messageIndex = messages.value.findIndex((candidate) => candidate.id === nextMessage.id)

    if (messageIndex === -1) {
      messages.value = sortMessages([...messages.value, nextMessage])
      return
    }

    messages.value.splice(messageIndex, 1, nextMessage)
  }

  function applyRealtimeEvent(event: TopicMessageRealtimeEvent) {
    if (event.topicId !== topicPage.topic.id) {
      return
    }

    mergeRealtimeMessage(event.message)
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
    if (!window.confirm(`Supprimer le sujet "${topicPage.topic.title}" et tous ses messages ?`)) {
      return
    }

    try {
      await $fetch(`/api/admin/topics/${topicPage.topic.id}`, {
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
    prepareQuote,
    preparedQuote,
    realtimeChannel,
    replyError,
    replyForm,
    replyPending,
    selectedQuoteMessageId,
    setEditContent,
    startEditing,
    submitEdit,
    submitReply,
    topicPath,
    restoreModeratedMessage,
  }
}
