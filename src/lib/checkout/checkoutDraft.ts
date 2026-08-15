export const CHECKOUT_DRAFT_STORAGE_KEY = 'elixir-checkout-draft'

export type CheckoutDraft = {
  step?: 'information' | 'shipping' | 'payment'
  email?: string
  marketingOptIn?: boolean
  country?: string
  firstName?: string
  lastName?: string
  addressLine1?: string
  addressLine2?: string
  city?: string
  state?: string
  postalCode?: string
  phone?: string
  shippingMethod?: 'standard' | 'express'
  couponCode?: string | null
  paymentMethod?: 'cod' | 'online' | null
}

export function loadCheckoutDraft(): CheckoutDraft | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.sessionStorage.getItem(CHECKOUT_DRAFT_STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw) as CheckoutDraft
  } catch {
    return null
  }
}

export function saveCheckoutDraft(draft: CheckoutDraft): void {
  if (typeof window === 'undefined') return
  try {
    window.sessionStorage.setItem(CHECKOUT_DRAFT_STORAGE_KEY, JSON.stringify(draft))
  } catch {
    // ignore quota / private mode
  }
}

export function clearCheckoutDraft(): void {
  if (typeof window === 'undefined') return
  try {
    window.sessionStorage.removeItem(CHECKOUT_DRAFT_STORAGE_KEY)
  } catch {
    // ignore
  }
}
