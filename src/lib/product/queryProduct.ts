import type { Media, Product, Variant } from '@/payload-types'
import configPromise from '@payload-config'
import { draftMode } from 'next/headers'
import { getPayload, type Payload } from 'payload'
import { cache } from 'react'

function uniqueIds(values: Array<number | null | undefined>): number[] {
  const seen = new Set<number>()
  const ids: number[] = []
  for (const value of values) {
    if (typeof value !== 'number' || seen.has(value)) continue
    seen.add(value)
    ids.push(value)
  }
  return ids
}

async function hydrateGalleryMedia(
  payload: Payload,
  product: Product,
  draft: boolean,
): Promise<Product> {
  const rows = product.gallery || []
  if (!rows.length) return product

  const missingIds = uniqueIds(
    rows.map((row) => (typeof row.image === 'number' ? row.image : null)),
  )

  if (!missingIds.length) return product

  const media = await payload.find({
    collection: 'media',
    depth: 0,
    draft,
    limit: missingIds.length,
    overrideAccess: draft,
    pagination: false,
    where: {
      id: {
        in: missingIds,
      },
    },
  })

  const byId = new Map<number, Media>(media.docs.map((doc) => [doc.id, doc]))

  return {
    ...product,
    gallery: rows.map((row) => ({
      ...row,
      image: typeof row.image === 'number' ? (byId.get(row.image) ?? row.image) : row.image,
    })),
  }
}

function detachCircularProduct(variant: Variant): Variant {
  const productRef = variant.product
  return {
    ...variant,
    product:
      typeof productRef === 'object' && productRef && 'id' in productRef
        ? productRef.id
        : productRef,
  }
}

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

  const found = result.docs?.[0]
  if (!found) return null

  const product = await hydrateGalleryMedia(payload, found, draft)

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
      docs: variants.docs.map(detachCircularProduct),
      hasNextPage: false,
      totalDocs: variants.docs.length,
    },
  }
})
