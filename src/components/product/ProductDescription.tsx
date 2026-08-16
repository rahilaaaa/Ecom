'use client'
import type { Product } from '@/payload-types'

import { RichText } from '@/components/RichText'
import { AddToCart } from '@/components/Cart/AddToCart'
import { Price } from '@/components/Price'
import React, { Suspense } from 'react'

import { VariantSelector } from './VariantSelector'
import { StockIndicator } from '@/components/product/StockIndicator'
import { useProductPrice } from '@/components/product/hooks'

export function ProductDescription({ product }: { product: Product }) {
  const price = useProductPrice(product)
  const hasVariants = product.enableVariants && Boolean(product.variants?.docs?.length)

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
        <h1 className="text-2xl font-medium">{product.title}</h1>
        <div className="uppercase font-mono">
          {price.hasRange &&
          typeof price.lowestAmount === 'number' &&
          typeof price.highestAmount === 'number' ? (
            <Price highestAmount={price.highestAmount} lowestAmount={price.lowestAmount} />
          ) : typeof price.amount === 'number' ? (
            <Price amount={price.amount} />
          ) : null}
        </div>
      </div>
      {product.description ? (
        <RichText className="" data={product.description} enableGutter={false} />
      ) : null}
      <hr />
      {hasVariants && (
        <>
          <Suspense fallback={null}>
            <VariantSelector product={product} />
          </Suspense>

          <hr />
        </>
      )}
      <div className="flex items-center justify-between">
        <Suspense fallback={null}>
          <StockIndicator product={product} />
        </Suspense>
      </div>

      <div className="flex items-center justify-between">
        <Suspense fallback={null}>
          <AddToCart product={product} />
        </Suspense>
      </div>
    </div>
  )
}
