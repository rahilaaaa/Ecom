'use client'

import { ChevronDown, ShoppingBag } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import React, { useMemo, useState } from 'react'
import { useCart } from '@payloadcms/plugin-ecommerce/client/react'

import { Price } from '@/components/Price'
import type { Media, Product } from '@/payload-types'
import { cn } from '@/utilities/cn'
import { getShippingDisplay } from '@/lib/cart/shipping'

const brandName = process.env.NEXT_PUBLIC_SITE_NAME || process.env.SITE_NAME || 'ELIXIR'

type Props = {
  discountAmount?: number
}

export function CheckoutChrome({ discountAmount = 0 }: Props) {
  const { cart } = useCart()
  const [open, setOpen] = useState(false)

  const totalQuantity = useMemo(() => {
    if (!cart?.items?.length) return 0
    return cart.items.reduce((sum, item) => sum + (item.quantity || 0), 0)
  }, [cart?.items])

  const subtotal = typeof cart?.subtotal === 'number' ? cart.subtotal : 0
  const shipping = getShippingDisplay(subtotal)
  const total = Math.max(0, subtotal - discountAmount)

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
                let price = product.priceInUSD

                if (isVariant && variant) {
                  price = variant.priceInUSD
                  const imageVariant = product.gallery?.find((galleryItem) => {
                    if (!galleryItem.variantOption) return false
                    const optionId =
                      typeof galleryItem.variantOption === 'object'
                        ? galleryItem.variantOption.id
                        : galleryItem.variantOption
                    return variant.options?.some((option) =>
                      typeof option === 'object' ? option.id === optionId : option === optionId,
                    )
                  })
                  if (imageVariant && typeof imageVariant.image === 'object') {
                    image = imageVariant.image
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
                              ?.map((option) =>
                                typeof option === 'object' ? option.label : null,
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
              <div className="flex justify-between">
                <dt className="text-[var(--elixir-outline,#717878)]">Shipping</dt>
                <dd>{shipping.amount === 0 ? 'Free' : shipping.label}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-[var(--elixir-outline,#717878)]">Tax</dt>
                <dd>Calculated at checkout</dd>
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
