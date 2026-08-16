'use client'

import { Search as SearchForm } from '@/components/Search'
import { cn } from '@/utilities/cn'
import { Search, X } from 'lucide-react'
import React, { useEffect, useId, useState } from 'react'

type Props = {
  className?: string
  /** Controlled open state for coordinating full-width panel in the header. */
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

/**
 * Search icon control. Opens a full-width editorial search panel in the header.
 */
export function HeaderSearchTrigger({ className, open: openProp, onOpenChange, panelId }: Props & { panelId?: string }) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false)
  const open = openProp ?? uncontrolledOpen
  const setOpen = onOpenChange ?? setUncontrolledOpen
  const generatedId = useId()
  const resolvedPanelId = panelId || generatedId

  useEffect(() => {
    if (!open) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [open, setOpen])

  return (
    <button
      type="button"
      aria-label={open ? 'Close search' : 'Open search'}
      aria-expanded={open}
      aria-controls={resolvedPanelId}
      onClick={() => setOpen(!open)}
      className={cn(
        'flex h-11 w-11 items-center justify-center text-[var(--elixir-on-surface,#1c1b1b)] outline-none transition hover:opacity-60 focus-visible:ring-1 focus-visible:ring-[var(--elixir-on-surface,#1c1b1b)]/25',
        className,
      )}
    >
      {open ? (
        <X className="h-[18px] w-[18px]" strokeWidth={1.4} aria-hidden />
      ) : (
        <Search className="h-[18px] w-[18px]" strokeWidth={1.4} aria-hidden />
      )}
    </button>
  )
}

type PanelProps = {
  open: boolean
  onClose: () => void
  panelId?: string
}

export function HeaderSearchPanel({ open, onClose, panelId }: PanelProps) {
  if (!open) return null

  return (
    <div
      id={panelId}
      className="border-t border-[var(--elixir-outline-variant,#c1c8c7)]/35 bg-[var(--elixir-surface,#fcf9f8)]"
    >
      <div className="mx-auto flex max-w-[1280px] items-center gap-4 px-5 py-4 md:px-8">
        <SuspenseSearch onClose={onClose} />
        <button
          type="button"
          onClick={onClose}
          aria-label="Close search"
          className="shrink-0 text-xs uppercase tracking-[0.14em] text-[var(--elixir-on-surface-variant,#414848)] outline-none transition hover:text-[var(--elixir-on-surface,#1c1b1b)] focus-visible:underline"
        >
          Close
        </button>
      </div>
    </div>
  )
}

function SuspenseSearch({ onClose }: { onClose: () => void }) {
  return (
    <SearchForm
      className="w-full"
      variant="editorial"
      autoFocus
      inputId="navbar-expandable-search"
      onSubmitted={onClose}
    />
  )
}
