'use client'
// ─────────────────────────────────────────────────────────────
//  src/components/ui/NakshatraWheel.tsx
//  Circular chart of all 27 nakshatras, with planets and the birth Moon
// ─────────────────────────────────────────────────────────────

import React, { useMemo, useState } from 'react'
import {
  GRAHA_NAMES,
  NAKSHATRA_NAMES,
  NAKSHATRA_SHORT,
  RASHI_NAMES,
  RASHI_SHORT,
} from '@/types/astrology'
import type { GrahaId, Rashi } from '@/types/astrology'
import { getNakshatraCharacteristics } from '@/lib/engine/nakshatraAdvanced'
import { cn } from '@/lib/ui/cn'
import styles from './NakshatraWheel.module.css'

export type NakshatraMarker = {
  id: string
  nakshatraIndex: number
  pada: number
}

const CX = 220
const CY = 220
const SPAN = 360 / 27
const STAR_INNER = 118
const STAR_OUTER = 172
const SIGN_INNER = 74
const SIGN_OUTER = 116
const LABEL_R = 190
const HUB_R = 72

function pt(deg: number, r: number): [number, number] {
  const rad = ((deg - 90) * Math.PI) / 180
  return [CX + r * Math.cos(rad), CY + r * Math.sin(rad)]
}

function ringSlice(rInner: number, rOuter: number, a0: number, a1: number): string {
  const large = a1 - a0 > 180 ? 1 : 0
  const [ox0, oy0] = pt(a0, rOuter)
  const [ox1, oy1] = pt(a1, rOuter)
  const [ix1, iy1] = pt(a1, rInner)
  const [ix0, iy0] = pt(a0, rInner)
  return `M ${ox0} ${oy0} A ${rOuter} ${rOuter} 0 ${large} 1 ${ox1} ${oy1} L ${ix1} ${iy1} A ${rInner} ${rInner} 0 ${large} 0 ${ix0} ${iy0} Z`
}

function upright(mid: number): number {
  return mid > 90 && mid < 270 ? mid + 180 : mid
}

function signsFor(index: number): string {
  const start = index * SPAN
  const end = start + SPAN - 1e-6
  const a = ((Math.floor(start / 30) % 12) + 1) as Rashi
  const b = ((Math.floor(end / 30) % 12) + 1) as Rashi
  return a === b ? RASHI_NAMES[a] : `${RASHI_NAMES[a]} · ${RASHI_NAMES[b]}`
}

function markerName(id: string): string {
  if (id === 'As') return 'Lagna'
  return GRAHA_NAMES[id as GrahaId] ?? id
}

function markerRank(id: string): number {
  if (id === 'Mo') return 0
  if (id === 'As') return 1
  return 2
}

