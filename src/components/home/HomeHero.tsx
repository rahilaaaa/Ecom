import Link from 'next/link'
import React from 'react'

import { Media } from '@/components/Media'
import type { HomepageHero } from '@/lib/home/getHomepageData'

type Props = {
  hero: HomepageHero
}

export function HomeHero({ hero }: Props) {
  return (
    <section className="relative isolate min-h-[78vh] w-full overflow-hidden bg-[var(--elixir-surface-container,#f0eded)] md:min-h-[88vh]">
      {hero.media ? (
        <Media
          resource={hero.media}
          fill
          priority
          imgClassName="object-cover"
          className="absolute inset-0"
          size="100vw"
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-[#2a2420] via-[#4a3f38] to-[#1c1b1b]" />
      )}

      <div className="absolute inset-0 bg-black/35" aria-hidden />

      <div className="relative z-10 mx-auto flex min-h-[78vh] max-w-[1280px] flex-col items-center justify-center px-5 py-24 text-center text-white md:min-h-[88vh] md:px-8">
        {hero.eyebrow ? (
          <p className="mb-4 font-[family-name:var(--font-inter)] text-[11px] font-semibold uppercase tracking-[0.18em] md:text-xs">
            {hero.eyebrow}
          </p>
        ) : null}
        <h1 className="max-w-3xl font-[family-name:var(--font-newsreader)] text-4xl font-medium leading-[1.15] tracking-[-0.02em] md:text-6xl lg:text-7xl">
          {hero.heading}
        </h1>
        {hero.ctaLabel ? (
          <Link
            href={hero.ctaUrl || '/shop'}
            className="mt-8 inline-flex min-h-12 min-w-[160px] items-center justify-center bg-[var(--elixir-primary,#001515)] px-8 text-xs font-semibold uppercase tracking-[0.14em] text-white transition hover:bg-[#164a4a]"
          >
            {hero.ctaLabel}
          </Link>
        ) : null}
      </div>
    </section>
  )
}
