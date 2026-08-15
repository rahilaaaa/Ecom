export type PopularSearch = {
  label: string
  query: string
}

export const DEFAULT_POPULAR_SEARCHES: PopularSearch[] = [
  { label: 'Silk Blouses', query: 'Silk Blouses' },
  { label: 'Cashmere Knitwear', query: 'Cashmere Knitwear' },
  { label: 'Evening Gowns', query: 'Evening Gowns' },
  { label: 'Leather Totes', query: 'Leather Totes' },
  { label: 'Minimalist Jewelry', query: 'Minimalist Jewelry' },
]

export const RECENT_SEARCHES_KEY = 'elixir-recent-searches'
export const RECENT_SEARCHES_LIMIT = 5

export function sanitizeSearchQuery(value: string): string {
  return value.trim().slice(0, 120)
}
