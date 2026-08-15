'use client'

import React from 'react'

import { cn } from '@/utilities/cn'

type FieldProps = {
  id: string
  label: string
  error?: string
  className?: string
  children: React.ReactNode
  optional?: boolean
}

export function CheckoutField({ id, label, error, className, children, optional }: FieldProps) {
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <label
        htmlFor={id}
        className="font-[family-name:var(--font-inter)] text-xs text-[var(--elixir-outline,#717878)]"
      >
        {label}
        {optional ? ' (optional)' : null}
      </label>
      {children}
      {error ? (
        <p role="alert" className="text-xs text-[#ba1a1a]">
          {error}
        </p>
      ) : null}
    </div>
  )
}

const controlClass =
  'min-h-12 w-full rounded-md border border-[var(--elixir-outline-variant,#c1c8c7)] bg-white px-3 text-sm text-[var(--elixir-on-surface,#1c1b1b)] outline-none transition placeholder:text-[var(--elixir-outline,#717878)] focus:border-[var(--elixir-primary-container,#0d2b2b)] focus:shadow-[0_0_0_2px_rgba(13,43,43,0.12)] disabled:cursor-not-allowed disabled:opacity-60'

export const checkoutControlClass = controlClass

type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label: string
  error?: string
  optional?: boolean
}

export function CheckoutInput({
  id,
  label,
  error,
  optional,
  className,
  ...props
}: InputProps) {
  const inputId = id || props.name || label
  return (
    <CheckoutField id={inputId} label={label} error={error} optional={optional} className={className}>
      <input id={inputId} className={controlClass} {...props} />
    </CheckoutField>
  )
}

type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement> & {
  label: string
  error?: string
  optional?: boolean
  options: { label: string; value: string }[]
  placeholder?: string
}

export function CheckoutSelect({
  id,
  label,
  error,
  optional,
  options,
  placeholder,
  className,
  ...props
}: SelectProps) {
  const selectId = id || props.name || label
  return (
    <CheckoutField id={selectId} label={label} error={error} optional={optional} className={className}>
      <select id={selectId} className={controlClass} {...props}>
        {placeholder ? (
          <option value="" disabled>
            {placeholder}
          </option>
        ) : null}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </CheckoutField>
  )
}
