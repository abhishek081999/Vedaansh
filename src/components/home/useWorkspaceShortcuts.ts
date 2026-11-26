'use client'
// ─────────────────────────────────────────────────────────────
//  src/components/home/useWorkspaceShortcuts.ts
//  Single-key shortcuts for the chart workspace:
//    [ / ]  previous / next tab
//    S      save or update the chart (signed in)
//    P      pin the transit (or jump it back to now)
//  Ignored while typing, with modifier keys, when a modal is open, or
//  when the viewer turned shortcuts off (More menu → Keyboard shortcuts).
// ─────────────────────────────────────────────────────────────

import { useEffect, useRef } from 'react'
import { CHART_TAB_ORDER, type ChartTabId } from '@/lib/ui/chartTabRegistry'
import { readShortcutsEnabled } from '@/lib/ui/shortcutPrefs'

export interface WorkspaceShortcutHandlers {
  enabled: boolean
  activeTab: string
  openTab: (tab: ChartTabId) => void
  onSave?: () => void
  onPinTransit?: () => void
}

function isTypingTarget(el: EventTarget | null): boolean {
  if (!(el instanceof HTMLElement)) return false
  if (el.isContentEditable) return true
  const tag = el.tagName
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT'
}

/** A dialog the user can see. Closed drawers stay mounted but inert / aria-hidden. */
function modalOpen(): boolean {
  return Array.from(document.querySelectorAll<HTMLElement>('[aria-modal="true"]')).some(
    (el) => !el.closest('[aria-hidden="true"], [inert]') && el.getClientRects().length > 0,
  )
}

export function nextTab(current: string, dir: 1 | -1): ChartTabId {
  const i = (CHART_TAB_ORDER as readonly string[]).indexOf(current)
  if (i < 0) return CHART_TAB_ORDER[0]
  return CHART_TAB_ORDER[(i + dir + CHART_TAB_ORDER.length) % CHART_TAB_ORDER.length]
}

export function useWorkspaceShortcuts(handlers: WorkspaceShortcutHandlers) {
  // Latest handlers without re-binding the listener every render.
  const ref = useRef(handlers)
  useEffect(() => { ref.current = handlers })

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const h = ref.current
      if (!h.enabled || e.defaultPrevented || e.repeat) return
      if (!readShortcutsEnabled()) return
      if (e.ctrlKey || e.metaKey || e.altKey) return
      if (isTypingTarget(e.target)) return
      if (modalOpen()) return

      if (e.key === '[' || e.key === ']') {
        e.preventDefault()
        h.openTab(nextTab(h.activeTab, e.key === ']' ? 1 : -1))
        window.scrollTo({ top: 0, behavior: 'auto' })
        return
      }
      const k = e.key.toLowerCase()
      if (k === 's' && h.onSave) {
        e.preventDefault()
        h.onSave()
        return
      }
      if (k === 'p' && h.onPinTransit) {
        e.preventDefault()
        h.onPinTransit()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])
}
