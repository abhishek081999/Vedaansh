'use client'

import React from 'react'
import { createPortal } from 'react-dom'
import type { LucideIcon } from 'lucide-react'
import { Sparkles, Info, Clock, Moon, Zap, Star } from 'lucide-react'

export type MobileDashTab = 'astro' | 'planetary' | 'dashas' | 'today' | 'panchang' | 'strengths' | 'yogas'
export type MobileStrengthSubTab = 'ashtakavarga' | 'shadbala' | 'bhava' | 'vimsopaka'

const MAIN_TABS: { id: MobileDashTab; icon: LucideIcon; label: string }[] = [
  { id: 'planetary', icon: Sparkles, label: 'Planets' },
  { id: 'astro', icon: Info, label: 'Details' },
  { id: 'dashas', icon: Clock, label: 'Dasha' },
  { id: 'today', icon: Moon, label: 'Today' },
  { id: 'strengths', icon: Zap, label: 'Strength' },
  { id: 'yogas', icon: Star, label: 'Yogas' },
]

export interface MobileDashboardNavProps {
  showMainNav: boolean
  showStrengthSubNav: boolean
  strengthSubNavStacked: boolean
  mobileDashTab: MobileDashTab
  activeStrengthSubTab: MobileStrengthSubTab
  strengthTabs: { id: MobileStrengthSubTab; icon: LucideIcon; label: string }[]
  onDashTabChange: (tab: MobileDashTab) => void
  onStrengthSubTabChange: (tab: MobileStrengthSubTab) => void
}

export function MobileDashboardNav({
  showMainNav,
  showStrengthSubNav,
  strengthSubNavStacked,
  mobileDashTab,
  activeStrengthSubTab,
  strengthTabs,
  onDashTabChange,
  onStrengthSubTabChange,
}: MobileDashboardNavProps) {
  if (typeof document === 'undefined') return null

  return (
    <>
      {showStrengthSubNav &&
        createPortal(
          <nav
            aria-label="Strength analytics sections"
            style={{
              position: 'fixed',
              bottom: strengthSubNavStacked ? 'calc(3.75rem + env(safe-area-inset-bottom, 0px))' : 0,
              left: 0,
              right: 0,
              zIndex: 9998,
              background: 'var(--surface-1)',
              borderTop: '1px solid var(--border-soft)',
              display: 'flex',
              alignItems: 'stretch',
              boxShadow: '0 -4px 20px rgba(0,0,0,0.18)',
              paddingBottom: strengthSubNavStacked ? '0.35rem' : 'max(env(safe-area-inset-bottom), 0.5rem)',
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
            }}
          >
            {strengthTabs.map(({ id, icon: Icon, label }) => {
              const active = activeStrengthSubTab === id
              return (
                <button
                  key={id}
                  type="button"
                  aria-current={active ? 'page' : undefined}
                  aria-label={label}
                  onClick={() => onStrengthSubTabChange(id)}
                  style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.2rem',
                    padding: '0.55rem 0.08rem 0.35rem',
                    border: 'none',
                    background: 'none',
                    cursor: 'pointer',
                    color: active ? 'var(--accent)' : 'var(--text-muted)',
                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                    position: 'relative',
                    minWidth: 0,
                  }}
                >
                  {active && (
                    <div
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: '20%',
                        right: '20%',
                        height: 2,
                        background: 'var(--accent)',
                        boxShadow: '0 0 10px var(--accent)',
                        borderRadius: '0 0 2px 2px',
                      }}
                    />
                  )}
                  <Icon size={16} strokeWidth={active ? 2.5 : 2} style={{ opacity: active ? 1 : 0.7 }} />
                  <span
                    style={{
                      fontSize: '0.5rem',
                      fontWeight: active ? 700 : 500,
                      letterSpacing: '0.02em',
                      whiteSpace: 'nowrap',
                      marginTop: '0.1rem',
                    }}
                  >
                    {label}
                  </span>
                </button>
              )
            })}
          </nav>,
          document.body,
        )}

      {showMainNav &&
        createPortal(
          <nav
            aria-label="Dashboard sections"
            style={{
              position: 'fixed',
              bottom: 0,
              left: 0,
              right: 0,
              zIndex: 9999,
              background: 'var(--surface-1)',
              borderTop: '1px solid var(--border-soft)',
              display: 'flex',
              alignItems: 'stretch',
              boxShadow: '0 -4px 20px rgba(0,0,0,0.18)',
              paddingBottom: 'max(env(safe-area-inset-bottom), 0.5rem)',
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
            }}
          >
            {MAIN_TABS.map(({ id, icon: Icon, label }) => {
              const active = mobileDashTab === id
              return (
                <button
                  key={id}
                  type="button"
                  aria-current={active ? 'page' : undefined}
                  aria-label={label}
                  onClick={() => {
                    onDashTabChange(id)
                    window.scrollTo({ top: 0, behavior: 'smooth' })
                  }}
                  style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.2rem',
                    padding: '0.6rem 0.15rem 0.4rem',
                    border: 'none',
                    background: 'none',
                    cursor: 'pointer',
                    color: active ? 'var(--accent)' : 'var(--text-muted)',
                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                    position: 'relative',
                  }}
                >
                  {active && (
                    <div
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: '20%',
                        right: '20%',
                        height: 2,
                        background: 'var(--accent)',
                        boxShadow: '0 0 10px var(--accent)',
                        borderRadius: '0 0 2px 2px',
                      }}
                    />
                  )}
                  <Icon size={18} strokeWidth={active ? 2.5 : 2} style={{ opacity: active ? 1 : 0.7 }} />
                  <span
                    style={{
                      fontSize: '0.58rem',
                      fontWeight: active ? 700 : 500,
                      letterSpacing: '0.02em',
                      whiteSpace: 'nowrap',
                      marginTop: '0.1rem',
                    }}
                  >
                    {label}
                  </span>
                </button>
              )
            })}
          </nav>,
          document.body,
        )}
    </>
  )
}
