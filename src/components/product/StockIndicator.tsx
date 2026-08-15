'use client'

import type { Product } from '@/payload-types'
import React from 'react'

import { useSelectedVariant } from '@/components/product/hooks'
import { cn } from '@/utilities/cn'

type Props = {
  product: Product
}

export const StockIndicator: React.FC<Props> = ({ product }) => {
  const selectedVariant = useSelectedVariant(product)

  const stockQuantity = product.enableVariants
    ? selectedVariant
      ? selectedVariant.inventory || 0
      : null
    : product.inventory || 0

  if (product.enableVariants && !selectedVariant) {
    return (
      <p className="text-sm text-[var(--elixir-outline,#717878)]">Select options to check availability.</p>
    )
  }

  if (stockQuantity === null) return null

  if (stockQuantity === 0) {
    return <p className="text-sm font-medium text-[#ba1a1a]">Out of stock</p>
  }

  if (stockQuantity < 10) {
    return (
      <p className="text-sm text-[var(--elixir-on-surface-variant,#414848)]">
        Only {stockQuantity} left in stock
      </p>
    )
  }

  return (
    <p className={cn('text-sm text-[var(--elixir-on-surface-variant,#414848)]')}>In stock</p>
  )
}
