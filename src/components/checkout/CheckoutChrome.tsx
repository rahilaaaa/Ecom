'use client'

import { ChevronDown, ShoppingBag } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import React, { useMemo, useState } from 'react'
import { useCart } from '@payloadcms/plugin-ecommerce/client/react'

import { Price } from '@/components/Price'
import { getLineUnitPrice } from '@/lib/currency'
import {
  DEFAULT_SHIPPING_METHOD,
  getShippingDisplay,
  type ShippingMethodId,
} from '@/lib/checkout/shippingConfig'
import type { Media, Product } from '@/payload-types'
import { cn } from '@/utilities/cn'

const brandName = process.env.NEXT_PUBLIC_SITE_NAME || process.env.SITE_NAME || 'ELIXIR'

type Props = {
  /** Server-authoritative amounts (paise). Prefer these over cart.subtotal alone. */
  subtotal?: number
  discountAmount?: number
  shippingAmount?: number
  taxAmount?: number
  total?: number
  shippingMethodId?: ShippingMethodId
  taxImplemented?: boolean
}

export function CheckoutChrome({
  subtotal: subtotalProp,
  discountAmount = 0,
  shippingAmount,
  taxAmount = 0,
  total: totalProp,
  shippingMethodId = DEFAULT_SHIPPING_METHOD,
  taxImplemented = false,
}: Props) {
  const { cart } = useCart()
  const [open, setOpen] = useState(false)

  const totalQuantity = useMemo(() => {
    if (!cart?.items?.length) return 0
    return cart.items.reduce((sum, item) => sum + (item.quantity || 0), 0)
  }, [cart?.items])

  const cartSubtotal = typeof cart?.subtotal === 'number' ? cart.subtotal : 0
  const subtotal = typeof subtotalProp === 'number' ? subtotalProp : cartSubtotal
  const shipping =
    typeof shippingAmount === 'number'
      ? { label: shippingAmount === 0 ? 'Free' : 'Shipping', amount: shippingAmount }
      : getShippingDisplay(Math.max(0, subtotal - discountAmount), shippingMethodId)
  const total =
    typeof totalProp === 'number'
      ? totalProp
      : Math.max(0, subtotal - discountAmount + shipping.amount + (taxImplemented ? taxAmount : 0))

  return (
    <>
      <header className="border-b border-[var(--elixir-surface-container-highest,#e5e2e1)] bg-[var(--elixir-surface,#fcf9f8)]">
        <div className="relative mx-auto flex h-16 max-w-[960px] items-center justify-center px-5">
          <Link
            href="/"
            className="font-[family-name:var(--font-newsreader)] text-xl font-medium tracking-[0.08em] text-[var(--elixir-on-surface,#1c1b1b)]"
          >
            {brandName}
          </Link>
          <Link
            href="/cart"
            aria-label={totalQuantity ? `Cart, ${totalQuantity} items` : 'Cart'}
            className="absolute right-5 flex h-12 w-12 items-center justify-center text-[var(--elixir-on-surface,#1c1b1b)]"
          >
            <ShoppingBag className="h-5 w-5" strokeWidth={1.5} />
            {totalQuantity > 0 ? (
              <span className="absolute right-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#ba1a1a] px-1 text-[10px] font-semibold text-white">
                {totalQuantity > 99 ? '99+' : totalQuantity}
              </span>
            ) : null}
          </Link>
        </div>
      </header>

      <div className="border-b border-[var(--elixir-surface-container-highest,#e5e2e1)] bg-[var(--elixir-surface-container,#f0eded)]">
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          className="mx-auto flex w-full max-w-[960px] items-center justify-between gap-4 px-5 py-4 text-left"
          aria-expanded={open}
        >
          <span className="inline-flex items-center gap-2 text-sm text-[var(--elixir-on-surface,#1c1b1b)]">
            <ShoppingBag className="h-4 w-4" strokeWidth={1.5} />
            {open ? 'Hide order summary' : 'Show order summary'}
            <ChevronDown className={cn('h-4 w-4 transition', open && 'rotate-180')} />
          </span>
          <Price
            amount={total}
            as="span"
            className="font-[family-name:var(--font-newsreader)] text-lg font-medium"
          />
        </button>

        {open ? (
          <div className="mx-auto w-full max-w-[960px] border-t border-[var(--elixir-outline-variant,#c1c8c7)] px-5 py-5">
            <ul className="flex flex-col gap-4">
              {cart?.items?.map((item, index) => {
                const product = item.product
                if (typeof product !== 'object' || !product) return null

                const variant = item.variant
                const isVariant = Boolean(variant) && typeof variant === 'object'
                let image =
                  (typeof product.gallery?.[0]?.image === 'object'
                    ? product.gallery[0].image
                    : undefined) ||
                  (typeof product.meta?.image === 'object' ? product.meta.image : undefined)
                const price =
                  getLineUnitPrice({
                    product,
                    variant: isVariant && variant ? variant : null,
                    enableVariants: Boolean(product.enableVariants && isVariant),
                  }) ?? undefined

                if (isVariant && variant) {
                  const imageVariant = product.gallery?.find((galleryItem: { variantOption?: unknown; image?: unknown }) => {
                    if (!galleryItem.variantOption) return false
                    const optionId =
                      typeof galleryItem.variantOption === 'object' &&
                      galleryItem.variantOption &&
                      'id' in galleryItem.variantOption
                        ? (galleryItem.variantOption as { id: string | number }).id
                        : galleryItem.variantOption
                    return variant.options?.some((option: unknown) =>
                      typeof option === 'object' && option && 'id' in option
                        ? (option as { id: string | number }).id === optionId
                        : option === optionId,
                    )
                  })
                  if (imageVariant && typeof imageVariant.image === 'object') {
                    image = imageVariant.image as Media
                  }
                }

                const imageUrl =
                  image && typeof image === 'object' && image.url
                    ? image.url.startsWith('http')
                      ? image.url
                      : `${process.env.NEXT_PUBLIC_SERVER_URL}${image.url}`
                    : null

                return (
                  <li key={item.id || index} className="flex gap-3">
                    <div className="relative h-16 w-16 overflow-hidden rounded-md bg-[var(--elixir-surface-container-low,#f6f3f2)]">
                      {imageUrl ? (
                        <Image
                          src={imageUrl}
                          alt={(image as Media)?.alt || (product as Product).title}
                          fill
                          className="object-cover"
                          sizes="64px"
                        />
                      ) : null}
                      <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--elixir-on-surface,#1c1b1b)] px-1 text-[10px] text-white">
                        {item.quantity}
                      </span>
                    </div>
                    <div className="flex flex-1 items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium">{product.title}</p>
                        {isVariant && variant ? (
                          <p className="text-xs text-[var(--elixir-outline,#717878)]">
                            {variant.options
                              ?.map((option: unknown) =>
                                typeof option === 'object' && option && 'label' in option
                                  ? String((option as { label?: string }).label || '')
                                  : null,
                              )
                              .filter(Boolean)
                              .join(' · ')}
                          </p>
                        ) : null}
                      </div>
                      {typeof price === 'number' ? (
                        <Price amount={price * (item.quantity || 1)} as="span" className="text-sm" />
                      ) : null}
                    </div>
                  </li>
                )
              })}
            </ul>

            <dl className="mt-5 flex flex-col gap-2 border-t border-[var(--elixir-outline-variant,#c1c8c7)] pt-4 text-sm">
              <div className="flex justify-between">
                <dt className="text-[var(--elixir-outline,#717878)]">Subtotal</dt>
                <dd>
                  <Price amount={subtotal} as="span" />
                </dd>
              </div>
              {discountAmount > 0 ? (
                <div className="flex justify-between text-[#ba1a1a]">
                  <dt>Discount</dt>
                  <dd>
                    −
                    <Price amount={discountAmount} as="span" />
                  </dd>
                </div>
              ) : null}
              <div className="flex justify-between">
                <dt className="text-[var(--elixir-outline,#717878)]">Shipping</dt>
                <dd>
                  {shipping.amount === 0 ? (
                    'Free'
                  ) : (
                    <Price amount={shipping.amount} as="span" />
                  )}
                </dd>
              </div>
              {taxImplemented && taxAmount > 0 ? (
                <div className="flex justify-between">
                  <dt className="text-[var(--elixir-outline,#717878)]">Tax</dt>
                  <dd>
                    <Price amount={taxAmount} as="span" />
                  </dd>
                </div>
              ) : null}
              <div className="flex justify-between border-t border-[var(--elixir-outline-variant,#c1c8c7)] pt-3 text-base font-medium">
                <dt>Total</dt>
                <dd>
                  <Price amount={total} as="span" />
                </dd>
              </div>
            </dl>
          </div>
        ) : null}
      </div>
    </>
  )
}
