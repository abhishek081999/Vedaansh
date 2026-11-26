'use client'
// ─────────────────────────────────────────────────────────────
//  src/components/ui/NakshatraAdvancedViz.tsx
//  SVG graphics for the Advanced nakshatra tab:
//   SpecialStarsRing · StarLordWeb · ReturnsTimeline · LattaRing · DegreeStrip
//  Token-themed (light/dark), hover tooltips via <title>, labels passed in
//  by the caller so all wording stays in messages/{en,hi}.
// ─────────────────────────────────────────────────────────────

import React, { useId } from 'react'
import type { GrahaId, Rashi } from '@/types/astrology'
import { arcPath, polar } from '@/components/ui/viz'
import { ICON } from '@/components/ui/PlanetDetailCard'
import { MRITYU_BHAGA_DEGREES } from '@/lib/engine/mrityuBhaga'
import {
  NAVAGRAHA,
  PUSHKARA_BHAGA,
  type LattaRow,
  type NakBody,
  type SensitiveDegreeRow,
  type SpecialStar,
  type StarLordLink,
} from '@/lib/engine/nakshatraSystem'
import styles from './NakshatraAdvancedTab.module.css'

const TAU = Math.PI * 2
const SPAN = TAU / 27

const glyph = (id: NakBody) => (id === 'As' ? 'As' : ICON[id] ?? id)

/** Angle (radians, 0 = top, clockwise) of a nakshatra's centre, with `topNak` at the top. */
function nakAngle(nak: number, topNak: number): number {
  return (((nak - topNak) % 27) + 27) % 27 * SPAN
}

export interface NakLabels {
  short: (i: number) => string
  name: (i: number) => string
  body: (id: NakBody) => string
}

// ── shared ring ──────────────────────────────────────────────

function StarRing({
  cx, cy, rOuter, rInner, topNak, fill, labels, stroke,
}: {
  cx: number
  cy: number
  rOuter: number
  rInner: number
  topNak: number
  fill: (nak: number) => string
  stroke?: (nak: number) => string | undefined
  labels: NakLabels
}) {
  return (
    <g>
      {Array.from({ length: 27 }, (_, nak) => {
        const mid = nakAngle(nak, topNak)
        const [lx, ly] = polar(cx, cy, (rOuter + rInner) / 2, mid)
        return (
          <g key={nak}>
            <path
              d={arcPath(cx, cy, rOuter, rInner, mid - SPAN / 2, mid + SPAN / 2)}
              fill={fill(nak)}
              stroke={stroke?.(nak) ?? 'var(--surface-1)'}
              strokeWidth={stroke?.(nak) ? 2 : 1.5}
            >
              <title>{labels.name(nak)}</title>
            </path>
            <text x={lx} y={ly} className={styles.vizSliceLabel} textAnchor="middle" dominantBaseline="central">
              {labels.short(nak)}
            </text>
          </g>
        )
      })}
    </g>
  )
}

function ArrowMarker({ id, color }: { id: string; color: string }) {
  return (
    <marker id={id} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M0,1 L9,5 L0,9 z" fill={color} />
    </marker>
  )
}

// ── 1. Special stars ring ────────────────────────────────────

