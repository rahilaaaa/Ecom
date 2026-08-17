import type { Product } from '@/payload-types'
import configPromise from '@payload-config'
import { draftMode } from 'next/headers'
import { getPayload } from 'payload'
import { cache } from 'react'

export const queryProductBySlug = cache(async ({ slug }: { slug: string }): Promise<Product | null> => {
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
        ...(draft ? [] : [{ _status: { equals: 'published' as const } }]),
      ],
    },
  })

  const product = result.docs?.[0]
  if (!product) return null

  if (!product.enableVariants) return product

  const variants = await payload.find({
    collection: 'variants',
    depth: 2,
    draft,
    limit: 1000,
    overrideAccess: draft,
    pagination: false,
    where: {
      and: [
        { product: { equals: product.id } },
        ...(draft ? [] : [{ _status: { equals: 'published' as const } }]),
      ],
    },
  })

  return {
    ...product,
    variants: {
      docs: variants.docs,
      hasNextPage: false,
      totalDocs: variants.docs.length,
    },
  }
})
