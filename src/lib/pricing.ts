/**
 * Canonical product/variant pricing. Implementation lives next to the store
 * currency helpers so there is one numeric representation (`priceInINR` in paise).
 */
export {
  getEffectivePrice,
  getEffectivePriceRange,
  getLineUnitPrice,
  getUnitPrice,
  resolvePricingMode,
  usesVariantPricing,
  type EffectivePriceRange,
  type PricingMode,
  type PricingProduct,
} from '@/lib/currency'
