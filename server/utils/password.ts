import { Hash } from '@adonisjs/hash'
import { Argon } from '@adonisjs/hash/drivers/argon'

let appPasswordHasher: Hash | null = null

function getAppPasswordHasher() {
  if (!appPasswordHasher) {
    appPasswordHasher = new Hash(
      new Argon({
        variant: 'id',
      }),
    )
  }

  return appPasswordHasher
}

export function hashAppPassword(password: string) {
  return getAppPasswordHasher().make(password)
}

export function verifyAppPassword(hashedPassword: string, plainPassword: string) {
  return getAppPasswordHasher().verify(hashedPassword, plainPassword)
}
