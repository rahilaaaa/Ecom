import Link from 'next/link'
import React from 'react'

import { cn } from '@/utilities/cn'

type Crumb = {
  label: string
  href?: string
}

type Props = {
  items: Crumb[]
  className?: string
}

export function Breadcrumb({ items, className }: Props) {
  return (
    <nav aria-label="Breadcrumb" className={cn('text-sm text-[var(--elixir-outline,#717878)]', className)}>
      <ol className="flex flex-wrap items-center gap-2">
        {items.map((item, index) => {
          const isLast = index === items.length - 1
          return (
            <li key={`${item.label}-${index}`} className="flex items-center gap-2">
              {index > 0 ? <span aria-hidden>/</span> : null}
              {item.href && !isLast ? (
                <Link
                  href={item.href}
                  className="transition hover:text-[var(--elixir-on-surface,#1c1b1b)]"
                >
                  {item.label}
                </Link>
              ) : (
                <span
                  aria-current={isLast ? 'page' : undefined}
                  className={isLast ? 'text-[var(--elixir-on-surface-variant,#414848)]' : undefined}
                >
                  {item.label}
                </span>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
