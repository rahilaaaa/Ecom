import { describe, expect, it } from 'vitest'

import { getAvailableInventory, getStockStatus } from '@/lib/product/inventory'
import { validatePurchase } from '@/lib/product/purchase'
import {
  buildParamsForColorChange,
  buildVariantOptionGroups,
  findVariantForOptions,
  getOptionAvailability,
  getProductVariants,
} from '@/lib/product/variants'
import type { Product, Variant, VariantOption, VariantType } from '@/payload-types'

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

function type(
  id: number,
  name: string,
  label: string,
  options: VariantOption[],
): VariantType {
  return {
    id,
    name,
    label,
    options: { docs: options },
    updatedAt: '',
    createdAt: '',
  }
}

function variant(id: number, optionIds: number[], inventory: number): Variant {
  return {
    id,
    product: 1,
    options: optionIds,
    inventory,
    updatedAt: '',
    createdAt: '',
    _status: 'published',
  }
}

function product(args: {
  enableVariants?: boolean
  types?: VariantType[]
  variants?: Variant[]
  inventory?: number
}): Product {
  return {
    id: 1,
    title: 'Test',
    slug: 'test',
    enableVariants: args.enableVariants ?? true,
    variantTypes: args.types || [],
    variants: { docs: args.variants || [] },
    inventory: args.inventory,
    updatedAt: '',
    createdAt: '',
  }
}

const colorType = type(10, 'color', 'Color', [
  option(101, 'Pink', 10),
  option(102, 'Black', 10),
  option(103, 'Gray', 10),
  option(104, 'Green', 10),
  option(105, 'White', 10),
])

const sizeType = type(20, 'size', 'Size', [
  option(201, 'S', 20),
  option(202, 'M', 20),
  option(203, 'L', 20),
  option(204, 'XL', 20),
])

describe('variant matrix from Payload variants', () => {
  it('only surfaces colors and sizes that exist on the product variants', () => {
    const p = product({
      types: [colorType, sizeType],
      variants: [
        variant(1, [102, 202], 3),
        variant(2, [102, 203], 10),
        variant(3, [102, 204], 5),
      ],
    })

    const groups = buildVariantOptionGroups(p)
    expect(groups.map((group) => group.name)).toEqual(['color', 'size'])
    expect(groups[0]?.options.map((option) => option.label)).toEqual(['Black'])
    expect(groups[1]?.options.map((option) => option.label)).toEqual(['M', 'L', 'XL'])
  })

  it('adapts to a different product matrix without hardcoded options', () => {
    const p = product({
      types: [colorType, sizeType],
      variants: [
        variant(1, [101, 201], 2),
        variant(2, [101, 202], 2),
        variant(3, [105, 201], 2),
        variant(4, [105, 202], 2),
      ],
    })

    const groups = buildVariantOptionGroups(p)
    expect(groups[0]?.options.map((option) => option.label)).toEqual(['Pink', 'White'])
    expect(groups[1]?.options.map((option) => option.label)).toEqual(['S', 'M'])
  })

  it('returns no option groups when variants are disabled', () => {
    const p = product({
      enableVariants: false,
      types: [colorType],
      variants: [variant(1, [102], 4)],
    })

    expect(getProductVariants(p)).toEqual([])
    expect(buildVariantOptionGroups(p)).toEqual([])
  })

  it('does not match a combination that does not exist in Payload', () => {
    const p = product({
      types: [colorType, sizeType],
      variants: [variant(1, [102, 202], 3), variant(2, [105, 201], 1)],
    })

    expect(findVariantForOptions(p, ['102', '204'])).toBeUndefined()
    expect(findVariantForOptions(p, ['102', '202'])?.id).toBe(1)
  })

  it('disables sizes that are not available for the selected color', () => {
    const p = product({
      types: [colorType, sizeType],
      variants: [
        variant(1, [102, 202], 3),
        variant(2, [102, 203], 10),
        variant(3, [105, 201], 1),
      ],
    })

    expect(getOptionAvailability({ product: p, optionId: '204', selectedOptionIds: ['102'] })).toEqual({
      exists: false,
      inStock: false,
    })
    expect(getOptionAvailability({ product: p, optionId: '202', selectedOptionIds: ['102'] })).toEqual({
      exists: true,
      inStock: true,
    })
    expect(getOptionAvailability({ product: p, optionId: '201', selectedOptionIds: ['102'] })).toEqual({
      exists: false,
      inStock: false,
    })
    expect(getOptionAvailability({ product: p, optionId: '201', selectedOptionIds: ['105'] })).toEqual({
      exists: true,
      inStock: true,
    })
  })

  it('treats an existing out-of-stock combination as present but not in stock', () => {
    const p = product({
      types: [colorType, sizeType],
      variants: [variant(1, [102, 202], 0), variant(2, [102, 203], 4)],
    })

    expect(getOptionAvailability({ product: p, optionId: '202', selectedOptionIds: ['102'] })).toEqual({
      exists: true,
      inStock: false,
    })
  })

  it('remaps size when the current size is not available for the newly selected color', () => {
    const p = product({
      types: [colorType, sizeType],
      variants: [
        variant(1, [102, 204], 5),
        variant(2, [105, 201], 2),
      ],
    })

    const current = new URLSearchParams({ color: '102', size: '204', variant: '1' })
    const next = buildParamsForColorChange({
      product: p,
      colorTypeName: 'color',
      nextColorOptionId: '105',
      currentParams: current,
    })

    expect(next.get('color')).toBe('105')
    expect(next.get('size')).toBe('201')
    expect(next.get('variant')).toBe('2')
  })
})

