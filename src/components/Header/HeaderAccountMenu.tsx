'use client'

import { getUserDisplayName, getUserNavLabel } from '@/lib/account/userDisplayName'
import { useAuth } from '@/providers/Auth'
import { cn } from '@/utilities/cn'
import { UserRound } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import React, { useEffect, useId, useRef, useState } from 'react'

type Props = {
  className?: string
  /** Show only an icon trigger (useful on denser layouts). */
  iconOnly?: boolean
}

const loggedInLinks = [
  { href: '/account', label: 'My Account' },
  { href: '/account/orders', label: 'My Orders' },
  { href: '/account/wishlist', label: 'Wishlist' },
  { href: '/account/settings', label: 'Settings' },
] as const

export function HeaderAccountMenu({ className, iconOnly = false }: Props) {
  const { user } = useAuth()
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const menuId = useId()

  useEffect(() => {
    setOpen(false)
  }, [pathname])

  useEffect(() => {
    if (!open) return

    const onPointerDown = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node | null
      if (rootRef.current && target && !rootRef.current.contains(target)) {
        setOpen(false)
      }
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }

    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('touchstart', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('touchstart', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  const isLoggedIn = Boolean(user)
  const navLabel = user ? getUserNavLabel(user) : 'Account'
  const greetingName = user ? getUserDisplayName(user) || getUserNavLabel(user) : null

  return (
    <div ref={rootRef} className={cn('relative', className)}>
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        aria-label={isLoggedIn ? `Account menu for ${navLabel}` : 'Account menu'}
        onClick={() => setOpen((value) => !value)}
        className={cn(
          'inline-flex h-11 max-w-[10rem] items-center gap-2 text-[13px] tracking-[0.06em] text-[var(--elixir-on-surface,#1c1b1b)] outline-none transition hover:opacity-60 focus-visible:ring-1 focus-visible:ring-[var(--elixir-on-surface,#1c1b1b)]/25',
          iconOnly ? 'w-11 justify-center px-0' : 'px-1.5',
        )}
      >
        <UserRound className="h-[18px] w-[18px] shrink-0" strokeWidth={1.4} aria-hidden />
        {!iconOnly ? (
          <span className="truncate font-medium uppercase">{navLabel}</span>
        ) : null}
      </button>

      {open ? (
        <div
          id={menuId}
          role="menu"
          className="absolute right-0 top-[calc(100%+0.35rem)] z-50 w-56 border border-[var(--elixir-outline-variant,#c1c8c7)]/55 bg-[var(--elixir-surface,#fcf9f8)] py-3"
        >
          {isLoggedIn && user ? (
            <>
              <p className="px-4 pb-3 font-[family-name:var(--font-newsreader)] text-[15px] text-[var(--elixir-on-surface,#1c1b1b)]">
                Hi, {greetingName}
              </p>
              <div className="mx-4 border-t border-[var(--elixir-outline-variant,#c1c8c7)]/40" />
              <ul className="flex flex-col py-2">
                {loggedInLinks.map((item) => (
                  <li key={item.href}>
                    <Link
                      role="menuitem"
                      href={item.href}
                      className="block px-4 py-2.5 text-sm text-[var(--elixir-on-surface,#1c1b1b)] outline-none transition hover:bg-[var(--elixir-surface-container-low,#f6f3f2)] focus-visible:bg-[var(--elixir-surface-container-low,#f6f3f2)]"
                      onClick={() => setOpen(false)}
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
              <div className="mx-4 border-t border-[var(--elixir-outline-variant,#c1c8c7)]/40" />
              <Link
                role="menuitem"
                href="/logout"
                className="mt-1 block px-4 py-2.5 text-sm text-[var(--elixir-on-surface-variant,#414848)] outline-none transition hover:bg-[var(--elixir-surface-container-low,#f6f3f2)] hover:text-[var(--elixir-on-surface,#1c1b1b)] focus-visible:bg-[var(--elixir-surface-container-low,#f6f3f2)]"
                onClick={() => setOpen(false)}
              >
                Logout
              </Link>
            </>
          ) : (
            <ul className="flex flex-col">
              <li>
                <Link
                  role="menuitem"
                  href="/login"
                  className="block px-4 py-2.5 text-sm text-[var(--elixir-on-surface,#1c1b1b)] outline-none transition hover:bg-[var(--elixir-surface-container-low,#f6f3f2)] focus-visible:bg-[var(--elixir-surface-container-low,#f6f3f2)]"
                  onClick={() => setOpen(false)}
                >
                  Log in
                </Link>
              </li>
              <li>
                <Link
                  role="menuitem"
                  href="/create-account"
                  className="block px-4 py-2.5 text-sm text-[var(--elixir-on-surface,#1c1b1b)] outline-none transition hover:bg-[var(--elixir-surface-container-low,#f6f3f2)] focus-visible:bg-[var(--elixir-surface-container-low,#f6f3f2)]"
                  onClick={() => setOpen(false)}
                >
                  Create account
                </Link>
              </li>
            </ul>
          )}
        </div>
      ) : null}
    </div>
  )
}
