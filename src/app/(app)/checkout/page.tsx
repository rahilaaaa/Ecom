import type { Metadata } from 'next'

import { mergeOpenGraph } from '@/utilities/mergeOpenGraph'
import React, { Fragment, Suspense } from 'react'

import { CheckoutPage } from '@/components/checkout/CheckoutPage'

export default function Checkout() {
  return (
    <div className="min-h-[90vh]">
      {!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY && (
        <div className="mx-auto max-w-xl px-5 py-12 text-sm">
          <Fragment>
            {'To enable checkout, you must '}
            <a
              href="https://dashboard.stripe.com/test/apikeys"
              rel="noopener noreferrer"
              target="_blank"
              className="underline"
            >
              obtain your Stripe API Keys
            </a>
            {' then set them as environment variables. See the '}
            <a
              href="https://github.com/payloadcms/payload/blob/3.x/templates/ecommerce/README.md#stripe"
              rel="noopener noreferrer"
              target="_blank"
              className="underline"
            >
              README
            </a>
            {' for more details.'}
          </Fragment>
        </div>
      )}

      <h1 className="sr-only">Checkout</h1>

      <Suspense fallback={null}>
        <CheckoutPage />
      </Suspense>
    </div>
  )
}

export const metadata: Metadata = {
  description: 'Secure checkout for ELIXIR.',
  openGraph: mergeOpenGraph({
    title: 'Checkout',
    url: '/checkout',
  }),
  title: 'Checkout | ELIXIR',
}
