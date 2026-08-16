import type { Metadata } from 'next'

import type { Page, Product } from '../payload-types'

import { mergeOpenGraph } from './mergeOpenGraph'

export const generateMeta = async (args: { doc: Page | Product }): Promise<Metadata> => {
  const { doc } = args || {}

  const imageUrl =
    typeof doc?.meta?.image === 'object' &&
    doc.meta.image !== null &&
    'url' in doc.meta.image &&
    typeof doc.meta.image.url === 'string'
      ? doc.meta.image.url
      : null

  const ogImage = imageUrl
    ? imageUrl.startsWith('http://') || imageUrl.startsWith('https://')
      ? imageUrl
      : `${process.env.NEXT_PUBLIC_SERVER_URL}${imageUrl}`
    : undefined

  return {
    description: doc?.meta?.description,
    openGraph: mergeOpenGraph({
      ...(doc?.meta?.description
        ? {
            description: doc?.meta?.description,
          }
        : {}),
      images: ogImage
        ? [
            {
              url: ogImage,
            },
          ]
        : undefined,
      title: doc?.meta?.title || doc?.title || 'Payload Ecommerce Template',
      url: Array.isArray(doc?.slug) ? doc?.slug.join('/') : '/',
    }),
    title: doc?.meta?.title || doc?.title || 'Payload Ecommerce Template',
  }
}
