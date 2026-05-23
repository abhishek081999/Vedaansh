'use client'
import React, { createContext, useContext, useState, useCallback, useEffect, Dispatch, SetStateAction } from 'react'
import type { ChartOutput } from '@/types/astrology'
import { hydrateSpecialLagnas } from '@/lib/engine/astroDetailsDerived'
import { hydrateCharaDashas } from '@/lib/engine/dasha/hydrateChara'

function withHydratedChart(chart: ChartOutput | null): ChartOutput | null {
  if (!chart?.grahas?.length) return chart
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
}

const ChartContext = createContext<ChartContextType | undefined>(undefined)

export function ChartProvider({ children }: { children: React.ReactNode }) {
  const [chart, setChartState] = useState<ChartOutput | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [pendingDestination, setPendingDestination] = useState<string | null>(null)

  const setChart: Dispatch<SetStateAction<ChartOutput | null>> = useCallback((action) => {
    setChartState(prev => withHydratedChart(typeof action === 'function' ? action(prev) : action))
  }, [])

  // Backfill Chara dashas on charts already in memory (e.g. before chara_fe existed)
  useEffect(() => {
    setChartState(prev => withHydratedChart(prev))
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
