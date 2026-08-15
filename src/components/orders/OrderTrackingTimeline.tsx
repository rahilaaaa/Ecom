import {
  FileText,
  Home,
  Package,
  ShieldCheck,
  Truck,
} from 'lucide-react'
import React from 'react'

import type { OrderTimelineStep } from '@/lib/orders/timeline'
import { cn } from '@/utilities/cn'

const icons = {
  placed: FileText,
  confirmed: ShieldCheck,
  processing: Package,
  shipped: Truck,
  delivered: Home,
} as const

type Props = {
  steps: OrderTimelineStep[]
  estimatedDeliveryLabel: string
  className?: string
}

export function OrderTrackingTimeline({ steps, estimatedDeliveryLabel, className }: Props) {
  return (
    <section
      className={cn(
        'rounded-2xl border border-[var(--elixir-outline-variant,#c4c7c7)]/50 bg-white p-5 shadow-[0_1px_2px_rgba(28,27,27,0.04)] md:p-6',
        className,
      )}
      aria-labelledby="tracking-details-heading"
    >
      <h2
        id="tracking-details-heading"
        className="font-[family-name:var(--font-newsreader)] text-xl font-medium text-[var(--elixir-on-surface,#1c1b1b)]"
      >
        Tracking Details
      </h2>

      <div className="mt-5">
        <p className="text-xs uppercase tracking-[0.12em] text-[var(--elixir-on-surface-variant,#414848)]">
          Estimated Delivery
        </p>
        <p className="mt-1 font-[family-name:var(--font-newsreader)] text-2xl font-medium text-[var(--elixir-on-surface,#1c1b1b)]">
          {estimatedDeliveryLabel}
        </p>
      </div>

      <ol className="relative mt-8 space-y-0">
        {steps.map((step, index) => {
          const Icon = icons[step.key]
          const isLast = index === steps.length - 1
          const complete = step.state === 'complete'
          const current = step.state === 'current'
          const skipped = step.state === 'skipped'
          const active = complete || current

          return (
            <li key={step.key} className="relative flex gap-4 pb-8 last:pb-0">
              {!isLast ? (
                <span
                  aria-hidden
                  className={cn(
                    'absolute left-[19px] top-10 h-[calc(100%-2.5rem)] w-px',
                    complete ? 'bg-[var(--elixir-primary-container,#0d2b2b)]' : 'bg-[var(--elixir-outline-variant,#c4c7c7)]',
                  )}
                />
              ) : null}

              <div
                className={cn(
                  'relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full',
                  active
                    ? 'bg-[var(--elixir-primary-container,#0d2b2b)] text-white'
                    : 'bg-[var(--elixir-surface-container,#f0eded)] text-[var(--elixir-outline,#717878)]',
                  current && 'ring-4 ring-[var(--elixir-primary-container,#0d2b2b)]/20',
                  skipped && 'opacity-50',
                )}
              >
                <Icon className="h-4 w-4" strokeWidth={1.75} aria-hidden />
              </div>

              <div className="min-w-0 pt-1">
                <p
                  className={cn(
                    'text-xs font-semibold uppercase tracking-[0.14em]',
                    active
                      ? 'text-[var(--elixir-on-surface,#1c1b1b)]'
                      : 'text-[var(--elixir-outline,#717878)]',
                  )}
                >
                  {step.label}
                  {current ? <span className="sr-only"> (current)</span> : null}
                </p>
                {step.detail ? (
                  <p className="mt-1 text-sm text-[var(--elixir-on-surface-variant,#414848)]">
                    {step.detail}
                  </p>
                ) : null}
              </div>
            </li>
          )
        })}
      </ol>
    </section>
  )
}
