import { getPayload, type Payload } from 'payload'
import config from '@/payload.config'
import { beforeAll, describe, expect, it } from 'vitest'

import { getEffectivePrice } from '@/lib/currency'
import { getAvailableInventory, getStockStatus } from '@/lib/product/inventory'
import { getProductGalleryItems } from '@/lib/product/media'
import { getCartItemPayload, validatePurchase } from '@/lib/product/purchase'
import { filterGalleryByColor } from '@/lib/product/variantGallery'
import {
  buildVariantOptionGroups,
  canSelectOption,
  getOptionAvailability,
  optionId,
  type VariantTypeGroup,
} from '@/lib/product/variants'
import type { Product, Variant, VariantOption } from '@/payload-types'

let payload: Payload
let product: Product | null = null

describe('PDP live Payload catalog', () => {
  beforeAll(async () => {
    payload = await getPayload({ config })
    const result = await payload.find({
      collection: 'products',
      depth: 3,
      draft: false,
      limit: 1,
      pagination: false,
      where: { _status: { equals: 'published' } },
    })

    const doc = result.docs[0]
    if (!doc) return

    if (!doc.enableVariants) {
      product = doc
      return
    }

    const variants = await payload.find({
      collection: 'variants',
      depth: 2,
      draft: false,
      limit: 1000,
      pagination: false,
      where: {
        and: [{ product: { equals: doc.id } }, { _status: { equals: 'published' } }],
      },
    })

    product = {
      ...doc,
      variants: {
        docs: variants.docs,
        hasNextPage: false,
        totalDocs: variants.docs.length,
      },
    }
  }, 60000)

  it('loads a published product', () => {
    expect(product).toBeTruthy()
  })

  it('never exposes global variant-type options that the product variants do not use', () => {
    if (!product?.enableVariants) return

    const groups = buildVariantOptionGroups(product)
    const usedOptionIds = new Set(
      (product.variants?.docs || [])
        .filter((variant): variant is Variant => typeof variant === 'object' && Boolean(variant))
        .flatMap((variant) => (variant.options || []).map((option) => optionId(option))),
    )

    for (const type of product.variantTypes || []) {
      if (typeof type !== 'object' || !type) continue
      const globalLabels = (type.options?.docs || [])
        .filter((option): option is VariantOption => typeof option === 'object' && option !== null)
        .map((option) => option.label)

      const group = groups.find((item) => item.name === type.name)
      const shown = group?.options.map((option) => option.label) || []

      for (const option of group?.options || []) {
        expect(usedOptionIds.has(option.id)).toBe(true)
      }

      // Any global option not used by this product must not appear on the PDP.
      for (const option of type.options?.docs || []) {
        const id = optionId(option)
        if (id && !usedOptionIds.has(id)) {
          expect(shown).not.toContain(typeof option === 'object' && option ? option.label : id)
        }
      }

      expect(globalLabels.length).toBeGreaterThanOrEqual(shown.length)
    }
  })

  it('constrains sizes to combinations that exist for the selected color', () => {
    if (!product?.enableVariants) return

    const groups = buildVariantOptionGroups(product)
    const colorGroup = groups.find((group) => group.isColor)
    const sizeGroup = groups.find((group) => group.isSize)
    if (!colorGroup || !sizeGroup) return

    for (const color of colorGroup.options) {
      for (const size of sizeGroup.options) {
        const availability = getOptionAvailability({
          product,
          optionId: size.id,
          selectedOptionIds: [color.id],
        })
        const expected = Boolean(
          findLiveVariant(product, [color.id, size.id]),
        )
        expect(availability.exists).toBe(expected)
        expect(canSelectOption(availability)).toBe(expected)
      }
    }
  })

  it('uses product-level price when pricingMode is product', () => {
    if (!product?.enableVariants || product.pricingMode === 'variant') return

    const variants = (product.variants?.docs || []).filter(
      (variant): variant is Variant => typeof variant === 'object' && Boolean(variant),
    )
    expect(variants.length).toBeGreaterThan(0)

    for (const variant of variants) {
      expect(
        getEffectivePrice({ product, variant, enableVariants: true }),
      ).toBe(product.priceInINR)
    }
  })

  it('reads inventory from the selected variant and blocks out-of-stock purchases', () => {
    if (!product?.enableVariants) return

    const variants = (product.variants?.docs || []).filter(
      (variant): variant is Variant => typeof variant === 'object' && Boolean(variant),
    )
    const oos = variants.find((variant) => (variant.inventory || 0) <= 0)
    const inStock = variants.find((variant) => (variant.inventory || 0) > 0)

    if (inStock) {
      expect(getAvailableInventory(product, inStock)).toBe(inStock.inventory)
      expect(getStockStatus(product, inStock)).not.toBe('out-of-stock')
      expect(validatePurchase({ product, selectedVariant: inStock, quantity: 1 }).ok).toBe(true)
      expect(getCartItemPayload({ product, selectedVariant: inStock }).variant).toBe(inStock.id)
    }

    if (oos) {
      expect(getStockStatus(product, oos)).toBe('out-of-stock')
      const blocked = validatePurchase({ product, selectedVariant: oos, quantity: 1 })
      expect(blocked.ok).toBe(false)
      if (!blocked.ok) expect(blocked.reason).toBe('out-of-stock')
    }
  })

  it('renders only valid gallery media and can filter by color', () => {
    if (!product) return

    const gallery = getProductGalleryItems(product)
    for (const item of gallery) {
      expect(Boolean(item.image.url || item.image.filename)).toBe(true)
    }

    const groups = buildVariantOptionGroups(product)
    const colorGroup = groups.find((group: VariantTypeGroup) => group.isColor)
    if (!colorGroup || gallery.length <= 1) return

    for (const color of colorGroup.options) {
      const visible = filterGalleryByColor(gallery, color.id)
      expect(visible.length).toBeGreaterThan(0)
      expect(visible.every((item) => item.image.id)).toBe(true)
    }
  })
})

function findLiveVariant(product: Product, optionIds: string[]): Variant | undefined {
  return (product.variants?.docs || []).find((variant) => {
    if (typeof variant !== 'object' || !variant?.options) return false
    const ids = variant.options.map((option) => optionId(option))
    return optionIds.every((id) => ids.includes(id))
  }) as Variant | undefined
}
