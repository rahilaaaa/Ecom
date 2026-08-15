import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { unstable_cache } from 'next/cache'

import type { Category, Discover, Media } from '@/payload-types'
import {
  DEFAULT_POPULAR_SEARCHES,
  type PopularSearch,
} from '@/lib/search/constants'

export type DiscoverCategoryCard = {
  id: string
  title: string
  description: string | null
  href: string
  image: Media | null
}

export type DiscoverPageData = {
  popularSearches: PopularSearch[]
  categories: DiscoverCategoryCard[]
  newArrivals: {
    heading: string
    description: string
    href: string
  }
}

function mapPopular(discover: Discover | null): PopularSearch[] {
  const configured = (discover?.popularSearches || [])
    .map((item) => {
      const label = item.label?.trim()
      if (!label) return null
      return {
        label,
        query: item.query?.trim() || label,
      }
    })
    .filter(Boolean) as PopularSearch[]

  return configured.length ? configured : DEFAULT_POPULAR_SEARCHES
}

async function fetchDiscoverDataUncached(): Promise<DiscoverPageData> {
  const payload = await getPayload({ config: configPromise })

  let discover: Discover | null = null
  try {
    discover = (await payload.findGlobal({
      slug: 'discover',
      depth: 0,
    })) as Discover
  } catch {
    discover = null
  }

  const categoryResult = await payload.find({
    collection: 'categories',
    depth: 1,
    limit: 8,
    sort: 'title',
    where: {
      curated: {
        equals: true,
      },
    },
  })

  const categories: DiscoverCategoryCard[] = (categoryResult.docs as Category[]).map((category) => ({
    id: String(category.id),
    title: category.title,
    description: category.description || null,
    href: `/shop?category=${category.id}`,
    image: category.image && typeof category.image === 'object' ? category.image : null,
  }))

  return {
    popularSearches: mapPopular(discover),
    categories,
    newArrivals: {
      heading: discover?.newArrivals?.heading || 'New Arrivals',
      description: discover?.newArrivals?.description || 'Explore the latest seasonal pieces.',
      href: discover?.newArrivals?.href || '/shop?badge=new',
    },
  }
}

export const getDiscoverData = unstable_cache(fetchDiscoverDataUncached, ['discover-page'], {
  tags: ['global_discover', 'categories'],
  revalidate: 60,
})
