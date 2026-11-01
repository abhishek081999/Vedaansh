'use client'
// ─────────────────────────────────────────────────────────────
//  src/components/panchang/PanchangTimelineStrip.tsx
//  Limb transitions across the Hindu day, sunrise to next sunrise
// ─────────────────────────────────────────────────────────────

import type { CSSProperties } from 'react'
import { useEffect, useMemo, useState } from 'react'
import { Sunrise, Sunset } from 'lucide-react'
import { addHours, startOfHour } from 'date-fns'
import { fromZonedTime, toZonedTime } from 'date-fns-tz'
import type { PanchangDayTimeline, TimelineSegment } from '@/lib/panchang/day-timeline'
import styles from './PanchangTimelineStrip.module.css'

/** Below this % of the track, a segment shows only a dot; details move to its tooltip. */
const MIN_NAME_WIDTH_PCT = 5.4

/** Below this % of the track, a segment shows its name without the time. */
const MIN_TIME_WIDTH_PCT = 11

/** Hour labels closer than this to sunset (% of track) would collide with its marker. */
const HOUR_LABEL_MIN_GAP_PCT = 7

const HOUR_LABEL_STEP = 3

function pctBetween(ms: number, w0: number, w1: number): number {
  if (w1 <= w0) return 0
  return Math.max(0, Math.min(100, ((ms - w0) / (w1 - w0)) * 100))
}

function fmtTime(ms: number, tz: string): string {
  return new Intl.DateTimeFormat('en-IN', {
    timeZone: tz,
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(new Date(ms))
}

function fmtHour(ms: number, tz: string): string {
  return new Intl.DateTimeFormat('en-IN', {
    timeZone: tz,
    hour: 'numeric',
    hour12: true,
  }).format(new Date(ms))
}

/** Whole wall-clock hours on the label step, inside the window. */
function hourLabelInstants(w0: number, w1: number, tz: string): number[] {
  let hourWall = addHours(startOfHour(toZonedTime(new Date(w0), tz)), 1)
  const out: number[] = []
  for (let guard = 0; guard < 48; guard++) {
    const t = fromZonedTime(hourWall, tz).getTime()
    if (t >= w1) break
    if (hourWall.getHours() % HOUR_LABEL_STEP === 0) out.push(t)
    hourWall = addHours(hourWall, 1)
  }
  return out
}

function segmentTime(index: number, count: number, startMs: number, endMs: number, tz: string): string {
  if (count === 1) return 'All day'
  if (index === 0) return `Until ${fmtTime(endMs, tz)}`
  if (index === count - 1) return `From ${fmtTime(startMs, tz)}`
  return `${fmtTime(startMs, tz)} – ${fmtTime(endMs, tz)}`
}

interface LimbRowProps {
  label: string
  segments: TimelineSegment[]
  w0: number
  w1: number
  now: number
  tz: string
}

function LimbRow({ label, segments, w0, w1, now, tz }: LimbRowProps) {
  return (
    <div className={styles.row}>
      <div className={styles.rowLabel}>{label}</div>
      <div className={styles.track}>
        {segments.map((seg, i) => {
          const startMs = new Date(seg.start).getTime()
          const endMs = new Date(seg.end).getTime()
          const width = Math.max(0, pctBetween(endMs, w0, w1) - pctBetween(startMs, w0, w1))
          const active = now >= startMs && now <= endMs
          const time = segmentTime(i, segments.length, startMs, endMs, tz)
          const isBhadra = seg.sub === 'Bhadra'
          return (
            <div
              key={`${seg.start}-${seg.end}-${i}`}
              className={[
                styles.segment,
                width < MIN_NAME_WIDTH_PCT ? styles.segmentTiny : '',
                width < MIN_TIME_WIDTH_PCT ? styles.segmentCompact : '',
                active ? styles.segmentActive : '',
                isBhadra ? styles.segmentBhadra : '',
              ].filter(Boolean).join(' ')}
              style={{ '--segment-width': `${width}%` } as CSSProperties}
              title={[seg.label, seg.sub, time].filter(Boolean).join(' · ')}
            >
              <span className={styles.segmentDot} aria-hidden />
              <span className={styles.segmentName}>{seg.label}</span>
              <span className={styles.segmentTime}>
                {seg.sub && width >= MIN_TIME_WIDTH_PCT * 2 ? `${seg.sub} · ${time}` : time}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export function PanchangTimelineStrip({
  timeline,
  tz,
}: {
  timeline: PanchangDayTimeline
  tz: string
}) {
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 60_000)
    return () => clearInterval(timer)
  }, [])

  const w0 = new Date(timeline.windowStart).getTime()
  const w1 = new Date(timeline.windowEnd).getTime()
  const sunriseMs = new Date(timeline.sunrise).getTime()
  const sunsetMs = new Date(timeline.sunset).getTime()
  const sunrisePct = pctBetween(sunriseMs, w0, w1)
  const sunsetPct = pctBetween(sunsetMs, w0, w1)
  const nowOnTrack = now >= w0 && now <= w1

  const hourLabels = useMemo(
    () => hourLabelInstants(w0, w1, tz)
      .map((ms) => ({ ms, pct: pctBetween(ms, w0, w1) }))
      .filter(({ pct }) => pct > HOUR_LABEL_MIN_GAP_PCT * 1.5
        && pct < 100 - HOUR_LABEL_MIN_GAP_PCT / 2
        && Math.abs(pct - sunsetPct) >= HOUR_LABEL_MIN_GAP_PCT),
    [w0, w1, tz, sunsetPct],
  )

  const limbs: Array<[string, TimelineSegment[]]> = [
    ['Tithi', timeline.tithi],
    ['Nakshatra', timeline.nakshatra],
    ['Yoga', timeline.yoga],
    ['Karana', timeline.karana],
  ]

  return (
    <div className={styles.panel}>
      <div className={styles.grid}>
        {/* Night and the now line run through every row, so they share one layer */}
        <div className={styles.overlay} aria-hidden>
          <span className={styles.night} style={{ left: `${sunsetPct}%` }} />
          <span className={styles.sunsetLine} style={{ left: `${sunsetPct}%` }} />
          {nowOnTrack && (
            <span className={styles.nowLine} style={{ left: `${pctBetween(now, w0, w1)}%` }}>
              <span className={styles.nowFlag}>Now</span>
            </span>
          )}
        </div>

        <div className={styles.rulerRow}>
          <div className={styles.ruler}>
            <span className={`${styles.sunMark} ${styles.sunMarkStart}`} style={{ left: `${sunrisePct}%` }}>
              <Sunrise size={14} aria-hidden /> {fmtTime(sunriseMs, tz)}
            </span>
            {hourLabels.map(({ ms, pct }) => (
              <span key={ms} className={styles.hourLabel} style={{ left: `${pct}%` }}>
                {fmtHour(ms, tz)}
              </span>
            ))}
            <span className={styles.sunMark} style={{ left: `${sunsetPct}%` }}>
              <Sunset size={14} aria-hidden /> {fmtTime(sunsetMs, tz)}
            </span>
          </div>
        </div>

        {limbs.map(([label, segments]) => (
          <LimbRow key={label} label={label} segments={segments} w0={w0} w1={w1} now={now} tz={tz} />
        ))}
      </div>
    </div>
  )
}
