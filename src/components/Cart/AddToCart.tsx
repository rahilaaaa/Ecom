'use client'

import { Button } from '@/components/ui/button'
import type { Product } from '@/payload-types'
import { useCart } from '@payloadcms/plugin-ecommerce/client/react'
import clsx from 'clsx'
import React, { useCallback, useMemo } from 'react'
import { toast } from 'sonner'

import { useSelectedVariant } from '@/components/product/hooks'
import { cartQuantityForSelection, getCartItemPayload, validatePurchase } from '@/lib/product/purchase'

type Props = {
  product: Product
  className?: string
}

export function AddToCart({ product, className }: Props) {
  const { addItem, cart, isLoading } = useCart()
  const selectedVariant = useSelectedVariant(product)

  const cartQuantity = useMemo(
    () =>
      cartQuantityForSelection({
        product,
        selectedVariant,
        cartItems: cart?.items,
      }),
    [cart?.items, product, selectedVariant],
  )

  const addToCart = useCallback(
    (e: React.FormEvent<HTMLButtonElement>) => {
      e.preventDefault()

      const validation = validatePurchase({
        product,
        selectedVariant,
        quantity: 1,
        cartQuantity,
      })

      if (!validation.ok) {
        toast.error(validation.message)
        return
      }

      addItem(getCartItemPayload({ product, selectedVariant })).then(() => {
        toast.success('Item added to cart.')
      })
    },
    [addItem, cartQuantity, product, selectedVariant],
  )

  const disabled = useMemo(
    () =>
      !validatePurchase({
        product,
        selectedVariant,
        quantity: 1,
        cartQuantity,
      }).ok,
    [cartQuantity, product, selectedVariant],
  )

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
