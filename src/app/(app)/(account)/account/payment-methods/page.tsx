import type { Metadata } from 'next'
import Link from 'next/link'

import { AccountShell } from '@/components/account/AccountShell'
import { getAuthenticatedAccountUser } from '@/lib/account/getAccountUser'
import { mergeOpenGraph } from '@/utilities/mergeOpenGraph'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function PaymentMethodsPage() {
  const user = await getAuthenticatedAccountUser()

  if (!user) {
    redirect(
      `/login?warning=${encodeURIComponent('Please login to access payment methods.')}&redirect=${encodeURIComponent('/account/payment-methods')}`,
    )
  }

  return (
    <AccountShell user={user}>
      <section aria-labelledby="payment-methods-heading">
        <h2
          id="payment-methods-heading"
          className="font-[family-name:var(--font-newsreader)] text-2xl font-medium text-[var(--elixir-on-surface,#1c1b1b)]"
        >
          Payment Methods
        </h2>
        <div className="mt-5 rounded-lg border border-[var(--elixir-outline-variant,#c4c7c7)]/60 px-6 py-10 text-center">
          <p className="text-sm leading-relaxed text-[var(--elixir-on-surface-variant,#414848)]">
            Payment details are entered securely at checkout through Stripe and are never stored on
            this site.
          </p>
          <Link
            href="/cart"
            className="mt-6 inline-flex min-h-12 items-center justify-center bg-[var(--elixir-primary,#001515)] px-8 text-sm text-white transition hover:opacity-90"
          >
            Go to Cart
          </Link>
        </div>
      </section>
    </AccountShell>
  )
}

export const metadata: Metadata = {
  description: 'How payments work for your ELIXIR account.',
  openGraph: mergeOpenGraph({
    title: 'Payment Methods',
    url: '/account/payment-methods',
  }),
  title: 'Payment Methods',
}
