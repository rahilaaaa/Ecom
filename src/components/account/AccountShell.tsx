import React from 'react'

import { AccountNav } from '@/components/account/AccountNav'
import { AccountProfileHeader } from '@/components/account/AccountProfileHeader'
import type { User } from '@/payload-types'
import { cn } from '@/utilities/cn'

type Props = {
  user: User
  children: React.ReactNode
  className?: string
}

export function AccountShell({ user, children, className }: Props) {
  return (
    <div className={cn('mx-auto w-full max-w-xl px-5 pb-16 pt-10 md:max-w-2xl md:px-6 lg:pt-14', className)}>
      <AccountProfileHeader user={user} />
      <div className="mt-10">
        <AccountNav />
      </div>
      <div className="mt-10">{children}</div>
    </div>
  )
}
