/** Add N business days (Mon–Fri) to a date. */
export function addBusinessDays(start: Date, days: number): Date {
  const result = new Date(start)
  let remaining = days

  while (remaining > 0) {
    result.setDate(result.getDate() + 1)
    const day = result.getDay()
    if (day !== 0 && day !== 6) {
      remaining -= 1
    }
  }

  return result
}

export function getEstimatedDeliveryRange(order: {
  createdAt: string
  estimatedDeliveryFrom?: string | null
  estimatedDeliveryTo?: string | null
}): { from: Date; to: Date } {
  if (order.estimatedDeliveryFrom && order.estimatedDeliveryTo) {
    return {
      from: new Date(order.estimatedDeliveryFrom),
      to: new Date(order.estimatedDeliveryTo),
    }
  }

  const placed = new Date(order.createdAt)
  return {
    from: order.estimatedDeliveryFrom
      ? new Date(order.estimatedDeliveryFrom)
      : addBusinessDays(placed, 3),
    to: order.estimatedDeliveryTo ? new Date(order.estimatedDeliveryTo) : addBusinessDays(placed, 5),
  }
}
