// ─────────────────────────────────────────────────────────────
//  src/components/ui/HouseVisuals.tsx
//  House workspace visuals — Bhava Chalit wheel (Sripati houses
//  over the zodiac), Bhava Bala rose, Purushartha house grid,
//  and the per-house sandhi → madhya → sandhi position meter
// ─────────────────────────────────────────────────────────────
'use client'

import React, { useMemo } from 'react'
import type { BhavaBalaResult, GrahaData, Rashi } from '@/types/astrology'
import { RASHI_NAMES, RASHI_SHORT } from '@/types/astrology'
import { lordColor } from '@/components/dasha/dashaPalette'
import { arcPath, polar, VizCard, Legend } from '@/components/ui/viz'

const TAU = Math.PI * 2
const RAD = Math.PI / 180

function norm360(x: number): number {
  return ((x % 360) + 360) % 360
}

/** Forward distance from a to b along the zodiac (0–360). */
function span(a: number, b: number): number {
  return norm360(b - a)
}

export interface HouseVizDatum {
  houseNum: number
  madhya: number
  sandhiStart: number
  sandhiEnd: number
  rashi: Rashi
  planetsInHouse: GrahaData[]
  upagrahasInHouse: { id: string; lon: number }[]
}

// ── Bhava Chalit wheel ────────────────────────────────────────

/**
 * Lagna sits at 9 o'clock and the zodiac runs counter-clockwise, as on a
 * printed chart wheel. Outer band = signs (equal 30°), middle band = Sripati
 * bhavas (unequal, sandhi to sandhi), inner ring = planets at true longitude.
 */
