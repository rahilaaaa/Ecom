import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { unstable_cache } from 'next/cache'

import type { Category, Homepage, Media, Product } from '@/payload-types'
import { toProductCardData, type ProductCardData } from '@/lib/shop/productCard'

export type CuratedCategory = {
  id: string
  title: string
  slug: string
  href: string
  image: Media | null
}

export type HomepageHero = {
  eyebrow: string
  heading: string
  ctaLabel: string
  ctaUrl: string
  media: Media | null
}

export type HomepageData = {
  homepage: Homepage | null
  hero: HomepageHero
  curatedHeading: string
  categories: CuratedCategory[]
  bestSellersHeading: string
  viewAllLabel: string
  bestSellers: ProductCardData[]
  testimonial: {
    quote: string
    attribution: string
  } | null
  newsletter: {
    heading: string
    description: string
    formId: string | null
  }
}

function mapCategory(category: Category): CuratedCategory {
  const image =
    category.image && typeof category.image === 'object' ? (category.image as Media) : null

  return {
    id: String(category.id),
    title: category.title,
    slug: category.slug,
    href: `/shop?category=${category.id}`,
    image,
  }
}

function withSubtitle(product: Product): ProductCardData {
  const card = toProductCardData(product)
  const categories = (product.categories || [])
    .map((item) => (typeof item === 'object' && item ? item.title : null))
    .filter(Boolean) as string[]

  return {
    ...card,
    subtitle: categories.length ? categories.join(' · ') : null,
  }
}

async function fetchHomepageDataUncached(): Promise<HomepageData> {
  const payload = await getPayload({ config: configPromise })

  let homepage: Homepage | null = null
  try {
    homepage = (await payload.findGlobal({
      slug: 'homepage',
      depth: 2,
    })) as Homepage
  } catch {
    homepage = null
  }

  const limit = homepage?.bestSellers?.limit || 4

  const [allCategories, featuredProducts, fallbackProducts] = await Promise.all([
    payload.find({
      collection: 'categories',
      depth: 1,
      limit: 24,
      sort: 'title',
    }),
    payload.find({
      collection: 'products',
      depth: 1,
      draft: false,
      limit,
      overrideAccess: false,
      sort: '-updatedAt',
      where: {
        and: [
          { _status: { equals: 'published' } },
          { featured: { equals: true } },
        ],
      },
      select: {
        title: true,
        slug: true,
        gallery: true,
        categories: true,
        priceInINR: true,
        badge: true,
        rating: true,
        featured: true,
        enableVariants: true,
        variants: true,
      },
    }),
    payload.find({
      collection: 'products',
      depth: 1,
      draft: false,
      limit,
      overrideAccess: false,
      sort: '-createdAt',
      where: {
        _status: {
          equals: 'published',
        },
      },
      select: {
        title: true,
        slug: true,
        gallery: true,
        categories: true,
        priceInINR: true,
        badge: true,
        rating: true,
        featured: true,
        enableVariants: true,
        variants: true,
      },
    }),
  ])

  const curatedDocs = allCategories.docs.filter((category) => category.curated !== false)
  let categories = (curatedDocs.length ? curatedDocs : allCategories.docs)
    .slice(0, 12)
    .map(mapCategory)

  const productDocs =
    featuredProducts.docs.length > 0 ? featuredProducts.docs : fallbackProducts.docs

  const media =
    homepage?.hero?.media && typeof homepage.hero.media === 'object'
      ? homepage.hero.media
      : null

  const formId =
    homepage?.newsletter?.form && typeof homepage.newsletter.form === 'object'
      ? String(homepage.newsletter.form.id)
      : homepage?.newsletter?.form
        ? String(homepage.newsletter.form)
        : null

  return {
    homepage,
    hero: {
      eyebrow: homepage?.hero?.eyebrow || 'THE NEW STANDARD',
      heading: homepage?.hero?.heading || 'Spring Collection 2024',
      ctaLabel: homepage?.hero?.ctaLabel || 'SHOP NOW',
      ctaUrl: homepage?.hero?.ctaUrl || '/shop',
      media,
    },
    curatedHeading: homepage?.curated?.heading || 'Curated For You',
    categories,
    bestSellersHeading: homepage?.bestSellers?.heading || 'Best Sellers',
    viewAllLabel: homepage?.bestSellers?.viewAllLabel || 'View All Products',
    bestSellers: productDocs.map((doc) => withSubtitle(doc as Product)),
    testimonial:
      homepage?.testimonial?.quote
        ? {
            quote: homepage.testimonial.quote,
            attribution: homepage.testimonial.attribution || '',
          }
        : {
            quote:
              'Elixir has completely redefined my wardrobe. The attention to detail and the quality of the fabrics are simply unmatched in today\'s market. It is quiet luxury at its finest.',
            attribution: 'SARAH JENKINS, VOGUE EDITOR',
          },
    newsletter: {
      heading: homepage?.newsletter?.heading || 'Join the Inner Circle',
      description:
        homepage?.newsletter?.description ||
        'Sign up to receive early access to new collections, exclusive events, and curated editorial content.',
      formId,
    },
  }
}

export const getHomepageData = unstable_cache(fetchHomepageDataUncached, ['homepage-data'], {
  tags: ['global_homepage', 'products', 'categories'],
  revalidate: 60,
})
