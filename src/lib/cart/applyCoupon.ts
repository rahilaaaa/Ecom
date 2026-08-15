'use server'

import configPromise from '@payload-config'
import { getPayload } from 'payload'

export type CouponResult =
  | {
      ok: true
      code: string
      type: 'percent' | 'fixed'
      value: number
      discountAmount: number
      message: string
    }
  | {
      ok: false
      message: string
    }

export async function applyCouponCode(input: {
  code: string
  subtotal: number
}): Promise<CouponResult> {
  const code = input.code?.trim().toUpperCase()
  const subtotal = Math.max(0, Math.floor(Number(input.subtotal) || 0))

  if (!code) {
    return { ok: false, message: 'Please enter a coupon code.' }
  }

  if (subtotal <= 0) {
    return { ok: false, message: 'Your cart must contain items to apply a coupon.' }
  }

  try {
    const payload = await getPayload({ config: configPromise })

    const result = await payload.find({
      collection: 'coupons',
      depth: 0,
      limit: 1,
      overrideAccess: true,
      where: {
        code: {
          equals: code,
        },
      },
    })

    const coupon = result.docs[0]

    if (!coupon) {
      return { ok: false, message: 'This coupon code is invalid.' }
    }

    if (!coupon.active) {
      return { ok: false, message: 'This coupon is no longer active.' }
    }

    if (coupon.expiresAt && new Date(coupon.expiresAt).getTime() < Date.now()) {
      return { ok: false, message: 'This coupon has expired.' }
    }

    const minSubtotal = typeof coupon.minSubtotal === 'number' ? coupon.minSubtotal : 0
    if (subtotal < minSubtotal) {
      return {
        ok: false,
        message: `This coupon requires a minimum subtotal of ${(minSubtotal / 100).toFixed(2)} USD.`,
      }
    }

    const type = coupon.type === 'fixed' ? 'fixed' : 'percent'
    const value = Number(coupon.value) || 0

    let discountAmount = 0
    if (type === 'percent') {
      if (value <= 0 || value > 100) {
        return { ok: false, message: 'This coupon is misconfigured.' }
      }
      discountAmount = Math.floor((subtotal * value) / 100)
    } else {
      if (value <= 0) {
        return { ok: false, message: 'This coupon is misconfigured.' }
      }
      discountAmount = Math.min(value, subtotal)
    }

    if (discountAmount <= 0) {
      return { ok: false, message: 'This coupon does not apply to your cart.' }
    }

    return {
      ok: true,
      code: coupon.code.toUpperCase(),
      type,
      value,
      discountAmount,
      message:
        type === 'percent'
          ? `${value}% discount applied.`
          : `$${(value / 100).toFixed(2)} discount applied.`,
    }
  } catch {
    return { ok: false, message: 'Unable to apply coupon right now. Please try again.' }
  }
}