describe('variant inventory and purchase validation', () => {
  it('reads inventory from the selected variant', () => {
    const p = product({
      types: [colorType, sizeType],
      variants: [variant(1, [102, 202], 3), variant(2, [102, 203], 10)],
    })

    expect(getAvailableInventory(p, p.variants?.docs?.[0] as Variant)).toBe(3)
    expect(getStockStatus(p, p.variants?.docs?.[0] as Variant)).toBe('low')
    expect(getStockStatus(p, p.variants?.docs?.[1] as Variant)).toBe('low')
  })

  it('blocks add-to-cart when a required variant is missing or out of stock', () => {
    const p = product({
      types: [colorType, sizeType],
      variants: [variant(1, [102, 202], 0)],
    })

    const missing = validatePurchase({ product: p })
    expect(missing.ok).toBe(false)
    if (!missing.ok) expect(missing.reason).toBe('needs-options')

    const oos = validatePurchase({ product: p, selectedVariant: p.variants?.docs?.[0] as Variant })
    expect(oos.ok).toBe(false)
    if (!oos.ok) expect(oos.reason).toBe('out-of-stock')
  })

  it('blocks quantity that exceeds remaining inventory', () => {
    const p = product({
      types: [colorType, sizeType],
      variants: [variant(1, [102, 202], 3)],
    })
    const selected = p.variants?.docs?.[0] as Variant

    expect(validatePurchase({ product: p, selectedVariant: selected, quantity: 3 }).ok).toBe(true)
    const over = validatePurchase({
      product: p,
      selectedVariant: selected,
      quantity: 2,
      cartQuantity: 2,
    })
    expect(over.ok).toBe(false)
    if (!over.ok) expect(over.reason).toBe('quantity')
  })

  it('allows products without variants when product inventory is available', () => {
    const p = product({ enableVariants: false, inventory: 6 })
    expect(validatePurchase({ product: p, quantity: 2 }).ok).toBe(true)
    const over = validatePurchase({ product: p, quantity: 7 })
    expect(over.ok).toBe(false)
    if (!over.ok) expect(over.reason).toBe('quantity')
  })
})
