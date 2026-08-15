'use client'

import type { Media as MediaType } from '@/payload-types'
import { Heart } from 'lucide-react'
import React, { useEffect, useTransition } from 'react'
import { useSearchParams } from 'next/navigation'

import { Media } from '@/components/Media'
import { useWishlist } from '@/providers/Wishlist'
import { cn } from '@/utilities/cn'

type GalleryItem = {
  image: MediaType
  variantOption?: unknown
  id?: string | null
}

type Props = {
  gallery: GalleryItem[]
  productId: string
  productTitle: string
}

export function ProductGallery({ gallery, productId, productTitle }: Props) {
  const searchParams = useSearchParams()
  const [current, setCurrent] = React.useState(0)
  const { isWishlisted, toggleWishlist } = useWishlist()
  const [isPending, startTransition] = useTransition()
  const wishlisted = isWishlisted(productId)

  useEffect(() => {
    const values = Array.from(searchParams.values())
    const index = gallery.findIndex((item) => {
      if (!item.variantOption) return false
      const variantID =
        typeof item.variantOption === 'object' &&
        item.variantOption &&
        'id' in item.variantOption
          ? (item.variantOption as { id: string | number }).id
          : item.variantOption
      return values.some((value) => value === String(variantID))
    })
    if (index !== -1) setCurrent(index)
  }, [searchParams, gallery])

  if (!gallery.length) {
    return (
      <div className="flex aspect-[4/5] w-full items-center justify-center rounded-lg bg-[var(--elixir-surface-container,#f0eded)] text-sm text-[var(--elixir-outline,#717878)]">
        No image available
      </div>
    )
  }

  const safeIndex = Math.min(current, gallery.length - 1)
  const active = gallery[safeIndex]

  return (
    <div className="relative w-full">
      <div className="relative aspect-[4/5] w-full overflow-hidden rounded-lg bg-[var(--elixir-surface-container-low,#f6f3f2)] md:aspect-[3/4]">
        {active?.image ? (
          <Media
            resource={active.image}
            fill
            priority
            imgClassName="object-cover"
            className="relative h-full w-full"
            size="(max-width: 1024px) 100vw, 50vw"
          />
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

      {gallery.length > 1 ? (
        <div
          className="mt-4 flex items-center justify-center gap-2"
          role="tablist"
          aria-label="Product images"
        >
          {gallery.map((item, index) => (
            <button
              key={`${item.image.id}-${index}`}
              type="button"
              role="tab"
              aria-selected={index === safeIndex}
              aria-label={`Show image ${index + 1}`}
              onClick={() => setCurrent(index)}
              className={cn(
                'h-2 w-2 rounded-full transition',
                index === safeIndex
                  ? 'bg-[var(--elixir-on-surface,#1c1b1b)]'
                  : 'bg-[var(--elixir-outline-variant,#c1c8c7)]',
              )}
            />
          ))}
        </div>
      ) : null}
    </div>
  )
}
