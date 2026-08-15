'use client'

import { CreditCard, Heart, LogOut, MapPin, Package, Settings } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import React from 'react'

import { cn } from '@/utilities/cn'

const navItems = [
  {
    href: '/account',
    label: 'My Orders',
    icon: Package,
    match: (pathname: string) =>
      pathname === '/account' || pathname.startsWith('/account/orders') || pathname.startsWith('/orders'),
  },
  {
    href: '/account/wishlist',
    label: 'Wishlist',
    icon: Heart,
    match: (pathname: string) => pathname.startsWith('/account/wishlist'),
  },
  {
    href: '/account/addresses',
    label: 'Addresses',
    icon: MapPin,
    match: (pathname: string) => pathname.startsWith('/account/addresses'),
  },
  {
    href: '/account/payment-methods',
    label: 'Payment Methods',
    icon: CreditCard,
    match: (pathname: string) => pathname.startsWith('/account/payment-methods'),
  },
  {
    href: '/account/settings',
    label: 'Settings',
    icon: Settings,
    match: (pathname: string) => pathname.startsWith('/account/settings'),
  },
] as const

type Props = {
  className?: string
}

export function AccountNav({ className }: Props) {
  const pathname = usePathname()

  return (
    <nav aria-label="Account" className={cn('w-full', className)}>
      <ul className="flex flex-col gap-1">
        {navItems.map((item) => {
          const Icon = item.icon
          const active = item.match(pathname)

          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'flex min-h-12 items-center gap-3 rounded-xl px-4 py-3 text-sm text-[var(--elixir-on-surface,#1c1b1b)] transition-colors',
                  active
                    ? 'bg-[var(--elixir-surface-container,#f0eded)] font-medium'
                    : 'hover:bg-[var(--elixir-surface-container-low,#f6f3f2)]',
                )}
              >
                <Icon className="h-5 w-5 shrink-0" strokeWidth={1.5} aria-hidden />
                <span>{item.label}</span>
              </Link>
            </li>
          )
        })}
      </ul>

      <div className="my-3 border-t border-[var(--elixir-outline-variant,#c4c7c7)]" />

      <Link
        href="/logout"
        className="flex min-h-12 items-center gap-3 rounded-xl px-4 py-3 text-sm text-[#8a1c1c] transition-colors hover:bg-[#f3d6d6]/20"
      >
        <LogOut className="h-5 w-5 shrink-0" strokeWidth={1.5} aria-hidden />
        <span>Logout</span>
      </Link>

      <div className="mt-3 border-t border-[var(--elixir-outline-variant,#c4c7c7)]" />
    </nav>
  )
}
