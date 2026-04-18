'use client'

import type { CSSProperties } from 'react'
import { useMemo, useState } from 'react'
import { startOfHour, addHours } from 'date-fns'
import { toZonedTime, fromZonedTime } from 'date-fns-tz'
import { BarChart3, Eye, EyeOff } from 'lucide-react'
import type { PanchangDayTimeline, TimelineSegment } from '@/lib/panchang/day-timeline'
import styles from './PanchangTimelineStrip.module.css'

/** Below this % of the window width, show a dot + tooltip instead of spelling the name (avoids vertical letter stacks). */
const MIN_LABEL_WIDTH_PCT = 5.4

/** Minimum horizontal gap between top-of-ruler labels (percent of track). */
const RULER_LABEL_MIN_GAP_PCT = 6.5

function zonedHourTickInstants(wStart: Date, wEnd: Date, tz: string): Date[] {
  const z = toZonedTime(wStart, tz)
  let hourWall = startOfHour(new Date(z.getTime()))
  if (hourWall.getTime() < z.getTime()) hourWall = addHours(hourWall, 1)
  let t = fromZonedTime(hourWall, tz)
  const out: Date[] = []
  const endMs = wEnd.getTime()
  for (let guard = 0; guard < 48 && t.getTime() < endMs; guard++) {
    out.push(t)
    hourWall = addHours(hourWall, 1)
    t = fromZonedTime(hourWall, tz)
  }
  return out
}

function pctBetween(iso: string, w0: number, w1: number): number {
  const x = new Date(iso).getTime()
  if (w1 <= w0) return 0
  return Math.max(0, Math.min(100, ((x - w0) / (w1 - w0)) * 100))
}

function fmt24(iso: string, tz: string): string {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: tz,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date(iso))
}

function isNowBetween(startIso: string, endIso: string): boolean {
  const now = Date.now()
  return now >= new Date(startIso).getTime() && now <= new Date(endIso).getTime()
}

function segmentTitle(seg: TimelineSegment): string {
  return seg.sub ? `${seg.label} · ${seg.sub}` : seg.label
}

function mergeRulerTopLabels(
  hourTicks: Date[],
  w0: number,
  w1: number,
  tz: string,
  sunriseIso: string,
  sunsetIso: string,
): Array<{ pct: number; key: string; label: string; priority: number; variant: 'hour' | 'sr' | 'ss' }> {
  const srP = pctBetween(sunriseIso, w0, w1)
  const ssP = pctBetween(sunsetIso, w0, w1)
  const items: Array<{ pct: number; key: string; label: string; priority: number; variant: 'hour' | 'sr' | 'ss' }> = []

  hourTicks.forEach((ht, i) => {
    if (i % 2 !== 0) return
    const pct = pctBetween(ht.toISOString(), w0, w1)
    if (Math.abs(pct - srP) < RULER_LABEL_MIN_GAP_PCT || Math.abs(pct - ssP) < RULER_LABEL_MIN_GAP_PCT) return
    items.push({
      pct,
      key: ht.toISOString(),
      label: fmt24(ht.toISOString(), tz),
      priority: 1,
      variant: 'hour',
    })
  })

  items.push(
    { pct: srP, key: 'sr', label: fmt24(sunriseIso, tz), priority: 2, variant: 'sr' },
    { pct: ssP, key: 'ss', label: fmt24(sunsetIso, tz), priority: 2, variant: 'ss' },
  )

  items.sort((a, b) => a.pct - b.pct)
  const merged: typeof items = []
  for (const item of items) {
    if (merged.length === 0) {
      merged.push(item)
      continue
    }
    const last = merged[merged.length - 1]
    if (item.pct - last.pct < RULER_LABEL_MIN_GAP_PCT) {
      if (item.priority > last.priority) merged[merged.length - 1] = item
    } else {
      merged.push(item)
    }
  }
  return merged
}

function softDayNightGradient(srPct: number, ssPct: number): CSSProperties {
  const b = 2.2
  const sr0 = Math.max(0, srPct - b)
  const sr1 = Math.min(100, srPct + b)
  const ss0 = Math.max(0, ssPct - b)
  const ss1 = Math.min(100, ssPct + b)
  const night = 'rgba(10, 9, 14, 0.28)'
  const day = 'rgba(255, 250, 238, 0.045)'
  return {
    background: `linear-gradient(90deg,
      ${night} 0%,
      ${night} ${sr0}%,
      ${day} ${sr1}%,
      ${day} ${ss0}%,
      ${night} ${ss1}%,
      ${night} 100%)`,
  }
}

