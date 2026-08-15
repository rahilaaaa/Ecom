import { stateOptions as US_STATE_OPTIONS } from '@/blocks/Form/State/options'

import { isIndia } from '@/lib/address/countries'
import { INDIA_STATE_OPTIONS, type StateOption } from '@/lib/address/indiaStates'

export type { StateOption }

export function getStateOptionsForCountry(country: string | null | undefined): StateOption[] | null {
  if (isIndia(country)) return INDIA_STATE_OPTIONS
  if (country === 'US') return US_STATE_OPTIONS
  return null
}

export function stateFieldLabel(country: string | null | undefined): string {
  if (isIndia(country)) return 'State'
  if (country === 'US') return 'State'
  return 'State / Province'
}

export function isStateRequired(country: string | null | undefined): boolean {
  return isIndia(country) || country === 'US'
}
