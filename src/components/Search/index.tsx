'use client'

import { cn } from '@/utilities/cn'
import { createUrl } from '@/utilities/createUrl'
import { SearchIcon } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import React from 'react'

type Props = {
  className?: string
  inputClassName?: string
  inputId?: string
  autoFocus?: boolean
  placeholder?: string
  /** Called after a successful navigation is triggered. */
  onSubmitted?: () => void
  /**
   * `navbar` — minimal centered desktop field
   * `editorial` — expandable overlay style
   * `default` — rounded discovery form
   */
  variant?: 'default' | 'editorial' | 'navbar'
}

export const Search: React.FC<Props> = ({
  className,
  inputClassName,
  inputId = 'header-search',
  autoFocus,
  placeholder,
  onSubmitted,
  variant = 'default',
}) => {
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

    onSubmitted?.()
  }

  const resolvedPlaceholder =
    placeholder ||
    (variant === 'navbar' ? 'Search products...' : 'Search collections & products')

  return (
    <form className={cn('relative w-full', className)} onSubmit={onSubmit} role="search">
      <label htmlFor={inputId} className="sr-only">
        Search
      </label>
      <input
        id={inputId}
        autoComplete="off"
        autoFocus={autoFocus}
        className={cn(
          variant === 'editorial' &&
            'min-h-12 w-full border-0 bg-transparent px-0 py-2 pr-10 text-base text-[var(--elixir-on-surface,#1c1b1b)] outline-none placeholder:text-[var(--elixir-outline,#717878)] focus-visible:ring-0',
          variant === 'navbar' &&
            'h-10 w-full border border-[var(--elixir-outline-variant,#c1c8c7)]/55 bg-transparent px-4 pr-11 text-sm text-[var(--elixir-on-surface,#1c1b1b)] outline-none placeholder:text-[var(--elixir-outline,#717878)] transition focus:border-[var(--elixir-on-surface,#1c1b1b)]/40 focus-visible:ring-1 focus-visible:ring-[var(--elixir-on-surface,#1c1b1b)]/15',
          variant === 'default' &&
            'min-h-12 w-full rounded-full border border-[var(--elixir-outline-variant,#c4c7c7)]/70 bg-[var(--elixir-surface-container,#f0eded)] px-4 py-2 pr-10 text-sm text-[var(--elixir-on-surface,#1c1b1b)] outline-none placeholder:text-[var(--elixir-outline,#717878)] focus:border-[var(--elixir-primary-container,#0d2b2b)] focus:ring-1 focus:ring-[var(--elixir-primary-container,#0d2b2b)]',
          inputClassName,
        )}
        defaultValue={searchParams?.get('q') || ''}
        key={searchParams?.get('q')}
        name="search"
        placeholder={resolvedPlaceholder}
        type="search"
      />
      <button
        type="submit"
        aria-label="Submit search"
        className={cn(
          'absolute top-0 flex h-full items-center justify-center text-[var(--elixir-outline,#717878)] outline-none transition hover:text-[var(--elixir-on-surface,#1c1b1b)] focus-visible:text-[var(--elixir-on-surface,#1c1b1b)]',
          variant === 'navbar' ? 'right-3' : 'right-0 px-1',
        )}
      >
        <SearchIcon className="h-4 w-4" strokeWidth={1.4} aria-hidden />
      </button>
    </form>
  )
}
