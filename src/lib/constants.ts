export type SortFilterItem = {
  reverse: boolean
  slug: null | string
  title: string
}

export const defaultSort: SortFilterItem = {
  slug: '-featured,-createdAt',
  reverse: true,
  title: 'Featured',
}

export const sorting: SortFilterItem[] = [
  defaultSort,
  { slug: '-createdAt', reverse: true, title: 'Newest' },
  { slug: 'priceInINR', reverse: false, title: 'Price: Low to high' },
  { slug: '-priceInINR', reverse: true, title: 'Price: High to low' },
  { slug: '-rating', reverse: true, title: 'Rating' },
]

/** @deprecated Prefer `sorting` — kept for any legacy A–Z references */
export const sortingLegacy: SortFilterItem[] = [
  { slug: null, reverse: false, title: 'Alphabetic A-Z' },
  { slug: '-createdAt', reverse: true, title: 'Latest arrivals' },
  { slug: 'priceInINR', reverse: false, title: 'Price: Low to high' },
  { slug: '-priceInINR', reverse: true, title: 'Price: High to low' },
]