export function SpecialStarsRing({
  birthNak,
  stars,
  transits,
  labels,
  starName,
}: {
  birthNak: number
  stars: SpecialStar[]
  transits: Array<{ id: GrahaId; nakshatraIndex: number }> | null
  labels: NakLabels
  starName: (id: SpecialStar['id']) => string
}) {
  const C = 200
  const R_OUT = 150
  const R_IN = 112
  const byNak = new Map(stars.map(s => [s.nakshatraIndex, s]))
  const fill = (nak: number) => {
    const s = byNak.get(nak)
    if (!s) return 'var(--surface-2)'
    if (s.id === 'janma') return 'color-mix(in srgb, var(--gold) 45%, var(--surface-2))'
    return s.nature === 'malefic'
      ? 'color-mix(in srgb, var(--rose) 32%, var(--surface-2))'
      : 'color-mix(in srgb, var(--amber) 28%, var(--surface-2))'
  }
  const natalByNak = new Map(stars.map(s => [s.nakshatraIndex, s.natal]))
  const transitByNak = new Map<number, GrahaId[]>()
  for (const t of transits ?? []) {
    if (!NAVAGRAHA.includes(t.id)) continue
    transitByNak.set(t.nakshatraIndex, [...(transitByNak.get(t.nakshatraIndex) ?? []), t.id])
  }

  return (
    <svg viewBox="0 0 400 400" className={styles.vizSvg} role="img" aria-label={stars.map(s => `${starName(s.id)}: ${labels.name(s.nakshatraIndex)}`).join(', ')}>
      <StarRing cx={C} cy={C} rOuter={R_OUT} rInner={R_IN} topNak={birthNak} fill={fill} labels={labels} />
      {stars.map(s => {
        const a = nakAngle(s.nakshatraIndex, birthNak)
        const [x0, y0] = polar(C, C, R_OUT + 2, a)
        const [x1, y1] = polar(C, C, R_OUT + 14, a)
        const [tx, ty] = polar(C, C, R_OUT + 26, a)
        return (
          <g key={s.id}>
            <line x1={x0} y1={y0} x2={x1} y2={y1} stroke="var(--border)" strokeWidth={1} />
            <text x={tx} y={ty} textAnchor="middle" dominantBaseline="central" className={styles.vizStarLabel}>
              {starName(s.id)}
              <title>{`${starName(s.id)} · #${s.count} · ${labels.name(s.nakshatraIndex)}`}</title>
            </text>
          </g>
        )
      })}
      {/* natal bodies inside the ring */}
      {[...natalByNak.entries()].flatMap(([nak, bodies]) =>
        bodies.map((b, i) => {
          const [x, y] = polar(C, C, R_IN - 14 - i * 17, nakAngle(nak, birthNak))
          return (
            <g key={`n-${b}`}>
              <circle cx={x} cy={y} r={8} fill="var(--surface-1)" stroke="var(--gold)" strokeWidth={1.5} />
              <text x={x} y={y} textAnchor="middle" dominantBaseline="central" className={styles.vizGlyph}>{glyph(b)}</text>
              <title>{`${labels.body(b)} · ${labels.name(nak)}`}</title>
            </g>
          )
        }),
      )}
      {/* today's transits on special stars, just outside the slice */}
      {[...transitByNak.entries()].filter(([nak]) => byNak.has(nak)).flatMap(([nak, ids]) =>
        ids.map((id, i) => {
          const a = nakAngle(nak, birthNak) + (i - (ids.length - 1) / 2) * 0.07
          const [x, y] = polar(C, C, R_OUT + 44, a)
          return (
            <g key={`t-${id}`}>
              <circle cx={x} cy={y} r={7} fill="var(--teal)" opacity={0.18} />
              <text x={x} y={y} textAnchor="middle" dominantBaseline="central" className={styles.vizGlyph} style={{ fill: 'var(--teal)' }}>{glyph(id)}</text>
              <title>{`${labels.body(id)} → ${labels.name(nak)}`}</title>
            </g>
          )
        }),
      )}
      <circle cx={C} cy={C} r={58} fill="var(--surface-1)" stroke="var(--border-soft)" />
      <text x={C} y={C - 8} textAnchor="middle" className={styles.vizCenterTitle}>{labels.name(birthNak)}</text>
      <text x={C} y={C + 12} textAnchor="middle" className={styles.vizCenterSub}>{starName('janma')} · 1</text>
    </svg>
  )
}

// ── 2. Star-lord web ─────────────────────────────────────────

