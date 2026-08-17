import Link from 'next/link'
import React from 'react'

import { ProductCard } from '@/components/shop/ProductCard'
import { toProductCardData } from '@/lib/shop/productCard'

type Props = {
  products: Array<Parameters<typeof toProductCardData>[0]>
  heading?: string
}

export function RecommendedProducts({ products, heading = 'Recommended for You' }: Props) {
  if (!products.length) return null

  const cards = products.map((product) => toProductCardData(product))

  return (
    <section className="mx-auto w-full max-w-[1280px] px-5 py-16 md:px-6 md:py-20 lg:px-8">
      <h2 className="mb-8 text-center font-[family-name:var(--font-newsreader)] text-2xl font-medium text-[var(--elixir-on-surface,#1c1b1b)] md:mb-10 md:text-3xl">
        {heading}
      </h2>

      <div className="-mx-5 flex gap-4 overflow-x-auto px-5 pb-2 [scrollbar-width:none] md:mx-0 md:grid md:grid-cols-3 md:gap-8 md:overflow-visible md:px-0 lg:grid-cols-4 [&::-webkit-scrollbar]:hidden">
        {cards.map((product) => (
          <div key={product.id} className="w-[70%] shrink-0 sm:w-[45%] md:w-auto">
            <ProductCard product={product} layout="editorial" />
          </div>
        ))}
      </div>

      <div className="mt-10 flex justify-center md:hidden">
        <Link
          href="/shop"
          className="text-sm underline underline-offset-4 text-[var(--elixir-on-surface,#1c1b1b)]"
        >
          View all products
        </Link>
      </div>
    </section>
  )
}
