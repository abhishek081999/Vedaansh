'use client'
// ─────────────────────────────────────────────────────────────
//  Pin a second chart (transit or saved partner) beside natal
// ─────────────────────────────────────────────────────────────

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { ChartOutput } from '@/types/astrology'
import { zonedDateTime } from '@/lib/chart/zonedNow'

export type WorkspacePinKind = 'transit' | 'partner'

export type WorkspacePin = {
  kind: WorkspacePinKind
  chart: ChartOutput
  /** Partner name; null for transit or an unnamed chart (UI supplies a translated label). */
  name: string | null
  /** When the pin was calculated (ISO). For transit this is the moment shown. */
  asOf: string
}

/** Error kinds — the UI maps these to translated copy. */
export type WorkspacePinError = 'transit' | 'partner'

export type SavedChartBirth = {
  name: string
  birthDate: string
  birthTime: string
  birthPlace: string
  latitude: number
  longitude: number
  timezone: string
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
  const [error, setError] = useState<WorkspacePinError | null>(null)
  const [pickerOpen, setPickerOpen] = useState(false)
  const key = natalKey(natal)
  /** Bumped on every request and natal change so late responses are dropped. */
  const requestId = useRef(0)

  useEffect(() => {
    requestId.current += 1
    setPin(null)
    setError(null)
    setLoading(false)
    setPickerOpen(false)
  }, [key])

  const clear = useCallback(() => {
    requestId.current += 1
    setPin(null)
    setError(null)
    setLoading(false)
    setPickerOpen(false)
  }, [])

  const run = useCallback(async (
    kind: WorkspacePinKind,
    body: Record<string, unknown>,
    name: string | null,
  ) => {
    const id = ++requestId.current
    setLoading(true)
    setError(null)
    setPickerOpen(false)
    try {
      const chart = await calculateChart(body)
      if (id !== requestId.current) return
      setPin({ kind, chart, name, asOf: new Date().toISOString() })
    } catch {
      if (id !== requestId.current) return
      setError(kind)
      setPin(null)
    } finally {
      if (id === requestId.current) setLoading(false)
    }
  }, [])

  const pinTransit = useCallback(async () => {
    if (!natal) return
    const now = zonedDateTime(natal.meta.timezone)
    await run('transit', {
      name: 'Transit',
      birthDate: now.date,
      birthTime: now.time,
      birthPlace: natal.meta.birthPlace,
      latitude: natal.meta.latitude,
      longitude: natal.meta.longitude,
      timezone: natal.meta.timezone,
      settings: natal.meta.settings,
    }, null)
  }, [natal, run])

  const pinPartner = useCallback(async (saved: SavedChartBirth) => {
    await run('partner', {
      name: saved.name,
      birthDate: saved.birthDate,
      birthTime: saved.birthTime,
      birthPlace: saved.birthPlace,
      latitude: saved.latitude,
      longitude: saved.longitude,
      timezone: saved.timezone,
      settings: natal?.meta.settings,
    }, saved.name?.trim() || null)
  }, [natal?.meta.settings, run])

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
