import {
  isOnlinePaymentEnabled,
  ONLINE_PAYMENT_UNAVAILABLE_MESSAGE,
  ONLINE_PAYMENT_UNAVAILABLE_TITLE,
} from '@/lib/checkout/paymentConfig'

/**
 * Checkout payment method choices (storefront).
 * Maps onto Order.paymentMethod values.
 */
export type CheckoutPaymentMethod = 'cod' | 'online'

export type CheckoutPaymentMethodOption = {
  id: CheckoutPaymentMethod
  label: string
  description: string
  orderValue: 'cod' | 'stripe'
  available: boolean
  unavailableTitle?: string
  unavailableDescription?: string
}

const BASE_PAYMENT_METHODS = [
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

/** Payment methods with live availability from `paymentConfig`. */
export function getCheckoutPaymentMethods(): CheckoutPaymentMethodOption[] {
  const onlineEnabled = isOnlinePaymentEnabled()

  return BASE_PAYMENT_METHODS.map((method) => {
    if (method.id === 'online') {
      return {
        ...method,
        available: onlineEnabled,
        unavailableTitle: ONLINE_PAYMENT_UNAVAILABLE_TITLE,
        unavailableDescription: ONLINE_PAYMENT_UNAVAILABLE_MESSAGE,
      }
    }
    return {
      ...method,
      available: true,
    }
  })
}

/** @deprecated Prefer getCheckoutPaymentMethods() so availability is applied. */
export const CHECKOUT_PAYMENT_METHODS = BASE_PAYMENT_METHODS

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

export function assertOnlinePaymentEnabled(): void {
  if (!isOnlinePaymentEnabled()) {
    throw new Error(ONLINE_PAYMENT_UNAVAILABLE_MESSAGE)
  }
}
