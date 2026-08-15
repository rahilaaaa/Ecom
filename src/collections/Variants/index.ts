import type { CollectionOverride } from '@payloadcms/plugin-ecommerce/types'
import type { Field } from 'payload'

import { PRICE_FIELD } from '@/lib/currency'

/**
 * Ensure Price In INR is enabled by default and required on variants.
 * Walks the ecommerce plugin price field groups without removing other fields.
 */
function requireInrPriceFields(fields: Field[]): Field[] {
  return fields.map((field): Field => {
    if (field.type === 'tabs' && 'tabs' in field) {
      return {
        ...field,
        tabs: field.tabs.map((tab) => ({
          ...tab,
          fields: requireInrPriceFields(tab.fields || []),
        })),
      } as Field
    }

    if (
      (field.type === 'group' || field.type === 'row' || field.type === 'collapsible') &&
      'fields' in field
    ) {
      return {
        ...field,
        fields: requireInrPriceFields(field.fields || []),
      } as Field
    }

    if ('name' in field && field.name === `${PRICE_FIELD}Enabled`) {
      return {
        ...field,
        defaultValue: true,
        admin: {
          ...('admin' in field ? field.admin : {}),
          description: 'INR is the store currency. Keep this enabled and set Price In INR.',
        },
      } as Field
    }

    if ('name' in field && field.name === PRICE_FIELD) {
      return {
        ...field,
        required: true,
        admin: {
          ...('admin' in field ? field.admin : {}),
          description:
            'Required unit price in paise (smallest INR unit). Example: ₹1,500.00 = 150000.',
        },
        validate: (value: unknown) => {
          if (typeof value !== 'number' || Number.isNaN(value)) {
            return 'Price In INR is required for every product variant.'
          }
          if (value < 0) {
            return 'Price In INR cannot be negative.'
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
  fields: requireInrPriceFields(defaultCollection.fields || []),
})