export function StarLordWeb({
  links,
  exchanges,
  labels,
}: {
  links: StarLordLink[]
  exchanges: Array<{ a: GrahaId; b: GrahaId }>
  labels: NakLabels
}) {
  const uid = useId().replace(/:/g, '')
  const C = 190
  const R = 135
  const pos = new Map<NakBody, [number, number]>(NAVAGRAHA.map((g, i) => [g, polar(C, C, R, (i / 9) * TAU)]))
  pos.set('As', [C, C])
  const load = new Map<GrahaId, number>()
  for (const l of links) load.set(l.starLord, (load.get(l.starLord) ?? 0) + 1)
  const isExchange = (a: NakBody, b: GrahaId) =>
    exchanges.some(x => (x.a === a && x.b === b) || (x.b === a && x.a === b))
  const nodeR = (id: NakBody) => (id === 'As' ? 16 : 14 + Math.min(4, load.get(id as GrahaId) ?? 0) * 2.5)

  return (
    <svg viewBox="0 0 380 380" className={styles.vizSvg} role="img" aria-label={links.map(l => `${labels.body(l.body)} → ${labels.body(l.starLord)}`).join(', ')}>
      <defs>
        <ArrowMarker id={`${uid}-a`} color="var(--text-muted)" />
        <ArrowMarker id={`${uid}-x`} color="var(--gold)" />
      </defs>
      <circle cx={C} cy={C} r={R} fill="none" stroke="var(--border-soft)" strokeDasharray="2 4" />
      {links.map(l => {
        const from = pos.get(l.body)!
        const to = pos.get(l.starLord)!
        const ex = isExchange(l.body, l.starLord)
        const color = ex ? 'var(--gold)' : 'var(--text-muted)'
        if (l.ownStar) {
          // small loop pointing outward
          const [x, y] = from
          const dx = x - C, dy = y - C
          const len = Math.hypot(dx, dy) || 1
          const ux = dx / len, uy = dy / len
          const r0 = nodeR(l.body)
          const cxl = x + ux * (r0 + 10), cyl = y + uy * (r0 + 10)
          return (
            <circle key={l.body} cx={cxl} cy={cyl} r={9} fill="none" stroke="var(--teal)" strokeWidth={1.5}>
              <title>{`${labels.body(l.body)} → ${labels.body(l.starLord)}`}</title>
            </circle>
          )
        }
        const [x0, y0] = from
        const [x1, y1] = to
        const d = Math.hypot(x1 - x0, y1 - y0) || 1
        const r0 = nodeR(l.body), r1 = nodeR(l.starLord) + 3
        const sx = x0 + ((x1 - x0) / d) * r0, sy = y0 + ((y1 - y0) / d) * r0
        const ex1 = x1 - ((x1 - x0) / d) * r1, ey1 = y1 - ((y1 - y0) / d) * r1
        // bend each curve slightly so A→B and B→A do not overlap
        const mx = (sx + ex1) / 2, my = (sy + ey1) / 2
        const nx = -(ey1 - sy) / d, ny = (ex1 - sx) / d
        const qx = mx + nx * 22, qy = my + ny * 22
        return (
          <path
            key={l.body}
            d={`M${sx},${sy} Q${qx},${qy} ${ex1},${ey1}`}
            fill="none"
            stroke={color}
            strokeWidth={ex ? 2 : 1.25}
            strokeOpacity={ex ? 1 : 0.7}
            markerEnd={`url(#${uid}-${ex ? 'x' : 'a'})`}
          >
            <title>{`${labels.body(l.body)} → ${labels.body(l.starLord)}`}</title>
          </path>
        )
      })}
      {[...pos.entries()].map(([id, [x, y]]) => {
        const n = id === 'As' ? 0 : load.get(id as GrahaId) ?? 0
        return (
          <g key={id}>
            <circle
              cx={x}
              cy={y}
              r={nodeR(id)}
              fill={n >= 2 ? 'color-mix(in srgb, var(--gold) 22%, var(--surface-1))' : 'var(--surface-1)'}
              stroke={n >= 2 ? 'var(--gold)' : 'var(--border)'}
              strokeWidth={1.5}
            />
            <text x={x} y={y} textAnchor="middle" dominantBaseline="central" className={styles.vizGlyphLg}>{glyph(id)}</text>
            <title>{labels.body(id)}{n ? ` · ${n}` : ''}</title>
          </g>
        )
      })}
    </svg>
  )
}

// ── 3. Returns timeline ──────────────────────────────────────

export function ReturnsTimeline({
  returns,
  birthdays,
  monthLabel,
  birthdayLabel,
  returnLabel,
  fmt,
}: {
  returns: Array<{ start: string; end: string }>
  birthdays: Array<{ start: string; end: string }>
  monthLabel: (d: Date) => string
  birthdayLabel: string
  returnLabel: string
  fmt: (d: Date) => string
}) {
  const W = 720
  const H = 112
  const PAD = 16
  const t0 = Date.now()
  const t1 = t0 + 366 * 86_400_000
  const x = (ms: number) => PAD + ((ms - t0) / (t1 - t0)) * (W - PAD * 2)
  const months: Date[] = []
  const first = new Date(t0)
  for (let i = 1; i <= 12; i++) months.push(new Date(first.getFullYear(), first.getMonth() + i, 1))
  const inWindow = (w: { start: string }) => {
    const s = Date.parse(w.start)
    return s >= t0 - 86_400_000 && s <= t1
  }

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className={styles.vizSvgWide} role="img" aria-label={`${returnLabel}: ${returns.length}`}>
      <rect x={PAD} y={48} width={W - PAD * 2} height={26} rx={4} fill="var(--surface-2)" />
      {months.map(m => (
        <g key={m.getTime()}>
          <line x1={x(m.getTime())} x2={x(m.getTime())} y1={44} y2={80} stroke="var(--border-soft)" />
          <text x={x(m.getTime()) + 3} y={96} className={styles.vizAxis}>{monthLabel(m)}</text>
        </g>
      ))}
      {returns.filter(inWindow).map(r => {
        const a = Math.max(x(Date.parse(r.start)), PAD)
        const b = Math.min(x(Date.parse(r.end)), W - PAD)
        return (
          <rect key={r.start} x={a} y={50} width={Math.max(3, b - a)} height={22} rx={2} fill="var(--teal)">
            <title>{`${returnLabel}: ${fmt(new Date(r.start))}`}</title>
          </rect>
        )
      })}
      {birthdays.filter(inWindow).map(b => {
        const cx = x(Date.parse(b.start))
        return (
          <g key={b.start}>
            <line x1={cx} x2={cx} y1={22} y2={48} stroke="var(--gold)" strokeWidth={1.5} />
            <path d={`M${cx},${12} l7,7 l-7,7 l-7,-7 z`} fill="var(--gold)" />
            <text x={cx + 10} y={22} className={styles.vizAxisStrong}>{fmt(new Date(b.start))}</text>
            <title>{`${birthdayLabel}: ${fmt(new Date(b.start))}`}</title>
          </g>
        )
      })}
      <line x1={PAD} x2={PAD} y1={40} y2={82} stroke="var(--text-primary)" strokeWidth={2} />
    </svg>
  )
}

