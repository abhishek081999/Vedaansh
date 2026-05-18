'use client'
import React, { createContext, useContext, useState, useCallback, Dispatch, SetStateAction } from 'react'
import type { ChartOutput } from '@/types/astrology'
import { hydrateSpecialLagnas } from '@/lib/engine/astroDetailsDerived'

function withHydratedLagnas(chart: ChartOutput | null): ChartOutput | null {
  if (!chart?.lagnas || !chart.grahas?.length) return chart
  const lagnas = hydrateSpecialLagnas(chart.lagnas, chart.grahas)
  if (lagnas === chart.lagnas) return chart
  return { ...chart, lagnas }
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
    setChartState(prev => withHydratedLagnas(typeof action === 'function' ? action(prev) : action))
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
