'use server'

import configPromise from '@payload-config'
import { getPayload } from 'payload'

import {
  calculateCheckoutTotals,
  type CheckoutCartItemInput,
  type CheckoutTotalsResult,
} from '@/lib/checkout/calculateCheckoutTotals'

export type { CheckoutCartItemInput, CheckoutTotalsResult as CheckoutValidationResult }

/**
 * Server action: authoritative checkout totals from DB prices.
 * Accepts cart line IDs + coupon code + shipping method id only — never client money amounts.
 */
export async function validateCheckoutCart(input: {
  items: CheckoutCartItemInput[]
  couponCode?: string | null
  shippingMethodId?: string | null
}): Promise<CheckoutTotalsResult> {
  try {
    const payload = await getPayload({ config: configPromise })
    return calculateCheckoutTotals({
      payload,
      items: input.items,
      couponCode: input.couponCode,
      shippingMethodId: input.shippingMethodId,
    })
  } catch {
    return {
      ok: false,
      message: 'Unable to validate your cart. Please try again.',
    }
  }
}
