import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import React from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { ProductGallery } from '@/components/product/ProductGallery'
import { ProductPDPProvider, useProductPDP } from '@/components/product/ProductPDPProvider'
import { VariantSelector } from '@/components/product/VariantSelector'
import { getEffectivePrice } from '@/lib/currency'
import { getAvailableInventory } from '@/lib/product/inventory'
import { getProductGalleryItems } from '@/lib/product/media'
import { getCartItemPayload, validatePurchase } from '@/lib/product/purchase'
import { filterGalleryByColor } from '@/lib/product/variantGallery'
import {
  applyOptionSelection,
  buildVariantOptionGroups,
  canSelectOption,
  getOptionAvailability,
  parseSelectedOptions,
  resolveVariantFromSearchParams,
  resolveVariantFromSelectedOptions,
} from '@/lib/product/variants'
import type { Media, Product, Variant, VariantOption, VariantType } from '@/payload-types'

const navigation = vi.hoisted(() => ({
  searchParams: new URLSearchParams(),
  pathname: '/products/qa-product',
  replace: vi.fn(),
}))

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: navigation.replace, push: vi.fn() }),
  usePathname: () => navigation.pathname,
  useSearchParams: () => navigation.searchParams,
}))

vi.mock('next/image', () => ({
  default: ({ alt, src }: { alt?: string; src?: string }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img alt={alt || ''} src={typeof src === 'string' ? src : ''} />
  ),
}))

vi.mock('@/providers/Wishlist', () => ({
  useWishlist: () => ({
    isWishlisted: () => false,
    toggleWishlist: async () => undefined,
  }),
}))

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
  title?: string
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
    title: args.title ?? 'QA Product',
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