export function NakshatraWheel({
  birthIndex,
  birthPada,
  markers,
}: {
  birthIndex: number
  birthPada: number
  markers: NakshatraMarker[]
}) {
  const [selected, setSelected] = useState(birthIndex)
  const active = ((selected % 27) + 27) % 27
  const chars = useMemo(() => {
    const pada = active === birthIndex ? birthPada : (markers.find(m => m.nakshatraIndex === active)?.pada ?? 1)
    return getNakshatraCharacteristics(active, pada)
  }, [active, birthIndex, birthPada, markers])

  const byStar = useMemo(() => {
    const map = new Map<number, NakshatraMarker[]>()
    for (const marker of markers) {
      const list = map.get(marker.nakshatraIndex) ?? []
      list.push(marker)
      map.set(marker.nakshatraIndex, list)
    }
    for (const list of map.values()) list.sort((a, b) => markerRank(a.id) - markerRank(b.id))
    return map
  }, [markers])

  const here = byStar.get(active) ?? []
  const hubPada = active === birthIndex ? birthPada : here[0]?.pada

  return (
    <div className={styles.wrap}>
      <svg className={styles.wheel} viewBox="0 0 440 440" role="group" aria-label="All 27 nakshatras, clockwise from Ashwini">
        {Array.from({ length: 12 }, (_, i) => {
          const a0 = i * 30
          const mid = a0 + 15
          const [lx, ly] = pt(mid, (SIGN_INNER + SIGN_OUTER) / 2)
          return (
            <g key={RASHI_SHORT[(i + 1) as Rashi]}>
              <path d={ringSlice(SIGN_INNER, SIGN_OUTER, a0, a0 + 30)} className={cn(styles.rashi, i % 2 === 0 ? styles.rashiA : styles.rashiB)} />
              <text
                className={styles.signLabel}
                x={lx}
                y={ly}
                textAnchor="middle"
                dominantBaseline="middle"
                transform={`rotate(${upright(mid)} ${lx} ${ly})`}
              >
                {RASHI_SHORT[(i + 1) as Rashi]}
              </text>
            </g>
          )
        })}

        {NAKSHATRA_NAMES.map((name, i) => {
          const a0 = i * SPAN
          const mid = a0 + SPAN / 2
          const [lx, ly] = pt(mid, LABEL_R)
          const birth = i === birthIndex
          const on = i === active
          const panchaka = i >= 22
          const occupants = byStar.get(i) ?? []
          return (
            <g key={name}>
              <path
                d={ringSlice(STAR_INNER, STAR_OUTER, a0, a0 + SPAN)}
                className={cn(
                  styles.slice,
                  panchaka && styles.slicePanchaka,
                  birth && styles.sliceBirth,
                  on && styles.sliceOn,
                )}
                tabIndex={0}
                role="button"
                aria-pressed={on}
                aria-label={`${name}${birth ? ', birth star' : ''}`}
                onClick={() => setSelected(i)}
                onKeyDown={e => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    setSelected(i)
                  }
                }}
              >
                <title>{name}</title>
              </path>
              <text
                className={cn(styles.starLabel, birth && styles.starLabelBirth, on && styles.starLabelOn)}
                x={lx}
                y={ly}
                textAnchor="middle"
                dominantBaseline="middle"
                transform={`rotate(${upright(mid)} ${lx} ${ly})`}
                pointerEvents="none"
              >
                {NAKSHATRA_SHORT[i]}
              </text>
              {occupants.slice(0, 3).map((marker, n) => {
                const [px, py] = pt(mid, STAR_INNER + 14 + n * 11)
                return (
                  <text
                    key={`${marker.id}-${n}`}
                    className={cn(styles.marker, marker.id === 'Mo' && styles.markerMoon, marker.id === 'As' && styles.markerLagna)}
                    x={px}
                    y={py}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    pointerEvents="none"
                  >
                    {marker.id === 'As' ? 'As' : marker.id}
                  </text>
                )
              })}
            </g>
          )
        })}

        <circle className={styles.hub} cx={CX} cy={CY} r={HUB_R} />
        <text className={cn(styles.hubName, chars.name.length > 12 && styles.hubNameTight)} x={CX} y={CY - 4} textAnchor="middle">
          {chars.name}
        </text>
        <text className={styles.hubSub} x={CX} y={CY + 14} textAnchor="middle">
          {active === birthIndex ? `Janma · pada ${birthPada}` : hubPada ? `Pada ${hubPada}` : GRAHA_NAMES[chars.lord]}
        </text>
      </svg>

      <div className={styles.meta}>
        <div className={styles.metaTop}>
          <span className={styles.metaName}>{chars.name}</span>
          {active === birthIndex && <span className={styles.metaPada}>Birth star · pada {birthPada}</span>}
        </div>
        <p className={styles.metaLine}>
          Lord <strong>{GRAHA_NAMES[chars.lord]}</strong>
          {' · '}{signsFor(active)}
          {' · '}{chars.gana}
          {' · '}{chars.deity}
        </p>
        <p className={styles.metaLine}>
          {here.length === 0
            ? 'No planet or lagna in this star.'
            : here.map(m => `${markerName(m.id)} pada ${m.pada}`).join(' · ')}
        </p>
      </div>

      <div className={styles.legend}>
        <span className={styles.legendItem}><span className={cn(styles.swatch, styles.swatchBirth)} /> Birth star</span>
        <span className={styles.legendItem}><span className={cn(styles.swatch, styles.swatchPanchaka)} /> Panchaka</span>
        <span className={styles.legendItem}>Mo Moon · As Lagna</span>
      </div>
    </div>
  )
}
