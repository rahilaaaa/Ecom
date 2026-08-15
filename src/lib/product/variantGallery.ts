import type { Media, Product, Variant, VariantType } from '@/payload-types'

export type GalleryItem = {
  image: Media
  variantOption?: (number | null) | { id?: string | number | null } | null
  id?: string | null
}

export function isColorVariantType(name?: string | null, label?: string | null) {
  const haystack = `${name || ''} ${label || ''}`.toLowerCase()
  return haystack.includes('color') || haystack.includes('colour')
}

export function isSizeVariantType(name?: string | null, label?: string | null) {
  const haystack = `${name || ''} ${label || ''}`.toLowerCase()
  return haystack.includes('size')
}

export function getColorVariantType(product: Product): VariantType | null {
  for (const type of product.variantTypes || []) {
    if (typeof type !== 'object' || !type) continue
    if (isColorVariantType(type.name, type.label)) return type
  }
  return null
}

export function optionId(value: unknown): string | null {
  if (value == null) return null
  if (typeof value === 'object' && value && 'id' in value) {
    return String((value as { id: string | number }).id)
  }
  return String(value)
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

  // Fallback: untagged defaults, then full gallery so the page never goes blank.
  const untagged = gallery.filter((item) => !item.variantOption)
  return untagged.length ? untagged : gallery
}

export function findVariantForOptions(
  product: Product,
  selectedOptionIds: string[],
): Variant | undefined {
  const variants = (product.variants?.docs || []).filter(
    (variant): variant is Variant => typeof variant === 'object' && Boolean(variant),
  )

  if (!selectedOptionIds.length) return undefined

  return variants.find((variant) => {
    if (!variant.options?.length) return false
    const variantOptionIds = variant.options
      .map((option) => optionId(option))
      .filter(Boolean) as string[]

    // Every selected option must be present on the variant (color + size, etc.)
    return selectedOptionIds.every((id) => variantOptionIds.includes(id))
  })
}

/**
 * When changing color, keep the current size if that combo exists.
 * Otherwise pick the first in-stock size for the new color (then any size).
 */
export function buildParamsForColorChange(args: {
  product: Product
  colorTypeName: string
  nextColorOptionId: string
  currentParams: URLSearchParams
}): URLSearchParams {
  const { product, colorTypeName, nextColorOptionId, currentParams } = args
  const next = new URLSearchParams(currentParams.toString())
  next.set(colorTypeName, nextColorOptionId)
  next.delete('image')

  const selectedIds: string[] = []
  for (const type of product.variantTypes || []) {
    if (typeof type !== 'object' || !type?.name) continue
    const value = type.name === colorTypeName ? nextColorOptionId : next.get(type.name)
    if (value) selectedIds.push(value)
  }

  let match = findVariantForOptions(product, selectedIds)

  // If the size+color combo exists but is out of stock, try another size for this color.
  if (match && (match.inventory || 0) <= 0) {
    match = undefined
  }

  if (match) {
    next.set('variant', String(match.id))
    return next
  }

  // Drop non-color selections and choose a viable variant for this color.
  for (const type of product.variantTypes || []) {
    if (typeof type !== 'object' || !type?.name) continue
    if (type.name === colorTypeName) continue
    next.delete(type.name)
  }

  const variants = (product.variants?.docs || []).filter(
    (variant): variant is Variant => typeof variant === 'object' && Boolean(variant),
  )

  const forColor = variants.filter((variant) =>
    variant.options?.some((option) => optionId(option) === nextColorOptionId),
  )

  const preferred =
    forColor.find((variant) => (variant.inventory || 0) > 0) || forColor[0]

  if (!preferred) {
    next.delete('variant')
    return next
  }

  next.set('variant', String(preferred.id))

  for (const type of product.variantTypes || []) {
    if (typeof type !== 'object' || !type?.name || type.name === colorTypeName) continue
    const options = type.options?.docs || []
    for (const option of options) {
      if (typeof option !== 'object' || !option) continue
      const oid = String(option.id)
      if (preferred.options?.some((vo) => optionId(vo) === oid)) {
        next.set(type.name, oid)
      }
    }
  }

  return next
}

export function buildParamsForOptionChange(args: {
  product: Product
  typeName: string
  optionId: string
  currentParams: URLSearchParams
}): URLSearchParams {
  const { product, typeName, optionId: nextOptionId, currentParams } = args
  const next = new URLSearchParams(currentParams.toString())
  next.set(typeName, nextOptionId)
  next.delete('image')

  const selectedIds: string[] = []
  for (const type of product.variantTypes || []) {
    if (typeof type !== 'object' || !type?.name) continue
    const value = type.name === typeName ? nextOptionId : next.get(type.name)
    if (value) selectedIds.push(value)
  }

  const match = findVariantForOptions(product, selectedIds)
  if (match) {
    next.set('variant', String(match.id))
  } else {
    next.delete('variant')
  }

  return next
}
