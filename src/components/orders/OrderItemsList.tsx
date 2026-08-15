import Link from 'next/link'
import React from 'react'

import { Media } from '@/components/Media'
import { Price } from '@/components/Price'
import { getLineUnitPrice } from '@/lib/currency'
import type { Media as MediaType, Order, Product, Variant } from '@/payload-types'
import { cn } from '@/utilities/cn'

type OrderItem = NonNullable<Order['items']>[number]

type Props = {
  items: NonNullable<Order['items']>
  currency?: Order['currency']
  className?: string
}

function resolveImage(product: Product | null, variant: Variant | null): MediaType | null {
  if (!product) return null

  if (variant) {
    const match = product.gallery?.find((entry) => {
      if (!entry.variantOption) return false
      const optionID =
        typeof entry.variantOption === 'object' ? entry.variantOption.id : entry.variantOption
      return variant.options?.some((option) =>
        typeof option === 'object' ? option.id === optionID : option === optionID,
      )
    })
    if (match?.image && typeof match.image === 'object') return match.image
  }

  const gallery = product.gallery?.[0]?.image
  if (gallery && typeof gallery === 'object') return gallery

  const meta = product.meta?.image
  if (meta && typeof meta === 'object') return meta

  return null
}

function lineUnitPrice(item: OrderItem, product: Product | null, variant: Variant | null): number | null {
  if (typeof item.unitPrice === 'number') return item.unitPrice
  return getLineUnitPrice({
    product,
    variant,
    enableVariants: Boolean(product?.enableVariants && variant),
  })
}

export function OrderItemsList({ items, currency, className }: Props) {
  return (
    <section className={cn('', className)} aria-labelledby="order-items-heading">
      <h2
        id="order-items-heading"
        className="mb-5 font-[family-name:var(--font-newsreader)] text-xl font-medium text-[var(--elixir-on-surface,#1c1b1b)]"
      >
        Items
      </h2>

      <ul className="flex flex-col gap-5">
        {items.map((item, index) => {
          const product =
            item.product && typeof item.product === 'object' ? (item.product as Product) : null
          const variant =
            item.variant && typeof item.variant === 'object' ? (item.variant as Variant) : null
          const snapshotTitle = item.productTitle
          const snapshotVariant = item.variantLabel
          const title = snapshotTitle || product?.title || 'Item unavailable'
          const variantLabel =
            snapshotVariant ||
            variant?.options
              ?.map((option) => (typeof option === 'object' ? option.label : null))
              .filter(Boolean)
              .join(' · ') ||
            null
          const image = resolveImage(product, variant)
          const unit = lineUnitPrice(item, product, variant)
          const lineTotal =
            typeof unit === 'number' && typeof item.quantity === 'number'
              ? unit * item.quantity
              : null
          const href = product?.slug
            ? `/products/${product.slug}${variant ? `?variant=${variant.id}` : ''}`
            : null

          return (
            <li key={item.id || index} className="flex gap-4">
              <div className="relative h-20 w-16 shrink-0 overflow-hidden rounded-md bg-[var(--elixir-surface-container,#f0eded)] sm:h-24 sm:w-20">
                {image ? (
                  <Media
                    resource={image}
                    fill
                    imgClassName="object-cover"
                    className="relative h-full w-full"
                    size="80px"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-[10px] uppercase tracking-wider text-[var(--elixir-outline,#717878)]">
                    No image
                  </div>
                )}
              </div>

              <div className="flex min-w-0 flex-1 items-start justify-between gap-3">
                <div className="min-w-0">
                  {href ? (
                    <Link
                      href={href}
                      className="text-sm font-semibold text-[var(--elixir-on-surface,#1c1b1b)] hover:underline"
                    >
                      {title}
                    </Link>
                  ) : (
                    <p className="text-sm font-semibold text-[var(--elixir-on-surface,#1c1b1b)]">
                      {title}
                    </p>
                  )}
                  {variantLabel ? (
                    <p className="mt-1 text-sm text-[var(--elixir-on-surface-variant,#414848)]">
                      {variantLabel}
                    </p>
                  ) : null}
                  <p className="mt-1 text-sm text-[var(--elixir-on-surface-variant,#414848)]">
                    Qty: {item.quantity}
                  </p>
                </div>

                {typeof lineTotal === 'number' ? (
                  <Price
                    className="shrink-0 text-sm font-medium text-[var(--elixir-on-surface,#1c1b1b)]"
                    amount={lineTotal}
                    currencyCode={currency ?? undefined}
                  />
                ) : null}
              </div>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
