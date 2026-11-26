'use client'
import React, { createContext, useCallback, useContext, useEffect, useState, Dispatch, SetStateAction } from 'react'
import { BREAKPOINTS } from '@/lib/ui/breakpoints'
import type { GrahaId } from '@/types/astrology'
import type { ChartTabId } from '@/lib/ui/chartTabRegistry'

export type WorkspaceFocus =
  | { type: 'house'; house: number }
  | { type: 'planet'; planet: GrahaId }
  | null

interface AppLayoutContextType {
  isSidenavOpen: boolean
  setIsSidenavOpen: Dispatch<SetStateAction<boolean>>
  /** A chart tab id, or a sidenav id used to highlight another route (e.g. 'jaimini'). */
  activeTab: string
  setActiveTab: Dispatch<SetStateAction<string>>
  /** Cross-panel focus (house / planet) set when navigating from another panel. */
  workspaceFocus: WorkspaceFocus
  clearWorkspaceFocus: () => void
  /** Switch workspace tab and optionally carry focus for the target panel. */
  openWorkspace: (tab: ChartTabId, focus?: WorkspaceFocus) => void
}

const AppLayoutContext = createContext<AppLayoutContextType | undefined>(undefined)

export function AppLayoutProvider({ children }: { children: React.ReactNode }) {
  const [isSidenavOpen, setIsSidenavOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('dashboard')
  const [workspaceFocus, setWorkspaceFocus] = useState<WorkspaceFocus>(null)

  useEffect(() => {
    if (window.innerWidth < BREAKPOINTS.lg) {
      setIsSidenavOpen(false)
    }
    // Retired setting: Sanskrit names were never switchable from the UI.
    try { localStorage.removeItem('vedaansh-lang') } catch { /* storage unavailable */ }
  }, [])

  const clearWorkspaceFocus = useCallback(() => setWorkspaceFocus(null), [])

  const openWorkspace = useCallback((tab: ChartTabId, focus?: WorkspaceFocus) => {
    setWorkspaceFocus(focus ?? null)
    setActiveTab(tab)
    if (typeof window !== 'undefined' && window.innerWidth < BREAKPOINTS.lg) {
      setIsSidenavOpen(false)
    }
  }, [])

  return (
    <AppLayoutContext.Provider
      value={{
        isSidenavOpen,
        setIsSidenavOpen,
        activeTab,
        setActiveTab,
        workspaceFocus,
        clearWorkspaceFocus,
        openWorkspace,
      }}
    >
      {children}
    </AppLayoutContext.Provider>
  )
}

export function useAppLayout() {
  const context = useContext(AppLayoutContext)
  if (!context) throw new Error('useAppLayout must be used within AppLayoutProvider')
  return context
}
