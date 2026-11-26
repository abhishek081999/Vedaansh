'use client'
// ─────────────────────────────────────────────────────────────
//  Pin comparison charts beside natal: a transit (any moment,
//  birthplace or current location) and a saved partner chart.
//  Both can be pinned at once. Pins survive a reload via
//  sessionStorage and identical calculations are cached.
// ─────────────────────────────────────────────────────────────

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { ChartOutput } from '@/types/astrology'
import { zonedDateTime } from '@/lib/chart/zonedNow'

export type WorkspacePinKind = 'transit' | 'partner'

/** Where a transit is cast. `natal` = the chart's birthplace. */
export type TransitPlace =
  | { kind: 'natal' }
  | { kind: 'here'; latitude: number; longitude: number; timezone: string }

export type TransitPin = {
  kind: 'transit'
  chart: ChartOutput
  /** The moment shown (ISO instant). */
  at: string
  place: TransitPlace
}

export type PartnerPin = {
  kind: 'partner'
  chart: ChartOutput
  /** Partner name; null for an unnamed chart (UI supplies a translated label). */
  name: string | null
  saved: SavedChartBirth
}

export type WorkspacePin = TransitPin | PartnerPin

/** Error kinds — the UI maps these to translated copy. */
export type WorkspacePinError = 'transit' | 'partner' | 'location'

export type TransitStep = 'hour' | 'day' | 'month' | 'year'

export type SavedChartBirth = {
  name: string
  birthDate: string
  birthTime: string
  birthPlace: string
  latitude: number
  longitude: number
  timezone: string
}

type StoredPins = {
  transit: { at: string; live: boolean; place: TransitPlace } | null
  partner: SavedChartBirth | null
}

const STORAGE_PREFIX = 'vedaansh-workspace-pin:'
const CACHE_LIMIT = 24

function natalKey(chart: ChartOutput | null): string | null {
  if (!chart) return null
  const m = chart.meta
  return `${m.name}|${m.birthDate}|${m.birthTime}|${m.latitude}|${m.longitude}|${m.timezone}`
}

// ── Calculation cache (shared across mounts) ──────────────────
const cache = new Map<string, Promise<ChartOutput>>()

function calculateChart(body: Record<string, unknown>): Promise<ChartOutput> {
  const key = JSON.stringify(body)
  const hit = cache.get(key)
  if (hit) {
    // Refresh recency.
    cache.delete(key)
    cache.set(key, hit)
    return hit
  }
  const p = (async () => {
    const res = await fetch('/api/chart/calculate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const json = await res.json()
    if (!json.success) throw new Error(json.error || 'Calculate failed')
    return json.data as ChartOutput
  })()
  cache.set(key, p)
  p.catch(() => cache.delete(key))
  while (cache.size > CACHE_LIMIT) {
    const oldest = cache.keys().next().value
    if (oldest === undefined) break
    cache.delete(oldest)
  }
  return p
}

/** Exposed for tests. */
export function clearWorkspacePinCache() {
  cache.clear()
}

export function stepInstant(at: Date, step: TransitStep, dir: 1 | -1): Date {
  const d = new Date(at.getTime())
  if (step === 'hour') d.setTime(d.getTime() + dir * 3_600_000)
  else if (step === 'day') d.setTime(d.getTime() + dir * 86_400_000)
  else if (step === 'month') d.setUTCMonth(d.getUTCMonth() + dir)
  else d.setUTCFullYear(d.getUTCFullYear() + dir)
  return d
}

function readStored(key: string): StoredPins | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_PREFIX + key)
    return raw ? (JSON.parse(raw) as StoredPins) : null
  } catch {
    return null
  }
}

function writeStored(key: string, value: StoredPins) {
  try {
    if (!value.transit && !value.partner) sessionStorage.removeItem(STORAGE_PREFIX + key)
    else sessionStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(value))
  } catch { /* storage unavailable */ }
}

function currentPosition(): Promise<{ latitude: number; longitude: number }> {
  return new Promise((resolve, reject) => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      reject(new Error('Geolocation unavailable'))
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
      reject,
      { maximumAge: 10 * 60_000, timeout: 15_000 },
    )
  })
}

