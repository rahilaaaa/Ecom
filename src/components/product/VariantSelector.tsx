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
  buildVariantOptionGroups,
  canSelectOption,
  getOptionAvailability,
} from '@/lib/product/variants'

const COLOR_SWATCHES: Record<string, string> = {
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
  return COLOR_SWATCHES[key] || COLOR_SWATCHES[label.toLowerCase().trim()] || '#c1c8c7'
}

type Props = {
  product: Product
}

export function VariantSelector({ product }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const groups = useMemo(() => buildVariantOptionGroups(product), [product])

  const selectedByType = useMemo(() => {
    const selected: Record<string, string> = {}
    for (const group of groups) {
      const value = searchParams.get(group.name)
      if (value) selected[group.name] = value
    }
    return selected
  }, [groups, searchParams])

  if (!groups.length) return null

  return (
    <div className="flex flex-col gap-8">
      {groups.map((group) => {
        const selectedOptionId = selectedByType[group.name]
        const selectedOption = group.options.find((option) => option.id === selectedOptionId)

        return (
          <div key={group.id} className="flex flex-col gap-3">
            <div className="flex items-center justify-between gap-4">
              <p className="font-[family-name:var(--font-inter)] text-xs font-semibold uppercase tracking-[0.12em] text-[var(--elixir-on-surface,#1c1b1b)]">
                {group.isColor && selectedOption
                  ? `${group.label}: ${selectedOption.label}`
                  : group.label}
              </p>
              {group.isSize ? <SizeGuide productTitle={product.title} /> : null}
            </div>

            <div className={cn('flex flex-wrap gap-3', group.isColor && 'gap-4')}>
              {group.options.map((option) => {
                const selectedOtherIds = group.isColor
                  ? []
                  : groups
                      .filter((item) => item.name !== group.name)
                      .map((item) => selectedByType[item.name])
                      .filter((id): id is string => Boolean(id))

                const availability = getOptionAvailability({
                  product,
                  optionId: option.id,
                  selectedOptionIds: selectedOtherIds,
                })
                const isActive = selectedOptionId === option.id && availability.exists
                const canSelect = canSelectOption(availability)

                const onSelect = () => {
                  if (!canSelect) return
                  const nextParams = group.isColor
                    ? buildParamsForColorChange({
                        product,
                        colorTypeName: group.name,
                        nextColorOptionId: option.id,
                        currentParams: searchParams,
                      })
                    : buildParamsForOptionChange({
                        product,
                        typeName: group.name,
                        optionId: option.id,
                        currentParams: searchParams,
                      })

                  router.replace(createUrl(pathname, nextParams), { scroll: false })
                }

                if (group.isColor) {
                  const swatch = resolveSwatchColor(option.label, option.value)
                  return (
                    <button
                      key={option.id}
                      type="button"
                      disabled={!canSelect}
                      aria-label={`${option.label}${!availability.exists ? ' (unavailable)' : !availability.inStock ? ' (out of stock)' : ''}`}
                      aria-pressed={isActive}
                      title={`${option.label}${!availability.exists ? ' (Unavailable)' : !availability.inStock ? ' (Out of Stock)' : ''}`}
                      onClick={onSelect}
                      className={cn(
                        'flex h-12 w-12 items-center justify-center rounded-full border transition',
                        isActive
                          ? 'border-[var(--elixir-on-surface,#1c1b1b)]'
                          : 'border-transparent',
                        !canSelect && 'cursor-not-allowed opacity-40',
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
                    disabled={!canSelect}
                    aria-pressed={isActive}
                    aria-label={`${group.label} ${option.label}${!availability.exists ? ' (unavailable)' : !availability.inStock ? ' (out of stock)' : ''}`}
                    title={`${option.label}${!availability.exists ? ' (Unavailable)' : !availability.inStock ? ' (Out of Stock)' : ''}`}
                    onClick={onSelect}
                    className={cn(
                      'inline-flex min-h-12 min-w-12 items-center justify-center rounded-md border px-4 text-sm transition',
                      isActive
                        ? 'border-[var(--elixir-outline-variant,#c1c8c7)] bg-[var(--elixir-surface-container,#f0eded)] text-[var(--elixir-on-surface,#1c1b1b)]'
                        : 'border-[var(--elixir-outline-variant,#c1c8c7)] bg-transparent text-[var(--elixir-on-surface,#1c1b1b)] hover:bg-[var(--elixir-surface-container-low,#f6f3f2)]',
                      group.isSize && 'min-w-14',
                      !canSelect && 'cursor-not-allowed opacity-40 line-through',
                      canSelect && !availability.inStock && 'opacity-50',
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
