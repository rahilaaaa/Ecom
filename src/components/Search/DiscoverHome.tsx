import React from 'react'

import { DiscoverCategoryCards } from '@/components/Search/DiscoverCategoryCards'
import { DiscoverSearchInput } from '@/components/Search/DiscoverSearchInput'
import { NewArrivalsCard } from '@/components/Search/NewArrivalsCard'
import { PopularSearchChips } from '@/components/Search/PopularSearchChips'
import { RecentSearches } from '@/components/Search/RecentSearches'
import type { DiscoverPageData } from '@/lib/search/getDiscoverData'

type Props = {
  data: DiscoverPageData
}

export function DiscoverHome({ data }: Props) {
  return (
    <div className="mx-auto w-full max-w-xl px-5 pb-20 pt-10 md:max-w-3xl md:px-6 lg:max-w-5xl lg:pt-14">
      <header className="text-center">
        <h1 className="font-[family-name:var(--font-newsreader)] text-4xl font-medium tracking-tight text-[var(--elixir-on-surface,#1c1b1b)] md:text-5xl">
          Discover
        </h1>
        <div className="mx-auto mt-6 max-w-xl">
          <DiscoverSearchInput />
        </div>
      </header>

      <div className="mx-auto mt-12 flex max-w-xl flex-col gap-10 md:mt-14 lg:max-w-none lg:grid lg:grid-cols-12 lg:gap-12">
        <div className="flex flex-col gap-10 lg:col-span-5">
          <PopularSearchChips items={data.popularSearches} />
          <RecentSearches />
        </div>

        <div className="flex flex-col gap-10 lg:col-span-7">
          <DiscoverCategoryCards categories={data.categories} />
          <NewArrivalsCard
            heading={data.newArrivals.heading}
            description={data.newArrivals.description}
            href={data.newArrivals.href}
          />
        </div>
      </div>
    </div>
  )
}
