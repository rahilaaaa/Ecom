import { Sparkles } from 'lucide-react'
import Link from 'next/link'
import React from 'react'

type Props = {
  heading: string
  description: string
  href: string
}

export function NewArrivalsCard({ heading, description, href }: Props) {
  return (
    <Link
      href={href}
      className="flex flex-col items-center rounded-2xl border border-[var(--elixir-outline-variant,#c4c7c7)]/60 bg-[var(--elixir-surface-container-low,#f6f3f2)] px-6 py-12 text-center transition hover:border-[var(--elixir-on-surface,#1c1b1b)]/40"
    >
      <Sparkles
        className="h-5 w-5 text-[var(--elixir-on-surface,#1c1b1b)]"
        strokeWidth={1.5}
        aria-hidden
      />
      <h2 className="mt-4 font-[family-name:var(--font-newsreader)] text-3xl font-medium text-[var(--elixir-on-surface,#1c1b1b)]">
        {heading}
      </h2>
      <p className="mt-2 text-sm text-[var(--elixir-on-surface-variant,#414848)]">{description}</p>
    </Link>
  )
}
