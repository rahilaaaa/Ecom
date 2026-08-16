import configPromise from '@payload-config'
import { getPayload } from 'payload'
import React from 'react'

import { Breadcrumb } from '@/components/shop/Breadcrumb'
import { ShopDesktopFilters } from '@/components/shop/ShopDesktopFilters'
import { ShopProductList } from '@/components/shop/ShopProductList'
import { ShopEmptyState, ShopErrorState } from '@/components/shop/ShopStates'
import { ShopToolbar } from '@/components/shop/ShopToolbar'
import { toProductCardData } from '@/lib/shop/productCard'
import { queryShopProducts, type ShopQueryParams } from '@/lib/shop/queryProducts'
import type { Category } from '@/payload-types'

export const metadata = {
  description: 'Shop all products from the Elixir boutique.',
  title: 'Shop All | ELIXIR',
}

type SearchParams = { [key: string]: string | string[] | undefined }

type Props = {
  searchParams: Promise<SearchParams>
}

export default async function ShopPage({ searchParams }: Props) {
  const params = await searchParams
  const query: ShopQueryParams = {
    q: params.q,
    sort: params.sort,
    category: params.category,
    sale: params.sale,
    badge: params.badge,
    minPrice: params.minPrice,
    maxPrice: params.maxPrice,
    page: 1,
  }

  let productsResult: Awaited<ReturnType<typeof queryShopProducts>> | null = null
  let categories: Pick<Category, 'id' | 'title' | 'slug'>[] = []
  let loadError = false

  try {
    const payload = await getPayload({ config: configPromise })
    const [products, categoryResult] = await Promise.all([
      queryShopProducts(query),
      payload.find({
        collection: 'categories',
        limit: 100,
        sort: 'title',
        select: {
          title: true,
          slug: true,
        },
      }),
    ])

    productsResult = products
    categories = categoryResult.docs.map((category) => ({
      id: category.id,
      title: category.title,
      slug: category.slug,
    }))
  } catch {
    loadError = true
  }

  if (loadError || !productsResult) {
    return (
      <ShopShell>
        <ShopErrorState />
      </ShopShell>
    )
  }

  const cards = productsResult.docs.map((doc) => toProductCardData(doc))
  const totalDocs = productsResult.totalDocs
  const hasFilters = Boolean(
    params.q || params.category || params.sale || params.badge || params.minPrice || params.maxPrice,
  )

  return (
    <ShopShell>
      <Breadcrumb
        items={[
          { label: 'Home', href: '/' },
          { label: 'Shop All' },
        ]}
      />

      <div className="mt-6 flex flex-col gap-2 md:mt-8">
        <h1 className="font-[family-name:var(--font-newsreader)] text-4xl font-medium tracking-[-0.01em] text-[var(--elixir-on-surface,#1c1b1b)] md:text-5xl">
          Shop All
        </h1>
        <p className="font-[family-name:var(--font-inter)] text-sm text-[var(--elixir-outline,#717878)]">
          {totalDocs} {totalDocs === 1 ? 'item' : 'items'}
        </p>
      </div>

      <div className="mt-6 border-b border-[var(--elixir-surface-container-highest,#e5e2e1)] pb-5 lg:hidden">
        <ShopToolbar categories={categories} />
      </div>

      <div className="mt-8 flex items-start gap-10 md:mt-10 lg:gap-14">
        <ShopDesktopFilters categories={categories} />

        <div className="min-w-0 flex-1">
          <div className="mb-8 hidden items-center justify-between border-b border-[var(--elixir-surface-container-highest,#e5e2e1)] pb-5 lg:flex">
            <p className="text-sm text-[var(--elixir-outline,#717878)]">
              Showing {cards.length} of {totalDocs}
            </p>
            <ShopToolbar categories={categories} />
          </div>

          {cards.length === 0 ? (
            <ShopEmptyState onClearHref={hasFilters ? '/shop' : '/shop'} />
          ) : (
            <ShopProductList
              key={[
                params.q,
                params.sort,
                params.category,
                params.sale,
                params.badge,
                params.minPrice,
                params.maxPrice,
              ].join('|')}
              initialProducts={cards}
              initialPage={productsResult.page || 1}
              hasNextPage={Boolean(productsResult.hasNextPage)}
              query={query}
            />
          )}
        </div>
      </div>
    </ShopShell>
  )
}

function ShopShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="shop-luxe bg-[var(--elixir-surface,#fcf9f8)] text-[var(--elixir-on-surface,#1c1b1b)]">
      <div className="mx-auto w-full max-w-[1280px] px-5 pb-20 pt-6 md:px-6 md:pt-10 lg:px-8">
        {children}
      </div>
    </div>
  )
}
