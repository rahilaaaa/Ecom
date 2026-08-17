import React from 'react'

import { cn } from '@/utilities/cn'

type Props = {
  rating: number
  className?: string
}

export function ProductRating({ rating, className }: Props) {
  if (!Number.isFinite(rating)) return null

  const clamped = Math.min(5, Math.max(0, rating))
  const label = `${clamped.toFixed(1)} out of 5`

  return (
    <div
      className={cn('inline-flex items-center gap-2', className)}
      aria-label={label}
      title={label}
    >
      <span className="inline-flex" aria-hidden>
        {Array.from({ length: 5 }, (_, index) => {
          const fill = Math.min(1, Math.max(0, clamped - index))
          return (
            <span key={index} className="relative inline-block h-4 w-4 text-[#c47a3a]">
              <span className="text-[var(--elixir-outline-variant,#c1c8c7)]">★</span>
              {fill > 0 ? (
                <span
                  className="absolute inset-0 overflow-hidden"
                  style={{ width: `${fill * 100}%` }}
                >
                  ★
                </span>
              ) : null}
            </span>
          )
        })}
      </span>
      <span className="text-sm text-[var(--elixir-on-surface-variant,#414848)]">
        {clamped.toFixed(1)}
      </span>
    </div>
  )
}
