'use client'

import type { Header } from '@/payload-types'

import { CMSLink } from '@/components/Link'
import { Button } from '@/components/ui/button'
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
      if (window.innerWidth > 768) {
        setIsOpen(false)
      }
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [isOpen])

  useEffect(() => {
    setIsOpen(false)
  }, [pathname, searchParams])

  const displayName = user ? getUserDisplayName(user) : null

  return (
    <Sheet onOpenChange={setIsOpen} open={isOpen}>
      <SheetTrigger className="relative flex h-12 w-12 items-center justify-center text-[var(--elixir-on-surface,#1c1b1b)] transition hover:opacity-70">
        <MenuIcon className="h-5 w-5" strokeWidth={1.5} aria-hidden />
        <span className="sr-only">Open menu</span>
      </SheetTrigger>

      <SheetContent side="left" className="bg-[var(--elixir-surface,#fcf9f8)] px-4">
        <SheetHeader className="px-0 pt-4 pb-0">
          <SheetTitle className="font-[family-name:var(--font-newsreader)] text-xl tracking-[0.08em]">
            ELIXIR
          </SheetTitle>

          <SheetDescription />
        </SheetHeader>

        <div className="py-4">
          <ul className="flex w-full flex-col">
            <li className="py-2">
              <Link href="/search" className="text-[var(--elixir-on-surface,#1c1b1b)]">
                Search
              </Link>
            </li>
            <li className="py-2">
              <Link href="/shop" className="text-[var(--elixir-on-surface,#1c1b1b)]">
                Shop All
              </Link>
            </li>
            {menu?.map((item) => (
              <li className="py-2" key={item.id}>
                <CMSLink {...item.link} appearance="link" />
              </li>
            ))}
          </ul>
        </div>

        {user ? (
          <div className="mt-4 border-t border-[var(--elixir-surface-container,#f0eded)] pt-4">
            <h2 className="font-[family-name:var(--font-newsreader)] text-lg">
              {displayName ? `Hi, ${displayName}` : 'My account'}
            </h2>
            <ul className="mt-3 flex flex-col gap-2 text-sm">
              <li>
                <Link href="/account">My Account</Link>
              </li>
              <li>
                <Link href="/account/orders">My Orders</Link>
              </li>
              <li>
                <Link href="/account/wishlist">Wishlist</Link>
              </li>
              <li className="mt-4">
                <Button asChild variant="outline">
                  <Link href="/logout">Logout</Link>
                </Button>
              </li>
            </ul>
          </div>
        ) : (
          <div className="mt-4 border-t border-[var(--elixir-surface-container,#f0eded)] pt-4">
            <h2 className="font-[family-name:var(--font-newsreader)] text-lg">Account</h2>
            <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center">
              <Button asChild className="w-full sm:flex-1" variant="outline">
                <Link href="/login">Log in</Link>
              </Button>
              <span className="text-center text-sm text-muted-foreground sm:text-base">or</span>
              <Button asChild className="w-full sm:flex-1">
                <Link href="/create-account">Create an account</Link>
              </Button>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}
