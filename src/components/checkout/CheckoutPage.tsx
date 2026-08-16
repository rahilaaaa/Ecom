'use client'

import { Message } from '@/components/Message'
import { CheckoutChrome } from '@/components/checkout/CheckoutChrome'
import { CheckoutInput, CheckoutSelect } from '@/components/checkout/CheckoutFields'
import { CheckoutForm } from '@/components/forms/CheckoutForm'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import {
  CHECKOUT_COUNTRY_OPTIONS,
  DEFAULT_COUNTRY,
  getCountryLabel,
  isIndia,
  isValidIndiaMobile,
  isValidIndiaPin,
  phoneFieldLabel,
  postalCodeLabel,
  type CountryCode,
} from '@/lib/address/countries'
import {
  getStateOptionsForCountry,
  isStateRequired,
  stateFieldLabel,
} from '@/lib/address/states'
import {
  clearCheckoutDraft,
  loadCheckoutDraft,
  saveCheckoutDraft,
} from '@/lib/checkout/checkoutDraft'
import {
  formatInrFromPaise,
  getCheckoutPaymentMethods,
  isStripePublishableConfigured,
  type CheckoutPaymentMethod,
} from '@/lib/checkout/paymentMethods'
import { isOnlinePaymentEnabled } from '@/lib/checkout/paymentConfig'
import { placeCodOrder } from '@/lib/checkout/placeCodOrder'
import { validateCheckoutCart } from '@/lib/checkout/validateCheckoutCart'
import {
  DEFAULT_SHIPPING_METHOD,
  SHIPPING_CONFIG,
  getShippingDisplay,
  type ShippingMethodId,
} from '@/lib/checkout/shippingConfig'
import { subscribeNewsletter } from '@/lib/home/subscribeNewsletter'
import { cssVariables } from '@/cssVariables'
import { useAuth } from '@/providers/Auth'
import { Address } from '@/payload-types'
import { useAddresses, useCart, usePayments } from '@payloadcms/plugin-ecommerce/client/react'
import { Elements } from '@stripe/react-stripe-js'
import { loadStripe } from '@stripe/stripe-js'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import React, { Suspense, useCallback, useEffect, useMemo, useRef, useState, useTransition } from 'react'
import { toast } from 'sonner'

import { Price } from '@/components/Price'
import { cn } from '@/utilities/cn'

const apiKey = `${process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY}`
const stripe = loadStripe(apiKey)

const COUPON_CODE_STORAGE_KEY = 'elixir-applied-coupon-code'

type Step = 'information' | 'shipping' | 'payment'

type AddressDraft = {
  country: CountryCode
  firstName: string
  lastName: string
  addressLine1: string
  addressLine2: string
  city: string
  state: string
  postalCode: string
  phone: string
}

const emptyAddress: AddressDraft = {
  country: DEFAULT_COUNTRY,
  firstName: '',
  lastName: '',
  addressLine1: '',
  addressLine2: '',
  city: '',
  state: '',
  postalCode: '',
  phone: '',
}

