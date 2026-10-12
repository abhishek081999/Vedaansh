// src/lib/milan/milanHistory.ts
// Browser-local saved Kundali Milan sessions (CRM-lite for compare page).

export interface SavedMilanEntry {
  id: string
  savedAt: string
  boyName: string
  girlName: string
  total: number
  poruthamMatched?: number
  manglikLabel?: string
  eligibility?: string
  notes?: string
  /** Minimal birth fingerprints for reload hint */
  boyBirth?: string
  girlBirth?: string
}

const KEY = 'vedaansh-milan-history'
const MAX = 40

export function loadMilanHistory(): SavedMilanEntry[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as SavedMilanEntry[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function saveMilanHistoryEntry(entry: Omit<SavedMilanEntry, 'id' | 'savedAt'>): SavedMilanEntry[] {
  const next: SavedMilanEntry = {
    ...entry,
    id: `milan-${Date.now()}`,
    savedAt: new Date().toISOString(),
  }
  const list = [next, ...loadMilanHistory()].slice(0, MAX)
  try {
    localStorage.setItem(KEY, JSON.stringify(list))
  } catch { /* quota / private mode */ }
  return list
}

export function deleteMilanHistoryEntry(id: string): SavedMilanEntry[] {
  const list = loadMilanHistory().filter(e => e.id !== id)
  try {
    localStorage.setItem(KEY, JSON.stringify(list))
  } catch { /* ignore */ }
  return list
}
