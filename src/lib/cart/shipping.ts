/**
 * Re-export shipping helpers from the centralized checkout config.
 * Prefer importing from `@/lib/checkout/shippingConfig` in new code.
 */
export {
  FREE_SHIPPING_THRESHOLD_CENTS,
  FREE_SHIPPING_THRESHOLD_PAISE,
  SHIPPING_CONFIG,
  calculateShippingAmount,
  getShippingDisplay,
  getShippingMethodLabel,
  DEFAULT_SHIPPING_METHOD,
  type ShippingMethodId,
} from '@/lib/checkout/shippingConfig'
