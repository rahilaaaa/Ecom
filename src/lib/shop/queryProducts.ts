import configPromise from '@payload-config'
import type { Where } from 'payload'
import { getPayload } from 'payload'

import { defaultSort } from '@/lib/constants'

export const SHOP_PAGE_SIZE = 8

export type ShopQueryParams = {
  q?: string | string[]
  sort?: string | string[]
  category?: string | string[]
  sale?: string | string[]
  onSale?: string | string[]
  badge?: string | string[]
  minPrice?: string | string[]
  maxPrice?: string | string[]
  page?: string | string[] | number
  limit?: number
}

function first(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0]
  return value
}

export function buildShopWhere(params: ShopQueryParams): Where {
  const searchValue = first(params.q)
  const category = first(params.category)
  const sale = first(params.sale) ?? first(params.onSale)
  const badge = first(params.badge)
  const minPrice = first(params.minPrice)
  const maxPrice = first(params.maxPrice)

  const and: Where[] = [
    {
      _status: {
        equals: 'published',
      },
    },
  ]

  if (searchValue) {
    and.push({
      or: [
        {
          title: {
            like: searchValue,
          },
        },
        {
          description: {
            like: searchValue,
          },
        },
        {
          slug: {
            like: searchValue,
          },
        },
      ],
    })
  }

  if (category) {
    and.push({
      categories: {
        contains: category,
      },
    })
  }

  if (sale === 'true' || sale === '1') {
    and.push({
      badge: {
        equals: 'sale',
      },
    })
  }

  if (badge && badge !== 'all') {
    and.push({
      badge: {
        equals: badge,
      },
    })
  }

  if (minPrice && !Number.isNaN(Number(minPrice))) {
    and.push({
      priceInINR: {
        greater_than_equal: Number(minPrice),
      },
    })
  }

  if (maxPrice && !Number.isNaN(Number(maxPrice))) {
    and.push({
      priceInINR: {
        less_than_equal: Number(maxPrice),
      },
    })
  }

  return { and }
}

export function resolveShopSort(sortParam: string | string[] | undefined): string {
  const sort = first(sortParam)
  if (!sort || sort === 'featured') {
    return defaultSort.slug || '-featured,-createdAt'
  }
  return sort
}

export async function queryShopProducts(params: ShopQueryParams = {}) {
  const payload = await getPayload({ config: configPromise })
  const page = Math.max(1, Number(first(params.page as string | string[] | undefined) || 1) || 1)
  const limit = params.limit ?? SHOP_PAGE_SIZE

  return payload.find({
    collection: 'products',
    depth: 1,
    draft: false,
    limit,
    overrideAccess: false,
    page,
    select: {
      title: true,
      slug: true,
      gallery: true,
      categories: true,
      priceInINR: true,
      pricingMode: true,
      badge: true,
      rating: true,
      featured: true,
      inventory: true,
      enableVariants: true,
      variants: true,
    },
    sort: resolveShopSort(params.sort),
    where: buildShopWhere(params),
  })
}
