import Link from 'next/link'
import React from 'react'

import { DiscoverSearchInput } from '@/components/search/DiscoverSearchInput'
import { ShopProductList } from '@/components/shop/ShopProductList'
import { ShopErrorState } from '@/components/shop/ShopStates'
import { ShopToolbar } from '@/components/shop/ShopToolbar'
import type { ProductCardData } from '@/lib/shop/productCard'
import type { ShopQueryParams } from '@/lib/shop/queryProducts'

type CategoryOption = { id: string; title: string; slug: string }

type Props = {
  query: string
  cards: ProductCardData[]
  totalDocs: number
  hasNextPage: boolean
  shopQuery: ShopQueryParams
  categories: CategoryOption[]
  loadError?: boolean
}

export function SearchResults({
  query,
  cards,
  totalDocs,
  hasNextPage,
  shopQuery,
  categories,
  loadError,
}: Props) {
  return (
    <div className="mx-auto w-full max-w-[1280px] px-5 pb-20 pt-8 md:px-6 lg:px-8 lg:pt-12">
      <div className="mx-auto max-w-xl md:mx-0 md:max-w-2xl">
        <DiscoverSearchInput initialQuery={query} />
      </div>

      <div className="mt-8 flex flex-col gap-2 md:mt-10 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="font-[family-name:var(--font-newsreader)] text-3xl font-medium text-[var(--elixir-on-surface,#1c1b1b)] md:text-4xl">
            Results for “{query}”
          </h1>
          {!loadError ? (
            <p className="mt-2 text-sm text-[var(--elixir-outline,#717878)]">
              {totalDocs} {totalDocs === 1 ? 'item' : 'items'}
            </p>
          ) : null}
        </div>
        <Link
          href="/search"
          className="text-sm underline underline-offset-4 text-[var(--elixir-on-surface,#1c1b1b)]"
        >
          Back to Discover
        </Link>
      </div>

      {loadError ? (
        <div className="mt-10">
          <ShopErrorState />
        </div>
      ) : (
        <>
          <div className="mt-6 border-b border-[var(--elixir-surface-container-highest,#e5e2e1)] pb-5">
            <ShopToolbar categories={categories} />
          </div>

          <div className="mt-8">
            {cards.length === 0 ? (
              <div className="rounded-2xl border border-[var(--elixir-outline-variant,#c4c7c7)]/60 px-6 py-16 text-center">
                <p className="font-[family-name:var(--font-newsreader)] text-2xl text-[var(--elixir-on-surface,#1c1b1b)]">
                  No results for “{query}”
                </p>
                <p className="mx-auto mt-3 max-w-sm text-sm text-[var(--elixir-on-surface-variant,#414848)]">
                  Try another search or explore our collections.
                </p>
                <Link
                  href="/shop"
                  className="mt-8 inline-flex min-h-12 items-center justify-center bg-[var(--elixir-primary,#001515)] px-8 text-xs font-semibold uppercase tracking-[0.14em] text-white transition hover:opacity-90"
                >
                  Browse All Products
                </Link>
              </div>
            ) : (
              <ShopProductList
                key={[query, shopQuery.sort, shopQuery.category, shopQuery.sale, shopQuery.badge].join('|')}
                initialProducts={cards}
                initialPage={1}
                hasNextPage={hasNextPage}
                query={shopQuery}
              />
            )}
          </div>
        </>
      )}
    </div>
  )
}
