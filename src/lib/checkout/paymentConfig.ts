/**
 * Central checkout payment feature flags.
 *
 * Flip `onlinePaymentEnabled` to `true` (or set
 * `NEXT_PUBLIC_ONLINE_PAYMENT_ENABLED=true`) when Stripe online checkout
 * should accept customers. Keep the Online Payment UI/code paths in place.
 *
 * Same pattern as `shippingConfig.ts` — one place, no scattered booleans.
 */
export const PAYMENT_CONFIG = {
  /**
   * When false, Online Payment stays visible but disabled ("Coming Soon"),
   * and server endpoints reject Stripe initiation / stripe-paid order creates.
   */
  onlinePaymentEnabled: false,
} as const

/**
 * Authoritative check — safe to call from server and client bundles.
 * Env override wins so production can enable without a code change:
 * `NEXT_PUBLIC_ONLINE_PAYMENT_ENABLED=true`
 */
export function isOnlinePaymentEnabled(): boolean {
  const fromEnv = process.env.NEXT_PUBLIC_ONLINE_PAYMENT_ENABLED
  if (fromEnv === 'true') return true
  if (fromEnv === 'false') return false
  return PAYMENT_CONFIG.onlinePaymentEnabled
}

export const ONLINE_PAYMENT_UNAVAILABLE_TITLE = 'Online Payment — Coming Soon'
export const ONLINE_PAYMENT_UNAVAILABLE_MESSAGE =
  'Online payment is currently unavailable.'
