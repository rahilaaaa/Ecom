'use server'

import configPromise from '@payload-config'
import { headers as getHeaders } from 'next/headers'
import { getPayload } from 'payload'

import {
  calculateCheckoutTotals,
  type CheckoutCartItemInput,
} from '@/lib/checkout/calculateCheckoutTotals'
import { STORE_CURRENCY_CODE } from '@/lib/currency'

export type PlaceCodOrderInput = {
  items: CheckoutCartItemInput[]
  couponCode?: string | null
  shippingMethodId?: string | null
  customerEmail: string
  shippingAddress: {
    firstName?: string
    lastName?: string
    addressLine1?: string
    addressLine2?: string
    city?: string
    state?: string
    postalCode?: string
    country?: string
    phone?: string
  }
  /** Client-generated key to prevent duplicate COD orders on double-submit. */
  idempotencyKey: string
  cartId?: string | number | null
}

export type PlaceCodOrderResult =
  | {
      ok: true
      orderID: string | number
      accessToken?: string
      amount: number
      currency: typeof STORE_CURRENCY_CODE
      paymentMethod: 'cod'
      paymentStatus: 'pending'
    }
  | {
      ok: false
      message: string
    }

/**
 * Creates a Cash on Delivery order without Stripe.
 * Prices/inventory are recalculated server-side from Payload.
 */
export async function placeCodOrder(input: PlaceCodOrderInput): Promise<PlaceCodOrderResult> {
  const email = input.customerEmail?.trim().toLowerCase()
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { ok: false, message: 'A valid email is required to place your order.' }
  }

  if (!input.idempotencyKey?.trim()) {
    return { ok: false, message: 'Unable to place order. Please try again.' }
  }

  if (!input.shippingAddress?.addressLine1 || !input.shippingAddress?.city) {
    return { ok: false, message: 'A complete shipping address is required.' }
  }

  try {
    const payload = await getPayload({ config: configPromise })
    const headers = await getHeaders()
    const { user } = await payload.auth({ headers })

    const existing = await payload.find({
      collection: 'orders',
      depth: 0,
      limit: 1,
      overrideAccess: true,
      where: {
        checkoutIdempotencyKey: {
          equals: input.idempotencyKey,
        },
      },
    })

    if (existing.docs[0]) {
      const order = existing.docs[0]
      return {
        ok: true,
        orderID: order.id,
        accessToken: typeof order.accessToken === 'string' ? order.accessToken : undefined,
        amount: typeof order.amount === 'number' ? order.amount : 0,
        currency: STORE_CURRENCY_CODE,
        paymentMethod: 'cod',
        paymentStatus: 'pending',
      }
    }

    const totals = await calculateCheckoutTotals({
      payload,
      items: input.items,
      couponCode: input.couponCode,
      shippingMethodId: input.shippingMethodId,
    })

    if (!totals.ok) {
      return { ok: false, message: totals.message }
    }

    if (totals.total <= 0) {
      return { ok: false, message: 'Order total is invalid.' }
    }

    const order = await payload.create({
      collection: 'orders',
      depth: 0,
      overrideAccess: true,
      data: {
        items: totals.lines.map((line) => ({
          product: Number(line.product),
          ...(line.variant != null ? { variant: Number(line.variant) } : {}),
          quantity: line.quantity,
          unitPrice: line.unitPrice,
          productTitle: line.productTitle,
          ...(line.variantLabel ? { variantLabel: line.variantLabel } : {}),
        })),
        shippingAddress: {
          firstName: input.shippingAddress.firstName || undefined,
          lastName: input.shippingAddress.lastName || undefined,
          addressLine1: input.shippingAddress.addressLine1 || undefined,
          addressLine2: input.shippingAddress.addressLine2 || undefined,
          city: input.shippingAddress.city || undefined,
          state: input.shippingAddress.state || undefined,
          postalCode: input.shippingAddress.postalCode || undefined,
          country: input.shippingAddress.country || undefined,
          phone: input.shippingAddress.phone || undefined,
        },
        ...(user?.id ? { customer: Number(user.id) } : {}),
        customerEmail: email,
        status: 'processing',
        paymentMethod: 'cod',
        paymentStatus: 'pending',
        amount: totals.total,
        subtotal: totals.subtotal,
        discountAmount: totals.discount,
        shippingAmount: totals.shipping,
        taxAmount: totals.tax,
        currency: STORE_CURRENCY_CODE,
        checkoutIdempotencyKey: input.idempotencyKey,
      },
    })

    if (input.cartId != null) {
      try {
        await payload.update({
          collection: 'carts',
          id: input.cartId,
          data: {
            purchasedAt: new Date().toISOString(),
          },
          overrideAccess: true,
        })
      } catch {
        // Non-fatal — order already created
      }
    }

    return {
      ok: true,
      orderID: order.id,
      accessToken: typeof order.accessToken === 'string' ? order.accessToken : undefined,
      amount: totals.total,
      currency: STORE_CURRENCY_CODE,
      paymentMethod: 'cod',
      paymentStatus: 'pending',
    }
  } catch (error) {
    console.error('placeCodOrder failed', error)
    return {
      ok: false,
      message: 'Unable to place your COD order. Please try again.',
    }
  }
}
