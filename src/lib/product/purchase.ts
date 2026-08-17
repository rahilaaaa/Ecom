import type { Product, Variant } from '@/payload-types'

import { getAvailableInventory } from '@/lib/product/inventory'
import { buildVariantOptionGroups, getProductVariants } from '@/lib/product/variants'

export type PurchaseValidationReason =
  | 'needs-options'
  | 'invalid-combo'
  | 'out-of-stock'
  | 'quantity'
  | 'unavailable'

export type PurchaseValidation =
  | { ok: true }
  | { ok: false; reason: PurchaseValidationReason; message: string }

export function cartQuantityForSelection(args: {
  product: Product
  selectedVariant?: Variant | null
  cartItems?: Array<{
    product?: unknown
    variant?: unknown
    quantity?: number | null
  }> | null
}): number {
  const { product, selectedVariant, cartItems } = args
  if (!cartItems?.length) return 0

  const relationId = (value: unknown): string | null => {
    if (value == null) return null
    if (typeof value === 'object' && value && 'id' in value) {
      return String((value as { id: string | number }).id)
    }
    return String(value)
  }

  const match = cartItems.find((item) => {
    if (relationId(item.product) !== String(product.id)) return false
    if (product.enableVariants) {
      return relationId(item.variant) === (selectedVariant ? String(selectedVariant.id) : null)
    }
    return true
  })

  return match?.quantity && match.quantity > 0 ? match.quantity : 0
}

export function validatePurchase(args: {
  product: Product
  selectedVariant?: Variant | null
  quantity?: number
  cartQuantity?: number
}): PurchaseValidation {
  const quantity = args.quantity ?? 1
  const cartQuantity = args.cartQuantity ?? 0

  if (quantity < 1) {
    return { ok: false, reason: 'quantity', message: 'Please choose a valid quantity.' }
  }

  const variants = getProductVariants(args.product)
  const groups = buildVariantOptionGroups(args.product)
  const requiresVariant = Boolean(args.product.enableVariants && variants.length)

  if (requiresVariant) {
    if (!args.selectedVariant) {
      return {
        ok: false,
        reason: groups.length ? 'needs-options' : 'invalid-combo',
        message: groups.length
          ? 'Please select your options before continuing.'
          : 'This combination is not available.',
      }
    }
  }

  const inventory = getAvailableInventory(args.product, args.selectedVariant)
  if (inventory === null) {
    return {
      ok: false,
      reason: 'needs-options',
      message: 'Please select your options before continuing.',
    }
  }

  if (inventory <= 0) {
    return { ok: false, reason: 'out-of-stock', message: 'This item is currently unavailable.' }
  }

  const remaining = inventory - cartQuantity
  if (remaining <= 0) {
    return { ok: false, reason: 'out-of-stock', message: 'This item is currently unavailable.' }
  }

  if (quantity > remaining) {
    return {
      ok: false,
      reason: 'quantity',
      message:
        remaining === 1
          ? 'Only 1 left in stock.'
          : `Only ${remaining} left in stock.`,
    }
  }

  return { ok: true }
}

export function getCartItemPayload(args: {
  product: Product
  selectedVariant?: Variant | null
}): { product: number; variant?: number } {
  const { product, selectedVariant } = args
  const requiresVariant = Boolean(product.enableVariants && getProductVariants(product).length)

  return {
    product: product.id,
    variant: requiresVariant ? selectedVariant?.id : undefined,
  }
}