export function BhavaChalitWheel({
  houses,
  grahas,
  ascDegree,
  ascRashi,
  selected,
  onSelect,
}: {
  houses: HouseVizDatum[]
  grahas: GrahaData[]
  ascDegree: number
  ascRashi: Rashi
  selected: number | null
  onSelect: (house: number) => void
}) {
  const S = 420
  const c = S / 2
  const R_SIGN_O = 200
  const R_SIGN_I = 176
  const R_HOUSE_O = 172
  const R_HOUSE_I = 128
  const R_PLANET = 104

  // Longitude → polar angle (0 = top, clockwise). Lagna → 9 o'clock (−π/2).
  const ang = (lon: number) => -Math.PI / 2 - span(ascDegree, lon) * RAD
  // Ring slice from lon a forward to lon b (counter-clockwise on screen).
  const slice = (a: number, b: number, rO: number, rI: number) => {
    const end = ang(a)
    return arcPath(c, c, rO, rI, end - span(a, b) * RAD, end)
  }

  const shifts = useMemo(
    () =>
      grahas
        .map((g) => {
          const ws = ((g.rashi - ascRashi + 12) % 12) + 1
          const h = houses.find((x) => x.planetsInHouse.some((p) => p.id === g.id))?.houseNum
          return h && h !== ws ? { id: g.id, from: ws, to: h } : null
        })
        .filter((x): x is { id: GrahaData['id']; from: number; to: number } => x !== null),
    [grahas, houses, ascRashi],
  )

  // Stagger planet glyphs that sit within 7° of each other.
  const placed = useMemo(() => {
    const sorted = [...grahas].sort((a, b) => span(ascDegree, a.lonSidereal) - span(ascDegree, b.lonSidereal))
    let prev = -999
    let tier = 0
    return sorted.map((g) => {
      const d = span(ascDegree, g.lonSidereal)
      tier = d - prev < 7 ? (tier + 1) % 3 : 0
      prev = d
      return { g, r: R_PLANET - tier * 22 }
    })
  }, [grahas, ascDegree])

  const shiftIds = new Set(shifts.map((s) => s.id))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
      <svg viewBox={`0 0 ${S} ${S}`} width="100%" style={{ maxWidth: S, display: 'block', margin: '0 auto' }} role="img" aria-label="Bhava Chalit wheel: Sripati houses over the zodiac">
        <defs>
          <radialGradient id="hv-core" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="var(--gold)" stopOpacity={0.12} />
            <stop offset="100%" stopColor="var(--gold)" stopOpacity={0} />
          </radialGradient>
        </defs>
        <circle cx={c} cy={c} r={R_SIGN_O + 6} fill="var(--surface-1)" stroke="var(--border)" />
        <circle cx={c} cy={c} r={R_HOUSE_I - 2} fill="url(#hv-core)" />

        {/* Sign band */}
        {Array.from({ length: 12 }, (_, i) => {
          const r = (i + 1) as Rashi
          const start = i * 30
          const [tx, ty] = polar(c, c, (R_SIGN_O + R_SIGN_I) / 2, ang(start + 15))
          const isAsc = r === ascRashi
          return (
            <g key={`s${r}`}>
              <path d={slice(start, start + 30, R_SIGN_O, R_SIGN_I)} fill={isAsc ? 'var(--gold-faint)' : i % 2 ? 'var(--surface-2)' : 'var(--surface-3)'} stroke="var(--border-soft)" />
              <text x={tx} y={ty} textAnchor="middle" dominantBaseline="middle" fontSize={10} fontWeight={700} fill={isAsc ? 'var(--text-gold)' : 'var(--text-muted)'}>
                {RASHI_SHORT[r]}
              </text>
            </g>
          )
        })}

        {/* Sripati houses */}
        {houses.map((h) => {
          const isSel = selected === h.houseNum
          const kendra = h.houseNum % 3 === 1
          const [tx, ty] = polar(c, c, (R_HOUSE_O + R_HOUSE_I) / 2, ang(h.madhya))
          return (
            <g key={`h${h.houseNum}`} onClick={() => onSelect(h.houseNum)} style={{ cursor: 'pointer' }}>
              <title>{`House ${h.houseNum} · ${RASHI_NAMES[h.rashi]} madhya · ${span(h.sandhiStart, h.sandhiEnd).toFixed(1)}° wide`}</title>
              <path
                d={slice(h.sandhiStart, h.sandhiEnd, R_HOUSE_O, R_HOUSE_I)}
                fill={isSel ? 'var(--gold)' : kendra ? 'var(--surface-3)' : 'var(--surface-2)'}
                fillOpacity={isSel ? 0.35 : 1}
                stroke={isSel ? 'var(--gold)' : 'var(--border)'}
                strokeWidth={isSel ? 1.6 : 0.8}
              />
              <text x={tx} y={ty} textAnchor="middle" dominantBaseline="middle" fontSize={15} fontWeight={700} fill={isSel ? 'var(--text-primary)' : kendra ? 'var(--text-gold)' : 'var(--text-secondary)'} style={{ fontFamily: 'var(--font-display)', pointerEvents: 'none' }}>
                {h.houseNum}
              </text>
            </g>
          )
        })}

        {/* Sandhi spokes + madhya ticks */}
        {houses.map((h) => {
          const [x0, y0] = polar(c, c, R_HOUSE_I - 10, ang(h.sandhiEnd))
          const [x1, y1] = polar(c, c, R_SIGN_O, ang(h.sandhiEnd))
          const [m0, m1] = [polar(c, c, R_HOUSE_O - 7, ang(h.madhya)), polar(c, c, R_HOUSE_O, ang(h.madhya))]
          return (
            <g key={`sp${h.houseNum}`} pointerEvents="none">
              <line x1={x0} y1={y0} x2={x1} y2={y1} stroke="var(--border-bright)" strokeWidth={0.8} strokeDasharray="2 2" />
              <line x1={m0[0]} y1={m0[1]} x2={m1[0]} y2={m1[1]} stroke="var(--gold)" strokeWidth={2} />
            </g>
          )
        })}

        {/* Lagna and MC axes */}
        {[{ lon: ascDegree, label: 'ASC' }, { lon: houses[9]?.madhya, label: 'MC' }].map((a) =>
          a.lon === undefined ? null : (() => {
            const [x0, y0] = polar(c, c, R_HOUSE_I - 4, ang(a.lon))
            const [x1, y1] = polar(c, c, R_SIGN_O + 6, ang(a.lon))
            const [lx, ly] = polar(c, c, R_HOUSE_I - 16, ang(a.lon))
            return (
              <g key={a.label} pointerEvents="none">
                <line x1={x0} y1={y0} x2={x1} y2={y1} stroke="var(--gold)" strokeWidth={1.8} />
                <text x={lx} y={ly} textAnchor="middle" dominantBaseline="middle" fontSize={9} fontWeight={800} fill="var(--gold)">
                  {a.label}
                </text>
              </g>
            )
          })(),
        )}

        {/* Planets */}
        {placed.map(({ g, r }) => {
          const a = ang(g.lonSidereal)
          const [px, py] = polar(c, c, r, a)
          const [tx, ty] = polar(c, c, R_HOUSE_I - 3, a)
          const col = lordColor(g.id)
          const shifted = shiftIds.has(g.id)
          return (
            <g key={g.id}>
              <title>{`${g.name} ${g.rashiName} ${g.degree.toFixed(1)}°${g.isRetro ? ' (R)' : ''}${shifted ? ' · changes house in Chalit' : ''}`}</title>
              <line x1={px} y1={py} x2={tx} y2={ty} stroke={col} strokeOpacity={0.45} strokeWidth={1} />
              <circle cx={tx} cy={ty} r={2} fill={col} />
              <circle cx={px} cy={py} r={11} fill="var(--surface-1)" stroke={col} strokeWidth={shifted ? 2.2 : 1.2} strokeDasharray={shifted ? '3 2' : undefined} />
              <text x={px} y={py} textAnchor="middle" dominantBaseline="central" fontSize={9.5} fontWeight={800} fill={col} style={{ fontFamily: 'var(--font-chart-planets)' }}>
                {g.id}
                {g.isRetro ? 'ᴿ' : ''}
              </text>
            </g>
          )
        })}

        {/* Upagrahas (Mandi / Gulika) */}
        {houses.flatMap((h) => h.upagrahasInHouse).map((u) => {
          const [ux, uy] = polar(c, c, R_HOUSE_I + 8, ang(u.lon))
          return (
            <g key={u.id}>
              <title>{u.id}</title>
              <rect x={ux - 4} y={uy - 4} width={8} height={8} transform={`rotate(45 ${ux} ${uy})`} fill="var(--rose)" />
            </g>
          )
        })}
      </svg>
      <Legend
        items={[
          { label: 'Madhya (house centre)', color: 'var(--gold)' },
          { label: 'Sandhi (junction)', color: 'var(--border-bright)', dashed: true },
          { label: 'Mandi / Gulika', color: 'var(--rose)' },
        ]}
      />
      {shifts.length > 0 ? (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', alignItems: 'center', fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
          <span style={{ color: 'var(--text-muted)' }}>Chalit shifts (dashed rings):</span>
          {shifts.map((s) => (
            <span key={s.id} style={{ padding: '2px 7px', borderRadius: 999, border: `1px solid ${lordColor(s.id)}`, color: lordColor(s.id), fontWeight: 700 }}>
              {s.id} H{s.from} → H{s.to}
            </span>
          ))}
        </div>
      ) : (
        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>No planet changes house between whole-sign and Sripati Chalit.</div>
      )}
    </div>
  )
}

