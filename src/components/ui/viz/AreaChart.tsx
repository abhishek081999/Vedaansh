// ─────────────────────────────────────────────────────────────
//  src/components/ui/viz/AreaChart.tsx
//  Smooth multi-series area/line chart + inline sparkline
// ─────────────────────────────────────────────────────────────

import React from 'react'

export interface AreaSeries {
  label: string
  color: string
  points: { x: number; y: number }[]
}

function smoothPath(pts: [number, number][]): string {
  if (pts.length === 0) return ''
  let d = `M${pts[0][0].toFixed(1)},${pts[0][1].toFixed(1)}`
  for (let i = 1; i < pts.length; i++) {
    const [x0, y0] = pts[i - 1]
    const [x1, y1] = pts[i]
    const mx = (x0 + x1) / 2
    d += ` C${mx.toFixed(1)},${y0.toFixed(1)} ${mx.toFixed(1)},${y1.toFixed(1)} ${x1.toFixed(1)},${y1.toFixed(1)}`
  }
  return d
}

export function AreaChart({
  series,
  marker,
  markerLabel,
  yMin,
  yMax,
  xFormat = (v) => String(v),
  height = 180,
  ariaLabel,
}: {
  series: AreaSeries[]
  marker?: number
  markerLabel?: string
  yMin?: number
  yMax?: number
  xFormat?: (x: number) => string
  height?: number
  ariaLabel?: string
}) {
  const all = series.flatMap((s) => s.points)
  if (all.length < 2) return null
  const W = 760
  const H = height
  const padL = 30
  const padB = 22
  const padT = 10
  const xs = all.map((p) => p.x)
  const x0 = Math.min(...xs)
  const x1 = Math.max(...xs)
  const lo = yMin ?? Math.min(0, ...all.map((p) => p.y))
  const hi = yMax ?? Math.max(...all.map((p) => p.y))
  const sx = (v: number) => padL + ((v - x0) / (x1 - x0 || 1)) * (W - padL - 6)
  const sy = (v: number) => padT + (1 - (v - lo) / (hi - lo || 1)) * (H - padT - padB)
  const base = sy(Math.max(lo, 0))
  const ticks = 6

  return (
    <div style={{ overflowX: 'auto' }}>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ minWidth: 420, display: 'block' }} role="img" aria-label={ariaLabel}>
        {[0, 0.5, 1].map((p) => {
          const v = lo + (hi - lo) * p
          return (
            <g key={p}>
              <line x1={padL} x2={W - 6} y1={sy(v)} y2={sy(v)} stroke="var(--border-soft)" />
              <text x={padL - 5} y={sy(v)} textAnchor="end" dominantBaseline="middle" fontSize={9} fill="var(--text-muted)">
                {Math.round(v)}
              </text>
            </g>
          )
        })}
        {series.map((s) => {
          const pts = [...s.points].sort((a, b) => a.x - b.x).map((p) => [sx(p.x), sy(p.y)] as [number, number])
          const line = smoothPath(pts)
          return (
            <g key={s.label}>
              <path d={`${line} L${pts[pts.length - 1][0]},${base} L${pts[0][0]},${base} Z`} fill={s.color} fillOpacity={series.length > 1 ? 0.1 : 0.18} />
              <path d={line} fill="none" stroke={s.color} strokeWidth={2} />
            </g>
          )
        })}
        {Array.from({ length: ticks + 1 }).map((_, i) => {
          const v = x0 + ((x1 - x0) * i) / ticks
          return (
            <text key={i} x={sx(v)} y={H - 6} textAnchor={i === 0 ? 'start' : i === ticks ? 'end' : 'middle'} fontSize={9.5} fill="var(--text-muted)">
              {xFormat(v)}
            </text>
          )
        })}
        {marker !== undefined && marker >= x0 && marker <= x1 && (
          <g>
            <line x1={sx(marker)} x2={sx(marker)} y1={padT} y2={H - padB} stroke="var(--gold)" strokeWidth={1.6} strokeDasharray="4 3" />
            {markerLabel && (
              <text x={sx(marker) + 4} y={padT + 8} fontSize={9.5} fontWeight={700} fill="var(--gold)">
                {markerLabel}
              </text>
            )}
          </g>
        )}
      </svg>
    </div>
  )
}

export function Sparkline({ values, color = 'var(--gold)', width = 72, height = 20 }: { values: number[]; color?: string; width?: number; height?: number }) {
  if (values.length < 2) return null
  const lo = Math.min(...values)
  const hi = Math.max(...values)
  const pts = values.map((v, i) => [(i / (values.length - 1)) * width, height - 2 - ((v - lo) / (hi - lo || 1)) * (height - 4)] as [number, number])
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden style={{ display: 'block' }}>
      <path d={smoothPath(pts)} fill="none" stroke={color} strokeWidth={1.5} />
    </svg>
  )
}
