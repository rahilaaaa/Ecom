import type { Metadata } from 'next'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { Suspense } from 'react'

import { DiscoverHome } from '@/components/Search/DiscoverHome'
import { SearchResults } from '@/components/Search/SearchResults'
import { getDiscoverData } from '@/lib/search/getDiscoverData'
import { sanitizeSearchQuery } from '@/lib/search/constants'
import { toProductCardData } from '@/lib/shop/productCard'
import { queryShopProducts, type ShopQueryParams } from '@/lib/shop/queryProducts'
import { mergeOpenGraph } from '@/utilities/mergeOpenGraph'
import type { Category } from '@/payload-types'

export const dynamic = 'force-dynamic'

type SearchParams = { [key: string]: string | string[] | undefined }

type Props = {
  searchParams: Promise<SearchParams>
}

function first(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0]
  return value
}

export default async function SearchPage({ searchParams }: Props) {
  const params = await searchParams
  const q = sanitizeSearchQuery(first(params.q) || '')

  if (!q) {
    const data = await getDiscoverData()
    return (
      <Suspense fallback={<DiscoverSkeleton />}>
        <DiscoverHome data={data} />
      </Suspense>
    )
  }

  const shopQuery: ShopQueryParams = {
    q,
    sort: params.sort,
    category: params.category,
    sale: params.sale,
    badge: params.badge,
    minPrice: params.minPrice,
    maxPrice: params.maxPrice,
    page: 1,
  }

  let cards: ReturnType<typeof toProductCardData>[] = []
  let totalDocs = 0
  let hasNextPage = false
  let categories: Pick<Category, 'id' | 'title' | 'slug'>[] = []
  let loadError = false

  try {
    const payload = await getPayload({ config: configPromise })
    const [products, categoryResult] = await Promise.all([
      queryShopProducts(shopQuery),
      payload.find({
        collection: 'categories',
        limit: 100,
        sort: 'title',
        select: { title: true, slug: true },
      }),
    ])

    cards = products.docs.map((doc) => toProductCardData(doc))
    totalDocs = products.totalDocs
    hasNextPage = Boolean(products.hasNextPage)
    categories = categoryResult.docs.map((category) => ({
      id: category.id,
      title: category.title,
      slug: category.slug,
    }))
  } catch {
    loadError = true
  }

  return (
    <SearchResults
      query={q}
      cards={cards}
      totalDocs={totalDocs}
      hasNextPage={hasNextPage}
      shopQuery={shopQuery}
      categories={categories}
      loadError={loadError}
    />
  )
}

function DiscoverSkeleton() {
  return (
    <div className="mx-auto w-full max-w-xl animate-pulse px-5 pb-20 pt-10 md:max-w-3xl">
      <div className="mx-auto h-10 w-40 rounded bg-[var(--elixir-surface-container,#f0eded)]" />
      <div className="mx-auto mt-6 h-12 max-w-xl rounded-full bg-[var(--elixir-surface-container,#f0eded)]" />
      <div className="mt-12 h-4 w-40 rounded bg-[var(--elixir-surface-container,#f0eded)]" />
      <div className="mt-4 flex flex-wrap gap-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-10 w-28 rounded-lg bg-[var(--elixir-surface-container,#f0eded)]" />
        ))}
      </div>
      <div className="mt-10 aspect-[16/9] rounded-xl bg-[var(--elixir-surface-container,#f0eded)]" />
    </div>
  )
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const params = await searchParams
  const q = sanitizeSearchQuery(first(params.q) || '')

  if (q) {
    return {
      description: `Search results for ${q}.`,
      openGraph: mergeOpenGraph({
        title: `Search: ${q}`,
        url: `/search?q=${encodeURIComponent(q)}`,
      }),
      title: `Search: ${q} | ELIXIR`,
    }
  }

  return {
    description: 'Discover collections, products, and curated categories.',
    openGraph: mergeOpenGraph({
      title: 'Discover',
      url: '/search',
    }),
    title: 'Discover | ELIXIR',
  }
}
