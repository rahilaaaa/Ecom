import type { Payload } from 'payload'

import { applyCouponCode } from '@/lib/cart/applyCoupon'
import {
  calculateShippingAmount,
  DEFAULT_SHIPPING_METHOD,
  isShippingMethodId,
  type ShippingMethodId,
} from '@/lib/checkout/shippingConfig'
import { getLineUnitPrice, STORE_CURRENCY_CODE } from '@/lib/currency'

export type CheckoutCartItemInput = {
  productId: string | number
  variantId?: string | number | null
  quantity: number
}

export type CheckoutLineSnapshot = {
  product: string | number
  variant?: string | number
  quantity: number
  unitPrice: number
  productTitle: string
  variantLabel?: string
}

export type CheckoutTotals = {
  ok: true
  subtotal: number
  discount: number
  shipping: number
  tax: number
  total: number
  currency: typeof STORE_CURRENCY_CODE
  couponCode: string | null
  shippingMethodId: ShippingMethodId
  /** Tax is not implemented — always 0 until GST rules are defined. */
  taxImplemented: false
  lines: CheckoutLineSnapshot[]
}

export type CheckoutTotalsError = {
  ok: false
  message: string
}

export type CheckoutTotalsResult = CheckoutTotals | CheckoutTotalsError

/**
 * Authoritative checkout money math (all values in paise).
 * Fetches product/variant prices from Payload — never trusts client amounts.
 */
export async function calculateCheckoutTotals(args: {
  payload: Payload
  items: CheckoutCartItemInput[]
  couponCode?: string | null
  shippingMethodId?: string | null
}): Promise<CheckoutTotalsResult> {
  const { payload, items } = args

  if (!items?.length) {
    return { ok: false, message: 'Your cart is empty.' }
  }

  const shippingMethodId: ShippingMethodId = isShippingMethodId(args.shippingMethodId)
    ? args.shippingMethodId
    : DEFAULT_SHIPPING_METHOD

  let subtotal = 0
  const lines: CheckoutLineSnapshot[] = []

  for (const item of items) {
    if (!item.quantity || item.quantity < 1) {
      return { ok: false, message: 'Invalid item quantity.' }
    }

    const product = await payload.findByID({
      collection: 'products',
      id: item.productId,
      depth: 1,
      draft: false,
      overrideAccess: false,
    })

    if (!product || product._status !== 'published') {
      return { ok: false, message: 'One or more products are no longer available.' }
    }

    if (product.enableVariants) {
      if (!item.variantId) {
        return { ok: false, message: 'Please select options for all products before checkout.' }
      }

      const variants = product.variants?.docs || []
      const variant = variants.find((entry) => {
        if (typeof entry === 'object') return String(entry.id) === String(item.variantId)
        return String(entry) === String(item.variantId)
      })

      if (!variant || typeof variant !== 'object') {
        return { ok: false, message: 'A selected product variant is no longer available.' }
      }

      if (!variant.inventory || variant.inventory < item.quantity) {
        return { ok: false, message: `Insufficient stock for ${product.title}.` }
      }

      const unitPrice = getLineUnitPrice({
        product,
        variant,
        enableVariants: true,
      })

      if (typeof unitPrice !== 'number') {
        return {
          ok: false,
          message: `Price unavailable for a selected variant of ${product.title}.`,
        }
      }

      const variantLabel =
        variant.options
          ?.map((option) => (typeof option === 'object' ? option.label : null))
          .filter(Boolean)
          .join(' · ') ||
        variant.title ||
        undefined

      lines.push({
        product: product.id,
        variant: variant.id,
        quantity: item.quantity,
        unitPrice,
        productTitle: product.title,
        variantLabel,
      })
      subtotal += unitPrice * item.quantity
    } else {
      if (!product.inventory || product.inventory < item.quantity) {
        return { ok: false, message: `Insufficient stock for ${product.title}.` }
      }

      const unitPrice = getLineUnitPrice({ product, enableVariants: false })

      if (typeof unitPrice !== 'number') {
        return { ok: false, message: `Price unavailable for ${product.title}.` }
      }

      lines.push({
        product: product.id,
        quantity: item.quantity,
        unitPrice,
        productTitle: product.title,
      })
      subtotal += unitPrice * item.quantity
    }
  }

  let discount = 0
  let couponCode: string | null = null

  if (args.couponCode?.trim()) {
    const coupon = await applyCouponCode({
      code: args.couponCode,
      subtotal,
    })
    if (!coupon.ok) {
      return { ok: false, message: coupon.message }
    }
    discount = coupon.discountAmount
    couponCode = coupon.code
  }

  const subtotalAfterDiscount = Math.max(0, subtotal - discount)
  const shipping = calculateShippingAmount({
    subtotalAfterDiscountPaise: subtotalAfterDiscount,
    methodId: shippingMethodId,
  })

  // GST not configured — do not invent a rate.
  const tax = 0
  const total = Math.max(0, subtotalAfterDiscount + shipping + tax)

  return {
    ok: true,
    subtotal,
    discount,
    shipping,
    tax,
    total,
    currency: STORE_CURRENCY_CODE,
    couponCode,
    shippingMethodId,
    taxImplemented: false,
    lines,
  }
}
