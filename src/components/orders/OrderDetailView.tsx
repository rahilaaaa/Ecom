import Link from 'next/link'
import React from 'react'

import { OrderDeliveryCard } from '@/components/orders/OrderDeliveryCard'
import { OrderItemsList } from '@/components/orders/OrderItemsList'
import { OrderSummaryCard } from '@/components/orders/OrderSummaryCard'
import { OrderSupportCard } from '@/components/orders/OrderSupportCard'
import { OrderTrackingTimeline } from '@/components/orders/OrderTrackingTimeline'
import { formatOrderNumber } from '@/lib/account/orderPreview'
import { getEstimatedDeliveryRange } from '@/lib/orders/deliveryEstimate'
import { buildOrderTimeline } from '@/lib/orders/timeline'
import type { Order } from '@/payload-types'
import { formatDateTime } from '@/utilities/formatDateTime'

type Props = {
  order: Order
  showBackLink?: boolean
  invoiceQuery?: string
}

export function OrderDetailView({ order, showBackLink = true, invoiceQuery = '' }: Props) {
  const orderNumber = formatOrderNumber(order.id)
  const placedOn = formatDateTime({ date: order.createdAt, format: 'MMMM d, yyyy' })
  const timeline = buildOrderTimeline(order)
  const delivery = getEstimatedDeliveryRange(order)
  const estimatedLabel = `${formatDateTime({ date: delivery.from.toISOString(), format: 'MMM d' })} - ${formatDateTime({ date: delivery.to.toISOString(), format: 'MMM d' })}`
  const invoiceHref = `/orders/${order.id}/invoice${invoiceQuery}`

  return (
    <div className="mx-auto w-full max-w-xl px-5 pb-16 pt-6 md:max-w-2xl md:px-6 lg:pt-10">
      {showBackLink ? (
        <Link
          href="/account/orders"
          className="inline-flex min-h-10 items-center gap-1 text-sm text-[var(--elixir-on-surface,#1c1b1b)]"
        >
          <span aria-hidden>←</span> Back to Orders
        </Link>
      ) : null}

      <header className={showBackLink ? 'mt-6' : 'mt-2'}>
        <h1 className="font-[family-name:var(--font-newsreader)] text-3xl font-medium tracking-tight text-[var(--elixir-on-surface,#1c1b1b)] md:text-4xl">
          Order #{orderNumber}
        </h1>
        <p className="mt-2 text-sm text-[var(--elixir-on-surface-variant,#414848)]">
          Placed on{' '}
          <time dateTime={order.createdAt}>{placedOn}</time>
        </p>
      </header>

      <div className="mt-8 flex flex-col gap-8">
        <OrderTrackingTimeline steps={timeline} estimatedDeliveryLabel={estimatedLabel} />

        {order.items && order.items.length > 0 ? (
          <OrderItemsList items={order.items} currency={order.currency} />
        ) : null}

        <OrderSummaryCard order={order} invoiceHref={invoiceHref} />

        {order.shippingAddress ? (
          <OrderDeliveryCard address={order.shippingAddress} />
        ) : null}

        <OrderSupportCard />
      </div>
    </div>
  )
}
