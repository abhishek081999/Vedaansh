'use client'

import { useEffect, useId, useMemo, useState, type CSSProperties } from 'react'
import { RASHI_SHORT } from '@/types/astrology'
import type { Rashi } from '@/types/astrology'
import styles from './PanchangViz.module.css'

const CX = 200
const CY = 200
const R_OUT = 168
/** Outer ring for yoga (Sun+Moon sum on 27-fold wheel) */
const R_YOGA = 156
const R_ZOD = 142
const R_BODY = 118
const ARC_R = 88

const LIVE_MS = 30_000

/** 0° Meṣa at top; longitude increases clockwise on the wheel. */
function pos(lonDeg: number, r: number): { x: number; y: number } {
  const lon = ((lonDeg % 360) + 360) % 360
  const rad = ((90 - lon) * Math.PI) / 180
  return { x: CX + r * Math.cos(rad), y: CY - r * Math.sin(rad) }
}

/** SVG elliptical arc from longitude a to b (degrees), radius r, minor arc. */
function arcPath(a: number, b: number, r: number): string {
  let d = b - a
  if (d < 0) d += 360
  if (d > 360) d %= 360
  const large = d > 180 ? 1 : 0
  const p0 = pos(((a % 360) + 360) % 360, r)
  const p1 = pos(((b % 360) + 360) % 360, r)
  return `M ${p0.x.toFixed(2)} ${p0.y.toFixed(2)} A ${r} ${r} 0 ${large} 1 ${p1.x.toFixed(2)} ${p1.y.toFixed(2)}`
}

