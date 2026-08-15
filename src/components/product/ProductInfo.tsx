'use client'

import type { Product } from '@/payload-types'
import React, { Suspense } from 'react'

import { Price } from '@/components/Price'
import { ProductAccordions } from '@/components/product/ProductAccordions'
import { ProductPurchaseActions } from '@/components/product/ProductPurchaseActions'
import { StockIndicator } from '@/components/product/StockIndicator'
import { VariantSelector } from '@/components/product/VariantSelector'
import { useProductPrice } from '@/components/product/hooks'
import { cn } from '@/utilities/cn'

type Props = {
  product: Product
  showDesktopActions?: boolean
}

export function ProductInfo({ product, showDesktopActions = true }: Props) {
  const price = useProductPrice(product)
  const hasVariants = Boolean(product.enableVariants && product.variants?.docs?.length)

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <h1 className="font-[family-name:var(--font-newsreader)] text-3xl font-medium leading-tight tracking-[-0.01em] text-[var(--elixir-on-surface,#1c1b1b)] md:text-4xl">
          {product.title}
        </h1>

        <div className="flex flex-wrap items-baseline gap-3">
          {price.hasRange &&
          typeof price.lowestAmount === 'number' &&
          typeof price.highestAmount === 'number' ? (
            <Price
              lowestAmount={price.lowestAmount}
              highestAmount={price.highestAmount}
              as="span"
              className="font-[family-name:var(--font-newsreader)] text-lg text-[var(--elixir-on-surface,#1c1b1b)]"
            />
          ) : typeof price.amount === 'number' ? (
            <Price
              amount={price.amount}
              as="span"
              className={cn(
                'font-[family-name:var(--font-newsreader)] text-lg',
                price.isOnSale ? 'text-[#ba1a1a]' : 'text-[var(--elixir-on-surface,#1c1b1b)]',
              )}
            />
          ) : null}

          {price.isOnSale && typeof price.compareAt === 'number' ? (
            <Price
              amount={price.compareAt}
              as="span"
              className="font-[family-name:var(--font-inter)] text-sm text-[var(--elixir-outline,#717878)] line-through"
            />
          ) : null}
        </div>
      </div>

      {hasVariants ? (
        <Suspense fallback={null}>
          <VariantSelector product={product} />
        </Suspense>
      ) : null}

      <Suspense fallback={null}>
        <StockIndicator product={product} />
      </Suspense>

      {showDesktopActions ? (
        <div className="hidden lg:block">
          <ProductPurchaseActions product={product} />
        </div>
      ) : null}

      <ProductAccordions product={product} />
    </div>
  )
}
