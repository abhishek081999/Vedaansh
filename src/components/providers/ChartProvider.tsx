'use client'
import React, { createContext, useContext, useState, useCallback, useEffect, useRef, Dispatch, SetStateAction } from 'react'
import type { ChartOutput } from '@/types/astrology'

function hasCompleteClientHydration(chart: ChartOutput): boolean {
  const d = chart.dashas
  const hasDashas = !!(d?.chara?.length && d?.chara_fe?.length && d?.mandook?.length && d?.sthir?.length)
  const hasLagnas = Number.isFinite(chart.lagnas?.induLagna) && Number.isFinite(chart.lagnas?.bhriguBindu)
  return hasDashas && hasLagnas
}

async function hydrateChartAsync(chart: ChartOutput): Promise<ChartOutput> {
  if (!chart.grahas?.length) return chart
  const [{ hydrateSpecialLagnas }, { hydrateCharaDashas }] = await Promise.all([
    import('@/lib/engine/astroDetailsDerived'),
    import('@/lib/engine/dasha/hydrateChara'),
  ])
  let next = chart
  if (chart.lagnas) {
    const lagnas = hydrateSpecialLagnas(chart.lagnas, chart.grahas)
    if (lagnas !== chart.lagnas) next = { ...next, lagnas }
  }
  return hydrateCharaDashas(next)
}

interface ChartContextType {
  chart: ChartOutput | null
  setChart: Dispatch<SetStateAction<ChartOutput | null>>
  isFormOpen: boolean
  setIsFormOpen: Dispatch<SetStateAction<boolean>>
  pendingDestination: string | null
  setPendingDestination: Dispatch<SetStateAction<string | null>>
  /**
   * When true, home BirthForm must not auto-submit from leftover URL birth params
   * (brand/logo → landing). Cleared once the URL is clean again.
   */
  skipUrlHydration: boolean
  setSkipUrlHydration: (skip: boolean) => void
  /** Clear chart/form and block URL re-hydration so the landing page can show. */
  clearToLanding: () => void
}

const ChartContext = createContext<ChartContextType | undefined>(undefined)

export function ChartProvider({ children }: { children: React.ReactNode }) {
  const [chart, setChartState] = useState<ChartOutput | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [pendingDestination, setPendingDestination] = useState<string | null>(null)
  const [skipUrlHydration, setSkipUrlHydration] = useState(false)
  const hydrateGen = useRef(0)

  const setChart: Dispatch<SetStateAction<ChartOutput | null>> = useCallback((action) => {
    setChartState(prev => {
      const next = typeof action === 'function' ? action(prev) : action
      if (!next?.grahas?.length) return next

      // Fresh API charts already include dashas + special lagnas — paint immediately.
      if (hasCompleteClientHydration(next)) return next

      const gen = ++hydrateGen.current
      void hydrateChartAsync(next).then((hydrated) => {
        if (gen !== hydrateGen.current) return
        setChartState(hydrated)
      })
      return next
    })
  }, [])

  const clearToLanding = useCallback(() => {
    setSkipUrlHydration(true)
    setPendingDestination(null)
    setIsFormOpen(false)
    setChartState(null)
    hydrateGen.current += 1 // cancel in-flight client hydration
  }, [])

  // Backfill legacy in-memory charts once (lazy engine import — not on every route's critical path)
  useEffect(() => {
    setChartState(prev => {
      if (!prev?.grahas?.length || hasCompleteClientHydration(prev)) return prev
      const gen = ++hydrateGen.current
      void hydrateChartAsync(prev).then((hydrated) => {
        if (gen !== hydrateGen.current) return
        setChartState(hydrated)
      })
      return prev
    })
  }, [])

  return (
    <ChartContext.Provider
      value={{
        chart,
        setChart,
        isFormOpen,
        setIsFormOpen,
        pendingDestination,
        setPendingDestination,
        skipUrlHydration,
        setSkipUrlHydration,
        clearToLanding,
      }}
    >
      {children}
    </ChartContext.Provider>
  )
}

export function useChart() {
  const context = useContext(ChartContext)
  if (!context) throw new Error('useChart must be used within ChartProvider')
  return context
}
