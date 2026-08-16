'use client'

import Link from 'next/link'
import React from 'react'

import type { PopularSearch } from '@/lib/search/constants'
import { useRecentSearches } from '@/lib/search/useRecentSearches'
import { createUrl } from '@/utilities/createUrl'

type Props = {
  items: PopularSearch[]
}

export function PopularSearchChips({ items }: Props) {
  const { addSearch } = useRecentSearches()

  if (!items.length) return null

  return (
    <section aria-labelledby="popular-right-now">
      <div className="border-b border-[var(--elixir-outline-variant,#c4c7c7)]/50 pb-2">
        <h2
          id="popular-right-now"
          className="text-[11px] font-medium uppercase tracking-[0.16em] text-[var(--elixir-outline,#717878)]"
        >
          Popular Right Now
        </h2>
      </div>

      <ul className="mt-4 flex flex-wrap gap-2">
        {items.map((item) => {
          const href = createUrl('/search', new URLSearchParams({ q: item.query }))
          return (
            <li key={item.label}>
              <Link
                href={href}
                onClick={() => addSearch(item.query)}
                className="inline-flex min-h-10 items-center rounded-lg border border-[var(--elixir-outline-variant,#c4c7c7)]/70 bg-[var(--elixir-surface-container-low,#f6f3f2)] px-3.5 text-sm text-[var(--elixir-on-surface,#1c1b1b)] transition hover:border-[var(--elixir-on-surface,#1c1b1b)]"
              >
                {item.label}
              </Link>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
