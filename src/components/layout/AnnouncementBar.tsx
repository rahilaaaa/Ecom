import React from 'react'

type Props = {
  message?: string | null
}

export function AnnouncementBar({ message }: Props) {
  if (!message?.trim()) return null

  return (
    <div className="bg-[var(--elixir-primary,#001515)] px-4 py-2.5 text-center">
      <p className="font-[family-name:var(--font-inter)] text-[11px] font-semibold uppercase tracking-[0.14em] text-white md:text-xs">
        {message}
      </p>
    </div>
  )
}
