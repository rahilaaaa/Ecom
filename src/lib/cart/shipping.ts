export const FREE_SHIPPING_THRESHOLD_CENTS = 15000

export function getShippingDisplay(subtotalCents: number): {
  label: string
  amount: number | null
} {
  if (subtotalCents >= FREE_SHIPPING_THRESHOLD_CENTS) {
    return { label: 'Free', amount: 0 }
  }

  return {
    label: 'Calculated at checkout',
    amount: null,
  }
}
