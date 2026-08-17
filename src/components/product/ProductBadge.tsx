import type { Product } from '@/payload-types'
import React from 'react'

import { cn } from '@/utilities/cn'

const BADGE_LABEL: Record<Exclude<NonNullable<Product['badge']>, 'none'>, string> = {
  new: 'New',
  sale: 'Sale',
}

type Props = {
  badge?: Product['badge']
  className?: string
}

export function ProductBadge({ badge, className }: Props) {
  if (!badge || badge === 'none') return null

  return (
    <span
      className={cn(
        'inline-flex px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.1em]',
        badge === 'sale'
          ? 'bg-[#f3d6d6] text-[#5c2b2b]'
          : 'bg-[var(--elixir-primary,#001515)] text-white',
        className,
      )}
    >
      {BADGE_LABEL[badge]}
    </span>
  )
}
