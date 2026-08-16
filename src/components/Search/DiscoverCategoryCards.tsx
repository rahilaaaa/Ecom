import Link from 'next/link'
import React from 'react'

import { Media } from '@/components/Media'
import type { DiscoverCategoryCard } from '@/lib/search/getDiscoverData'

type Props = {
  categories: DiscoverCategoryCard[]
}

export function DiscoverCategoryCards({ categories }: Props) {
  if (!categories.length) return null

  return (
    <section aria-labelledby="curated-categories">
      <div className="border-b border-[var(--elixir-outline-variant,#c4c7c7)]/50 pb-2">
        <h2
          id="curated-categories"
          className="text-[11px] font-medium uppercase tracking-[0.16em] text-[var(--elixir-outline,#717878)]"
        >
          Curated Categories
        </h2>
      </div>

      <ul className="mt-5 flex flex-col gap-4 md:grid md:grid-cols-2 md:gap-5">
        {categories.map((category) => (
          <li key={category.id}>
            <Link
              href={category.href}
              className="group relative block aspect-[16/9] overflow-hidden rounded-xl bg-[var(--elixir-surface-container,#f0eded)] md:aspect-[5/3]"
            >
              {category.image ? (
                <Media
                  resource={category.image}
                  fill
                  imgClassName="object-cover transition duration-700 group-hover:scale-[1.03]"
                  className="relative h-full w-full"
                  size="(max-width: 768px) 92vw, 45vw"
                />
              ) : (
                <div className="absolute inset-0 bg-[var(--elixir-primary-container,#0d2b2b)]" />
              )}

              <div className="absolute inset-0 bg-gradient-to-r from-black/55 via-black/25 to-transparent" />

              <div className="absolute inset-0 flex flex-col justify-end p-5 text-white md:p-6">
                <h3 className="font-[family-name:var(--font-newsreader)] text-2xl font-medium md:text-3xl">
                  {category.title}
                </h3>
                {category.description ? (
                  <p className="mt-1 max-w-xs text-sm text-white/85">{category.description}</p>
                ) : (
                  <p className="mt-1 text-sm text-white/85">Explore the collection</p>
                )}
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}