function TrackBackdrop({
  dayNightStyle,
  interiorLineTimes,
  srPct,
  ssPct,
  w0,
  w1,
  tz,
  sunriseIso,
  sunsetIso,
}: {
  dayNightStyle: CSSProperties
  /** Dashed guides for this row only — use segment end times so lines match block edges */
  interiorLineTimes: string[]
  srPct: number
  ssPct: number
  w0: number
  w1: number
  tz: string
  sunriseIso: string
  sunsetIso: string
}) {
  return (
    <>
      <div className={styles.dayNight} style={dayNightStyle} />
      <div className={styles.markersLayer}>
        <span
          className={`${styles.markerLine} ${styles.markerLineStrong}`}
          style={{ left: `${srPct}%` }}
          title={`Sunrise ${fmt24(sunriseIso, tz)}`}
        />
        <span
          className={`${styles.markerLine} ${styles.markerLineStrong}`}
          style={{ left: `${ssPct}%` }}
          title={`Sunset ${fmt24(sunsetIso, tz)}`}
        />
        {interiorLineTimes.map((iso) => (
          <span
            key={iso}
            className={styles.markerLine}
            style={{ left: `${pctBetween(iso, w0, w1)}%` }}
            title={fmt24(iso, tz)}
          />
        ))}
      </div>
    </>
  )
}

