'use client'

import { ChevronDown, SlidersHorizontal } from 'lucide-react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import React, { useCallback, useEffect, useMemo, useState } from 'react'

import type { Category } from '@/payload-types'
import { sorting } from '@/lib/constants'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { cn } from '@/utilities/cn'

type Props = {
  categories: Pick<Category, 'id' | 'title' | 'slug'>[]
}

function useShopParams() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const updateParams = useCallback(
    (mutate: (params: URLSearchParams) => void) => {
      const params = new URLSearchParams(searchParams.toString())
      mutate(params)
      const qs = params.toString()
      router.push(qs ? `${pathname}?${qs}` : pathname)
    },
    [pathname, router, searchParams],
  )

  return { searchParams, updateParams }
}

export function ShopSortControl() {
  const { searchParams, updateParams } = useShopParams()
  const [open, setOpen] = useState(false)

  const current = useMemo(() => {
    const sort = searchParams.get('sort')
    return sorting.find((item) => item.slug === sort) || sorting[0]
  }, [searchParams])

  return (
    <div className="relative">
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className="inline-flex min-h-12 items-center gap-2 text-sm text-[var(--elixir-on-surface,#1c1b1b)]"
      >
        <span>
          Sort: <span className="font-medium">{current.title}</span>
        </span>
        <ChevronDown className={cn('h-4 w-4 transition', open && 'rotate-180')} />
      </button>

      {open ? (
        <>
          <button
            type="button"
            aria-label="Close sort menu"
            className="fixed inset-0 z-20 cursor-default"
            onClick={() => setOpen(false)}
          />
          <ul
            role="listbox"
            className="absolute right-0 z-30 mt-2 min-w-[220px] border border-[var(--elixir-outline-variant,#c1c8c7)] bg-white py-2 shadow-[0_16px_40px_rgba(28,27,27,0.08)]"
          >
            {sorting.map((item) => {
              const active = current.slug === item.slug
              return (
                <li key={item.title}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={active}
                    className={cn(
                      'flex w-full px-4 py-3 text-left text-sm transition hover:bg-[var(--elixir-surface-container-low,#f6f3f2)]',
                      active && 'font-medium text-[var(--elixir-primary-container,#0d2b2b)]',
                    )}
                    onClick={() => {
                      updateParams((params) => {
                        if (!item.slug || item.slug === sorting[0].slug) {
                          params.delete('sort')
                        } else {
                          params.set('sort', item.slug)
                        }
                      })
                      setOpen(false)
                    }}
                  >
                    {item.title}
                  </button>
                </li>
              )
            })}
          </ul>
        </>
      ) : null}
    </div>
  )
}

