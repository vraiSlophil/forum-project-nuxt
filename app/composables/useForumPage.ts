import type {
  CreateTopicInput,
  ForumPageResponse,
  TopicMutationResponse,
} from '#shared/types/forum'
import { readApiErrorMessage } from '~/utils/api-error'

type ForumViewerState = {
  isAdmin: Readonly<Ref<boolean>>
  isAuthenticated: Readonly<Ref<boolean>>
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

  const forumPath = `/forums/${forumPage.forum.slug}`
  const canCreateTopic = computed(
    () => forumPage.forum.permissions.canCreateTopic || viewerState.isAuthenticated.value,
  )
  const canManageForum = computed(() => forumPage.viewer.isAdmin || viewerState.isAdmin.value)

  function toggleComposer() {
    isComposerOpen.value = !isComposerOpen.value
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
      submitError.value = readApiErrorMessage(error, 'Creation du sujet impossible')
    } finally {
      isSubmitting.value = false
    }
  }

  return {
    canCreateTopic,
    canManageForum,
    forumPath,
    isComposerOpen,
    isSubmitting,
    submitError,
    submitTopic,
    toggleComposer,
    topicForm,
  }
}
