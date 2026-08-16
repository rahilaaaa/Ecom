'use client'

import { CMSLink } from '@/components/Link'
import { Cart } from '@/components/Cart'
import { Search } from '@/components/Search'
import Link from 'next/link'
import React, { Suspense } from 'react'

import { HeaderAccountMenu } from './HeaderAccountMenu'
import { MobileMenu } from './MobileMenu'
import type { Header } from 'src/payload-types'
import { AnnouncementBar } from '@/components/layout/AnnouncementBar'

import { usePathname } from 'next/navigation'
import { cn } from '@/utilities/cn'
import { Heart, ShoppingBag } from 'lucide-react'

type Props = {
  header: Header
}

const brandName = process.env.NEXT_PUBLIC_SITE_NAME || process.env.SITE_NAME || 'ELIXIR'

function isNavActive(pathname: string, url?: string | null) {
  if (!url || url === '/') return false
  const pathOnly = url.split('?')[0] || url
  return pathname === pathOnly || pathname.startsWith(`${pathOnly}/`)
}

export function HeaderClient({ header }: Props) {
  const menu = header.navItems || []
  const pathname = usePathname()

  // Checkout uses its own minimal chrome inside CheckoutPage.
  if (pathname?.startsWith('/checkout')) {
    return null
  }

  return (
    <>
      <AnnouncementBar message={header.announcement} />
      <header className="sticky top-0 z-30 border-b border-[var(--elixir-outline-variant,#c1c8c7)]/40 bg-[var(--elixir-surface,#fcf9f8)]">
        {/* Mobile: hamburger | centered logo | wishlist + cart */}
        <nav
          aria-label="Primary"
          className="mx-auto grid h-16 max-w-[1440px] grid-cols-[1fr_auto_1fr] items-center px-5 md:hidden"
        >
          <div className="justify-self-start">
            <Suspense fallback={null}>
              <MobileMenu menu={menu} />
            </Suspense>
          </div>

          <Link
            href="/"
            className="justify-self-center font-[family-name:var(--font-newsreader)] text-xl font-medium tracking-[0.12em] text-[var(--elixir-on-surface,#1c1b1b)] outline-none focus-visible:underline"
            aria-label={`${brandName} home`}
          >
            {brandName}
          </Link>

          <div className="flex items-center justify-self-end gap-1">
            <Link
              href="/account/wishlist"
              aria-label="Wishlist"
              className="flex h-11 w-11 items-center justify-center text-[var(--elixir-on-surface,#1c1b1b)] outline-none transition hover:opacity-60 focus-visible:ring-1 focus-visible:ring-[var(--elixir-on-surface,#1c1b1b)]/25"
            >
              <Heart className="h-[18px] w-[18px]" strokeWidth={1.4} aria-hidden />
            </Link>
            <Suspense
              fallback={
                <span className="relative flex h-11 w-11 items-center justify-center">
                  <ShoppingBag className="h-[18px] w-[18px]" strokeWidth={1.4} />
                </span>
              }
            >
              <Cart />
            </Suspense>
          </div>
        </nav>

        {/* Desktop: logo (+ CMS nav) | truly centered search | utilities */}
        <nav
          aria-label="Primary"
          className="mx-auto hidden h-[4.5rem] max-w-[1440px] grid-cols-[1fr_auto_1fr] items-center px-12 lg:px-16 md:grid"
        >
          <div className="flex min-w-0 items-center gap-8 justify-self-start lg:gap-10">
            <Link
              href="/"
              className="shrink-0 font-[family-name:var(--font-newsreader)] text-[1.35rem] font-medium tracking-[0.12em] text-[var(--elixir-on-surface,#1c1b1b)] outline-none transition hover:opacity-70 focus-visible:underline"
              aria-label={`${brandName} home`}
            >
              {brandName}
            </Link>

            {menu.length > 0 ? (
              <ul className="hidden min-w-0 items-center gap-7 overflow-hidden xl:flex">
                {menu.map((item) => (
                  <li key={item.id} className="shrink-0">
                    <CMSLink
                      {...item.link}
                      appearance="inline"
                      className={cn(
                        'relative text-[12px] font-medium tracking-[0.08em] text-[var(--elixir-on-surface,#1c1b1b)] outline-none transition hover:opacity-55 focus-visible:underline',
                        isNavActive(pathname, item.link?.url) && 'underline underline-offset-[10px]',
                      )}
                    />
                  </li>
                ))}
              </ul>
            ) : null}
          </div>

          <div className="w-[min(100%,420px)] min-w-[360px] justify-self-center">
            <Suspense fallback={<div className="h-10 w-full" aria-hidden />}>
              <Search
                variant="navbar"
                inputId="desktop-navbar-search"
                placeholder="Search products..."
                className="w-full"
              />
            </Suspense>
          </div>

          <div className="flex items-center justify-self-end gap-7 lg:gap-8">
            <HeaderAccountMenu />
            <Link
              href="/account/wishlist"
              aria-label="Wishlist"
              className="flex h-11 w-11 items-center justify-center text-[var(--elixir-on-surface,#1c1b1b)] outline-none transition hover:opacity-60 focus-visible:ring-1 focus-visible:ring-[var(--elixir-on-surface,#1c1b1b)]/25"
            >
              <Heart className="h-[18px] w-[18px]" strokeWidth={1.4} aria-hidden />
            </Link>
            <Suspense
              fallback={
                <span className="relative flex h-11 w-11 items-center justify-center">
                  <ShoppingBag className="h-[18px] w-[18px]" strokeWidth={1.4} />
                </span>
              }
            >
              <Cart />
            </Suspense>
          </div>
        </nav>
      </header>
    </>
  )
}
