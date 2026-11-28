'use client'
// ─────────────────────────────────────────────────────────────
//  src/components/prashna/PrashnaTajikaWheel.tsx
//  Circular praśna chart for Tajika: lagna on the left (east), signs
//  counter-clockwise, the seven planets at their degrees, and a chord for
//  each ithasala (solid), bhaviṣyat ithasala (dotted) and ishrafa (dashed).
//  Teal = friendly aspect, rose = hostile.
// ─────────────────────────────────────────────────────────────

import { GRAHA_HI, RASHI_HI } from '@/i18n/jyotish'
import type { GrahaData, GrahaId, Rashi } from '@/types/astrology'
import type { TajikaLink } from '@/lib/engine/tajika'

export type WheelLink = { link: TajikaLink; kind: 'ithasala' | 'ishrafa' | 'future' }

const SIZE = 360
const C = SIZE / 2
const R_OUT = 172
const R_SIGN = 146
const R_PLANET = 124
const R_CHORD = 100
const GRAHA_SHORT_HI: Partial<Record<GrahaId, string>> = { Su: 'सू', Mo: 'चं', Ma: 'मं', Me: 'बु', Ju: 'गु', Ve: 'शु', Sa: 'श' }
const SIGN_EN = ['', 'Ar', 'Ta', 'Ge', 'Cn', 'Le', 'Vi', 'Li', 'Sc', 'Sg', 'Cp', 'Aq', 'Pi']

/** θ in degrees, counter-clockwise from +x; SVG y grows downward. */
const pt = (deg: number, r: number) => {
  const a = (deg * Math.PI) / 180
  return { x: C + r * Math.cos(a), y: C - r * Math.sin(a) }
}

export const linkKey = (l: TajikaLink) => `${l.fast}-${l.slow}`

