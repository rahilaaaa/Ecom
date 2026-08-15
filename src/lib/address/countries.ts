import type { Address } from '@/payload-types'

export type CountryCode = Address['country']

export type CountryOption = {
  label: string
  value: CountryCode
}

/** Default checkout / shipping country for this India-first store. */
export const DEFAULT_COUNTRY: CountryCode = 'IN'

/**
 * Checkout-facing country list. India first.
 * Values must remain valid Address.country enum members.
 */
export const CHECKOUT_COUNTRY_OPTIONS: CountryOption[] = [
  { label: 'India', value: 'IN' },
  { label: 'United States', value: 'US' },
  { label: 'United Kingdom', value: 'GB' },
  { label: 'Canada', value: 'CA' },
  { label: 'Australia', value: 'AU' },
]

export function getCountryLabel(code: string | null | undefined): string {
  if (!code) return ''
  return CHECKOUT_COUNTRY_OPTIONS.find((entry) => entry.value === code)?.label || code
}

export function isIndia(country: string | null | undefined): boolean {
  return country === 'IN'
}

/** Indian PIN: 6 digits, first digit 1–9. */
export const INDIA_PIN_PATTERN = /^[1-9][0-9]{5}$/

export function isValidIndiaPin(value: string): boolean {
  return INDIA_PIN_PATTERN.test(value.trim())
}

/**
 * Basic Indian mobile validation (10 digits, starts 6–9).
 * Allows optional +91 / 91 / 0 prefix which is stripped before check.
 */
export function isValidIndiaMobile(value: string): boolean {
  const digits = value.replace(/\D/g, '')
  const national =
    digits.length === 12 && digits.startsWith('91')
      ? digits.slice(2)
      : digits.length === 11 && digits.startsWith('0')
        ? digits.slice(1)
        : digits
  return /^[6-9]\d{9}$/.test(national)
}

export function postalCodeLabel(country: string | null | undefined): string {
  if (isIndia(country)) return 'PIN code'
  if (country === 'US') return 'ZIP code'
  return 'Postal code'
}

export function phoneFieldLabel(country: string | null | undefined): string {
  return isIndia(country) ? 'Mobile number' : 'Phone number'
}
