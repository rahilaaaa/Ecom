import Link from 'next/link'
import React from 'react'

type Props = {
  onClearHref?: string
}

export function ShopEmptyState({ onClearHref = '/shop' }: Props) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
      <h2 className="font-[family-name:var(--font-newsreader)] text-2xl font-medium text-[var(--elixir-on-surface,#1c1b1b)]">
        No products found
      </h2>
      <p className="max-w-md text-sm leading-relaxed text-[var(--elixir-on-surface-variant,#414848)]">
        Try changing your filters or browse all products.
      </p>
      <Link
        href={onClearHref}
        className="mt-2 inline-flex min-h-12 items-center justify-center bg-[var(--elixir-primary-container,#0d2b2b)] px-6 text-xs font-semibold uppercase tracking-[0.12em] text-white transition hover:bg-[#164a4a]"
      >
        Clear filters
      </Link>
    </div>
  )
}

export function ShopErrorState({
  message = 'Something went wrong while loading products.',
  retryHref = '/shop',
}: {
  message?: string
  retryHref?: string
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
      <h2 className="font-[family-name:var(--font-newsreader)] text-2xl font-medium text-[var(--elixir-on-surface,#1c1b1b)]">
        Unable to load shop
      </h2>
      <p className="max-w-md text-sm leading-relaxed text-[var(--elixir-on-surface-variant,#414848)]">
        {message}
      </p>
      <Link
        href={retryHref}
        className="mt-2 inline-flex min-h-12 items-center justify-center border border-[var(--elixir-on-surface,#1c1b1b)] px-6 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--elixir-on-surface,#1c1b1b)] transition hover:bg-[var(--elixir-surface-container,#f0eded)]"
      >
        Try again
      </Link>
    </div>
  )
}
