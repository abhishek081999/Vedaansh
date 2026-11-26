import { afterEach, describe, expect, it, vi } from 'vitest'
import { readShortcutsEnabled, writeShortcutsEnabled } from '@/lib/ui/shortcutPrefs'

function stubStorage() {
  const store = new Map<string, string>()
  vi.stubGlobal('localStorage', {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => { store.set(k, v) },
    removeItem: (k: string) => { store.delete(k) },
  })
  const dispatchEvent = vi.fn()
  vi.stubGlobal('window', { dispatchEvent })
  return { store, dispatchEvent }
}

afterEach(() => vi.unstubAllGlobals())

describe('shortcut preference', () => {
  it('defaults to on', () => {
    stubStorage()
    expect(readShortcutsEnabled()).toBe(true)
  })

  it('turns off and back on, notifying listeners', () => {
    const { store, dispatchEvent } = stubStorage()
    writeShortcutsEnabled(false)
    expect(readShortcutsEnabled()).toBe(false)
    writeShortcutsEnabled(true)
    expect(readShortcutsEnabled()).toBe(true)
    expect(store.size).toBe(0)
    expect(dispatchEvent).toHaveBeenCalledTimes(2)
  })

  it('stays on when storage throws', () => {
    vi.stubGlobal('localStorage', { getItem: () => { throw new Error('blocked') } })
    expect(readShortcutsEnabled()).toBe(true)
  })
})
