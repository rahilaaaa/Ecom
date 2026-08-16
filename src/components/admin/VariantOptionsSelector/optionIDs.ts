export type OptionID = number | string

export function extractOptionID(value: unknown): OptionID | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string' && value !== '') return value
  if (typeof value === 'object' && value !== null && 'id' in value) {
    return extractOptionID((value as { id: unknown }).id)
  }
  return null
}

export function optionIDsEqual(a: unknown, b: unknown): boolean {
  const idA = extractOptionID(a)
  const idB = extractOptionID(b)
  if (idA == null || idB == null) return false
  return String(idA) === String(idB)
}

export function normalizeOptionIDs(value: unknown): OptionID[] {
  if (!Array.isArray(value)) return []

  const ids: OptionID[] = []
  for (const item of value) {
    const id = extractOptionID(item)
    if (id != null && !ids.some((existing) => optionIDsEqual(existing, id))) {
      ids.push(id)
    }
  }
  return ids
}

export function hasPrimitiveOptionIDs(value: unknown, ids: OptionID[]): boolean {
  return (
    Array.isArray(value) &&
    value.length === ids.length &&
    value.every((item, index) => item === ids[index])
  )
}

export function replaceOptionInType({
  currentIDs,
  previousSelectedID,
  nextSelectedID,
}: {
  currentIDs: unknown
  previousSelectedID: unknown
  nextSelectedID: OptionID
}): OptionID[] {
  const current = normalizeOptionIDs(currentIDs)
  const previous = extractOptionID(previousSelectedID)

  if (previous != null) {
    const index = current.findIndex((id) => optionIDsEqual(id, previous))
    if (index >= 0) {
      const nextIDs = [...current]
      nextIDs[index] = nextSelectedID
      return nextIDs
    }
  }

  if (current.some((id) => optionIDsEqual(id, nextSelectedID))) return current
  return [...current, nextSelectedID]
}
