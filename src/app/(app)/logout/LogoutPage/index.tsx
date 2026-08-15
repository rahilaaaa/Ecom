'use client'

import { useAuth } from '@/providers/Auth'
import Link from 'next/link'
import React, { Fragment, useEffect, useState } from 'react'

export const LogoutPage: React.FC = () => {
  const { logout } = useAuth()
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    const performLogout = async () => {
      try {
        await logout()
        setSuccess('Logged out successfully.')
      } catch (_) {
        setError('You are already logged out.')
      }
    }

    void performLogout()
  }, [logout])

  return (
    <Fragment>
      {(error || success) && (
        <div>
          <h1 className="font-[family-name:var(--font-newsreader)] text-3xl font-medium">
            {error || success}
          </h1>
          <p className="mt-4 text-sm text-[var(--elixir-on-surface-variant,#414848)]">
            What would you like to do next?{' '}
            <Link href="/shop" className="underline underline-offset-4 text-[var(--elixir-on-surface,#1c1b1b)]">
              Continue shopping
            </Link>
            {` or `}
            <Link href="/login" className="underline underline-offset-4 text-[var(--elixir-on-surface,#1c1b1b)]">
              log back in
            </Link>
            .
          </p>
        </div>
      )}
    </Fragment>
  )
}
