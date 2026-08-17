'use client'

import type { Product } from '@/payload-types'
import { ChevronLeft, ChevronRight, Heart } from 'lucide-react'
import React, { useEffect, useMemo, useTransition } from 'react'

import { Media } from '@/components/Media'
import { useProductPDP } from '@/components/product/ProductPDPProvider'
import { getMediaAlt, type ProductGalleryItem } from '@/lib/product/media'
import { filterGalleryByColor, getColorVariantType } from '@/lib/product/variantGallery'
import { useWishlist } from '@/providers/Wishlist'
import { cn } from '@/utilities/cn'

type Props = {
  gallery: ProductGalleryItem[]
  product: Product
  productId: string
  productTitle: string
}

export function ProductGallery({ gallery, product, productId, productTitle }: Props) {
  const pdp = useProductPDP()
  const [current, setCurrent] = React.useState(0)
  const { isWishlisted, toggleWishlist } = useWishlist()
  const [isPending, startTransition] = useTransition()
  const wishlisted = isWishlisted(productId)

  const colorType = useMemo(() => getColorVariantType(product), [product])
  const selectedColorId = colorType?.name ? pdp?.selectedOptions[colorType.name] ?? null : null

  const visibleGallery = useMemo(
    () => filterGalleryByColor(gallery, selectedColorId),
    [gallery, selectedColorId],
  )

  useEffect(() => {
    setCurrent(0)
  }, [selectedColorId])

  if (!visibleGallery.length) {
    return (
      <div className="flex aspect-[4/5] w-full items-center justify-center rounded-lg bg-[var(--elixir-surface-container,#f0eded)] text-sm text-[var(--elixir-outline,#717878)]">
        No image available
      </div>
    )
  }

  const safeIndex = Math.min(current, visibleGallery.length - 1)
  const active = visibleGallery[safeIndex]
  const activeAlt = getMediaAlt(
    active?.image,
    visibleGallery.length > 1 ? `${productTitle} image ${safeIndex + 1}` : productTitle,
  )
  const canNavigate = visibleGallery.length > 1

  const goTo = (index: number) => {
    const last = visibleGallery.length - 1
    if (index < 0) setCurrent(last)
    else if (index > last) setCurrent(0)
    else setCurrent(index)
  }

  const thumbnails = canNavigate
    ? visibleGallery.map((item, index) => {
        const thumbAlt = getMediaAlt(item.image, `${productTitle} thumbnail ${index + 1}`)
        return (
          <button
            key={`${item.image.id}-${item.id || index}`}
            type="button"
            role="tab"
            aria-selected={index === safeIndex}
            aria-label={thumbAlt}
            onClick={() => setCurrent(index)}
            className={cn(
              'relative h-20 w-16 shrink-0 overflow-hidden rounded-md border transition md:h-24 md:w-20 lg:h-20 lg:w-16',
              index === safeIndex
                ? 'border-[var(--elixir-on-surface,#1c1b1b)]'
                : 'border-transparent opacity-70 hover:opacity-100',
            )}
          >
            {item.image?.url || item.image?.filename ? (
              <Media
                resource={item.image}
                alt={thumbAlt}
                fill
                imgClassName="object-cover"
                className="relative h-full w-full"
                size="80px"
              />
            ) : null}
          </button>
        )
      })
    : null

  return (
    <div className="relative flex w-full flex-col-reverse gap-4 lg:flex-row lg:items-start">
      {canNavigate ? (
        <div
          className="flex gap-3 overflow-x-auto pb-1 lg:max-h-[36rem] lg:w-20 lg:shrink-0 lg:flex-col lg:overflow-x-hidden lg:overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          role="tablist"
          aria-label="Product images"
        >
          {thumbnails}
        </div>
      ) : null}

      <div
        className="relative min-w-0 flex-1 overflow-hidden rounded-lg bg-[var(--elixir-surface-container-low,#f6f3f2)] aspect-[4/5] md:aspect-[3/4]"
        onKeyDown={(event) => {
          if (!canNavigate) return
          if (event.key === 'ArrowLeft') {
            event.preventDefault()
            goTo(safeIndex - 1)
          }
          if (event.key === 'ArrowRight') {
            event.preventDefault()
            goTo(safeIndex + 1)
          }
        }}
        tabIndex={canNavigate ? 0 : undefined}
        aria-label={activeAlt}
      >
        {active?.image && (active.image.url || active.image.filename) ? (
          <Media
            resource={active.image}
            alt={activeAlt}
            fill
            priority
            imgClassName="object-cover"
            className="relative h-full w-full"
            size="(max-width: 1024px) 100vw, 50vw"
          />
        ) : null}

        {canNavigate ? (
          <>
            <button
              type="button"
              aria-label="Previous image"
              onClick={() => goTo(safeIndex - 1)}
              className="absolute left-3 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-[var(--elixir-on-surface,#1c1b1b)] shadow-[0_8px_24px_rgba(28,27,27,0.08)] transition hover:bg-white"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              aria-label="Next image"
              onClick={() => goTo(safeIndex + 1)}
              className="absolute right-3 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-[var(--elixir-on-surface,#1c1b1b)] shadow-[0_8px_24px_rgba(28,27,27,0.08)] transition hover:bg-white"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </>
        ) : null}

        <button
          type="button"
          disabled={isPending}
          onClick={() => startTransition(() => void toggleWishlist(productId))}
          aria-label={
            wishlisted ? `Remove ${productTitle} from wishlist` : `Add ${productTitle} to wishlist`
          }
          aria-pressed={wishlisted}
          className="absolute right-4 top-4 z-10 flex h-12 w-12 items-center justify-center rounded-full bg-white text-[var(--elixir-on-surface,#1c1b1b)] shadow-[0_8px_24px_rgba(28,27,27,0.08)] transition hover:scale-105"
        >
          <Heart
            className={cn('h-4 w-4', wishlisted && 'fill-[#ba1a1a] text-[#ba1a1a]')}
            strokeWidth={1.5}
          />
        </button>
      </div>
    </div>
  )
}
