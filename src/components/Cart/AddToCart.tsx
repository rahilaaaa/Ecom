'use client'

import { Button } from '@/components/ui/button'
import type { Product } from '@/payload-types'
import { useCart } from '@payloadcms/plugin-ecommerce/client/react'
import clsx from 'clsx'
import React, { useCallback, useMemo } from 'react'
import { toast } from 'sonner'

import { useSelectedVariant } from '@/components/product/hooks'

type Props = {
  product: Product
  className?: string
}

export function AddToCart({ product, className }: Props) {
  const { addItem, cart, isLoading } = useCart()
  const selectedVariant = useSelectedVariant(product)

  const addToCart = useCallback(
    (e: React.FormEvent<HTMLButtonElement>) => {
      e.preventDefault()

      if (product.enableVariants && !selectedVariant) {
        toast.error('Please select your options before continuing.')
        return
      }

      addItem({
        product: product.id,
        variant: selectedVariant?.id ?? undefined,
      }).then(() => {
        toast.success('Item added to cart.')
      })
    },
    [addItem, product, selectedVariant],
  )

  const disabled = useMemo<boolean>(() => {
    const existingItem = cart?.items?.find((item) => {
      const productID = typeof item.product === 'object' ? item.product?.id : item.product
      const variantID = item.variant
        ? typeof item.variant === 'object'
          ? item.variant?.id
          : item.variant
        : undefined

      if (productID === product.id) {
        if (product.enableVariants) {
          return variantID === selectedVariant?.id
        }
        return true
      }
      return false
    })

    if (existingItem) {
      const existingQuantity = existingItem.quantity || 0
      if (product.enableVariants) {
        return existingQuantity >= (selectedVariant?.inventory || 0)
      }
      return existingQuantity >= (product.inventory || 0)
    }

    if (product.enableVariants) {
      if (!selectedVariant) return true
      if (!selectedVariant.inventory || selectedVariant.inventory <= 0) return true
    } else if (!product.inventory || product.inventory <= 0) {
      return true
    }

    return false
  }, [selectedVariant, cart?.items, product])

  return (
    <Button
      aria-label="Add to cart"
      variant="outline"
      className={clsx(className, {
        'hover:opacity-90': true,
      })}
      disabled={disabled || isLoading}
      onClick={addToCart}
      type="submit"
    >
      Add To Cart
    </Button>
  )
}
