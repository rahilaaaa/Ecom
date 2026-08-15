'use client'

import { useCart } from '@payloadcms/plugin-ecommerce/client/react'
import { Heart, X } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import React, { useTransition } from 'react'
import { toast } from 'sonner'

import { Media } from '@/components/Media'
import { Price } from '@/components/Price'
import type { ProductCardData } from '@/lib/shop/productCard'
import { useWishlist } from '@/providers/Wishlist'
import { cn } from '@/utilities/cn'

type Props = {
  product: ProductCardData
  className?: string
  /**
   * `grid` — shop listing
   * `editorial` — homepage best-sellers
   * `wishlist` — account wishlist (X remove, category, add to bag)
   */
  layout?: 'grid' | 'editorial' | 'wishlist'
  onRemoved?: () => void
}

export function ProductCard({ product, className, layout = 'grid', onRemoved }: Props) {
  const { isWishlisted, toggleWishlist } = useWishlist()
  const { addItem, isLoading: cartLoading } = useCart()
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const wishlisted = isWishlisted(product.id)
  const isWishlistLayout = layout === 'wishlist'

  const handleWishlist = (event: React.MouseEvent) => {
    event.preventDefault()
    event.stopPropagation()
    startTransition(() => {
      void (async () => {
        try {
          await toggleWishlist(product.id)
          if (isWishlistLayout) {
            toast.success(`Removed ${product.title}`)
            onRemoved?.()
          }
        } catch {
          toast.error('Unable to update your wishlist.')
        }
      })()
    })
  }

  const handleAddToBag = (event: React.MouseEvent) => {
    event.preventDefault()
    event.stopPropagation()

    if (product.inStock === false) {
      toast.error('This item is currently out of stock.')
      return
    }

    if (product.enableVariants) {
      toast.message('Choose your options on the product page.')
      router.push(product.href)
      return
    }

    startTransition(() => {
      void (async () => {
        try {
          await addItem({ product: Number(product.id) })
          toast.success('Added to bag.')
        } catch {
          toast.error('Unable to add this item. Please try again.')
        }
      })()
    })
  }

  return (
    <article className={cn('group flex flex-col gap-3', className)}>
      <div className="relative overflow-hidden rounded-lg bg-[var(--elixir-surface-container-low,#f6f3f2)]">
        <Link
          href={product.href}
          className={cn(
            'relative block w-full',
            layout === 'editorial' ? 'aspect-[4/5] md:aspect-[3/4]' : 'aspect-[3/4]',
          )}
          aria-label={`View ${product.title}`}
        >
          {product.image ? (
            <Media
              resource={product.image}
              fill
              imgClassName="object-cover transition duration-500 group-hover:scale-[1.02]"
              className="relative h-full w-full"
              size="(max-width: 768px) 90vw, (max-width: 1200px) 40vw, 25vw"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-[var(--elixir-surface-container,#f0eded)] text-sm text-[var(--elixir-on-surface-variant,#414848)]">
              No image
            </div>
          )}
        </Link>

        {layout === 'grid' && product.badge && product.badge !== 'none' ? (
          <span
            className={cn(
              'pointer-events-none absolute left-3 top-3 z-10 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.1em]',
              product.badge === 'sale'
                ? 'bg-[#f3d6d6] text-[#5c2b2b]'
                : 'bg-[var(--elixir-primary,#001515)] text-white',
            )}
          >
            {product.badge === 'sale' ? 'Sale' : 'New'}
          </span>
        ) : null}

        {isWishlistLayout && product.inStock === false ? (
          <span className="pointer-events-none absolute left-3 top-3 z-10 bg-[var(--elixir-surface,#fcf9f8)]/95 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--elixir-on-surface,#1c1b1b)]">
            Out of stock
          </span>
        ) : null}

        <button
          type="button"
          onClick={handleWishlist}
          disabled={isPending}
          aria-label={
            isWishlistLayout || wishlisted
              ? `Remove ${product.title} from wishlist`
              : `Add ${product.title} to wishlist`
          }
          aria-pressed={isWishlistLayout ? true : wishlisted}
          className="absolute right-3 top-3 z-10 flex h-12 w-12 items-center justify-center rounded-full bg-white text-[var(--elixir-on-surface,#1c1b1b)] shadow-[0_8px_24px_rgba(28,27,27,0.06)] transition hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--elixir-primary-container,#0d2b2b)] disabled:opacity-50"
        >
          {isWishlistLayout ? (
            <X className="h-4 w-4" strokeWidth={1.5} />
          ) : (
            <Heart
              className={cn('h-4 w-4', wishlisted && 'fill-[#ba1a1a] text-[#ba1a1a]')}
              strokeWidth={1.5}
            />
          )}
        </button>
      </div>

      {layout === 'editorial' ? (
        <div className="flex flex-col gap-1 px-0.5">
          <div className="flex items-start justify-between gap-4">
            <Link
              href={product.href}
              className="font-[family-name:var(--font-newsreader)] text-base font-medium leading-snug text-[var(--elixir-on-surface,#1c1b1b)] md:text-lg"
            >
              {product.title}
            </Link>
            {typeof product.price === 'number' ? (
              <Price
                amount={product.price}
                as="span"
                className="shrink-0 font-[family-name:var(--font-inter)] text-sm text-[var(--elixir-on-surface,#1c1b1b)] md:text-base"
              />
            ) : null}
          </div>
          {product.subtitle ? (
            <p className="text-sm text-[var(--elixir-outline,#717878)]">{product.subtitle}</p>
          ) : null}
        </div>
      ) : isWishlistLayout ? (
        <div className="flex flex-col gap-1 px-0.5">
          {product.category ? (
            <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-[var(--elixir-outline,#717878)]">
              {product.category}
            </p>
          ) : null}
          <Link
            href={product.href}
            className="font-[family-name:var(--font-newsreader)] text-lg font-medium leading-snug text-[var(--elixir-on-surface,#1c1b1b)]"
          >
            {product.title}
          </Link>
          {typeof product.price === 'number' ? (
            <Price
              amount={product.price}
              as="p"
              className={cn(
                'font-[family-name:var(--font-inter)] text-sm',
                product.isOnSale ? 'text-[#ba1a1a]' : 'text-[var(--elixir-on-surface,#1c1b1b)]',
              )}
            />
          ) : null}
          <button
            type="button"
            onClick={handleAddToBag}
            disabled={isPending || cartLoading || product.inStock === false}
            className="mt-2 self-start text-xs font-medium uppercase tracking-[0.12em] text-[var(--elixir-on-surface,#1c1b1b)] underline underline-offset-4 disabled:cursor-not-allowed disabled:opacity-40 disabled:no-underline"
          >
            {product.inStock === false
              ? 'Out of stock'
              : product.enableVariants
                ? 'Select options'
                : 'Add to bag'}
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-1 px-0.5">
          <div className="flex items-start justify-between gap-2">
            <Link
              href={product.href}
              className="font-[family-name:var(--font-newsreader)] text-[15px] font-medium leading-snug text-[var(--elixir-on-surface,#1c1b1b)] line-clamp-2 md:text-base"
            >
              {product.title}
            </Link>

            {typeof product.rating === 'number' ? (
              <span className="inline-flex shrink-0 items-center gap-1 pt-0.5 text-xs text-[var(--elixir-on-surface-variant,#414848)]">
                <span aria-hidden className="text-[#c47a3a]">
                  ★
                </span>
                <span>{product.rating.toFixed(1)}</span>
              </span>
            ) : null}
          </div>

          <div className="flex flex-wrap items-baseline gap-2">
            {typeof product.price === 'number' ? (
              <Price
                amount={product.price}
                as="span"
                className={cn(
                  'font-[family-name:var(--font-inter)] text-sm',
                  product.isOnSale
                    ? 'font-medium text-[#ba1a1a]'
                    : 'text-[var(--elixir-on-surface,#1c1b1b)]',
                )}
              />
            ) : null}
            {product.isOnSale && typeof product.compareAtPrice === 'number' ? (
              <Price
                amount={product.compareAtPrice}
                as="span"
                className="font-[family-name:var(--font-inter)] text-sm text-[var(--elixir-outline,#717878)] line-through"
              />
            ) : null}
          </div>
        </div>
      )}
    </article>
  )
}
