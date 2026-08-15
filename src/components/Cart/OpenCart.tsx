import { Button } from '@/components/ui/button'
import clsx from 'clsx'
import { ShoppingBag } from 'lucide-react'
import React from 'react'

export const OpenCartButton = React.forwardRef<
  HTMLButtonElement,
  {
    className?: string
    quantity?: number
    variant?: 'icon' | 'text'
  } & React.ComponentPropsWithoutRef<'button'>
>(function OpenCartButton({ className, quantity, variant = 'icon', ...rest }, ref) {
  if (variant === 'text') {
    return (
      <Button
        ref={ref}
        variant="nav"
        size="clear"
        className={clsx('navLink relative items-end hover:cursor-pointer', className)}
        {...rest}
      >
        <span>Cart</span>
        {quantity ? (
          <>
            <span>•</span>
            <span>{quantity}</span>
          </>
        ) : null}
      </Button>
    )
  }

  return (
    <button
      ref={ref}
      type="button"
      aria-label={quantity ? `Open cart, ${quantity} items` : 'Open cart'}
      className={clsx(
        'relative flex h-12 w-12 items-center justify-center text-[var(--elixir-on-surface,#1c1b1b)] transition hover:opacity-70',
        className,
      )}
      {...rest}
    >
      <ShoppingBag className="h-5 w-5" strokeWidth={1.5} />
      {quantity ? (
        <span className="absolute right-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#ba1a1a] px-1 text-[10px] font-semibold leading-none text-white">
          {quantity > 99 ? '99+' : quantity}
        </span>
      ) : null}
    </button>
  )
})