function LimbRow({
  label,
  segments,
  w0,
  w1,
  dayNightStyle,
  srPct,
  ssPct,
  tz,
  sunriseIso,
  sunsetIso,
  warnActive,
}: {
  label: string
  segments: TimelineSegment[]
  w0: number
  w1: number
  dayNightStyle: CSSProperties
  srPct: number
  ssPct: number
  tz: string
  sunriseIso: string
  sunsetIso: string
  warnActive?: (seg: TimelineSegment, active: boolean) => boolean
}) {
  const interiorLineTimes = useMemo(
    () => (segments.length > 1 ? segments.slice(0, -1).map((s) => s.end) : []),
    [segments],
  )

  return (
    <div className={styles.row}>
      <div className={styles.rowLabel}>{label}</div>
      <div className={styles.trackShell}>
        <TrackBackdrop
          dayNightStyle={dayNightStyle}
          interiorLineTimes={interiorLineTimes}
          srPct={srPct}
          ssPct={ssPct}
          w0={w0}
          w1={w1}
          tz={tz}
          sunriseIso={sunriseIso}
          sunsetIso={sunsetIso}
        />
        <div className={styles.segments}>
          {segments.map((seg, i) => {
            const left = pctBetween(seg.start, w0, w1)
            const right = pctBetween(seg.end, w0, w1)
            const width = Math.max(0, right - left)
            const active = isNowBetween(seg.start, seg.end)
            const warn = warnActive?.(seg, active) ?? false
            const narrow = width < MIN_LABEL_WIDTH_PCT
            const title = segmentTitle(seg)
            return (
              <div
                key={`${seg.start}-${seg.end}-${i}`}
                className={[
                  styles.segment,
                  narrow ? styles.segmentNarrow : '',
                  active ? styles.segmentActive : '',
                  warn && active ? styles.segmentWarn : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
                style={{ width: `${width}%`, flexShrink: 0 }}
                title={title}
              >
                {narrow ? (
                  <span
                    className={styles.segmentDot}
                    aria-hidden
                    style={warn && active ? { background: 'var(--rose)', opacity: 0.9 } : undefined}
                  />
                ) : (
                  <>
                    <span className={styles.segmentLabel}>{seg.label}</span>
                    {seg.sub && <span className={styles.segmentSub}>{seg.sub}</span>}
                  </>
                )}
              </div>
            )
          })}
        </div>
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
  const [visible, setVisible] = useState(true)

  const w0 = useMemo(() => new Date(timeline.windowStart).getTime(), [timeline.windowStart])
  const w1 = useMemo(() => new Date(timeline.windowEnd).getTime(), [timeline.windowEnd])

  const hourTicks = useMemo(
    () => zonedHourTickInstants(new Date(timeline.windowStart), new Date(timeline.windowEnd), tz),
    [timeline.windowStart, timeline.windowEnd, tz],
  )

  const srPct = pctBetween(timeline.sunrise, w0, w1)
  const ssPct = pctBetween(timeline.sunset, w0, w1)

  const dayNightStyle = useMemo(() => softDayNightGradient(srPct, ssPct), [srPct, ssPct])

  const rulerTopLabels = useMemo(
    () => mergeRulerTopLabels(hourTicks, w0, w1, tz, timeline.sunrise, timeline.sunset),
    [hourTicks, w0, w1, tz, timeline.sunrise, timeline.sunset],
  )

  const hinduDayActive = isNowBetween(timeline.windowStart, timeline.windowEnd)

  if (!visible) {
    return (
      <div className={styles.wrap}>
        <div className={styles.header}>
          <div>
            <h2 className={styles.title}>Limb timeline</h2>
            <p className={styles.sub}>Sunrise → next sunrise. Hidden.</p>
          </div>
          <button type="button" className={styles.toggle} onClick={() => setVisible(true)}>
            <Eye className="w-4 h-4" aria-hidden />
            Show
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.header}>
        <div>
          <h2 className={styles.title}>Limb timeline</h2>
          <p className={styles.sub}>
            One block per continuous limb (duplicate labels are merged). Dotted lines match that row’s
            changes only. Short slices show a dot — hover for the name. “Now” is a subtle teal edge.
          </p>
        </div>
        <button type="button" className={styles.toggle} onClick={() => setVisible(false)} aria-pressed="true">
          <EyeOff className="w-4 h-4" aria-hidden />
          Hide strip
        </button>
      </div>

      <div className={styles.body}>
        <div className={styles.inner}>
          <div className={styles.row}>
            <div className={styles.rowLabel}>
              <BarChart3 className="w-4 h-4" style={{ opacity: 0.65 }} aria-hidden />
            </div>
            <div className={`${styles.trackShell} ${styles.trackShellRuler}`}>
              <TrackBackdrop
                dayNightStyle={dayNightStyle}
                interiorLineTimes={[]}
                srPct={srPct}
                ssPct={ssPct}
                w0={w0}
                w1={w1}
                tz={tz}
                sunriseIso={timeline.sunrise}
                sunsetIso={timeline.sunset}
              />
              <div className={styles.rulerBottom}>
                {hourTicks.map((ht) => (
                  <span
                    key={ht.toISOString()}
                    className={styles.hourTick}
                    style={{ left: `${pctBetween(ht.toISOString(), w0, w1)}%` }}
                  />
                ))}
              </div>
              <div className={styles.rulerTop}>
                {rulerTopLabels.map((item) =>
                  item.variant === 'hour' ? (
                    <span key={item.key} className={styles.hourLabel} style={{ left: `${item.pct}%` }}>
                      {item.label}
                    </span>
                  ) : (
                    <span
                      key={item.key}
                      className={`${styles.eventChip} ${item.variant === 'sr' ? styles.eventChipSun : styles.eventChipMoon}`}
                      style={{ left: `${item.pct}%` }}
                      title={item.variant === 'sr' ? 'Sunrise' : 'Sunset'}
                    >
                      <span className={styles.eventIcon} aria-hidden>
                        {item.variant === 'sr' ? '☀' : '🌇'}
                      </span>
                      {item.label}
                    </span>
                  ),
                )}
              </div>
            </div>
          </div>

          <LimbRow
            label="Tithi"
            segments={timeline.tithi}
            w0={w0}
            w1={w1}
            dayNightStyle={dayNightStyle}
            srPct={srPct}
            ssPct={ssPct}
            tz={tz}
            sunriseIso={timeline.sunrise}
            sunsetIso={timeline.sunset}
          />
          <LimbRow
            label="Nakṣatra"
            segments={timeline.nakshatra}
            w0={w0}
            w1={w1}
            dayNightStyle={dayNightStyle}
            srPct={srPct}
            ssPct={ssPct}
            tz={tz}
            sunriseIso={timeline.sunrise}
            sunsetIso={timeline.sunset}
          />
          <LimbRow
            label="Yoga"
            segments={timeline.yoga}
            w0={w0}
            w1={w1}
            dayNightStyle={dayNightStyle}
            srPct={srPct}
            ssPct={ssPct}
            tz={tz}
            sunriseIso={timeline.sunrise}
            sunsetIso={timeline.sunset}
          />
          <LimbRow
            label="Karaṇa"
            segments={timeline.karana}
            w0={w0}
            w1={w1}
            dayNightStyle={dayNightStyle}
            srPct={srPct}
            ssPct={ssPct}
            tz={tz}
            sunriseIso={timeline.sunrise}
            sunsetIso={timeline.sunset}
            warnActive={(seg, active) => active && seg.sub === 'Bhadra'}
          />

          <div className={`${styles.row} ${styles.varaRow}`}>
            <div className={styles.rowLabel}>Vāra</div>
            <div className={styles.trackShell}>
              <TrackBackdrop
                dayNightStyle={dayNightStyle}
                interiorLineTimes={[]}
                srPct={srPct}
                ssPct={ssPct}
                w0={w0}
                w1={w1}
                tz={tz}
                sunriseIso={timeline.sunrise}
                sunsetIso={timeline.sunset}
              />
              <div className={styles.segments}>
                <div
                  className={`${styles.segment} ${hinduDayActive ? styles.varaHighlight : ''}`}
                  style={{ width: '100%' }}
                  title={`${timeline.vara.sanskrit} (${timeline.vara.name})`}
                >
                  <span className={styles.segmentLabel}>
                    {timeline.vara.sanskrit} ({timeline.vara.name})
                  </span>
                  <span className={styles.segmentSub}>whole Hindu day</span>
                </div>
              </div>
            </div>
          </div>

          <div className={styles.legend}>
            <span>
              <span className={styles.swatchDay} aria-hidden /> Softer daylight wash
            </span>
            <span>
              <span className={styles.swatchNight} aria-hidden /> Night wash
            </span>
            <span>Narrow slice = dot + hover</span>
          </div>
        </div>
      </div>
    </div>
  )
}
