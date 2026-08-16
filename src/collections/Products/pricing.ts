import type { CollectionBeforeChangeHook, Field, RadioField } from 'payload'
import { APIError } from 'payload'

import { PRICE_FIELD } from '@/lib/currency'
import { resolvePricingMode } from '@/lib/pricing'

export const pricingModeField: RadioField = {
  name: 'pricingMode',
  type: 'radio',
  defaultValue: 'product',
  label: 'Pricing mode',
  options: [
    {
      label: 'Same price for all variants',
      value: 'product',
    },
    {
      label: 'Different price per variant',
      value: 'variant',
    },
  ],
  admin: {
    condition: (data) => Boolean(data?.enableVariants),
    description:
      'Product mode charges the product price for every variant. Variant mode requires a price on each variant and never falls back to the product price.',
    layout: 'horizontal',
  },
}

function usesProductLevelPrice(data: Record<string, unknown> | undefined): boolean {
  if (!data?.enableVariants) return true
  return resolvePricingMode({ pricingMode: data.pricingMode as 'product' | 'variant' | null }) ===
    'product'
}

function fieldTreeHasName(fields: Field[] | undefined, name: string): boolean {
  if (!fields) return false
  for (const field of fields) {
    if ('name' in field && field.name === name) return true
    if ('fields' in field && Array.isArray(field.fields) && fieldTreeHasName(field.fields, name)) {
      return true
    }
    if (field.type === 'tabs' && 'tabs' in field) {
      for (const tab of field.tabs) {
        if (fieldTreeHasName(tab.fields, name)) return true
      }
    }
  }
  return false
}

function isValidPrice(value: unknown): value is number {
  return typeof value === 'number' && !Number.isNaN(value) && value >= 0
}

/**
 * Insert pricingMode after enableVariants and show product price fields only
 * when the product price is the source of truth.
 */
export function mapProductPricingFields(fields: Field[]): Field[] {
  const result: Field[] = []

  for (const field of fields) {
    if (field.type === 'tabs' && 'tabs' in field) {
      result.push({
        ...field,
        tabs: field.tabs.map((tab) => ({
          ...tab,
          fields: mapProductPricingFields(tab.fields || []),
        })),
      } as Field)
      continue
    }

    if (
      (field.type === 'group' || field.type === 'row' || field.type === 'collapsible') &&
      'fields' in field
    ) {
      const mapped: Field = {
        ...field,
        fields: mapProductPricingFields(field.fields || []),
      }

      if (!('name' in field && field.name) && fieldTreeHasName(field.fields, PRICE_FIELD)) {
        mapped.admin = {
          ...field.admin,
          condition: (data) => usesProductLevelPrice(data),
        }
      }

      result.push(mapped)

      if ('name' in field && field.name === 'enableVariants') {
        result.push(pricingModeField)
      }
      continue
    }

    if ('name' in field && field.name === `${PRICE_FIELD}Enabled`) {
      result.push({
        ...field,
        defaultValue: true,
        admin: {
          ...field.admin,
          condition: (data, siblingData, context) => {
            if (!usesProductLevelPrice(data)) return false
            const existing = field.admin?.condition
            if (typeof existing === 'function') return existing(data, siblingData, context)
            return true
          },
        },
      } as Field)
      continue
    }

    if ('name' in field && field.name === PRICE_FIELD) {
      const existingCondition = field.admin?.condition
      result.push({
        ...field,
        required: false,
        admin: {
          ...field.admin,
          condition: (data, siblingData, context) => {
            if (!usesProductLevelPrice(data)) return false
            if (typeof existingCondition === 'function') {
              return existingCondition(data, siblingData, context)
            }
            return true
          },
          description:
            'Charged for every variant when Pricing mode is “Same price for all variants”. Amount is in paise (₹1,500.00 = 150000).',
        },
        validate: (value: unknown, { data }: { data?: Record<string, unknown> }) => {
          if (!usesProductLevelPrice(data) || data?._status !== 'published') return true
          if (!isValidPrice(value)) {
            return 'Product Price In INR is required when using the same price for all variants.'
          }
          return true
        },
      } as Field)
      continue
    }

    result.push(field)

    if ('name' in field && field.name === 'enableVariants') {
      result.push(pricingModeField)
    }
  }

  return result
}

export const validateProductPricing: CollectionBeforeChangeHook = async ({
  data,
  originalDoc,
  req,
}) => {
  if (!data) return data

  const enableVariants = Boolean(data.enableVariants)
  const pricingMode = resolvePricingMode({
    pricingMode: data.pricingMode as 'product' | 'variant' | null,
  })

  if (!enableVariants && data.pricingMode && data.pricingMode !== 'product') {
    data.pricingMode = 'product'
  }

  if (data._status !== 'published') return data

  if (usesProductLevelPrice(data) && !isValidPrice(data[PRICE_FIELD])) {
    throw new APIError(
      'Product Price In INR is required when using the same price for all variants.',
      400,
    )
  }

  if (!enableVariants || pricingMode !== 'variant') return data

  const productID = data.id ?? originalDoc?.id
  if (!productID) return data

  const variants = await req.payload.find({
    collection: 'variants',
    depth: 0,
    limit: 1000,
    overrideAccess: true,
    pagination: false,
    req,
    where: {
      and: [
        { product: { equals: productID } },
        { _status: { equals: 'published' } },
      ],
    },
  })

  const missing = variants.docs.filter((variant) => !isValidPrice(variant[PRICE_FIELD]))
  if (missing.length > 0) {
    throw new APIError(
      'Every published variant must have Price In INR when Pricing mode is “Different price per variant”.',
      400,
    )
  }

  return data
}
