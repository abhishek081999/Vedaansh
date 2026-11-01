'use client'
// ─────────────────────────────────────────────────────────────
//  src/components/panchang/PanchangViz.tsx
//  Sidereal sky wheel: rashis, nakshatras, Sun, Moon and their tithi arc
// ─────────────────────────────────────────────────────────────

import { useMemo, type CSSProperties } from 'react'
import { moonLitPath } from '@/lib/panchang/moon-phase'
import { NAKSHATRA_NAMES, RASHI_SANSKRIT } from '@/types/astrology'
import type { Rashi } from '@/types/astrology'
import styles from './PanchangViz.module.css'

const SIZE = 480
const C = SIZE / 2
const R_RASHI_OUT = 234
const R_RASHI_IN = 198
const R_NAK_IN = 174
const R_TRACK = 148
const R_TITHI_TICK_OUT = 137
const R_TITHI_TICK_IN = 132
const R_BODY_LABEL = 120
const R_BODY_LABEL_NEAR = 104
const R_SKY = 92
const R_CENTER_MOON = 34

const RASHI_SPAN = 30
const NAK_SPAN = 360 / 27
const TITHI_SPAN = 12

/** Bodies closer than this share a label radius poorly, so the Moon's label steps inward. */
const LABEL_CLASH_DEG = 16
/** The arc needs this much length before its degree label fits. */
const MIN_ARC_LABEL_DEG = 40

const RASHIS = Array.from({ length: 12 }, (_, i) => (i + 1) as Rashi)

function norm(deg: number): number {
  return ((deg % 360) + 360) % 360
}

/** 0° Mesha at top; longitude increases clockwise on the wheel. */
function pos(lonDeg: number, r: number): { x: number; y: number } {
  const rad = ((90 - norm(lonDeg)) * Math.PI) / 180
  return { x: C + r * Math.cos(rad), y: C - r * Math.sin(rad) }
}

function arcPath(a: number, b: number, r: number): string {
  const d = norm(b - a)
  const p0 = pos(a, r)
  const p1 = pos(b, r)
  return `M ${p0.x.toFixed(2)} ${p0.y.toFixed(2)} A ${r} ${r} 0 ${d > 180 ? 1 : 0} 1 ${p1.x.toFixed(2)} ${p1.y.toFixed(2)}`
}

function sectorPath(a: number, b: number, rIn: number, rOut: number): string {
  const o0 = pos(a, rOut)
  const o1 = pos(b, rOut)
  const i0 = pos(a, rIn)
  const i1 = pos(b, rIn)
  return [
    `M ${o0.x.toFixed(2)} ${o0.y.toFixed(2)}`,
    `A ${rOut} ${rOut} 0 0 1 ${o1.x.toFixed(2)} ${o1.y.toFixed(2)}`,
    `L ${i1.x.toFixed(2)} ${i1.y.toFixed(2)}`,
    `A ${rIn} ${rIn} 0 0 0 ${i0.x.toFixed(2)} ${i0.y.toFixed(2)}`,
    'Z',
  ].join(' ')
}

function MoonDisc({ elongDeg, r }: { elongDeg: number; r: number }) {
  return (
    <>
      <circle r={r} className={styles.moonDark} />
      <path d={moonLitPath(elongDeg, r)} className={styles.moonLit} />
    </>
  )
}

function rashiOf(lon: number): string {
  return RASHI_SANSKRIT[(Math.floor(norm(lon) / RASHI_SPAN) + 1) as Rashi]
}

