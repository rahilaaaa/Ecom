import type { Metadata } from 'next'

import { AccountRecentOrders } from '@/components/account/AccountRecentOrders'
import { AccountShell } from '@/components/account/AccountShell'
import { getAuthenticatedAccountUser } from '@/lib/account/getAccountUser'
import { getCustomerOrders } from '@/lib/account/getCustomerOrders'
import { toAccountOrderPreview } from '@/lib/account/orderPreview'
import { mergeOpenGraph } from '@/utilities/mergeOpenGraph'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function AccountPage() {
  const user = await getAuthenticatedAccountUser()

  if (!user) {
    redirect(
      `/login?warning=${encodeURIComponent('Please login to access your account.')}&redirect=${encodeURIComponent('/account')}`,
    )
  }

  const { orders, error } = await getCustomerOrders({ user, limit: 5 })
  const previews = orders.map(toAccountOrderPreview)

  return (
    <AccountShell user={user}>
      <AccountRecentOrders orders={previews} error={error} showViewAll />
    </AccountShell>
  )
}

export const metadata: Metadata = {
  description: 'Manage your ELIXIR account, orders, and profile.',
  openGraph: mergeOpenGraph({
    title: 'Account',
    url: '/account',
  }),
  title: 'Account',
}
