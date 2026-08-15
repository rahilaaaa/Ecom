import type { Order, OrderStatus } from '@/payload-types'
import { formatDateTime } from '@/utilities/formatDateTime'

export type TimelineStepKey = 'placed' | 'confirmed' | 'processing' | 'shipped' | 'delivered'

export type TimelineStepState = 'complete' | 'current' | 'pending' | 'skipped'

export type OrderTimelineStep = {
  key: TimelineStepKey
  label: string
  state: TimelineStepState
  detail: string | null
}

/**
 * Maps the ecommerce plugin OrderStatus values onto the Stitch visual timeline.
 * We do not invent statuses the backend does not support.
 */
export function buildOrderTimeline(order: Order): OrderTimelineStep[] {
  const status = order.status
  const placedAt = formatDateTime({ date: order.createdAt, format: 'MMM d, hh:mm a' })
  const updatedAt = formatDateTime({ date: order.updatedAt, format: 'MMM d, hh:mm a' })

  if (status === 'cancelled' || status === 'refunded') {
    const terminalLabel = status === 'cancelled' ? 'Cancelled' : 'Refunded'
    return [
      {
        key: 'placed',
        label: 'PLACED',
        state: 'complete',
        detail: placedAt,
      },
      {
        key: 'confirmed',
        label: 'CONFIRMED',
        state: 'complete',
        detail: placedAt,
      },
      {
        key: 'processing',
        label: 'PROCESSING',
        state: 'current',
        detail: terminalLabel,
      },
      {
        key: 'shipped',
        label: 'SHIPPED',
        state: 'skipped',
        detail: null,
      },
      {
        key: 'delivered',
        label: 'DELIVERED',
        state: 'skipped',
        detail: null,
      },
    ]
  }

  const isCompleted = status === 'completed'
  const isProcessing = status === 'processing' || !status

  return [
    {
      key: 'placed',
      label: 'PLACED',
      state: 'complete',
      detail: placedAt,
    },
    {
      key: 'confirmed',
      label: 'CONFIRMED',
      state: 'complete',
      // Payment confirmation coincides with order creation in this architecture.
      detail: placedAt,
    },
    {
      key: 'processing',
      label: 'PROCESSING',
      state: isCompleted ? 'complete' : isProcessing ? 'current' : 'pending',
      detail: isCompleted ? updatedAt : isProcessing ? 'Currently packing' : 'Pending',
    },
    {
      key: 'shipped',
      label: 'SHIPPED',
      state: isCompleted ? 'complete' : 'pending',
      detail: isCompleted ? updatedAt : 'Pending',
    },
    {
      key: 'delivered',
      label: 'DELIVERED',
      state: isCompleted ? 'complete' : 'pending',
      detail: isCompleted ? updatedAt : 'Pending',
    },
  ]
}

export function getOrderStatusIndex(status: OrderStatus | undefined): number {
  switch (status) {
    case 'completed':
      return 4
    case 'processing':
      return 2
    case 'cancelled':
    case 'refunded':
      return 1
    default:
      return 2
  }
}
