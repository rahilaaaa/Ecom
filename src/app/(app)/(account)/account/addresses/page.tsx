import type { Metadata } from 'next'

import { AccountShell } from '@/components/account/AccountShell'
import { AddressListing } from '@/components/addresses/AddressListing'
import { CreateAddressModal } from '@/components/addresses/CreateAddressModal'
import { getAuthenticatedAccountUser } from '@/lib/account/getAccountUser'
import { mergeOpenGraph } from '@/utilities/mergeOpenGraph'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function AddressesPage() {
  const user = await getAuthenticatedAccountUser()

  if (!user) {
    redirect(
      `/login?warning=${encodeURIComponent('Please login to access your addresses.')}&redirect=${encodeURIComponent('/account/addresses')}`,
    )
  }

  return (
    <AccountShell user={user}>
      <section aria-labelledby="addresses-heading">
        <div className="mb-5 flex items-end justify-between gap-4">
          <h2
            id="addresses-heading"
            className="font-[family-name:var(--font-newsreader)] text-2xl font-medium text-[var(--elixir-on-surface,#1c1b1b)]"
          >
            Addresses
          </h2>
        </div>
        <div className="mb-6 space-y-4">
          <AddressListing />
        </div>
        <CreateAddressModal />
      </section>
    </AccountShell>
  )
}

export const metadata: Metadata = {
  description: 'Manage your shipping addresses.',
  openGraph: mergeOpenGraph({
    title: 'Addresses',
    url: '/account/addresses',
  }),
  title: 'Addresses',
}
