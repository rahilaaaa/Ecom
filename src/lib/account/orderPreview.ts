import type { Media, Order, Product, Variant } from '@/payload-types'
import { formatDateTime } from '@/utilities/formatDateTime'

export type AccountOrderPreview = {
  id: number
  orderNumber: string
  href: string
  productTitle: string
  productImage: Media | null
  additionalItemCount: number
  amount: number | null
  currency: Order['currency']
  statusLabel: string
  isCompleted: boolean
  primaryAction: { label: string; href: string }
  buyAgain: {
    productId: number
    variantId?: number
    productSlug?: string
    enableVariants?: boolean
  } | null
}

type OrderItem = NonNullable<Order['items']>[number]

function resolveItem(item: OrderItem) {
  const product = item.product && typeof item.product === 'object' ? (item.product as Product) : null
  const variant = item.variant && typeof item.variant === 'object' ? (item.variant as Variant) : null
  return { product, variant, quantity: item.quantity }
}

function firstGalleryImage(product: Product | null): Media | null {
  const image = product?.gallery?.[0]?.image
  return image && typeof image === 'object' ? image : null
}

export function formatOrderNumber(orderId: number | string): string {
  return `ELX-${orderId}`
}

export function getOrderStatusLabel(order: Order): string {
  const date = formatDateTime({ date: order.updatedAt || order.createdAt, format: 'MMM d, yyyy' })

  switch (order.status) {
    case 'completed':
      return `Delivered on ${date}`
    case 'processing':
      return 'Processing'
    case 'cancelled':
      return 'Cancelled'
    case 'refunded':
      return 'Refunded'
    default:
      return `Placed on ${formatDateTime({ date: order.createdAt, format: 'MMM d, yyyy' })}`
  }
}

export function toAccountOrderPreview(order: Order): AccountOrderPreview {
  const items = order.items ?? []
  const first = items[0]
    ? resolveItem(items[0])
    : { product: null, variant: null, quantity: 0 }
  const productTitle =
    first.product?.title ||
    (items.length > 1 ? `${items.length} items` : 'Order items unavailable')
  const href = `/orders/${order.id}`

  return {
    id: order.id,
    orderNumber: formatOrderNumber(order.id),
    href,
    productTitle,
    productImage: firstGalleryImage(first.product),
    additionalItemCount: Math.max(0, items.length - 1),
    amount: typeof order.amount === 'number' ? order.amount : null,
    currency: order.currency ?? 'INR',
    statusLabel: getOrderStatusLabel(order),
    isCompleted: order.status === 'completed',
    primaryAction: {
      label:
        order.status === 'processing' || order.status === 'completed'
          ? 'Track Package'
          : 'View Details',
      href,
    },
    buyAgain: first.product
      ? {
          productId: first.product.id,
          variantId: first.variant?.id,
          productSlug: first.product.slug || undefined,
          enableVariants: Boolean(first.product.enableVariants),
        }
      : null,
  }
}
