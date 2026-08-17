'use client'

import { MinusIcon, PlusIcon } from 'lucide-react'
import React from 'react'

import { cn } from '@/utilities/cn'

type Props = {
  value: number
  min?: number
  max: number
  onChange: (value: number) => void
  disabled?: boolean
  className?: string
}

export function QuantitySelector({
  value,
  min = 1,
  max,
  onChange,
  disabled = false,
  className,
}: Props) {
  const canDecrement = !disabled && value > min
  const canIncrement = !disabled && value < max

  return (
    <div className={cn('flex flex-col gap-3', className)}>
      <p className="font-[family-name:var(--font-inter)] text-xs font-semibold uppercase tracking-[0.12em] text-[var(--elixir-on-surface,#1c1b1b)]">
        Quantity
      </p>
      <div className="inline-flex h-12 w-fit items-center border border-[var(--elixir-outline-variant,#c1c8c7)]">
        <button
          type="button"
          aria-label="Decrease quantity"
          disabled={!canDecrement}
          onClick={() => onChange(Math.max(min, value - 1))}
          className="flex h-full w-12 items-center justify-center text-[var(--elixir-on-surface,#1c1b1b)] transition hover:bg-[var(--elixir-surface-container-low,#f6f3f2)] disabled:cursor-not-allowed disabled:opacity-40"
        >
          <MinusIcon className="h-4 w-4" />
        </button>
        <span className="min-w-10 text-center text-sm tabular-nums" aria-live="polite">
          {value}
        </span>
        <button
          type="button"
          aria-label="Increase quantity"
          disabled={!canIncrement}
          onClick={() => onChange(Math.min(max, value + 1))}
          className="flex h-full w-12 items-center justify-center text-[var(--elixir-on-surface,#1c1b1b)] transition hover:bg-[var(--elixir-surface-container-low,#f6f3f2)] disabled:cursor-not-allowed disabled:opacity-40"
        >
          <PlusIcon className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
