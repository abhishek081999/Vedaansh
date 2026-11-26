'use client'
// ─────────────────────────────────────────────────────────────
//  src/lib/ui/shortcutPrefs.ts
//  Viewer preference: single-key workspace shortcuts on / off.
//  WCAG 2.1.4 requires a way to turn character-key shortcuts off
//  (speech-input users can trigger them by accident).
//  Stored per browser; all subscribers update together.
// ─────────────────────────────────────────────────────────────

import { useCallback, useSyncExternalStore } from 'react'

const KEY = 'vedaansh-shortcuts'
const EVENT = 'vedaansh-shortcuts-change'

export function readShortcutsEnabled(): boolean {
  try {
    return localStorage.getItem(KEY) !== 'off'
  } catch {
    return true
  }
}

export function writeShortcutsEnabled(on: boolean) {
  try {
    if (on) localStorage.removeItem(KEY)
    else localStorage.setItem(KEY, 'off')
  } catch { /* storage unavailable: applies to this page only */ }
  window.dispatchEvent(new Event(EVENT))
}

function subscribe(cb: () => void) {
  const onStorage = (e: StorageEvent) => { if (e.key === KEY) cb() }
  window.addEventListener(EVENT, cb)
  window.addEventListener('storage', onStorage)
  return () => {
    window.removeEventListener(EVENT, cb)
    window.removeEventListener('storage', onStorage)
  }
}

/** [enabled, setEnabled]. Server render assumes on. */
export function useShortcutsEnabled(): [boolean, (on: boolean) => void] {
  const on = useSyncExternalStore(subscribe, readShortcutsEnabled, () => true)
  const set = useCallback((next: boolean) => writeShortcutsEnabled(next), [])
  return [on, set]
}
