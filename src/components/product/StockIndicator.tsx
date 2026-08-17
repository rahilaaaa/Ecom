'use client'

import type { Product } from '@/payload-types'
import React from 'react'

import { useSelectedVariant } from '@/components/product/hooks'
import { getAvailableInventory, getStockStatus } from '@/lib/product/inventory'
import { cn } from '@/utilities/cn'

type Props = {
  product: Product
}

export const StockIndicator: React.FC<Props> = ({ product }) => {
  const selectedVariant = useSelectedVariant(product)
  const status = getStockStatus(product, selectedVariant)
  const stockQuantity = getAvailableInventory(product, selectedVariant)

  if (status === 'select-options') {
    return (
      <p className="text-sm text-[var(--elixir-outline,#717878)]">Select options to check availability.</p>
    )
  }

  if (status === 'out-of-stock') {
    return <p className="text-sm font-medium text-[#ba1a1a]">Out of stock</p>
  }

  if (status === 'low' && typeof stockQuantity === 'number') {
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