export function PanchangViz({
  sunLon,
  moonLon,
  elongDeg,
  nakIndex,
  nakPada,
  tithiName,
  paksha,
  yogaName,
  yogaNumber,
  dateStr,
}: {
  sunLon: number
  moonLon: number
  elongDeg: number
  nakIndex: number
  nakPada: number
  tithiName: string
  paksha: string
  yogaName: string
  yogaNumber: number
  dateStr: string
}) {
  const shukla = paksha === 'shukla'
  const elong = norm(moonLon - sunLon)
  const sumLon = norm(sunLon + moonLon)
  const illum = 0.5 * (1 - Math.cos((norm(elongDeg) * Math.PI) / 180))
  const litPct = Math.round(illum * 100)
  const waning = norm(elongDeg) >= 180
  const sunRashiIndex = Math.floor(norm(sunLon) / RASHI_SPAN)
  const moonRashiIndex = Math.floor(norm(moonLon) / RASHI_SPAN)
  const nakName = NAKSHATRA_NAMES[nakIndex]
  const sunNakName = NAKSHATRA_NAMES[Math.floor(norm(sunLon) / NAK_SPAN)]

  const separation = Math.min(elong, 360 - elong)
  const moonLabelR = separation < LABEL_CLASH_DEG ? R_BODY_LABEL_NEAR : R_BODY_LABEL
  const sun = pos(sunLon, R_TRACK)
  const moon = pos(moonLon, R_TRACK)
  const sunLabel = pos(sunLon, R_BODY_LABEL)
  const moonLabel = pos(moonLon, moonLabelR)
  const arcLabel = pos(sunLon + elong / 2, R_TRACK + 13)

  const tithiTicks = useMemo(() => Array.from({ length: 30 }, (_, i) => ({
    p0: pos(sunLon + i * TITHI_SPAN, R_TITHI_TICK_IN),
    p1: pos(sunLon + i * TITHI_SPAN, R_TITHI_TICK_OUT),
  })), [sunLon])

  const summary = `Sun in ${rashiOf(sunLon)}, Moon in ${rashiOf(moonLon)} in ${nakName}. ${tithiName}, ${Math.round(elong)} degrees from the Sun, ${litPct}% lit.`

  return (
    <div className={styles.panel}>
      <div className={styles.wheel}>
        <svg key={dateStr} viewBox={`0 0 ${SIZE} ${SIZE}`} role="img" aria-label={summary}>
          {RASHIS.map((rashi, i) => {
            const start = i * RASHI_SPAN
            const held = i === sunRashiIndex || i === moonRashiIndex
            const mid = start + RASHI_SPAN / 2
            const label = pos(mid, (R_RASHI_OUT + R_RASHI_IN) / 2)
            // Follow the ring, flipping the lower half so names stay upright
            const rotation = mid > 90 && mid < 270 ? mid + 180 : mid
            return (
              <g key={rashi}>
                <path
                  d={sectorPath(start, start + RASHI_SPAN, R_RASHI_IN, R_RASHI_OUT)}
                  className={`${styles.rashiSector} ${held ? styles.rashiSectorHeld : ''}`}
                />
                <text
                  x={label.x}
                  y={label.y}
                  transform={`rotate(${rotation} ${label.x.toFixed(2)} ${label.y.toFixed(2)})`}
                  className={`${styles.rashiText} ${held ? styles.rashiTextHeld : ''}`}
                  textAnchor="middle"
                  dominantBaseline="central"
                >
                  {RASHI_SANSKRIT[rashi]}
                </text>
              </g>
            )
          })}

          {NAKSHATRA_NAMES.map((name, i) => {
            const start = i * NAK_SPAN
            const current = i === nakIndex
            const label = pos(start + NAK_SPAN / 2, (R_RASHI_IN + R_NAK_IN) / 2)
            return (
              <g key={name}>
                <path
                  d={sectorPath(start, start + NAK_SPAN, R_NAK_IN, R_RASHI_IN)}
                  className={`${styles.nakSector} ${current ? styles.nakSectorCurrent : ''}`}
                >
                  <title>{`${i + 1}. ${name}`}</title>
                </path>
                <text
                  x={label.x}
                  y={label.y}
                  className={`${styles.nakText} ${current ? styles.nakTextCurrent : ''}`}
                  textAnchor="middle"
                  dominantBaseline="central"
                >
                  {i + 1}
                </text>
              </g>
            )
          })}

          <circle cx={C} cy={C} r={R_TRACK} className={styles.track} />
          {tithiTicks.map(({ p0, p1 }, i) => (
            <line key={i} x1={p0.x} y1={p0.y} x2={p1.x} y2={p1.y} className={styles.tithiTick} />
          ))}

          {elong > 0.25 && (
            <path
              d={arcPath(sunLon, moonLon, R_TRACK)}
              className={`${styles.arc} ${shukla ? styles.arcShukla : styles.arcKrishna}`}
              pathLength={1}
            />
          )}
          {elong >= MIN_ARC_LABEL_DEG && (
            <text
              x={arcLabel.x}
              y={arcLabel.y}
              className={styles.arcLabel}
              textAnchor="middle"
              dominantBaseline="central"
            >
              {Math.round(elong)}°
            </text>
          )}

          <circle cx={C} cy={C} r={R_SKY} className={styles.sky} />
          <g className={styles.centerMoon} transform={`translate(${C} ${C - 28})`}>
            <MoonDisc elongDeg={elongDeg} r={R_CENTER_MOON} />
          </g>
          <text x={C} y={C + 28} textAnchor="middle" className={styles.skyTitle}>{tithiName}</text>
          <text x={C} y={C + 48} textAnchor="middle" className={styles.skySub}>
            {shukla ? 'Shukla' : 'Krishna'} · {litPct}% lit
          </text>

          <circle cx={sun.x} cy={sun.y} r={13} className={styles.sun} />
          <g transform={`translate(${moon.x} ${moon.y})`}>
            <MoonDisc elongDeg={elongDeg} r={12} />
            <circle r={12} className={styles.moonOutline} />
          </g>
          <text x={sunLabel.x} y={sunLabel.y} className={styles.bodyLabel} textAnchor="middle" dominantBaseline="central">Sun</text>
          <text x={moonLabel.x} y={moonLabel.y} className={styles.bodyLabel} textAnchor="middle" dominantBaseline="central">Moon</text>
        </svg>
      </div>

      <div className={styles.readings}>
        <dl className={styles.readingList}>
          <Reading swatch={styles.swatchSun} term="Sun" value={`${rashiOf(sunLon)} ${(norm(sunLon) % RASHI_SPAN).toFixed(1)}°`} note={`In ${sunNakName}`} />
          <Reading swatch={styles.swatchMoon} term="Moon" value={`${rashiOf(moonLon)} ${(norm(moonLon) % RASHI_SPAN).toFixed(1)}°`} note={`${litPct}% lit, ${waning ? 'waning' : 'waxing'}`} />
          <Reading
            swatch={shukla ? styles.swatchShukla : styles.swatchKrishna}
            term="Tithi"
            value={tithiName}
            note={`Moon is ${Math.round(elong)}° ahead of the Sun. Each tick is one tithi, 12°.`}
          />
          <Reading swatch={styles.swatchNak} term="Nakshatra" value={nakName} note={`Number ${nakIndex + 1} of 27, pada ${nakPada}`} />
          <Reading term="Yoga" value={yogaName} note={`Number ${yogaNumber} of 27. Sun + Moon = ${sumLon.toFixed(1)}°.`} />
        </dl>
        <p className={styles.caption}>Sidereal positions at local noon. Mesha starts at the top; the zodiac runs clockwise.</p>
      </div>
    </div>
  )
}

interface ReadingProps {
  swatch?: string
  term: string
  value: string
  note: string
}

function Reading({ swatch, term, value, note }: ReadingProps) {
  const style: CSSProperties | undefined = swatch ? undefined : { visibility: 'hidden' }
  return (
    <div className={styles.reading}>
      <span className={`${styles.swatch} ${swatch ?? ''}`} style={style} aria-hidden />
      <dt className={styles.readingTerm}>{term}</dt>
      <dd className={styles.readingValue}>{value}</dd>
      <dd className={styles.readingNote}>{note}</dd>
    </div>
  )
}