type ServerTotals = {
  subtotal: number
  discount: number
  shipping: number
  tax: number
  total: number
  taxImplemented: boolean
}

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
  const { cart, clearCart } = useCart()
  const { initiatePayment } = usePayments()
  const { addresses } = useAddresses()
  const searchParams = useSearchParams()
  const router = useRouter()

  const [step, setStep] = useState<Step>('information')
  const [email, setEmail] = useState('')
  const [marketingOptIn, setMarketingOptIn] = useState(true)
  const [address, setAddress] = useState<AddressDraft>(emptyAddress)
  const [shippingMethod, setShippingMethod] =
    useState<ShippingMethodId>(DEFAULT_SHIPPING_METHOD)
  const [paymentMethod, setPaymentMethod] = useState<CheckoutPaymentMethod | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [error, setError] = useState<string | null>(null)
  const [paymentData, setPaymentData] = useState<null | Record<string, unknown>>(null)
  const [isProcessingPayment, setProcessingPayment] = useState(false)
  const [isPlacingCod, setIsPlacingCod] = useState(false)
  const [couponCode, setCouponCode] = useState<string | null>(null)
  const [serverTotals, setServerTotals] = useState<ServerTotals | null>(null)
  const [draftReady, setDraftReady] = useState(false)
  const [isPending, startTransition] = useTransition()
  const codIdempotencyKeyRef = useRef<string | null>(null)
  const initiatingOnlineRef = useRef(false)

  const cartIsEmpty = !cart || !cart.items || !cart.items.length
  const stateOptions = getStateOptionsForCountry(address.country)
  const stripePublishableConfigured = isStripePublishableConfigured(apiKey)
  const onlinePaymentEnabled = isOnlinePaymentEnabled()
  const paymentMethods = getCheckoutPaymentMethods()

  useEffect(() => {
    const draft = loadCheckoutDraft()
    if (draft) {
      if (draft.step === 'information' || draft.step === 'shipping') {
        setStep(draft.step)
      }
      if (draft.email) setEmail(draft.email)
      if (typeof draft.marketingOptIn === 'boolean') setMarketingOptIn(draft.marketingOptIn)
      if (draft.shippingMethod === 'standard' || draft.shippingMethod === 'express') {
        setShippingMethod(draft.shippingMethod)
      }
      if (
        (draft.paymentMethod === 'cod' || draft.paymentMethod === 'online') &&
        (draft.paymentMethod === 'cod' || isOnlinePaymentEnabled())
      ) {
        setPaymentMethod(draft.paymentMethod)
      }
      if (draft.couponCode) setCouponCode(draft.couponCode)
      setAddress((prev) => ({
        ...prev,
        country: (draft.country as CountryCode) || prev.country || DEFAULT_COUNTRY,
        firstName: draft.firstName || '',
        lastName: draft.lastName || '',
        addressLine1: draft.addressLine1 || '',
        addressLine2: draft.addressLine2 || '',
        city: draft.city || '',
        state: draft.state || '',
        postalCode: draft.postalCode || '',
        phone: draft.phone || '',
      }))
    }

    const couponFromQuery = searchParams.get('coupon')
    if (couponFromQuery) setCouponCode(couponFromQuery)

    try {
      const storedCode = window.localStorage.getItem(COUPON_CODE_STORAGE_KEY)
      if (storedCode && !couponFromQuery) setCouponCode(storedCode)
    } catch {
      // ignore
    }

    setDraftReady(true)
  }, [searchParams])

  useEffect(() => {
    if (!draftReady) return
    saveCheckoutDraft({
      step: step === 'payment' ? 'shipping' : step,
      email,
      marketingOptIn,
      country: address.country,
      firstName: address.firstName,
      lastName: address.lastName,
      addressLine1: address.addressLine1,
      addressLine2: address.addressLine2,
      city: address.city,
      state: address.state,
      postalCode: address.postalCode,
      phone: address.phone,
      shippingMethod,
      couponCode,
      paymentMethod,
    })
  }, [draftReady, step, email, marketingOptIn, address, shippingMethod, couponCode, paymentMethod])

  useEffect(() => {
    if (!draftReady || step !== 'shipping' || cartIsEmpty) return
    startTransition(async () => {
      await runCartValidation()
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shippingMethod])

  useEffect(() => {
    if (user?.email) setEmail(user.email)
  }, [user?.email])

  useEffect(() => {
    if (!user || !addresses?.length) return
    if (address.firstName || address.addressLine1) return
    const defaultAddress = addresses[0]
    if (!defaultAddress) return
    setAddress({
      country: (defaultAddress.country as CountryCode) || DEFAULT_COUNTRY,
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
        const productId = typeof item.product === 'object' ? item.product?.id : item.product
        const variantId = typeof item.variant === 'object' ? item.variant?.id : item.variant
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
    if (!address.country) nextErrors.country = 'Country is required.'

    if (isStateRequired(address.country)) {
      if (!address.state.trim()) nextErrors.state = `${stateFieldLabel(address.country)} is required.`
    }

    if (!address.postalCode.trim()) {
      nextErrors.postalCode = `${postalCodeLabel(address.country)} is required.`
    } else if (isIndia(address.country) && !isValidIndiaPin(address.postalCode)) {
      nextErrors.postalCode = 'Enter a valid 6-digit PIN code.'
    }

    if (!address.phone.trim()) {
      nextErrors.phone = `${phoneFieldLabel(address.country)} is required.`
    } else if (isIndia(address.country) && !isValidIndiaMobile(address.phone)) {
      nextErrors.phone = 'Enter a valid 10-digit Indian mobile number.'
    }

    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const runCartValidation = async () => {
    const result = await validateCheckoutCart({
      items: cartItemsPayload,
      couponCode,
      shippingMethodId: shippingMethod,
    })
    if (!result.ok) {
      setError(result.message)
      toast.error(result.message)
      setServerTotals(null)
      return null
    }
    setServerTotals({
      subtotal: result.subtotal,
      discount: result.discount,
      shipping: result.shipping,
      tax: result.tax,
      total: result.total,
      taxImplemented: result.taxImplemented,
    })
    if (result.couponCode) {
      setCouponCode(result.couponCode)
      try {
        window.localStorage.setItem(COUPON_CODE_STORAGE_KEY, result.couponCode)
      } catch {
        // ignore
      }
    }
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
        phone: address.phone,
      }) as Partial<Address>,
    [address],
  )

  const clearCheckoutSession = useCallback(() => {
    clearCheckoutDraft()
    try {
      window.localStorage.removeItem(COUPON_CODE_STORAGE_KEY)
    } catch {
      // ignore
    }
  }, [])

  const initiatePaymentIntent = useCallback(async () => {
    if (initiatingOnlineRef.current) return
    initiatingOnlineRef.current = true

    try {
      setError(null)

      if (!isOnlinePaymentEnabled()) {
        const message = 'Online payment is currently unavailable.'
        setError(message)
        toast.error(message)
        return
      }

      if (!stripePublishableConfigured) {
        const message =
          'Online payment is not configured. Set a valid NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY (pk_test_…) and STRIPE_SECRET_KEY (sk_test_…) in your environment.'
        setError(message)
        toast.error(message)
        return
      }

      const valid = await runCartValidation()
      if (!valid) return

      const payment = (await initiatePayment('stripe', {
        additionalData: {
          ...(email ? { customerEmail: email } : {}),
          billingAddress: shippingAddressPayload,
          shippingAddress: shippingAddressPayload,
          couponCode: couponCode || undefined,
          shippingMethodId: shippingMethod,
        },
      })) as Record<string, unknown>

      if (payment?.totals && typeof payment.totals === 'object') {
        const totals = payment.totals as ServerTotals & { total: number }
        setServerTotals({
          subtotal: totals.subtotal,
          discount: totals.discount,
          shipping: totals.shipping,
          tax: totals.tax,
          total: totals.total,
          taxImplemented: Boolean(totals.taxImplemented),
        })
      }

      if (payment?.['clientSecret']) {
        setPaymentData(payment)
      } else {
        const message = 'Payment initialization failed. Please try again.'
        setError(message)
        toast.error(message)
      }
    } catch (err) {
      const errorData =
        err instanceof Error
          ? (() => {
              try {
                return JSON.parse(err.message)
              } catch {
                return { message: err.message }
              }
            })()
          : {}
      let errorMessage = 'Payment initialization failed.'
      if (typeof errorData?.message === 'string' && errorData.message) {
        errorMessage = errorData.message
      }
      if (errorData?.cause?.code === 'OutOfStock') {
        errorMessage = 'One or more items in your cart are out of stock.'
      }
      // Surface config / invalid-key issues clearly (do not claim payment succeeded).
      if (
        typeof errorMessage === 'string' &&
        (/invalid api key/i.test(errorMessage) ||
          /sk_test_$/i.test(errorMessage) ||
          /not configured/i.test(errorMessage))
      ) {
        errorMessage =
          'Online payment is not configured. Set a valid STRIPE_SECRET_KEY and NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY in your environment.'
      }
      setError(errorMessage)
      toast.error(errorMessage)
      setPaymentData(null)
    } finally {
      initiatingOnlineRef.current = false
    }
  }, [
    email,
    initiatePayment,
    shippingAddressPayload,
    couponCode,
    shippingMethod,
    stripePublishableConfigured,
    cartItemsPayload,
  ])

  const continueToPayment = () => {
    startTransition(async () => {
      const valid = await runCartValidation()
      if (!valid) return
      setPaymentData(null)
      setPaymentMethod(null)
      if (!codIdempotencyKeyRef.current) {
        codIdempotencyKeyRef.current = crypto.randomUUID()
      }
      setStep('payment')
      window.scrollTo({ top: 0, behavior: 'smooth' })
    })
  }

  const selectPaymentMethod = (method: CheckoutPaymentMethod) => {
    if (method === 'online' && !isOnlinePaymentEnabled()) {
      return
    }

    setPaymentMethod(method)
    setError(null)
    if (method === 'cod') {
      setPaymentData(null)
      return
    }
    if (paymentData?.['clientSecret']) return
    // Online: create PaymentIntent only after the customer chooses online payment.
    startTransition(async () => {
      await initiatePaymentIntent()
    })
  }

  const handlePlaceCodOrder = () => {
    if (isPlacingCod) return
    startTransition(async () => {
      setIsPlacingCod(true)
      setError(null)
      try {
        const valid = await runCartValidation()
        if (!valid) return

        if (!codIdempotencyKeyRef.current) {
          codIdempotencyKeyRef.current = crypto.randomUUID()
        }

        const result = await placeCodOrder({
          items: cartItemsPayload,
          couponCode,
          shippingMethodId: shippingMethod,
          customerEmail: email,
          shippingAddress: {
            firstName: address.firstName,
            lastName: address.lastName,
            addressLine1: address.addressLine1,
            addressLine2: address.addressLine2,
            city: address.city,
            state: address.state,
            postalCode: address.postalCode,
            country: address.country,
            phone: address.phone,
          },
          idempotencyKey: codIdempotencyKeyRef.current,
          cartId: cart?.id ?? null,
        })

        if (!result.ok) {
          setError(result.message)
          toast.error(result.message)
          return
        }

        clearCart()
        clearCheckoutSession()
        setProcessingPayment(true)

        const queryParams = new URLSearchParams()
        if (email) queryParams.set('email', email)
        if (result.accessToken) queryParams.set('accessToken', result.accessToken)
        const qs = queryParams.toString()
        router.push(`/orders/${result.orderID}${qs ? `?${qs}` : ''}`)
      } catch {
        const message = 'Unable to place your COD order. Please try again.'
        setError(message)
        toast.error(message)
      } finally {
        setIsPlacingCod(false)
      }
    })
  }

  const chromeProps = {
    subtotal: serverTotals?.subtotal,
    discountAmount: serverTotals?.discount || 0,
    shippingAmount: serverTotals?.shipping,
    taxAmount: serverTotals?.tax || 0,
    total: serverTotals?.total,
    shippingMethodId: shippingMethod,
    taxImplemented: serverTotals?.taxImplemented || false,
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
        <CheckoutChrome {...chromeProps} />
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
      <CheckoutChrome {...chromeProps} />

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
                label="Email"
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
                            country: (saved.country as CountryCode) || DEFAULT_COUNTRY,
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
                    country: event.target.value as CountryCode,
                    state: '',
                    postalCode: '',
                  }))
                }
                options={CHECKOUT_COUNTRY_OPTIONS}
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
                label={isIndia(address.country) ? 'Apartment, suite, landmark' : 'Apartment, suite, etc.'}
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
                {stateOptions ? (
                  <CheckoutSelect
                    id="state"
                    label={stateFieldLabel(address.country)}
                    value={address.state}
                    onChange={(event) =>
                      setAddress((prev) => ({ ...prev, state: event.target.value }))
                    }
                    options={stateOptions}
                    placeholder={stateFieldLabel(address.country)}
                    error={errors.state}
                  />
                ) : (
                  <CheckoutInput
                    id="state"
                    label={stateFieldLabel(address.country)}
                    optional={!isStateRequired(address.country)}
                    value={address.state}
                    onChange={(event) =>
                      setAddress((prev) => ({ ...prev, state: event.target.value }))
                    }
                    error={errors.state}
                  />
                )}
                <CheckoutInput
                  id="postalCode"
                  label={postalCodeLabel(address.country)}
                  autoComplete="postal-code"
                  inputMode={isIndia(address.country) ? 'numeric' : undefined}
                  value={address.postalCode}
                  onChange={(event) =>
                    setAddress((prev) => ({ ...prev, postalCode: event.target.value }))
                  }
                  error={errors.postalCode}
                  required
                />
              </div>

              <CheckoutInput
                id="phone"
                label={phoneFieldLabel(address.country)}
                type="tel"
                autoComplete="tel"
                inputMode="tel"
                value={address.phone}
                onChange={(event) => setAddress((prev) => ({ ...prev, phone: event.target.value }))}
                error={errors.phone}
                required
              />
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
                  {address.phone ? <p className="mt-1 text-sm">{address.phone}</p> : null}
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
                    {getCountryLabel(address.country)}
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

              {(Object.keys(SHIPPING_CONFIG.methods) as ShippingMethodId[]).map((methodId) => {
                const method = SHIPPING_CONFIG.methods[methodId]
                const display = getShippingDisplay(
                  Math.max(
                    0,
                    (serverTotals?.subtotal || 0) - (serverTotals?.discount || 0),
                  ),
                  methodId,
                )
                return (
                  <label
                    key={methodId}
                    className={cn(
                      'flex cursor-pointer items-center justify-between gap-4 rounded-md border px-4 py-4',
                      shippingMethod === methodId
                        ? 'border-[var(--elixir-on-surface,#1c1b1b)] bg-white'
                        : 'border-[var(--elixir-outline-variant,#c1c8c7)] bg-white',
                    )}
                  >
                    <span className="flex items-center gap-3 text-sm">
                      <input
                        type="radio"
                        name="shippingMethod"
                        checked={shippingMethod === methodId}
                        onChange={() => setShippingMethod(methodId)}
                        className="accent-[var(--elixir-primary-container,#0d2b2b)]"
                      />
                      {method.label}
                    </span>
                    <span className="text-sm font-medium">
                      {display.amount === 0 ? (
                        'Free'
                      ) : (
                        <Price amount={display.amount} as="span" />
                      )}
                    </span>
                  </label>
                )
              })}
            </section>

            <button
              type="button"
              disabled={isPending}
              onClick={continueToPayment}
              className="flex min-h-12 w-full items-center justify-center bg-[var(--elixir-primary,#001515)] text-xs font-semibold uppercase tracking-[0.12em] text-white transition hover:bg-[#164a4a] disabled:opacity-60"
            >
              {isPending ? 'Validating…' : 'Continue to payment'}
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
                {address.phone ? (
                  <>
                    <br />
                    {address.phone}
                  </>
                ) : null}
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
                {SHIPPING_CONFIG.methods[shippingMethod].label}
                {serverTotals ? (
                  <>
                    {' · '}
                    {serverTotals.shipping === 0 ? (
                      'Free'
                    ) : (
                      <Price amount={serverTotals.shipping} as="span" />
                    )}
                  </>
                ) : null}
              </p>
            </section>

            <section className="flex flex-col gap-4">
              <h2 className="font-[family-name:var(--font-newsreader)] text-2xl font-medium">
                Payment method
              </h2>

              {paymentMethods.map((method) => {
                const isDisabled = !method.available
                const isSelected = paymentMethod === method.id && !isDisabled

                return (
                  <label
                    key={method.id}
                    className={cn(
                      'flex flex-col gap-1 rounded-md border px-4 py-4',
                      isDisabled
                        ? 'cursor-not-allowed border-[var(--elixir-outline-variant,#c1c8c7)] bg-[var(--elixir-surface-container-low,#f6f3f2)] opacity-70'
                        : 'cursor-pointer bg-white',
                      isSelected
                        ? 'border-[var(--elixir-on-surface,#1c1b1b)]'
                        : !isDisabled && 'border-[var(--elixir-outline-variant,#c1c8c7)]',
                    )}
                    aria-disabled={isDisabled || undefined}
                  >
                    <span className="flex items-center gap-3 text-sm font-medium">
                      <input
                        type="radio"
                        name="paymentMethod"
                        checked={isSelected}
                        disabled={isDisabled}
                        onChange={() => {
                          if (!isDisabled) selectPaymentMethod(method.id)
                        }}
                        className="accent-[var(--elixir-primary-container,#0d2b2b)] disabled:cursor-not-allowed"
                      />
                      <span className="flex flex-wrap items-center gap-2">
                        {isDisabled && method.unavailableTitle
                          ? method.unavailableTitle
                          : method.label}
                        {isDisabled ? (
                          <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--elixir-outline,#717878)]">
                            Coming Soon
                          </span>
                        ) : null}
                      </span>
                    </span>
                    <span className="pl-7 text-sm text-[var(--elixir-on-surface-variant,#414848)]">
                      {isDisabled
                        ? method.unavailableDescription || method.description
                        : method.description}
                    </span>
                  </label>
                )
              })}
            </section>

            {paymentMethod === 'cod' ? (
              <div className="flex flex-col gap-4">
                <p className="text-sm text-[var(--elixir-on-surface-variant,#414848)]">
                  You will pay when your order is delivered.
                  {serverTotals ? (
                    <>
                      {' '}
                      Amount due on delivery:{' '}
                      <span className="font-medium text-[var(--elixir-on-surface,#1c1b1b)]">
                        {formatInrFromPaise(serverTotals.total)}
                      </span>
                    </>
                  ) : null}
                </p>
                <button
                  type="button"
                  disabled={isPending || isPlacingCod}
                  onClick={handlePlaceCodOrder}
                  className="flex min-h-12 w-full items-center justify-center bg-[var(--elixir-primary,#001515)] text-xs font-semibold uppercase tracking-[0.12em] text-white transition hover:bg-[#164a4a] disabled:opacity-60"
                >
                  {isPlacingCod || isPending ? 'Placing order…' : 'Place order'}
                </button>
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
            ) : null}

            {paymentMethod === 'online' && onlinePaymentEnabled ? (
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
                        submitLabel={
                          serverTotals
                            ? `Pay ${formatInrFromPaise(serverTotals.total)}`
                            : 'Pay now'
                        }
                        onPaymentSuccess={clearCheckoutSession}
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
                      {isPending
                        ? 'Preparing secure payment…'
                        : error || 'Payment could not be started.'}
                    </p>
                    {!isPending ? (
                      <button
                        type="button"
                        onClick={() => {
                          startTransition(async () => {
                            await initiatePaymentIntent()
                          })
                        }}
                        className="inline-flex min-h-12 items-center justify-center bg-[var(--elixir-primary,#001515)] px-6 text-xs font-semibold uppercase tracking-[0.12em] text-white"
                      >
                        Try again
                      </button>
                    ) : null}
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
                )}
              </Suspense>
            ) : null}

            {!paymentMethod ? (
              <button
                type="button"
                className="self-start text-sm underline underline-offset-4"
                onClick={() => setStep('shipping')}
              >
                Return to shipping
              </button>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  )
}
