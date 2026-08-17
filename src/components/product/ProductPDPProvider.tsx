'use client'

import type { Product, Variant } from '@/payload-types'
import { createUrl } from '@/utilities/createUrl'
import { usePathname, useSearchParams } from 'next/navigation'
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'

import { getAvailableInventory } from '@/lib/product/inventory'
import {
  applyOptionSelection,
  paramsFromSelectedOptions,
  parseSelectedOptions,
  resolveVariantFromSelectedOptions,
} from '@/lib/product/variants'

type ProductPDPContextValue = {
  product: Product
  quantity: number
  setQuantity: (quantity: number) => void
  maxQuantity: number
  selectedOptions: Record<string, string>
  selectedVariant: Variant | undefined
  selectOption: (args: { typeName: string; optionId: string; isColor: boolean }) => void
}

const ProductPDPContext = createContext<ProductPDPContextValue | null>(null)

export function ProductPDPProvider({
  product,
  children,
}: {
  product: Product
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const userSelectedRef = useRef(false)
  const selectedOptionsRef = useRef<Record<string, string>>({})

  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>(() =>
    parseSelectedOptions(product, searchParams),
  )
  const [quantity, setQuantity] = useState(1)

  selectedOptionsRef.current = selectedOptions

  const searchKey = searchParams.toString()

  useEffect(() => {
    if (userSelectedRef.current) return
    setSelectedOptions(parseSelectedOptions(product, searchParams))
  }, [product, searchKey, searchParams])

  useEffect(() => {
    const onPopState = () => {
      userSelectedRef.current = false
      setSelectedOptions(parseSelectedOptions(product, new URLSearchParams(window.location.search)))
    }

    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [product])

  const selectOption = useCallback(
    (args: { typeName: string; optionId: string; isColor: boolean }) => {
      userSelectedRef.current = true
      const currentParams = paramsFromSelectedOptions(product, selectedOptionsRef.current)
      const nextParams = applyOptionSelection({
        product,
        typeName: args.typeName,
        optionId: args.optionId,
        isColor: args.isColor,
        currentParams,
      })
      const nextSelected = parseSelectedOptions(product, nextParams)
      setSelectedOptions(nextSelected)

      if (typeof window !== 'undefined') {
        window.history.replaceState(window.history.state, '', createUrl(pathname, nextParams))
      }
    },
    [pathname, product],
  )

  const selectedVariant = useMemo(
    () => resolveVariantFromSelectedOptions(product, selectedOptions),
    [product, selectedOptions],
  )

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
      selectedOptions,
      selectedVariant,
      selectOption,
    }),
    [maxQuantity, product, quantity, selectOption, selectedOptions, selectedVariant],
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
