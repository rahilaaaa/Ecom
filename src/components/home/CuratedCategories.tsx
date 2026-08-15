import Link from 'next/link'
import React from 'react'

import { Media } from '@/components/Media'
import type { CuratedCategory } from '@/lib/home/getHomepageData'

type Props = {
  heading: string
  categories: CuratedCategory[]
}

export function CuratedCategories({ heading, categories }: Props) {
  if (!categories.length) return null

  return (
    <section className="mx-auto w-full max-w-[1280px] px-5 py-16 md:px-6 md:py-20 lg:px-8">
      <h2 className="mb-10 text-center font-[family-name:var(--font-newsreader)] text-3xl font-medium text-[var(--elixir-on-surface,#1c1b1b)] md:text-4xl">
        {heading}
      </h2>

      <div className="-mx-5 flex gap-6 overflow-x-auto px-5 pb-2 [scrollbar-width:none] md:mx-0 md:justify-center md:overflow-visible md:px-0 [&::-webkit-scrollbar]:hidden">
        {categories.map((category) => (
          <Link
            key={category.id}
            href={category.href}
            className="group flex w-[7.5rem] shrink-0 flex-col items-center gap-3 sm:w-32 md:w-36"
          >
            <div className="relative aspect-square w-full overflow-hidden rounded-full bg-[var(--elixir-surface-container,#f0eded)]">
              {category.image ? (
                <Media
                  resource={category.image}
                  fill
                  imgClassName="object-cover transition duration-500 group-hover:scale-105"
                  className="relative h-full w-full"
                  size="160px"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-xs uppercase tracking-[0.12em] text-[var(--elixir-outline,#717878)]">
                  {category.title.slice(0, 1)}
                </div>
              )}
            </div>
            <span className="text-center text-sm text-[var(--elixir-on-surface,#1c1b1b)]">
              {category.title}
            </span>
          </Link>
        ))}
      </div>
    </section>
  )
}
