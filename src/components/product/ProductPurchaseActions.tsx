'use client'

import type { Product } from '@/payload-types'
import { useCart } from '@payloadcms/plugin-ecommerce/client/react'
import { useRouter } from 'next/navigation'
import React, { useCallback, useMemo, useState } from 'react'
import { toast } from 'sonner'

import { useSelectedVariant } from '@/components/product/hooks'
import { useProductQuantity } from '@/components/product/ProductPDPProvider'
import { cartQuantityForSelection, getCartItemPayload, validatePurchase } from '@/lib/product/purchase'
import { cn } from '@/utilities/cn'

type Props = {
  product: Product
  className?: string
  sticky?: boolean
}

export function ProductPurchaseActions({ product, className, sticky = false }: Props) {
  const { addItem, cart, isLoading } = useCart()
  const selectedVariant = useSelectedVariant(product)
  const { quantity } = useProductQuantity()
  const router = useRouter()
  const [pendingAction, setPendingAction] = useState<'cart' | 'buy' | null>(null)

  const cartQuantity = useMemo(
    () =>
      cartQuantityForSelection({
        product,
        selectedVariant,
        cartItems: cart?.items,
      }),
    [cart?.items, product, selectedVariant],
  )

  const validation = useMemo(
    () =>
      validatePurchase({
        product,
        selectedVariant,
        quantity,
        cartQuantity,
      }),
    [cartQuantity, product, quantity, selectedVariant],
  )

  const addProduct = useCallback(async () => {
    const nextValidation = validatePurchase({
      product,
      selectedVariant,
      quantity,
      cartQuantity,
    })

    if (!nextValidation.ok) {
      toast.error(nextValidation.message)
      return false
    }

    try {
      const item = getCartItemPayload({ product, selectedVariant })

      for (let added = 0; added < quantity; added += 1) {
        await addItem(item)
      }
      return true
    } catch {
      toast.error('Unable to update your cart. Please try again.')
      return false
    }
  }, [addItem, cartQuantity, product, quantity, selectedVariant])

  const onAddToCart = async () => {
    setPendingAction('cart')
    const ok = await addProduct()
    setPendingAction(null)
    if (ok) toast.success('Item added to cart.')
  }

  const onBuyNow = async () => {
    setPendingAction('buy')
    const ok = await addProduct()
    setPendingAction(null)
    if (ok) router.push('/checkout')
  }

  const busy = isLoading || pendingAction !== null
  const purchaseBlocked = !validation.ok && validation.reason !== 'needs-options'

  return (
    <div
      className={cn(
        'grid grid-cols-2 gap-3',
        sticky &&
          'border-t border-[var(--elixir-surface-container-highest,#e5e2e1)] bg-[var(--elixir-surface,#fcf9f8)]/95 px-5 py-3 backdrop-blur-sm pb-[max(0.75rem,env(safe-area-inset-bottom))]',
        className,
      )}
    >
      <button
        type="button"
        onClick={() => void onAddToCart()}
        disabled={busy || purchaseBlocked}
        aria-label="Add to cart"
        className="inline-flex min-h-12 items-center justify-center border border-[var(--elixir-on-surface,#1c1b1b)] bg-white px-4 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--elixir-on-surface,#1c1b1b)] transition hover:bg-[var(--elixir-surface-container-low,#f6f3f2)] disabled:cursor-not-allowed disabled:opacity-50"
      >
        {pendingAction === 'cart' ? 'Adding…' : 'Add to Cart'}
      </button>
      <button
        type="button"
        onClick={() => void onBuyNow()}
        disabled={busy || purchaseBlocked}
        aria-label="Buy now"
        className="inline-flex min-h-12 items-center justify-center bg-[var(--elixir-primary-container,#0d2b2b)] px-4 text-xs font-semibold uppercase tracking-[0.12em] text-white transition hover:bg-[#164a4a] disabled:cursor-not-allowed disabled:opacity-50"
      >
        {pendingAction === 'buy' ? 'Loading…' : 'Buy Now'}
      </button>
    </div>
  )
}
