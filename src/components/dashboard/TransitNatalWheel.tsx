// ─────────────────────────────────────────────────────────────
//  src/components/dashboard/TransitNatalWheel.tsx
//  Bi-wheel: transit grahas / lagnas / upagrahas (outer ring)
//  over natal grahas / lagnas / upagrahas (inner ring), with
//  conjunction contacts inside a chosen orb
// ─────────────────────────────────────────────────────────────
'use client'

import React, { useMemo, useState } from 'react'
import type { ChartOutput, Rashi } from '@/types/astrology'
import { RASHI_NAMES, RASHI_SHORT } from '@/types/astrology'
import { buildPointGroups, type PointKind } from './transitPoints'
import styles from './transit-scrubber.module.css'

const SIZE = 600
const C = SIZE / 2

// Ring radii (outer → inner)
const R_EDGE = 296
const R_SIGN = 272      // inner edge of the sign band
const R_SPLIT = 186     // boundary between transit (outside) and natal (inside)
const R_CORE = 86       // inner edge of the natal ring
const TRANSIT_TRACKS = [204, 226, 248, 262]
const NATAL_TRACKS = [168, 147, 126, 106]

const ORB_OPTIONS = [1, 2, 3, 5, 8]

const KIND_LABEL: Record<PointKind, string> = {
  graha: 'Grahas',
  lagna: 'Lagnas',
  upagraha: 'Upagrahas',
}

type Ring = 'natal' | 'transit'

interface WheelPoint {
  id: string
  ring: Ring
  kind: PointKind
  code: string
  label: string
  lon: number
  retro: boolean
  rashi: Rashi
  degree: number
  nakshatraName: string
  pada: number
}

interface PlacedPoint extends WheelPoint {
  r: number
}

interface Contact {
  id: string
  transit: WheelPoint
  natal: WheelPoint
  orb: number
}

const RING_COLOR: Record<Ring, string> = {
  natal: 'var(--text-gold)',
  transit: 'var(--accent, #8b7cf6)',
}

function angDist(a: number, b: number): number {
  const d = Math.abs(a - b) % 360
  return d > 180 ? 360 - d : d
}

function fmtDeg(deg: number): string {
  const d = Math.floor(deg)
  const m = Math.floor((deg - d) * 60)
  return `${d}°${String(m).padStart(2, '0')}'`
}

function houseOf(rashi: Rashi, ascRashi: Rashi): number {
  return ((rashi - ascRashi + 12) % 12) + 1
}

function labelText(p: WheelPoint): string {
  return p.retro ? `${p.code}℞` : p.code
}

function labelFontSize(p: WheelPoint): number {
  return p.kind === 'graha' ? 15 : p.kind === 'lagna' ? 13.5 : 12.5
}

/** Approximate label width in px for a mono label. */
function labelWidth(p: WheelPoint): number {
  return labelText(p).length * labelFontSize(p) * 0.62 + 4
}

/**
 * Keep every label at its true longitude and resolve overlaps by moving
 * crowded labels onto the next radial track.
 */
function placeOnTracks(points: WheelPoint[], tracks: number[]): PlacedPoint[] {
  const placed: PlacedPoint[] = []
  const byTrack: PlacedPoint[][] = tracks.map(() => [])
  const sorted = [...points].sort((a, b) => a.lon - b.lon)

  for (const p of sorted) {
    let best = { track: 0, clearance: -Infinity }
    for (let t = 0; t < tracks.length; t++) {
      const r = tracks[t]
      let clearance = Infinity
      for (const q of byTrack[t]) {
        const needDeg = ((labelWidth(p) + labelWidth(q)) / 2 / r) * (180 / Math.PI)
        clearance = Math.min(clearance, angDist(p.lon, q.lon) - needDeg)
      }
      if (clearance >= 0) { best = { track: t, clearance }; break }
      if (clearance > best.clearance) best = { track: t, clearance }
    }
    const pp = { ...p, r: tracks[best.track] }
    byTrack[best.track].push(pp)
    placed.push(pp)
  }
  return placed
}

