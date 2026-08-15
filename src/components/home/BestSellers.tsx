import Link from 'next/link'
import React from 'react'

import { ProductCard } from '@/components/shop/ProductCard'
import type { ProductCardData } from '@/lib/shop/productCard'

type Props = {
  heading: string
  viewAllLabel: string
  products: ProductCardData[]
}

export function BestSellers({ heading, viewAllLabel, products }: Props) {
  if (!products.length) return null

  return (
    <section className="mx-auto w-full max-w-[1280px] px-5 pb-16 md:px-6 md:pb-20 lg:px-8">
      <h2 className="mb-8 font-[family-name:var(--font-newsreader)] text-3xl font-medium text-[var(--elixir-on-surface,#1c1b1b)] md:mb-10 md:text-4xl">
        {heading}
      </h2>

      <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-2 xl:gap-14">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} layout="editorial" />
        ))}
      </div>

      <div className="mt-12 flex justify-center">
        <Link
          href="/shop"
          className="font-[family-name:var(--font-inter)] text-sm text-[var(--elixir-on-surface,#1c1b1b)] underline underline-offset-4 transition hover:opacity-70"
        >
          {viewAllLabel}
        </Link>
      </div>
    </section>
  )
}
