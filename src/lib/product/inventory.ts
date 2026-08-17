import type { Product, Variant } from '@/payload-types'

import { getProductVariants } from '@/lib/product/variants'

/** UI threshold for the "Only N left in stock" message. Not product data. */
export const LOW_STOCK_THRESHOLD = 10

export type StockStatus = 'select-options' | 'out-of-stock' | 'low' | 'in-stock'

export function getAvailableInventory(
  product: Product,
  selectedVariant?: Variant | null,
): number | null {
  const variants = getProductVariants(product)

  if (product.enableVariants && variants.length) {
    if (!selectedVariant) return null
    return typeof selectedVariant.inventory === 'number' ? selectedVariant.inventory : 0
  }

  return typeof product.inventory === 'number' ? product.inventory : 0
}

export function getStockStatus(
  product: Product,
  selectedVariant?: Variant | null,
): StockStatus {
  const variants = getProductVariants(product)
  if (product.enableVariants && variants.length && !selectedVariant) return 'select-options'

  const quantity = getAvailableInventory(product, selectedVariant)
  if (quantity === null) return 'select-options'
  if (quantity <= 0) return 'out-of-stock'
  if (quantity <= LOW_STOCK_THRESHOLD) return 'low'
  return 'in-stock'
}

export function productHasAnyStock(product: Product): boolean {
  const variants = getProductVariants(product)
  if (product.enableVariants && variants.length) {
    return variants.some((variant) => typeof variant.inventory === 'number' && variant.inventory > 0)
  }

  return typeof product.inventory === 'number' && product.inventory > 0
}
