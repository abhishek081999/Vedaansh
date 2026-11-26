'use client'
// ─────────────────────────────────────────────────────────────
//  src/components/home/useTabUrlSync.ts
//  Keeps the workspace tab in `?tab=` so reloads, shared links
//  and the back button land on the same tab.
//
//  Uses window.history (which Next's router picks up) instead of
//  router.push, so changing tabs never suspends HomeContent.
//  HomeClient builds its own search params without `tab`, so a
//  tab change does not re-run its chart-loading effects.
// ─────────────────────────────────────────────────────────────

import { useEffect, useRef } from 'react'
import { isChartTabId, type ChartTabId } from '@/lib/ui/chartTabRegistry'

const PARAM = 'tab'

function tabFromLocation(): ChartTabId | null {
  if (typeof window === 'undefined') return null
  const v = new URLSearchParams(window.location.search).get(PARAM)
  return isChartTabId(v) ? v : null
}

function writeTab(tab: ChartTabId, mode: 'push' | 'replace') {
  const url = new URL(window.location.href)
  const current = url.searchParams.get(PARAM) ?? 'dashboard'
  if (current === tab) return
  if (tab === 'dashboard') url.searchParams.delete(PARAM)
  else url.searchParams.set(PARAM, tab)
  const next = `${url.pathname}${url.search}${url.hash}`
  if (mode === 'push') window.history.pushState(null, '', next)
  else window.history.replaceState(null, '', next)
}

/**
 * @param activeTab  current workspace tab from the layout context
 * @param setActiveTab  layout setter
 * @param enabled  only write to the URL while a chart is on screen
 * @param searchKey  search string without `tab`; when another part of the
 *   page rewrites the query (save, new chart) the tab is put back
 */
export function useTabUrlSync(
  activeTab: string,
  setActiveTab: (tab: string) => void,
  enabled: boolean,
  searchKey: string,
) {
  /** Tab read from the URL that the context has not caught up with yet. */
  const pending = useRef<ChartTabId | null>(null)
  const lastWritten = useRef<string | null>(null)
  const current = useRef(activeTab)
  useEffect(() => { current.current = activeTab }, [activeTab])

  // URL → tab: on mount and on back / forward.
  useEffect(() => {
    const apply = () => {
      const fromUrl = tabFromLocation() ?? 'dashboard'
      lastWritten.current = fromUrl
      // Same tab (e.g. back across a chartId change): no re-render will follow,
      // so waiting on `pending` would block every later tab write.
      if (fromUrl === current.current) return
      pending.current = fromUrl
      setActiveTab(fromUrl)
    }
    const initial = tabFromLocation()
    if (initial) {
      lastWritten.current = initial
      pending.current = initial
      setActiveTab(initial)
    }
    window.addEventListener('popstate', apply)
    return () => window.removeEventListener('popstate', apply)
  }, [setActiveTab])

  // Tab → URL.
  useEffect(() => {
    if (pending.current) {
      if (activeTab !== pending.current) return
      pending.current = null
    }
    if (!enabled || !isChartTabId(activeTab)) return
    // A new tab gets its own history entry; re-asserting the same tab after
    // another query rewrite does not.
    const mode = lastWritten.current && lastWritten.current !== activeTab ? 'push' : 'replace'
    lastWritten.current = activeTab
    writeTab(activeTab, mode)
  }, [activeTab, enabled, searchKey])
}
