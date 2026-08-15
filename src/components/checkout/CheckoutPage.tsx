'use client'

import { Message } from '@/components/Message'
import { CheckoutChrome } from '@/components/checkout/CheckoutChrome'
import { CheckoutInput, CheckoutSelect } from '@/components/checkout/CheckoutFields'
import { CheckoutForm } from '@/components/forms/CheckoutForm'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import { stateOptions } from '@/blocks/Form/State/options'
import { subscribeNewsletter } from '@/lib/home/subscribeNewsletter'
import { validateCheckoutCart } from '@/lib/checkout/validateCheckoutCart'
import { cssVariables } from '@/cssVariables'
import { useAuth } from '@/providers/Auth'
import { useTheme } from '@/providers/Theme'
import { Address } from '@/payload-types'
import { useAddresses, useCart, usePayments } from '@payloadcms/plugin-ecommerce/client/react'
import { Elements } from '@stripe/react-stripe-js'
import { loadStripe } from '@stripe/stripe-js'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import React, { Suspense, useCallback, useEffect, useMemo, useState, useTransition } from 'react'
import { toast } from 'sonner'

import { cn } from '@/utilities/cn'

const apiKey = `${process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY}`
const stripe = loadStripe(apiKey)

type Step = 'information' | 'shipping' | 'payment'

type AddressDraft = {
  country: Address['country']
  firstName: string
  lastName: string
  addressLine1: string
  addressLine2: string
  city: string
  state: string
  postalCode: string
  phone?: string
}

const emptyAddress: AddressDraft = {
  country: 'US',
  firstName: '',
  lastName: '',
  addressLine1: '',
  addressLine2: '',
  city: '',
  state: '',
  postalCode: '',
  phone: '',
}

const COUNTRY_OPTIONS = [
  { label: 'United States', value: 'US' },
  { label: 'United Kingdom', value: 'GB' },
  { label: 'Canada', value: 'CA' },
  { label: 'Australia', value: 'AU' },
]

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())
}

