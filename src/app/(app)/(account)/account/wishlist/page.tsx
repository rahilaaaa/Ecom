import type { Metadata } from 'next'

import { WishlistPageClient } from '@/components/wishlist/WishlistPageClient'
import { getAuthenticatedAccountUser } from '@/lib/account/getAccountUser'
import { getWishlistProducts } from '@/lib/wishlist/getWishlistProducts'
import { mergeOpenGraph } from '@/utilities/mergeOpenGraph'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function WishlistPage() {
  const user = await getAuthenticatedAccountUser()

  if (!user) {
    redirect(
      `/login?warning=${encodeURIComponent('Please login to access your wishlist.')}&redirect=${encodeURIComponent('/account/wishlist')}`,
    )
  }

  const { products, unavailable, error } = await getWishlistProducts(user)

  return (
    <WishlistPageClient
      initialProducts={products}
      initialUnavailable={unavailable}
      loadError={error}
    />
  )
}

export const metadata: Metadata = {
  description: 'Your saved ELIXIR products.',
  openGraph: mergeOpenGraph({
    title: 'My Wishlist',
    url: '/account/wishlist',
  }),
  title: 'My Wishlist',
}