// ── 4. Latta ring ────────────────────────────────────────────

export function LattaRing({
  janmaNak,
  lagnaNak,
  lattas,
  labels,
}: {
  janmaNak: number
  lagnaNak: number
  lattas: LattaRow[]
  labels: NakLabels
}) {
  const uid = useId().replace(/:/g, '')
  const C = 200
  const R_OUT = 170
  const R_IN = 136
  const keyNaks = new Set([janmaNak, lagnaNak])
  const fill = (nak: number) =>
    nak === janmaNak
      ? 'color-mix(in srgb, var(--gold) 45%, var(--surface-2))'
      : nak === lagnaNak
        ? 'color-mix(in srgb, var(--teal) 30%, var(--surface-2))'
        : lattas.some(l => l.targetNak === nak)
          ? 'color-mix(in srgb, var(--rose) 16%, var(--surface-2))'
          : 'var(--surface-2)'

  return (
    <svg viewBox="0 0 400 400" className={styles.vizSvg} role="img" aria-label={lattas.map(l => `${labels.body(l.graha)} → ${labels.name(l.targetNak)}`).join(', ')}>
      <defs>
        <ArrowMarker id={`${uid}-m`} color="var(--text-muted)" />
        <ArrowMarker id={`${uid}-h`} color="var(--rose)" />
      </defs>
      <StarRing cx={C} cy={C} rOuter={R_OUT} rInner={R_IN} topNak={janmaNak} fill={fill} labels={labels} />
      {lattas.map((l, i) => {
        const hit = keyNaks.has(l.targetNak)
        const a0 = nakAngle(l.fromNak, janmaNak) + (i % 3 - 1) * 0.05
        const a1 = nakAngle(l.targetNak, janmaNak)
        const [x0, y0] = polar(C, C, R_IN - 20, a0)
        const [x1, y1] = polar(C, C, R_IN - 4, a1)
        // pull the curve toward the centre so it never hugs the ring
        const qx = C + ((x0 + x1) / 2 - C) * 0.3
        const qy = C + ((y0 + y1) / 2 - C) * 0.3
        return (
          <g key={l.graha}>
            <path
              d={`M${x0},${y0} Q${qx},${qy} ${x1},${y1}`}
              fill="none"
              stroke={hit ? 'var(--rose)' : 'var(--text-muted)'}
              strokeWidth={hit ? 2 : 1.25}
              strokeOpacity={hit ? 1 : 0.55}
              strokeDasharray={l.direction === 'backward' ? '4 3' : undefined}
              markerEnd={`url(#${uid}-${hit ? 'h' : 'm'})`}
            >
              <title>{`${labels.body(l.graha)}: ${labels.name(l.fromNak)} → ${labels.name(l.targetNak)}`}</title>
            </path>
            <circle cx={x0} cy={y0} r={9} fill="var(--surface-1)" stroke={hit ? 'var(--rose)' : 'var(--border)'} strokeWidth={1.5} />
            <text x={x0} y={y0} textAnchor="middle" dominantBaseline="central" className={styles.vizGlyph}>{glyph(l.graha)}</text>
          </g>
        )
      })}
    </svg>
  )
}

// ── 5. Sensitive-degree zodiac strip ─────────────────────────