export function PanchangViz({
  sunLon,
  moonLon,
  elongDeg,
  nakIndex,
  tithiPercent,
  paksha,
  yogaPercent,
  sunrise,
  sunset,
  tz,
  dateStr,
  yogaNumber,
}: {
  sunLon: number
  moonLon: number
  elongDeg: number
  nakIndex: number
  tithiPercent: number
  paksha: string
  yogaPercent: number
  yogaNumber: number
  sunrise: string
  sunset: string
  tz: string
  dateStr: string
}) {
  const [liveTick, setLiveTick] = useState(0)
  const uid = useId().replace(/:/g, '')

  const isToday = useMemo(() => {
    const today = new Intl.DateTimeFormat('en-CA', { timeZone: tz }).format(new Date())
    return dateStr === today
  }, [dateStr, tz])

  useEffect(() => {
    if (!isToday) return
    const id = window.setInterval(() => setLiveTick((t) => t + 1), LIVE_MS)
    return () => window.clearInterval(id)
  }, [isToday])

  const dayProgress = useMemo(() => {
    if (!isToday) return null
    void liveTick
    const sr = new Date(sunrise).getTime()
    const ss = new Date(sunset).getTime()
    const now = Date.now()
    if (now <= sr) return 0
    if (now >= ss) return 1
    return (now - sr) / (ss - sr)
  }, [isToday, sunrise, sunset, liveTick])

  const nakSpan = 360 / 27
  const nakStart = nakIndex * nakSpan
  const nakEnd = nakIndex === 26 ? 360 : nakStart + nakSpan

  const elong = useMemo(() => {
    let d = moonLon - sunLon
    return ((d % 360) + 360) % 360
  }, [sunLon, moonLon])

  const tithiArcPath = useMemo(() => arcPath(sunLon, moonLon, ARC_R), [sunLon, moonLon])
  const tithiArcLen = useMemo(() => (elong / 360) * 2 * Math.PI * ARC_R, [elong])
  const nakArcPath = useMemo(() => arcPath(nakStart, nakEnd, R_ZOD - 2), [nakStart, nakEnd])

  const yogaLon = useMemo(() => {
    return (((sunLon + moonLon) % 360) + 360) % 360
  }, [sunLon, moonLon])

  const yogaIndex = useMemo(() => Math.floor(yogaLon / nakSpan), [yogaLon, nakSpan])
  const yogaSegStart = yogaIndex * nakSpan
  const yogaSegEnd = yogaIndex === 26 ? 360 : yogaSegStart + nakSpan
  const yogaArcPath = useMemo(() => arcPath(yogaSegStart, yogaSegEnd, R_YOGA), [yogaSegStart, yogaSegEnd])

  const shukla = paksha === 'shukla'
  const arcColor = shukla ? 'rgba(232, 167, 48, 0.6)' : 'rgba(124, 90, 180, 0.6)'

  const illum = useMemo(() => {
    const e = ((elongDeg % 360) + 360) % 360
    return Math.max(0, Math.min(1, 0.5 * (1 - Math.cos((e * Math.PI) / 180))))
  }, [elongDeg])

  const zodiacLabels = useMemo(() => {
    const out: { lon: number; label: string }[] = []
    for (let i = 1; i <= 12; i++) {
      out.push({ lon: (i - 1) * 30, label: RASHI_SHORT[i as Rashi] })
    }
    return out
  }, [])

  const dayR = 72
  const dayCy = 288
  const dayNeedle = useMemo(() => {
    if (dayProgress == null) return null
    const phi = Math.PI * (1 - dayProgress)
    return { x: dayR * Math.cos(phi), y: dayR * Math.sin(phi) }
  }, [dayProgress])
  const dayPctLabel = useMemo(() => {
    if (dayProgress == null) return null
    return `${Math.round(dayProgress * 100)}%`
  }, [dayProgress])

  return (
    <section className={styles.wrap} aria-label="Pañcāṅga sky diagram">
      <div className={styles.body}>
        <div className={styles.svgWrap}>
          <svg key={dateStr} viewBox="0 0 400 400" role="img" aria-label="Sidereal ecliptic wheel with Sun and Moon">
            <defs>
              <radialGradient id={`pglow-${uid}`} cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="rgba(201,168,76,0.12)" />
                <stop offset="100%" stopColor="rgba(201,168,76,0)" />
              </radialGradient>
              <linearGradient id={`moonshade-${uid}`} x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset={`${(1 - illum) * 100}%`} stopColor="rgba(28,32,42,0.94)" />
                <stop offset={`${(1 - illum) * 100}%`} stopColor="rgba(200,210,230,0.92)" />
              </linearGradient>
            </defs>

            <circle cx={CX} cy={CY} r={R_OUT} fill={`url(#pglow-${uid})`} stroke="var(--border)" strokeWidth={1} opacity={0.85} />

            {Array.from({ length: 27 }, (_, i) => {
              const a = i * nakSpan
              const p0 = pos(a, R_YOGA - 5)
              const p1 = pos(a, R_YOGA + 5)
              return (
                <line
                  key={`yoga-tick-${i}`}
                  x1={p0.x}
                  y1={p0.y}
                  x2={p1.x}
                  y2={p1.y}
                  stroke="var(--text-muted)"
                  strokeWidth={0.6}
                  opacity={0.25}
                />
              )
            })}

            <path
              d={yogaArcPath}
              fill="none"
              stroke="rgba(13, 148, 136, 0.45)"
              strokeWidth={9}
              strokeLinecap="round"
            />

            {zodiacLabels.map(({ lon }) => {
              const p0 = pos(lon, R_ZOD - 8)
              const p1 = pos(lon, R_ZOD + 4)
              return (
                <line
                  key={`z-tick-${lon}`}
                  x1={p0.x}
                  y1={p0.y}
                  x2={p1.x}
                  y2={p1.y}
                  stroke="var(--text-muted)"
                  strokeWidth={1}
                  opacity={0.35}
                />
              )
            })}

            <path
              d={nakArcPath}
              fill="none"
              stroke="rgba(201,168,76,0.4)"
              strokeWidth={11}
              strokeLinecap="round"
            />

            {elong > 0.25 && (
              <path
                className={styles.arcPath}
                d={tithiArcPath}
                fill="none"
                stroke={arcColor}
                strokeWidth={5}
                strokeLinecap="round"
                style={
                  {
                    ['--arc-len' as string]: `${Math.ceil(tithiArcLen) + 24}`,
                  } as CSSProperties
                }
              />
            )}

            <circle cx={CX} cy={CY} r={R_BODY} fill="none" stroke="var(--border)" strokeWidth={1} strokeDasharray="4 6" opacity={0.45} />

            {(() => {
              const s = pos(sunLon, R_BODY)
              return (
                <g className={styles.sunG}>
                  <circle cx={s.x} cy={s.y} r={12} fill="#e8a730" stroke="#fff8e8" strokeWidth={1.5} />
                  <text x={s.x} y={s.y + 22} textAnchor="middle" fill="var(--text-muted)" fontSize={9} fontWeight={600}>
                    Su
                  </text>
                </g>
              )
            })()}

            {(() => {
              const m = pos(moonLon, R_BODY)
              return (
                <g className={styles.moonG}>
                  <circle cx={m.x} cy={m.y} r={11} fill={`url(#moonshade-${uid})`} stroke="#b0c8e0" strokeWidth={1.5} />
                  <text x={m.x} y={m.y + 22} textAnchor="middle" fill="var(--text-muted)" fontSize={9} fontWeight={600}>
                    Ch
                  </text>
                </g>
              )
            })()}

            {(() => {
              const p = pos(yogaLon, R_YOGA)
              return (
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={4}
                  fill="var(--teal)"
                  stroke="rgba(255,255,255,0.5)"
                  strokeWidth={1}
                  opacity={0.9}
                />
              )
            })()}

            {zodiacLabels.map(({ lon, label }) => {
              const pt = pos(lon + 15, R_ZOD - 24)
              return (
                <text
                  key={`z-lbl-${lon}`}
                  className={styles.zodiacText}
                  x={pt.x}
                  y={pt.y}
                  textAnchor="middle"
                  dominantBaseline="middle"
                >
                  {label}
                </text>
              )
            })}

            <circle cx={CX} cy={CY} r={5} fill="var(--surface-3)" stroke="var(--border)" strokeWidth={1} />

            {dayProgress != null && dayNeedle && (
              <g transform={`translate(${CX}, ${dayCy})`} aria-hidden>
                <path
                  d={`M ${-dayR} 0 A ${dayR} ${dayR} 0 0 1 ${dayR} 0`}
                  fill="none"
                  stroke="rgba(232,167,48,0.14)"
                  strokeWidth={6}
                  strokeLinecap="round"
                />
                <line
                  className={styles.nowNeedle}
                  x1={0}
                  y1={0}
                  x2={dayNeedle.x}
                  y2={dayNeedle.y}
                  stroke="var(--text-gold)"
                  strokeWidth={2.5}
                  strokeLinecap="round"
                />
                <text x={0} y={-12} textAnchor="middle" className={styles.dayPctText}>
                  {dayPctLabel} daylight
                </text>
              </g>
            )}
          </svg>
        </div>

        <div className={styles.legend}>
          <div className={styles.legendTitle}>Reading the wheel</div>
          <div className={styles.legendRow}>
            <span className={styles.dot} style={{ background: '#e8a730' }} />
            <span>
              <strong>Sūrya</strong> & <strong>Chandra</strong> on the ecliptic (sidereal λ, your ayanāṃśa).
            </span>
          </div>
          <div className={styles.legendRow}>
            <span className={styles.dot} style={{ background: arcColor }} />
            <span>
              Arc = Moon–Sun separation → <strong>tithi</strong> ({tithiPercent.toFixed(0)}% through this lunar day;{' '}
              {shukla ? 'śukla' : 'kṛṣṇa'}).
            </span>
          </div>
          <div className={styles.legendRow}>
            <span className={styles.dot} style={{ background: 'rgba(201,168,76,0.55)' }} />
            <span>
              Wide gold band = this <strong>nakṣatra</strong> segment (1/27 of the circle).
            </span>
          </div>
          <div className={styles.legendRow}>
            <span className={styles.dot} style={{ background: 'rgba(176,200,224,0.6)' }} />
            <span>
              Moon shading ≈ lit fraction from elongation (~{(illum * 100).toFixed(0)}%).
            </span>
          </div>
          <div className={styles.legendRow}>
            <span className={styles.dot} style={{ background: 'var(--teal)' }} />
            <span>
              Outer <strong>yoga</strong> ring: 27 ticks; teal band + dot = (Sun+Moon) sidereal sum → yoga {yogaNumber}/27 (
              {yogaPercent.toFixed(0)}% through this yoga).
            </span>
          </div>
          <div className={styles.legendRow}>
            <span className={styles.dot} style={{ background: 'rgba(232,167,48,0.55)' }} />
            <span>
              <strong>Su / Ch</strong> on the wheel = sidereal ecliptic longitude. The <strong>lower gold arc + needle</strong>{' '}
              (today only) is local daytime: where “now” falls between sunrise and sunset.
            </span>
          </div>
          {dayProgress != null && (
            <div className={styles.dayBar}>
              That needle updates about every {LIVE_MS / 1000}s when viewing <strong>today</strong> ({tz}).
            </div>
          )}
          {!isToday && (
            <div className={styles.dayBar}>The lower arc and needle appear when the chosen date is today in your timezone.</div>
          )}

          <div
            className={styles.moonPhase}
            style={{
              background: `linear-gradient(90deg, rgba(25,28,38,0.96) ${(1 - illum) * 100}%, rgba(210,218,235,0.94) ${(1 - illum) * 100}%)`,
            }}
            title="Approximate lunar illumination from elongation"
          />
          <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textAlign: 'center' }}>Phase hint</div>
        </div>
      </div>
    </section>
  )
}
