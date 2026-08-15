import type { CollectionBeforeChangeHook, CollectionConfig, Field } from 'payload'
import { APIError } from 'payload'

import type { Product, Variant } from '@/payload-types'
import { getLineUnitPrice, getUnitPrice } from '@/lib/currency'
import { DEFAULT_SHIPPING_METHOD, calculateShippingAmount } from '@/lib/checkout/shippingConfig'
import { addBusinessDays } from '@/lib/orders/deliveryEstimate'

function enrichFields(fields: Field[]): Field[] {
  return fields.map((field) => {
    if (field.type === 'tabs' && 'tabs' in field) {
      return {
        ...field,
        tabs: field.tabs.map((tab) => ({
          ...tab,
          fields: enrichFields(tab.fields || []),
        })),
      }
    }

    if ('name' in field && field.name === 'items' && field.type === 'array') {
      return {
        ...field,
        fields: [
          ...(field.fields || []),
          {
            name: 'unitPrice',
            type: 'number',
            admin: {
              description: 'Unit price captured at purchase time (smallest currency unit).',
              readOnly: true,
            },
          },
          {
            name: 'productTitle',
            type: 'text',
            admin: {
              description: 'Product title snapshot at purchase.',
              readOnly: true,
            },
          },
          {
            name: 'variantLabel',
            type: 'text',
            admin: {
              description: 'Variant / options label snapshot at purchase.',
              readOnly: true,
            },
          },
        ],
      }
    }

    return field
  })
}

const snapshotOrderPricing: CollectionBeforeChangeHook = async ({ data, req, operation }) => {
  if (!data || (operation !== 'create' && operation !== 'update')) return data

  const items = Array.isArray(data.items) ? [...data.items] : []

  if (items.length > 0) {
    const nextItems = []

    for (const item of items) {
      const next = { ...item }
      const productID = typeof item.product === 'object' ? item.product?.id : item.product
      const variantID = typeof item.variant === 'object' ? item.variant?.id : item.variant

      let product: Product | null =
        item.product && typeof item.product === 'object' ? (item.product as Product) : null
      let variant: Variant | null =
        item.variant && typeof item.variant === 'object' ? (item.variant as Variant) : null

      if ((!product || !next.productTitle || next.unitPrice == null) && productID) {
        try {
          product = (await req.payload.findByID({
            collection: 'products',
            id: productID,
            depth: 1,
            req,
            overrideAccess: true,
          })) as Product
        } catch {
          // keep existing product reference if fetch fails
        }
      }

      if ((!variant || !next.variantLabel) && variantID) {
        try {
          variant = (await req.payload.findByID({
            collection: 'variants',
            id: variantID,
            depth: 1,
            req,
            overrideAccess: true,
          })) as Variant
        } catch {
          // keep existing variant reference if fetch fails
        }
      }

      if (next.unitPrice == null) {
        const usesVariant = Boolean(variantID && (variant || product?.enableVariants))
        if (usesVariant) {
          if (!variant) {
            throw new APIError('Order item is missing a valid product variant.', 400)
          }
          const price = getUnitPrice(variant)
          if (typeof price !== 'number') {
            throw new APIError(
              `Variant "${variant.title || variant.id}" is missing Price In INR.`,
              400,
            )
          }
          next.unitPrice = price
        } else {
          const price = getLineUnitPrice({
            product,
            variant: null,
            enableVariants: false,
          })
          if (typeof price !== 'number') {
            throw new APIError(
              `Product "${product?.title || productID}" is missing Price In INR.`,
              400,
            )
          }
          next.unitPrice = price
        }
      }

      if (!next.productTitle && product?.title) {
        next.productTitle = product.title
      }

      if (!next.variantLabel && variant) {
        const labels =
          variant.options
            ?.map((option) => (typeof option === 'object' ? option.label : null))
            .filter(Boolean) || []
        next.variantLabel = labels.length ? labels.join(' · ') : variant.title || undefined
      }

      nextItems.push(next)
    }

    data.items = nextItems

    if (data.subtotal == null) {
      const subtotal = nextItems.reduce((sum: number, item) => {
        if (typeof item.unitPrice !== 'number') {
          throw new APIError('Order item is missing a captured unit price.', 400)
        }
        const qty = typeof item.quantity === 'number' ? item.quantity : 0
        return sum + item.unitPrice * qty
      }, 0)
      data.subtotal = subtotal
    }
  }

  if (!data.estimatedDeliveryFrom || !data.estimatedDeliveryTo) {
    const base = data.createdAt ? new Date(data.createdAt) : new Date()
    if (!data.estimatedDeliveryFrom) {
      data.estimatedDeliveryFrom = addBusinessDays(base, 3).toISOString()
    }
    if (!data.estimatedDeliveryTo) {
      data.estimatedDeliveryTo = addBusinessDays(base, 5).toISOString()
    }
  }

  if (data.shippingAmount == null) {
    const subtotalPaise = typeof data.subtotal === 'number' ? data.subtotal : 0
    data.shippingAmount = calculateShippingAmount({
      subtotalAfterDiscountPaise: Math.max(
        0,
        subtotalPaise - (typeof data.discountAmount === 'number' ? data.discountAmount : 0),
      ),
      methodId: DEFAULT_SHIPPING_METHOD,
    })
  }

  if (data.taxAmount == null) {
    data.taxAmount = 0
  }

  return data
}

