'use client'

import type { Product } from '@/payload-types'
import { createUrl } from '@/utilities/createUrl'
import { cn } from '@/utilities/cn'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import React from 'react'

import { SizeGuide } from '@/components/product/SizeGuide'

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
  pink: '#d9a5a5',
}

function resolveSwatchColor(label: string, value?: string | null) {
  if (value && /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(value)) return value
  const key = (value || label).toLowerCase().trim()
  return COLOR_MAP[key] || COLOR_MAP[label.toLowerCase().trim()] || '#c1c8c7'
}

function isColorType(name?: string | null, label?: string | null) {
  const haystack = `${name || ''} ${label || ''}`.toLowerCase()
  return haystack.includes('color') || haystack.includes('colour')
}

function isSizeType(name?: string | null, label?: string | null) {
  const haystack = `${name || ''} ${label || ''}`.toLowerCase()
  return haystack.includes('size')
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

  if (!hasVariants) return null

  return (
    <div className="flex flex-col gap-8">
      {variantTypes?.map((type) => {
        if (!type || typeof type !== 'object') return null

        const options = type.options?.docs
        if (!options || !Array.isArray(options) || !options.length) return null

        const colorType = isColorType(type.name, type.label)
        const sizeType = isSizeType(type.name, type.label)
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

                const optionID = option.id
                const optionSearchParams = new URLSearchParams(searchParams.toString())
                optionSearchParams.delete('variant')
                optionSearchParams.delete('image')
                optionSearchParams.set(type.name, String(optionID))

                const currentOptions = Array.from(optionSearchParams.values())
                let isAvailableForSale = true

                if (variants) {
                  const matchingVariant = variants
                    .filter((variant) => typeof variant === 'object')
                    .find((variant) => {
                      if (!variant.options || !Array.isArray(variant.options)) return false
                      return variant.options.every((variantOption) => {
                        if (typeof variantOption !== 'object') {
                          return currentOptions.includes(String(variantOption))
                        }
                        return currentOptions.includes(String(variantOption.id))
                      })
                    })

                  if (matchingVariant && typeof matchingVariant === 'object') {
                    optionSearchParams.set('variant', String(matchingVariant.id))
                    isAvailableForSale = Boolean(
                      matchingVariant.inventory && matchingVariant.inventory > 0,
                    )
                  }
                }

                const isActive = searchParams.get(type.name) === String(optionID)
                const optionUrl = createUrl(pathname, optionSearchParams)

                if (colorType) {
                  const swatch = resolveSwatchColor(option.label, option.value)
                  return (
                    <button
                      key={option.id}
                      type="button"
                      disabled={!isAvailableForSale}
                      aria-label={`${option.label}${!isAvailableForSale ? ' (out of stock)' : ''}`}
                      aria-pressed={isActive}
                      title={`${option.label}${!isAvailableForSale ? ' (Out of Stock)' : ''}`}
                      onClick={() => router.replace(optionUrl, { scroll: false })}
                      className={cn(
                        'flex h-12 w-12 items-center justify-center rounded-full border transition',
                        isActive
                          ? 'border-[var(--elixir-on-surface,#1c1b1b)]'
                          : 'border-transparent',
                        !isAvailableForSale && 'cursor-not-allowed opacity-40',
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
                    disabled={!isAvailableForSale}
                    aria-pressed={isActive}
                    aria-label={`${type.label} ${option.label}${!isAvailableForSale ? ' (out of stock)' : ''}`}
                    title={`${option.label}${!isAvailableForSale ? ' (Out of Stock)' : ''}`}
                    onClick={() => router.replace(optionUrl, { scroll: false })}
                    className={cn(
                      'inline-flex min-h-12 min-w-12 items-center justify-center rounded-md border px-4 text-sm transition',
                      isActive
                        ? 'border-[var(--elixir-outline-variant,#c1c8c7)] bg-[var(--elixir-surface-container,#f0eded)] text-[var(--elixir-on-surface,#1c1b1b)]'
                        : 'border-[var(--elixir-outline-variant,#c1c8c7)] bg-transparent text-[var(--elixir-on-surface,#1c1b1b)] hover:bg-[var(--elixir-surface-container-low,#f6f3f2)]',
                      sizeType && 'min-w-14',
                      !isAvailableForSale && 'cursor-not-allowed opacity-40 line-through',
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