// ── Bhava Bala rose ───────────────────────────────────────────

/** 12 equal wedges in house order; wedge length = Bhava Bala in rupas. */
export function HouseStrengthRose({
  bhavaBala,
  selected,
  onSelect,
}: {
  bhavaBala: BhavaBalaResult
  selected: number | null
  onSelect: (house: number) => void
}) {
  const S = 260
  const c = S / 2
  const R0 = 26
  const R1 = 108
  const rows = Array.from({ length: 12 }, (_, i) => bhavaBala.houses[i + 1]).filter(Boolean)
  const max = Math.max(1, ...rows.map((h) => h.totalRupa))
  const step = TAU / 12
  // House 1 at 9 o'clock, counter-clockwise — same orientation as the wheel.
  const a0 = (h: number) => -Math.PI / 2 - h * step

  return (
    <svg viewBox={`0 0 ${S} ${S}`} width="100%" style={{ maxWidth: S, display: 'block', margin: '0 auto' }} role="img" aria-label="Bhava Bala by house">
      {[0.5, 1].map((p) => (
        <circle key={p} cx={c} cy={c} r={R0 + (R1 - R0) * p} fill="none" stroke="var(--border-soft)" strokeDasharray={p === 1 ? undefined : '2 3'} />
      ))}
      {rows.map((h) => {
        const r = R0 + (R1 - R0) * (h.totalRupa / max)
        const end = a0(h.house - 1) + step / 2
        const start = end - step
        const isSel = selected === h.house
        const color = h.house === bhavaBala.strongestHouse ? 'var(--teal)' : h.house === bhavaBala.weakestHouse ? 'var(--rose)' : h.isStrong ? 'var(--gold)' : 'var(--accent)'
        const [lx, ly] = polar(c, c, R1 + 12, end - step / 2)
        return (
          <g key={h.house} onClick={() => onSelect(h.house)} style={{ cursor: 'pointer' }}>
            <title>{`House ${h.house}: ${h.totalRupa.toFixed(2)} rupa${h.isStrong ? ' · strong' : ''}`}</title>
            <path d={arcPath(c, c, R1, R0, start + 0.03, end - 0.03)} fill="var(--surface-2)" />
            <path d={arcPath(c, c, r, R0, start + 0.03, end - 0.03)} fill={color} fillOpacity={isSel ? 1 : 0.75} stroke={isSel ? 'var(--text-primary)' : 'none'} />
            <text x={lx} y={ly} textAnchor="middle" dominantBaseline="middle" fontSize={9.5} fontWeight={isSel ? 800 : 600} fill={isSel ? 'var(--text-primary)' : 'var(--text-muted)'}>
              {h.house}
            </text>
          </g>
        )
      })}
      <text x={c} y={c} textAnchor="middle" dominantBaseline="middle" fontSize={9} fill="var(--text-muted)">
        rupa
      </text>
    </svg>
  )
}

