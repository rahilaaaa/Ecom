'use client'

import React, { useState } from 'react'

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'

const DEFAULT_ROWS = [
  { size: 'S', chest: '34–36"', waist: '28–30"' },
  { size: 'M', chest: '38–40"', waist: '32–34"' },
  { size: 'L', chest: '42–44"', waist: '36–38"' },
  { size: 'XL', chest: '46–48"', waist: '40–42"' },
]

type Props = {
  productTitle?: string
}

export function SizeGuide({ productTitle }: Props) {
  const [open, setOpen] = useState(false)

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button
          type="button"
          className="text-xs text-[var(--elixir-on-surface,#1c1b1b)] underline underline-offset-4 transition hover:opacity-70"
        >
          Size Guide
        </button>
      </SheetTrigger>
      <SheetContent
        side="right"
        className="w-full border-[var(--elixir-outline-variant,#c1c8c7)] bg-[var(--elixir-surface,#fcf9f8)] sm:max-w-md"
      >
        <SheetHeader className="text-left">
          <SheetTitle className="font-[family-name:var(--font-newsreader)] text-2xl font-medium">
            Size Guide
          </SheetTitle>
          <SheetDescription>
            {productTitle
              ? `Measurements for ${productTitle}. Values are approximate body measurements.`
              : 'Measurements are approximate body measurements in inches.'}
          </SheetDescription>
        </SheetHeader>

        <div className="overflow-x-auto px-4 pb-8">
          <table className="w-full min-w-[280px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-[var(--elixir-surface-container-highest,#e5e2e1)] text-xs uppercase tracking-[0.1em] text-[var(--elixir-outline,#717878)]">
                <th className="py-3 pr-4 font-semibold">Size</th>
                <th className="py-3 pr-4 font-semibold">Chest</th>
                <th className="py-3 font-semibold">Waist</th>
              </tr>
            </thead>
            <tbody>
              {DEFAULT_ROWS.map((row) => (
                <tr
                  key={row.size}
                  className="border-b border-[var(--elixir-surface-container,#f0eded)] text-[var(--elixir-on-surface,#1c1b1b)]"
                >
                  <td className="py-3 pr-4 font-medium">{row.size}</td>
                  <td className="py-3 pr-4">{row.chest}</td>
                  <td className="py-3">{row.waist}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-6 text-xs leading-relaxed text-[var(--elixir-outline,#717878)]">
            Prefer a relaxed fit? Size up. For a closer silhouette, stay true to size.
          </p>
        </div>
      </SheetContent>
    </Sheet>
  )
}
