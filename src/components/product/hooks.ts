'use client'

import type { Product, Variant } from '@/payload-types'
import { useSearchParams } from 'next/navigation'
import { useMemo } from 'react'

export function useSelectedVariant(product: Product): Variant | undefined {
  const searchParams = useSearchParams()
  const variants = product.variants?.docs || []

  return useMemo(() => {
    if (!product.enableVariants || !variants.length) return undefined

    const variantId = searchParams.get('variant')
    const match = variants.find((variant) => {
      if (typeof variant === 'object') return String(variant.id) === variantId
      return String(variant) === variantId
    })

    return match && typeof match === 'object' ? match : undefined
  }, [product.enableVariants, searchParams, variants])
}

export function useProductPrice(product: Product): {
  amount: number | null
  compareAt: number | null
  isOnSale: boolean
  lowestAmount: number | null
  highestAmount: number | null
  hasRange: boolean
} {
  const selectedVariant = useSelectedVariant(product)
  const hasVariants = Boolean(product.enableVariants && product.variants?.docs?.length)

  return useMemo(() => {
    const compareAt =
      typeof product.compareAtPriceInUSD === 'number' ? product.compareAtPriceInUSD : null

    if (hasVariants) {
      const variants = (product.variants?.docs || []).filter(
        (variant): variant is Variant => typeof variant === 'object' && Boolean(variant),
      )

      const prices = variants
        .map((variant) => variant.priceInUSD)
        .filter((price): price is number => typeof price === 'number')

      const lowestAmount = prices.length ? Math.min(...prices) : null
      const highestAmount = prices.length ? Math.max(...prices) : null

      if (selectedVariant && typeof selectedVariant.priceInUSD === 'number') {
        const amount = selectedVariant.priceInUSD
        return {
          amount,
          compareAt: compareAt && compareAt > amount ? compareAt : null,
          isOnSale: Boolean(compareAt && compareAt > amount),
          lowestAmount,
          highestAmount,
          hasRange: false,
        }
      }

      return {
        amount: lowestAmount,
        compareAt: null,
        isOnSale: false,
        lowestAmount,
        highestAmount,
        hasRange: Boolean(
          lowestAmount !== null && highestAmount !== null && lowestAmount !== highestAmount,
        ),
      }
    }

    const amount = typeof product.priceInUSD === 'number' ? product.priceInUSD : null
    return {
      amount,
      compareAt: compareAt && amount !== null && compareAt > amount ? compareAt : null,
      isOnSale: Boolean(compareAt && amount !== null && compareAt > amount),
      lowestAmount: amount,
      highestAmount: amount,
      hasRange: false,
    }
  }, [hasVariants, product, selectedVariant])
}
