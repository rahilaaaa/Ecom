import type { Metadata } from 'next'
import { redirect } from 'next/navigation'

import { mergeOpenGraph } from '@/utilities/mergeOpenGraph'

/** Legacy route — order history lives under /account/orders */
export default function OrdersRedirect() {
  redirect('/account/orders')
}

export const metadata: Metadata = {
  description: 'Your orders.',
  openGraph: mergeOpenGraph({
    title: 'Orders',
    url: '/orders',
  }),
  title: 'Orders',
}
