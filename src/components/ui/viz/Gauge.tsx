// ─────────────────────────────────────────────────────────────
//  src/components/ui/viz/Gauge.tsx
//  Semicircle gauge + compact horizontal meter
// ─────────────────────────────────────────────────────────────

import React from 'react'
import { arcPath, clamp, polar, toneFor } from './geometry'

export interface GaugeZone {
  from: number
  to: number
  color: string
}

const HALF = Math.PI / 2

export function Gauge({
  value,
  min = 0,
  max,
  label,
  valueText,
  zones,
  size = 180,
}: {
  value: number
  min?: number
  max: number
  label?: string
  valueText?: string
  zones?: GaugeZone[]
  size?: number
}) {
  const w = size
  const h = size * 0.62
  const c = w / 2
  const cy = size * 0.52
  const rO = size * 0.44
  const rI = rO - 12
  const t = (v: number) => -HALF + ((clamp(v, min, max) - min) / (max - min || 1)) * Math.PI
  const ratio = (value - min) / (max - min || 1)
  const color = toneFor(ratio)
  const [nx, ny] = polar(c, cy, rI - 6, t(value))

  return (
    <svg viewBox={`0 0 ${w} ${h}`} width="100%" style={{ maxWidth: w, display: 'block', margin: '0 auto' }} role="img" aria-label={`${label ?? 'Gauge'}: ${valueText ?? value}`}>
      <path d={arcPath(c, cy, rO, rI, -HALF, HALF)} fill="var(--surface-3)" />
      {zones?.map((z, i) => (
        <path key={i} d={arcPath(c, cy, rO, rI, t(z.from), t(z.to))} fill={z.color} fillOpacity={0.28} />
      ))}
      <path d={arcPath(c, cy, rO, rI, -HALF, t(value))} fill={color} />
      <line x1={c} y1={cy} x2={nx} y2={ny} stroke="var(--text-primary)" strokeWidth={2} strokeLinecap="round" />
      <circle cx={c} cy={cy} r={4} fill="var(--text-primary)" />
      <text x={c} y={cy - rI * 0.42} textAnchor="middle" fontSize={size * 0.12} fontWeight={700} fill="var(--text-primary)" style={{ fontFamily: 'var(--font-display)' }}>
        {valueText ?? value}
      </text>
      {label && (
        <text x={c} y={h - 2} textAnchor="middle" fontSize={9.5} fill="var(--text-muted)" letterSpacing="0.06em">
          {label.toUpperCase()}
        </text>
      )}
    </svg>
  )
}

/** Thin horizontal bar with optional threshold tick. Pure HTML so it flows in table cells. */
export function Meter({
  value,
  max,
  threshold,
  color,
  height = 6,
  title,
}: {
  value: number
  max: number
  threshold?: number
  color?: string
  height?: number
  title?: string
}) {
  const pct = clamp((value / (max || 1)) * 100, 0, 100)
  const fill = color ?? toneFor(threshold ? value / threshold / 1.5 : value / (max || 1))
  return (
    <div title={title} style={{ position: 'relative', height, background: 'var(--surface-3)', borderRadius: height, overflow: 'hidden', minWidth: 40 }}>
      <div style={{ position: 'absolute', inset: 0, width: `${pct}%`, background: fill, borderRadius: height, transition: 'width 0.6s ease' }} />
      {threshold !== undefined && (
        <div style={{ position: 'absolute', top: -1, bottom: -1, left: `${clamp((threshold / (max || 1)) * 100, 0, 100)}%`, width: 2, background: 'var(--text-primary)', opacity: 0.6 }} />
      )}
    </div>
  )
}

export interface BarRow {
  key: string
  label: React.ReactNode
  value: number
  threshold?: number
  color?: string
  valueText?: string
}

/** Labelled horizontal bar list — a lightweight bar chart. */
export function BarList({ rows, max, unit }: { rows: BarRow[]; max?: number; unit?: string }) {
  const top = max ?? Math.max(1, ...rows.map((r) => Math.max(r.value, r.threshold ?? 0)))
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(64px, auto) 1fr auto', alignItems: 'center', gap: '0.45rem 0.7rem' }}>
      {rows.map((r) => (
        <React.Fragment key={r.key}>
          <span style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', fontWeight: 600, whiteSpace: 'nowrap' }}>{r.label}</span>
          <Meter value={r.value} max={top} threshold={r.threshold} color={r.color} height={8} />
          <span style={{ fontSize: '0.72rem', fontFamily: 'var(--font-mono)', color: 'var(--text-primary)', textAlign: 'right', whiteSpace: 'nowrap' }}>
            {r.valueText ?? (Number.isInteger(r.value) ? r.value : r.value.toFixed(2))}
            {unit ? ` ${unit}` : ''}
          </span>
        </React.Fragment>
      ))}
    </div>
  )
}

/** Bars that grow left (negative, rose) or right (positive, teal) from a centre line. */
export function DivergingBarList({ rows, unit }: { rows: { key: string; label: React.ReactNode; value: number }[]; unit?: string }) {
  const top = Math.max(1, ...rows.map((r) => Math.abs(r.value)))
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(64px, auto) 1fr auto', alignItems: 'center', gap: '0.45rem 0.7rem' }}>
      {rows.map((r) => {
        const pct = (Math.abs(r.value) / top) * 50
        return (
          <React.Fragment key={r.key}>
            <span style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', fontWeight: 600, whiteSpace: 'nowrap' }}>{r.label}</span>
            <div style={{ position: 'relative', height: 8, background: 'var(--surface-3)', borderRadius: 8 }}>
              <div style={{ position: 'absolute', left: '50%', top: -2, bottom: -2, width: 1, background: 'var(--text-muted)' }} />
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  bottom: 0,
                  left: r.value >= 0 ? '50%' : `${50 - pct}%`,
                  width: `${pct}%`,
                  background: r.value >= 0 ? 'var(--teal)' : 'var(--rose)',
                  borderRadius: 8,
                }}
              />
            </div>
            <span style={{ fontSize: '0.72rem', fontFamily: 'var(--font-mono)', color: 'var(--text-primary)', textAlign: 'right', whiteSpace: 'nowrap' }}>
              {r.value > 0 ? '+' : ''}
              {r.value.toFixed(1)}
              {unit ? ` ${unit}` : ''}
            </span>
          </React.Fragment>
        )
      })}
    </div>
  )
}
