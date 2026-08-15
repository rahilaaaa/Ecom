'use client'

import { useCart } from '@payloadcms/plugin-ecommerce/client/react'
import { useRouter } from 'next/navigation'
import React, { useState } from 'react'
import { toast } from 'sonner'

import type { AccountOrderPreview } from '@/lib/account/orderPreview'
import { cn } from '@/utilities/cn'

type Props = {
  buyAgain: NonNullable<AccountOrderPreview['buyAgain']>
  className?: string
}

export function BuyAgainButton({ buyAgain, className }: Props) {
  const { addItem, isLoading } = useCart()
  const router = useRouter()
  const [pending, setPending] = useState(false)

  const onClick = async () => {
    if (buyAgain.enableVariants && !buyAgain.variantId) {
      if (buyAgain.productSlug) {
        toast.message('Choose options to buy again.')
        router.push(`/products/${buyAgain.productSlug}`)
        return
      }
      toast.error('This product needs options before it can be added.')
      return
    }

    setPending(true)
    try {
      await addItem({
        product: buyAgain.productId,
        variant: buyAgain.variantId,
      })
      toast.success('Added to cart.')
      router.push('/cart')
    } catch {
      toast.error('Unable to add this item. It may be unavailable.')
    } finally {
      setPending(false)
    }
  }

  return (
    <button
      type="button"
      onClick={() => void onClick()}
      disabled={pending || isLoading}
      className={cn(
        'text-sm underline underline-offset-4 decoration-[var(--elixir-on-surface-variant,#414848)] text-[var(--elixir-on-surface,#1c1b1b)] disabled:opacity-50',
        className,
      )}
    >
      {pending ? 'Adding…' : 'Buy Again'}
    </button>
  )
}
