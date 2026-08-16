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

export type PricingMode = 'product' | 'variant'

export type PricingProduct = PricedEntity & {
  enableVariants?: boolean | null
  pricingMode?: PricingMode | null
  variants?: {
    docs?: Array<PricedEntity | number | string | null> | null
  } | null
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
 * Missing `pricingMode` is treated as product-level pricing.
 * That matches the migration default for existing catalog data.
 */
export function resolvePricingMode(
  product: Pick<PricingProduct, 'pricingMode'> | null | undefined,
): PricingMode {
  return product?.pricingMode === 'variant' ? 'variant' : 'product'
}

export function usesVariantPricing(
  product: Pick<PricingProduct, 'enableVariants' | 'pricingMode'> | null | undefined,
): boolean {
  return Boolean(product?.enableVariants) && resolvePricingMode(product) === 'variant'
}

/**
 * Canonical unit price for a product + optional selected variant.
 *
 * - `pricingMode = "variant"` → variant.priceInINR only. Never falls back to product price.
 * - `pricingMode = "product"` (default) → product.priceInINR even when a variant is selected.
 * - Variants disabled / no variant selected → product.priceInINR.
 *
 * Returns `null` when the source-of-truth price is missing. Callers must not substitute
 * the other level's price.
 */
export function getEffectivePrice(args: {
  product: PricingProduct | null | undefined
  variant?: PricedEntity | null | undefined
  enableVariants?: boolean | null
}): number | null {
  const { product, variant, enableVariants } = args
  const variantsEnabled = Boolean(enableVariants ?? product?.enableVariants)

  if (variantsEnabled && variant && usesVariantPricing(product)) {
    return getUnitPrice(variant)
  }

  return getUnitPrice(product)
}

/**
 * Authoritative line unit price. Delegates to `getEffectivePrice` so cart, PDP,
 * checkout, and listings cannot diverge on which price is charged.
 *
 * Returns `null` when the source-of-truth price is missing (invalid configuration).
 */
export function getLineUnitPrice(args: {
  product: PricingProduct | null | undefined
  variant?: PricedEntity | null | undefined
  enableVariants?: boolean | null
}): number | null {
  return getEffectivePrice(args)
}

export type EffectivePriceRange = {
  amount: number | null
  lowestAmount: number | null
  highestAmount: number | null
  hasRange: boolean
}

function variantDocs(product: PricingProduct | null | undefined): PricedEntity[] {
  return (product?.variants?.docs || []).filter(
    (variant): variant is PricedEntity => Boolean(variant) && typeof variant === 'object',
  )
}

/**
 * Listing / unselected-variant display price.
 * Product mode: the product price (no false range).
 * Variant mode: min–max of variant prices (missing variant prices are omitted, not replaced).
 */
export function getEffectivePriceRange(
  product: PricingProduct | null | undefined,
): EffectivePriceRange {
  if (!product?.enableVariants) {
    const amount = getUnitPrice(product)
    return { amount, lowestAmount: amount, highestAmount: amount, hasRange: false }
  }

  if (!usesVariantPricing(product)) {
    const amount = getUnitPrice(product)
    return { amount, lowestAmount: amount, highestAmount: amount, hasRange: false }
  }

  const prices = variantDocs(product)
    .map((variant) => getUnitPrice(variant))
    .filter((price): price is number => typeof price === 'number')

  const lowestAmount = prices.length ? Math.min(...prices) : null
  const highestAmount = prices.length ? Math.max(...prices) : null
  const hasRange = Boolean(
    lowestAmount !== null && highestAmount !== null && lowestAmount !== highestAmount,
  )

  return {
    amount: lowestAmount,
    lowestAmount,
    highestAmount,
    hasRange,
  }
}
