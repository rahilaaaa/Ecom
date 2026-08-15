import Link from 'next/link'
import React from 'react'

import { AccountOrderCard } from '@/components/account/AccountOrderCard'
import type { AccountOrderPreview } from '@/lib/account/orderPreview'
import { cn } from '@/utilities/cn'

type Props = {
  orders: AccountOrderPreview[]
  error?: boolean
  showViewAll?: boolean
  title?: string
  className?: string
}

export function AccountRecentOrders({
  orders,
  error,
  showViewAll = true,
  title = 'Recent Orders',
  className,
}: Props) {
  return (
    <section className={cn('', className)} aria-labelledby="account-orders-heading">
      <div className="mb-5 flex items-end justify-between gap-4">
        <h2
          id="account-orders-heading"
          className="font-[family-name:var(--font-newsreader)] text-2xl font-medium text-[var(--elixir-on-surface,#1c1b1b)]"
        >
          {title}
        </h2>
        {showViewAll ? (
          <Link
            href="/account/orders"
            className="text-sm underline underline-offset-4 text-[var(--elixir-on-surface,#1c1b1b)]"
          >
            View All
          </Link>
        ) : null}
      </div>

      {error ? (
        <p className="rounded-lg border border-[var(--elixir-outline-variant,#c4c7c7)]/60 px-4 py-8 text-center text-sm text-[var(--elixir-on-surface-variant,#414848)]">
          We couldn&apos;t load your orders right now. Please try again shortly.
        </p>
      ) : null}

      {!error && orders.length === 0 ? (
        <div className="rounded-lg border border-[var(--elixir-outline-variant,#c4c7c7)]/60 px-6 py-12 text-center">
          <p className="font-[family-name:var(--font-newsreader)] text-xl text-[var(--elixir-on-surface,#1c1b1b)]">
            No orders yet
          </p>
          <p className="mt-2 text-sm text-[var(--elixir-on-surface-variant,#414848)]">
            Start exploring our collection.
          </p>
          <Link
            href="/shop"
            className="mt-6 inline-flex min-h-12 items-center justify-center bg-[var(--elixir-primary,#001515)] px-8 text-sm text-white transition hover:opacity-90"
          >
            Shop Now
          </Link>
        </div>
      ) : null}

      {!error && orders.length > 0 ? (
        <ul className="flex flex-col gap-4">
          {orders.map((order) => (
            <li key={order.id}>
              <AccountOrderCard order={order} />
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  )
}
