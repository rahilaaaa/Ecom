import type { Metadata } from 'next'

import { AccountShell } from '@/components/account/AccountShell'
import { AccountForm } from '@/components/forms/AccountForm'
import { getAuthenticatedAccountUser } from '@/lib/account/getAccountUser'
import { mergeOpenGraph } from '@/utilities/mergeOpenGraph'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function AccountSettingsPage() {
  const user = await getAuthenticatedAccountUser()

  if (!user) {
    redirect(
      `/login?warning=${encodeURIComponent('Please login to access settings.')}&redirect=${encodeURIComponent('/account/settings')}`,
    )
  }

  return (
    <AccountShell user={user}>
      <section aria-labelledby="settings-heading">
        <h2
          id="settings-heading"
          className="mb-6 font-[family-name:var(--font-newsreader)] text-2xl font-medium text-[var(--elixir-on-surface,#1c1b1b)]"
        >
          Settings
        </h2>
        <AccountForm />
      </section>
    </AccountShell>
  )
}

export const metadata: Metadata = {
  description: 'Update your ELIXIR profile and password.',
  openGraph: mergeOpenGraph({
    title: 'Account Settings',
    url: '/account/settings',
  }),
  title: 'Account Settings',
}