const GANDANTA_CENTRES = [0, 120, 240]
const GANDANTA_HALF = 360 / 27 / 4 // one pada each side

export function DegreeStrip({
  rows,
  signShort,
  bodyName,
}: {
  rows: SensitiveDegreeRow[]
  signShort: (r: Rashi) => string
  bodyName: (id: NakBody) => string
}) {
  const W = 560
  const PAD = 10
  const x = (lon: number) => PAD + (lon / 360) * (W - PAD * 2)
  const BAND_Y = 64
  const BAND_H = 28

  // stagger labels of bodies closer than 7°
  const sorted = [...rows].sort((a, b) => a.lonSidereal - b.lonSidereal)
  const level = new Map<NakBody, number>()
  sorted.forEach((r, i) => {
    const prev = sorted[i - 1]
    const lv = prev && r.lonSidereal - prev.lonSidereal < 7 ? ((level.get(prev.body) ?? 0) + 1) % 3 : 0
    level.set(r.body, lv)
  })

  return (
    <svg viewBox={`0 0 ${W} 120`} className={styles.vizSvgWide} role="img" aria-label={rows.map(r => `${bodyName(r.body)} ${r.lonSidereal.toFixed(1)}°`).join(', ')}>
      <rect x={PAD} y={BAND_Y} width={W - PAD * 2} height={BAND_H} rx={4} fill="var(--surface-2)" />
      {/* gandanta zones (water→fire junctions) */}
      {GANDANTA_CENTRES.flatMap(c => {
        const spans: Array<[number, number]> = c === 0 ? [[0, GANDANTA_HALF], [360 - GANDANTA_HALF, 360]] : [[c - GANDANTA_HALF, c + GANDANTA_HALF]]
        return spans.map(([a, b]) => (
          <rect key={`${c}-${a}`} x={x(a)} y={BAND_Y} width={x(b) - x(a)} height={BAND_H} fill="var(--rose)" opacity={0.28} />
        ))
      })}
      {/* sign dividers + labels, nakshatra ticks */}
      {Array.from({ length: 27 }, (_, i) => (
        <line key={`n${i}`} x1={x((i * 360) / 27)} x2={x((i * 360) / 27)} y1={BAND_Y + BAND_H - 6} y2={BAND_Y + BAND_H} stroke="var(--border)" />
      ))}
      {Array.from({ length: 12 }, (_, i) => {
        const r = (i + 1) as Rashi
        return (
          <g key={`s${i}`}>
            <line x1={x(i * 30)} x2={x(i * 30)} y1={BAND_Y} y2={BAND_Y + BAND_H} stroke="var(--border)" />
            <text x={x(i * 30 + 15)} y={BAND_Y + 13} textAnchor="middle" dominantBaseline="central" className={styles.vizStripSign}>
              {signShort(r)}
            </text>
            {/* pushkara bhaga (teal) and mrityu bhaga (rose) ticks */}
            <line x1={x(i * 30 + PUSHKARA_BHAGA[r])} x2={x(i * 30 + PUSHKARA_BHAGA[r])} y1={BAND_Y + BAND_H} y2={BAND_Y + BAND_H + 7} stroke="var(--teal)" strokeWidth={2} />
            <line x1={x(i * 30 + MRITYU_BHAGA_DEGREES[r])} x2={x(i * 30 + MRITYU_BHAGA_DEGREES[r])} y1={BAND_Y + BAND_H} y2={BAND_Y + BAND_H + 7} stroke="var(--rose)" strokeWidth={2} />
          </g>
        )
      })}
      {/* bodies */}
      {rows.map(r => {
        const px = x(r.lonSidereal)
        const lv = level.get(r.body) ?? 0
        const ty = BAND_Y - 13 - lv * 19
        const flagged = r.flagCount > 0
        return (
          <g key={r.body}>
            <line x1={px} x2={px} y1={ty + 7} y2={BAND_Y + BAND_H} stroke={flagged ? 'var(--gold)' : 'var(--text-muted)'} strokeWidth={flagged ? 1.5 : 1} />
            <circle cx={px} cy={ty} r={9.5} fill="var(--surface-1)" stroke={flagged ? 'var(--gold)' : 'var(--border)'} strokeWidth={1.5} />
            <text x={px} y={ty} textAnchor="middle" dominantBaseline="central" className={styles.vizGlyphLg}>{glyph(r.body)}</text>
            <title>{`${bodyName(r.body)} · ${r.degreeInSign.toFixed(2)}° ${signShort(r.rashi)}`}</title>
          </g>
        )
      })}
    </svg>
  )
}
