'use client'
// ─────────────────────────────────────────────────────────────
//  src/components/ui/patterns/ChartContextBar.tsx
//  Sticky birth context strip — name, datetime, place, ascendant
// ─────────────────────────────────────────────────────────────

import React from 'react'
import type { ChartOutput, Rashi } from '@/types/astrology'
import { RASHI_NAMES } from '@/types/astrology'
import { formatTagLabel } from '@/lib/chart/tags'
import { cn } from '@/lib/ui/cn'

export interface ChartContextBarProps {
  chart: ChartOutput
  tags?: string[]
  isMobile?: boolean
  /** CSS length for right padding when mobile action icons overlay the strip */
  mobileReserveRight?: string
  actions?: React.ReactNode
  className?: string
}

function formatBirthDateTime(birthDate: string, birthTime: string): string {
  const [y, mm, dd] = birthDate.split('-')
  const [h, min] = birthTime.split(':').map(Number)
  const ampm = h >= 12 ? 'pm' : 'am'
  return `${dd} ${mm} ${y} · ${h % 12 || 12}:${String(min).padStart(2, '0')} ${ampm}`
}

export function ChartContextBar({
  chart,
  tags = [],
  isMobile = false,
  mobileReserveRight,
  actions,
  className,
}: ChartContextBarProps) {
  const ascRashi = chart.lagnas.ascRashi as Rashi

  return (
    <div
      className={cn('chart-context-bar chart-name-strip', className)}
      style={isMobile && mobileReserveRight ? { paddingRight: mobileReserveRight } : undefined}
    >
      <span className="name-primary">{chart.meta.name}</span>
      <span className="name-sep hide-mobile">·</span>
      <span className="name-detail hide-mobile">
        {formatBirthDateTime(chart.meta.birthDate, chart.meta.birthTime)}
      </span>
      <span className="name-sep hide-mobile">·</span>
      <span
        className="name-detail hide-mobile"
        style={{ maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
      >
        {chart.meta.birthPlace}
      </span>
      <span className="name-sep hide-mobile">·</span>
      <span className="name-asc hide-mobile">
        {RASHI_NAMES[ascRashi]} {chart.lagnas.ascDegreeInRashi.toFixed(1)}°
      </span>
      {tags.length > 0 && (
        <span
          className="chart-context-tags"
          style={{
            flexBasis: '100%',
            display: 'flex',
            gap: '0.35rem',
            flexWrap: 'wrap',
            alignItems: 'center',
            marginTop: isMobile ? '0.1rem' : '-0.1rem',
          }}
        >
          {tags.map(t => (
            <span
              key={t}
              className="badge"
              style={{
                fontSize: '0.62rem',
                padding: '0.1rem 0.45rem',
                background: 'rgba(201,168,76,0.06)',
                color: 'var(--gold)',
                border: '1px solid rgba(201,168,76,0.12)',
              }}
            >
              {formatTagLabel(t)}
            </span>
          ))}
        </span>
      )}
      {actions}
    </div>
  )
}
