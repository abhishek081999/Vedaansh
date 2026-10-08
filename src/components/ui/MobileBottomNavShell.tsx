'use client'

// ─────────────────────────────────────────────────────────────
//  src/components/ui/MobileBottomNavShell.tsx
//  Shared fixed mobile bottom tab bar + optional Dashboard link
// ─────────────────────────────────────────────────────────────

import React from 'react'
import { createPortal } from 'react-dom'
import { useRouter } from 'next/navigation'
import type { LucideIcon } from 'lucide-react'
import { LayoutDashboard } from 'lucide-react'
import { useAppLayout } from '@/components/providers/LayoutProvider'
import { ASTROLOGY_HOME_PATH } from '@/lib/ui/navConfig'

export type MobileBottomNavTab = {
  id: string
  icon: LucideIcon
  label: string
  active?: boolean
  onClick: () => void
}

export interface MobileBottomNavShellProps {
  tabs: MobileBottomNavTab[]
  /** Prepend Dashboard shortcut. Default true. */
  showDashboardLink?: boolean
  /**
   * When true (e.g. KP on home), only setActiveTab('dashboard') — no route change.
   * When false, navigate to `/` and set the dashboard tab.
   */
  dashboardSameRoute?: boolean
  ariaLabel?: string
  /** Tighter icon/label sizing for crowded bars. */
  compact?: boolean
}

export function MobileBottomNavShell({
  tabs,
  showDashboardLink = true,
  dashboardSameRoute = false,
  ariaLabel = 'Section navigation',
  compact = false,
}: MobileBottomNavShellProps) {
  const router = useRouter()
  const { setActiveTab } = useAppLayout()

  if (typeof document === 'undefined') return null

  const goDashboard = () => {
    setActiveTab('dashboard')
    if (!dashboardSameRoute) {
      router.push(ASTROLOGY_HOME_PATH)
    }
  }

  const iconSize = compact ? 16 : 18
  const labelSize = compact ? '0.5rem' : '0.58rem'
  const pad = compact ? '0.6rem 0.08rem 0.4rem' : '0.6rem 0.15rem 0.4rem'

  const renderBtn = (
    key: string,
    Icon: LucideIcon,
    label: string,
    active: boolean,
    onClick: () => void,
  ) => (
    <button
      key={key}
      type="button"
      aria-current={active ? 'page' : undefined}
      aria-label={label}
      onClick={onClick}
      style={{
        flex: '1 0 auto',
        minWidth: compact ? '2.75rem' : '3.25rem',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.2rem',
        padding: pad,
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
      <Icon size={iconSize} strokeWidth={active ? 2.5 : 2} style={{ opacity: active ? 1 : 0.7 }} />
      <span
        style={{
          fontSize: labelSize,
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

  return createPortal(
    <nav
      aria-label={ariaLabel}
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
        overflowX: 'auto',
        WebkitOverflowScrolling: 'touch',
        boxShadow: '0 -4px 20px rgba(0,0,0,0.18)',
        paddingBottom: 'max(env(safe-area-inset-bottom), 0.5rem)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
      }}
    >
      {showDashboardLink &&
        renderBtn('dashboard-home', LayoutDashboard, 'Dashboard', false, goDashboard)}
      {tabs.map(({ id, icon, label, active, onClick }) =>
        renderBtn(id, icon, label, !!active, onClick),
      )}
    </nav>,
    document.body,
  )
}
