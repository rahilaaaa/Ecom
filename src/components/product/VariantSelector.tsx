'use client'

import type { Product } from '@/payload-types'
import { createUrl } from '@/utilities/createUrl'
import { cn } from '@/utilities/cn'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import React, { useMemo } from 'react'

import { SizeGuide } from '@/components/product/SizeGuide'
import {
  buildParamsForColorChange,
  buildParamsForOptionChange,
  findVariantForOptions,
  isColorVariantType,
  isSizeVariantType,
  optionId,
} from '@/lib/product/variantGallery'

const COLOR_MAP: Record<string, string> = {
  black: '#111111',
  obsidian: '#0b0b0b',
  white: '#f5f5f5',
  cream: '#f3ebe0',
  ivory: '#fffff0',
  beige: '#d6c4a8',
  gray: '#9ca3af',
  grey: '#9ca3af',
  charcoal: '#36454f',
  green: '#1f4d45',
  teal: '#3d6b6b',
  emerald: '#0d2b2b',
  navy: '#1a2744',
  blue: '#3b5b8a',
  brown: '#6b4a32',
  espresso: '#3c2415',
  red: '#7a1f1f',
  maroon: '#800000',
  pink: '#d9a5a5',
}

function resolveSwatchColor(label: string, value?: string | null) {
  if (value && /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(value)) return value
  const key = (value || label).toLowerCase().trim()
  return COLOR_MAP[key] || COLOR_MAP[label.toLowerCase().trim()] || '#c1c8c7'
}

type Props = {
  product: Product
}

export function VariantSelector({ product }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const variants = product.variants?.docs
  const variantTypes = product.variantTypes
  const hasVariants = Boolean(product.enableVariants && variants?.length && variantTypes?.length)

  const selectedOptionIds = useMemo(() => {
    const ids: string[] = []
    for (const type of variantTypes || []) {
      if (typeof type !== 'object' || !type?.name) continue
      const value = searchParams.get(type.name)
      if (value) ids.push(value)
    }
    return ids
  }, [searchParams, variantTypes])

  if (!hasVariants) return null

  return (
    <div className="flex flex-col gap-8">
      {variantTypes?.map((type) => {
        if (!type || typeof type !== 'object') return null

        const options = type.options?.docs
        if (!options || !Array.isArray(options) || !options.length) return null

        const colorType = isColorVariantType(type.name, type.label)
        const sizeType = isSizeVariantType(type.name, type.label)
        const selectedOptionId = searchParams.get(type.name)
        const selectedOption = options.find(
          (option) => typeof option === 'object' && String(option.id) === selectedOptionId,
        )
        const selectedLabel =
          selectedOption && typeof selectedOption === 'object' ? selectedOption.label : null

        return (
          <div key={type.id} className="flex flex-col gap-3">
            <div className="flex items-center justify-between gap-4">
              <p className="font-[family-name:var(--font-inter)] text-xs font-semibold uppercase tracking-[0.12em] text-[var(--elixir-on-surface,#1c1b1b)]">
                {colorType && selectedLabel
                  ? `${type.label}: ${selectedLabel}`
                  : type.label}
              </p>
              {sizeType ? <SizeGuide productTitle={product.title} /> : null}
            </div>

            <div className={cn('flex flex-wrap gap-3', colorType && 'gap-4')}>
              {options.map((option) => {
                if (!option || typeof option !== 'object') return null

                const nextOptionId = String(option.id)

                // Preview availability for this option while keeping other current selections.
                const previewIds = selectedOptionIds
                  .filter((id) => {
                    // Replace this type's current selection with the previewed option.
                    const currentForType = searchParams.get(type.name)
                    return currentForType ? id !== currentForType : true
                  })
                  .concat(nextOptionId)

                const previewVariant = findVariantForOptions(product, previewIds)
                const isAvailableForSale = previewVariant
                  ? Boolean(previewVariant.inventory && previewVariant.inventory > 0)
                  : // Color may still be selectable even if current size combo is invalid —
                    // color change handler will pick a valid size.
                    colorType
                    ? (product.variants?.docs || []).some((variant) => {
                        if (typeof variant !== 'object' || !variant?.options) return false
                        return (
                          variant.options.some((vo) => optionId(vo) === nextOptionId) &&
                          (variant.inventory || 0) > 0
                        )
                      })
                    : false

                const isActive = selectedOptionId === nextOptionId

                const onSelect = () => {
                  const nextParams = colorType
                    ? buildParamsForColorChange({
                        product,
                        colorTypeName: type.name,
                        nextColorOptionId: nextOptionId,
                        currentParams: searchParams,
                      })
                    : buildParamsForOptionChange({
                        product,
                        typeName: type.name,
                        optionId: nextOptionId,
                        currentParams: searchParams,
                      })

                  router.replace(createUrl(pathname, nextParams), { scroll: false })
                }

                if (colorType) {
                  const swatch = resolveSwatchColor(option.label, option.value)
                  return (
                    <button
                      key={option.id}
                      type="button"
                      disabled={!isAvailableForSale && !isActive}
                      aria-label={`${option.label}${!isAvailableForSale ? ' (out of stock)' : ''}`}
                      aria-pressed={isActive}
                      title={`${option.label}${!isAvailableForSale ? ' (Out of Stock)' : ''}`}
                      onClick={onSelect}
                      className={cn(
                        'flex h-12 w-12 items-center justify-center rounded-full border transition',
                        isActive
                          ? 'border-[var(--elixir-on-surface,#1c1b1b)]'
                          : 'border-transparent',
                        !isAvailableForSale && !isActive && 'cursor-not-allowed opacity-40',
                      )}
                    >
                      <span
                        className="h-8 w-8 rounded-full border border-black/10"
                        style={{ backgroundColor: swatch }}
                      />
                    </button>
                  )
                }

                return (
                  <button
                    key={option.id}
                    type="button"
                    disabled={!isAvailableForSale && !isActive}
                    aria-pressed={isActive}
                    aria-label={`${type.label} ${option.label}${!isAvailableForSale ? ' (out of stock)' : ''}`}
                    title={`${option.label}${!isAvailableForSale ? ' (Out of Stock)' : ''}`}
                    onClick={onSelect}
                    className={cn(
                      'inline-flex min-h-12 min-w-12 items-center justify-center rounded-md border px-4 text-sm transition',
                      isActive
                        ? 'border-[var(--elixir-outline-variant,#c1c8c7)] bg-[var(--elixir-surface-container,#f0eded)] text-[var(--elixir-on-surface,#1c1b1b)]'
                        : 'border-[var(--elixir-outline-variant,#c1c8c7)] bg-transparent text-[var(--elixir-on-surface,#1c1b1b)] hover:bg-[var(--elixir-surface-container-low,#f6f3f2)]',
                      sizeType && 'min-w-14',
                      !isAvailableForSale && !isActive && 'cursor-not-allowed opacity-40 line-through',
                    )}
                  >
                    {option.label}
                  </button>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}
