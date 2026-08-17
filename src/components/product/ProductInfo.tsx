'use client'

import type { Product } from '@/payload-types'
import React, { Suspense } from 'react'
import Link from 'next/link'

import { Price } from '@/components/Price'
import { ProductAccordions } from '@/components/product/ProductAccordions'
import { ProductBadge } from '@/components/product/ProductBadge'
import { ProductPurchaseActions } from '@/components/product/ProductPurchaseActions'
import { ProductRating } from '@/components/product/ProductRating'
import { QuantitySelector } from '@/components/product/QuantitySelector'
import { StockIndicator } from '@/components/product/StockIndicator'
import { VariantSelector } from '@/components/product/VariantSelector'
import { useProductPrice } from '@/components/product/hooks'
import { useProductQuantity } from '@/components/product/ProductPDPProvider'
import { getProductCategories } from '@/lib/product/content'
import { buildVariantOptionGroups } from '@/lib/product/variants'
import { cn } from '@/utilities/cn'

type Props = {
  product: Product
  showDesktopActions?: boolean
}

export function ProductInfo({ product, showDesktopActions = true }: Props) {
  const price = useProductPrice(product)
  const { quantity, setQuantity, maxQuantity } = useProductQuantity()
  const hasVariants = buildVariantOptionGroups(product).length > 0
  const categories = getProductCategories(product)

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-3">
        {categories.length ? (
          <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-[var(--elixir-outline,#717878)]">
            {categories.map((category, index) => (
              <React.Fragment key={category.id}>
                {index > 0 ? <span aria-hidden> · </span> : null}
                <Link
                  href={`/shop?category=${category.id}`}
                  className="transition hover:text-[var(--elixir-on-surface,#1c1b1b)]"
                >
                  {category.title}
                </Link>
              </React.Fragment>
            ))}
          </p>
        ) : null}

        <div className="flex flex-wrap items-start justify-between gap-3">
          <h1 className="font-[family-name:var(--font-newsreader)] text-3xl font-medium leading-tight tracking-[-0.01em] text-[var(--elixir-on-surface,#1c1b1b)] md:text-4xl">
            {product.title}
          </h1>
          <ProductBadge badge={product.badge} className="mt-2" />
        </div>

        {typeof product.rating === 'number' ? <ProductRating rating={product.rating} /> : null}

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

      {maxQuantity > 0 ? (
        <QuantitySelector
          value={quantity}
          max={maxQuantity}
          onChange={setQuantity}
        />
      ) : null}

      {showDesktopActions ? (
        <div className="hidden lg:block">
          <ProductPurchaseActions product={product} />
        </div>
      ) : null}

      <ProductAccordions product={product} />
    </div>
  )
}
