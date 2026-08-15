import React from 'react'

import { ProductCard } from '@/components/shop/ProductCard'
import type { ProductCardData } from '@/lib/shop/productCard'
import { cn } from '@/utilities/cn'

type Props = {
  products: ProductCardData[]
  className?: string
}

export function ProductGrid({ products, className }: Props) {
  return (
    <div
      className={cn(
        'grid grid-cols-2 gap-x-3 gap-y-8 md:grid-cols-3 md:gap-x-6 md:gap-y-10 lg:grid-cols-4 lg:gap-x-8',
        className,
      )}
    >
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  )
}

export function ProductCardSkeleton() {
  return (
    <div className="flex animate-pulse flex-col gap-3">
      <div className="aspect-[3/4] rounded-lg bg-[var(--elixir-surface-container,#f0eded)]" />
      <div className="h-4 w-3/4 rounded bg-[var(--elixir-surface-container-high,#eae7e7)]" />
      <div className="h-3 w-1/3 rounded bg-[var(--elixir-surface-container-high,#eae7e7)]" />
    </div>
  )
}

export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-x-3 gap-y-8 md:grid-cols-3 md:gap-x-6 md:gap-y-10 lg:grid-cols-4 lg:gap-x-8">
      {Array.from({ length: count }).map((_, index) => (
        <ProductCardSkeleton key={index} />
      ))}
    </div>
  )
}
