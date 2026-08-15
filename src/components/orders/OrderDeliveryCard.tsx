import { MapPin } from 'lucide-react'
import React from 'react'

import type { Order } from '@/payload-types'
import { cn } from '@/utilities/cn'

type Props = {
  address: NonNullable<Order['shippingAddress']>
  className?: string
}

/** Decorative map panel — no live map provider / no API keys. */
function DeliveryMapPlaceholder() {
  return (
    <div
      className="relative mt-4 aspect-[16/9] overflow-hidden rounded-xl bg-[var(--elixir-surface-container-high,#eae7e7)]"
      aria-hidden
    >
      <svg className="h-full w-full" viewBox="0 0 400 225" preserveAspectRatio="xMidYMid slice">
        <rect width="400" height="225" fill="#e8e4e2" />
        <path
          d="M0 140 C60 120 90 160 140 145 C200 125 240 170 300 150 C340 138 370 120 400 130 L400 225 L0 225 Z"
          fill="#d4d0cd"
          opacity="0.9"
        />
        <path
          d="M40 0 L55 225 M120 0 L100 225 M210 0 L230 225 M300 0 L280 225 M360 0 L370 225"
          stroke="#c8c4c1"
          strokeWidth="6"
        />
        <path
          d="M0 50 H400 M0 110 H400 M0 180 H400"
          stroke="#c8c4c1"
          strokeWidth="5"
        />
        <circle cx="210" cy="118" r="10" fill="#3b82c4" />
        <circle cx="210" cy="118" r="18" fill="#3b82c4" opacity="0.2" />
      </svg>
    </div>
  )
}

export function OrderDeliveryCard({ address, className }: Props) {
  const name = [address.firstName, address.lastName].filter(Boolean).join(' ')
  const line1 = [address.addressLine1, address.addressLine2].filter(Boolean).join(', ')
  const cityLine = [address.city, address.state, address.postalCode].filter(Boolean).join(', ')

  return (
    <section
      className={cn(
        'rounded-2xl bg-[var(--elixir-surface-container,#f0eded)] p-5 md:p-6',
        className,
      )}
      aria-labelledby="order-delivery-heading"
    >
      <div className="flex items-center gap-2">
        <MapPin className="h-5 w-5 text-[var(--elixir-on-surface,#1c1b1b)]" strokeWidth={1.5} />
        <h2
          id="order-delivery-heading"
          className="font-[family-name:var(--font-newsreader)] text-xl font-medium text-[var(--elixir-on-surface,#1c1b1b)]"
        >
          Delivery
        </h2>
      </div>

      <DeliveryMapPlaceholder />

      <address className="mt-4 not-italic text-sm leading-relaxed text-[var(--elixir-on-surface,#1c1b1b)]">
        {name ? <p className="font-medium">{name}</p> : null}
        {line1 ? <p>{line1}</p> : null}
        {cityLine ? <p>{cityLine}</p> : null}
        {address.country ? <p>{address.country}</p> : null}
      </address>
    </section>
  )
}
