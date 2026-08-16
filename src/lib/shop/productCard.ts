import type { Category, Media, Product, Variant } from '@/payload-types'

import { getLineUnitPrice, getUnitPrice } from '@/lib/currency'

export type ProductCardData = {
  id: string
  slug: string
  title: string
  href: string
  image: Media | null
  price: number | null
  badge: 'none' | 'new' | 'sale' | null
  rating: number | null
  isOnSale: boolean
  subtitle?: string | null
  category?: string | null
  inStock?: boolean
  enableVariants?: boolean
}

function resolvePrice(product: Partial<Product>): number | null {
  if (product.enableVariants) {
    const variants = product.variants?.docs
    if (variants && variants.length > 0) {
      const prices = variants
        .map((variant) => (typeof variant === 'object' ? getUnitPrice(variant as Variant) : null))
        .filter((price): price is number => typeof price === 'number')
      // Variant products must be priced on variants — never fall back to product price.
      return prices.length ? Math.min(...prices) : null
    }
    return null
  }

  return getUnitPrice(product as Product)
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
  const galleryImage = product.gallery?.[0]?.image
  const image = galleryImage && typeof galleryImage === 'object' ? galleryImage : null

  const price = resolvePrice(product)
  const badge = (product.badge as ProductCardData['badge']) ?? 'none'
  const isOnSale = badge === 'sale'

  return {
    id: String(product.id),
    slug: product.slug || '',
    title: product.title || 'Untitled',
    href: `/products/${product.slug}`,
    image,
    price,
    badge,
    rating: typeof product.rating === 'number' ? product.rating : null,
    isOnSale,
    category: resolveCategory(product),
    inStock: resolveInStock(product),
    enableVariants: Boolean(product.enableVariants),
  }
}

export function getProductOrVariantPrice(
  product: Product,
  variant?: Variant | null,
): number | null {
  return getLineUnitPrice({
    product,
    variant,
    enableVariants: product.enableVariants,
  })
}
