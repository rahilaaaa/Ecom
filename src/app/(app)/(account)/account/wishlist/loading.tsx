export default function WishlistLoading() {
  return (
    <div className="mx-auto w-full max-w-xl animate-pulse px-5 pb-20 pt-10 md:max-w-3xl md:px-6 lg:max-w-5xl">
      <div className="h-9 w-56 rounded bg-[var(--elixir-surface-container,#f0eded)]" />
      <div className="mt-3 h-4 w-64 rounded bg-[var(--elixir-surface-container,#f0eded)]" />
      <div className="mt-6 h-12 w-40 rounded-full bg-[var(--elixir-surface-container,#f0eded)]" />

      <div className="mt-12 grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="flex flex-col gap-3">
            <div className="aspect-[3/4] rounded-lg bg-[var(--elixir-surface-container,#f0eded)]" />
            <div className="h-3 w-20 rounded bg-[var(--elixir-surface-container,#f0eded)]" />
            <div className="h-5 w-40 rounded bg-[var(--elixir-surface-container,#f0eded)]" />
            <div className="h-4 w-16 rounded bg-[var(--elixir-surface-container,#f0eded)]" />
          </div>
        ))}
      </div>
    </div>
  )
}
