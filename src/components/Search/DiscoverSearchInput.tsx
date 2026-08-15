'use client'

import { SearchIcon, X } from 'lucide-react'
import { useRouter } from 'next/navigation'
import React, { useEffect, useState } from 'react'

import { sanitizeSearchQuery } from '@/lib/search/constants'
import { useRecentSearches } from '@/lib/search/useRecentSearches'
import { cn } from '@/utilities/cn'
import { createUrl } from '@/utilities/createUrl'

type Props = {
  initialQuery?: string
  className?: string
  autoFocus?: boolean
}

export function DiscoverSearchInput({ initialQuery = '', className, autoFocus }: Props) {
  const router = useRouter()
  const { addSearch } = useRecentSearches()
  const [value, setValue] = useState(initialQuery)

  useEffect(() => {
    setValue(initialQuery)
  }, [initialQuery])

  const submit = (raw: string) => {
    const query = sanitizeSearchQuery(raw)
    const params = new URLSearchParams()

    if (query) {
      params.set('q', query)
      addSearch(query)
      router.push(createUrl('/search', params))
    } else {
      router.push('/search')
    }
  }

  return (
    <form
      className={cn('relative w-full', className)}
      role="search"
      onSubmit={(event) => {
        event.preventDefault()
        submit(value)
      }}
    >
      <label htmlFor="discover-search" className="sr-only">
        Search collections, products, and categories
      </label>
      <SearchIcon
        className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--elixir-outline,#717878)]"
        strokeWidth={1.5}
        aria-hidden
      />
      <input
        id="discover-search"
        name="q"
        type="search"
        enterKeyHint="search"
        autoComplete="off"
        autoFocus={autoFocus}
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder="Search for collections, items, or categories"
        className="min-h-12 w-full rounded-full border border-[var(--elixir-outline-variant,#c4c7c7)]/70 bg-[var(--elixir-surface-container,#f0eded)] py-3 pl-11 pr-12 text-sm text-[var(--elixir-on-surface,#1c1b1b)] outline-none transition placeholder:text-[var(--elixir-outline,#717878)] focus:border-[var(--elixir-primary-container,#0d2b2b)] focus:ring-1 focus:ring-[var(--elixir-primary-container,#0d2b2b)]"
      />
      {value ? (
        <button
          type="button"
          onClick={() => {
            setValue('')
            router.push('/search')
          }}
          className="absolute right-2 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full text-[var(--elixir-on-surface,#1c1b1b)] transition hover:bg-white/70"
          aria-label="Clear search"
        >
          <X className="h-4 w-4" strokeWidth={1.5} />
        </button>
      ) : null}
    </form>
  )
}
