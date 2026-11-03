// ─────────────────────────────────────────────────────────────
//  src/components/ui/viz/SegmentRing.tsx
//  Ring split into weighted segments, each filled by value/max
//  (Milan kootas, kalas, numerology year cycle, element balance)
// ─────────────────────────────────────────────────────────────

import React from 'react'
import { arcPath, polar } from './geometry'

export interface RingSegment {
  label: string
  /** Filled amount (0..max). */
  value: number
  /** Share of the ring this segment occupies. */
  max: number
  color: string
  /** Draw this segment emphasised (e.g. the current year). */
  active?: boolean
  /** Short tooltip / label override. */
  title?: string
}

export function SegmentRing({
  segments,
  size = 220,
  thickness = 22,
  gapDeg = 1.5,
  centerValue,
  centerLabel,
  showLabels = true,
  ariaLabel,
}: {
  segments: RingSegment[]
  size?: number
  thickness?: number
  gapDeg?: number
  centerValue?: React.ReactNode
  centerLabel?: string
  showLabels?: boolean
  ariaLabel?: string
}) {
  const total = segments.reduce((s, x) => s + Math.max(0, x.max), 0)
  if (total <= 0) return null
  const pad = showLabels ? 46 : 4
  const vb = size + pad * 2
  const c = vb / 2
  const rO = size / 2
  const rI = rO - thickness
  const gap = (gapDeg * Math.PI) / 180

  let cursor = 0
  const arcs = segments.map((s) => {
    const span = (Math.max(0, s.max) / total) * Math.PI * 2
    const a0 = cursor + gap / 2
    const a1 = cursor + span - gap / 2
    cursor += span
    const fillRatio = s.max > 0 ? Math.min(1, Math.max(0, s.value / s.max)) : 0
    return { s, a0, a1, aFill: a0 + (a1 - a0) * fillRatio, mid: (a0 + a1) / 2 }
  })

  return (
    <svg viewBox={`0 0 ${vb} ${vb}`} width="100%" style={{ maxWidth: vb, display: 'block', margin: '0 auto' }} role="img" aria-label={ariaLabel}>
      {arcs.map(({ s, a0, a1, aFill, mid }) => {
        const rOut = s.active ? rO + 4 : rO
        const [lx, ly] = polar(c, c, rO + 14, mid)
        const anchor = Math.abs(lx - c) < 6 ? 'middle' : lx > c ? 'start' : 'end'
        return (
          <g key={s.label}>
            <title>{s.title ?? `${s.label}: ${s.value} / ${s.max}`}</title>
            <path d={arcPath(c, c, rOut, rI, a0, a1)} fill={s.color} fillOpacity={0.14} stroke={s.active ? s.color : 'none'} strokeWidth={1.2} />
            {aFill > a0 && <path d={arcPath(c, c, rOut, rI, a0, aFill)} fill={s.color} fillOpacity={s.active ? 1 : 0.85} />}
            {showLabels && a1 - a0 > 0.14 && (
              <text x={lx} y={ly} textAnchor={anchor} dominantBaseline="middle" fontSize={9.5} fontWeight={s.active ? 800 : 600} fill={s.active ? 'var(--text-primary)' : 'var(--text-secondary)'}>
                {s.label}
              </text>
            )}
          </g>
        )
      })}
      {centerValue !== undefined && (
        <text x={c} y={centerLabel ? c - 4 : c} textAnchor="middle" dominantBaseline="middle" fontSize={rI * 0.42} fontWeight={700} fill="var(--text-primary)" style={{ fontFamily: 'var(--font-display)' }}>
          {centerValue}
        </text>
      )}
      {centerLabel && (
        <text x={c} y={c + rI * 0.32} textAnchor="middle" dominantBaseline="middle" fontSize={9.5} fill="var(--text-muted)" letterSpacing="0.06em">
          {centerLabel.toUpperCase()}
        </text>
      )}
    </svg>
  )
}
