/**
 * India-only store currency configuration.
 * Payload Ecommerce generates price fields as `priceIn${code}` → `priceInINR`.
 */
export const INR = {
  code: 'INR',
  decimals: 2,
  label: 'Indian Rupee',
  symbol: '₹',
} as const

export const STORE_CURRENCY = INR
export const STORE_CURRENCY_CODE = INR.code
/** Authoritative product/variant price field for this store. */
export const PRICE_FIELD = 'priceInINR' as const

export type PricedEntity = {
  priceInINR?: number | null
}

/**
 * Read the unit price from a product or variant document.
 * `0` is a valid price; only `null` / `undefined` / non-number means missing.
 */
export function getUnitPrice(entity: PricedEntity | null | undefined): number | null {
  if (!entity) return null
  if (typeof entity.priceInINR === 'number') return entity.priceInINR
  return null
}

/**
 * Authoritative line unit price.
 *
 * - Variants enabled + selected variant → use `variant.priceInINR` only (no product fallback).
 * - Otherwise → use `product.priceInINR`.
 *
 * Returns `null` when the required price is missing (invalid configuration).
 */
export function getLineUnitPrice(args: {
  product: PricedEntity | null | undefined
  variant?: PricedEntity | null | undefined
  enableVariants?: boolean | null
}): number | null {
  const { product, variant, enableVariants } = args
  if (enableVariants && variant) {
    return getUnitPrice(variant)
  }
  return getUnitPrice(product)
}
