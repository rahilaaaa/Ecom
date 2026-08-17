import { describe, expect, it } from 'vitest'

import { getEffectivePrice } from '@/lib/currency'
import { getAvailableInventory, getStockStatus } from '@/lib/product/inventory'
import { getProductGalleryItems } from '@/lib/product/media'
import { getCartItemPayload, validatePurchase } from '@/lib/product/purchase'
import {
  buildParamsForColorChange,
  buildVariantOptionGroups,
  canSelectOption,
  getOptionAvailability,
  resolveVariantFromSearchParams,
} from '@/lib/product/variants'
import type { Media, Product, Variant, VariantOption, VariantType } from '@/payload-types'

function option(id: number, label: string, typeId: number): VariantOption {
  return {
    id,
    label,
    value: label.toLowerCase(),
    variantType: typeId,
    updatedAt: '',
    createdAt: '',
  }
}

function type(id: number, name: string, label: string, options: VariantOption[]): VariantType {
  return {
    id,
    name,
    label,
    options: { docs: options },
    updatedAt: '',
    createdAt: '',
  }
}

function variant(
  id: number,
  optionIds: number[],
  extras: Partial<Pick<Variant, 'inventory' | 'priceInINR'>> = {},
): Variant {
  return {
    id,
    product: 1,
    options: optionIds,
    inventory: extras.inventory ?? 5,
    priceInINR: extras.priceInINR,
    updatedAt: '',
    createdAt: '',
    _status: 'published',
  }
}

function product(args: {
  id?: number
  enableVariants?: boolean
  pricingMode?: Product['pricingMode']
  types?: VariantType[]
  variants?: Variant[]
  inventory?: number
  priceInINR?: number
  gallery?: Product['gallery']
}): Product {
  return {
    id: args.id ?? 1,
    title: 'QA Product',
    slug: 'qa-product',
    enableVariants: args.enableVariants ?? true,
    pricingMode: args.pricingMode,
    variantTypes: args.types || [],
    variants: { docs: args.variants || [] },
    inventory: args.inventory,
    priceInINR: args.priceInINR,
    gallery: args.gallery,
    updatedAt: '',
    createdAt: '',
  }
}

const GLOBAL_COLORS = [
  option(101, 'Pink', 10),
  option(102, 'Black', 10),
  option(103, 'Gray', 10),
  option(104, 'Green', 10),
  option(105, 'White', 10),
]
const GLOBAL_SIZES = [
  option(201, 'S', 20),
  option(202, 'M', 20),
  option(203, 'L', 20),
  option(204, 'XL', 20),
]
const colorType = type(10, 'color', 'Color', GLOBAL_COLORS)
const sizeType = type(20, 'size', 'Size', GLOBAL_SIZES)

function sizeAvailability(p: Product, colorId: string) {
  const sizes = buildVariantOptionGroups(p).find((group) => group.name === 'size')
  return Object.fromEntries(
    (sizes?.options || []).map((opt) => {
      const availability = getOptionAvailability({
        product: p,
        optionId: opt.id,
        selectedOptionIds: [colorId],
      })
      return [opt.label, { ...availability, selectable: canSelectOption(availability) }]
    }),
  )
}

describe('PDP QA — Test 1 simple variant matrix', () => {
  it('shows only Black and M/L/XL even when global Color/Size options exist', () => {
    const p = product({
      types: [colorType, sizeType],
      variants: [
        variant(1, [102, 202]),
        variant(2, [102, 203]),
        variant(3, [102, 204]),
      ],
    })

    const groups = buildVariantOptionGroups(p)
    expect(groups.map((group) => group.label)).toEqual(['Color', 'Size'])
    expect(groups[0]?.options.map((opt) => opt.label)).toEqual(['Black'])
    expect(groups[1]?.options.map((opt) => opt.label)).toEqual(['M', 'L', 'XL'])
    expect(groups[0]?.options.map((opt) => opt.label)).not.toEqual(
      expect.arrayContaining(['Pink', 'Gray', 'Green', 'White']),
    )
    expect(groups[1]?.options.map((opt) => opt.label)).not.toContain('S')
  })
})

describe('PDP QA — Test 2 dependent options', () => {
  const p = product({
    types: [colorType, sizeType],
    variants: [
      variant(1, [102, 202]),
      variant(2, [102, 203]),
      variant(3, [105, 201]),
      variant(4, [105, 202]),
    ],
  })

  it('only allows sizes that exist for the selected color', () => {
    const black = sizeAvailability(p, '102')
    expect(black.M).toMatchObject({ exists: true, selectable: true })
    expect(black.L).toMatchObject({ exists: true, selectable: true })
    expect(black.S).toMatchObject({ exists: false, selectable: false })
    expect(black.XL).toBeUndefined()

    const white = sizeAvailability(p, '105')
    expect(white.S).toMatchObject({ exists: true, selectable: true })
    expect(white.M).toMatchObject({ exists: true, selectable: true })
    expect(white.L).toMatchObject({ exists: false, selectable: false })
  })

  it('clears L from the URL when switching from Black to White', () => {
    const next = buildParamsForColorChange({
      product: p,
      colorTypeName: 'color',
      nextColorOptionId: '105',
      currentParams: new URLSearchParams({ color: '102', size: '203', variant: '2' }),
    })

    expect(next.get('color')).toBe('105')
    expect(next.get('size')).not.toBe('203')
    expect(['201', '202']).toContain(next.get('size'))
    const resolved = resolveVariantFromSearchParams(p, next)
    expect(resolved).toBeDefined()
    expect(resolved?.options).toEqual(expect.arrayContaining([105]))
    expect(resolved?.options).not.toContain(203)
  })

  it('does not keep a stale Black+L variant when option params say White', () => {
    const params = new URLSearchParams({ color: '105', size: '203', variant: '2' })
    expect(resolveVariantFromSearchParams(p, params)).toBeUndefined()
  })
})

