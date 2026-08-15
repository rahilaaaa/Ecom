import type { Category, Media, Product, Variant } from '@/payload-types'

export type ProductCardData = {
  id: string
  slug: string
  title: string
  href: string
  image: Media | null
  price: number | null
  compareAtPrice: number | null
  badge: 'none' | 'new' | 'sale' | null
  rating: number | null
  isOnSale: boolean
  subtitle?: string | null
  category?: string | null
  inStock?: boolean
  enableVariants?: boolean
}

function resolvePrice(product: Partial<Product>): number | null {
  let price = typeof product.priceInUSD === 'number' ? product.priceInUSD : null

  const variants = product.variants?.docs
  if (variants && variants.length > 0) {
    const variant = variants[0]
    if (
      variant &&
      typeof variant === 'object' &&
      typeof (variant as Variant).priceInUSD === 'number'
    ) {
      price = (variant as Variant).priceInUSD as number
    }
  }

  return price
}

function resolveCategory(product: Partial<Product>): string | null {
  const first = product.categories?.[0]
  if (!first) return null
  if (typeof first === 'object') return (first as Category).title || null
  return null
}

function resolveInStock(product: Partial<Product>): boolean {
  if (product.enableVariants) {
    const variants = product.variants?.docs || []
    // Join may be empty depending on query depth — defer to PDP rather than false OOS.
    if (variants.length === 0) return true
    return variants.some((variant) => {
      if (typeof variant !== 'object' || !variant) return false
      return typeof variant.inventory === 'number' && variant.inventory > 0
    })
  }

  if (typeof product.inventory === 'number') return product.inventory > 0
  return true
}

export function toProductCardData(
  product: Partial<Product> & { id: string | number },
): ProductCardData {
  const image =
    product.gallery?.[0]?.image && typeof product.gallery[0].image !== 'string'
      ? product.gallery[0].image
      : null

  const price = resolvePrice(product)
  const compareAtPrice =
    typeof product.compareAtPriceInUSD === 'number' ? product.compareAtPriceInUSD : null
  const badge = (product.badge as ProductCardData['badge']) ?? 'none'
  const isOnSale =
    badge === 'sale' ||
    (typeof compareAtPrice === 'number' && typeof price === 'number' && compareAtPrice > price)

  return {
    id: String(product.id),
    slug: product.slug || '',
    title: product.title || 'Untitled',
    href: `/products/${product.slug}`,
    image,
    price,
    compareAtPrice: isOnSale ? compareAtPrice : null,
    badge: isOnSale && badge === 'none' ? 'sale' : badge,
    rating: typeof product.rating === 'number' ? product.rating : null,
    isOnSale,
    category: resolveCategory(product),
    inStock: resolveInStock(product),
    enableVariants: Boolean(product.enableVariants),
  }
}
