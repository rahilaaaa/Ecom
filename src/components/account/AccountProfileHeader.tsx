import Link from 'next/link'
import React from 'react'

import { Media } from '@/components/Media'
import type { Media as MediaType, User } from '@/payload-types'
import { cn } from '@/utilities/cn'

type Props = {
  user: User
  className?: string
}

function initialsFromUser(user: User): string {
  const name = user.name?.trim()
  if (name) {
    const parts = name.split(/\s+/).filter(Boolean)
    if (parts.length >= 2) {
      return `${parts[0]![0]}${parts[1]![0]}`.toUpperCase()
    }
    return name.slice(0, 2).toUpperCase()
  }
  return user.email.slice(0, 2).toUpperCase()
}

export function AccountProfileHeader({ user, className }: Props) {
  const avatar = user.avatar && typeof user.avatar === 'object' ? (user.avatar as MediaType) : null
  const displayName = user.name?.trim() || 'Your account'

  return (
    <section className={cn('flex flex-col items-center text-center', className)}>
      <div className="relative mb-5 h-28 w-28 overflow-hidden rounded-full bg-[var(--elixir-surface-container,#f0eded)] ring-1 ring-[var(--elixir-outline-variant,#c4c7c7)]/40">
        {avatar ? (
          <Media
            resource={avatar}
            fill
            imgClassName="object-cover"
            className="relative h-full w-full"
            size="112px"
          />
        ) : (
          <div
            className="flex h-full w-full items-center justify-center font-[family-name:var(--font-newsreader)] text-3xl text-[var(--elixir-on-surface-variant,#414848)]"
            aria-hidden
          >
            {initialsFromUser(user)}
          </div>
        )}
      </div>

      <h1 className="font-[family-name:var(--font-newsreader)] text-3xl font-medium tracking-tight text-[var(--elixir-on-surface,#1c1b1b)] md:text-4xl">
        {displayName}
      </h1>
      <p className="mt-2 text-sm text-[var(--elixir-on-surface-variant,#414848)]">{user.email}</p>

      <Link
        href="/account/settings"
        className="mt-6 inline-flex min-h-12 items-center justify-center border border-[var(--elixir-on-surface,#1c1b1b)] px-6 text-xs font-medium uppercase tracking-[0.12em] text-[var(--elixir-on-surface,#1c1b1b)] transition hover:bg-[var(--elixir-on-surface,#1c1b1b)] hover:text-[var(--elixir-surface,#fcf9f8)]"
      >
        Edit Profile
      </Link>
    </section>
  )
}
