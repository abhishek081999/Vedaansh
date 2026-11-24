'use client'
// ─────────────────────────────────────────────────────────────
//  src/components/home/useChartActions.ts
//  Save / update, share and add-to-CRM for the chart workspace
//  toolbar. Failures surface as `notice` instead of vanishing.
// ─────────────────────────────────────────────────────────────

import { useCallback, useEffect, useRef, useState } from 'react'
import type { ChartOutput } from '@/types/astrology'

export type ChartActionNotice =
  | { kind: 'saveLimit'; limit?: number }
  | { kind: 'saveFailed' }
  | { kind: 'shareFailed' }
  | { kind: 'crmFailed'; message?: string }
  | { kind: 'crmExisting' }

/** Query string matches BirthForm URL hydration (`name`, `birthDate`, … `tz`). */
export function buildChartShareUrl(chart: ChartOutput, hindi = false): string {
  const m = chart.meta
  const q = new URLSearchParams({
    name: m.name,
    birthDate: m.birthDate,
    birthTime: m.birthTime,
    birthPlace: m.birthPlace,
    lat: String(m.latitude),
    lng: String(m.longitude),
    tz: m.timezone,
  })
  const origin = typeof window !== 'undefined' ? window.location.origin : ''
  return `${origin}${hindi ? '/hi' : '/'}?${q.toString()}`
}

async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    try {
      const ta = document.createElement('textarea')
      ta.value = text
      ta.style.position = 'fixed'
      ta.style.left = '-9999px'
      document.body.appendChild(ta)
      ta.select()
      const ok = document.execCommand('copy')
      document.body.removeChild(ta)
      return ok
    } catch {
      return false
    }
  }
}

export interface UseChartActionsArgs {
  chart: ChartOutput | null
  chartTags: string[]
  savedChartId: string | null
  isSavedChart: boolean
  hindi: boolean
  /** Called with the new id after a first save (e.g. to put it in the URL). */
  onSavedNew?: (chartId: string) => void
}

export function useChartActions({
  chart,
  chartTags,
  savedChartId,
  isSavedChart,
  hindi,
  onSavedNew,
}: UseChartActionsArgs) {
  const [saving, setSaving] = useState(false)
  const [saveDone, setSaveDone] = useState(false)
  const [shareCopied, setShareCopied] = useState(false)
  const [crmSaving, setCrmSaving] = useState(false)
  const [crmDone, setCrmDone] = useState(false)
  const [notice, setNotice] = useState<ChartActionNotice | null>(null)
  const timers = useRef<number[]>([])

  useEffect(() => () => timers.current.forEach((id) => window.clearTimeout(id)), [])
  const later = (fn: () => void, ms: number) => {
    timers.current.push(window.setTimeout(fn, ms))
  }

  // A different chart starts with a clean slate.
  const chartKey = chart ? `${chart.meta.name}|${chart.meta.birthDate}|${chart.meta.birthTime}` : ''
  useEffect(() => {
    setNotice(null)
    setCrmDone(false)
  }, [chartKey])

  const dismissNotice = useCallback(() => setNotice(null), [])

  async function handleSave(type: 'regular' | 'personal' = 'regular'): Promise<string | null> {
    if (!chart || saving) return savedChartId
    setSaving(true)
    setNotice(null)
    const payload = {
      name:       chart.meta.name,
      birthDate:  chart.meta.birthDate,
      birthTime:  chart.meta.birthTime,
      birthPlace: chart.meta.birthPlace,
      latitude:   chart.meta.latitude,
      longitude:  chart.meta.longitude,
      timezone:   chart.meta.timezone,
      gender:     chart.meta.gender,
      settings:   chart.meta.settings,
      isPersonal: type === 'personal',
      tags:       chartTags,
    }
    try {
      const res = isSavedChart
        ? await fetch(`/api/chart/${savedChartId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          })
        : await fetch('/api/chart/save', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          })
      const json = await res.json().catch(() => ({} as Record<string, unknown>))
      if (!res.ok) {
        setNotice(
          json.limitReached
            ? { kind: 'saveLimit', limit: typeof json.limit === 'number' ? json.limit : undefined }
            : { kind: 'saveFailed' },
        )
        return null
      }
      const nextId = isSavedChart
        ? String(savedChartId)
        : (json.chartId ? String(json.chartId) : null)
      if (!isSavedChart && nextId) onSavedNew?.(nextId)
      setSaveDone(true)
      later(() => setSaveDone(false), 4000)
      return nextId
    } catch (e) {
      console.error('Save failed', e)
      setNotice({ kind: 'saveFailed' })
      return null
    } finally {
      setSaving(false)
    }
  }

  /**
   * `native`: on phones, open the OS share sheet (WhatsApp etc.) when the
   * browser supports it; everywhere else, copy the link.
   */
  async function handleShare(native = false) {
    if (!chart) return
    const url = buildChartShareUrl(chart, hindi)
    if (native && typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
      try {
        await navigator.share({ title: chart.meta.name, url })
        return
      } catch (e) {
        // User closed the sheet — nothing to do. Other errors fall back to copy.
        if (e instanceof DOMException && e.name === 'AbortError') return
      }
    }
    if (await copyText(url)) {
      setShareCopied(true)
      later(() => setShareCopied(false), 2500)
    } else {
      setNotice({ kind: 'shareFailed' })
    }
  }

  async function handleSaveToCRM() {
    if (!chart || crmSaving || crmDone) return
    setCrmSaving(true)
    setNotice(null)
    try {
      const res = await fetch('/api/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name:       chart.meta.name,
          birthDate:  chart.meta.birthDate,
          birthTime:  chart.meta.birthTime,
          birthPlace: chart.meta.birthPlace,
          latitude:   chart.meta.latitude,
          longitude:  chart.meta.longitude,
          timezone:   chart.meta.timezone,
          gender:     chart.meta.gender,
          status:     'active',
        }),
      })
      const json = await res.json().catch(() => ({} as Record<string, unknown>))
      if (res.ok && json.success) {
        // Stays "done" for this chart — adding the same client again is a no-op.
        setCrmDone(true)
        if (json.existing) setNotice({ kind: 'crmExisting' })
      } else {
        setNotice({ kind: 'crmFailed', message: typeof json.error === 'string' ? json.error : undefined })
      }
    } catch (e) {
      console.error('CRM Save failed', e)
      setNotice({ kind: 'crmFailed' })
    } finally {
      setCrmSaving(false)
    }
  }

  return {
    saving,
    saveDone,
    shareCopied,
    crmSaving,
    crmDone,
    notice,
    dismissNotice,
    handleSave,
    handleShare,
    handleSaveToCRM,
  }
}
