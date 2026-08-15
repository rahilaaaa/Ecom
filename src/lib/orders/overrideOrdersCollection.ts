import type { CollectionBeforeChangeHook, CollectionConfig, Field } from 'payload'

import type { Product, Variant } from '@/payload-types'
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
        const price =
          typeof variant?.priceInUSD === 'number'
            ? variant.priceInUSD
            : typeof product?.priceInUSD === 'number'
              ? product.priceInUSD
              : null
        if (typeof price === 'number') next.unitPrice = price
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
        const unit = typeof item.unitPrice === 'number' ? item.unitPrice : 0
        const qty = typeof item.quantity === 'number' ? item.quantity : 0
        return sum + unit * qty
      }, 0)
      if (subtotal > 0) data.subtotal = subtotal
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

  if (data.shippingAmount == null && typeof data.subtotal === 'number' && data.subtotal >= 15000) {
    data.shippingAmount = 0
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
        name: 'taxAmount',
        type: 'number',
        admin: {
          description: 'Tax charged at purchase (smallest currency unit).',
          position: 'sidebar',
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
