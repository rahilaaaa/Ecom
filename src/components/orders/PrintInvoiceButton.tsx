'use client'

import React from 'react'

export function PrintInvoiceButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="inline-flex min-h-12 items-center bg-[var(--elixir-primary,#001515)] px-5 text-xs font-semibold uppercase tracking-[0.12em] text-white print:hidden"
    >
      Print / Save PDF
    </button>
  )
}