function media(id: number, extras: Partial<Media> = {}): Media {
  return {
    id,
    alt: extras.alt ?? `Image ${id}`,
    url: extras.url ?? `/api/media/file/${id}.jpg`,
    filename: extras.filename ?? `${id}.jpg`,
    updatedAt: '',
    createdAt: '',
    ...extras,
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

const blackMatrix = product({
  pricingMode: 'variant',
  priceInINR: 999999,
  types: [colorType, sizeType],
  variants: [
    variant(11, [102, 202], { inventory: 3, priceInINR: 100000 }),
    variant(12, [102, 203], { inventory: 10, priceInINR: 120000 }),
    variant(13, [102, 204], { inventory: 0, priceInINR: 140000 }),
  ],
})

const dependentMatrix = product({
  types: [colorType, sizeType],
  variants: [
    variant(1, [102, 202]),
    variant(2, [102, 203]),
    variant(3, [105, 201]),
    variant(4, [105, 202]),
  ],
})

function SelectionProbe({ product: p }: { product: Product }) {
  const pdp = useProductPDP()
  const selected = pdp?.selectedVariant
  const purchase = validatePurchase({ product: p, selectedVariant: selected, quantity: 1 })
  const cart = getCartItemPayload({ product: p, selectedVariant: selected })

  return (
    <div>
      <span data-testid="selected-color">{pdp?.selectedOptions.color ?? ''}</span>
      <span data-testid="selected-size">{pdp?.selectedOptions.size ?? ''}</span>
      <span data-testid="selected-variant">{selected?.id ?? ''}</span>
      <span data-testid="inventory">{String(getAvailableInventory(p, selected) ?? '')}</span>
      <span data-testid="price">
        {String(getEffectivePrice({ product: p, variant: selected, enableVariants: true }) ?? '')}
      </span>
      <span data-testid="can-purchase">{purchase.ok ? 'yes' : 'no'}</span>
      <span data-testid="purchase-reason">{purchase.ok ? '' : purchase.reason}</span>
      <span data-testid="cart-variant">{cart.variant ?? ''}</span>
    </div>
  )
}

function renderSelector(p: Product) {
  return render(
    <ProductPDPProvider product={p}>
      <VariantSelector product={p} />
      <SelectionProbe product={p} />
    </ProductPDPProvider>,
  )
}

describe('PDP option clicks update selected state', () => {
  afterEach(() => {
    cleanup()
  })

  beforeEach(() => {
    navigation.searchParams = new URLSearchParams()
    navigation.replace.mockReset()
    window.history.replaceState(null, '', '/products/qa-product')
  })

  it('1. Color button click updates selected color', () => {
    renderSelector(blackMatrix)
    fireEvent.click(screen.getByRole('button', { name: 'Black' }))
    expect(screen.getByTestId('selected-color').textContent).toBe('102')
    expect(screen.getByRole('button', { name: 'Black' }).getAttribute('aria-pressed')).toBe('true')
  })

  it('2. Size button click updates selected size', () => {
    renderSelector(blackMatrix)
    fireEvent.click(screen.getByRole('button', { name: 'Black' }))
    fireEvent.click(screen.getByRole('button', { name: 'Size M' }))
    expect(screen.getByTestId('selected-size').textContent).toBe('202')
    expect(screen.getByRole('button', { name: 'Size M' }).getAttribute('aria-pressed')).toBe('true')
  })

  it('3. Selected options resolve to the correct Payload variant ID', () => {
    renderSelector(blackMatrix)
    fireEvent.click(screen.getByRole('button', { name: 'Black' }))
    fireEvent.click(screen.getByRole('button', { name: 'Size M' }))
    expect(screen.getByTestId('selected-variant').textContent).toBe('11')

    fireEvent.click(screen.getByRole('button', { name: 'Size L' }))
    expect(screen.getByTestId('selected-variant').textContent).toBe('12')
  })

  it('4. Selected variant updates price via getEffectivePrice()', () => {
    renderSelector(blackMatrix)
    fireEvent.click(screen.getByRole('button', { name: 'Black' }))
    fireEvent.click(screen.getByRole('button', { name: 'Size M' }))
    expect(screen.getByTestId('price').textContent).toBe('100000')
    fireEvent.click(screen.getByRole('button', { name: 'Size L' }))
    expect(screen.getByTestId('price').textContent).toBe('120000')
  })

  it('5. Selected variant updates inventory', () => {
    renderSelector(blackMatrix)
    fireEvent.click(screen.getByRole('button', { name: 'Black' }))
    fireEvent.click(screen.getByRole('button', { name: 'Size M' }))
    expect(screen.getByTestId('inventory').textContent).toBe('3')
    fireEvent.click(screen.getByRole('button', { name: 'Size L' }))
    expect(screen.getByTestId('inventory').textContent).toBe('10')
  })

  it('6. Out-of-stock variant can be selected but cannot be purchased', () => {
    renderSelector(blackMatrix)
    fireEvent.click(screen.getByRole('button', { name: 'Black' }))
    const xl = screen.getByRole('button', { name: /Size XL/ })
    expect((xl as HTMLButtonElement).disabled).toBe(false)
    fireEvent.click(xl)
    expect(screen.getByTestId('selected-variant').textContent).toBe('13')
    expect(screen.getByTestId('inventory').textContent).toBe('0')
    expect(screen.getByTestId('can-purchase').textContent).toBe('no')
    expect(screen.getByTestId('purchase-reason').textContent).toBe('out-of-stock')
  })

  it('7. Invalid combinations remain disabled', () => {
    renderSelector(dependentMatrix)
    fireEvent.click(screen.getByRole('button', { name: 'Black' }))
    expect((screen.getByRole('button', { name: 'Size M' }) as HTMLButtonElement).disabled).toBe(false)
    expect((screen.getByRole('button', { name: /Size L/ }) as HTMLButtonElement).disabled).toBe(false)
    expect((screen.getByRole('button', { name: /Size S/ }) as HTMLButtonElement).disabled).toBe(true)

    fireEvent.click(screen.getByRole('button', { name: 'White' }))
    expect((screen.getByRole('button', { name: /Size S/ }) as HTMLButtonElement).disabled).toBe(false)
    expect((screen.getByRole('button', { name: 'Size M' }) as HTMLButtonElement).disabled).toBe(false)
    expect((screen.getByRole('button', { name: /Size L/ }) as HTMLButtonElement).disabled).toBe(true)
  })

  it('8-9. Add to Cart and Buy Now use the selected variant ID', () => {
    renderSelector(blackMatrix)
    fireEvent.click(screen.getByRole('button', { name: 'Black' }))
    fireEvent.click(screen.getByRole('button', { name: 'Size M' }))
    expect(screen.getByTestId('cart-variant').textContent).toBe('11')
    expect(
      getCartItemPayload({
        product: blackMatrix,
        selectedVariant: resolveVariantFromSelectedOptions(blackMatrix, {
          color: '102',
          size: '202',
        }),
      }),
    ).toEqual({ product: 1, variant: 11 })
  })
})

describe('PDP gallery media', () => {
  afterEach(() => {
    cleanup()
  })

  beforeEach(() => {
    navigation.searchParams = new URLSearchParams()
  })

  it('10. Multiple valid gallery images render as thumbnails', () => {
    const p = product({
      enableVariants: false,
      gallery: [
        { id: 'a', image: media(1, { alt: 'Front' }) },
        { id: 'b', image: media(2, { alt: 'Back' }) },
        { id: 'c', image: media(3, { alt: 'Side' }) },
        { id: 'd', image: media(4, { alt: 'Detail' }) },
      ],
    })
    const gallery = getProductGalleryItems(p)
    expect(gallery).toHaveLength(4)

    render(
      <ProductPDPProvider product={p}>
        <ProductGallery gallery={gallery} product={p} productId="1" productTitle={p.title} />
      </ProductPDPProvider>,
    )

    expect(screen.getAllByRole('tab')).toHaveLength(4)
    expect(screen.getAllByRole('img', { name: 'Front' }).length).toBeGreaterThan(0)
  })

  it('11. Invalid or missing media is skipped and never rendered with an empty src', () => {
    const p = product({
      enableVariants: false,
      gallery: [
        { id: '1', image: media(1, { alt: 'Good', url: '/good.jpg', filename: 'good.jpg' }) },
        { id: '2', image: { id: 2, alt: 'Broken', updatedAt: '', createdAt: '' } as Media },
        { id: '3', image: 99 },
        { id: '4', image: media(4, { alt: 'Empty', url: '', filename: '' }) },
        { id: '5', image: media(5, { alt: 'File only', url: undefined, filename: 'five.jpg' }) },
      ],
    })

    const gallery = getProductGalleryItems(p)
    expect(gallery.map((item) => item.image.id)).toEqual([1, 5])

    render(
      <ProductPDPProvider product={p}>
        <ProductGallery gallery={gallery} product={p} productId="1" productTitle={p.title} />
      </ProductPDPProvider>,
    )

    const images = screen.getAllByRole('img')
    expect(images.length).toBeGreaterThan(0)
    for (const image of images) {
      expect(image.getAttribute('src')).toBeTruthy()
    }
  })

  it('shows every valid gallery image when no color is selected, including tagged media', () => {
    const gallery = [
      { id: 'u', image: media(1), variantOption: null },
      { id: 'b', image: media(2), variantOption: 102 },
      { id: 'w', image: media(3), variantOption: 105 },
    ]
    expect(filterGalleryByColor(gallery, null).map((item) => item.image.id)).toEqual([1, 2, 3])
    expect(filterGalleryByColor(gallery, '102').map((item) => item.image.id)).toEqual([2])
  })
})

describe('URL option parameters are authoritative', () => {
  it('12. Stale variant IDs cannot override option values', () => {
    const params = new URLSearchParams({
      color: 'White',
      size: 'L',
      variant: '2',
    })

    expect(parseSelectedOptions(dependentMatrix, params)).toEqual({ color: '105', size: '203' })
    expect(resolveVariantFromSearchParams(dependentMatrix, params)).toBeUndefined()

    const byIds = new URLSearchParams({ color: '105', size: '203', variant: '2' })
    expect(resolveVariantFromSearchParams(dependentMatrix, byIds)).toBeUndefined()
  })

  it('clicking Black then M writes the Payload variant ID into URL params', () => {
    let params = new URLSearchParams()
    params = applyOptionSelection({
      product: blackMatrix,
      typeName: 'color',
      optionId: '102',
      isColor: true,
      currentParams: params,
    })
    expect(parseSelectedOptions(blackMatrix, params).color).toBe('102')

    params = applyOptionSelection({
      product: blackMatrix,
      typeName: 'size',
      optionId: '202',
      isColor: false,
      currentParams: params,
    })

    const resolved = resolveVariantFromSearchParams(blackMatrix, params)
    expect(resolved?.id).toBe(11)
    expect(params.get('variant')).toBe('11')
  })

  it('does not disable a valid out-of-stock size merely because inventory is 0', () => {
    const groups = buildVariantOptionGroups(blackMatrix)
    const xl = groups.find((group) => group.name === 'size')?.options.find((item) => item.label === 'XL')
    const availability = getOptionAvailability({
      product: blackMatrix,
      optionId: xl!.id,
      selectedOptionIds: ['102'],
    })
    expect(availability.exists).toBe(true)
    expect(availability.inStock).toBe(false)
    expect(canSelectOption(availability)).toBe(true)
  })
})
