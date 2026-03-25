declare module '#auth-utils' {
  interface User {
    id: string
    username: string
    role: 'USER' | 'ADMIN'
  }
}

export {}
