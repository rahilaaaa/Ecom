import { FileText } from 'lucide-react'
import Link from 'next/link'
import React from 'react'

import { Price } from '@/components/Price'
import type { Order } from '@/payload-types'
import { cn } from '@/utilities/cn'

type Props = {
  order: Order
  invoiceHref: string
  className?: string
}

function paymentMethodLabel(method: Order['paymentMethod']): string | null {
  if (method === 'cod') return 'Cash on Delivery'
  if (method === 'stripe') return 'Online Payment'
  return null
}

function paymentStatusLabel(status: Order['paymentStatus'], method: Order['paymentMethod']): string | null {
  if (status === 'pending' && method === 'cod') return 'Pay on delivery'
  if (status === 'pending') return 'Pending'
  if (status === 'paid') return 'Paid'
  if (status === 'failed') return 'Failed'
  if (status === 'refunded') return 'Refunded'
  return null
}

export function OrderSummaryCard({ order, invoiceHref, className }: Props) {
  const currency = order.currency ?? undefined
  const subtotal = typeof order.subtotal === 'number' ? order.subtotal : null
  const discount = typeof order.discountAmount === 'number' ? order.discountAmount : null
  const shipping = typeof order.shippingAmount === 'number' ? order.shippingAmount : null
  const tax = typeof order.taxAmount === 'number' ? order.taxAmount : null
  const total = typeof order.amount === 'number' ? order.amount : null
  const methodLabel = paymentMethodLabel(order.paymentMethod)
  const statusLabel = paymentStatusLabel(order.paymentStatus, order.paymentMethod)

  return (
    <section
      className={cn(
        'rounded-2xl bg-[var(--elixir-surface-container,#f0eded)] p-5 md:p-6',
        className,
      )}
      aria-labelledby="order-summary-heading"
    >
      <h2
        id="order-summary-heading"
        className="font-[family-name:var(--font-newsreader)] text-xl font-medium text-[var(--elixir-on-surface,#1c1b1b)]"
      >
        Summary
      </h2>

      <dl className="mt-5 space-y-3 text-sm text-[var(--elixir-on-surface,#1c1b1b)]">
        {methodLabel ? (
          <div className="flex items-center justify-between gap-4">
            <dt className="text-[var(--elixir-on-surface-variant,#414848)]">Payment method</dt>
            <dd>{methodLabel}</dd>
          </div>
        ) : null}
        {statusLabel ? (
          <div className="flex items-center justify-between gap-4">
            <dt className="text-[var(--elixir-on-surface-variant,#414848)]">Payment status</dt>
            <dd>{statusLabel}</dd>
          </div>
        ) : null}
        <div className="flex items-center justify-between gap-4">
          <dt className="text-[var(--elixir-on-surface-variant,#414848)]">Subtotal</dt>
          <dd>
            {typeof subtotal === 'number' ? (
              <Price amount={subtotal} currencyCode={currency} />
            ) : typeof total === 'number' ? (
              <Price amount={total} currencyCode={currency} />
            ) : (
              '—'
            )}
          </dd>
        </div>
        {typeof discount === 'number' && discount > 0 ? (
          <div className="flex items-center justify-between gap-4">
            <dt className="text-[var(--elixir-on-surface-variant,#414848)]">Discount</dt>
            <dd>
              −
              <Price amount={discount} currencyCode={currency} />
            </dd>
          </div>
        ) : null}
        <div className="flex items-center justify-between gap-4">
          <dt className="text-[var(--elixir-on-surface-variant,#414848)]">Shipping</dt>
          <dd>
            {shipping === 0 ? (
              'Free'
            ) : typeof shipping === 'number' ? (
              <Price amount={shipping} currencyCode={currency} />
            ) : (
              '—'
            )}
          </dd>
        </div>
        <div className="flex items-center justify-between gap-4">
          <dt className="text-[var(--elixir-on-surface-variant,#414848)]">Tax</dt>
          <dd>
            {typeof tax === 'number' ? <Price amount={tax} currencyCode={currency} /> : '—'}
          </dd>
        </div>
        <div className="flex items-center justify-between gap-4 border-t border-[var(--elixir-outline-variant,#c4c7c7)]/50 pt-3 font-semibold">
          <dt>{order.paymentMethod === 'cod' && order.paymentStatus === 'pending' ? 'Amount to pay' : 'Total'}</dt>
          <dd>
            {typeof total === 'number' ? (
              <Price amount={total} currencyCode={currency} className="font-semibold" />
            ) : (
              '—'
            )}
          </dd>
        </div>
      </dl>

      <Link
        href={invoiceHref}
        className="mt-6 inline-flex min-h-12 w-full items-center justify-center gap-2 bg-[var(--elixir-primary,#001515)] px-6 text-xs font-semibold uppercase tracking-[0.14em] text-white transition hover:opacity-90"
      >
        <FileText className="h-4 w-4" strokeWidth={1.75} aria-hidden />
        View Invoice
      </Link>
    </section>
  )
}
