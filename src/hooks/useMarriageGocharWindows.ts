'use client'
// Fetches server-side Ju–Sa marriage transit windows for an ascendant.

import { useEffect, useState } from 'react'
import type { MarriageTransitKind } from '@/lib/engine/marriageGochar'

export type GocharWindowInject = { start: string; end: string; kind: MarriageTransitKind }

export function useMarriageGocharWindows(
  ascRashi: number | null | undefined,
  enabled = true,
  years = 8,
): { windows: GocharWindowInject[] | undefined; loading: boolean } {
  const [windows, setWindows] = useState<GocharWindowInject[] | undefined>(undefined)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!enabled || !ascRashi || ascRashi < 1 || ascRashi > 12) {
      setWindows(undefined)
      return
    }
    let cancelled = false
    setLoading(true)
    const q = new URLSearchParams({
      ascRashi: String(ascRashi),
      years: String(years),
    })
    fetch(`/api/marriage/gochar-windows?${q}`)
      .then(async res => {
        const json = await res.json().catch(() => null)
        if (cancelled) return
        if (res.ok && json?.success && Array.isArray(json.data?.windows)) {
          setWindows(json.data.windows as GocharWindowInject[])
        } else {
          setWindows([])
        }
      })
      .catch(() => {
        if (!cancelled) setWindows([])
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [ascRashi, enabled, years])

  return { windows, loading }
}