export function ShopFilterControl({ categories }: Props) {
  const { searchParams, updateParams } = useShopParams()
  const [open, setOpen] = useState(false)
  const [minPrice, setMinPrice] = useState(searchParams.get('minPrice') || '')
  const [maxPrice, setMaxPrice] = useState(searchParams.get('maxPrice') || '')

  useEffect(() => {
    setMinPrice(searchParams.get('minPrice') || '')
    setMaxPrice(searchParams.get('maxPrice') || '')
  }, [searchParams])

  const activeCategory = searchParams.get('category')
  const onSale = searchParams.get('sale') === 'true'
  const badge = searchParams.get('badge')

  const activeCount = [
    activeCategory,
    onSale ? 'sale' : null,
    badge && badge !== 'all' ? badge : null,
    searchParams.get('minPrice'),
    searchParams.get('maxPrice'),
  ].filter(Boolean).length

  const applyPrice = () => {
    updateParams((params) => {
      if (minPrice) params.set('minPrice', minPrice)
      else params.delete('minPrice')
      if (maxPrice) params.set('maxPrice', maxPrice)
      else params.delete('maxPrice')
    })
  }

  const clearAll = () => {
    updateParams((params) => {
      params.delete('category')
      params.delete('sale')
      params.delete('badge')
      params.delete('minPrice')
      params.delete('maxPrice')
      params.delete('q')
    })
    setOpen(false)
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button
          type="button"
          aria-label="Open filters"
          className="inline-flex min-h-12 items-center gap-2 rounded-full border border-[var(--elixir-outline-variant,#c1c8c7)] bg-white px-4 text-sm text-[var(--elixir-on-surface,#1c1b1b)]"
        >
          <SlidersHorizontal className="h-4 w-4" strokeWidth={1.5} />
          <span>Filter</span>
          {activeCount > 0 ? (
            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--elixir-primary-container,#0d2b2b)] px-1.5 text-[10px] font-semibold text-white">
              {activeCount}
            </span>
          ) : null}
        </button>
      </SheetTrigger>

      <SheetContent
        side="left"
        className="w-full border-[var(--elixir-outline-variant,#c1c8c7)] bg-[var(--elixir-surface,#fcf9f8)] sm:max-w-md"
      >
        <SheetHeader className="text-left">
          <SheetTitle className="font-[family-name:var(--font-newsreader)] text-2xl font-medium">
            Filter
          </SheetTitle>
          <SheetDescription className="text-[var(--elixir-on-surface-variant,#414848)]">
            Refine products by category, price, and availability.
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-1 flex-col gap-8 overflow-y-auto px-4 pb-8">
          <section className="flex flex-col gap-3">
            <h3 className="text-xs font-semibold uppercase tracking-[0.1em] text-[var(--elixir-outline,#717878)]">
              Category
            </h3>
            <div className="flex flex-col gap-1">
              <FilterOption
                label="All categories"
                active={!activeCategory}
                onClick={() =>
                  updateParams((params) => {
                    params.delete('category')
                  })
                }
              />
              {categories.map((category) => (
                <FilterOption
                  key={category.id}
                  label={category.title}
                  active={activeCategory === String(category.id)}
                  onClick={() =>
                    updateParams((params) => {
                      if (activeCategory === String(category.id)) {
                        params.delete('category')
                      } else {
                        params.set('category', String(category.id))
                      }
                    })
                  }
                />
              ))}
            </div>
          </section>

          <section className="flex flex-col gap-3">
            <h3 className="text-xs font-semibold uppercase tracking-[0.1em] text-[var(--elixir-outline,#717878)]">
              Price range (cents)
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <label className="flex flex-col gap-2 text-sm">
                <span className="text-[var(--elixir-on-surface-variant,#414848)]">Min</span>
                <input
                  type="number"
                  inputMode="numeric"
                  min={0}
                  value={minPrice}
                  onChange={(event) => setMinPrice(event.target.value)}
                  onBlur={applyPrice}
                  className="min-h-12 border border-[var(--elixir-outline-variant,#c1c8c7)] bg-white px-3 outline-none focus:border-[var(--elixir-primary-container,#0d2b2b)] focus:shadow-[0_0_0_2px_rgba(13,43,43,0.15)]"
                />
              </label>
              <label className="flex flex-col gap-2 text-sm">
                <span className="text-[var(--elixir-on-surface-variant,#414848)]">Max</span>
                <input
                  type="number"
                  inputMode="numeric"
                  min={0}
                  value={maxPrice}
                  onChange={(event) => setMaxPrice(event.target.value)}
                  onBlur={applyPrice}
                  className="min-h-12 border border-[var(--elixir-outline-variant,#c1c8c7)] bg-white px-3 outline-none focus:border-[var(--elixir-primary-container,#0d2b2b)] focus:shadow-[0_0_0_2px_rgba(13,43,43,0.15)]"
                />
              </label>
            </div>
          </section>

          <section className="flex flex-col gap-3">
            <h3 className="text-xs font-semibold uppercase tracking-[0.1em] text-[var(--elixir-outline,#717878)]">
              Availability
            </h3>
            <FilterOption
              label="On sale"
              active={onSale}
              onClick={() =>
                updateParams((params) => {
                  if (onSale) params.delete('sale')
                  else params.set('sale', 'true')
                })
              }
            />
            <FilterOption
              label="New arrivals"
              active={badge === 'new'}
              onClick={() =>
                updateParams((params) => {
                  if (badge === 'new') params.delete('badge')
                  else params.set('badge', 'new')
                })
              }
            />
          </section>

          <div className="mt-auto flex flex-col gap-3 pt-4">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="min-h-12 bg-[var(--elixir-primary-container,#0d2b2b)] text-xs font-semibold uppercase tracking-[0.12em] text-white transition hover:bg-[#164a4a]"
            >
              View results
            </button>
            <button
              type="button"
              onClick={clearAll}
              className="min-h-12 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--elixir-on-surface,#1c1b1b)] underline-offset-4 hover:underline"
            >
              Clear all
            </button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}

function FilterOption({
  label,
  active,
  onClick,
}: {
  label: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex min-h-12 items-center justify-between border-b border-[var(--elixir-surface-container,#f0eded)] px-1 text-left text-sm transition',
        active
          ? 'font-medium text-[var(--elixir-primary-container,#0d2b2b)]'
          : 'text-[var(--elixir-on-surface,#1c1b1b)]',
      )}
    >
      <span>{label}</span>
      <span
        className={cn(
          'flex h-5 w-5 items-center justify-center rounded-full border',
          active
            ? 'border-[var(--elixir-primary-container,#0d2b2b)] bg-[var(--elixir-primary-container,#0d2b2b)] text-white'
            : 'border-[var(--elixir-outline-variant,#c1c8c7)]',
        )}
        aria-hidden
      >
        {active ? '✓' : null}
      </span>
    </button>
  )
}

export function ShopToolbar({ categories }: Props) {
  return (
    <div className="flex items-center justify-between gap-4 lg:justify-end">
      <div className="lg:hidden">
        <ShopFilterControl categories={categories} />
      </div>
      <ShopSortControl />
    </div>
  )
}
