import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { Price } from '@/components/Price'
import { PrintInvoiceButton } from '@/components/orders/PrintInvoiceButton'
import { formatOrderNumber } from '@/lib/account/orderPreview'
import { getSecureOrder } from '@/lib/orders/getSecureOrder'
import type { Order, Product, Variant } from '@/payload-types'
import { formatDateTime } from '@/utilities/formatDateTime'
import { mergeOpenGraph } from '@/utilities/mergeOpenGraph'

export const dynamic = 'force-dynamic'

type PageProps = {
  params: Promise<{ id: string }>
  searchParams: Promise<{ email?: string; accessToken?: string }>
}

export default async function OrderInvoicePage({ params, searchParams }: PageProps) {
  const { id } = await params
  const { email = '', accessToken = '' } = await searchParams
  const result = await getSecureOrder({ id, email, accessToken })

  if (!result) {
    notFound()
  }

  const { order } = result
  const orderNumber = formatOrderNumber(order.id)
  const placedOn = formatDateTime({ date: order.createdAt, format: 'MMMM d, yyyy' })
  const backQuery =
    email && accessToken
      ? `?email=${encodeURIComponent(email)}&accessToken=${encodeURIComponent(accessToken)}`
      : ''

  return (
    <div className="mx-auto w-full max-w-2xl px-5 py-10 text-[var(--elixir-on-surface,#1c1b1b)] print:px-0">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4 print:hidden">
        <Link
          href={`/orders/${order.id}${backQuery}`}
          className="text-sm underline underline-offset-4"
        >
          ← Back to order
        </Link>
        <PrintInvoiceButton />
      </div>

      <header className="border-b border-[var(--elixir-outline-variant,#c4c7c7)] pb-6">
        <p className="font-[family-name:var(--font-newsreader)] text-2xl tracking-[0.08em]">
          ELIXIR
        </p>
        <h1 className="mt-4 font-[family-name:var(--font-newsreader)] text-3xl font-medium">
          Invoice
        </h1>
        <p className="mt-2 text-sm text-[var(--elixir-on-surface-variant,#414848)]">
          Order #{orderNumber} · Placed {placedOn}
        </p>
      </header>

      {order.shippingAddress ? (
        <section className="mt-6 text-sm">
          <h2 className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--elixir-outline,#717878)]">
            Bill / Ship To
          </h2>
          <p className="mt-2">
            {[order.shippingAddress.firstName, order.shippingAddress.lastName]
              .filter(Boolean)
              .join(' ')}
          </p>
          <p>
            {[order.shippingAddress.addressLine1, order.shippingAddress.addressLine2]
              .filter(Boolean)
              .join(', ')}
          </p>
          <p>
            {[
              order.shippingAddress.city,
              order.shippingAddress.state,
              order.shippingAddress.postalCode,
            ]
              .filter(Boolean)
              .join(', ')}
          </p>
          {order.shippingAddress.country ? <p>{order.shippingAddress.country}</p> : null}
        </section>
      ) : null}

      <table className="mt-8 w-full text-left text-sm">
        <thead>
          <tr className="border-b border-[var(--elixir-outline-variant,#c4c7c7)] text-xs uppercase tracking-[0.1em] text-[var(--elixir-outline,#717878)]">
            <th className="py-2 font-medium">Item</th>
            <th className="py-2 font-medium">Qty</th>
            <th className="py-2 text-right font-medium">Amount</th>
          </tr>
        </thead>
        <tbody>
          {(order.items || []).map((item, index) => {
            const product =
              item.product && typeof item.product === 'object' ? (item.product as Product) : null
            const variant =
              item.variant && typeof item.variant === 'object' ? (item.variant as Variant) : null
            const title = item.productTitle || product?.title || 'Item'
            const unit =
              typeof item.unitPrice === 'number'
                ? item.unitPrice
                : typeof variant?.priceInUSD === 'number'
                  ? variant.priceInUSD
                  : typeof product?.priceInUSD === 'number'
                    ? product.priceInUSD
                    : null
            const line =
              typeof unit === 'number' && typeof item.quantity === 'number'
                ? unit * item.quantity
                : null

            return (
              <tr
                key={item.id || index}
                className="border-b border-[var(--elixir-outline-variant,#c4c7c7)]/40"
              >
                <td className="py-3">{title}</td>
                <td className="py-3">{item.quantity}</td>
                <td className="py-3 text-right">
                  {typeof line === 'number' ? (
                    <Price amount={line} currencyCode={order.currency ?? undefined} />
                  ) : (
                    '—'
                  )}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>

      <InvoiceTotals order={order} />
    </div>
  )
}

function InvoiceTotals({ order }: { order: Order }) {
  const currency = order.currency ?? undefined
  const subtotal = order.subtotal
  const shipping = order.shippingAmount
  const tax = order.taxAmount

  return (
    <dl className="mt-6 ml-auto w-full max-w-xs space-y-2 text-sm">
      {typeof subtotal === 'number' ? (
        <div className="flex justify-between gap-6">
          <dt>Subtotal</dt>
          <dd>
            <Price amount={subtotal} currencyCode={currency} />
          </dd>
        </div>
      ) : null}
      {typeof shipping === 'number' ? (
        <div className="flex justify-between gap-6">
          <dt>Shipping</dt>
          <dd>{shipping === 0 ? 'Free' : <Price amount={shipping} currencyCode={currency} />}</dd>
        </div>
      ) : null}
      {typeof tax === 'number' ? (
        <div className="flex justify-between gap-6">
          <dt>Tax</dt>
          <dd>
            <Price amount={tax} currencyCode={currency} />
          </dd>
        </div>
      ) : null}
      {typeof order.amount === 'number' ? (
        <div className="flex justify-between gap-6 border-t border-[var(--elixir-outline-variant,#c4c7c7)] pt-2 font-semibold">
          <dt>Total</dt>
          <dd>
            <Price amount={order.amount} currencyCode={currency} className="font-semibold" />
          </dd>
        </div>
      ) : null}
    </dl>
  )
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params
  return {
    description: 'Order invoice.',
    openGraph: mergeOpenGraph({
      title: `Invoice #${formatOrderNumber(id)}`,
      url: `/orders/${id}/invoice`,
    }),
    title: `Invoice #${formatOrderNumber(id)}`,
  }
}
