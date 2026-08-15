import type { User } from '@/payload-types'

type NameParts = {
  firstName?: string | null
  lastName?: string | null
  name?: string | null
}

/**
 * Storefront display name from the authenticated Payload user.
 * Prefer firstName + lastName when present; otherwise use `name`.
 * Never falls back to email.
 */
export function getUserDisplayName(user: Pick<User, 'name'> & NameParts): string | null {
  const first = typeof user.firstName === 'string' ? user.firstName.trim() : ''
  const last = typeof user.lastName === 'string' ? user.lastName.trim() : ''
  if (first || last) {
    return [first, last].filter(Boolean).join(' ')
  }

  const name = user.name?.trim()
  return name || null
}

/** Short label for the navbar trigger (first token of the display name). */
export function getUserNavLabel(user: Pick<User, 'name'> & NameParts): string {
  const display = getUserDisplayName(user)
  if (!display) return 'Account'
  return display.split(/\s+/).filter(Boolean)[0] || 'Account'
}
