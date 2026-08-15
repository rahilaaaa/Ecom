'use client'

import Link from 'next/link'
import React, { useMemo } from 'react'
import { useCart } from '@payloadcms/plugin-ecommerce/client/react'

import { CartLineItem } from '@/components/Cart/CartLineItem'
import { CartOrderSummary } from '@/components/Cart/CartOrderSummary'

export function CartPageClient() {
  const { cart, isLoading } = useCart()

  const items = useMemo(() => {
    return (cart?.items || []).filter((item) => typeof item.product === 'object' && item.product)
  }, [cart?.items])

  const itemCount = useMemo(
    () => items.reduce((sum, item) => sum + (item.quantity || 0), 0),
    [items],
  )

  const subtotal = typeof cart?.subtotal === 'number' ? cart.subtotal : 0

  if (isLoading && !cart) {
    return (
      <div className="mx-auto w-full max-w-[1280px] px-5 py-16 md:px-6 lg:px-8">
        <div className="mb-4 h-10 w-48 animate-pulse rounded bg-[var(--elixir-surface-container,#f0eded)]" />
        <div className="mb-10 h-4 w-32 animate-pulse rounded bg-[var(--elixir-surface-container,#f0eded)]" />
        <div className="grid gap-10 lg:grid-cols-12">
          <div className="space-y-8 lg:col-span-7">
            {Array.from({ length: 2 }).map((_, index) => (
              <div
                key={index}
                className="aspect-square max-w-xs animate-pulse rounded-lg bg-[var(--elixir-surface-container,#f0eded)]"
              />
            ))}
          </div>
          <div className="h-80 animate-pulse rounded-lg bg-[var(--elixir-surface-container,#f0eded)] lg:col-span-5" />
        </div>
      </div>
    )
  }

  return (
    <div className="shop-luxe bg-[var(--elixir-surface,#fcf9f8)] text-[var(--elixir-on-surface,#1c1b1b)]">
      <div className="mx-auto w-full max-w-[1280px] px-5 pb-20 pt-8 md:px-6 md:pt-12 lg:px-8">
        <header className="mb-10 md:mb-12">
          <h1 className="font-[family-name:var(--font-newsreader)] text-4xl font-medium tracking-[-0.01em] md:text-5xl">
            Your Cart
          </h1>
          <p className="mt-3 text-sm text-[var(--elixir-outline,#717878)]">
            {itemCount === 0
              ? 'Your bag is currently empty.'
              : `${itemCount} ${itemCount === 1 ? 'item' : 'items'} in your bag`}
          </p>
        </header>

        {itemCount === 0 ? (
          <div className="flex flex-col items-start gap-6 py-8">
            <p className="max-w-md text-sm leading-relaxed text-[var(--elixir-on-surface-variant,#414848)]">
              Discover the latest collection and add pieces to your bag when you are ready.
            </p>
            <Link
              href="/shop"
              className="inline-flex min-h-12 items-center justify-center bg-[var(--elixir-primary-container,#0d2b2b)] px-8 text-xs font-semibold uppercase tracking-[0.12em] text-white transition hover:bg-[#164a4a]"
            >
              Continue Shopping
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-16">
            <div className="lg:col-span-7">
              {items.map((item, index) => (
                <CartLineItem key={item.id || `${index}`} item={item} />
              ))}
            </div>
            <div className="lg:col-span-5">
              <div className="lg:sticky lg:top-28">
                <CartOrderSummary subtotal={subtotal} itemCount={itemCount} />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
