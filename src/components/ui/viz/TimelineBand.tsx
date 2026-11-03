// ─────────────────────────────────────────────────────────────
//  src/components/ui/viz/TimelineBand.tsx
//  Horizontal time band with lanes, period blocks and a "now" marker
// ─────────────────────────────────────────────────────────────

import React from 'react'
import { toMs } from './geometry'

type TimeLike = Date | string | number

export interface BandSegment {
  key: string
  start: TimeLike
  end: TimeLike
  label?: string
  color: string
  /** Lane index (0 = top). */
  lane?: number
  emphasis?: boolean
  title?: string
}

export function TimelineBand({
  segments,
  now,
  laneLabels,
  from,
  to,
  tickFormat,
  ticks = 6,
  laneHeight = 26,
  ariaLabel,
}: {
  segments: BandSegment[]
  now?: TimeLike
  laneLabels?: string[]
  from?: TimeLike
  to?: TimeLike
  tickFormat?: (ms: number) => string
  ticks?: number
  laneHeight?: number
  ariaLabel?: string
}) {
  if (segments.length === 0) return null
  const t0 = from !== undefined ? toMs(from) : Math.min(...segments.map((s) => toMs(s.start)))
  const t1 = to !== undefined ? toMs(to) : Math.max(...segments.map((s) => toMs(s.end)))
  const span = t1 - t0 || 1
  const lanes = Math.max(laneLabels?.length ?? 0, ...segments.map((s) => (s.lane ?? 0) + 1))
  const W = 760
  const labelW = laneLabels ? 92 : 0
  const plotW = W - labelW - 8
  const axisH = 22
  const H = lanes * (laneHeight + 6) + axisH
  const x = (ms: number) => labelW + ((ms - t0) / span) * plotW
  const fmt = tickFormat ?? ((ms: number) => String(new Date(ms).getFullYear()))
  const nowMs = now !== undefined ? toMs(now) : undefined

  return (
    <div style={{ overflowX: 'auto' }}>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ minWidth: 480, display: 'block' }} role="img" aria-label={ariaLabel}>
        {laneLabels?.map((l, i) => (
          <text key={l} x={0} y={i * (laneHeight + 6) + laneHeight / 2} dominantBaseline="middle" fontSize={10.5} fontWeight={600} fill="var(--text-secondary)">
            {l}
          </text>
        ))}
        {Array.from({ length: lanes }).map((_, i) => (
          <rect key={i} x={labelW} y={i * (laneHeight + 6)} width={plotW} height={laneHeight} rx={5} fill="var(--surface-2)" />
        ))}
        {segments.map((s) => {
          const a = Math.max(t0, toMs(s.start))
          const b = Math.min(t1, toMs(s.end))
          if (b <= a) return null
          const lane = s.lane ?? 0
          const xa = x(a)
          const w = Math.max(2, x(b) - xa)
          const y = lane * (laneHeight + 6)
          return (
            <g key={s.key}>
              <title>{s.title ?? s.label ?? s.key}</title>
              <rect x={xa} y={y} width={w} height={laneHeight} rx={5} fill={s.color} fillOpacity={s.emphasis ? 0.95 : 0.6} stroke={s.emphasis ? 'var(--text-primary)' : 'none'} strokeWidth={1.2} />
              {s.label && w > s.label.length * 6 + 8 && (
                <text x={xa + w / 2} y={y + laneHeight / 2} textAnchor="middle" dominantBaseline="middle" fontSize={10} fontWeight={700} fill="var(--text-on-gold)">
                  {s.label}
                </text>
              )}
            </g>
          )
        })}
        {Array.from({ length: ticks + 1 }).map((_, i) => {
          const ms = t0 + (span * i) / ticks
          const tx = x(ms)
          return (
            <g key={i}>
              <line x1={tx} x2={tx} y1={H - axisH} y2={H - axisH + 4} stroke="var(--text-muted)" />
              <text x={tx} y={H - 6} textAnchor={i === 0 ? 'start' : i === ticks ? 'end' : 'middle'} fontSize={9.5} fill="var(--text-muted)">
                {fmt(ms)}
              </text>
            </g>
          )
        })}
        {nowMs !== undefined && nowMs >= t0 && nowMs <= t1 && (
          <g>
            <line x1={x(nowMs)} x2={x(nowMs)} y1={0} y2={H - axisH} stroke="var(--gold)" strokeWidth={2} />
            <circle cx={x(nowMs)} cy={2} r={3.5} fill="var(--gold)" />
          </g>
        )}
      </svg>
    </div>
  )
}
