import Stripe from 'stripe'
import { stripeAdapter } from '@payloadcms/plugin-ecommerce/payments/stripe'
import type { PaymentAdapter } from '@payloadcms/plugin-ecommerce/types'

import { calculateCheckoutTotals } from '@/lib/checkout/calculateCheckoutTotals'
import { isStripeSecretConfigured } from '@/lib/checkout/paymentMethods'
import { STORE_CURRENCY_CODE } from '@/lib/currency'

type StripeAdapterArgs = {
  secretKey: string
  publishableKey: string
  webhookSecret?: string
}

type CheckoutMeta = {
  checkoutSubtotal: string
  checkoutDiscount: string
  checkoutShipping: string
  checkoutTax: string
  checkoutTotal: string
  couponCode: string
  shippingMethod: string
}

function cartItemsToCheckoutInput(cart: {
  items?: Array<{
    product?: unknown
    variant?: unknown
    quantity?: number | null
  }> | null
}) {
  return (cart.items || [])
    .map((item) => {
      const productId =
        typeof item.product === 'object' && item.product && 'id' in item.product
          ? (item.product as { id: string | number }).id
          : (item.product as string | number | undefined)
      const variantId =
        item.variant == null
          ? null
          : typeof item.variant === 'object' && item.variant && 'id' in item.variant
            ? (item.variant as { id: string | number }).id
            : (item.variant as string | number)

      if (productId == null) return null
      return {
        productId,
        variantId,
        quantity: item.quantity || 0,
      }
    })
    .filter(Boolean) as Array<{
    productId: string | number
    variantId?: string | number | null
    quantity: number
  }>
}

/**
 * Stripe adapter that charges the authoritative checkout total
 * (subtotal − discount + shipping + tax), not raw cart.subtotal alone.
 */
export function stripeAdapterWithCheckoutTotals(props: StripeAdapterArgs): PaymentAdapter {
  const base = stripeAdapter(props)
  const secretKey = props.secretKey

  return {
    ...base,
    initiatePayment: async (args) => {
      const { data, req } = args

      if (!isStripeSecretConfigured(secretKey)) {
        throw new Error(
          'Online payment is not configured. Set a valid STRIPE_SECRET_KEY (sk_test_…) and NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY (pk_test_…) in your environment.',
        )
      }

      const cart = data.cart
      if (!cart?.items?.length) {
        throw new Error('Cart is empty or not provided.')
      }

      const couponCode =
        typeof req.data?.couponCode === 'string' ? req.data.couponCode : null
      const shippingMethodId =
        typeof req.data?.shippingMethodId === 'string' ? req.data.shippingMethodId : null

      const totals = await calculateCheckoutTotals({
        payload: req.payload,
        items: cartItemsToCheckoutInput(cart),
        couponCode,
        shippingMethodId,
      })

      if (!totals.ok) {
        throw new Error(totals.message)
      }

      if (totals.total <= 0) {
        throw new Error('A valid amount is required to initiate a payment.')
      }

      // Plugin Stripe adapter reads amount from cart.subtotal — pass final payable total.
      const adjustedCart = {
        ...cart,
        subtotal: totals.total,
        currency: STORE_CURRENCY_CODE,
      }

      const paymentResponse = await base.initiatePayment({
        ...args,
        data: {
          ...data,
          cart: adjustedCart,
          currency: STORE_CURRENCY_CODE,
        },
      })

      const paymentIntentID =
        paymentResponse &&
        typeof paymentResponse === 'object' &&
        'paymentIntentID' in paymentResponse
          ? String((paymentResponse as unknown as { paymentIntentID: string }).paymentIntentID)
          : null

      if (paymentIntentID && secretKey) {
        const stripe = new Stripe(secretKey)
        const meta: CheckoutMeta = {
          checkoutSubtotal: String(totals.subtotal),
          checkoutDiscount: String(totals.discount),
          checkoutShipping: String(totals.shipping),
          checkoutTax: String(totals.tax),
          checkoutTotal: String(totals.total),
          couponCode: totals.couponCode || '',
          shippingMethod: totals.shippingMethodId,
        }
        await stripe.paymentIntents.update(paymentIntentID, {
          metadata: meta,
        })
      }

      return {
        ...paymentResponse,
        totals: {
          subtotal: totals.subtotal,
          discount: totals.discount,
          shipping: totals.shipping,
          tax: totals.tax,
          total: totals.total,
          currency: totals.currency,
          couponCode: totals.couponCode,
          shippingMethodId: totals.shippingMethodId,
          taxImplemented: totals.taxImplemented,
        },
      }
    },
    confirmOrder: async (args) => {
      const result = await base.confirmOrder(args)
      if (!secretKey || !result || typeof result !== 'object' || !('orderID' in result)) {
        return result
      }

      const paymentIntentID =
        typeof args.data?.paymentIntentID === 'string' ? args.data.paymentIntentID : null
      if (!paymentIntentID) return result

      try {
        const stripe = new Stripe(secretKey)
        const intent = await stripe.paymentIntents.retrieve(paymentIntentID)
        const meta = intent.metadata || {}

        const subtotal = Number(meta.checkoutSubtotal)
        const discount = Number(meta.checkoutDiscount)
        const shipping = Number(meta.checkoutShipping)
        const tax = Number(meta.checkoutTax)

        await args.req.payload.update({
          collection: 'orders',
          id: result.orderID as string | number,
          data: {
            ...(Number.isFinite(subtotal) ? { subtotal } : {}),
            ...(Number.isFinite(discount) ? { discountAmount: discount } : {}),
            ...(Number.isFinite(shipping) ? { shippingAmount: shipping } : {}),
            ...(Number.isFinite(tax) ? { taxAmount: tax } : {}),
            amount: intent.amount,
            currency: STORE_CURRENCY_CODE,
            paymentMethod: 'stripe',
            paymentStatus: 'paid',
          },
          req: args.req,
          overrideAccess: true,
        })
      } catch (error) {
        args.req.payload.logger.error(error, 'Failed to attach checkout totals to order')
      }

      return result
    },
  }
}
