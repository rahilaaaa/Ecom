import type { ReactNode } from 'react'

import { RenderParams } from '@/components/RenderParams'

export default async function AccountLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-[70vh] bg-[var(--elixir-surface,#fcf9f8)]">
      <div className="mx-auto max-w-xl px-5 pt-4 md:max-w-2xl md:px-6">
        <RenderParams className="" />
      </div>
      {children}
    </div>
  )
}
