'use client'

import type { CartItem } from '@/components/Cart'
import type { Media, Product } from '@/payload-types'
import { XIcon } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import React, { useTransition } from 'react'
import { toast } from 'sonner'

import { EditItemQuantityButton } from '@/components/Cart/EditItemQuantityButton'
import { Price } from '@/components/Price'
import { getLineUnitPrice } from '@/lib/currency'
import { useCart } from '@payloadcms/plugin-ecommerce/client/react'
import { useWishlist } from '@/providers/Wishlist'
import { cn } from '@/utilities/cn'

function resolveItemVisual(item: CartItem): {
  product: Product
  image?: Media
  price?: number
  variantLabel?: string
} | null {
  const product = item.product
  if (typeof product !== 'object' || !product || !product.slug) return null

  const variant = item.variant
  const isVariant = Boolean(variant) && typeof variant === 'object'

  const metaImage =
    product.meta?.image && typeof product.meta.image === 'object' ? product.meta.image : undefined
  const firstGalleryImage =
    typeof product.gallery?.[0]?.image === 'object' ? product.gallery[0].image : undefined

  let image = firstGalleryImage || metaImage
  const price =
    getLineUnitPrice({
      product,
      variant: isVariant && variant ? variant : null,
      enableVariants: Boolean(product.enableVariants && isVariant),
    }) ?? undefined
  let variantLabel: string | undefined

  if (isVariant && variant) {
    variantLabel = variant.options
      ?.map((option) => {
        if (typeof option === 'object' && option) {
          const typeName =
            typeof option.variantType === 'object' && option.variantType
              ? option.variantType.label || option.variantType.name
              : null
          return typeName ? `${typeName}: ${option.label}` : option.label
        }
        return null
      })
      .filter(Boolean)
      .join(' · ')

    const imageVariant = product.gallery?.find((galleryItem) => {
      if (!galleryItem.variantOption) return false
      const variantOptionID =
        typeof galleryItem.variantOption === 'object'
          ? galleryItem.variantOption.id
          : galleryItem.variantOption

      return variant.options?.some((option) => {
        if (typeof option === 'object') return option.id === variantOptionID
        return option === variantOptionID
      })
    })

    if (imageVariant && typeof imageVariant.image === 'object') {
      image = imageVariant.image
    }
  }

  return { product, image, price, variantLabel }
}

type Props = {
  item: CartItem
}

export function CartLineItem({ item }: Props) {
  const resolved = resolveItemVisual(item)
  const { removeItem, isLoading } = useCart()
  const { toggleWishlist } = useWishlist()
  const [isPending, startTransition] = useTransition()

  if (!resolved) return null

  const { product, image, price, variantLabel } = resolved
  const imageUrl = image?.url
    ? image.url.startsWith('http')
      ? image.url
      : `${process.env.NEXT_PUBLIC_SERVER_URL}${image.url}`
    : null

  const onRemove = () => {
    if (!item.id) return
    startTransition(async () => {
      await removeItem(item.id!)
      toast.success('Item removed from cart.')
    })
  }

  const onSaveForLater = () => {
    if (!item.id) return
    startTransition(async () => {
      await toggleWishlist(String(product.id))
      await removeItem(item.id!)
      toast.success('Saved for later in your wishlist.')
    })
  }

  return (
    <article className="flex flex-col gap-5 border-b border-[var(--elixir-surface-container-highest,#e5e2e1)] py-8 first:pt-0">
      <Link
        href={`/products/${product.slug}`}
        className="relative mx-auto aspect-square w-full max-w-[280px] overflow-hidden rounded-lg bg-[var(--elixir-surface-container-low,#f6f3f2)] md:mx-0 md:max-w-[220px]"
      >
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={image?.alt || product.title}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 80vw, 220px"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-sm text-[var(--elixir-outline,#717878)]">
            No image
          </div>
        )}
      </Link>

      <div className="flex flex-col gap-4">
        <div className="flex items-start justify-between gap-4">
          <Link
            href={`/products/${product.slug}`}
            className="font-[family-name:var(--font-newsreader)] text-xl font-medium text-[var(--elixir-on-surface,#1c1b1b)]"
          >
            {product.title}
          </Link>
          <button
            type="button"
            aria-label={`Remove ${product.title}`}
            disabled={!item.id || isLoading || isPending}
            onClick={onRemove}
            className="flex h-10 w-10 shrink-0 items-center justify-center text-[var(--elixir-on-surface,#1c1b1b)] transition hover:opacity-60 disabled:opacity-40"
          >
            <XIcon className="h-4 w-4" strokeWidth={1.5} />
          </button>
        </div>

        {variantLabel ? (
          <p className="text-sm text-[var(--elixir-outline,#717878)]">{variantLabel}</p>
        ) : null}

        {typeof price === 'number' ? (
          <Price
            amount={price}
            as="span"
            className="font-[family-name:var(--font-inter)] text-base text-[var(--elixir-on-surface,#1c1b1b)]"
          />
        ) : null}

        <div className="flex items-center justify-between gap-4">
          <div className="inline-flex h-12 items-center rounded-md border border-[var(--elixir-outline-variant,#c1c8c7)]">
            <EditItemQuantityButton item={item} type="minus" />
            <span className="min-w-10 text-center text-sm tabular-nums">{item.quantity}</span>
            <EditItemQuantityButton item={item} type="plus" />
          </div>

          <button
            type="button"
            disabled={!item.id || isLoading || isPending}
            onClick={onSaveForLater}
            className={cn(
              'text-sm text-[var(--elixir-on-surface,#1c1b1b)] underline underline-offset-4 transition hover:opacity-70 disabled:opacity-40',
            )}
          >
            Save for Later
          </button>
        </div>
      </div>
    </article>
  )
}
