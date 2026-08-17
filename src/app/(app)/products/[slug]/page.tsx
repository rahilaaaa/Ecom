import type { Product } from '@/payload-types'

import { ProductDetail } from '@/components/product/ProductDetail'
import { RecommendedProducts } from '@/components/product/RecommendedProducts'
import { getEffectivePriceRange, STORE_CURRENCY_CODE } from '@/lib/currency'
import { productHasAnyStock } from '@/lib/product/inventory'
import { getMediaAlt, getProductGalleryItems, isMedia } from '@/lib/product/media'
import { queryProductBySlug } from '@/lib/product/queryProduct'
import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { notFound } from 'next/navigation'
import React from 'react'
import type { Metadata } from 'next'

type Args = {
  params: Promise<{
    slug: string
  }>
}

export async function generateMetadata({ params }: Args): Promise<Metadata> {
  const { slug } = await params
  const product = await queryProductBySlug({ slug })

  if (!product) return {}

  const gallery = getProductGalleryItems(product)
  const metaImage = isMedia(product.meta?.image) ? product.meta.image : undefined
  const canIndex = product._status === 'published'
  const seoImage = metaImage || gallery[0]?.image
  const seoAlt = seoImage ? getMediaAlt(seoImage, product.title) : product.title

  return {
    description: product.meta?.description || '',
    openGraph: seoImage?.url
      ? {
          images: [
            {
              alt: seoAlt,
              height: seoImage.height!,
              url: seoImage.url,
              width: seoImage.width!,
            },
          ],
        }
      : null,
    robots: {
      follow: canIndex,
      googleBot: {
        follow: canIndex,
        index: canIndex,
      },
      index: canIndex,
    },
    title: product.meta?.title || product.title,
  }
}

export default async function ProductPage({ params }: Args) {
  const { slug } = await params
  const product = await queryProductBySlug({ slug })

  if (!product) return notFound()

  const gallery = getProductGalleryItems(product)
  const metaImage = isMedia(product.meta?.image) ? product.meta.image : undefined
  const hasStock = productHasAnyStock(product)
  const priceRange = getEffectivePriceRange(product)
  const price = priceRange.lowestAmount

  const productJsonLd = {
    name: product.title,
    '@context': 'https://schema.org',
    '@type': 'Product',
    description: product.meta?.description || product.title,
    image: metaImage?.url,
    offers: {
      '@type': 'AggregateOffer',
      availability: hasStock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      lowPrice: priceRange.lowestAmount,
      highPrice: priceRange.highestAmount,
      priceAmount: price,
      priceCurrency: STORE_CURRENCY_CODE,
    },
  }

  const recommended = await getRecommendedProducts(product)

  return (
    <div className="shop-luxe bg-[var(--elixir-surface,#fcf9f8)] text-[var(--elixir-on-surface,#1c1b1b)]">
      <script
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(productJsonLd),
        }}
        type="application/ld+json"
      />

      <ProductDetail product={product} gallery={gallery} />

      <RecommendedProducts products={recommended} />
    </div>
  )
}

async function getRecommendedProducts(product: Product) {
  const related =
    product.relatedProducts?.filter(
      (item): item is Product => typeof item === 'object' && Boolean(item),
    ) || []

  if (related.length) {
    return related.slice(0, 8)
  }

  const payload = await getPayload({ config: configPromise })
  const categoryIds = (product.categories || [])
    .map((category) => (typeof category === 'object' ? category.id : category))
    .filter(Boolean)

  const result = await payload.find({
    collection: 'products',
    depth: 1,
    draft: false,
    limit: 8,
    overrideAccess: false,
    where: {
      and: [
        { _status: { equals: 'published' } },
        { id: { not_equals: product.id } },
        ...(categoryIds.length
          ? [
              {
                categories: {
                  in: categoryIds,
                },
              },
            ]
          : []),
      ],
    },
    select: {
      title: true,
      slug: true,
      gallery: true,
      categories: true,
      priceInINR: true,
      pricingMode: true,
      enableVariants: true,
      variants: true,
      badge: true,
      rating: true,
      featured: true,
    },
  })

  return result.docs
}
