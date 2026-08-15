import React from 'react'

export default function ProductLoading() {
  return (
    <div className="shop-luxe bg-[var(--elixir-surface,#fcf9f8)]">
      <div className="mx-auto grid w-full max-w-[1280px] grid-cols-1 gap-10 px-5 py-10 lg:grid-cols-2 lg:gap-14 lg:px-8">
        <div className="aspect-[4/5] animate-pulse rounded-lg bg-[var(--elixir-surface-container,#f0eded)]" />
        <div className="flex flex-col gap-6">
          <div className="h-10 w-3/4 animate-pulse rounded bg-[var(--elixir-surface-container,#f0eded)]" />
          <div className="h-6 w-24 animate-pulse rounded bg-[var(--elixir-surface-container,#f0eded)]" />
          <div className="h-12 w-full animate-pulse rounded bg-[var(--elixir-surface-container,#f0eded)]" />
          <div className="h-12 w-full animate-pulse rounded bg-[var(--elixir-surface-container,#f0eded)]" />
          <div className="mt-4 h-32 w-full animate-pulse rounded bg-[var(--elixir-surface-container,#f0eded)]" />
        </div>
      </div>
    </div>
  )
}
