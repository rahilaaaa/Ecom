'use server'

import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { applyCouponCode } from '@/lib/cart/applyCoupon'
import { FREE_SHIPPING_THRESHOLD_CENTS } from '@/lib/cart/shipping'

export type CheckoutCartItemInput = {
  productId: string | number
  variantId?: string | number | null
  quantity: number
}

export type CheckoutValidationResult =
  | {
      ok: true
      subtotal: number
      shipping: number
      discount: number
      total: number
      currency: 'USD'
      message?: string
    }
  | {
      ok: false
      message: string
    }

export async function validateCheckoutCart(input: {
  items: CheckoutCartItemInput[]
  couponCode?: string | null
}): Promise<CheckoutValidationResult> {
  if (!input.items?.length) {
    return { ok: false, message: 'Your cart is empty.' }
  }

  try {
    const payload = await getPayload({ config: configPromise })
    let subtotal = 0

    for (const item of input.items) {
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

        if (typeof variant.priceInUSD !== 'number') {
          return { ok: false, message: `Price unavailable for ${product.title}.` }
        }

        subtotal += variant.priceInUSD * item.quantity
      } else {
        if (!product.inventory || product.inventory < item.quantity) {
          return { ok: false, message: `Insufficient stock for ${product.title}.` }
        }

        if (typeof product.priceInUSD !== 'number') {
          return { ok: false, message: `Price unavailable for ${product.title}.` }
        }

        subtotal += product.priceInUSD * item.quantity
      }
    }

    let discount = 0
    if (input.couponCode) {
      const coupon = await applyCouponCode({
        code: input.couponCode,
        subtotal,
      })
      if (!coupon.ok) {
        return { ok: false, message: coupon.message }
      }
      discount = coupon.discountAmount
    }

    const shipping = subtotal - discount >= FREE_SHIPPING_THRESHOLD_CENTS ? 0 : 0
    const total = Math.max(0, subtotal - discount + shipping)

    return {
      ok: true,
      subtotal,
      shipping,
      discount,
      total,
      currency: 'USD',
    }
  } catch {
    return {
      ok: false,
      message: 'Unable to validate your cart. Please try again.',
    }
  }
}
