'use client'

import { usePathname } from 'next/navigation'
import React from 'react'

export function StorefrontShell({
  children,
  footer,
}: {
  children: React.ReactNode
  footer: React.ReactNode
}) {
  const pathname = usePathname()
  const isCheckout = pathname?.startsWith('/checkout')

  return (
    <>
      <main>{children}</main>
      {isCheckout ? null : footer}
    </>
  )
}