export function overrideOrdersCollection(defaultCollection: CollectionConfig): CollectionConfig {
  const existingHooks = defaultCollection.hooks || {}

  return {
    ...defaultCollection,
    fields: [
      ...enrichFields(defaultCollection.fields),
      {
        name: 'subtotal',
        type: 'number',
        admin: {
          description: 'Items subtotal at purchase (smallest currency unit).',
          position: 'sidebar',
          readOnly: true,
        },
      },
      {
        name: 'shippingAmount',
        type: 'number',
        admin: {
          description: 'Shipping charged at purchase (smallest currency unit).',
          position: 'sidebar',
        },
      },
      {
        name: 'discountAmount',
        type: 'number',
        admin: {
          description: 'Discount applied at purchase (smallest currency unit).',
          position: 'sidebar',
          readOnly: true,
        },
      },
      {
        name: 'taxAmount',
        type: 'number',
        admin: {
          description: 'Tax charged at purchase (smallest currency unit). Unimplemented until GST rules are defined.',
          position: 'sidebar',
        },
      },
      {
        name: 'paymentMethod',
        type: 'select',
        options: [
          { label: 'Cash on Delivery', value: 'cod' },
          { label: 'Online (Stripe)', value: 'stripe' },
        ],
        admin: {
          description: 'How the customer chose to pay.',
          position: 'sidebar',
        },
      },
      {
        name: 'paymentStatus',
        type: 'select',
        defaultValue: 'pending',
        options: [
          { label: 'Pending', value: 'pending' },
          { label: 'Paid', value: 'paid' },
          { label: 'Failed', value: 'failed' },
          { label: 'Refunded', value: 'refunded' },
        ],
        admin: {
          description: 'COD stays pending until cash is collected. Online is paid after Stripe success.',
          position: 'sidebar',
        },
      },
      {
        name: 'checkoutIdempotencyKey',
        type: 'text',
        unique: true,
        index: true,
        admin: {
          description: 'Prevents duplicate COD/checkout submissions.',
          position: 'sidebar',
          readOnly: true,
        },
      },
      {
        name: 'estimatedDeliveryFrom',
        type: 'date',
        admin: {
          date: { pickerAppearance: 'dayOnly' },
          position: 'sidebar',
        },
      },
      {
        name: 'estimatedDeliveryTo',
        type: 'date',
        admin: {
          date: { pickerAppearance: 'dayOnly' },
          position: 'sidebar',
        },
      },
      {
        name: 'accessToken',
        type: 'text',
        unique: true,
        index: true,
        admin: {
          position: 'sidebar',
          readOnly: true,
        },
        hooks: {
          beforeValidate: [
            ({ value, operation }) => {
              if (operation === 'create' || !value) {
                return crypto.randomUUID()
              }
              return value
            },
          ],
        },
      },
    ],
    hooks: {
      ...existingHooks,
      beforeChange: [...(existingHooks.beforeChange || []), snapshotOrderPricing],
    },
  }
}
