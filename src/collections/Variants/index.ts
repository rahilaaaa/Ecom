import type { CollectionOverride } from '@payloadcms/plugin-ecommerce/types'
import type { CollectionBeforeChangeHook, Field, PayloadRequest } from 'payload'
import { APIError } from 'payload'

import { PRICE_FIELD } from '@/lib/currency'
import { resolvePricingMode } from '@/lib/pricing'

function isValidPrice(value: unknown): value is number {
  return typeof value === 'number' && !Number.isNaN(value) && value >= 0
}

async function parentPricingMode(args: {
  product: unknown
  req: PayloadRequest
}): Promise<'product' | 'variant'> {
  const productRef = args.product
  const productID =
    productRef && typeof productRef === 'object' && 'id' in productRef
      ? (productRef as { id: string | number }).id
      : productRef

  if (typeof productID !== 'string' && typeof productID !== 'number') return 'product'

  try {
    const product = await args.req.payload.findByID({
      id: productID,
      collection: 'products',
      depth: 0,
      overrideAccess: true,
      req: args.req,
      select: {
        enableVariants: true,
        pricingMode: true,
      },
    })
    return resolvePricingMode(product)
  } catch {
    return 'product'
  }
}

const validateVariantPrice: CollectionBeforeChangeHook = async ({ data, req }) => {
  if (!data || data._status !== 'published') return data

  const mode = await parentPricingMode({ product: data.product, req })
  if (mode !== 'variant') return data

  if (!isValidPrice(data[PRICE_FIELD])) {
    throw new APIError(
      'Price In INR is required for every published variant when the product uses per-variant pricing.',
      400,
    )
  }

  return data
}

/**
 * Keep INR price requirements and replace the ecommerce plugin's variant
 * options Field so Color/Size selections serialize into `options`.
 */
function mapVariantFields(fields: Field[]): Field[] {
  return fields.map((field): Field => {
    if (field.type === 'tabs' && 'tabs' in field) {
      return {
        ...field,
        tabs: field.tabs.map((tab) => ({
          ...tab,
          fields: mapVariantFields(tab.fields || []),
        })),
      } as Field
    }

    if (
      (field.type === 'group' || field.type === 'row' || field.type === 'collapsible') &&
      'fields' in field
    ) {
      return {
        ...field,
        fields: mapVariantFields(field.fields || []),
      } as Field
    }

    if ('name' in field && field.name === 'options' && field.type === 'relationship') {
      return {
        ...field,
        admin: {
          ...field.admin,
          components: {
            ...field.admin?.components,
            Field: {
              path: '@/components/admin/VariantOptionsSelector#VariantOptionsSelector',
            },
          },
        },
      } as Field
    }

    if ('name' in field && field.name === `${PRICE_FIELD}Enabled`) {
      return {
        ...field,
        defaultValue: true,
        admin: {
          ...('admin' in field ? field.admin : {}),
          hidden: true,
        },
      } as Field
    }

    if ('name' in field && field.name === PRICE_FIELD) {
      const existingField = field.admin?.components?.Field
      const existingClientProps =
        existingField && typeof existingField === 'object' && 'clientProps' in existingField
          ? existingField.clientProps
          : undefined

      return {
        ...field,
        required: false,
        admin: {
          ...('admin' in field ? field.admin : {}),
          components: {
            ...field.admin?.components,
            Field: {
              clientProps: existingClientProps,
              path: '@/components/admin/VariantPriceField#VariantPriceField',
            },
          },
          description:
            'Required when the parent product uses per-variant pricing. Amount is in paise (₹1,500.00 = 150000).',
        },
        validate: async (
          value: unknown,
          { data, req }: { data?: { product?: unknown; _status?: string | null }; req: PayloadRequest },
        ) => {
          if (!data || data._status !== 'published') return true
          const mode = await parentPricingMode({ product: data.product, req })
          if (mode !== 'variant') return true
          if (!isValidPrice(value)) {
            return 'Price In INR is required for every published variant when the product uses per-variant pricing.'
          }
          return true
        },
      } as Field
    }

    return field
  })
}

export const VariantsCollection: CollectionOverride = ({ defaultCollection }) => ({
  ...defaultCollection,
  admin: {
    ...defaultCollection.admin,
    defaultColumns: ['title', 'product', PRICE_FIELD, 'inventory', '_status'],
  },
  fields: mapVariantFields(defaultCollection.fields || []),
  hooks: {
    ...defaultCollection.hooks,
    beforeChange: [...(defaultCollection.hooks?.beforeChange || []), validateVariantPrice],
  },
})
