export default function SearchLoading() {
  return (
    <div className="mx-auto w-full max-w-xl animate-pulse px-5 pb-20 pt-10 md:max-w-3xl lg:max-w-5xl">
      <div className="mx-auto h-10 w-40 rounded bg-[var(--elixir-surface-container,#f0eded)]" />
      <div className="mx-auto mt-6 h-12 max-w-xl rounded-full bg-[var(--elixir-surface-container,#f0eded)]" />
      <div className="mt-12 grid grid-cols-1 gap-8 lg:grid-cols-12">
        <div className="space-y-4 lg:col-span-5">
          <div className="h-4 w-36 rounded bg-[var(--elixir-surface-container,#f0eded)]" />
          <div className="flex flex-wrap gap-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-10 w-28 rounded-lg bg-[var(--elixir-surface-container,#f0eded)]" />
            ))}
          </div>
          <div className="h-4 w-32 rounded bg-[var(--elixir-surface-container,#f0eded)]" />
          <div className="h-12 rounded bg-[var(--elixir-surface-container,#f0eded)]" />
          <div className="h-12 rounded bg-[var(--elixir-surface-container,#f0eded)]" />
        </div>
        <div className="space-y-4 lg:col-span-7">
          <div className="aspect-[16/9] rounded-xl bg-[var(--elixir-surface-container,#f0eded)]" />
          <div className="aspect-[16/9] rounded-xl bg-[var(--elixir-surface-container,#f0eded)]" />
          <div className="h-40 rounded-2xl bg-[var(--elixir-surface-container,#f0eded)]" />
        </div>
      </div>
    </div>
  )
}
