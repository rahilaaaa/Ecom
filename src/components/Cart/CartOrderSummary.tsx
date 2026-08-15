'use client'

import Link from 'next/link'
import React, { useEffect, useMemo, useState, useTransition } from 'react'
import { toast } from 'sonner'

import { Price } from '@/components/Price'
import { applyCouponCode } from '@/lib/cart/applyCoupon'
import { getShippingDisplay } from '@/lib/cart/shipping'
import { cn } from '@/utilities/cn'

const COUPON_STORAGE_KEY = 'elixir-applied-coupon'

type AppliedCoupon = {
  code: string
  type: 'percent' | 'fixed'
  value: number
  discountAmount: number
}

type Props = {
  subtotal: number
  itemCount: number
  disabled?: boolean
}

export function CartOrderSummary({ subtotal, itemCount, disabled }: Props) {
  const [code, setCode] = useState('')
  const [applied, setApplied] = useState<AppliedCoupon | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [isError, setIsError] = useState(false)
  const [isPending, startTransition] = useTransition()

  const shipping = getShippingDisplay(subtotal)

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(COUPON_STORAGE_KEY)
      if (!raw) return
      const parsed = JSON.parse(raw) as AppliedCoupon
      if (parsed?.code) {
        startTransition(async () => {
          const result = await applyCouponCode({ code: parsed.code, subtotal })
          if (result.ok) {
            setApplied({
              code: result.code,
              type: result.type,
              value: result.value,
              discountAmount: result.discountAmount,
            })
          } else {
            window.localStorage.removeItem(COUPON_STORAGE_KEY)
          }
        })
      }
    } catch {
      // ignore storage errors
    }
    // Re-validate when subtotal changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subtotal])

  const discountAmount = applied?.discountAmount || 0
  const total = Math.max(0, subtotal - discountAmount)

  const onApply = () => {
    setMessage(null)
    setIsError(false)
    startTransition(async () => {
      const result = await applyCouponCode({ code, subtotal })
      if (!result.ok) {
        setIsError(true)
        setMessage(result.message)
        setApplied(null)
        window.localStorage.removeItem(COUPON_STORAGE_KEY)
        return
      }

      const next = {
        code: result.code,
        type: result.type,
        value: result.value,
        discountAmount: result.discountAmount,
      }
      setApplied(next)
      window.localStorage.setItem(COUPON_STORAGE_KEY, JSON.stringify(next))
      setIsError(false)
      setMessage(result.message)
      setCode('')
      toast.success(result.message)
    })
  }

  const onRemoveCoupon = () => {
    setApplied(null)
    setMessage(null)
    window.localStorage.removeItem(COUPON_STORAGE_KEY)
  }

  const checkoutHref = useMemo(() => {
    if (!applied?.code) return '/checkout'
    return `/checkout?coupon=${encodeURIComponent(applied.code)}`
  }, [applied?.code])

  return (
    <aside className="rounded-lg border border-[var(--elixir-outline-variant,#c1c8c7)] bg-[var(--elixir-surface-container-low,#f6f3f2)] p-6 md:p-8">
      <h2 className="font-[family-name:var(--font-newsreader)] text-2xl font-medium text-[var(--elixir-on-surface,#1c1b1b)]">
        Order Summary
      </h2>

      <dl className="mt-6 flex flex-col gap-4 text-sm">
        <div className="flex items-center justify-between gap-4">
          <dt className="text-[var(--elixir-outline,#717878)]">Subtotal</dt>
          <dd>
            <Price amount={subtotal} as="span" className="text-[var(--elixir-on-surface,#1c1b1b)]" />
          </dd>
        </div>
        <div className="flex items-center justify-between gap-4">
          <dt className="text-[var(--elixir-outline,#717878)]">Shipping</dt>
          <dd className="text-[var(--elixir-on-surface,#1c1b1b)]">
            {shipping.amount === 0 ? (
              'Free'
            ) : shipping.amount === null ? (
              shipping.label
            ) : (
              <Price amount={shipping.amount} as="span" />
            )}
          </dd>
        </div>
        <div className="flex items-center justify-between gap-4">
          <dt className="text-[var(--elixir-outline,#717878)]">Tax</dt>
          <dd className="text-[var(--elixir-on-surface,#1c1b1b)]">Calculated at checkout</dd>
        </div>

        {applied ? (
          <div className="flex items-center justify-between gap-4">
            <dt className="text-[var(--elixir-outline,#717878)]">
              Discount ({applied.code})
              <button
                type="button"
                onClick={onRemoveCoupon}
                className="ml-2 text-xs underline underline-offset-2"
              >
                Remove
              </button>
            </dt>
            <dd className="text-[#ba1a1a]">
              −
              <Price amount={discountAmount} as="span" />
            </dd>
          </div>
        ) : null}

        <div className="mt-2 flex items-center justify-between gap-4 border-t border-[var(--elixir-outline-variant,#c1c8c7)] pt-4">
          <dt className="font-[family-name:var(--font-newsreader)] text-lg font-medium text-[var(--elixir-on-surface,#1c1b1b)]">
            Total
          </dt>
          <dd>
            <Price
              amount={total}
              as="span"
              className="font-[family-name:var(--font-newsreader)] text-lg font-medium text-[var(--elixir-on-surface,#1c1b1b)]"
            />
          </dd>
        </div>
      </dl>

      <div className="mt-8">
        <label className="flex items-end gap-3 border-b border-[var(--elixir-outline-variant,#c1c8c7)] pb-2">
          <span className="sr-only">Coupon code</span>
          <input
            type="text"
            value={code}
            onChange={(event) => setCode(event.target.value)}
            placeholder="Enter coupon code"
            disabled={isPending}
            className="min-h-11 flex-1 bg-transparent text-sm outline-none placeholder:text-[var(--elixir-outline,#717878)]"
          />
          <button
            type="button"
            onClick={onApply}
            disabled={isPending || !code.trim()}
            className="pb-1 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--elixir-on-surface,#1c1b1b)] disabled:opacity-40"
          >
            {isPending ? '…' : 'Apply'}
          </button>
        </label>
        {message ? (
          <p
            role={isError ? 'alert' : 'status'}
            className={cn('mt-2 text-xs', isError ? 'text-[#ba1a1a]' : 'text-[var(--elixir-on-surface-variant,#414848)]')}
          >
            {message}
          </p>
        ) : null}
      </div>

      <Link
        href={itemCount > 0 && !disabled ? checkoutHref : '/shop'}
        aria-disabled={itemCount === 0 || disabled}
        className={cn(
          'mt-8 flex min-h-12 w-full items-center justify-center bg-[var(--elixir-primary-container,#0d2b2b)] text-xs font-semibold uppercase tracking-[0.12em] text-white transition hover:bg-[#164a4a]',
          (itemCount === 0 || disabled) && 'pointer-events-none opacity-50',
        )}
      >
        Proceed to Checkout
      </Link>
    </aside>
  )
}
