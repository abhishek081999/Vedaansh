'use client'
// ─────────────────────────────────────────────────────────────
//  src/hooks/useTodayReading.ts
//  Loads live planet positions + the day's panchang for a location,
//  then runs the pure Today's Reading engine against the natal chart.
//  Refreshes every 10 minutes while the tab is visible (Moon moves
//  ~0.5° per hour, hora / choghadiya windows roll over).
// ─────────────────────────────────────────────────────────────

import { useCallback, useEffect, useRef, useState } from 'react'
import type { ChartOutput } from '@/types/astrology'
import {
  buildTodayReading,
  type TodayPanchangInput,
  type TodayReading,
  type TodayTransitGraha,
} from '@/lib/engine/todayReading'
import { buildTodayPredictions, type TodayPredictions } from '@/lib/engine/todayPredictions'
import { buildTodayAdvanced, type TodayAdvanced } from '@/lib/engine/todayAdvanced'
import { buildTodayDasha, type TodayDasha } from '@/lib/engine/todayDasha'

export interface TodayLocation {
  lat: number
  lng: number
  tz: string
  name: string
}

export interface TodayReadingState {
  reading: TodayReading | null
  /** House-by-house predictions (null when the chart lacks the data). */
  predictions: TodayPredictions | null
  /** Kakshya, Sudarshana and the personalised hora timeline. */
  advanced: TodayAdvanced | null
  /** Running dasha zoomed to today (all levels, finer periods, changes, lord transits). */
  dasha: TodayDasha | null
  /** Live sidereal positions used for the reading (for chart overlays). */
  transit: TodayTransitGraha[]
  loading: boolean
  error: string | null
  asOf: Date | null
  refresh: () => void
}

const REFRESH_MS = 10 * 60 * 1000

/** Calendar date (YYYY-MM-DD) of `d` in an IANA timezone. */
export function localDateIn(d: Date, tz: string): string {
  try {
    return new Intl.DateTimeFormat('en-CA', { timeZone: tz }).format(d)
  } catch {
    return d.toISOString().slice(0, 10)
  }
}

function previousDay(dateStr: string): string {
  const d = new Date(`${dateStr}T12:00:00Z`)
  d.setUTCDate(d.getUTCDate() - 1)
  return d.toISOString().slice(0, 10)
}

async function getJson<T>(url: string): Promise<T> {
  const res = await fetch(url)
  const json = await res.json().catch(() => null)
  if (!res.ok || !json?.success) {
    throw new Error(json?.error || `Request failed (${res.status})`)
  }
  return json as T
}

export function useTodayReading(chart: ChartOutput | null, location: TodayLocation): TodayReadingState {
  const [reading, setReading] = useState<TodayReading | null>(null)
  const [predictions, setPredictions] = useState<TodayPredictions | null>(null)
  const [advanced, setAdvanced] = useState<TodayAdvanced | null>(null)
  const [dasha, setDasha] = useState<TodayDasha | null>(null)
  const [transit, setTransit] = useState<TodayTransitGraha[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [asOf, setAsOf] = useState<Date | null>(null)
  const requestId = useRef(0)

  const { lat, lng, tz } = location
  const ayanamsha = chart?.meta.settings.ayanamsha ?? 'lahiri'
  const nodeMode = chart?.meta.settings.nodeMode ?? 'true'

  const load = useCallback(async () => {
    if (!chart) return
    const id = ++requestId.current
    setLoading(true)
    setError(null)
    try {
      const now = new Date()
      const date = localDateIn(now, tz)

      const planetsUrl = `/api/transits/planets?${new URLSearchParams({
        date, at: now.toISOString(), ayanamsha, node: nodeMode,
      })}`
      const panchangUrl = (d: string) => `/api/panchang?${new URLSearchParams({
        date: d, lat: String(lat), lng: String(lng), tz, ayanamsha,
      })}`

      const [planets, pan] = await Promise.all([
        getJson<{ grahas: TodayTransitGraha[] }>(planetsUrl),
        getJson<{ data: TodayPanchangInput }>(panchangUrl(date)),
      ])

      // The Vedic day (vara, hora, choghadiya) turns over at sunrise, not midnight.
      let panchang = pan.data
      if (now.getTime() < Date.parse(panchang.sunrise)) {
        panchang = (await getJson<{ data: TodayPanchangInput }>(panchangUrl(previousDay(date)))).data
      }

      const built = buildTodayReading({ natal: chart, transit: planets.grahas, panchang, now })
      if (id !== requestId.current) return
      if (!built) throw new Error('Could not build today\'s reading from this chart.')
      setReading(built)
      setPredictions(buildTodayPredictions({ natal: chart, transit: planets.grahas, reading: built, now }))
      setAdvanced(buildTodayAdvanced({ natal: chart, transit: planets.grahas, panchang, reading: built, now }))
      const dayStart = Date.parse(panchang.sunrise)
      setDasha(buildTodayDasha({
        natal: chart,
        reading: built,
        now,
        windowStart: Number.isFinite(dayStart) ? new Date(dayStart) : now,
        windowEnd: Number.isFinite(dayStart) ? new Date(dayStart + 24 * 3_600_000) : undefined,
      }))
      setTransit(planets.grahas)
      setAsOf(now)
    } catch (e) {
      if (id !== requestId.current) return
      setError(e instanceof Error ? e.message : 'Could not load today\'s reading.')
    } finally {
      if (id === requestId.current) setLoading(false)
    }
  }, [chart, lat, lng, tz, ayanamsha, nodeMode])

  /** Drops any in-flight response (unmount, or chart / location changed). */
  const invalidate = useCallback(() => { requestId.current += 1 }, [])

  useEffect(() => {
    void load()
    const timer = setInterval(() => {
      if (document.visibilityState === 'visible') void load()
    }, REFRESH_MS)
    return () => {
      clearInterval(timer)
      invalidate()
    }
  }, [load, invalidate])

  return { reading, predictions, advanced, dasha, transit, loading, error, asOf, refresh: () => { void load() } }
}
