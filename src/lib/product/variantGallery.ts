import type { Product, Variant, VariantType } from '@/payload-types'

import {
  buildParamsForColorChange,
  buildParamsForOptionChange,
  findVariantForOptions,
  getColorVariantType,
  isColorVariantType,
  isSizeVariantType,
  optionId,
} from '@/lib/product/variants'
import type { ProductGalleryItem } from '@/lib/product/media'

export type GalleryItem = ProductGalleryItem

export {
  buildParamsForColorChange,
  buildParamsForOptionChange,
  findVariantForOptions,
  getColorVariantType,
  isColorVariantType,
  isSizeVariantType,
  optionId,
}

/**
 * Gallery is driven by Color Variant Option only — never by Size.
 */
export function filterGalleryByColor(
  gallery: GalleryItem[],
  selectedColorOptionId: string | null,
): GalleryItem[] {
  if (!gallery.length) return []

  if (!selectedColorOptionId) {
    const untagged = gallery.filter((item) => !item.variantOption)
    return untagged.length ? untagged : gallery
  }

  const colorMatches = gallery.filter(
    (item) => optionId(item.variantOption) === String(selectedColorOptionId),
  )

  if (colorMatches.length) return colorMatches

  const untagged = gallery.filter((item) => !item.variantOption)
  return untagged.length ? untagged : gallery
}

export type { Variant, VariantType, Product }
