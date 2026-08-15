'use client'

import type { Product, Variant } from '@/payload-types'
import { useSearchParams } from 'next/navigation'
import { useMemo } from 'react'

import { findVariantForOptions } from '@/lib/product/variantGallery'
import { getLineUnitPrice, getUnitPrice } from '@/lib/currency'

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
    if (hasVariants) {
      const variants = (product.variants?.docs || []).filter(
        (variant): variant is Variant => typeof variant === 'object' && Boolean(variant),
      )

      const prices = variants
        .map((variant) => getUnitPrice(variant))
        .filter((price): price is number => typeof price === 'number')

      const lowestAmount = prices.length ? Math.min(...prices) : null
      const highestAmount = prices.length ? Math.max(...prices) : null

      if (selectedVariant) {
        const amount = getLineUnitPrice({
          product,
          variant: selectedVariant,
          enableVariants: true,
        })
        return {
          amount,
          isOnSale: product.badge === 'sale',
          lowestAmount,
          highestAmount,
          hasRange: false,
        }
      }

      return {
        amount: lowestAmount,
        isOnSale: product.badge === 'sale',
        lowestAmount,
        highestAmount,
        hasRange: Boolean(
          lowestAmount !== null && highestAmount !== null && lowestAmount !== highestAmount,
        ),
      }
    }

    const amount = getUnitPrice(product)
    return {
      amount,
      isOnSale: product.badge === 'sale',
      lowestAmount: amount,
      highestAmount: amount,
      hasRange: false,
    }
  }, [hasVariants, product, selectedVariant])
}
