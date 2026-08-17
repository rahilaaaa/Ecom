import type { Media, Product } from '@/payload-types'

export function isMedia(value: unknown): value is Media {
  return value != null && typeof value === 'object' && 'id' in value
}

export function isRenderableMedia(value: unknown): value is Media {
  if (!isMedia(value)) return false
  return Boolean(value.url?.trim() || value.filename?.trim())
}

export function getMediaAlt(media: Media | null | undefined, fallback: string): string {
  const alt = media?.alt?.trim()
  return alt || fallback
}

export type ProductGalleryItem = {
  image: Media
  variantOption?: NonNullable<Product['gallery']>[number]['variantOption']
  id?: string | null
}

export function getProductGalleryItems(product: Product): ProductGalleryItem[] {
  const items: ProductGalleryItem[] = []

  for (const item of product.gallery || []) {
    if (!isRenderableMedia(item.image)) continue
    items.push({
      image: item.image,
      variantOption: item.variantOption,
      id: item.id,
    })
  }

  return items
}
