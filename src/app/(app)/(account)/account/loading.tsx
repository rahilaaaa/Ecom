export default function AccountLoading() {
  return (
    <div className="mx-auto w-full max-w-xl animate-pulse px-5 pb-16 pt-10 md:max-w-2xl md:px-6">
      <div className="flex flex-col items-center">
        <div className="mb-5 h-28 w-28 rounded-full bg-[var(--elixir-surface-container,#f0eded)]" />
        <div className="h-8 w-48 rounded bg-[var(--elixir-surface-container,#f0eded)]" />
        <div className="mt-3 h-4 w-56 rounded bg-[var(--elixir-surface-container,#f0eded)]" />
        <div className="mt-6 h-12 w-36 rounded bg-[var(--elixir-surface-container,#f0eded)]" />
      </div>
      <div className="mt-10 space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-12 rounded-xl bg-[var(--elixir-surface-container,#f0eded)]" />
        ))}
      </div>
      <div className="mt-10 space-y-4">
        <div className="h-7 w-40 rounded bg-[var(--elixir-surface-container,#f0eded)]" />
        <div className="h-28 rounded-lg bg-[var(--elixir-surface-container,#f0eded)]" />
        <div className="h-28 rounded-lg bg-[var(--elixir-surface-container,#f0eded)]" />
      </div>
    </div>
  )
}
