import type { Metadata } from 'next'
import React from 'react'

import { CartPageClient } from '@/components/Cart/CartPageClient'

export const metadata: Metadata = {
  title: 'Your Cart | ELIXIR',
  description: 'Review the pieces in your bag and proceed to checkout.',
}

export default function CartPage() {
  return <CartPageClient />
}
