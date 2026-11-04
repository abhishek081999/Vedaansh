// ─────────────────────────────────────────────────────────────
//  src/components/ui/viz/ClockDial.tsx
//  24-hour dial with time windows as arcs and a "now" hand
// ─────────────────────────────────────────────────────────────

import React from 'react'
import { arcPath, polar } from './geometry'

export interface DialWindow {
  key: string
  /** Hours since local midnight (fractional), may wrap past 24. */
  start: number
  end: number
  color: string
  label: string
  /** Ring index: 0 outer, 1 inner. */
  ring?: number
}

const TAU = Math.PI * 2
const ang = (h: number) => (((h % 24) + 24) % 24) / 24 * TAU

export function ClockDial({
  windows,
  now,
  sunrise,
  sunset,
  size = 240,
  centerTop,
  centerBottom,
}: {
  windows: DialWindow[]
  now?: number
  sunrise?: number
  sunset?: number
  size?: number
  centerTop?: string
  centerBottom?: string
}) {
  const pad = 22
  const vb = size + pad * 2
  const c = vb / 2
  const R = size / 2
  const ringW = 16

  const arc = (h0: number, h1: number, ring: number) => {
    const rO = R - ring * (ringW + 4)
    const a0 = ang(h0)
    let a1 = ang(h1)
    if (a1 <= a0) a1 += TAU
    return arcPath(c, c, rO, rO - ringW, a0, a1)
  }

  return (
    <svg viewBox={`0 0 ${vb} ${vb}`} width="100%" style={{ maxWidth: vb, display: 'block', margin: '0 auto' }} role="img" aria-label="24-hour window dial">
      <circle cx={c} cy={c} r={R} fill="var(--surface-2)" />
      {sunrise !== undefined && sunset !== undefined && (
        <path d={arcPath(c, c, R, 0.01, ang(sunrise), ang(sunset) <= ang(sunrise) ? ang(sunset) + TAU : ang(sunset))} fill="var(--gold)" fillOpacity={0.08} />
      )}
      <circle cx={c} cy={c} r={R - 2 * (ringW + 4) - 2} fill="var(--surface-1)" />
      {windows.map((w) => (
        <path key={w.key} d={arc(w.start, w.end, w.ring ?? 0)} fill={w.color} fillOpacity={0.88}>
          <title>{w.label}</title>
        </path>
      ))}
      {Array.from({ length: 24 }).map((_, h) => {
        const [x0, y0] = polar(c, c, R + 1, ang(h))
        const [x1, y1] = polar(c, c, R + (h % 6 === 0 ? 7 : 4), ang(h))
        const [tx, ty] = polar(c, c, R + 14, ang(h))
        return (
          <g key={h}>
            <line x1={x0} y1={y0} x2={x1} y2={y1} stroke="var(--text-muted)" strokeWidth={h % 6 === 0 ? 1.4 : 0.7} />
            {h % 3 === 0 && (
              <text x={tx} y={ty} textAnchor="middle" dominantBaseline="middle" fontSize={9} fill="var(--text-muted)">
                {h}
              </text>
            )}
          </g>
        )
      })}
      {[sunrise, sunset].map((h, i) => {
        if (h === undefined) return null
        const [x, y] = polar(c, c, R - 2 * (ringW + 4) - 10, ang(h))
        return (
          <text key={i} x={x} y={y} textAnchor="middle" dominantBaseline="middle" fontSize={10} fill="var(--gold)">
            {i === 0 ? '☀↑' : '☀↓'}
          </text>
        )
      })}
      {now !== undefined && (() => {
        const [x, y] = polar(c, c, R + 2, ang(now))
        // With centre text, start the hand at the inner disc so it does not cross the label.
        const [x0, y0] = centerTop || centerBottom ? polar(c, c, R - 2 * (ringW + 4) - 2, ang(now)) : [c, c]
        return (
          <g>
            <line x1={x0} y1={y0} x2={x} y2={y} stroke="var(--text-primary)" strokeWidth={2} strokeLinecap="round" />
            <circle cx={x0} cy={y0} r={centerTop || centerBottom ? 3 : 4} fill="var(--text-primary)" />
          </g>
        )
      })()}
      {centerTop && (
        <text x={c} y={c - 14} textAnchor="middle" fontSize={15} fontWeight={700} fill="var(--text-primary)" style={{ fontFamily: 'var(--font-display)' }}>
          {centerTop}
        </text>
      )}
      {centerBottom && (
        <text x={c} y={c + 22} textAnchor="middle" fontSize={9.5} fill="var(--text-muted)">
          {centerBottom}
        </text>
      )}
    </svg>
  )
}