export function useWorkspacePin(natal: ChartOutput | null) {
  const [transit, setTransit] = useState<TransitPin | null>(null)
  /** True while the transit follows "now" (refresh keeps it current). */
  const [transitLive, setTransitLive] = useState(true)
  const [partner, setPartner] = useState<PartnerPin | null>(null)
  const [transitLoading, setTransitLoading] = useState(false)
  const [partnerLoading, setPartnerLoading] = useState(false)
  const [error, setError] = useState<WorkspacePinError | null>(null)
  const [pickerOpen, setPickerOpen] = useState(false)
  const key = natalKey(natal)
  /** Bumped per request (and natal change) so late responses are dropped. */
  const transitReq = useRef(0)
  const partnerReq = useRef(0)
  /** Mirrors of state for callbacks that must not re-create on every pin. */
  const transitRef = useRef<TransitPin | null>(null)
  useEffect(() => { transitRef.current = transit }, [transit])
  /** Skip persisting until the stored pins for this natal have been restored. */
  const restoredKey = useRef<string | null>(null)
  /** The persist effect's first run after a restore sees pre-restore state. */
  const skipPersist = useRef(false)

  const runTransit = useCallback(async (at: Date, place: TransitPlace, live: boolean) => {
    if (!natal) return
    const id = ++transitReq.current
    setTransitLoading(true)
    setError(null)
    setPickerOpen(false)
    const tz = place.kind === 'here' ? place.timezone : natal.meta.timezone
    const wall = zonedDateTime(tz, at)
    try {
      const chart = await calculateChart({
        name: 'Transit',
        birthDate: wall.date,
        birthTime: wall.time,
        birthPlace: place.kind === 'here' ? 'Current location' : natal.meta.birthPlace,
        latitude: place.kind === 'here' ? place.latitude : natal.meta.latitude,
        longitude: place.kind === 'here' ? place.longitude : natal.meta.longitude,
        timezone: tz,
        settings: natal.meta.settings,
      })
      if (id !== transitReq.current) return
      setTransit({ kind: 'transit', chart, at: at.toISOString(), place })
      setTransitLive(live)
    } catch {
      if (id !== transitReq.current) return
      setError('transit')
    } finally {
      if (id === transitReq.current) setTransitLoading(false)
    }
  }, [natal])

  const runPartner = useCallback(async (saved: SavedChartBirth) => {
    const id = ++partnerReq.current
    setPartnerLoading(true)
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
      if (id !== partnerReq.current) return
      setPartner({ kind: 'partner', chart, name: saved.name?.trim() || null, saved })
    } catch {
      if (id !== partnerReq.current) return
      setError('partner')
    } finally {
      if (id === partnerReq.current) setPartnerLoading(false)
    }
  }, [natal?.meta.settings])

  // New natal chart: drop pins, then restore any saved for this chart.
  // `runTransit` / `runPartner` change with `natal`, which tracks `key`.
  useEffect(() => {
    transitReq.current += 1
    partnerReq.current += 1
    setTransit(null)
    setPartner(null)
    setTransitLive(true)
    setError(null)
    setTransitLoading(false)
    setPartnerLoading(false)
    setPickerOpen(false)
    restoredKey.current = null
    if (!key) return
    const stored = readStored(key)
    restoredKey.current = key
    skipPersist.current = true
    if (stored?.transit) {
      const at = stored.transit.live ? new Date() : new Date(stored.transit.at)
      void runTransit(at, stored.transit.place, stored.transit.live)
    }
    if (stored?.partner) void runPartner(stored.partner)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- restore once per natal chart
  }, [key])

  // Persist.
  useEffect(() => {
    if (!key || restoredKey.current !== key) return
    if (skipPersist.current) {
      skipPersist.current = false
      return
    }
    // Don't wipe storage while a restore is still calculating.
    if (transitLoading || partnerLoading) return
    writeStored(key, {
      transit: transit ? { at: transit.at, live: transitLive, place: transit.place } : null,
      partner: partner ? partner.saved : null,
    })
  }, [key, transit, transitLive, partner, transitLoading, partnerLoading])

  /** Pin (or refresh) the transit for now, keeping the current place. */
  const pinTransit = useCallback(async () => {
    await runTransit(new Date(), transitRef.current?.place ?? { kind: 'natal' }, true)
  }, [runTransit])

  /** Pin the transit at a specific instant. */
  const pinTransitAt = useCallback(async (at: Date) => {
    await runTransit(at, transitRef.current?.place ?? { kind: 'natal' }, false)
  }, [runTransit])

  const stepTransit = useCallback(async (step: TransitStep, dir: 1 | -1) => {
    const cur = transitRef.current
    const from = cur ? new Date(cur.at) : new Date()
    await runTransit(stepInstant(from, step, dir), cur?.place ?? { kind: 'natal' }, false)
  }, [runTransit])

  const setTransitPlace = useCallback(async (kind: TransitPlace['kind']) => {
    const cur = transitRef.current
    const at = cur && !transitLive ? new Date(cur.at) : new Date()
    if (kind === 'natal') {
      await runTransit(at, { kind: 'natal' }, transitLive)
      return
    }
    setTransitLoading(true)
    try {
      const pos = await currentPosition()
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
      await runTransit(at, { kind: 'here', ...pos, timezone }, transitLive)
    } catch {
      setTransitLoading(false)
      setError('location')
    }
  }, [runTransit, transitLive])

  const pinPartner = useCallback(async (saved: SavedChartBirth) => {
    await runPartner(saved)
  }, [runPartner])

  const clearTransit = useCallback(() => {
    transitReq.current += 1
    setTransit(null)
    setTransitLive(true)
    setTransitLoading(false)
    setError((e) => (e === 'transit' || e === 'location' ? null : e))
  }, [])

  const clearPartner = useCallback(() => {
    partnerReq.current += 1
    setPartner(null)
    setPartnerLoading(false)
    setError((e) => (e === 'partner' ? null : e))
  }, [])

  const clear = useCallback(() => {
    clearTransit()
    clearPartner()
    setPickerOpen(false)
  }, [clearTransit, clearPartner])

  const comparisonGrahas = useMemo(() => partner?.chart.grahas, [partner])
  const pinTransitGrahas = useMemo(() => transit?.chart.grahas, [transit])

  return {
    transit,
    transitLive,
    partner,
    transitLoading,
    partnerLoading,
    loading: transitLoading || partnerLoading,
    error,
    pickerOpen,
    setPickerOpen,
    pinTransit,
    pinTransitAt,
    stepTransit,
    setTransitPlace,
    pinPartner,
    clearTransit,
    clearPartner,
    clear,
    comparisonGrahas,
    pinTransitGrahas,
  }
}
