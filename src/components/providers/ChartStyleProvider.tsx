'use client'
// ─────────────────────────────────────────────────────────────
//  src/components/providers/ChartStyleProvider.tsx
//  Global chart-style store — one style applies to every chart.
//  Persists to localStorage (instant, cross-page) and, for signed-in
//  users, syncs to the `defaultChartStyle` DB preference.
// ─────────────────────────────────────────────────────────────

import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react'
import { useSession } from 'next-auth/react'
import type { ChartStyle } from '@/types/astrology'

const STORAGE_KEY = 'jyotish-chart-style'
const VALID_STYLES: ChartStyle[] = ['north', 'south', 'sarvatobhadra', 'circle']
const DEFAULT_STYLE: ChartStyle = 'north'

function isValidStyle(v: unknown): v is ChartStyle {
  return typeof v === 'string' && VALID_STYLES.includes(v as ChartStyle)
}

interface ChartStyleContextType {
  chartStyle: ChartStyle
  setChartStyle: (style: ChartStyle) => void
}

const ChartStyleContext = createContext<ChartStyleContextType | undefined>(undefined)

export function ChartStyleProvider({ children }: { children: React.ReactNode }) {
  const { status } = useSession()
  // Start from a stable default on both server and first client render to
  // avoid hydration mismatch; localStorage / DB value is applied after mount.
  const [chartStyle, setChartStyleState] = useState<ChartStyle>(DEFAULT_STYLE)
  // Tracks whether the user has an explicit stored choice (localStorage).
  const hasLocalChoice = useRef(false)

  // 1. Hydrate from localStorage on mount.
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (isValidStyle(saved)) {
        hasLocalChoice.current = true
        setChartStyleState(saved)
      }
    } catch {
      /* ignore storage errors */
    }
  }, [])

  // 2. For signed-in users with no local choice yet, seed from DB preference.
  useEffect(() => {
    if (status !== 'authenticated') return
    if (hasLocalChoice.current) return
    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch('/api/user/me')
        if (!res.ok) return
        const data = await res.json()
        const pref = data?.user?.preferences?.defaultChartStyle
        if (!cancelled && !hasLocalChoice.current && isValidStyle(pref)) {
          setChartStyleState(pref)
        }
      } catch {
        /* ignore */
      }
    })()
    return () => { cancelled = true }
  }, [status])

  const setChartStyle = useCallback((style: ChartStyle) => {
    if (!isValidStyle(style)) return
    hasLocalChoice.current = true
    setChartStyleState(style)
    try {
      localStorage.setItem(STORAGE_KEY, style)
    } catch {
      /* ignore */
    }
    // Best-effort DB sync for signed-in users (keeps /account in sync).
    if (status === 'authenticated') {
      fetch('/api/user/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ defaultChartStyle: style }),
      }).catch(() => { /* ignore */ })
    }
  }, [status])

  return (
    <ChartStyleContext.Provider value={{ chartStyle, setChartStyle }}>
      {children}
    </ChartStyleContext.Provider>
  )
}

/** Returns the global chart-style store, or null when used outside the provider. */
export function useChartStyleOptional(): ChartStyleContextType | null {
  return useContext(ChartStyleContext) ?? null
}

/** Returns the global chart-style store. Throws when used outside the provider. */
export function useChartStyle(): ChartStyleContextType {
  const ctx = useContext(ChartStyleContext)
  if (!ctx) throw new Error('useChartStyle must be used within ChartStyleProvider')
  return ctx
}
