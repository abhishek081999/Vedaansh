'use client'
// A set of ticked ids kept in this browser, one list per chart. Used for
// the Nishaniyan signs (shared by Signs in life and Teva check) and the
// "done" ticks on the top remedies. Storage can be blocked or cleared;
// the ticks then simply don't persist.

import { useCallback, useEffect, useState } from 'react'

const PREFIX = 'vedaansh.lalKitab.'
/** Before ticks were per chart, signs shared one key across every chart. */
const LEGACY_SIGNS_KEY = 'vedaansh.lalKitab.nishaniyan'

function read(key: string): string[] {
  try {
    const raw = window.localStorage.getItem(key)
    const parsed: unknown = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === 'string') : []
  } catch {
    return []
  }
}

function write(key: string, ids: string[]) {
  try {
    if (ids.length) window.localStorage.setItem(key, JSON.stringify(ids))
    else window.localStorage.removeItem(key)
  } catch {
    // Storage blocked: ticks just won't persist.
  }
}

/** `kind` names the list ('signs', 'upayDone'); `chartKey` keeps each chart's ticks apart. */
export function useStoredIds(kind: string, chartKey: string) {
  const key = `${PREFIX}${kind}.${chartKey}`
  const [ids, setIds] = useState<string[]>([])

  useEffect(() => {
    try {
      // The old shared list can't be matched to a chart, so it is dropped.
      window.localStorage.removeItem(LEGACY_SIGNS_KEY)
    } catch {
      // ignore
    }
    setIds(read(key))
  }, [key])

  const toggle = useCallback((id: string) => {
    setIds((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
      write(key, next)
      return next
    })
  }, [key])

  const clear = useCallback(() => {
    setIds([])
    write(key, [])
  }, [key])

  return { ids, toggle, clear }
}
