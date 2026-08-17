import type { Product, Variant, VariantOption, VariantType } from '@/payload-types'

export function optionId(value: unknown): string | null {
  if (value == null) return null
  if (typeof value === 'object' && 'id' in value) {
    const id = (value as { id?: unknown }).id
    if (id == null) return null
    return String(id)
  }
  if (typeof value === 'string' || typeof value === 'number') return String(value)
  return null
}

export function uniqueOptionIds(ids: Array<string | null | undefined>): string[] {
  const seen = new Set<string>()
  const result: string[] = []
  for (const id of ids) {
    if (!id || seen.has(id)) continue
    seen.add(id)
    result.push(id)
  }
  return result
}

export function isColorVariantType(name?: string | null, label?: string | null) {
  const haystack = `${name || ''} ${label || ''}`.toLowerCase()
  return haystack.includes('color') || haystack.includes('colour')
}

export function isSizeVariantType(name?: string | null, label?: string | null) {
  const haystack = `${name || ''} ${label || ''}`.toLowerCase()
  return haystack.includes('size')
}

export function getProductVariants(product: Product): Variant[] {
  if (!product.enableVariants) return []
  return (product.variants?.docs || []).filter(
    (variant): variant is Variant => typeof variant === 'object' && Boolean(variant),
  )
}

export function getVariantOptionIds(variant: Variant): string[] {
  return uniqueOptionIds((variant.options || []).map((option) => optionId(option)))
}

export type VariantOptionView = {
  id: string
  label: string
  value: string
}

export type VariantTypeGroup = {
  id: string
  name: string
  label: string
  isColor: boolean
  isSize: boolean
  options: VariantOptionView[]
}

function asVariantOption(value: unknown): VariantOption | null {
  if (!value || typeof value !== 'object') return null
  if (!('id' in value)) return null
  return value as VariantOption
}

function asVariantType(value: unknown): VariantType | null {
  if (!value || typeof value !== 'object') return null
  if (!('id' in value) || !('name' in value)) return null
  return value as VariantType
}

function optionViewFromDoc(option: VariantOption): VariantOptionView {
  return {
    id: String(option.id),
    label: option.label || option.value || String(option.id),
    value: option.value || option.label || String(option.id),
  }
}

function optionTypeId(option: VariantOption): string | null {
  return optionId(option.variantType)
}

function collectOptionMeta(product: Product): Map<string, VariantOptionView> {
  const meta = new Map<string, VariantOptionView>()

  for (const type of product.variantTypes || []) {
    const populated = asVariantType(type)
    if (!populated) continue
    for (const option of populated.options?.docs || []) {
      const doc = asVariantOption(option)
      if (!doc) continue
      meta.set(String(doc.id), optionViewFromDoc(doc))
    }
  }

  for (const variant of getProductVariants(product)) {
    for (const option of variant.options || []) {
      const doc = asVariantOption(option)
      if (!doc) continue
      if (!meta.has(String(doc.id))) {
        meta.set(String(doc.id), optionViewFromDoc(doc))
      }
    }
  }

  return meta
}

function optionsForType(args: {
  type: VariantType
  usedOptionIds: Set<string>
  meta: Map<string, VariantOptionView>
  variants: Variant[]
}): VariantOptionView[] {
  const { type, usedOptionIds, meta, variants } = args
  const typeId = String(type.id)
  const seen = new Set<string>()
  const options: VariantOptionView[] = []

  const push = (id: string) => {
    if (!usedOptionIds.has(id) || seen.has(id)) return
    const view = meta.get(id) ?? { id, label: id, value: id }
    seen.add(id)
    options.push(view)
  }

  for (const option of type.options?.docs || []) {
    const id = optionId(option)
    if (id) push(id)
  }

  for (const variant of variants) {
    for (const option of variant.options || []) {
      const doc = asVariantOption(option)
      if (doc) {
        const belongs = optionTypeId(doc)
        if (belongs && belongs !== typeId) continue
        if (belongs === typeId) push(String(doc.id))
        continue
      }
      const id = optionId(option)
      if (id && meta.has(id)) {
        // ID-only options: include if this type's join listed them (already handled)
        // or if they were not claimed by another type.
      }
    }
  }

  return options
}

/**
 * Build selectable option groups from the product's variant matrix only.
 * Global variant-type options that this product does not use are omitted.
 */
export function buildVariantOptionGroups(product: Product): VariantTypeGroup[] {
  const variants = getProductVariants(product)
  if (!variants.length) return []

  const usedOptionIds = new Set(variants.flatMap((variant) => getVariantOptionIds(variant)))
  const meta = collectOptionMeta(product)
  const groups: VariantTypeGroup[] = []

  for (const type of product.variantTypes || []) {
    const populated = asVariantType(type)
    if (!populated?.name) continue

    const options = optionsForType({
      type: populated,
      usedOptionIds,
      meta,
      variants,
    })

    if (!options.length) continue

    groups.push({
      id: String(populated.id),
      name: populated.name,
      label: populated.label || populated.name,
      isColor: isColorVariantType(populated.name, populated.label),
      isSize: isSizeVariantType(populated.name, populated.label),
      options,
    })
  }

  return groups
}

export function getColorVariantType(product: Product): VariantType | null {
  for (const type of product.variantTypes || []) {
    const populated = asVariantType(type)
    if (!populated) continue
    if (isColorVariantType(populated.name, populated.label)) return populated
  }
  return null
}

function optionSetsEqual(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false
  return a.every((id) => b.includes(id))
}