// ── Purushartha grid ──────────────────────────────────────────

const PURUSHARTHA: { id: string; label: string; houses: number[]; color: string }[] = [
  { id: 'dharma', label: 'Dharma', houses: [1, 5, 9], color: 'var(--amber)' },
  { id: 'artha', label: 'Artha', houses: [2, 6, 10], color: 'var(--gold)' },
  { id: 'kama', label: 'Kama', houses: [3, 7, 11], color: 'var(--accent)' },
  { id: 'moksha', label: 'Moksha', houses: [4, 8, 12], color: 'var(--teal)' },
]

const GROUPS: { label: string; houses: number[] }[] = [
  { label: 'Kendra', houses: [1, 4, 7, 10] },
  { label: 'Trikona', houses: [1, 5, 9] },
  { label: 'Upachaya', houses: [3, 6, 10, 11] },
  { label: 'Dusthana', houses: [6, 8, 12] },
]

/** Four aims of life × three houses each, with occupants and group counts. */
export function PurusharthaGrid({
  houses,
  bhavaBala,
  selected,
  onSelect,
}: {
  houses: HouseVizDatum[]
  bhavaBala?: BhavaBalaResult | null
  selected: number | null
  onSelect: (house: number) => void
}) {
  const occ = (n: number) => houses.find((h) => h.houseNum === n)?.planetsInHouse ?? []
  const max = bhavaBala ? Math.max(1, ...Object.values(bhavaBala.houses).map((h) => h.totalRupa)) : 1

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.7rem' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'auto repeat(3, minmax(0, 1fr)) auto', gap: 4, alignItems: 'stretch' }}>
        {PURUSHARTHA.map((row) => {
          const count = row.houses.reduce((s, n) => s + occ(n).length, 0)
          return (
            <React.Fragment key={row.id}>
              <span style={{ alignSelf: 'center', fontSize: '0.68rem', fontWeight: 800, color: row.color, paddingRight: 4 }}>{row.label}</span>
              {row.houses.map((n) => {
                const planets = occ(n)
                const bb = bhavaBala?.houses[n]
                const isSel = selected === n
                return (
                  <button
                    key={n}
                    type="button"
                    onClick={() => onSelect(n)}
                    title={`House ${n}${bb ? ` · ${bb.totalRupa.toFixed(2)} rupa` : ''}`}
                    style={{
                      position: 'relative',
                      minHeight: 46,
                      padding: '4px 6px',
                      borderRadius: 6,
                      cursor: 'pointer',
                      textAlign: 'left',
                      background: 'var(--surface-2)',
                      border: `1px solid ${isSel ? 'var(--gold)' : 'var(--border-soft)'}`,
                      overflow: 'hidden',
                      color: 'var(--text-primary)',
                    }}
                  >
                    {bb && (
                      <span
                        aria-hidden
                        style={{ position: 'absolute', left: 0, bottom: 0, height: 3, width: `${(bb.totalRupa / max) * 100}%`, background: row.color, opacity: 0.8 }}
                      />
                    )}
                    <span style={{ fontSize: '0.8rem', fontWeight: 800, fontFamily: 'var(--font-display)' }}>{n}</span>
                    <span style={{ display: 'flex', flexWrap: 'wrap', gap: 3, marginTop: 2 }}>
                      {planets.map((p) => (
                        <span key={p.id} style={{ fontSize: '0.62rem', fontWeight: 800, color: lordColor(p.id), fontFamily: 'var(--font-chart-planets)' }}>
                          {p.id}
                        </span>
                      ))}
                    </span>
                  </button>
                )
              })}
              <span style={{ alignSelf: 'center', fontSize: '0.66rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', paddingLeft: 4 }}>{count}</span>
            </React.Fragment>
          )
        })}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 4 }}>
        {GROUPS.map((g) => {
          const count = g.houses.reduce((s, n) => s + occ(n).length, 0)
          return (
            <div key={g.label} style={{ padding: '5px 6px', borderRadius: 6, background: 'var(--surface-2)', textAlign: 'center' }}>
              <div style={{ fontSize: '1rem', fontWeight: 700, fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>{count}</div>
              <div style={{ fontSize: '0.58rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{g.label}</div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Per-house position meter ──────────────────────────────────

/**
 * Sandhi → Madhya → Sandhi strip with each occupant placed by longitude.
 * A planet near the madhya gives the house's results fully; near a sandhi
 * it is weak and partly carries into the neighbouring house.
 */
export function SandhiMeter({ house }: { house: HouseVizDatum }) {
  const total = span(house.sandhiStart, house.sandhiEnd) || 1
  const madhyaAt = span(house.sandhiStart, house.madhya) / total
  const items = [
    ...house.planetsInHouse.map((p) => ({ id: p.id as string, lon: p.lonSidereal, color: lordColor(p.id) })),
    ...house.upagrahasInHouse.map((u) => ({ id: u.id === 'Maandi' ? 'Md' : 'Gk', lon: u.lon, color: 'var(--rose)' })),
  ]
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.58rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>
        <span>Sandhi</span>
        <span style={{ color: 'var(--text-gold)' }}>Madhya</span>
        <span>Sandhi</span>
      </div>
      <div
        style={{
          position: 'relative',
          height: 14,
          borderRadius: 7,
          background: `linear-gradient(90deg, var(--surface-3) 0%, var(--gold-faint) ${madhyaAt * 100}%, var(--surface-3) 100%)`,
          border: '1px solid var(--border-soft)',
        }}
      >
        <span aria-hidden style={{ position: 'absolute', left: `${madhyaAt * 100}%`, top: -3, bottom: -3, width: 2, background: 'var(--gold)', transform: 'translateX(-1px)' }} />
        {items.map((it, i) => {
          const at = span(house.sandhiStart, it.lon) / total
          const half = at <= madhyaAt ? madhyaAt : 1 - madhyaAt
          const strength = Math.max(0, 1 - Math.abs(at - madhyaAt) / (half || 1))
          return (
            <span
              key={it.id}
              title={`${it.id}: ${(strength * 100).toFixed(0)}% towards the madhya`}
              style={{
                position: 'absolute',
                left: `${Math.min(100, Math.max(0, at * 100))}%`,
                top: i % 2 ? 9 : -9,
                transform: 'translateX(-50%)',
                fontSize: '0.6rem',
                fontWeight: 800,
                lineHeight: 1,
                padding: '1px 3px',
                borderRadius: 3,
                background: 'var(--surface-1)',
                border: `1px solid ${it.color}`,
                color: it.color,
                fontFamily: 'var(--font-chart-planets)',
                whiteSpace: 'nowrap',
              }}
            >
              {it.id}
            </span>
          )
        })}
      </div>
      <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)', marginTop: items.length ? 12 : 4, fontFamily: 'var(--font-mono)' }}>
        {total.toFixed(1)}° wide{total > 34 ? ' · expanded' : total < 26 ? ' · compressed' : ''}
      </div>
    </div>
  )
}

/** Overview block placed above the house cards. */
export function HouseVisualsOverview({
  houses,
  grahas,
  ascDegree,
  ascRashi,
  bhavaBala,
  selected,
  onSelect,
}: {
  houses: HouseVizDatum[]
  grahas: GrahaData[]
  ascDegree: number
  ascRashi: Rashi
  bhavaBala?: BhavaBalaResult | null
  selected: number | null
  onSelect: (house: number) => void
}) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 340px), 1fr))', gap: '1rem', alignItems: 'start' }}>
      <VizCard
        title="Bhava Chalit wheel"
        caption="Signs on the outside, Sripati houses (sandhi to sandhi) inside them. Houses stretch or shrink with your latitude. Tap a house to jump to it."
        style={{ gridRow: 'span 2' }}
      >
        <BhavaChalitWheel houses={houses} grahas={grahas} ascDegree={ascDegree} ascRashi={ascRashi} selected={selected} onSelect={onSelect} />
      </VizCard>
      {bhavaBala && (
        <VizCard
          title="House strength (Bhava Bala)"
          caption={`Longer wedge = stronger house. Strongest H${bhavaBala.strongestHouse}, weakest H${bhavaBala.weakestHouse}.`}
          legend={[
            { label: 'Strongest', color: 'var(--teal)' },
            { label: 'Strong', color: 'var(--gold)' },
            { label: 'Below par', color: 'var(--accent)' },
            { label: 'Weakest', color: 'var(--rose)' },
          ]}
        >
          <HouseStrengthRose bhavaBala={bhavaBala} selected={selected} onSelect={onSelect} />
        </VizCard>
      )}
      <VizCard title="Aims of life" caption="Dharma, Artha, Kama and Moksha triads with their occupants; the bar under each house is its Bhava Bala.">
        <PurusharthaGrid houses={houses} bhavaBala={bhavaBala} selected={selected} onSelect={onSelect} />
      </VizCard>
    </div>
  )
}
