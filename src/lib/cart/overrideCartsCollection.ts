import type { CollectionAfterReadHook, CollectionBeforeChangeHook, CollectionConfig, Payload, PayloadRequest } from 'payload'
import { APIError } from 'payload'

import { getEffectivePrice, PRICE_FIELD } from '@/lib/currency'

type CartItem = {
  product?: unknown
  variant?: unknown
  quantity?: number | null
}

function relationID(value: unknown): string | number | null {
  if (value == null) return null
  if (typeof value === 'object' && value && 'id' in value) {
    return (value as { id: string | number }).id
  }
  if (typeof value === 'string' || typeof value === 'number') return value
  return null
}

function lineQuantity(value: unknown): number {
  const quantity = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(quantity) && quantity > 0 ? quantity : 0
}

export async function calculateCartSubtotal(args: {
  payload: Payload
  items: CartItem[] | null | undefined
  req?: PayloadRequest
}): Promise<number | null> {
  const { payload, items, req } = args
  if (!items?.length) return 0

  let subtotal = 0

  for (const item of items) {
    const quantity = lineQuantity(item.quantity)
    const productID = relationID(item.product)
    if (productID == null) return null

    const product = await payload.findByID({
      id: productID,
      collection: 'products',
      depth: 0,
      overrideAccess: true,
      req,
      select: {
        enableVariants: true,
        pricingMode: true,
        priceInINR: true,
      },
    })

    const variantID = relationID(item.variant)
    const variant = variantID
      ? await payload.findByID({
          id: variantID,
          collection: 'variants',
          depth: 0,
          overrideAccess: true,
          req,
          select: {
            [PRICE_FIELD]: true,
          },
        })
      : null

    const unitPrice = getEffectivePrice({
      product,
      variant,
      enableVariants: Boolean(product.enableVariants && variant),
    })

    if (typeof unitPrice !== 'number') {
      return null
    }

    subtotal += unitPrice * quantity
  }

  return subtotal
}

export const persistCartSubtotal: CollectionBeforeChangeHook = async ({ data, req }) => {
  if (!data) return data
  if (!Array.isArray(data.items)) {
    data.subtotal = 0
    return data
  }

  const subtotal = await calculateCartSubtotal({
    payload: req.payload,
    items: data.items,
    req,
  })

  if (subtotal == null) {
    throw new APIError(
      'A cart item is missing its effective price. Check the product pricing mode and variant prices.',
      400,
    )
  }

  data.subtotal = subtotal
  return data
}

export const exposeCartSubtotal: CollectionAfterReadHook = async ({ doc, req }) => {
  if (!doc || !Array.isArray(doc.items) || doc.items.length === 0) return doc

  const subtotal = await calculateCartSubtotal({
    payload: req.payload,
    items: doc.items,
    req,
  })

  if (typeof subtotal === 'number') {
    doc.subtotal = subtotal
  }

  return doc
}

export function overrideCartsCollection(defaultCollection: CollectionConfig): CollectionConfig {
  const existingHooks = defaultCollection.hooks || {}

  return {
    ...defaultCollection,
    hooks: {
      ...existingHooks,
      afterRead: [...(existingHooks.afterRead || []), exposeCartSubtotal],
      beforeChange: [...(existingHooks.beforeChange || []), persistCartSubtotal],
    },
  }
}
