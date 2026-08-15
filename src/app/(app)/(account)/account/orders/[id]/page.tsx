import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'

import { getSecureOrder } from '@/lib/orders/getSecureOrder'
import { formatOrderNumber } from '@/lib/account/orderPreview'
import { mergeOpenGraph } from '@/utilities/mergeOpenGraph'

export const dynamic = 'force-dynamic'

type PageProps = {
  params: Promise<{ id: string }>
  searchParams: Promise<{ email?: string; accessToken?: string }>
}

/** Canonical detail page lives at /orders/[id]; keep this path for account navigation. */
export default async function AccountOrderDetailRedirect({ params, searchParams }: PageProps) {
  const { id } = await params
  const query = await searchParams
  const result = await getSecureOrder({
    id,
    email: query.email,
    accessToken: query.accessToken,
  })

  if (!result) {
    notFound()
  }

  const qs = new URLSearchParams()
  if (query.email) qs.set('email', query.email)
  if (query.accessToken) qs.set('accessToken', query.accessToken)
  const suffix = qs.toString() ? `?${qs.toString()}` : ''

  redirect(`/orders/${id}${suffix}`)
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params
  return {
    description: 'Order details and tracking.',
    openGraph: mergeOpenGraph({
      title: `Order #${formatOrderNumber(id)}`,
      url: `/account/orders/${id}`,
    }),
    title: `Order #${formatOrderNumber(id)}`,
  }
}