interface TransitNatalWheelProps {
  natalChart: ChartOutput
  transitChart: ChartOutput | null
}

export function TransitNatalWheel({ natalChart, transitChart }: TransitNatalWheelProps) {
  const [layers, setLayers] = useState<Record<PointKind, boolean>>({ graha: true, lagna: true, upagraha: true })
  const [orb, setOrb] = useState(3)
  const [focus, setFocus] = useState<string | null>(null)

  const ascLon = natalChart.lagnas.ascDegree
  const ascRashi = natalChart.lagnas.ascRashi

  // Natal lagna sits at 9 o'clock; zodiac runs counter-clockwise.
  const xy = (r: number, lon: number): [number, number] => {
    const th = Math.PI + ((lon - ascLon) * Math.PI) / 180
    return [C + r * Math.cos(th), C - r * Math.sin(th)]
  }

  const { natalPts, transitPts } = useMemo(() => {
    const natal: WheelPoint[] = []
    const transit: WheelPoint[] = []
    for (const group of buildPointGroups(natalChart, transitChart)) {
      if (!layers[group.kind]) continue
      for (const row of group.rows) {
        const nodeRetro = row.grahaId === 'Ra' || row.grahaId === 'Ke'
        for (const [ring, pos, out] of [
          ['natal', row.natal, natal],
          ['transit', row.transit, transit],
        ] as const) {
          if (!pos) continue
          out.push({
            id: `${ring}-${row.key}`,
            ring,
            kind: group.kind,
            code: row.code,
            label: row.label,
            lon: pos.lon,
            retro: Boolean(pos.isRetro) && !nodeRetro,
            rashi: pos.rashi,
            degree: pos.degree,
            nakshatraName: pos.nakshatraName,
            pada: pos.pada,
          })
        }
      }
    }
    return { natalPts: natal, transitPts: transit }
  }, [natalChart, transitChart, layers])

  const placedNatal = useMemo(() => placeOnTracks(natalPts, NATAL_TRACKS), [natalPts])
  const placedTransit = useMemo(() => placeOnTracks(transitPts, TRANSIT_TRACKS), [transitPts])

  const contacts = useMemo(() => {
    const list: Contact[] = []
    for (const t of transitPts) {
      for (const n of natalPts) {
        const d = angDist(t.lon, n.lon)
        if (d <= orb) list.push({ id: `${t.id}|${n.id}`, transit: t, natal: n, orb: d })
      }
    }
    return list.sort((a, b) => a.orb - b.orb)
  }, [transitPts, natalPts, orb])

  const contactPointIds = useMemo(() => {
    const ids = new Set<string>()
    for (const c of contacts) { ids.add(c.transit.id); ids.add(c.natal.id) }
    return ids
  }, [contacts])

  const focusedIds = useMemo(() => {
    if (!focus) return null
    const ids = new Set<string>([focus])
    for (const c of contacts) {
      if (c.id === focus) { ids.add(c.transit.id); ids.add(c.natal.id) }
      if (c.transit.id === focus) ids.add(c.natal.id)
      if (c.natal.id === focus) ids.add(c.transit.id)
    }
    return ids
  }, [focus, contacts])

  const isContactFocused = (c: Contact) =>
    focus === c.id || focus === c.transit.id || focus === c.natal.id

  const placedById = useMemo(() => {
    const m = new Map<string, PlacedPoint>()
    for (const p of [...placedNatal, ...placedTransit]) m.set(p.id, p)
    return m
  }, [placedNatal, placedTransit])

  const describe = (p: WheelPoint) =>
    `${p.ring === 'natal' ? 'Natal' : 'Transit'} ${p.label} — ${RASHI_NAMES[p.rashi]} ${fmtDeg(p.degree)} · ${p.nakshatraName} P${p.pada} · H${houseOf(p.rashi, ascRashi)}${p.retro ? ' · retrograde' : ''}`

  const renderMarker = (p: PlacedPoint) => {
    const tickR = p.ring === 'natal' ? R_SPLIT - 6 : R_SPLIT + 6
    const [mx, my] = xy(tickR, p.lon)
    const [lx, ly] = xy(p.r, p.lon)
    const [ex, ey] = xy(R_SPLIT, p.lon)
    const color = RING_COLOR[p.ring]
    const dimmed = focusedIds ? !focusedIds.has(p.id) : false
    const inContact = contactPointIds.has(p.id)
    const fontSize = labelFontSize(p)

    let marker: React.ReactNode
    if (p.kind === 'graha') {
      marker = <circle cx={mx} cy={my} r={3.4} fill={color} />
    } else if (p.kind === 'lagna') {
      marker = (
        <rect
          x={mx - 3} y={my - 3} width={6} height={6}
          fill={color}
          transform={`rotate(45 ${mx} ${my})`}
        />
      )
    } else {
      marker = <circle cx={mx} cy={my} r={3} fill="var(--surface-2)" stroke={color} strokeWidth={1.3} />
    }

    return (
      <g
        key={p.id}
        opacity={dimmed ? 0.18 : 1}
        style={{ cursor: 'pointer', transition: 'opacity 0.15s' }}
        onMouseEnter={() => setFocus(p.id)}
        onMouseLeave={() => setFocus(null)}
        onClick={() => setFocus(prev => (prev === p.id ? null : p.id))}
      >
        <title>{describe(p)}</title>
        <line x1={ex} y1={ey} x2={mx} y2={my} stroke={color} strokeWidth={1.2} />
        <line x1={mx} y1={my} x2={lx} y2={ly} stroke={color} strokeWidth={0.6} strokeOpacity={0.35} />
        {marker}
        {inContact && (
          <rect
            x={lx - labelWidth(p) / 2 - 3} y={ly - fontSize / 2 - 3}
            width={labelWidth(p) + 6} height={fontSize + 6} rx={4}
            fill="none" stroke="var(--rose)" strokeWidth={1.2} strokeOpacity={0.7}
          />
        )}
        <text
          x={lx} y={ly}
          textAnchor="middle" dominantBaseline="central"
          fontSize={fontSize}
          fontWeight={p.kind === 'graha' ? 700 : p.kind === 'lagna' ? 600 : 500}
          fontStyle={p.kind === 'lagna' ? 'italic' : 'normal'}
          fill={p.kind === 'upagraha' ? 'var(--text-secondary)' : color}
          style={{ fontFamily: 'var(--font-mono)', paintOrder: 'stroke', stroke: 'var(--surface-1, var(--bg))', strokeWidth: 3 }}
        >
          {labelText(p)}
        </text>
      </g>
    )
  }

  const toggleLayer = (k: PointKind) => setLayers(prev => ({ ...prev, [k]: !prev[k] }))

  return (
    <div className={styles.compareSection}>
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem', marginBottom: '0.9rem' }}>
        <h3 className={styles.compareTitle} style={{ margin: 0 }}>Transit over natal — bi-wheel</h3>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.4rem' }}>
          {(Object.keys(KIND_LABEL) as PointKind[]).map(k => (
            <button
              key={k}
              type="button"
              aria-pressed={layers[k]}
              onClick={() => toggleLayer(k)}
              className="btn btn-ghost"
              style={{
                padding: '0.22rem 0.6rem',
                fontSize: '0.7rem',
                borderColor: layers[k] ? 'var(--gold)' : 'var(--border-soft)',
                color: layers[k] ? 'var(--text-gold)' : 'var(--text-muted)',
                background: layers[k] ? 'var(--gold-faint)' : 'transparent',
              }}
            >
              {KIND_LABEL[k]}
            </button>
          ))}
          <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.7rem', color: 'var(--text-muted)', marginLeft: '0.25rem' }}>
            Orb
            <select
              value={orb}
              onChange={e => setOrb(Number(e.target.value))}
              className={styles.dashaSelectCompact}
              aria-label="Conjunction orb in degrees"
            >
              {ORB_OPTIONS.map(o => <option key={o} value={o}>{o}°</option>)}
            </select>
          </label>
        </div>
      </div>

      <div className={styles.wheelLayout}>
        <div>
          <svg
            viewBox={`0 0 ${SIZE} ${SIZE}`}
            role="img"
            aria-label="Bi-wheel with natal points on the inner ring and transit points on the outer ring"
            style={{ width: '100%', maxWidth: 640, display: 'block', margin: '0 auto' }}
          >
            {/* Rings */}
            <circle cx={C} cy={C} r={R_EDGE} fill="var(--surface-2)" stroke="var(--border-soft)" />
            <circle cx={C} cy={C} r={R_SIGN} fill="var(--surface-1, var(--surface-2))" stroke="var(--border-soft)" />
            <circle cx={C} cy={C} r={R_SIGN} fill="var(--accent, #8b7cf6)" fillOpacity={0.06} />
            <circle cx={C} cy={C} r={R_SPLIT} fill="var(--surface-1, var(--surface-2))" stroke="var(--border)" strokeWidth={1.4} />
            <circle cx={C} cy={C} r={R_SPLIT} fill="var(--gold)" fillOpacity={0.1} />
            <circle cx={C} cy={C} r={R_CORE} fill="var(--surface-3)" stroke="var(--border-soft)" />

            {/* Sign / whole-sign house divisions */}
            {Array.from({ length: 12 }, (_, i) => {
              const sign = (i + 1) as Rashi
              const start = i * 30
              const [x1, y1] = xy(R_CORE, start)
              const [x2, y2] = xy(R_EDGE, start)
              const [sx, sy] = xy((R_EDGE + R_SIGN) / 2, start + 15)
              const [hx, hy] = xy(R_CORE - 20, start + 15)
              const house = houseOf(sign, ascRashi)
              return (
                <g key={sign}>
                  <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="var(--border-soft)" />
                  <text
                    x={sx} y={sy} textAnchor="middle" dominantBaseline="central"
                    fontSize={14} fontWeight={700}
                    fill={house === 1 ? 'var(--text-gold)' : 'var(--text-secondary)'}
                    style={{ fontFamily: 'var(--font-mono)' }}
                  >
                    {RASHI_SHORT[sign]}
                  </text>
                  <text
                    x={hx} y={hy} textAnchor="middle" dominantBaseline="central"
                    fontSize={11} fontWeight={house === 1 ? 800 : 600}
                    fill={house === 1 ? 'var(--text-gold)' : 'var(--text-muted)'}
                    style={{ fontFamily: 'var(--font-mono)' }}
                  >
                    H{house}
                  </text>
                </g>
              )
            })}

            {/* Natal lagna axis */}
            {(() => {
              const [ax, ay] = xy(R_EDGE, ascLon)
              const [bx, by] = xy(R_CORE, ascLon)
              return <line x1={bx} y1={by} x2={ax} y2={ay} stroke="var(--gold)" strokeWidth={1.4} strokeDasharray="4 3" />
            })()}

            {/* Conjunction links */}
            {contacts.map(c => {
              const t = placedById.get(c.transit.id)
              const n = placedById.get(c.natal.id)
              if (!t || !n) return null
              const [tx, ty] = xy(t.r, t.lon)
              const [nx, ny] = xy(n.r, n.lon)
              const active = isContactFocused(c)
              return (
                <line
                  key={c.id}
                  x1={tx} y1={ty} x2={nx} y2={ny}
                  stroke="var(--rose)"
                  strokeWidth={active ? 2 : 1.3}
                  strokeOpacity={focus ? (active ? 0.95 : 0.08) : 0.6}
                  strokeDasharray="3 2"
                />
              )
            })}

            {placedNatal.map(renderMarker)}
            {placedTransit.map(renderMarker)}

            {/* Center caption */}
            <text x={C} y={C - 7} textAnchor="middle" fontSize={10} fill="var(--text-gold)" style={{ fontFamily: 'var(--font-mono)' }}>
              inner · natal
            </text>
            <text x={C} y={C + 9} textAnchor="middle" fontSize={10} fill={RING_COLOR.transit} style={{ fontFamily: 'var(--font-mono)' }}>
              outer · transit
            </text>
          </svg>

          {/* Legend */}
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '0.9rem', marginTop: '0.6rem', fontSize: '0.68rem', color: 'var(--text-muted)' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
              <svg width={10} height={10} aria-hidden><circle cx={5} cy={5} r={3.4} fill="var(--text-muted)" /></svg>Graha
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
              <svg width={10} height={10} aria-hidden><rect x={2} y={2} width={6} height={6} fill="var(--text-muted)" transform="rotate(45 5 5)" /></svg>Lagna
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
              <svg width={10} height={10} aria-hidden><circle cx={5} cy={5} r={3} fill="none" stroke="var(--text-muted)" strokeWidth={1.3} /></svg>Upagraha
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
              <svg width={16} height={10} aria-hidden><line x1={1} y1={5} x2={15} y2={5} stroke="var(--rose)" strokeDasharray="3 2" /></svg>Within {orb}°
            </span>
          </div>
        </div>

        {/* Contacts list */}
        <div>
          <div style={{ fontSize: '0.62rem', fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
            Transit contacts on natal points · {contacts.length}
          </div>
          {!transitChart ? (
            <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>Calculating transit…</p>
          ) : contacts.length === 0 ? (
            <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              No transit point is within {orb}° of a natal point. Widen the orb to see near contacts.
            </p>
          ) : (
            <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: '0.3rem', maxHeight: 520, overflowY: 'auto' }}>
              {contacts.map(c => {
                const active = isContactFocused(c)
                return (
                  <li
                    key={c.id}
                    onMouseEnter={() => setFocus(c.id)}
                    onMouseLeave={() => setFocus(null)}
                    style={{
                      display: 'flex',
                      alignItems: 'baseline',
                      justifyContent: 'space-between',
                      gap: '0.5rem',
                      padding: '0.4rem 0.55rem',
                      borderRadius: 'var(--r-md, 6px)',
                      border: `1px solid ${active ? 'var(--rose)' : 'var(--border-soft)'}`,
                      background: active ? 'var(--surface-3)' : 'transparent',
                      fontSize: '0.74rem',
                      cursor: 'default',
                    }}
                  >
                    <span style={{ minWidth: 0 }}>
                      <span style={{ color: RING_COLOR.transit, fontWeight: 700 }}>{c.transit.label}</span>
                      <span style={{ color: 'var(--text-muted)' }}> ☌ natal </span>
                      <span style={{ color: RING_COLOR.natal, fontWeight: 700 }}>{c.natal.label}</span>
                      <span style={{ display: 'block', fontSize: '0.66rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                        {RASHI_SHORT[c.transit.rashi]} {fmtDeg(c.transit.degree)} → {RASHI_SHORT[c.natal.rashi]} {fmtDeg(c.natal.degree)} · H{houseOf(c.natal.rashi, ascRashi)}
                      </span>
                    </span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: c.orb <= 1 ? 'var(--rose)' : 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                      {fmtDeg(c.orb)}
                    </span>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </div>

      <p style={{ margin: '0.85rem 0 0', fontSize: '0.72rem', color: 'var(--text-muted)', lineHeight: 1.45 }}>
        Wheel is fixed to your <strong>natal lagna</strong> (dashed line, left); houses are whole-sign. Hover any point or contact to isolate it.
        Transit lagnas and Gulika/Maandi move fast — scrub the time to watch them cross natal points.
      </p>
    </div>
  )
}
