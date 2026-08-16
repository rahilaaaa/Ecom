import { describe, expect, it } from 'vitest'

import {
  extractOptionID,
  hasPrimitiveOptionIDs,
  normalizeOptionIDs,
  optionIDsEqual,
  replaceOptionInType,
} from '@/components/admin/VariantOptionsSelector/optionIDs'

describe('variant option ID mapping', () => {
  it('extracts primitive IDs and populated relationship objects', () => {
    expect(extractOptionID(2)).toBe(2)
    expect(extractOptionID('2')).toBe('2')
    expect(extractOptionID({ id: 2, label: 'Maroon' })).toBe(2)
    expect(extractOptionID(null)).toBeNull()
  })

  it('treats string and number IDs as the same option', () => {
    expect(optionIDsEqual(2, '2')).toBe(true)
    expect(optionIDsEqual({ id: 2 }, '2')).toBe(true)
    expect(optionIDsEqual(2, 4)).toBe(false)
  })

  it('normalizes mixed form values into the relationship ID array submitted by PATCH', () => {
    expect(
      normalizeOptionIDs([{ id: 2, label: 'Maroon' }, 4, '4', { id: '2' }]),
    ).toEqual([2, 4])
    expect(normalizeOptionIDs([])).toEqual([])
    expect(normalizeOptionIDs(undefined)).toEqual([])
  })

  it('replaces the selected Color without dropping Size', () => {
    expect(
      replaceOptionInType({
        currentIDs: [2, 4],
        nextSelectedID: 3,
        previousSelectedID: 2,
      }),
    ).toEqual([3, 4])
  })

  it('appends a newly selected option when the form value is empty', () => {
    expect(
      replaceOptionInType({
        currentIDs: [],
        nextSelectedID: 2,
        previousSelectedID: undefined,
      }),
    ).toEqual([2])
  })

  it('detects when form state is already a primitive ID array', () => {
    expect(hasPrimitiveOptionIDs([2, 4], [2, 4])).toBe(true)
    expect(hasPrimitiveOptionIDs([{ id: 2 }, 4], [2, 4])).toBe(false)
  })

  it('builds the options array the PATCH request should send for Color + Size', () => {
    const emptyFormValue: unknown[] = []
    const documentOptions = [
      { id: 2, label: 'Maroon' },
      { id: 4, label: 'M' },
    ]
    const options = normalizeOptionIDs(emptyFormValue).length
      ? normalizeOptionIDs(emptyFormValue)
      : normalizeOptionIDs(documentOptions)

    expect(options).toEqual([2, 4])
    expect(JSON.parse(JSON.stringify({ options }))).toEqual({ options: [2, 4] })
  })
})
