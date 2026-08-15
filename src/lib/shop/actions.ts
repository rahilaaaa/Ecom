'use server'

import { queryShopProducts, type ShopQueryParams } from '@/lib/shop/queryProducts'

export async function fetchShopProductsPage(params: ShopQueryParams) {
  try {
    const result = await queryShopProducts(params)

    return {
      docs: result.docs,
      error: null as string | null,
      hasNextPage: result.hasNextPage,
      page: result.page,
      totalDocs: result.totalDocs,
      totalPages: result.totalPages,
    }
  } catch {
    return {
      docs: [],
      error: 'Unable to load products. Please try again.',
      hasNextPage: false,
      page: 1,
      totalDocs: 0,
      totalPages: 0,
    }
  }
}
