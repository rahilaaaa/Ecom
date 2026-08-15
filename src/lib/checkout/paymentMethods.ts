/**
 * Checkout payment method choices (storefront).
 * Maps onto Order.paymentMethod values.
 */
export type CheckoutPaymentMethod = 'cod' | 'online'

export const CHECKOUT_PAYMENT_METHODS = [
  {
    id: 'cod' as const,
    label: 'Cash on Delivery',
    description: 'Pay when your order is delivered',
    orderValue: 'cod' as const,
  },
  {
    id: 'online' as const,
    label: 'Online Payment',
    description: 'Pay securely online',
    orderValue: 'stripe' as const,
  },
]

export function formatInrFromPaise(paise: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
  }).format(paise / 100)
}

/** Detect placeholder / missing Stripe secret used in local .env templates. */
export function isStripeSecretConfigured(secretKey: string | undefined | null): boolean {
  if (!secretKey) return false
  const key = secretKey.trim()
  if (!key) return false
  if (key === 'sk_test_' || key === 'sk_live_') return false
  if (key.length < 20) return false
  return key.startsWith('sk_test_') || key.startsWith('sk_live_')
}

export function isStripePublishableConfigured(publishableKey: string | undefined | null): boolean {
  if (!publishableKey) return false
  const key = publishableKey.trim()
  if (!key) return false
  if (key === 'pk_test_' || key === 'pk_live_') return false
  if (key.length < 20) return false
  return key.startsWith('pk_test_') || key.startsWith('pk_live_')
}
