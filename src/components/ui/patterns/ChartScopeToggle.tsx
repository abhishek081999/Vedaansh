'use client'
// ─────────────────────────────────────────────────────────────
//  src/components/ui/patterns/ChartScopeToggle.tsx
//  "Your chart" vs "All (reference)" switch for teaching catalogues
// ─────────────────────────────────────────────────────────────

import React from 'react'
import { useTranslations } from 'next-intl'

export type ChartScope = 'chart' | 'all'

export interface ChartScopeToggleProps {
  value: ChartScope
  onChange: (value: ChartScope) => void
  /** Items that apply to this kundali */
  chartCount: number
  /** Items in the full catalogue */
  totalCount: number
}

export function ChartScopeToggle({ value, onChange, chartCount, totalCount }: ChartScopeToggleProps) {
  const t = useTranslations('planetsB.common')
  const options: { id: ChartScope; label: string }[] = [
    { id: 'chart', label: t('scopeChart', { count: chartCount }) },
    { id: 'all', label: t('scopeAll', { count: totalCount }) },
  ]
  return (
    <div
      role="radiogroup"
      aria-label={t('scopeAria')}
      style={{
        display: 'inline-flex',
        gap: 3,
        padding: 3,
        alignSelf: 'flex-start',
        background: 'var(--surface-3)',
        border: '1px solid var(--border-soft)',
        borderRadius: 'var(--r-md)',
      }}
    >
      {options.map(o => {
        const active = value === o.id
        return (
          <button
            key={o.id}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(o.id)}
            style={{
              padding: '0.3rem 0.6rem',
              border: 'none',
              borderRadius: 'calc(var(--r-md) - 2px)',
              background: active ? 'var(--surface-1)' : 'transparent',
              color: active ? 'var(--text-gold)' : 'var(--text-muted)',
              fontWeight: active ? 700 : 500,
              fontSize: '0.68rem',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            {o.label}
          </button>
        )
      })}
    </div>
  )
}

export function EmptyForChart({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      padding: '0.85rem',
      border: '1px dashed var(--border-soft)',
      borderRadius: 'var(--r-md)',
      color: 'var(--text-muted)',
      fontSize: '0.74rem',
      lineHeight: 1.45,
    }}>
      {children}
    </div>
  )
}
