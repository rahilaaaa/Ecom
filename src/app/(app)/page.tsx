import type { Metadata } from 'next'
import Link from 'next/link'
import React from 'react'

import { BestSellers } from '@/components/home/BestSellers'
import { CuratedCategories } from '@/components/home/CuratedCategories'
import { EditorialQuote } from '@/components/home/EditorialQuote'
import { HomeHero } from '@/components/home/HomeHero'
import { InnerCircleNewsletter } from '@/components/home/InnerCircleNewsletter'
import { getHomepageData } from '@/lib/home/getHomepageData'

export const metadata: Metadata = {
  title: 'ELIXIR | Modern Minimalism',
  description:
    'A digital boutique for the discerning. Explore the latest collection from ELIXIR.',
}

export default async function HomePage() {
  let data: Awaited<ReturnType<typeof getHomepageData>> | null = null
  let loadError = false

  try {
    data = await getHomepageData()
  } catch {
    loadError = true
  }

  if (loadError || !data) {
    return (
      <div className="shop-luxe flex min-h-[50vh] flex-col items-center justify-center gap-4 bg-[var(--elixir-surface,#fcf9f8)] px-5 text-center">
        <h1 className="font-[family-name:var(--font-newsreader)] text-3xl font-medium">
          Welcome to ELIXIR
        </h1>
        <p className="max-w-md text-sm text-[var(--elixir-on-surface-variant,#414848)]">
          The boutique is momentarily unavailable. Please refresh or visit the shop.
        </p>
        <Link
          href="/shop"
          className="inline-flex min-h-12 items-center bg-[var(--elixir-primary-container,#0d2b2b)] px-6 text-xs font-semibold uppercase tracking-[0.12em] text-white"
        >
          Shop All
        </Link>
      </div>
    )
  }

  return (
    <div className="shop-luxe bg-[var(--elixir-surface,#fcf9f8)] text-[var(--elixir-on-surface,#1c1b1b)]">
      <HomeHero hero={data.hero} />
      <CuratedCategories heading={data.curatedHeading} categories={data.categories} />
      <BestSellers
        heading={data.bestSellersHeading}
        viewAllLabel={data.viewAllLabel}
        products={data.bestSellers}
      />
      {data.testimonial ? (
        <EditorialQuote quote={data.testimonial.quote} attribution={data.testimonial.attribution} />
      ) : null}
      <InnerCircleNewsletter
        heading={data.newsletter.heading}
        description={data.newsletter.description}
        formId={data.newsletter.formId}
      />
    </div>
  )
}
