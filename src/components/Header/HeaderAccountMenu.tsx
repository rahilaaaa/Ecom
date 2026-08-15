'use client'

import { getUserDisplayName, getUserNavLabel } from '@/lib/account/userDisplayName'
import { useAuth } from '@/providers/Auth'
import { cn } from '@/utilities/cn'
import { ChevronDown, UserRound } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import React, { useEffect, useId, useRef, useState } from 'react'

type Props = {
  className?: string
}

export function HeaderAccountMenu({ className }: Props) {
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
        onClick={() => setOpen((value) => !value)}
        className="inline-flex h-12 max-w-[9rem] items-center gap-1.5 px-1 text-sm uppercase tracking-[0.08em] text-[var(--elixir-on-surface,#1c1b1b)] transition hover:opacity-70"
      >
        <UserRound className="h-4 w-4 shrink-0 md:hidden" strokeWidth={1.5} aria-hidden />
        <span className="truncate font-medium">{navLabel}</span>
        <ChevronDown
          className={cn('hidden h-3.5 w-3.5 shrink-0 opacity-60 transition md:block', open && 'rotate-180')}
          strokeWidth={1.5}
          aria-hidden
        />
      </button>

      {open ? (
        <div
          id={menuId}
          role="menu"
          className="absolute right-0 top-full z-50 mt-1 w-56 border border-[var(--elixir-outline-variant,#c1c8c7)] bg-[var(--elixir-surface,#fcf9f8)] py-3 shadow-[0_12px_40px_rgba(28,27,27,0.08)]"
        >
          {isLoggedIn && user ? (
            <>
              <p className="px-4 pb-3 font-[family-name:var(--font-newsreader)] text-base text-[var(--elixir-on-surface,#1c1b1b)]">
                Hi, {greetingName}
              </p>
              <div className="mx-4 border-t border-[var(--elixir-surface-container,#f0eded)]" />
              <ul className="flex flex-col py-2">
                <li>
                  <Link
                    role="menuitem"
                    href="/account"
                    className="block px-4 py-2.5 text-sm text-[var(--elixir-on-surface,#1c1b1b)] transition hover:bg-[var(--elixir-surface-container-low,#f6f3f2)]"
                    onClick={() => setOpen(false)}
                  >
                    My Account
                  </Link>
                </li>
                <li>
                  <Link
                    role="menuitem"
                    href="/account/orders"
                    className="block px-4 py-2.5 text-sm text-[var(--elixir-on-surface,#1c1b1b)] transition hover:bg-[var(--elixir-surface-container-low,#f6f3f2)]"
                    onClick={() => setOpen(false)}
                  >
                    My Orders
                  </Link>
                </li>
                <li>
                  <Link
                    role="menuitem"
                    href="/account/wishlist"
                    className="block px-4 py-2.5 text-sm text-[var(--elixir-on-surface,#1c1b1b)] transition hover:bg-[var(--elixir-surface-container-low,#f6f3f2)]"
                    onClick={() => setOpen(false)}
                  >
                    Wishlist
                  </Link>
                </li>
              </ul>
              <div className="mx-4 border-t border-[var(--elixir-surface-container,#f0eded)]" />
              <Link
                role="menuitem"
                href="/logout"
                className="mt-1 block px-4 py-2.5 text-sm text-[var(--elixir-on-surface-variant,#414848)] transition hover:bg-[var(--elixir-surface-container-low,#f6f3f2)] hover:text-[var(--elixir-on-surface,#1c1b1b)]"
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
                  className="block px-4 py-2.5 text-sm text-[var(--elixir-on-surface,#1c1b1b)] transition hover:bg-[var(--elixir-surface-container-low,#f6f3f2)]"
                  onClick={() => setOpen(false)}
                >
                  Log in
                </Link>
              </li>
              <li>
                <Link
                  role="menuitem"
                  href="/create-account"
                  className="block px-4 py-2.5 text-sm text-[var(--elixir-on-surface,#1c1b1b)] transition hover:bg-[var(--elixir-surface-container-low,#f6f3f2)]"
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