describe('PDP QA — Test 3 per-variant pricing', () => {
  const p = product({
    pricingMode: 'variant',
    priceInINR: 999999,
    types: [colorType, sizeType],
    variants: [
      variant(1, [102, 202], { priceInINR: 100000, inventory: 5 }),
      variant(2, [102, 203], { priceInINR: 120000, inventory: 5 }),
      variant(3, [102, 204], { priceInINR: 140000, inventory: 5 }),
    ],
  })

  it('changes the effective price with the selected variant and never uses the product price', () => {
    expect(
      getEffectivePrice({ product: p, variant: p.variants?.docs?.[0] as Variant, enableVariants: true }),
    ).toBe(100000)
    expect(
      getEffectivePrice({ product: p, variant: p.variants?.docs?.[1] as Variant, enableVariants: true }),
    ).toBe(120000)
    expect(
      getEffectivePrice({ product: p, variant: p.variants?.docs?.[2] as Variant, enableVariants: true }),
    ).toBe(140000)
  })

  it('sends the selected variant ID to cart', () => {
    const selected = p.variants?.docs?.[1] as Variant
    expect(getCartItemPayload({ product: p, selectedVariant: selected })).toEqual({
      product: 1,
      variant: 2,
    })
  })
})

describe('PDP QA — Test 4 same-price variants', () => {
  it('uses the product price for every variant', () => {
    const p = product({
      pricingMode: 'product',
      priceInINR: 250000,
      types: [colorType, sizeType],
      variants: [
        variant(1, [102, 202], { priceInINR: 100000 }),
        variant(2, [102, 203], { priceInINR: 120000 }),
        variant(3, [102, 204], { priceInINR: 140000 }),
      ],
    })

    for (const doc of p.variants?.docs || []) {
      expect(
        getEffectivePrice({
          product: p,
          variant: doc as Variant,
          enableVariants: true,
        }),
      ).toBe(250000)
    }
  })
})

describe('PDP QA — Test 5 inventory', () => {
  const p = product({
    types: [colorType, sizeType],
    variants: [
      variant(1, [102, 202], { inventory: 3 }),
      variant(2, [102, 203], { inventory: 10 }),
      variant(3, [102, 204], { inventory: 0 }),
    ],
  })
  const [m, l, xl] = (p.variants?.docs || []) as Variant[]

  it('reports low stock, in-range stock, and out of stock from the selected variant', () => {
    expect(getAvailableInventory(p, m)).toBe(3)
    expect(getStockStatus(p, m)).toBe('low')
    expect(getAvailableInventory(p, l)).toBe(10)
    expect(getStockStatus(p, l)).toBe('low')
    expect(getAvailableInventory(p, xl)).toBe(0)
    expect(getStockStatus(p, xl)).toBe('out-of-stock')
  })

  it('keeps XL selectable so out-of-stock can be shown, but blocks cart and buy now', () => {
    const availability = getOptionAvailability({
      product: p,
      optionId: '204',
      selectedOptionIds: ['102'],
    })
    expect(canSelectOption(availability)).toBe(true)
    expect(availability.inStock).toBe(false)

    const blocked = validatePurchase({ product: p, selectedVariant: xl, quantity: 1 })
    expect(blocked.ok).toBe(false)
    if (!blocked.ok) expect(blocked.reason).toBe('out-of-stock')
  })

  it('rejects quantity above remaining inventory', () => {
    expect(validatePurchase({ product: p, selectedVariant: m, quantity: 3 }).ok).toBe(true)
    const over = validatePurchase({ product: p, selectedVariant: m, quantity: 4 })
    expect(over.ok).toBe(false)
    if (!over.ok) expect(over.reason).toBe('quantity')
  })
})

describe('PDP QA — Test 6 no variants', () => {
  const p = product({
    enableVariants: false,
    types: [colorType, sizeType],
    variants: [variant(1, [102, 202])],
    priceInINR: 180000,
    inventory: 8,
  })

  it('hides variant UI and uses product-level price, inventory, and cart payload', () => {
    expect(buildVariantOptionGroups(p)).toEqual([])
    expect(getEffectivePrice({ product: p, variant: p.variants?.docs?.[0] as Variant })).toBe(180000)
    expect(getStockStatus(p)).toBe('low')
    expect(getAvailableInventory(p)).toBe(8)
    expect(validatePurchase({ product: p, quantity: 2 }).ok).toBe(true)
    expect(getCartItemPayload({ product: p })).toEqual({ product: 1, variant: undefined })
  })
})

describe('PDP QA — Test 7 gallery', () => {
  it('renders only media with a usable url or filename', () => {
    const p = product({
      enableVariants: false,
      gallery: [
        { id: '1', image: { id: 1, alt: 'One', url: '/one.jpg', updatedAt: '', createdAt: '' } as Media },
        { id: '2', image: { id: 2, alt: 'Broken', updatedAt: '', createdAt: '' } as Media },
        { id: '3', image: { id: 3, alt: 'File', filename: 'three.jpg', updatedAt: '', createdAt: '' } as Media },
        { id: '4', image: 99 },
      ],
    })

    const items = getProductGalleryItems(p)
    expect(items.map((item) => item.image.id)).toEqual([1, 3])
  })

  it('returns an empty gallery when no valid media exists', () => {
    expect(getProductGalleryItems(product({ enableVariants: false, gallery: [] }))).toEqual([])
    expect(getProductGalleryItems(product({ enableVariants: false, gallery: null }))).toEqual([])
  })
})
