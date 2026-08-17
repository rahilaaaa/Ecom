import type { Product } from '@/payload-types'

export function getProductCategories(
  product: Product,
): Array<{ id: string; title: string; slug?: string | null }> {
  const categories: Array<{ id: string; title: string; slug?: string | null }> = []

  for (const category of product.categories || []) {
    if (!category || typeof category !== 'object') continue
    if (!category.title) continue
    categories.push({
      id: String(category.id),
      title: category.title,
      slug: category.slug,
    })
  }

  return categories
}

export function hasRichTextContent(value: Product['description']): boolean {
  if (!value?.root?.children?.length) return false

  const visit = (nodes: Array<{ type?: string; text?: unknown; children?: unknown[] }>): boolean => {
    for (const node of nodes) {
      if (typeof node.text === 'string' && node.text.trim()) return true
      if (Array.isArray(node.children) && visit(node.children as typeof nodes)) return true
    }
    return false
  }

  return visit(value.root.children)
}
