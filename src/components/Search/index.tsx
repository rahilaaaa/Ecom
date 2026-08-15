'use client'

import { cn } from '@/utilities/cn'
import { createUrl } from '@/utilities/createUrl'
import { SearchIcon } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import React from 'react'

type Props = {
  className?: string
}

export const Search: React.FC<Props> = ({ className }) => {
  const router = useRouter()
  const searchParams = useSearchParams()

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()

    const val = e.target as HTMLFormElement
    const search = val.search as HTMLInputElement
    const newParams = new URLSearchParams()

    if (search.value.trim()) {
      newParams.set('q', search.value.trim())
      router.push(createUrl('/search', newParams))
    } else {
      router.push('/search')
    }
  }

  return (
    <form className={cn('relative w-full', className)} onSubmit={onSubmit} role="search">
      <label htmlFor="header-search" className="sr-only">
        Search
      </label>
      <input
        id="header-search"
        autoComplete="off"
        className="min-h-12 w-full rounded-full border border-[var(--elixir-outline-variant,#c4c7c7)]/70 bg-[var(--elixir-surface-container,#f0eded)] px-4 py-2 pr-10 text-sm text-[var(--elixir-on-surface,#1c1b1b)] outline-none placeholder:text-[var(--elixir-outline,#717878)] focus:border-[var(--elixir-primary-container,#0d2b2b)] focus:ring-1 focus:ring-[var(--elixir-primary-container,#0d2b2b)]"
        defaultValue={searchParams?.get('q') || ''}
        key={searchParams?.get('q')}
        name="search"
        placeholder="Search collections & products"
        type="search"
      />
      <div className="absolute right-0 top-0 mr-3 flex h-full items-center">
        <SearchIcon className="h-4 w-4 text-[var(--elixir-outline,#717878)]" aria-hidden />
      </div>
    </form>
  )
}
