'use client'

import React, { useState, useTransition } from 'react'

import { subscribeNewsletter } from '@/lib/home/subscribeNewsletter'
import { cn } from '@/utilities/cn'

type Props = {
  heading: string
  description: string
  formId?: string | null
}

export function InnerCircleNewsletter({ heading, description, formId }: Props) {
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState<string | null>(null)
  const [isError, setIsError] = useState(false)
  const [isPending, startTransition] = useTransition()

  const onSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    setMessage(null)
    setIsError(false)

    startTransition(async () => {
      const result = await subscribeNewsletter({ email, formId })
      setIsError(!result.ok)
      setMessage(result.message)
      if (result.ok) setEmail('')
    })
  }

  return (
    <section className="bg-[var(--elixir-primary-container,#0d2b2b)] px-5 py-16 text-white md:px-6 md:py-24 lg:px-8">
      <div className="mx-auto w-full max-w-xl">
        <h2 className="font-[family-name:var(--font-newsreader)] text-3xl font-medium md:text-4xl">
          {heading}
        </h2>
        <p className="mt-4 max-w-md font-[family-name:var(--font-inter)] text-sm leading-relaxed text-white/80 md:text-base">
          {description}
        </p>

        <form onSubmit={onSubmit} className="mt-10 flex flex-col gap-6" noValidate>
          <label className="flex flex-col gap-2">
            <span className="sr-only">Email Address</span>
            <input
              type="email"
              name="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="Email Address"
              disabled={isPending}
              className="min-h-12 border-0 border-b border-white/50 bg-transparent px-0 pb-3 font-[family-name:var(--font-inter)] text-sm text-white outline-none placeholder:text-white/55 focus:border-white disabled:opacity-60"
            />
          </label>

          <button
            type="submit"
            disabled={isPending}
            className={cn(
              'min-h-12 w-full bg-white text-xs font-semibold uppercase tracking-[0.14em] text-[var(--elixir-on-surface,#1c1b1b)] transition hover:bg-[var(--elixir-surface-container-low,#f6f3f2)] disabled:cursor-not-allowed disabled:opacity-70',
            )}
          >
            {isPending ? 'Subscribing…' : 'Subscribe'}
          </button>

          {message ? (
            <p
              role={isError ? 'alert' : 'status'}
              className={cn('text-sm', isError ? 'text-[#ffb4ab]' : 'text-white/85')}
            >
              {message}
            </p>
          ) : null}
        </form>
      </div>
    </section>
  )
}
