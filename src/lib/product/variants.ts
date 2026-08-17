import type { Product, Variant, VariantOption, VariantType } from '@/payload-types'

export type SearchParamsLike = {
  get: (name: string) => string | null
  keys?: () => IterableIterator<string>
  toString?: () => string
}

export function cloneSearchParams(params: SearchParamsLike | URLSearchParams): URLSearchParams {
  if (params instanceof URLSearchParams) return new URLSearchParams(params)

  if (typeof params.toString === 'function') {
    const raw = params.toString()
    if (raw && raw !== '[object Object]') return new URLSearchParams(raw)
  }

  const next = new URLSearchParams()
  if (typeof params.keys === 'function') {
    for (const key of params.keys()) {
      const value = params.get(key)
      if (value != null) next.set(key, value)
    }
  }

  return next
}

export function getSearchParam(params: SearchParamsLike, name: string): string | null {
  const direct = params.get(name)
  if (direct) return direct

  const target = name.toLowerCase()
  if (typeof params.keys === 'function') {
    for (const key of params.keys()) {
      if (key.toLowerCase() === target) {
        const value = params.get(key)
        if (value) return value
      }
    }
  }

  if (typeof params.toString === 'function') {
    const cloned = cloneSearchParams(params)
    for (const key of cloned.keys()) {
      if (key.toLowerCase() === target) return cloned.get(key)
    }
  }

  return params.get(name.toLowerCase())
}

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

export function toInventoryCount(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : null
  }
  return null
}

export function variantIsInStock(variant: Variant | null | undefined): boolean {
  const inventory = toInventoryCount(variant?.inventory)
  return inventory != null && inventory > 0
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

export function matchOptionFromParam(
  group: VariantTypeGroup,
  raw: string | null | undefined,
): VariantOptionView | undefined {
  if (!raw) return undefined
  const needle = raw.trim()
  if (!needle) return undefined
  const lower = needle.toLowerCase()

  return group.options.find((option) => {
    return (
      option.id === needle ||
      option.value === needle ||
      option.label === needle ||
      option.value.toLowerCase() === lower ||
      option.label.toLowerCase() === lower
    )
  })
}

export function parseSelectedOptions(
  product: Product,
  params: SearchParamsLike,
): Record<string, string> {
  const selected: Record<string, string> = {}
  for (const group of buildVariantOptionGroups(product)) {
    const match = matchOptionFromParam(group, getSearchParam(params, group.name))
    if (match) selected[group.name] = match.id
  }
  return selected
}

export function resolveVariantFromSelectedOptions(
  product: Product,
  selectedOptions: Record<string, string>,
): Variant | undefined {
  const groups = buildVariantOptionGroups(product)
  if (!groups.length) return undefined

  const selectedIds: string[] = []
  for (const group of groups) {
    const id = selectedOptions[group.name]
    if (!id) return undefined
    selectedIds.push(id)
  }

  return findVariantForOptions(product, selectedIds)
}

export function paramsFromSelectedOptions(
  product: Product,
  selectedOptions: Record<string, string>,
): URLSearchParams {
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(selectedOptions)) {
    if (value) params.set(key, value)
  }

  const variant = resolveVariantFromSelectedOptions(product, selectedOptions)
  if (variant) params.set('variant', String(variant.id))
  else params.delete('variant')

  return params
}

export function applyVariantToSearchParams(args: {
  product: Product
  variant: Variant
  currentParams: SearchParamsLike | URLSearchParams
}): URLSearchParams {
  const next = cloneSearchParams(args.currentParams)
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
  params: SearchParamsLike | URLSearchParams
  override?: { typeName: string; optionId: string }
}): string[] {
  const ids: string[] = []
  for (const group of buildVariantOptionGroups(args.product)) {
    if (args.override && group.name === args.override.typeName) {
      ids.push(args.override.optionId)
      continue
    }

    const match = matchOptionFromParam(group, getSearchParam(args.params, group.name))
    if (match) ids.push(match.id)
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
  currentParams: SearchParamsLike | URLSearchParams
}): URLSearchParams {
  const { product, colorTypeName, nextColorOptionId, currentParams } = args
  const next = cloneSearchParams(currentParams)
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
  currentParams: SearchParamsLike | URLSearchParams
}): URLSearchParams {
  const { product, typeName, optionId: nextOptionId, currentParams } = args
  const next = cloneSearchParams(currentParams)
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

export function applyOptionSelection(args: {
  product: Product
  typeName: string
  optionId: string
  isColor: boolean
  currentParams: SearchParamsLike | URLSearchParams
}): URLSearchParams {
  return args.isColor
    ? buildParamsForColorChange({
        product: args.product,
        colorTypeName: args.typeName,
        nextColorOptionId: args.optionId,
        currentParams: args.currentParams,
      })
    : buildParamsForOptionChange({
        product: args.product,
        typeName: args.typeName,
        optionId: args.optionId,
        currentParams: args.currentParams,
      })
}

export function resolveVariantFromSearchParams(
  product: Product,
  searchParams: SearchParamsLike | URLSearchParams,
): Variant | undefined {
  const variants = getProductVariants(product)
  if (!product.enableVariants || !variants.length) return undefined

  const groups = buildVariantOptionGroups(product)
  if (groups.length) {
    const hasOptionParam = groups.some((group) => Boolean(getSearchParam(searchParams, group.name)))

    if (hasOptionParam) {
      // Option params are authoritative so a stale `variant` query cannot keep an invalid combo.
      const selected = parseSelectedOptions(product, searchParams)
      const selectedIds = groups.map((group) => selected[group.name]).filter(Boolean)
      if (selectedIds.length !== groups.length) return undefined
      return findVariantForOptions(product, selectedIds)
    }
  }

  const variantId = getSearchParam(searchParams, 'variant')
  if (variantId) {
    return variants.find((variant) => String(variant.id) === variantId)
  }

  return undefined
}
