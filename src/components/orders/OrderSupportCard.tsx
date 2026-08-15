import { HelpCircle } from 'lucide-react'
import Link from 'next/link'
import React from 'react'

import { cn } from '@/utilities/cn'

type Props = {
  className?: string
}

export function OrderSupportCard({ className }: Props) {
  return (
    <section
      className={cn(
        'rounded-2xl border border-[var(--elixir-outline-variant,#c4c7c7)]/50 bg-white px-6 py-10 text-center shadow-[0_1px_2px_rgba(28,27,27,0.04)]',
        className,
      )}
    >
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-[var(--elixir-outline-variant,#c4c7c7)]">
        <HelpCircle className="h-5 w-5 text-[var(--elixir-on-surface,#1c1b1b)]" strokeWidth={1.5} />
      </div>
      <p className="mx-auto mt-4 max-w-sm text-sm leading-relaxed text-[var(--elixir-on-surface-variant,#414848)]">
        Need help with your order? Our concierge team is available to assist you.
      </p>
      <Link
        href="/contact"
        className="mt-5 inline-flex min-h-12 items-center text-xs font-semibold uppercase tracking-[0.14em] text-[var(--elixir-primary-container,#0d2b2b)] underline underline-offset-4"
      >
        Contact Support
      </Link>
    </section>
  )
}