/** Exact option-set match — the selected combination must exist as a Payload variant. */
export function findVariantForOptions(
  product: Product,
  selectedOptionIds: string[],
): Variant | undefined {
  const selected = uniqueOptionIds(selectedOptionIds)
  if (!selected.length) return undefined

  return getProductVariants(product).find((variant) =>
    optionSetsEqual(getVariantOptionIds(variant), selected),
  )
}

/** Variants whose option set contains every provided ID (partial combination). */
export function findVariantsContaining(product: Product, optionIds: string[]): Variant[] {
  const required = uniqueOptionIds(optionIds)
  if (!required.length) return []

  return getProductVariants(product).filter((variant) => {
    const ids = getVariantOptionIds(variant)
    return required.every((id) => ids.includes(id))
  })
}

export function variantIsInStock(variant: Variant | null | undefined): boolean {
  return Boolean(variant && typeof variant.inventory === 'number' && variant.inventory > 0)
}

export type OptionAvailability = {
  exists: boolean
  inStock: boolean
}

/** Invalid combinations are not selectable. Out-of-stock combinations remain selectable so inventory can be shown. */
export function canSelectOption(availability: OptionAvailability): boolean {
  return availability.exists
}

/**
 * Whether this option can form a real Payload combination with the other
 * currently selected options (excluding this type's current value).
 */
export function getOptionAvailability(args: {
  product: Product
  optionId: string
  selectedOptionIds: string[]
}): OptionAvailability {
  const candidates = findVariantsContaining(args.product, [
    ...args.selectedOptionIds,
    args.optionId,
  ])

  if (!candidates.length) {
    return { exists: false, inStock: false }
  }

  return {
    exists: true,
    inStock: candidates.some((variant) => variantIsInStock(variant)),
  }
}

export function applyVariantToSearchParams(args: {
  product: Product
  variant: Variant
  currentParams: URLSearchParams
}): URLSearchParams {
  const next = new URLSearchParams(args.currentParams.toString())
  const variantOptionIds = getVariantOptionIds(args.variant)
  next.set('variant', String(args.variant.id))
  next.delete('image')

  for (const group of buildVariantOptionGroups(args.product)) {
    const match = group.options.find((option) => variantOptionIds.includes(option.id))
    if (match) next.set(group.name, match.id)
    else next.delete(group.name)
  }

  return next
}

function selectedIdsFromParams(args: {
  product: Product
  params: URLSearchParams
  override?: { typeName: string; optionId: string }
}): string[] {
  const ids: string[] = []
  for (const group of buildVariantOptionGroups(args.product)) {
    const value =
      args.override && group.name === args.override.typeName
        ? args.override.optionId
        : args.params.get(group.name)
    if (value) ids.push(value)
  }
  return uniqueOptionIds(ids)
}

/**
 * When changing color, keep the current size if that combo exists and is in stock.
 * Otherwise pick the first in-stock variant for the new color (then any variant).
 */
export function buildParamsForColorChange(args: {
  product: Product
  colorTypeName: string
  nextColorOptionId: string
  currentParams: URLSearchParams
}): URLSearchParams {
  const { product, colorTypeName, nextColorOptionId, currentParams } = args
  const next = new URLSearchParams(currentParams.toString())
  next.set(colorTypeName, nextColorOptionId)
  next.delete('image')

  const selectedIds = selectedIdsFromParams({
    product,
    params: next,
    override: { typeName: colorTypeName, optionId: nextColorOptionId },
  })

  const exact = findVariantForOptions(product, selectedIds)
  if (exact && variantIsInStock(exact)) {
    return applyVariantToSearchParams({ product, variant: exact, currentParams: next })
  }

  const forColor = findVariantsContaining(product, [nextColorOptionId])
  const preferred = forColor.find((variant) => variantIsInStock(variant)) || forColor[0]

  if (!preferred) {
    for (const group of buildVariantOptionGroups(product)) {
      if (group.name === colorTypeName) continue
      next.delete(group.name)
    }
    next.delete('variant')
    return next
  }

  return applyVariantToSearchParams({ product, variant: preferred, currentParams: next })
}

export function buildParamsForOptionChange(args: {
  product: Product
  typeName: string
  optionId: string
  currentParams: URLSearchParams
}): URLSearchParams {
  const { product, typeName, optionId: nextOptionId, currentParams } = args
  const next = new URLSearchParams(currentParams.toString())
  next.set(typeName, nextOptionId)
  next.delete('image')

  const selectedIds = selectedIdsFromParams({
    product,
    params: next,
    override: { typeName, optionId: nextOptionId },
  })

  const match = findVariantForOptions(product, selectedIds)
  if (match) {
    return applyVariantToSearchParams({ product, variant: match, currentParams: next })
  }

  next.delete('variant')
  return next
}

export function resolveVariantFromSearchParams(
  product: Product,
  searchParams: URLSearchParams | { get: (name: string) => string | null },
): Variant | undefined {
  const variants = getProductVariants(product)
  if (!product.enableVariants || !variants.length) return undefined

  const groups = buildVariantOptionGroups(product)
  if (groups.length) {
    const selectedIds: string[] = []
    let allTypesSelected = true
    for (const group of groups) {
      const value = searchParams.get(group.name)
      if (!value) {
        allTypesSelected = false
        break
      }
      selectedIds.push(value)
    }

    if (allTypesSelected) {
      // Option params are the source of truth so a stale `variant` query cannot keep an invalid combo.
      return findVariantForOptions(product, selectedIds)
    }
  }

  const variantId = searchParams.get('variant')
  if (variantId) {
    return variants.find((variant) => String(variant.id) === variantId)
  }

  return undefined
}
