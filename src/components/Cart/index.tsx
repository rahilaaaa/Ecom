'use client'

import Link from 'next/link'
import { ShoppingBag } from 'lucide-react'
import React, { useMemo } from 'react'
import { useCart } from '@payloadcms/plugin-ecommerce/client/react'

import type { Cart as PayloadCart } from '@/payload-types'
import { cn } from '@/utilities/cn'

export type CartItem = NonNullable<PayloadCart['items']>[number]

/**
 * Header cart control — links to the dedicated cart page.
 * Count badge reflects live cart quantity from the ecommerce plugin.
 */
export function Cart() {
  const { cart } = useCart()

  const totalQuantity = useMemo(() => {
    if (!cart?.items?.length) return undefined
    return cart.items.reduce((quantity, item) => (item.quantity || 0) + quantity, 0)
  }, [cart])

  return (
    <Link
      href="/cart"
      aria-label={totalQuantity ? `Open cart, ${totalQuantity} items` : 'Open cart'}
      className={cn(
        'relative flex h-11 w-11 items-center justify-center text-[var(--elixir-on-surface,#1c1b1b)] outline-none transition hover:opacity-60 focus-visible:ring-1 focus-visible:ring-[var(--elixir-on-surface,#1c1b1b)]/25',
      )}
    >
      <ShoppingBag className="h-[18px] w-[18px]" strokeWidth={1.4} aria-hidden />
      {totalQuantity ? (
        <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center bg-[var(--elixir-on-surface,#1c1b1b)] px-1 text-[9px] font-semibold leading-none text-[var(--elixir-surface,#fcf9f8)]">
          {totalQuantity > 99 ? '99+' : totalQuantity}
        </span>
      ) : null}
    </Link>
  )
}
