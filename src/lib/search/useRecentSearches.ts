'use client'

import { useCallback, useEffect, useState } from 'react'

import {
  RECENT_SEARCHES_KEY,
  RECENT_SEARCHES_LIMIT,
  sanitizeSearchQuery,
} from '@/lib/search/constants'

function readRecent(): string[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(RECENT_SEARCHES_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.map(String).map(sanitizeSearchQuery).filter(Boolean).slice(0, RECENT_SEARCHES_LIMIT)
  } catch {
    return []
  }
}

function writeRecent(items: string[]) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(items))
}

export function useRecentSearches() {
  const [recent, setRecent] = useState<string[]>([])
  const [ready, setReady] = useState(false)

  useEffect(() => {
    setRecent(readRecent())
    setReady(true)
  }, [])

  const addSearch = useCallback((query: string) => {
    const nextQuery = sanitizeSearchQuery(query)
    if (!nextQuery) return

    setRecent((prev) => {
      const next = [nextQuery, ...prev.filter((item) => item.toLowerCase() !== nextQuery.toLowerCase())].slice(
        0,
        RECENT_SEARCHES_LIMIT,
      )
      writeRecent(next)
      return next
    })
  }, [])

  const clearAll = useCallback(() => {
    writeRecent([])
    setRecent([])
  }, [])

  return { recent, ready, addSearch, clearAll }
}
