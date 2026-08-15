'use client'

import Link from 'next/link'
import { ShoppingBag } from 'lucide-react'
import React, { useMemo } from 'react'
import { useCart } from '@payloadcms/plugin-ecommerce/client/react'
import clsx from 'clsx'

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
      className={clsx(
        'relative flex h-12 w-12 items-center justify-center text-[var(--elixir-on-surface,#1c1b1b)] transition hover:opacity-70',
      )}
    >
      <ShoppingBag className="h-5 w-5" strokeWidth={1.5} />
      {totalQuantity ? (
        <span className="absolute right-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#ba1a1a] px-1 text-[10px] font-semibold leading-none text-white">
          {totalQuantity > 99 ? '99+' : totalQuantity}
        </span>
      ) : null}
    </Link>
  )
}
