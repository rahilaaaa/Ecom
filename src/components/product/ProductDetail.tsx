'use client'

import type { Product } from '@/payload-types'
import React, { Suspense } from 'react'

import { ProductGallery } from '@/components/product/ProductGallery'
import { ProductInfo } from '@/components/product/ProductInfo'
import { ProductPDPProvider } from '@/components/product/ProductPDPProvider'
import { ProductPurchaseActions } from '@/components/product/ProductPurchaseActions'
import type { ProductGalleryItem } from '@/lib/product/media'

type Props = {
  product: Product
  gallery: ProductGalleryItem[]
}

export function ProductDetail({ product, gallery }: Props) {
  return (
    <Suspense fallback={null}>
      <ProductPDPProvider product={product}>
        <div className="mx-auto w-full max-w-[1280px] px-5 pb-28 pt-6 md:px-6 md:pb-20 md:pt-10 lg:px-8">
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-2 lg:gap-14 xl:gap-20">
            <ProductGallery
              gallery={gallery}
              product={product}
              productId={String(product.id)}
              productTitle={product.title}
            />
            <ProductInfo product={product} />
          </div>
        </div>

        <div className="fixed inset-x-0 bottom-0 z-40 lg:hidden">
          <ProductPurchaseActions product={product} sticky />
        </div>
      </ProductPDPProvider>
    </Suspense>
  )
}
