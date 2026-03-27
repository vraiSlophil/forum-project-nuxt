import { Hash } from '@adonisjs/hash'
import { Scrypt } from '@adonisjs/hash/drivers/scrypt'

let forumPasswordHasher: Hash | null = null

function getForumPasswordHasher() {
  if (!forumPasswordHasher) {
    forumPasswordHasher = new Hash(new Scrypt())
  }

  return forumPasswordHasher
}

export function hashForumPassword(password: string) {
  return getForumPasswordHasher().make(password)
}
