/**
 * Central shipping configuration (amounts in paise).
 *
 * Business-specific paid rates are not defined yet — method amounts are 0 (free)
 * until configured here. Do not scatter magic numbers in UI components.
 */
export const SHIPPING_CONFIG = {
  /** Subtotal (after discount) at/above which paid methods become free. */
  freeShippingThresholdPaise: 500_000,
  methods: {
    standard: {
      id: 'standard',
      label: 'Standard (3–5 business days)',
      /** Paise. 0 = free until a paid rate is configured. */
      amountPaise: 0,
    },
    express: {
      id: 'express',
      label: 'Express (1–2 business days)',
      amountPaise: 0,
    },
  },
} as const

export type ShippingMethodId = keyof typeof SHIPPING_CONFIG.methods

export const DEFAULT_SHIPPING_METHOD: ShippingMethodId = 'standard'

export function isShippingMethodId(value: unknown): value is ShippingMethodId {
  return typeof value === 'string' && value in SHIPPING_CONFIG.methods
}

/**
 * Authoritative shipping amount for a method + post-discount subtotal.
 * Browser must not supply this number — only the method id.
 */
export function calculateShippingAmount(args: {
  subtotalAfterDiscountPaise: number
  methodId: ShippingMethodId
}): number {
  const method = SHIPPING_CONFIG.methods[args.methodId]
  const base = method.amountPaise
  if (base <= 0) return 0
  if (args.subtotalAfterDiscountPaise >= SHIPPING_CONFIG.freeShippingThresholdPaise) return 0
  return base
}

export function getShippingMethodLabel(methodId: ShippingMethodId): string {
  return SHIPPING_CONFIG.methods[methodId].label
}

/** Cart / checkout summary display helper. */
export function getShippingDisplay(subtotalAfterDiscountPaise: number, methodId: ShippingMethodId = DEFAULT_SHIPPING_METHOD): {
  label: string
  amount: number
} {
  const amount = calculateShippingAmount({
    subtotalAfterDiscountPaise,
    methodId,
  })
  if (amount === 0) {
    return { label: 'Free', amount: 0 }
  }
  return { label: getShippingMethodLabel(methodId), amount }
}

/** @deprecated Use SHIPPING_CONFIG.freeShippingThresholdPaise */
export const FREE_SHIPPING_THRESHOLD_PAISE = SHIPPING_CONFIG.freeShippingThresholdPaise

/** @deprecated */
export const FREE_SHIPPING_THRESHOLD_CENTS = FREE_SHIPPING_THRESHOLD_PAISE
