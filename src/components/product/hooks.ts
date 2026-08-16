'use client'

import type { Product, Variant } from '@/payload-types'
import { useSearchParams } from 'next/navigation'
import { useMemo } from 'react'

import { findVariantForOptions } from '@/lib/product/variantGallery'
import { getEffectivePrice, getEffectivePriceRange } from '@/lib/currency'

export function useSelectedVariant(product: Product): Variant | undefined {
  const searchParams = useSearchParams()
  const variants = product.variants?.docs || []

  return useMemo(() => {
    if (!product.enableVariants || !variants.length) return undefined

    const variantId = searchParams.get('variant')
    if (variantId) {
      const match = variants.find((variant) => {
        if (typeof variant === 'object') return String(variant.id) === variantId
        return String(variant) === variantId
      })
      if (match && typeof match === 'object') return match
    }

    const selectedIds: string[] = []
    for (const type of product.variantTypes || []) {
      if (typeof type !== 'object' || !type?.name) continue
      const value = searchParams.get(type.name)
      if (value) selectedIds.push(value)
    }

    if (!selectedIds.length) return undefined

    return findVariantForOptions(product, selectedIds)
  }, [product, searchParams, variants])
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
