'use client'
// ─────────────────────────────────────────────────────────────
//  src/components/prashna/PrashnaTajikaGridChart.tsx
//  North Indian (fixed houses) and South Indian (fixed signs) praśna charts
//  with the same Tajika lines as the circular wheel: ithasala solid,
//  bhaviṣyat ithasala dotted, ishrafa dashed; teal friendly, rose hostile.
// ─────────────────────────────────────────────────────────────

import { GRAHA_HI, RASHI_HI } from '@/i18n/jyotish'
import type { GrahaData, GrahaId, Rashi } from '@/types/astrology'
import { centroid, polyPts } from '@/components/chakra/NorthIndianChakra'
import { SIGN_CELLS } from '@/components/chakra/SouthIndianChakra'
import { linkKey, type WheelLink } from './PrashnaTajikaWheel'

const S = 360
const M = S / 2
const GRAHA_SHORT_HI: Partial<Record<GrahaId, string>> = { Su: 'सू', Mo: 'चं', Ma: 'मं', Me: 'बु', Ju: 'गु', Ve: 'शु', Sa: 'श' }
const SIGN_EN = ['', 'Ar', 'Ta', 'Ge', 'Cn', 'Le', 'Vi', 'Li', 'Sc', 'Sg', 'Cp', 'Aq', 'Pi']

type Pt = [number, number]
const lerp = (a: Pt, b: Pt, t: number): Pt => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]

interface Cell {
  key: number
  rashi: Rashi
  house: number
  /** Outline: a polygon (North) or a square (South). */
  points: Pt[]
  /** Where the sign (North: number; South: name) is written. */
  label: Pt
  /** Centre of the planet cluster. */
  body: Pt
}

function northCells(asc: Rashi): Cell[] {
  return Array.from({ length: 12 }, (_, i) => {
    const house = i + 1
    const pts = polyPts(house, S) as Pt[]
    const c = centroid(pts) as Pt
    // The vertex nearest the chart centre is where the sign number sits.
    const inner = pts.reduce((best, p) => (Math.hypot(p[0] - M, p[1] - M) < Math.hypot(best[0] - M, best[1] - M) ? p : best))
    return {
      key: house, house, rashi: (((asc - 1 + i) % 12) + 1) as Rashi, points: pts,
      label: lerp(c, inner, 0.55), body: [1, 4, 7, 10].includes(house) ? lerp(c, inner, -0.12) : c,
    }
  })
}

function southCells(asc: Rashi): Cell[] {
  const q = S / 4
  return Array.from({ length: 12 }, (_, i) => {
    const rashi = (i + 1) as Rashi
    const [row, col] = SIGN_CELLS[rashi]
    const x = col * q, y = row * q
    return {
      key: rashi, rashi, house: ((rashi - asc + 12) % 12) + 1,
      points: [[x, y], [x + q, y], [x + q, y + q], [x, y + q]],
      label: [x + 6, y + 12], body: [x + q / 2, y + q / 2 + 7],
    }
  })
}

/** Up to three planets a row, centred on the cell body. */
function cluster(body: Pt, n: number, narrow: boolean): Pt[] {
  const perRow = narrow ? 2 : n <= 4 ? Math.min(n, 2) : 3
  const rows = Math.ceil(n / perRow)
  const dx = 24, dy = 23
  return Array.from({ length: n }, (_, i) => {
    const r = Math.floor(i / perRow)
    const inRow = Math.min(perRow, n - r * perRow)
    const c = i - r * perRow
    return [body[0] + (c - (inRow - 1) / 2) * dx, body[1] + (r - (rows - 1) / 2) * dy] as Pt
  })
}

