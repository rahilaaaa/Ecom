import Link from 'next/link'
import React from 'react'

import { BuyAgainButton } from '@/components/account/BuyAgainButton'
import { Media } from '@/components/Media'
import { Price } from '@/components/Price'
import type { AccountOrderPreview } from '@/lib/account/orderPreview'
import { cn } from '@/utilities/cn'

type Props = {
  order: AccountOrderPreview
  className?: string
}

export function AccountOrderCard({ order, className }: Props) {
  return (
    <article
      className={cn(
        'rounded-lg border border-[var(--elixir-outline-variant,#c4c7c7)]/60 bg-[var(--elixir-surface,#fcf9f8)] p-4',
        className,
      )}
    >
      <div className="flex gap-4">
        <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-md bg-[var(--elixir-surface-container,#f0eded)]">
          {order.productImage ? (
            <Media
              resource={order.productImage}
              fill
              imgClassName="object-cover"
              className="relative h-full w-full"
              size="80px"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-[10px] uppercase tracking-wider text-[var(--elixir-on-surface-variant,#414848)]">
              No image
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-[var(--elixir-on-surface-variant,#414848)]">
            Order #{order.orderNumber}
          </p>

          <div className="mt-1 flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="truncate text-sm font-semibold text-[var(--elixir-on-surface,#1c1b1b)]">
                {order.productTitle}
                {order.additionalItemCount > 0 ? (
                  <span className="font-normal text-[var(--elixir-on-surface-variant,#414848)]">
                    {` +${order.additionalItemCount} more`}
                  </span>
                ) : null}
              </h3>
              <p className="mt-1 text-sm text-[var(--elixir-on-surface-variant,#414848)]">
                {order.statusLabel}
              </p>
            </div>

            {typeof order.amount === 'number' ? (
              <Price
                className="shrink-0 text-sm font-semibold text-[var(--elixir-on-surface,#1c1b1b)]"
                amount={order.amount}
                currencyCode={order.currency ?? undefined}
              />
            ) : null}
          </div>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2">
        <Link
          href={order.primaryAction.href}
          className="text-sm underline underline-offset-4 text-[var(--elixir-on-surface,#1c1b1b)]"
        >
          {order.primaryAction.label}
        </Link>
        {order.buyAgain ? <BuyAgainButton buyAgain={order.buyAgain} /> : null}
      </div>
    </article>
  )
}