function StepNav({
  step,
  onNavigate,
}: {
  step: Step
  onNavigate: (next: Step) => void
}) {
  const steps: { id: Step; label: string }[] = [
    { id: 'information', label: 'Information' },
    { id: 'shipping', label: 'Shipping' },
    { id: 'payment', label: 'Payment' },
  ]

  const currentIndex = steps.findIndex((entry) => entry.id === step)

  return (
    <nav aria-label="Checkout steps" className="mb-8 text-sm">
      <ol className="flex flex-wrap items-center gap-2 text-[var(--elixir-outline,#717878)]">
        {steps.map((entry, index) => {
          const isCurrent = entry.id === step
          const isComplete = index < currentIndex
          return (
            <li key={entry.id} className="flex items-center gap-2">
              {index > 0 ? <span aria-hidden>›</span> : null}
              <button
                type="button"
                disabled={!isComplete && !isCurrent}
                onClick={() => {
                  if (isComplete) onNavigate(entry.id)
                }}
                className={cn(
                  'transition',
                  isCurrent && 'font-medium text-[var(--elixir-on-surface,#1c1b1b)]',
                  isComplete && 'underline underline-offset-2 hover:opacity-70',
                  !isComplete && !isCurrent && 'cursor-default opacity-60',
                )}
                aria-current={isCurrent ? 'step' : undefined}
              >
                {entry.label}
              </button>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}

export const CheckoutPage: React.FC = () => {
  const { user } = useAuth()
  const { theme } = useTheme()
  const { cart } = useCart()
  const { initiatePayment } = usePayments()
  const { addresses } = useAddresses()

  const [step, setStep] = useState<Step>('information')
  const [email, setEmail] = useState('')
  const [marketingOptIn, setMarketingOptIn] = useState(true)
  const [address, setAddress] = useState<AddressDraft>(emptyAddress)
  const [shippingMethod, setShippingMethod] = useState<'standard' | 'express'>('standard')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [error, setError] = useState<string | null>(null)
  const [paymentData, setPaymentData] = useState<null | Record<string, unknown>>(null)
  const [isProcessingPayment, setProcessingPayment] = useState(false)
  const [discountAmount, setDiscountAmount] = useState(0)
  const [couponCode, setCouponCode] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const cartIsEmpty = !cart || !cart.items || !cart.items.length

  useEffect(() => {
    if (user?.email) setEmail(user.email)
  }, [user?.email])

  useEffect(() => {
    const coupon = searchParams.get('coupon')
    if (coupon) setCouponCode(coupon)

    try {
      const raw = window.localStorage.getItem('elixir-applied-coupon')
      if (raw) {
        const parsed = JSON.parse(raw) as { code?: string; discountAmount?: number }
        if (parsed.code) setCouponCode(parsed.code)
        if (typeof parsed.discountAmount === 'number') setDiscountAmount(parsed.discountAmount)
      }
    } catch {
      // ignore
    }
  }, [searchParams])

  useEffect(() => {
    if (!user || !addresses?.length) return
    if (address.firstName || address.addressLine1) return
    const defaultAddress = addresses[0]
    if (!defaultAddress) return
    setAddress({
      country: defaultAddress.country || 'US',
      firstName: defaultAddress.firstName || '',
      lastName: defaultAddress.lastName || '',
      addressLine1: defaultAddress.addressLine1 || '',
      addressLine2: defaultAddress.addressLine2 || '',
      city: defaultAddress.city || '',
      state: defaultAddress.state || '',
      postalCode: defaultAddress.postalCode || '',
      phone: defaultAddress.phone || '',
    })
  }, [addresses, user, address.firstName, address.addressLine1])

  const cartItemsPayload = useMemo(() => {
    return (cart?.items || [])
      .map((item) => {
        const productId =
          typeof item.product === 'object' ? item.product?.id : item.product
        const variantId =
          typeof item.variant === 'object' ? item.variant?.id : item.variant
        if (!productId) return null
        return {
          productId,
          variantId: variantId ?? null,
          quantity: item.quantity || 0,
        }
      })
      .filter(Boolean) as {
      productId: string | number
      variantId?: string | number | null
      quantity: number
    }[]
  }, [cart?.items])

  const validateInformation = () => {
    const nextErrors: Record<string, string> = {}
    if (!email.trim()) nextErrors.email = 'Email is required.'
    else if (!isValidEmail(email)) nextErrors.email = 'Enter a valid email address.'
    if (!address.firstName.trim()) nextErrors.firstName = 'First name is required.'
    if (!address.lastName.trim()) nextErrors.lastName = 'Last name is required.'
    if (!address.addressLine1.trim()) nextErrors.addressLine1 = 'Address is required.'
    if (!address.city.trim()) nextErrors.city = 'City is required.'
    if (!address.postalCode.trim()) nextErrors.postalCode = 'ZIP / postal code is required.'
    if (!address.country) nextErrors.country = 'Country is required.'
    if (address.country === 'US' && !address.state.trim()) {
      nextErrors.state = 'State is required.'
    }
    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const runCartValidation = async () => {
    const result = await validateCheckoutCart({
      items: cartItemsPayload,
      couponCode,
    })
    if (!result.ok) {
      setError(result.message)
      toast.error(result.message)
      return null
    }
    setDiscountAmount(result.discount)
    setError(null)
    return result
  }

  const continueToShipping = () => {
    if (!validateInformation()) {
      toast.error('Please fix the highlighted fields.')
      return
    }

    startTransition(async () => {
      const valid = await runCartValidation()
      if (!valid) return

      if (marketingOptIn && email) {
        void subscribeNewsletter({ email }).catch(() => undefined)
      }

      setStep('shipping')
      window.scrollTo({ top: 0, behavior: 'smooth' })
    })
  }

  const shippingAddressPayload = useMemo(
    () =>
      ({
        ...address,
        country: address.country,
      }) as Partial<Address>,
    [address],
  )

  const initiatePaymentIntent = useCallback(async () => {
    try {
      setError(null)
      const valid = await runCartValidation()
      if (!valid) return

      const payment = (await initiatePayment('stripe', {
        additionalData: {
          ...(email ? { customerEmail: email } : {}),
          billingAddress: shippingAddressPayload,
          shippingAddress: shippingAddressPayload,
        },
      })) as Record<string, unknown>

      if (payment) {
        setPaymentData(payment)
        setStep('payment')
        window.scrollTo({ top: 0, behavior: 'smooth' })
      }
    } catch (err) {
      const errorData = err instanceof Error ? (() => {
        try {
          return JSON.parse(err.message)
        } catch {
          return {}
        }
      })() : {}
      let errorMessage = 'An error occurred while initiating payment.'
      if (errorData?.cause?.code === 'OutOfStock') {
        errorMessage = 'One or more items in your cart are out of stock.'
      }
      setError(errorMessage)
      toast.error(errorMessage)
    }
  }, [email, initiatePayment, shippingAddressPayload, cartItemsPayload, couponCode])

  const continueToPayment = () => {
    startTransition(async () => {
      await initiatePaymentIntent()
    })
  }

  if (!stripe) return null

  if (cartIsEmpty && isProcessingPayment) {
    return (
      <div className="shop-luxe flex min-h-[60vh] flex-col items-center justify-center gap-4 bg-[var(--elixir-surface,#fcf9f8)] px-5 text-center">
        <p className="font-[family-name:var(--font-newsreader)] text-2xl">Processing your payment…</p>
        <LoadingSpinner />
      </div>
    )
  }

  if (cartIsEmpty) {
    return (
      <div className="shop-luxe bg-[var(--elixir-surface,#fcf9f8)]">
        <CheckoutChrome discountAmount={discountAmount} />
        <div className="mx-auto flex max-w-[640px] flex-col items-start gap-6 px-5 py-16">
          <h1 className="font-[family-name:var(--font-newsreader)] text-3xl font-medium">
            Your cart is empty
          </h1>
          <p className="text-sm text-[var(--elixir-on-surface-variant,#414848)]">
            Add pieces to your bag before continuing to checkout.
          </p>
          <Link
            href="/shop"
            className="inline-flex min-h-12 items-center bg-[var(--elixir-primary-container,#0d2b2b)] px-6 text-xs font-semibold uppercase tracking-[0.12em] text-white"
          >
            Continue shopping
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="shop-luxe min-h-screen bg-[var(--elixir-surface,#fcf9f8)] text-[var(--elixir-on-surface,#1c1b1b)]">
      <CheckoutChrome discountAmount={discountAmount} />

      <div className="mx-auto w-full max-w-[640px] px-5 py-8 md:py-12">
        <StepNav
          step={step}
          onNavigate={(next) => {
            if (next === 'information') {
              setPaymentData(null)
              setStep('information')
            }
            if (next === 'shipping' && step === 'payment') {
              setPaymentData(null)
              setStep('shipping')
            }
          }}
        />

        {error ? (
          <div className="mb-6">
            <Message error={error} />
          </div>
        ) : null}

        {step === 'information' ? (
          <div className="flex flex-col gap-10">
            <section className="flex flex-col gap-4">
              <div className="flex items-center justify-between gap-4">
                <h2 className="font-[family-name:var(--font-newsreader)] text-2xl font-medium">
                  Contact
                </h2>
                {!user ? (
                  <Link href="/login" className="text-sm underline underline-offset-4">
                    Log in
                  </Link>
                ) : (
                  <Link href="/logout" className="text-sm underline underline-offset-4">
                    Log out
                  </Link>
                )}
              </div>

              <CheckoutInput
                id="email"
                label="Email or mobile phone number"
                type="email"
                autoComplete="email"
                value={email}
                disabled={Boolean(user?.email)}
                onChange={(event) => setEmail(event.target.value)}
                error={errors.email}
                required
              />

              <label className="flex items-center gap-3 text-sm text-[var(--elixir-on-surface,#1c1b1b)]">
                <input
                  type="checkbox"
                  checked={marketingOptIn}
                  onChange={(event) => setMarketingOptIn(event.target.checked)}
                  className="h-5 w-5 rounded border-[var(--elixir-outline-variant,#c1c8c7)] accent-[var(--elixir-primary-container,#0d2b2b)]"
                />
                Email me with news and offers
              </label>
            </section>

            <section className="flex flex-col gap-4">
              <h2 className="font-[family-name:var(--font-newsreader)] text-2xl font-medium">
                Shipping address
              </h2>

              {user && addresses && addresses.length > 0 ? (
                <div className="flex flex-col gap-2">
                  <p className="text-xs uppercase tracking-[0.1em] text-[var(--elixir-outline,#717878)]">
                    Saved addresses
                  </p>
                  <div className="flex flex-col gap-2">
                    {addresses.map((saved) => (
                      <button
                        key={saved.id}
                        type="button"
                        onClick={() =>
                          setAddress({
                            country: saved.country || 'US',
                            firstName: saved.firstName || '',
                            lastName: saved.lastName || '',
                            addressLine1: saved.addressLine1 || '',
                            addressLine2: saved.addressLine2 || '',
                            city: saved.city || '',
                            state: saved.state || '',
                            postalCode: saved.postalCode || '',
                            phone: saved.phone || '',
                          })
                        }
                        className="rounded-md border border-[var(--elixir-outline-variant,#c1c8c7)] bg-white px-4 py-3 text-left text-sm transition hover:bg-[var(--elixir-surface-container-low,#f6f3f2)]"
                      >
                        {[saved.firstName, saved.lastName].filter(Boolean).join(' ')}
                        {saved.addressLine1 ? ` — ${saved.addressLine1}` : ''}
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}

              <CheckoutSelect
                id="country"
                label="Country/Region"
                value={address.country}
                onChange={(event) =>
                  setAddress((prev) => ({
                    ...prev,
                    country: event.target.value as Address['country'],
                  }))
                }
                options={COUNTRY_OPTIONS}
                error={errors.country}
              />

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <CheckoutInput
                  id="firstName"
                  label="First name"
                  autoComplete="given-name"
                  value={address.firstName}
                  onChange={(event) =>
                    setAddress((prev) => ({ ...prev, firstName: event.target.value }))
                  }
                  error={errors.firstName}
                  required
                />
                <CheckoutInput
                  id="lastName"
                  label="Last name"
                  autoComplete="family-name"
                  value={address.lastName}
                  onChange={(event) =>
                    setAddress((prev) => ({ ...prev, lastName: event.target.value }))
                  }
                  error={errors.lastName}
                  required
                />
              </div>

              <CheckoutInput
                id="addressLine1"
                label="Address"
                autoComplete="address-line1"
                value={address.addressLine1}
                onChange={(event) =>
                  setAddress((prev) => ({ ...prev, addressLine1: event.target.value }))
                }
                error={errors.addressLine1}
                required
              />

              <CheckoutInput
                id="addressLine2"
                label="Apartment, suite, etc."
                optional
                autoComplete="address-line2"
                value={address.addressLine2}
                onChange={(event) =>
                  setAddress((prev) => ({ ...prev, addressLine2: event.target.value }))
                }
              />

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <CheckoutInput
                  id="city"
                  label="City"
                  autoComplete="address-level2"
                  value={address.city}
                  onChange={(event) => setAddress((prev) => ({ ...prev, city: event.target.value }))}
                  error={errors.city}
                  required
                />
                {address.country === 'US' ? (
                  <CheckoutSelect
                    id="state"
                    label="State"
                    value={address.state}
                    onChange={(event) =>
                      setAddress((prev) => ({ ...prev, state: event.target.value }))
                    }
                    options={stateOptions}
                    placeholder="State"
                    error={errors.state}
                  />
                ) : (
                  <CheckoutInput
                    id="state"
                    label="State / Province"
                    optional
                    value={address.state}
                    onChange={(event) =>
                      setAddress((prev) => ({ ...prev, state: event.target.value }))
                    }
                    error={errors.state}
                  />
                )}
                <CheckoutInput
                  id="postalCode"
                  label="ZIP code"
                  autoComplete="postal-code"
                  value={address.postalCode}
                  onChange={(event) =>
                    setAddress((prev) => ({ ...prev, postalCode: event.target.value }))
                  }
                  error={errors.postalCode}
                  required
                />
              </div>
            </section>

            <button
              type="button"
              disabled={isPending}
              onClick={continueToShipping}
              className="flex min-h-12 w-full items-center justify-center bg-[var(--elixir-primary,#001515)] text-xs font-semibold uppercase tracking-[0.12em] text-white transition hover:bg-[#164a4a] disabled:opacity-60"
            >
              {isPending ? 'Validating…' : 'Continue to shipping'}
            </button>
          </div>
        ) : null}

        {step === 'shipping' ? (
          <div className="flex flex-col gap-8">
            <section className="rounded-lg border border-[var(--elixir-outline-variant,#c1c8c7)] bg-white p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.1em] text-[var(--elixir-outline,#717878)]">
                    Contact
                  </p>
                  <p className="mt-1 text-sm">{email}</p>
                </div>
                <button
                  type="button"
                  className="text-sm underline underline-offset-4"
                  onClick={() => setStep('information')}
                >
                  Change
                </button>
              </div>
              <hr className="my-4 border-[var(--elixir-surface-container,#f0eded)]" />
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.1em] text-[var(--elixir-outline,#717878)]">
                    Ship to
                  </p>
                  <p className="mt-1 text-sm leading-relaxed">
                    {address.firstName} {address.lastName}
                    <br />
                    {address.addressLine1}
                    {address.addressLine2 ? (
                      <>
                        <br />
                        {address.addressLine2}
                      </>
                    ) : null}
                    <br />
                    {address.city}
                    {address.state ? `, ${address.state}` : ''} {address.postalCode}
                    <br />
                    {address.country}
                  </p>
                </div>
                <button
                  type="button"
                  className="text-sm underline underline-offset-4"
                  onClick={() => setStep('information')}
                >
                  Change
                </button>
              </div>
            </section>

            <section className="flex flex-col gap-4">
              <h2 className="font-[family-name:var(--font-newsreader)] text-2xl font-medium">
                Shipping method
              </h2>

              <label
                className={cn(
                  'flex cursor-pointer items-center justify-between gap-4 rounded-md border px-4 py-4',
                  shippingMethod === 'standard'
                    ? 'border-[var(--elixir-on-surface,#1c1b1b)] bg-white'
                    : 'border-[var(--elixir-outline-variant,#c1c8c7)] bg-white',
                )}
              >
                <span className="flex items-center gap-3 text-sm">
                  <input
                    type="radio"
                    name="shippingMethod"
                    checked={shippingMethod === 'standard'}
                    onChange={() => setShippingMethod('standard')}
                    className="accent-[var(--elixir-primary-container,#0d2b2b)]"
                  />
                  Standard (3–5 business days)
                </span>
                <span className="text-sm font-medium">Free</span>
              </label>

              <label
                className={cn(
                  'flex cursor-pointer items-center justify-between gap-4 rounded-md border px-4 py-4',
                  shippingMethod === 'express'
                    ? 'border-[var(--elixir-on-surface,#1c1b1b)] bg-white'
                    : 'border-[var(--elixir-outline-variant,#c1c8c7)] bg-white',
                )}
              >
                <span className="flex items-center gap-3 text-sm">
                  <input
                    type="radio"
                    name="shippingMethod"
                    checked={shippingMethod === 'express'}
                    onChange={() => setShippingMethod('express')}
                    className="accent-[var(--elixir-primary-container,#0d2b2b)]"
                  />
                  Express (1–2 business days)
                </span>
                <span className="text-sm text-[var(--elixir-outline,#717878)]">
                  Calculated at payment
                </span>
              </label>
            </section>

            <button
              type="button"
              disabled={isPending}
              onClick={continueToPayment}
              className="flex min-h-12 w-full items-center justify-center bg-[var(--elixir-primary,#001515)] text-xs font-semibold uppercase tracking-[0.12em] text-white transition hover:bg-[#164a4a] disabled:opacity-60"
            >
              {isPending ? 'Preparing payment…' : 'Continue to payment'}
            </button>
          </div>
        ) : null}

        {step === 'payment' ? (
          <div className="flex flex-col gap-8">
            <section className="rounded-lg border border-[var(--elixir-outline-variant,#c1c8c7)] bg-white p-5 text-sm">
              <p>
                <span className="text-[var(--elixir-outline,#717878)]">Contact</span>
                <br />
                {email}
              </p>
              <hr className="my-4 border-[var(--elixir-surface-container,#f0eded)]" />
              <p>
                <span className="text-[var(--elixir-outline,#717878)]">Ship to</span>
                <br />
                {address.addressLine1}, {address.city}
              </p>
              <hr className="my-4 border-[var(--elixir-surface-container,#f0eded)]" />
              <p>
                <span className="text-[var(--elixir-outline,#717878)]">Method</span>
                <br />
                {shippingMethod === 'standard' ? 'Standard · Free' : 'Express'}
              </p>
            </section>

            <h2 className="font-[family-name:var(--font-newsreader)] text-2xl font-medium">
              Payment
            </h2>

            <Suspense fallback={<LoadingSpinner />}>
              {paymentData?.['clientSecret'] ? (
                <Elements
                  options={{
                    appearance: {
                      theme: 'stripe',
                      variables: {
                        borderRadius: '6px',
                        colorPrimary: '#0d2b2b',
                        colorBackground: '#ffffff',
                        colorDanger: cssVariables.colors.error500,
                        colorText: '#1c1b1b',
                        colorTextPlaceholder: '#717878',
                        fontFamily: 'Inter, sans-serif',
                        fontSizeBase: '16px',
                        spacingUnit: '4px',
                      },
                    },
                    clientSecret: paymentData['clientSecret'] as string,
                  }}
                  stripe={stripe}
                >
                  <div className="flex flex-col gap-6">
                    <CheckoutForm
                      customerEmail={email}
                      billingAddress={shippingAddressPayload}
                      setProcessingPayment={setProcessingPayment}
                    />
                    <button
                      type="button"
                      className="self-start text-sm underline underline-offset-4"
                      onClick={() => {
                        setPaymentData(null)
                        setStep('shipping')
                      }}
                    >
                      Return to shipping
                    </button>
                  </div>
                </Elements>
              ) : (
                <div className="flex flex-col gap-4">
                  <p className="text-sm text-[var(--elixir-on-surface-variant,#414848)]">
                    Payment could not be started.
                  </p>
                  <button
                    type="button"
                    onClick={continueToPayment}
                    className="inline-flex min-h-12 items-center justify-center bg-[var(--elixir-primary,#001515)] px-6 text-xs font-semibold uppercase tracking-[0.12em] text-white"
                  >
                    Try again
                  </button>
                </div>
              )}
            </Suspense>
          </div>
        ) : null}
      </div>
    </div>
  )
}
