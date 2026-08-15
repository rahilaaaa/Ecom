import React from 'react'

type Props = {
  quote: string
  attribution?: string
}

export function EditorialQuote({ quote, attribution }: Props) {
  if (!quote) return null

  return (
    <section className="bg-[var(--elixir-surface,#fcf9f8)] px-5 py-20 md:px-6 md:py-28 lg:px-8">
      <div className="mx-auto flex max-w-3xl flex-col items-center text-center">
        <span
          aria-hidden
          className="mb-6 font-[family-name:var(--font-newsreader)] text-6xl leading-none text-[var(--elixir-on-surface,#1c1b1b)] md:text-7xl"
        >
          “
        </span>
        <blockquote className="font-[family-name:var(--font-newsreader)] text-xl font-medium leading-relaxed text-[var(--elixir-on-surface,#1c1b1b)] md:text-2xl md:leading-relaxed">
          {quote}
        </blockquote>
        {attribution ? (
          <p className="mt-8 font-[family-name:var(--font-inter)] text-xs font-semibold uppercase tracking-[0.14em] text-[var(--elixir-outline,#717878)]">
            — {attribution}
          </p>
        ) : null}
      </div>
    </section>
  )
}