export function PrashnaTajikaGridChart({ variant, grahas, ascRashi, links, sigs, focus, hi, label, kindLabel, markers = [] }: {
  variant: 'north' | 'south'
  grahas: Record<string, GrahaData>
  ascRashi: Rashi
  links: WheelLink[]
  sigs: GrahaId[]
  focus: GrahaId[] | null
  hi: boolean
  label: string
  kindLabel: (kind: WheelLink['kind']) => string
  markers?: Array<{ id: string; label: string; lon: number; hot?: boolean }>
}) {
  const cells = variant === 'north' ? northCells(ascRashi) : southCells(ascRashi)
  const ids = Object.keys(grahas) as GrahaId[]
  const full = (id: GrahaId) => (hi ? GRAHA_HI[id] ?? id : id)

  // Planet positions: by sign, in longitude order inside each cell.
  const pos: Record<string, Pt> = {}
  for (const cell of cells) {
    const here = ids.filter(id => grahas[id].rashi === cell.rashi).sort((a, b) => grahas[a].degree - grahas[b].degree)
    const narrow = variant === 'north' && ![1, 4, 7, 10].includes(cell.house)
    cluster(cell.body, here.length, narrow).forEach((p, i) => { pos[here[i]] = p })
  }

  const inFocus = (a: GrahaId, b: GrahaId) => !focus || (focus.includes(a) && focus.includes(b))
  const isSigPair = (a: GrahaId, b: GrahaId) => sigs.length === 2 && sigs[0] !== sigs[1] && sigs.includes(a) && sigs.includes(b)

  return (
    <svg viewBox={`-2 -2 ${S + 4} ${S + 4}`} role="img" aria-label={label} style={{ width: '100%', maxWidth: 380, height: 'auto', display: 'block', margin: '0 auto' }}>
      <rect x={0} y={0} width={S} height={S} fill="var(--surface-2)" stroke="var(--text-muted)" strokeOpacity={0.45} />
      {variant === 'south' && <rect x={S / 4} y={S / 4} width={S / 2} height={S / 2} fill="var(--surface-1)" stroke="var(--border-soft)" />}

      {cells.map(cell => {
        const lagna = cell.house === 1
        return (
          <g key={cell.key}>
            <polygon points={cell.points.map(p => p.join(',')).join(' ')} fill={lagna ? 'var(--surface-3)' : 'none'} stroke="var(--text-muted)" strokeOpacity={0.45} strokeWidth={1} />
            {variant === 'north' ? (
              <text x={cell.label[0]} y={cell.label[1]} textAnchor="middle" dominantBaseline="central" fontSize={10} fontWeight={lagna ? 700 : 500}
                fill={lagna ? 'var(--text-gold)' : 'var(--text-muted)'}>{cell.rashi}</text>
            ) : (
              <>
                <text x={cell.label[0]} y={cell.label[1]} fontSize={hi ? 9 : 10} fontWeight={lagna ? 700 : 500}
                  fill={lagna ? 'var(--text-gold)' : 'var(--text-secondary)'}>{hi ? RASHI_HI[cell.rashi] : SIGN_EN[cell.rashi]}</text>
                <text x={cell.points[1][0] - 6} y={cell.label[1]} textAnchor="end" fontSize={8} fill="var(--text-muted)">{cell.house}</text>
                {lagna && <line x1={cell.points[0][0]} y1={cell.points[0][1] + 22} x2={cell.points[0][0] + 22} y2={cell.points[0][1]} stroke="var(--gold)" strokeWidth={1.6} />}
              </>
            )}
          </g>
        )
      })}

      {/* Saham diamonds: in the sign they fall in, at the outer edge of the cell. */}
      {markers.map((m, i) => {
        const rashi = (Math.floor((((m.lon % 360) + 360) % 360) / 30) + 1) as Rashi
        const cell = cells.find(c => c.rashi === rashi)
        if (!cell) return null
        const c = centroid(cell.points) as Pt
        const raw = variant === 'north' ? lerp(c, cell.label, [1, 4, 7, 10].includes(cell.house) ? -0.75 : -0.35) : ([cell.points[2][0] - 10 - i * 12, cell.points[2][1] - 10] as Pt)
        const p: Pt = [Math.min(S - 8, Math.max(8, raw[0])), Math.min(S - 8, Math.max(8, raw[1]))]
        const r = m.hot ? 5.5 : 4.2
        return (
          <g key={m.id}>
            <rect x={p[0] - r} y={p[1] - r} width={r * 2} height={r * 2} transform={`rotate(45 ${p[0]} ${p[1]})`}
              fill="var(--accent, var(--gold))" stroke="var(--surface-1)" strokeWidth={1} opacity={m.hot ? 1 : 0.85} />
            <title>{m.label}</title>
          </g>
        )
      })}

      {/* Tajika lines, under the planets. */}
      {[...links].sort((x, y) => Number(inFocus(x.link.fast, x.link.slow)) - Number(inFocus(y.link.fast, y.link.slow))).map(({ link: l, kind }) => {
        const a = pos[l.fast], b = pos[l.slow]
        if (!a || !b) return null
        const on = inFocus(l.fast, l.slow)
        const sig = isSigPair(l.fast, l.slow)
        const color = kind === 'ishrafa' ? 'var(--text-muted)' : l.aspect === 'friendly' ? 'var(--teal)' : 'var(--rose)'
        // Same-sign links would sit on top of each other; bow them slightly.
        const mid: Pt = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]
        const len = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1
        const bow = len < 40 ? 14 : 0
        const ctrl: Pt = [mid[0] - ((b[1] - a[1]) / len) * bow, mid[1] + ((b[0] - a[0]) / len) * bow]
        return (
          <path key={linkKey(l)} d={`M${a[0]},${a[1]} Q${ctrl[0]},${ctrl[1]} ${b[0]},${b[1]}`} fill="none"
            stroke={color} strokeWidth={sig ? 2.6 : 1.5} strokeLinecap="round"
            strokeDasharray={kind === 'ishrafa' ? '6 4' : kind === 'future' ? '1.5 4' : undefined}
            opacity={on ? 0.95 : 0.12}>
            <title>{`${full(l.fast)} → ${full(l.slow)}: ${kindLabel(kind)} · ${l.gap}°/${l.orb}°`}</title>
          </path>
        )
      })}

      {ids.map(id => {
        const p = pos[id]
        if (!p) return null
        const sig = sigs.includes(id)
        const g = grahas[id]
        return (
          <g key={id} opacity={focus && !focus.includes(id) ? 0.3 : 1}>
            <circle cx={p[0]} cy={p[1]} r={10.5} fill="var(--surface-1)" stroke={sig ? 'var(--gold)' : 'var(--border)'} strokeWidth={sig ? 2 : 1} />
            <text x={p[0]} y={p[1]} textAnchor="middle" dominantBaseline="central" fontSize={hi ? 8.5 : 9.5} fontWeight={700}
              fill={sig ? 'var(--text-gold)' : 'var(--text-primary)'}>{hi ? GRAHA_SHORT_HI[id] ?? id : id}</text>
            <title>{`${full(id)} ${g.degree.toFixed(1)}°${g.isRetro ? (hi ? ' (व)' : ' R') : ''}`}</title>
          </g>
        )
      })}
    </svg>
  )
}
