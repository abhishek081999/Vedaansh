// ─────────────────────────────────────────────────────────────
//  src/components/ui/viz/RadarChart.tsx
//  N-axis radar with one or more overlaid series
// ─────────────────────────────────────────────────────────────

import React from 'react'
import { polar } from './geometry'

export interface RadarSeries {
  label: string
  values: number[]
  color: string
}

export function RadarChart({
  axes,
  series,
  max,
  size = 220,
  threshold,
  ariaLabel,
}: {
  axes: string[]
  series: RadarSeries[]
  /** Value that maps to the outer ring; defaults to the largest value. */
  max?: number
  size?: number
  /** Optional per-axis reference values (e.g. required minimum), drawn dashed. */
  threshold?: number[]
  ariaLabel?: string
}) {
  const n = axes.length
  if (n < 3) return null
  const pad = 64
  const vb = size + pad * 2
  const c = vb / 2
  const r = size / 2
  const top = max ?? Math.max(1, ...series.flatMap((s) => s.values), ...(threshold ?? []))
  const step = (Math.PI * 2) / n
  const pt = (i: number, v: number) => polar(c, c, r * Math.min(1.08, Math.max(0, v / top)), i * step)
  const poly = (vals: number[]) => vals.map((v, i) => pt(i, v).map((x) => x.toFixed(1)).join(',')).join(' ')

  return (
    <svg viewBox={`0 0 ${vb} ${vb}`} width="100%" style={{ maxWidth: vb, display: 'block', margin: '0 auto' }} role="img" aria-label={ariaLabel ?? `Radar of ${axes.join(', ')}`}>
      {[0.25, 0.5, 0.75, 1].map((p) => (
        <polygon key={p} points={poly(Array(n).fill(top * p))} fill="none" stroke="var(--border)" strokeWidth={p === 1 ? 1 : 0.6} />
      ))}
      {axes.map((label, i) => {
        const [x, y] = polar(c, c, r, i * step)
        const [lx, ly] = polar(c, c, r + 10, i * step)
        const anchor = Math.abs(lx - c) < 4 ? 'middle' : lx > c ? 'start' : 'end'
        return (
          <g key={label}>
            <line x1={c} y1={c} x2={x} y2={y} stroke="var(--border-soft)" strokeWidth={0.8} />
            <text x={lx} y={ly} textAnchor={anchor} dominantBaseline="middle" fontSize={10} fill="var(--text-secondary)" fontWeight={600}>
              {label}
            </text>
          </g>
        )
      })}
      {threshold && (
        <polygon points={poly(threshold)} fill="none" stroke="var(--text-muted)" strokeWidth={1.2} strokeDasharray="4 3" />
      )}
      {series.map((s) => (
        <g key={s.label}>
          <polygon points={poly(s.values)} fill={s.color} fillOpacity={series.length > 1 ? 0.12 : 0.2} stroke={s.color} strokeWidth={1.8} strokeLinejoin="round" />
          {s.values.map((v, i) => {
            const [x, y] = pt(i, v)
            return (
              <circle key={i} cx={x} cy={y} r={2.6} fill={s.color} stroke="var(--surface-1)" strokeWidth={1}>
                <title>{`${s.label} · ${axes[i]}: ${Number.isInteger(v) ? v : v.toFixed(2)}`}</title>
              </circle>
            )
          })}
        </g>
      ))}
    </svg>
  )
}
