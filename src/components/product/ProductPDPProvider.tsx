'use client'

import type { Product } from '@/payload-types'
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'

import { useSelectedVariant } from '@/components/product/hooks'
import { getAvailableInventory } from '@/lib/product/inventory'

type ProductPDPContextValue = {
  product: Product
  quantity: number
  setQuantity: (quantity: number) => void
  maxQuantity: number
}

const ProductPDPContext = createContext<ProductPDPContextValue | null>(null)

export function ProductPDPProvider({
  product,
  children,
}: {
  product: Product
  children: React.ReactNode
}) {
  const selectedVariant = useSelectedVariant(product)
  const [quantity, setQuantity] = useState(1)
  const inventory = getAvailableInventory(product, selectedVariant)
  const maxQuantity = inventory && inventory > 0 ? inventory : 0

  useEffect(() => {
    setQuantity(1)
  }, [selectedVariant?.id])

  useEffect(() => {
    if (maxQuantity > 0 && quantity > maxQuantity) setQuantity(maxQuantity)
  }, [maxQuantity, quantity])

  const value = useMemo(
    () => ({
      product,
      quantity,
      setQuantity,
      maxQuantity,
    }),
    [maxQuantity, product, quantity],
  )

  return <ProductPDPContext.Provider value={value}>{children}</ProductPDPContext.Provider>
}

export function useProductPDP() {
  return useContext(ProductPDPContext)
}

export function useProductQuantity() {
  const context = useProductPDP()
  return {
    quantity: context?.quantity ?? 1,
    setQuantity: context?.setQuantity ?? (() => undefined),
    maxQuantity: context?.maxQuantity ?? 1,
  }
}
