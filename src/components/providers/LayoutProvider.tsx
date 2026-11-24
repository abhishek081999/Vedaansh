'use client'
import React, { createContext, useCallback, useContext, useEffect, useState, Dispatch, SetStateAction } from 'react'
import { BREAKPOINTS } from '@/lib/ui/breakpoints'
import type { GrahaId } from '@/types/astrology'

export type WorkspaceFocus =
  | { type: 'house'; house: number }
  | { type: 'planet'; planet: GrahaId }
  | null

interface AppLayoutContextType {
  isSidenavOpen: boolean
  setIsSidenavOpen: Dispatch<SetStateAction<boolean>>
  activeTab: string
  setActiveTab: Dispatch<SetStateAction<any>>
  language: 'en' | 'sa'
  setLanguage: Dispatch<SetStateAction<'en' | 'sa'>>
  /** Cross-panel focus (house / planet) set when navigating from another panel. */
  workspaceFocus: WorkspaceFocus
  clearWorkspaceFocus: () => void
  /** Switch workspace tab and optionally carry focus for the target panel. */
  openWorkspace: (tab: string, focus?: WorkspaceFocus) => void
}

const AppLayoutContext = createContext<AppLayoutContextType | undefined>(undefined)

export function AppLayoutProvider({ children }: { children: React.ReactNode }) {
  const [isSidenavOpen, setIsSidenavOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('dashboard')
  const [language, setLanguage] = useState<'en' | 'sa'>('en')
  const [workspaceFocus, setWorkspaceFocus] = useState<WorkspaceFocus>(null)

  useEffect(() => {
    if (window.innerWidth < BREAKPOINTS.lg) {
      setIsSidenavOpen(false)
    }
    const saved = localStorage.getItem('vedaansh-lang')
    if (saved === 'en' || saved === 'sa') setLanguage(saved)
  }, [])

  useEffect(() => {
    localStorage.setItem('vedaansh-lang', language)
  }, [language])

  const clearWorkspaceFocus = useCallback(() => setWorkspaceFocus(null), [])

  const openWorkspace = useCallback((tab: string, focus?: WorkspaceFocus) => {
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
        language,
        setLanguage,
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
