'use client'

import React from 'react'
import { useAddresses } from '@payloadcms/plugin-ecommerce/client/react'
import { AddressItem } from '@/components/addresses/AddressItem'

export const AddressListing: React.FC = () => {
  const { addresses } = useAddresses()

  if (!addresses || addresses.length === 0) {
    return (
      <p className="rounded-lg border border-[var(--elixir-outline-variant,#c4c7c7)]/60 px-4 py-8 text-center text-sm text-[var(--elixir-on-surface-variant,#414848)]">
        No addresses saved yet.
      </p>
    )
  }

  return (
    <div>
      <ul className="flex flex-col gap-4">
        {addresses.map((address) => (
          <li
            key={address.id}
            className="rounded-lg border border-[var(--elixir-outline-variant,#c4c7c7)]/60 p-4"
          >
            <AddressItem address={address} />
          </li>
        ))}
      </ul>
    </div>
  )
}
