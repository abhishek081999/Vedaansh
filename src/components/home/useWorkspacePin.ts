'use client'
// ─────────────────────────────────────────────────────────────
//  Pin a second chart (transit or saved partner) beside natal
// ─────────────────────────────────────────────────────────────

import { useCallback, useEffect, useMemo, useState } from 'react'
import type { ChartOutput } from '@/types/astrology'

export type WorkspacePinKind = 'transit' | 'partner'

export type WorkspacePin = {
  kind: WorkspacePinKind
  chart: ChartOutput
  label: string
}

export type SavedChartBirth = {
  name: string
  birthDate: string
  birthTime: string
  birthPlace: string
  latitude: number
  longitude: number
  timezone: string
}

function todayIST(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date())
}

function nowTimeIST(): string {
  const d = new Date()
  const h = String(
    d.toLocaleTimeString('en-IN', {
      timeZone: 'Asia/Kolkata',
      hour12: false,
      hour: '2-digit',
    }),
  ).padStart(2, '0')
  const m = String(d.getMinutes()).padStart(2, '0')
  return `${h}:${m}:00`
}

function natalKey(chart: ChartOutput | null): string | null {
  if (!chart) return null
  const m = chart.meta
  return `${m.name}|${m.birthDate}|${m.birthTime}|${m.latitude}|${m.longitude}|${m.timezone}`
}

async function calculateChart(body: Record<string, unknown>): Promise<ChartOutput> {
  const res = await fetch('/api/chart/calculate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const json = await res.json()
  if (!json.success) throw new Error(json.error || 'Calculate failed')
  return json.data as ChartOutput
}

export function useWorkspacePin(natal: ChartOutput | null) {
  const [pin, setPin] = useState<WorkspacePin | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pickerOpen, setPickerOpen] = useState(false)
  const key = natalKey(natal)

  useEffect(() => {
    setPin(null)
    setError(null)
    setPickerOpen(false)
  }, [key])

  const clear = useCallback(() => {
    setPin(null)
    setError(null)
    setPickerOpen(false)
  }, [])

  const pinTransit = useCallback(async () => {
    if (!natal) return
    setLoading(true)
    setError(null)
    setPickerOpen(false)
    try {
      const chart = await calculateChart({
        name: 'Transit',
        birthDate: todayIST(),
        birthTime: nowTimeIST(),
        birthPlace: natal.meta.birthPlace,
        latitude: natal.meta.latitude,
        longitude: natal.meta.longitude,
        timezone: natal.meta.timezone,
        settings: natal.meta.settings,
      })
      setPin({ kind: 'transit', chart, label: 'Transit' })
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to pin transit')
      setPin(null)
    } finally {
      setLoading(false)
    }
  }, [natal])

  const pinPartner = useCallback(async (saved: SavedChartBirth) => {
    setLoading(true)
    setError(null)
    setPickerOpen(false)
    try {
      const chart = await calculateChart({
        name: saved.name,
        birthDate: saved.birthDate,
        birthTime: saved.birthTime,
        birthPlace: saved.birthPlace,
        latitude: saved.latitude,
        longitude: saved.longitude,
        timezone: saved.timezone,
        settings: natal?.meta.settings,
      })
      setPin({
        kind: 'partner',
        chart,
        label: saved.name?.trim() || 'Partner',
      })
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to pin chart')
      setPin(null)
    } finally {
      setLoading(false)
    }
  }, [natal?.meta.settings])

  const comparisonGrahas = useMemo(
    () => (pin?.kind === 'partner' ? pin.chart.grahas : undefined),
    [pin],
  )

  const pinTransitGrahas = useMemo(
    () => (pin?.kind === 'transit' ? pin.chart.grahas : undefined),
    [pin],
  )

  return {
    pin,
    loading,
    error,
    pickerOpen,
    setPickerOpen,
    pinTransit,
    pinPartner,
    clear,
    comparisonGrahas,
    pinTransitGrahas,
  }
}
