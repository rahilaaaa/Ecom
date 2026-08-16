import { describe, expect, it } from 'vitest'

import {
  getEffectivePrice,
  getEffectivePriceRange,
  getLineUnitPrice,
  resolvePricingMode,
  usesVariantPricing,
} from '@/lib/pricing'

const productPrice = 150000
const variantPrice = 160000

describe('getEffectivePrice', () => {
  it('uses the product price in product mode even when the variant has a different price', () => {
    expect(
      getEffectivePrice({
        product: { pricingMode: 'product', enableVariants: true, priceInINR: productPrice },
        variant: { priceInINR: variantPrice },
      }),
    ).toBe(productPrice)
  })

  it('uses the variant price in variant mode', () => {
    expect(
      getEffectivePrice({
        product: { pricingMode: 'variant', enableVariants: true, priceInINR: productPrice },
        variant: { priceInINR: variantPrice },
      }),
    ).toBe(variantPrice)
  })

  it('does not fall back to the product price when variant pricing is enabled and the variant price is missing', () => {
    expect(
      getEffectivePrice({
        product: { pricingMode: 'variant', enableVariants: true, priceInINR: productPrice },
        variant: {},
      }),
    ).toBeNull()

    expect(
      getEffectivePrice({
        product: { pricingMode: 'variant', enableVariants: true, priceInINR: productPrice },
        variant: { priceInINR: null },
      }),
    ).toBeNull()
  })

  it('treats a missing pricingMode as product-level pricing', () => {
    expect(resolvePricingMode({})).toBe('product')
    expect(
      getEffectivePrice({
        product: { enableVariants: true, priceInINR: productPrice },
        variant: { priceInINR: variantPrice },
      }),
    ).toBe(productPrice)
  })

  it('uses the product price when variants are disabled', () => {
    expect(
      getEffectivePrice({
        product: { pricingMode: 'variant', enableVariants: false, priceInINR: productPrice },
        variant: { priceInINR: variantPrice },
      }),
    ).toBe(productPrice)
  })

  it('uses the product price when no variant is selected', () => {
    expect(
      getEffectivePrice({
        product: { pricingMode: 'variant', enableVariants: true, priceInINR: productPrice },
      }),
    ).toBe(productPrice)
  })

  it('treats 0 as a valid price', () => {
    expect(
      getEffectivePrice({
        product: { pricingMode: 'product', priceInINR: 0 },
      }),
    ).toBe(0)
  })
})

describe('getLineUnitPrice', () => {
  it('is the same function as getEffectivePrice', () => {
    const args = {
      product: { pricingMode: 'product' as const, enableVariants: true, priceInINR: productPrice },
      variant: { priceInINR: variantPrice },
      enableVariants: true,
    }
    expect(getLineUnitPrice(args)).toBe(getEffectivePrice(args))
    expect(getLineUnitPrice(args)).toBe(productPrice)
  })
})

describe('getEffectivePriceRange', () => {
  it('does not invent a range in product mode', () => {
    expect(
      getEffectivePriceRange({
        pricingMode: 'product',
        enableVariants: true,
        priceInINR: productPrice,
        variants: {
          docs: [{ priceInINR: 150000 }, { priceInINR: 160000 }],
        },
      }),
    ).toEqual({
      amount: productPrice,
      lowestAmount: productPrice,
      highestAmount: productPrice,
      hasRange: false,
    })
  })

  it('uses variant min/max in variant mode without falling back to the product price', () => {
    expect(
      getEffectivePriceRange({
        pricingMode: 'variant',
        enableVariants: true,
        priceInINR: 999999,
        variants: {
          docs: [{ priceInINR: 145000 }, { priceInINR: 160000 }],
        },
      }),
    ).toEqual({
      amount: 145000,
      lowestAmount: 145000,
      highestAmount: 160000,
      hasRange: true,
    })
  })

  it('returns nulls in variant mode when no variant has a price', () => {
    expect(
      getEffectivePriceRange({
        pricingMode: 'variant',
        enableVariants: true,
        priceInINR: productPrice,
        variants: { docs: [{}, { priceInINR: null }] },
      }),
    ).toEqual({
      amount: null,
      lowestAmount: null,
      highestAmount: null,
      hasRange: false,
    })
  })
})

describe('usesVariantPricing', () => {
  it('requires both variants enabled and variant mode', () => {
    expect(usesVariantPricing({ enableVariants: true, pricingMode: 'variant' })).toBe(true)
    expect(usesVariantPricing({ enableVariants: false, pricingMode: 'variant' })).toBe(false)
    expect(usesVariantPricing({ enableVariants: true, pricingMode: 'product' })).toBe(false)
  })
})
