import type { Media, Product } from '@/payload-types'

import { ProductGallery } from '@/components/product/ProductGallery'
import { ProductInfo } from '@/components/product/ProductInfo'
import { ProductPurchaseActions } from '@/components/product/ProductPurchaseActions'
import { RecommendedProducts } from '@/components/product/RecommendedProducts'
import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { draftMode } from 'next/headers'
import { notFound } from 'next/navigation'
import React, { Suspense } from 'react'
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

  const gallery = product.gallery?.filter((item) => typeof item.image === 'object') || []
  const metaImage = typeof product.meta?.image === 'object' ? product.meta?.image : undefined
  const canIndex = product._status === 'published'
  const seoImage = metaImage || (gallery.length ? (gallery[0]?.image as Media) : undefined)

  return {
    description: product.meta?.description || '',
    openGraph: seoImage?.url
      ? {
          images: [
            {
              alt: seoImage?.alt || product.title,
              height: seoImage.height!,
              url: seoImage?.url,
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

  const gallery =
    product.gallery
      ?.filter((item) => typeof item.image === 'object')
      .map((item) => ({
        ...item,
        image: item.image as Media,
      })) || []

  const metaImage = typeof product.meta?.image === 'object' ? product.meta?.image : undefined
  const hasStock = product.enableVariants
    ? product?.variants?.docs?.some((variant) => {
        if (typeof variant !== 'object') return false
        return Boolean(variant.inventory && variant.inventory > 0)
      })
    : Boolean(product.inventory && product.inventory > 0)

  let price = product.priceInUSD
  if (product.enableVariants && product?.variants?.docs?.length) {
    price = product.variants.docs.reduce((acc, variant) => {
      if (typeof variant === 'object' && variant?.priceInUSD && acc && variant.priceInUSD > acc) {
        return variant.priceInUSD
      }
      return acc
    }, price)
  }

  const productJsonLd = {
    name: product.title,
    '@context': 'https://schema.org',
    '@type': 'Product',
    description: product.meta?.description || product.title,
    image: metaImage?.url,
    offers: {
      '@type': 'AggregateOffer',
      availability: hasStock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      priceAmount: price,
      priceCurrency: 'USD',
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

      <div className="mx-auto w-full max-w-[1280px] px-5 pb-28 pt-6 md:px-6 md:pb-20 md:pt-10 lg:px-8">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-2 lg:gap-14 xl:gap-20">
          <Suspense
            fallback={
              <div className="aspect-[4/5] w-full animate-pulse rounded-lg bg-[var(--elixir-surface-container,#f0eded)]" />
            }
          >
            <ProductGallery
              gallery={gallery}
              productId={String(product.id)}
              productTitle={product.title}
            />
          </Suspense>

          <Suspense fallback={null}>
            <ProductInfo product={product} />
          </Suspense>
        </div>
      </div>

      <RecommendedProducts products={recommended} />

      <div className="fixed inset-x-0 bottom-0 z-40 lg:hidden">
        <Suspense fallback={null}>
          <ProductPurchaseActions product={product} sticky />
        </Suspense>
      </div>
    </div>
  )
}

async function getRecommendedProducts(product: Product): Promise<Product[]> {
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
      priceInUSD: true,
      compareAtPriceInUSD: true,
      badge: true,
      rating: true,
      featured: true,
    },
  })

  return result.docs as Product[]
}

const queryProductBySlug = async ({ slug }: { slug: string }) => {
  const { isEnabled: draft } = await draftMode()
  const payload = await getPayload({ config: configPromise })

  const result = await payload.find({
    collection: 'products',
    depth: 3,
    draft,
    limit: 1,
    overrideAccess: draft,
    pagination: false,
    where: {
      and: [
        {
          slug: {
            equals: slug,
          },
        },
        ...(draft ? [] : [{ _status: { equals: 'published' } }]),
      ],
    },
    populate: {
      variants: {
        title: true,
        priceInUSD: true,
        inventory: true,
        options: true,
      },
    },
  })

  return result.docs?.[0] || null
}
