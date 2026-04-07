import type { ForumViewer } from '#shared/types/forum'

type ViewerSource = ForumViewer | (() => ForumViewer)

function readViewer(source: ViewerSource): ForumViewer {
  return typeof source === 'function' ? source() : source
}

function buildSessionViewer(user: {
  id: string
  username: string
  role: 'USER' | 'ADMIN'
}): ForumViewer {
  return {
    isAuthenticated: true,
    userId: user.id,
    username: user.username,
    role: user.role,
    isAdmin: user.role === 'ADMIN',
  }
}

export async function useForumViewer(source: ViewerSource) {
  const { clear, fetch: fetchUserSession, loggedIn, user } = useUserSession()

  await fetchUserSession()

  const effectiveViewer = computed<ForumViewer>(() => {
    if (loggedIn.value && user.value) {
      return buildSessionViewer({
        id: user.value.id,
        username: user.value.username,
        role: user.value.role,
      })
    }

    return readViewer(source)
  })

  const isAuthenticated = computed(() => effectiveViewer.value.isAuthenticated)
  const isAdmin = computed(() => effectiveViewer.value.isAdmin)
  const username = computed(() => effectiveViewer.value.username)

  async function goToAuth() {
    await navigateTo('/auth')
  }

  async function goToRegister() {
    await navigateTo('/auth?mode=register')
  }

  async function goToAccount() {
    await navigateTo('/account')
  }

  async function goToAdmin() {
    await navigateTo('/admin')
  }

  async function logout() {
    await clear()
    await navigateTo('/')
  }

  return {
    effectiveViewer,
    isAuthenticated,
    isAdmin,
    username,
    goToAccount,
    goToAdmin,
    goToAuth,
    goToRegister,
    logout,
  }
}
