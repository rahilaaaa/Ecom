'use client'

import React from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'

import type { Category } from '@/payload-types'
import { sorting } from '@/lib/constants'
import { cn } from '@/utilities/cn'

type Props = {
  categories: Pick<Category, 'id' | 'title' | 'slug'>[]
}

export function ShopDesktopFilters({ categories }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const updateParams = (mutate: (params: URLSearchParams) => void) => {
    const params = new URLSearchParams(searchParams.toString())
    mutate(params)
    const qs = params.toString()
    router.push(qs ? `${pathname}?${qs}` : pathname)
  }

  const activeCategory = searchParams.get('category')
  const onSale = searchParams.get('sale') === 'true'
  const badge = searchParams.get('badge')
  const currentSort = searchParams.get('sort')

  return (
    <aside className="hidden w-56 shrink-0 flex-col gap-8 lg:flex xl:w-64">
      <section className="flex flex-col gap-3">
        <h2 className="text-xs font-semibold uppercase tracking-[0.1em] text-[var(--elixir-outline,#717878)]">
          Category
        </h2>
        <ul className="flex flex-col gap-1">
          <li>
            <button
              type="button"
              className={cn(
                'min-h-11 text-left text-sm transition hover:text-[var(--elixir-primary-container,#0d2b2b)]',
                !activeCategory
                  ? 'font-medium text-[var(--elixir-primary-container,#0d2b2b)]'
                  : 'text-[var(--elixir-on-surface,#1c1b1b)]',
              )}
              onClick={() =>
                updateParams((params) => {
                  params.delete('category')
                })
              }
            >
              All
            </button>
          </li>
          {categories.map((category) => {
            const active = activeCategory === String(category.id)
            return (
              <li key={category.id}>
                <button
                  type="button"
                  className={cn(
                    'min-h-11 text-left text-sm transition hover:text-[var(--elixir-primary-container,#0d2b2b)]',
                    active
                      ? 'font-medium text-[var(--elixir-primary-container,#0d2b2b)]'
                      : 'text-[var(--elixir-on-surface,#1c1b1b)]',
                  )}
                  onClick={() =>
                    updateParams((params) => {
                      if (active) params.delete('category')
                      else params.set('category', String(category.id))
                    })
                  }
                >
                  {category.title}
                </button>
              </li>
            )
          })}
        </ul>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-xs font-semibold uppercase tracking-[0.1em] text-[var(--elixir-outline,#717878)]">
          Availability
        </h2>
        <button
          type="button"
          className={cn(
            'min-h-11 text-left text-sm',
            onSale
              ? 'font-medium text-[var(--elixir-primary-container,#0d2b2b)]'
              : 'text-[var(--elixir-on-surface,#1c1b1b)]',
          )}
          onClick={() =>
            updateParams((params) => {
              if (onSale) params.delete('sale')
              else params.set('sale', 'true')
            })
          }
        >
          On sale
        </button>
        <button
          type="button"
          className={cn(
            'min-h-11 text-left text-sm',
            badge === 'new'
              ? 'font-medium text-[var(--elixir-primary-container,#0d2b2b)]'
              : 'text-[var(--elixir-on-surface,#1c1b1b)]',
          )}
          onClick={() =>
            updateParams((params) => {
              if (badge === 'new') params.delete('badge')
              else params.set('badge', 'new')
            })
          }
        >
          New arrivals
        </button>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-xs font-semibold uppercase tracking-[0.1em] text-[var(--elixir-outline,#717878)]">
          Sort by
        </h2>
        <ul className="flex flex-col gap-1">
          {sorting.map((item) => {
            const active =
              currentSort === item.slug || (!currentSort && item.slug === sorting[0].slug)
            return (
              <li key={item.title}>
                <button
                  type="button"
                  className={cn(
                    'min-h-11 text-left text-sm',
                    active
                      ? 'font-medium text-[var(--elixir-primary-container,#0d2b2b)]'
                      : 'text-[var(--elixir-on-surface,#1c1b1b)]',
                  )}
                  onClick={() =>
                    updateParams((params) => {
                      if (!item.slug || item.slug === sorting[0].slug) params.delete('sort')
                      else params.set('sort', item.slug)
                    })
                  }
                >
                  {item.title}
                </button>
              </li>
            )
          })}
        </ul>
      </section>
    </aside>
  )
}
