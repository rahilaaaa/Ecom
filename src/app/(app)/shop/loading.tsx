import React from 'react'

import { ProductGridSkeleton } from '@/components/shop/ProductGrid'

export default function Loading() {
  return (
    <div className="shop-luxe bg-[var(--elixir-surface,#fcf9f8)]">
      <div className="mx-auto w-full max-w-[1280px] px-5 pb-20 pt-6 md:px-6 md:pt-10 lg:px-8">
        <div className="mb-6 h-4 w-32 animate-pulse rounded bg-[var(--elixir-surface-container,#f0eded)]" />
        <div className="mb-2 h-10 w-48 animate-pulse rounded bg-[var(--elixir-surface-container,#f0eded)]" />
        <div className="mb-8 h-4 w-20 animate-pulse rounded bg-[var(--elixir-surface-container,#f0eded)]" />
        <div className="mb-8 flex justify-between border-b border-[var(--elixir-surface-container-highest,#e5e2e1)] pb-5">
          <div className="h-12 w-28 animate-pulse rounded-full bg-[var(--elixir-surface-container,#f0eded)]" />
          <div className="h-12 w-36 animate-pulse rounded bg-[var(--elixir-surface-container,#f0eded)]" />
        </div>
        <ProductGridSkeleton count={8} />
      </div>
    </div>
  )
}
