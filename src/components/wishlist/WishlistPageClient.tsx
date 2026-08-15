'use client'

import { Share, X } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import React, { useMemo, useState, useTransition } from 'react'
import { toast } from 'sonner'

import { ProductCard } from '@/components/shop/ProductCard'
import type { ProductCardData } from '@/lib/shop/productCard'
import type { WishlistUnavailableItem } from '@/lib/wishlist/getWishlistProducts'
import { useWishlist } from '@/providers/Wishlist'

type Props = {
  initialProducts: ProductCardData[]
  initialUnavailable: WishlistUnavailableItem[]
  loadError?: boolean
}

export function WishlistPageClient({
  initialProducts,
  initialUnavailable,
  loadError = false,
}: Props) {
  const { ids, isReady, toggleWishlist } = useWishlist()
  const router = useRouter()
  const [pendingId, setPendingId] = useState<string | null>(null)
  const [sharing, setSharing] = useState(false)
  const [isPending, startTransition] = useTransition()

  const products = useMemo(() => {
    if (!isReady) return initialProducts
    return initialProducts.filter((product) => ids.includes(product.id))
  }, [ids, initialProducts, isReady])

  const unavailable = useMemo(() => {
    if (!isReady) return initialUnavailable
    return initialUnavailable.filter((item) => ids.includes(item.id))
  }, [ids, initialUnavailable, isReady])

  const count = products.length + unavailable.length

  const removeUnavailable = (productId: string) => {
    setPendingId(productId)
    startTransition(() => {
      void (async () => {
        try {
          await toggleWishlist(productId)
          toast.success('Removed from wishlist')
          router.refresh()
        } catch {
          toast.error('Unable to update your wishlist. Please try again.')
        } finally {
          setPendingId(null)
        }
      })()
    })
  }

  const shareWishlist = async () => {
    setSharing(true)
    try {
      // Auth-gated URL only — sharing does not grant others access to this customer's list.
      const url = `${window.location.origin}/account/wishlist`
      const payload = {
        title: 'My ELIXIR Wishlist',
        text: 'Pieces I’ve saved on ELIXIR. Sign in to view your own wishlist.',
        url,
      }

      if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
        await navigator.share(payload)
      } else if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url)
        toast.success('Link copied. Recipients must sign in — your list stays private.')
      } else {
        toast.message('Sharing is not supported in this browser.')
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return
      toast.error('Unable to share right now.')
    } finally {
      setSharing(false)
    }
  }

  if (loadError) {
    return (
      <div className="mx-auto w-full max-w-xl px-5 py-16 text-center md:max-w-2xl md:px-6">
        <p className="font-[family-name:var(--font-newsreader)] text-2xl text-[var(--elixir-on-surface,#1c1b1b)]">
          Wishlist unavailable
        </p>
        <p className="mt-2 text-sm text-[var(--elixir-on-surface-variant,#414848)]">
          We couldn’t load your saved pieces. Please try again shortly.
        </p>
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-xl px-5 pb-20 pt-10 md:max-w-3xl md:px-6 lg:max-w-5xl lg:pt-14">
      <header className="max-w-xl">
        <h1 className="font-[family-name:var(--font-newsreader)] text-3xl font-medium tracking-tight text-[var(--elixir-on-surface,#1c1b1b)] md:text-4xl">
          My Wishlist ({count})
        </h1>
        <p className="mt-2 text-sm text-[var(--elixir-on-surface-variant,#414848)]">
          Curated pieces you’ve saved for later.
        </p>

        {count > 0 ? (
          <button
            type="button"
            onClick={() => void shareWishlist()}
            disabled={sharing}
            className="mt-6 inline-flex min-h-12 items-center gap-2 rounded-full border border-[var(--elixir-on-surface,#1c1b1b)] px-5 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--elixir-on-surface,#1c1b1b)] transition hover:bg-[var(--elixir-on-surface,#1c1b1b)] hover:text-white disabled:opacity-60"
          >
            <Share className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden />
            {sharing ? 'Sharing…' : 'Share Wishlist'}
          </button>
        ) : null}
      </header>

      {count === 0 ? (
        <div className="mt-14 rounded-2xl border border-[var(--elixir-outline-variant,#c4c7c7)]/60 px-6 py-16 text-center">
          <p className="font-[family-name:var(--font-newsreader)] text-2xl text-[var(--elixir-on-surface,#1c1b1b)]">
            Your Wishlist is Empty
          </p>
          <p className="mx-auto mt-3 max-w-sm text-sm text-[var(--elixir-on-surface-variant,#414848)]">
            Save pieces you love and find them here later.
          </p>
          <Link
            href="/shop"
            className="mt-8 inline-flex min-h-12 items-center justify-center bg-[var(--elixir-primary,#001515)] px-8 text-xs font-semibold uppercase tracking-[0.14em] text-white transition hover:opacity-90"
          >
            Shop Collection
          </Link>
        </div>
      ) : (
        <ul className="mt-10 grid grid-cols-1 gap-10 md:mt-12 md:grid-cols-2 md:gap-x-8 md:gap-y-12 lg:grid-cols-3">
          {products.map((product) => (
            <li key={product.id}>
              <ProductCard
                product={product}
                layout="wishlist"
                onRemoved={() => router.refresh()}
              />
            </li>
          ))}

          {unavailable.map((item) => (
            <li key={item.id}>
              <article className="flex flex-col gap-3">
                <div className="relative flex aspect-[3/4] items-center justify-center overflow-hidden rounded-lg bg-[var(--elixir-surface-container,#f0eded)]">
                  <p className="px-6 text-center text-sm text-[var(--elixir-on-surface-variant,#414848)]">
                    This piece is no longer available
                  </p>
                  <button
                    type="button"
                    onClick={() => removeUnavailable(item.id)}
                    disabled={pendingId === item.id || isPending}
                    aria-label="Remove unavailable item from wishlist"
                    className="absolute right-3 top-3 z-10 flex h-12 w-12 items-center justify-center rounded-full bg-white text-[var(--elixir-on-surface,#1c1b1b)] shadow-[0_8px_24px_rgba(28,27,27,0.06)] disabled:opacity-50"
                  >
                    <X className="h-4 w-4" strokeWidth={1.5} />
                  </button>
                </div>
                <p className="text-sm text-[var(--elixir-on-surface-variant,#414848)]">Unavailable</p>
              </article>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
