import configPromise from '@payload-config'
import { getPayload } from 'payload'
import type { Product, User } from '@/payload-types'
import { toProductCardData, type ProductCardData } from '@/lib/shop/productCard'

export type WishlistUnavailableItem = {
  id: string
}

export type WishlistPageData = {
  products: ProductCardData[]
  unavailable: WishlistUnavailableItem[]
  error: boolean
}

function resolveWishlistIds(user: User): number[] {
  return (user.wishlist || [])
    .map((item) => (typeof item === 'object' ? item.id : item))
    .filter((id): id is number => typeof id === 'number')
}

export async function getWishlistProducts(user: User): Promise<WishlistPageData> {
  const wishlistIds = resolveWishlistIds(user)

  if (wishlistIds.length === 0) {
    return { products: [], unavailable: [], error: false }
  }

  try {
    const payload = await getPayload({ config: configPromise })
    const result = await payload.find({
      collection: 'products',
      depth: 2,
      limit: 100,
      pagination: false,
      where: {
        and: [{ id: { in: wishlistIds } }, { _status: { equals: 'published' } }],
      },
    })

    const byId = new Map(result.docs.map((doc) => [String(doc.id), doc as Product]))
    const products: ProductCardData[] = []
    const unavailable: WishlistUnavailableItem[] = []

    // Preserve the customer's save order.
    for (const id of wishlistIds) {
      const key = String(id)
      const product = byId.get(key)
      if (product) {
        products.push(toProductCardData(product))
      } else {
        unavailable.push({ id: key })
      }
    }

    return { products, unavailable, error: false }
  } catch {
    return { products: [], unavailable: [], error: true }
  }
}
