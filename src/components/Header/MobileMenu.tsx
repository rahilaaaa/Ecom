'use client'

import type { Header } from '@/payload-types'

import { CMSLink } from '@/components/Link'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { getUserDisplayName } from '@/lib/account/userDisplayName'
import { useAuth } from '@/providers/Auth'
import { MenuIcon } from 'lucide-react'
import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import React, { useEffect, useState } from 'react'

interface Props {
  menu: Header['navItems']
}

export function MobileMenu({ menu }: Props) {
  const { user } = useAuth()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) setIsOpen(false)
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    setIsOpen(false)
  }, [pathname, searchParams])

  const displayName = user ? getUserDisplayName(user) : null

  return (
    <Sheet onOpenChange={setIsOpen} open={isOpen}>
      <SheetTrigger
        className="relative flex h-11 w-11 items-center justify-center text-[var(--elixir-on-surface,#1c1b1b)] outline-none transition hover:opacity-60 focus-visible:ring-1 focus-visible:ring-[var(--elixir-on-surface,#1c1b1b)]/25"
        aria-label="Open menu"
      >
        <MenuIcon className="h-5 w-5" strokeWidth={1.4} aria-hidden />
      </SheetTrigger>

      <SheetContent
        side="left"
        className="w-[min(100vw,20rem)] border-r border-[var(--elixir-outline-variant,#c1c8c7)]/40 bg-[var(--elixir-surface,#fcf9f8)] px-6"
      >
        <SheetHeader className="px-0 pt-2 pb-0 text-left">
          <SheetTitle className="font-[family-name:var(--font-newsreader)] text-lg font-medium tracking-[0.12em]">
            ELIXIR
          </SheetTitle>
          <SheetDescription className="sr-only">Store navigation and account</SheetDescription>
        </SheetHeader>

        <nav aria-label="Mobile" className="mt-8">
          <ul className="flex flex-col gap-1">
            <li>
              <Link
                href="/search"
                className="block py-3 text-[13px] font-medium tracking-[0.08em] text-[var(--elixir-on-surface,#1c1b1b)]"
              >
                Search
              </Link>
            </li>
            {menu?.map((item) => (
              <li key={item.id}>
                <CMSLink
                  {...item.link}
                  appearance="inline"
                  className="block py-3 text-[13px] font-medium tracking-[0.08em] text-[var(--elixir-on-surface,#1c1b1b)]"
                />
              </li>
            ))}
            <li>
              <Link
                href="/shop"
                className="block py-3 text-[13px] font-medium tracking-[0.08em] text-[var(--elixir-on-surface,#1c1b1b)]"
              >
                Shop All
              </Link>
            </li>
          </ul>
        </nav>

        <div className="mt-8 border-t border-[var(--elixir-outline-variant,#c1c8c7)]/40 pt-6">
          {user ? (
            <>
              <p className="font-[family-name:var(--font-newsreader)] text-base text-[var(--elixir-on-surface,#1c1b1b)]">
                {displayName ? `Hi, ${displayName}` : 'My account'}
              </p>
              <ul className="mt-4 flex flex-col gap-1 text-sm text-[var(--elixir-on-surface,#1c1b1b)]">
                <li>
                  <Link href="/account" className="block py-2.5">
                    My Account
                  </Link>
                </li>
                <li>
                  <Link href="/account/orders" className="block py-2.5">
                    My Orders
                  </Link>
                </li>
                <li>
                  <Link href="/account/wishlist" className="block py-2.5">
                    Wishlist
                  </Link>
                </li>
                <li>
                  <Link href="/account/settings" className="block py-2.5">
                    Settings
                  </Link>
                </li>
                <li>
                  <Link
                    href="/logout"
                    className="mt-2 block py-2.5 text-[var(--elixir-on-surface-variant,#414848)]"
                  >
                    Logout
                  </Link>
                </li>
              </ul>
            </>
          ) : (
            <>
              <p className="font-[family-name:var(--font-newsreader)] text-base">Account</p>
              <ul className="mt-4 flex flex-col gap-1 text-sm">
                <li>
                  <Link href="/login" className="block py-2.5">
                    Log in
                  </Link>
                </li>
                <li>
                  <Link href="/create-account" className="block py-2.5">
                    Create account
                  </Link>
                </li>
              </ul>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
