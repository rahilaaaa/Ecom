'use client'

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'

import { useAuth } from '@/providers/Auth'

const STORAGE_KEY = 'elixir-wishlist'

type WishlistContextValue = {
  ids: string[]
  isReady: boolean
  isWishlisted: (productId: string) => boolean
  toggleWishlist: (productId: string) => Promise<void>
}

const WishlistContext = createContext<WishlistContextValue | null>(null)

function readLocalIds(): string[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed.map(String) : []
  } catch {
    return []
  }
}

function writeLocalIds(ids: string[]) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(ids))
}

function normalizeWishlist(wishlist: unknown): string[] {
  if (!Array.isArray(wishlist)) return []
  return wishlist
    .map((item) => {
      if (typeof item === 'string' || typeof item === 'number') return String(item)
      if (item && typeof item === 'object' && 'id' in item) return String((item as { id: string }).id)
      return null
    })
    .filter((id): id is string => Boolean(id))
}

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const [ids, setIds] = useState<string[]>([])
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    const localIds = readLocalIds()

    if (!user?.id) {
      setIds(localIds)
      setIsReady(true)
      return
    }

    const serverIds = normalizeWishlist(user.wishlist)
    const merged = Array.from(new Set([...serverIds, ...localIds]))
    setIds(merged)
    writeLocalIds(merged)
    setIsReady(true)

    if (merged.length !== serverIds.length || merged.some((id) => !serverIds.includes(id))) {
      void fetch(`/api/users/${user.id}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wishlist: merged }),
      }).catch(() => {
        // Local wishlist remains the source of truth if sync fails.
      })
    }
  }, [user?.id, user?.wishlist])

  const persist = useCallback(
    async (nextIds: string[]) => {
      setIds(nextIds)
      writeLocalIds(nextIds)

      if (!user?.id) return

      try {
        await fetch(`/api/users/${user.id}`, {
          method: 'PATCH',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ wishlist: nextIds }),
        })
      } catch {
        // Keep local state even if remote sync fails.
      }
    },
    [user?.id],
  )

  const isWishlisted = useCallback((productId: string) => ids.includes(String(productId)), [ids])

  const toggleWishlist = useCallback(
    async (productId: string) => {
      const id = String(productId)
      const next = ids.includes(id) ? ids.filter((item) => item !== id) : [...ids, id]
      await persist(next)
    },
    [ids, persist],
  )

  const value = useMemo(
    () => ({
      ids,
      isReady,
      isWishlisted,
      toggleWishlist,
    }),
    [ids, isReady, isWishlisted, toggleWishlist],
  )

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>
}

export function useWishlist() {
  const context = useContext(WishlistContext)
  if (!context) {
    throw new Error('useWishlist must be used within WishlistProvider')
  }
  return context
}
