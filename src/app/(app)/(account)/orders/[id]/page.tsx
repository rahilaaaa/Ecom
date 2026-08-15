import type { Order } from '@/payload-types'
import type { Metadata } from 'next'

import { OrderDetailView } from '@/components/orders/OrderDetailView'
import { formatOrderNumber } from '@/lib/account/orderPreview'
import { getSecureOrder } from '@/lib/orders/getSecureOrder'
import { mergeOpenGraph } from '@/utilities/mergeOpenGraph'
import { notFound } from 'next/navigation'

export const dynamic = 'force-dynamic'

type PageProps = {
  params: Promise<{ id: string }>
  searchParams: Promise<{ email?: string; accessToken?: string }>
}

export default async function OrderPage({ params, searchParams }: PageProps) {
  const { id } = await params
  const { email = '', accessToken = '' } = await searchParams

  const result = await getSecureOrder({ id, email, accessToken })

  if (!result) {
    notFound()
  }

  const { order, user } = result
  const invoiceQuery =
    !user && email && accessToken
      ? `?email=${encodeURIComponent(email)}&accessToken=${encodeURIComponent(accessToken)}`
      : ''

  return (
    <OrderDetailView order={order} showBackLink={Boolean(user)} invoiceQuery={invoiceQuery} />
  )
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params
  const title = `Order #${formatOrderNumber(id)}`

  return {
    description: 'Order details and tracking.',
    openGraph: mergeOpenGraph({
      title,
      url: `/orders/${id}`,
    }),
    title,
  }
}
