'use client'

import type { Product } from '@/payload-types'
import { useCart } from '@payloadcms/plugin-ecommerce/client/react'
import { useRouter } from 'next/navigation'
import React, { useCallback, useMemo, useState } from 'react'
import { toast } from 'sonner'

import { useSelectedVariant } from '@/components/product/hooks'
import { cn } from '@/utilities/cn'

type Props = {
  product: Product
  className?: string
  sticky?: boolean
}

export function ProductPurchaseActions({ product, className, sticky = false }: Props) {
  const { addItem, cart, isLoading } = useCart()
  const selectedVariant = useSelectedVariant(product)
  const router = useRouter()
  const [pendingAction, setPendingAction] = useState<'cart' | 'buy' | null>(null)

  const disabled = useMemo(() => {
    const existingItem = cart?.items?.find((item) => {
      const productID = typeof item.product === 'object' ? item.product?.id : item.product
      const variantID = item.variant
        ? typeof item.variant === 'object'
          ? item.variant?.id
          : item.variant
        : undefined

      if (productID === product.id) {
        if (product.enableVariants) return variantID === selectedVariant?.id
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
  }, [cart?.items, product, selectedVariant])

  const needsVariant = Boolean(product.enableVariants && !selectedVariant)

  const addProduct = useCallback(async () => {
    if (needsVariant) {
      toast.error('Please select your options before continuing.')
      return false
    }

    if (disabled) {
      toast.error('This item is currently unavailable.')
      return false
    }

    try {
      await addItem({
        product: product.id,
        variant: selectedVariant?.id ?? undefined,
      })
      return true
    } catch {
      toast.error('Unable to update your cart. Please try again.')
      return false
    }
  }, [addItem, disabled, needsVariant, product.id, selectedVariant?.id])

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
        disabled={busy}
        aria-label="Add to cart"
        className="inline-flex min-h-12 items-center justify-center border border-[var(--elixir-on-surface,#1c1b1b)] bg-white px-4 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--elixir-on-surface,#1c1b1b)] transition hover:bg-[var(--elixir-surface-container-low,#f6f3f2)] disabled:cursor-not-allowed disabled:opacity-50"
      >
        {pendingAction === 'cart' ? 'Adding…' : 'Add to Cart'}
      </button>
      <button
        type="button"
        onClick={() => void onBuyNow()}
        disabled={busy}
        aria-label="Buy now"
        className="inline-flex min-h-12 items-center justify-center bg-[var(--elixir-primary-container,#0d2b2b)] px-4 text-xs font-semibold uppercase tracking-[0.12em] text-white transition hover:bg-[#164a4a] disabled:cursor-not-allowed disabled:opacity-50"
      >
        {pendingAction === 'buy' ? 'Loading…' : 'Buy Now'}
      </button>
    </div>
  )
}
