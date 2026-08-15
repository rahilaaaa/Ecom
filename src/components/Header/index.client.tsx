'use client'
import { CMSLink } from '@/components/Link'
import { Cart } from '@/components/Cart'
import Link from 'next/link'
import React, { Suspense } from 'react'

import { MobileMenu } from './MobileMenu'
import type { Header } from 'src/payload-types'
import { AnnouncementBar } from '@/components/layout/AnnouncementBar'

import { usePathname } from 'next/navigation'
import { cn } from '@/utilities/cn'
import { ShoppingBag } from 'lucide-react'

type Props = {
  header: Header
}

const brandName = process.env.NEXT_PUBLIC_SITE_NAME || process.env.SITE_NAME || 'ELIXIR'

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
      <header className="sticky top-0 z-30 border-b border-[var(--elixir-surface-container-highest,#e5e2e1)] bg-[var(--elixir-surface-container-low,#f6f3f2)]/95 backdrop-blur-sm">
        <nav className="relative mx-auto flex h-16 max-w-[1280px] items-center justify-between px-5 md:h-[4.5rem] md:px-6 lg:px-8">
          <div className="flex min-w-[3rem] items-center justify-start md:min-w-[12rem]">
            <div className="md:hidden">
              <Suspense fallback={null}>
                <MobileMenu menu={menu} />
              </Suspense>
            </div>
            {menu.length ? (
              <ul className="hidden items-center gap-6 text-sm md:flex">
                {menu.map((item) => (
                  <li key={item.id}>
                    <CMSLink
                      {...item.link}
                      size={'clear'}
                      className={cn(
                        'relative text-[var(--elixir-on-surface,#1c1b1b)] transition hover:opacity-70',
                        {
                          'underline underline-offset-8':
                            item.link.url && item.link.url !== '/'
                              ? pathname.includes(item.link.url)
                              : false,
                        },
                      )}
                      appearance="nav"
                    />
                  </li>
                ))}
              </ul>
            ) : null}
          </div>

          <Link
            href="/"
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 font-[family-name:var(--font-newsreader)] text-xl font-medium tracking-[0.08em] text-[var(--elixir-on-surface,#1c1b1b)] md:text-2xl"
            aria-label={`${brandName} home`}
          >
            {brandName}
          </Link>

          <div className="flex min-w-[3rem] items-center justify-end md:min-w-[12rem]">
            <Suspense
              fallback={
                <span className="relative flex h-12 w-12 items-center justify-center">
                  <ShoppingBag className="h-5 w-5" strokeWidth={1.5} />
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
