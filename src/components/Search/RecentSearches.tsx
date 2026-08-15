'use client'

import { History } from 'lucide-react'
import Link from 'next/link'
import React from 'react'

import { useRecentSearches } from '@/lib/search/useRecentSearches'
import { createUrl } from '@/utilities/createUrl'

export function RecentSearches() {
  const { recent, ready, clearAll, addSearch } = useRecentSearches()

  if (!ready || recent.length === 0) return null

  return (
    <section aria-labelledby="recent-searches">
      <div className="flex items-end justify-between gap-4 border-b border-[var(--elixir-outline-variant,#c4c7c7)]/50 pb-2">
        <h2
          id="recent-searches"
          className="text-[11px] font-medium uppercase tracking-[0.16em] text-[var(--elixir-outline,#717878)]"
        >
          Recent Searches
        </h2>
        <button
          type="button"
          onClick={clearAll}
          className="min-h-10 text-xs underline underline-offset-4 text-[var(--elixir-on-surface,#1c1b1b)]"
        >
          Clear All
        </button>
      </div>

      <ul className="mt-2">
        {recent.map((query) => {
          const href = createUrl('/search', new URLSearchParams({ q: query }))
          return (
            <li key={query}>
              <Link
                href={href}
                onClick={() => addSearch(query)}
                className="flex min-h-12 items-center gap-3 py-2 text-sm text-[var(--elixir-on-surface,#1c1b1b)] transition hover:opacity-70"
              >
                <History
                  className="h-4 w-4 shrink-0 text-[var(--elixir-outline,#717878)]"
                  strokeWidth={1.5}
                  aria-hidden
                />
                <span>{query}</span>
              </Link>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