export function PrashnaTajikaWheel({ grahas, ascDegree, ascRashi, links, sigs, focus, hi, label, kindLabel, markers = [] }: {
  grahas: Record<string, GrahaData>
  ascDegree: number
  ascRashi: Rashi
  links: WheelLink[]
  /** Lagna lord and matter lord. */
  sigs: GrahaId[]
  /** Planets to bring forward (a hovered yoga or link); others dim. */
  focus: GrahaId[] | null
  hi: boolean
  label: string
  /** Localised name of a link kind, for tooltips. */
  kindLabel: (kind: WheelLink['kind']) => string
  /** Saham points, drawn as diamonds on the inner edge of the sign ring. */
  markers?: Array<{ id: string; label: string; lon: number; hot?: boolean }>
}) {
  const full = (id: GrahaId) => (hi ? GRAHA_HI[id] ?? id : id)
  // Lagna at 180° (left). Longitude grows counter-clockwise.
  const angle = (lon: number) => 180 + (lon - ascDegree)
  const ids = Object.keys(grahas) as GrahaId[]

  // Spread planets that sit within 9° of each other onto stepped radii.
  const sorted = [...ids].sort((a, b) => grahas[a].totalDegree - grahas[b].totalDegree)
  const step: Record<string, number> = {}
  sorted.forEach((id, i) => {
    const prev = sorted[i - 1]
    const close = prev && Math.abs(grahas[id].totalDegree - grahas[prev].totalDegree) < 9
    step[id] = close ? (step[prev] + 1) % 2 : 0
  })
  const planetAt = (id: GrahaId) => pt(angle(grahas[id].totalDegree), R_PLANET - step[id] * 17)
  const chordAt = (id: GrahaId) => pt(angle(grahas[id].totalDegree), R_CHORD)

  const inFocus = (l: TajikaLink) => !focus || (focus.includes(l.fast) && focus.includes(l.slow))
  const isSigPair = (l: TajikaLink) => sigs.length === 2 && sigs[0] !== sigs[1] && sigs.includes(l.fast) && sigs.includes(l.slow)

  return (
    <svg viewBox={`0 0 ${SIZE} ${SIZE}`} role="img" aria-label={label} style={{ width: '100%', maxWidth: 380, height: 'auto', display: 'block', margin: '0 auto' }}>
      <circle cx={C} cy={C} r={R_OUT} fill="var(--surface-2)" stroke="var(--border)" />
      <circle cx={C} cy={C} r={R_SIGN - 14} fill="var(--surface-1)" stroke="var(--border-soft)" />
      <circle cx={C} cy={C} r={R_CHORD} fill="none" stroke="var(--border-soft)" strokeDasharray="2 4" />

      {/* Sign boundaries are whole-sign house cusps. */}
      {Array.from({ length: 12 }, (_, i) => {
        const r = (((ascRashi - 1 + i) % 12) + 1) as Rashi
        const start = angle((r - 1) * 30)
        const a = pt(start, R_SIGN - 14), b = pt(start, R_OUT)
        const mid = pt(start + 15, R_SIGN + 6)
        const num = pt(start + 15, R_SIGN - 24)
        return (
          <g key={r}>
            <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="var(--border)" />
            <text x={mid.x} y={mid.y} textAnchor="middle" dominantBaseline="central" fontSize={hi ? 9.5 : 10.5} fontWeight={i === 0 ? 700 : 500}
              fill={i === 0 ? 'var(--text-gold)' : 'var(--text-secondary)'}>
              {hi ? RASHI_HI[r] : SIGN_EN[r]}
            </text>
            <text x={num.x} y={num.y} textAnchor="middle" dominantBaseline="central" fontSize={8} fill="var(--text-muted)">{i + 1}</text>
          </g>
        )
      })}

      {/* Lagna marker */}
      {(() => {
        const a = pt(180, R_SIGN - 14), b = pt(180, R_CHORD - 6)
        const o1 = pt(180, R_OUT - 5), o2 = pt(180, R_OUT + 6)
        return (
          <g stroke="var(--gold)" strokeWidth={1.8} strokeLinecap="round">
            <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} />
            <line x1={o1.x} y1={o1.y} x2={o2.x} y2={o2.y} />
          </g>
        )
      })()}

      {/* Chords: dim first, focused on top. */}
      {[...links].sort((x, y) => Number(inFocus(x.link)) - Number(inFocus(y.link))).map(({ link: l, kind }) => {
        const a = chordAt(l.fast), b = chordAt(l.slow)
        const on = inFocus(l)
        const sig = isSigPair(l)
        const color = kind === 'ishrafa' ? 'var(--text-muted)' : l.aspect === 'friendly' ? 'var(--teal)' : 'var(--rose)'
        return (
          <line key={linkKey(l)} x1={a.x} y1={a.y} x2={b.x} y2={b.y}
            stroke={color} strokeWidth={sig ? 2.6 : 1.5} strokeLinecap="round"
            strokeDasharray={kind === 'ishrafa' ? '6 4' : kind === 'future' ? '1.5 4' : undefined}
            opacity={on ? 0.95 : 0.12}>
            <title>{`${full(l.fast)} → ${full(l.slow)}: ${kindLabel(kind)} · ${l.gap}°/${l.orb}°`}</title>
          </line>
        )
      })}

      {/* Saham diamonds */}
      {markers.map(m => {
        const p = pt(angle(m.lon), R_SIGN - 14)
        const r = m.hot ? 6 : 4.5
        return (
          <g key={m.id}>
            <rect x={p.x - r} y={p.y - r} width={r * 2} height={r * 2} transform={`rotate(45 ${p.x} ${p.y})`}
              fill="var(--accent, var(--gold))" stroke="var(--surface-1)" strokeWidth={1} opacity={m.hot ? 1 : 0.85} />
            <title>{m.label}</title>
          </g>
        )
      })}

      {/* Planets: a tick on the chord circle, the glyph further out. */}
      {ids.map(id => {
        const p = planetAt(id), c = chordAt(id)
        const sig = sigs.includes(id)
        const dim = focus && !focus.includes(id)
        const g = grahas[id]
        return (
          <g key={id} opacity={dim ? 0.3 : 1}>
            <line x1={c.x} y1={c.y} x2={p.x} y2={p.y} stroke="var(--border)" strokeWidth={0.8} />
            <circle cx={c.x} cy={c.y} r={2.4} fill="var(--text-secondary)" />
            <circle cx={p.x} cy={p.y} r={11} fill="var(--surface-3)" stroke={sig ? 'var(--gold)' : 'var(--border)'} strokeWidth={sig ? 2 : 1} />
            <text x={p.x} y={p.y} textAnchor="middle" dominantBaseline="central" fontSize={hi ? 8.5 : 9.5} fontWeight={700}
              fill={sig ? 'var(--text-gold)' : 'var(--text-primary)'}>
              {hi ? GRAHA_SHORT_HI[id] ?? id : id}
            </text>
            <title>{`${full(id)} ${g.degree.toFixed(1)}°${g.isRetro ? (hi ? ' (व)' : ' R') : ''}`}</title>
          </g>
        )
      })}
    </svg>
  )
}
