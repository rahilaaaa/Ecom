'use client'

import type { Product, Variant } from '@/payload-types'
import { useSearchParams } from 'next/navigation'
import { useMemo } from 'react'

import { getEffectivePrice, getEffectivePriceRange } from '@/lib/currency'
import { resolveVariantFromSearchParams } from '@/lib/product/variants'

export function useSelectedVariant(product: Product): Variant | undefined {
  const searchParams = useSearchParams()

  return useMemo(
    () => resolveVariantFromSearchParams(product, searchParams),
    [product, searchParams],
  )
}

export function useProductPrice(product: Product): {
  amount: number | null
  isOnSale: boolean
  lowestAmount: number | null
  highestAmount: number | null
  hasRange: boolean
} {
  const selectedVariant = useSelectedVariant(product)
  const hasVariants = Boolean(product.enableVariants && product.variants?.docs?.length)

  return useMemo(() => {
    const range = getEffectivePriceRange(product)

    if (hasVariants) {
      if (selectedVariant) {
        return {
          amount: getEffectivePrice({
            product,
            variant: selectedVariant,
            enableVariants: true,
          }),
          isOnSale: product.badge === 'sale',
          lowestAmount: range.lowestAmount,
          highestAmount: range.highestAmount,
          hasRange: false,
        }
      }

      return {
        amount: range.amount,
        isOnSale: product.badge === 'sale',
        lowestAmount: range.lowestAmount,
        highestAmount: range.highestAmount,
        hasRange: range.hasRange,
      }
    }

    return {
      amount: range.amount,
      isOnSale: product.badge === 'sale',
      lowestAmount: range.lowestAmount,
      highestAmount: range.highestAmount,
      hasRange: false,
    }
  }, [hasVariants, product, selectedVariant])
}
