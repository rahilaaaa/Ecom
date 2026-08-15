'use client'

import type { Product } from '@/payload-types'
import React, { useState, useTransition } from 'react'

import { ProductCard } from '@/components/shop/ProductCard'
import { fetchShopProductsPage } from '@/lib/shop/actions'
import { toProductCardData, type ProductCardData } from '@/lib/shop/productCard'
import type { ShopQueryParams } from '@/lib/shop/queryProducts'
import { cn } from '@/utilities/cn'

type Props = {
  initialProducts: ProductCardData[]
  initialPage: number
  hasNextPage: boolean
  query: ShopQueryParams
}

export function ShopProductList({ initialProducts, initialPage, hasNextPage, query }: Props) {
  const [products, setProducts] = useState(initialProducts)
  const [page, setPage] = useState(initialPage)
  const [canLoadMore, setCanLoadMore] = useState(hasNextPage)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const loadMore = () => {
    startTransition(async () => {
      setError(null)
      const nextPage = page + 1
      const result = await fetchShopProductsPage({
        ...query,
        page: nextPage,
      })

      if (result.error) {
        setError(result.error)
        return
      }

      const mapped = (result.docs as Product[]).map((doc) => toProductCardData(doc))
      setProducts((prev) => {
        const existing = new Set(prev.map((item) => item.id))
        return [...prev, ...mapped.filter((item) => !existing.has(item.id))]
      })
      setPage(result.page || nextPage)
      setCanLoadMore(Boolean(result.hasNextPage))
    })
  }

  return (
    <div className="flex flex-col gap-10">
      <div className="grid grid-cols-2 gap-x-3 gap-y-8 md:grid-cols-3 md:gap-x-6 md:gap-y-10 lg:grid-cols-4 lg:gap-x-8">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>

      {error ? (
        <p className="text-center text-sm text-[#ba1a1a]" role="alert">
          {error}
        </p>
      ) : null}

      {canLoadMore ? (
        <div className="flex justify-center">
          <button
            type="button"
            onClick={loadMore}
            disabled={isPending}
            className={cn(
              'min-h-12 min-w-[180px] bg-[var(--elixir-primary-container,#0d2b2b)] px-8 text-xs font-semibold uppercase tracking-[0.12em] text-white transition hover:bg-[#164a4a] disabled:cursor-not-allowed disabled:opacity-60',
            )}
          >
            {isPending ? 'Loading…' : 'Load More'}
          </button>
        </div>
      ) : null}
    </div>
  )
}
