'use client'
// ─────────────────────────────────────────────────────────────
//  src/components/dashboard/TransitForecastPanel.tsx
//  Predictive transit forecast — weather curve, life-area heatmap,
//  slow-planet ribbon, windows, drivers and event timeline
// ─────────────────────────────────────────────────────────────

import React, { useEffect, useMemo, useState } from 'react'
import type { ChartOutput, DashaNode, GrahaId } from '@/types/astrology'
import { GRAHA_NAMES, RASHI_SHORT } from '@/types/astrology'
import { FORECAST_AREAS, type ForecastAreaId } from '@/lib/engine/transitForecastAreas'
import type {
  AreaOutlook,
  ForecastDashaSpan,
  ForecastDriver,
  ForecastEvent,
  ForecastEventKind,
  ForecastPoint,
  ForecastWindow,
  TransitForecastReport,
} from '@/lib/engine/transitForecast'
import type {
  AreaPrediction,
  ForecastPredictions,
  MonthPrediction,
  PredictionTone,
  WindowPrediction,
} from '@/lib/engine/transitPredictions'
import styles from './transit-forecast.module.css'

interface TransitForecastPanelProps {
  chart: ChartOutput
}

const HORIZONS = [6, 12, 24] as const
type Horizon = (typeof HORIZONS)[number]

const BAV_IDS = ['Su', 'Ma', 'Me', 'Ju', 'Ve', 'Sa'] as const
const RIBBON_ORDER: GrahaId[] = ['Ju', 'Sa', 'Ra', 'Ke', 'Ma']
const DAY_MS = 24 * 60 * 60 * 1000

// ── Request payload ──────────────────────────────────────────

function isoOf(d: Date | string): string {
  return new Date(d).toISOString().slice(0, 10)
}

function flattenDashas(nodes: DashaNode[] | undefined, from: Date, to: Date): ForecastDashaSpan[] {
  if (!nodes?.length) return []
  const out: ForecastDashaSpan[] = []
  const fromMs = from.getTime()
  const toMs = to.getTime()
  for (const md of nodes) {
    const mdStart = new Date(md.start).getTime()
    const mdEnd = new Date(md.end).getTime()
    if (mdEnd < fromMs || mdStart > toMs) continue
    for (const ad of md.children ?? []) {
      const s = new Date(ad.start).getTime()
      const e = new Date(ad.end).getTime()
      if (e < fromMs || s > toMs) continue
      out.push({ md: md.lord as GrahaId, ad: ad.lord as GrahaId, startIso: isoOf(ad.start), endIso: isoOf(ad.end) })
    }
  }
  return out.slice(0, 60)
}

function buildBody(chart: ChartOutput, months: Horizon) {
  const moon = chart.grahas.find(g => g.id === 'Mo')
  const av = chart.ashtakavarga
  const bav: Partial<Record<(typeof BAV_IDS)[number], number[]>> = {}
  for (const id of BAV_IDS) {
    const b = av?.bav?.[id]?.bindus
    if (Array.isArray(b) && b.length === 12) bav[id] = b
  }
  const now = new Date()
  const end = new Date(now.getTime() + (months * 31 + 1) * DAY_MS)
  return {
    ascRashi: chart.lagnas.ascRashi,
    moonRashi: moon?.rashi ?? chart.lagnas.ascRashi,
    bav: Object.keys(bav).length ? bav : undefined,
    sav: Array.isArray(av?.sav) && av.sav.length === 12 ? av.sav : undefined,
    dashas: flattenDashas(chart.dashas?.vimshottari, now, end),
    asOf: isoOf(now),
    months,
  }
}

// ── Formatting ───────────────────────────────────────────────

function fmtDate(iso: string, opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric' }): string {
  return new Intl.DateTimeFormat('en-IN', { ...opts, timeZone: 'UTC' }).format(new Date(`${iso}T12:00:00Z`))
}

function fmtRange(a: string, b: string): string {
  return `${fmtDate(a, { day: 'numeric', month: 'short' })} – ${fmtDate(b, { day: 'numeric', month: 'short', year: 'numeric' })}`
}

/** Mirrors the engine headline bands. */
function moodOf(score: number): string {
  if (score >= 62) return 'Supportive'
  if (score >= 54) return 'Mildly supportive'
  if (score > 46) return 'Balanced'
  if (score > 38) return 'Testing'
  return 'High pressure'
}

function toneClassOf(score: number): string {
  if (score >= 56) return styles.good
  if (score <= 44) return styles.bad
  return styles.mid
}

/** Diverging fill for a 0–100 score; `strength` 0–1 mutes low-activation cells. */
function scoreFill(score: number, strength = 1): string {
  const d = (score - 50) / 50
  const pct = Math.round(Math.min(1, Math.abs(d) * 1.4) * 78 * (0.45 + 0.55 * strength))
  const hue = d >= 0 ? 'var(--teal)' : 'var(--rose)'
  return `color-mix(in oklab, ${hue} ${pct}%, var(--surface-3))`
}

// ── Gauge ────────────────────────────────────────────────────

function Gauge({ score }: { score: number }) {
  const r = 46
  const cx = 60
  const cy = 58
  const angle = Math.PI * (1 - score / 100)
  const nx = cx + r * Math.cos(angle)
  const ny = cy - r * Math.sin(angle)
  const arc = (from: number, to: number) => {
    const a0 = Math.PI * (1 - from / 100)
    const a1 = Math.PI * (1 - to / 100)
    return `M ${cx + r * Math.cos(a0)} ${cy - r * Math.sin(a0)} A ${r} ${r} 0 0 1 ${cx + r * Math.cos(a1)} ${cy - r * Math.sin(a1)}`
  }
  return (
    <svg viewBox="0 0 120 72" className={styles.gauge} role="img" aria-label={`Transit weather ${score} of 100`}>
      <path d={arc(0, 38)} className={styles.gaugeBad} />
      <path d={arc(38, 62)} className={styles.gaugeMid} />
      <path d={arc(62, 100)} className={styles.gaugeGood} />
      <line x1={cx} y1={cy} x2={nx} y2={ny} className={styles.gaugeNeedle} />
      <circle cx={cx} cy={cy} r={3.5} className={styles.gaugeHub} />
      <text x={cx} y={cy - 14} textAnchor="middle" className={styles.gaugeValue}>{score}</text>
    </svg>
  )
}

// ── Forecast curve ───────────────────────────────────────────

const W = 1000
const CURVE_H = 250
const PAD = { l: 34, r: 12, t: 26, b: 26 }

function useXScale(report: TransitForecastReport) {
  return useMemo(() => {
    const t0 = Date.parse(`${report.asOfIso}T12:00:00Z`)
    const t1 = Date.parse(`${report.endIso}T12:00:00Z`)
    const span = Math.max(1, t1 - t0)
    const inner = W - PAD.l - PAD.r
    return (iso: string) => PAD.l + (Math.min(Math.max(Date.parse(`${iso.slice(0, 10)}T12:00:00Z`) - t0, 0), span) / span) * inner
  }, [report.asOfIso, report.endIso])
}

function monthTicks(report: TransitForecastReport): string[] {
  const out: string[] = []
  const d = new Date(`${report.asOfIso}T12:00:00Z`)
  d.setUTCDate(1)
  d.setUTCMonth(d.getUTCMonth() + 1)
  const step = report.points.length > 120 ? 3 : 1
  while (isoOf(d) <= report.endIso) {
    out.push(isoOf(d))
    d.setUTCMonth(d.getUTCMonth() + step)
  }
  return out
}

function ForecastCurve({ report, focusArea }: { report: TransitForecastReport; focusArea: ForecastAreaId | null }) {
  const x = useXScale(report)
  const [hover, setHover] = useState<number | null>(null)
  const series = report.points.map(p => (focusArea ? p.areas[focusArea].score : p.overall))
  // Auto-zoom the y-domain to the data (always keeping the 50 midline) so swings stay legible.
  const yLo = Math.max(0, Math.floor((Math.min(50, ...series) - 6) / 10) * 10)
  const yHi = Math.min(100, Math.ceil((Math.max(50, ...series) + 6) / 10) * 10)
  const y = (v: number) => PAD.t + (1 - (v - yLo) / (yHi - yLo)) * (CURVE_H - PAD.t - PAD.b)
  const gridVals = [yLo, Math.round((yLo + 50) / 2 / 5) * 5, 50, Math.round((yHi + 50) / 2 / 5) * 5, yHi]
    .filter((v, i, arr) => arr.indexOf(v) === i)

  const line = report.points.map((p, i) => `${i === 0 ? 'M' : 'L'}${x(p.dateIso).toFixed(1)},${y(series[i]).toFixed(1)}`).join(' ')
  const first = x(report.points[0].dateIso)
  const last = x(report.points[report.points.length - 1].dateIso)
  const area = `${line} L${last.toFixed(1)},${y(50)} L${first.toFixed(1)},${y(50)} Z`

  const adStarts = report.events.filter(e => e.kind === 'dasha')
  const slowIngress = report.events.filter(e => e.kind === 'ingress' && (e.planet === 'Ju' || e.planet === 'Sa' || e.planet === 'Ra'))
  const ticks = monthTicks(report)

  const onMove = (ev: React.PointerEvent<SVGRectElement>) => {
    const svg = ev.currentTarget.ownerSVGElement
    if (!svg) return
    const rect = svg.getBoundingClientRect()
    const vx = ((ev.clientX - rect.left) / rect.width) * W
    let best = 0
    let bestD = Infinity
    report.points.forEach((p, i) => {
      const d = Math.abs(x(p.dateIso) - vx)
      if (d < bestD) { bestD = d; best = i }
    })
    setHover(best)
  }

  const hp: ForecastPoint | null = hover != null ? report.points[hover] : null
  const hx = hp ? x(hp.dateIso) : 0
  const topAreas = hp
    ? FORECAST_AREAS.map(a => ({ a, v: hp.areas[a.id] })).sort((m, n) => n.v.score - m.v.score)
    : []

  return (
    <div className={styles.curveWrap}>
      <div className={styles.curveInner}>
        <svg viewBox={`0 0 ${W} ${CURVE_H}`} className={styles.curve} role="img"
          aria-label={`${focusArea ? 'Area' : 'Overall'} transit score over the next ${report.points.length} samples`}>
          <defs>
            <clipPath id="tf-above"><rect x={0} y={0} width={W} height={y(50)} /></clipPath>
            <clipPath id="tf-below"><rect x={0} y={y(50)} width={W} height={CURVE_H} /></clipPath>
          </defs>

          {!focusArea && report.windows.map(w => (
            <rect key={`${w.kind}-${w.startIso}`} x={x(w.startIso)} y={PAD.t - 6}
              width={Math.max(2, x(w.endIso) - x(w.startIso))} height={CURVE_H - PAD.t - PAD.b + 6}
              className={w.kind === 'favourable' ? styles.bandGood : styles.bandBad} />
          ))}

          {gridVals.map(v => (
            <g key={v}>
              <line x1={PAD.l} x2={W - PAD.r} y1={y(v)} y2={y(v)} className={v === 50 ? styles.midLine : styles.gridLine} />
              <text x={PAD.l - 6} y={y(v) + 3.5} textAnchor="end" className={styles.axisText}>{v}</text>
            </g>
          ))}

          {ticks.map(t => (
            <g key={t}>
              <line x1={x(t)} x2={x(t)} y1={CURVE_H - PAD.b} y2={CURVE_H - PAD.b + 4} className={styles.gridLine} />
              <text x={x(t)} y={CURVE_H - 8} textAnchor="middle" className={styles.axisText}>
                {fmtDate(t, { month: 'short' })}{t.slice(5, 7) === '01' ? ` ’${t.slice(2, 4)}` : ''}
              </text>
            </g>
          ))}

          {adStarts.map(e => (
            <g key={`ad-${e.dateIso}`}>
              <line x1={x(e.dateIso)} x2={x(e.dateIso)} y1={PAD.t - 8} y2={CURVE_H - PAD.b} className={styles.dashaLine} />
              <text x={x(e.dateIso) + 3} y={PAD.t - 12} className={styles.dashaText}>AD {e.planet}</text>
            </g>
          ))}

          <path d={area} clipPath="url(#tf-above)" className={styles.areaGood} />
          <path d={area} clipPath="url(#tf-below)" className={styles.areaBad} />
          <path d={line} className={styles.line} />

          {slowIngress.map(e => (
            <g key={`ing-${e.planet}-${e.dateIso}`}>
              <circle cx={x(e.dateIso)} cy={CURVE_H - PAD.b} r={7} className={e.tone === 'supportive' ? styles.pinGood : e.tone === 'caution' ? styles.pinBad : styles.pinMid} />
              <text x={x(e.dateIso)} y={CURVE_H - PAD.b + 3} textAnchor="middle" className={styles.pinText}>{e.planet}</text>
            </g>
          ))}

          <line x1={first} x2={first} y1={PAD.t - 8} y2={CURVE_H - PAD.b} className={styles.todayLine} />
          <text x={first + 4} y={PAD.t - 12} className={styles.todayText}>Today</text>

          {hp && (
            <g pointerEvents="none">
              <line x1={hx} x2={hx} y1={PAD.t - 6} y2={CURVE_H - PAD.b} className={styles.crosshair} />
              <circle cx={hx} cy={y(series[hover as number])} r={4.5} className={styles.hoverDot} />
            </g>
          )}

          <rect x={PAD.l} y={0} width={W - PAD.l - PAD.r} height={CURVE_H} fill="transparent"
            onPointerMove={onMove} onPointerLeave={() => setHover(null)} />
        </svg>

        {hp && (
          <div className={styles.tooltip} style={{ left: `${(hx / W) * 100}%`, transform: `translateX(${hx > W * 0.66 ? '-100%' : hx < W * 0.2 ? '0' : '-50%'})` }}>
            <div className={styles.ttHead}>
              <span>{fmtDate(hp.dateIso)}</span>
              <strong className={toneClassOf(series[hover as number])}>{series[hover as number]}</strong>
            </div>
            {hp.md && <div className={styles.ttDasha}>{GRAHA_NAMES[hp.md]} / {hp.ad ? GRAHA_NAMES[hp.ad] : '—'}</div>}
            <div className={styles.ttAreas}>
              {topAreas.map(({ a, v }) => (
                <div key={a.id} className={styles.ttArea}>
                  <span>{a.label}{v.doubleTransit ? ' ★' : ''}</span>
                  <span className={styles.ttBar}><i style={{ width: `${v.score}%`, background: scoreFill(v.score) }} /></span>
                  <b>{v.score}</b>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Life-area heatmap ────────────────────────────────────────

interface Bucket { startIso: string; endIso: string; points: ForecastPoint[] }

function bucketize(points: ForecastPoint[], count: number): Bucket[] {
  const size = Math.max(1, Math.ceil(points.length / count))
  const out: Bucket[] = []
  for (let i = 0; i < points.length; i += size) {
    const slice = points.slice(i, i + size)
    out.push({ startIso: slice[0].dateIso, endIso: slice[slice.length - 1].dateIso, points: slice })
  }
  return out
}

function AreaHeatmap({ report, months, focusArea, onFocus }: {
  report: TransitForecastReport
  months: Horizon
  focusArea: ForecastAreaId | null
  onFocus: (id: ForecastAreaId | null) => void
}) {
  const buckets = useMemo(() => bucketize(report.points, Math.min(48, months * 2)), [report.points, months])
  const labels = useMemo(() => {
    // Label each month change, thinned so labels never sit in adjacent columns (every 2nd month at 24m).
    const minGap = months > 12 ? 4 : 2
    let last = -Infinity
    return buckets.map((b, i) => {
      const changed = i === 0 || b.startIso.slice(0, 7) !== buckets[i - 1].startIso.slice(0, 7)
      if (!changed || i - last < minGap) return ''
      last = i
      const label = fmtDate(b.startIso, { month: 'short' })
      return b.startIso.slice(5, 7) === '01' ? `${label} ’${b.startIso.slice(2, 4)}` : label
    })
  }, [buckets, months])
  return (
    <div className={styles.heatmap} style={{ gridTemplateColumns: `minmax(7.5rem, auto) repeat(${buckets.length}, minmax(0, 1fr))` }}>
      <span />
      {buckets.map((b, i) => (
        <span key={b.startIso} className={styles.heatCol}>{labels[i]}</span>
      ))}
      {FORECAST_AREAS.map(a => (
        <React.Fragment key={a.id}>
          <button type="button" className={`${styles.heatLabel} ${focusArea === a.id ? styles.heatLabelOn : ''}`}
            onClick={() => onFocus(focusArea === a.id ? null : a.id)} aria-pressed={focusArea === a.id}>
            {a.label}
          </button>
          {buckets.map(b => {
            const score = Math.round(b.points.reduce((s, p) => s + p.areas[a.id].score, 0) / b.points.length)
            const act = b.points.reduce((s, p) => s + p.areas[a.id].activation, 0) / b.points.length / 100
            const dt = b.points.some(p => p.areas[a.id].doubleTransit)
            return (
              <span key={b.startIso} className={styles.heatCell}
                style={{ background: scoreFill(score, act) }}
                title={`${a.label} · ${fmtRange(b.startIso, b.endIso)} · ${score}/100 · activation ${Math.round(act * 100)}%${dt ? ' · Ju+Sa double transit' : ''}`}>
                {dt ? '★' : ''}
              </span>
            )
          })}
        </React.Fragment>
      ))}
    </div>
  )
}

// ── Slow-planet ribbon ───────────────────────────────────────

function PlanetRibbon({ report }: { report: TransitForecastReport }) {
  const x = useXScale(report)
  const rowH = 26
  const h = RIBBON_ORDER.length * rowH + 6
  return (
    <svg viewBox={`0 0 ${W} ${h}`} className={styles.ribbon} role="img" aria-label="Slow planet sign transits">
      {RIBBON_ORDER.map((pid, row) => (
        <g key={pid} transform={`translate(0 ${row * rowH + 3})`}>
          <text x={PAD.l - 6} y={rowH / 2 + 1} textAnchor="end" className={styles.ribbonPlanet}>{pid}</text>
          {report.tracks.filter(t => t.planet === pid).map(t => {
            const x0 = x(t.startIso)
            const wd = Math.max(1, x(t.endIso) - x0)
            return (
              <g key={`${pid}-${t.startIso}`}>
                <title>{`${GRAHA_NAMES[pid]} in ${t.signName} · ${fmtRange(t.startIso, t.endIso)} · H${t.houseFromLagna} from Lagna · ${t.houseFromMoon} from Moon${t.bindus != null ? ` · ${t.bindus} bindus` : ''}`}</title>
                <rect x={x0 + 1} y={2} width={Math.max(1, wd - 2)} height={rowH - 6} rx={5}
                  className={t.favourable ? styles.segGood : styles.segBad} />
                {(() => {
                  const full = `${RASHI_SHORT[t.rashi]} · H${t.houseFromLagna} · M${t.houseFromMoon}${t.bindus != null ? ` · ${t.bindus}b` : ''}`
                  const label = wd - 14 >= full.length * 6.4 ? full : wd - 14 >= 2 * 7 ? RASHI_SHORT[t.rashi] : ''
                  return label ? <text x={x0 + 8} y={rowH / 2 + 1} className={styles.segText}>{label}</text> : null
                })()}
              </g>
            )
          })}
        </g>
      ))}
    </svg>
  )
}

// ── Cards ────────────────────────────────────────────────────

function Sparkline({ values }: { values: number[] }) {
  const w = 120
  const h = 28
  const pts = values.map((v, i) => `${(i / Math.max(1, values.length - 1)) * w},${h - (v / 100) * h}`).join(' ')
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className={styles.spark} preserveAspectRatio="none" aria-hidden>
      <line x1={0} x2={w} y1={h / 2} y2={h / 2} className={styles.sparkMid} />
      <polyline points={pts} className={styles.sparkLine} />
    </svg>
  )
}

function OutlookCard({ o, series, active, onClick }: { o: AreaOutlook; series: number[]; active: boolean; onClick: () => void }) {
  const arrow = o.trend === 'rising' ? '↗' : o.trend === 'falling' ? '↘' : '→'
  return (
    <button type="button" className={`${styles.outlook} ${active ? styles.outlookOn : ''}`} onClick={onClick} aria-pressed={active}>
      <div className={styles.outlookHead}>
        <span className={styles.outlookLabel}>{o.label}</span>
        <span className={`${styles.outlookScore} ${toneClassOf(o.now)}`}>{o.now}<small> {arrow}</small></span>
      </div>
      <Sparkline values={series} />
      <dl className={styles.outlookMeta}>
        {o.bestWindow && (<><dt>Best window</dt><dd>{fmtRange(o.bestWindow.startIso, o.bestWindow.endIso)}</dd></>)}
        {o.nextDoubleTransitIso && (<><dt>Double transit</dt><dd>★ {fmtDate(o.nextDoubleTransitIso)}</dd></>)}
      </dl>
      {o.notes.length > 0 && (
        <ul className={styles.outlookNotes}>
          {o.notes.slice(0, 2).map(n => <li key={n}>{n}</li>)}
        </ul>
      )}
    </button>
  )
}

function DoAvoid({ doList, avoidList }: { doList: string[]; avoidList: string[] }) {
  return (
    <div className={styles.doAvoid}>
      <div>
        <span className={`${styles.doAvoidHead} ${styles.good}`}>Do</span>
        <ul>{doList.map(x => <li key={x}>{x}</li>)}</ul>
      </div>
      <div>
        <span className={`${styles.doAvoidHead} ${styles.bad}`}>Avoid</span>
        <ul>{avoidList.map(x => <li key={x}>{x}</li>)}</ul>
      </div>
    </div>
  )
}

function WindowCard({ w, p }: { w: ForecastWindow; p?: WindowPrediction }) {
  return (
    <div className={`${styles.window} ${w.kind === 'favourable' ? styles.windowGood : styles.windowBad}`}>
      <div className={styles.windowHead}>
        <strong>{w.kind === 'favourable' ? 'Favourable' : 'Caution'} · {w.leadAreaLabel}</strong>
        <span className={styles.mono}>{fmtRange(w.startIso, w.endIso)}</span>
      </div>
      <p>{p?.expect ?? w.summary}</p>
      {p && <DoAvoid doList={p.doList} avoidList={p.avoidList} />}
      <span className={styles.windowStat}>avg {w.avg} · {w.kind === 'favourable' ? 'peak' : 'low'} {w.peak}</span>
    </div>
  )
}

// ── Written predictions ──────────────────────────────────────

function toneLabel(t: PredictionTone): string {
  return t === 'supportive' ? 'Supportive' : t === 'pressure' ? 'Challenging' : 'Mixed'
}

function tonePill(t: PredictionTone): string {
  return t === 'supportive' ? styles.pillGood : t === 'pressure' ? styles.pillBad : styles.pillMid
}

function AreaPredictionCard({ a, onPlot }: { a: AreaPrediction; onPlot: () => void }) {
  return (
    <article className={styles.predCard}>
      <header className={styles.predHead}>
        <h4>{a.label}</h4>
        <span className={`${styles.pill} ${tonePill(a.tone)}`}>{toneLabel(a.tone)}</span>
      </header>
      <p className={styles.predVerdict}>{a.verdict}</p>
      <p>{a.now}</p>
      <p><b>Ahead:</b> {a.ahead}</p>
      {a.themes.length > 0 && (
        <ul className={styles.predThemes}>{a.themes.map(t => <li key={t}>{t}</li>)}</ul>
      )}
      <DoAvoid doList={a.doList} avoidList={a.avoidList} />
      <button type="button" className={styles.linkBtn} onClick={onPlot}>Plot on curve ↑</button>
    </article>
  )
}

function MonthCard({ m }: { m: MonthPrediction }) {
  return (
    <article className={`${styles.predCard} ${styles.monthCard}`}>
      <header className={styles.predHead}>
        <h4>{m.headline}</h4>
        <span className={`${styles.pill} ${tonePill(m.tone)}`}>{m.score}</span>
      </header>
      <p>{m.text}</p>
      <div className={styles.monthMeta}>
        <span><b className={styles.good}>▲</b> {m.bestArea}</span>
        <span><b className={styles.bad}>▼</b> {m.watchArea}</span>
      </div>
      {m.events.length > 0 && (
        <details className={styles.monthEvents}>
          <summary>{m.events.length} sky event{m.events.length > 1 ? 's' : ''}</summary>
          <ul>{m.events.map(e => <li key={e}>{e}</li>)}</ul>
        </details>
      )}
    </article>
  )
}

function PredictionsSection({ p, onPlot }: { p: ForecastPredictions; onPlot: (id: ForecastAreaId) => void }) {
  const [view, setView] = useState<'areas' | 'months'>('areas')
  return (
    <section className={styles.section}>
      <div className={styles.sectionHead}>
        <h3>Predictions</h3>
        <div className={styles.chips} role="tablist" aria-label="Prediction view">
          {(['areas', 'months'] as const).map(v => (
            <button key={v} type="button" role="tab" aria-selected={view === v}
              className={`${styles.chip} ${view === v ? styles.chipOn : ''}`} onClick={() => setView(v)}>
              {v === 'areas' ? 'By life area' : 'Month by month'}
            </button>
          ))}
        </div>
      </div>
      <div className={styles.overview}>
        {p.overview.map(t => <p key={t}>{t}</p>)}
      </div>
      {view === 'areas' ? (
        <div className={styles.predGrid}>
          {p.areas.map(a => <AreaPredictionCard key={a.id} a={a} onPlot={() => onPlot(a.id)} />)}
        </div>
      ) : (
        <div className={styles.predGrid}>
          {p.months.map(m => <MonthCard key={m.month} m={m} />)}
        </div>
      )}
    </section>
  )
}

function DriverRow({ d }: { d: ForecastDriver }) {
  const pct = Math.min(100, Math.abs(d.impact) * 260)
  return (
    <li className={styles.driver}>
      <span className={styles.driverPlanet}>{d.planet}</span>
      <div className={styles.driverBody}>
        <div className={styles.driverBarTrack}>
          <span className={styles.driverAxis} />
          <i className={d.impact >= 0 ? styles.driverPos : styles.driverNeg}
            style={{ width: `${pct / 2}%`, [d.impact >= 0 ? 'left' : 'right']: '50%' } as React.CSSProperties} />
        </div>
        <p>{d.text}</p>
      </div>
      {d.dashaRole && <span className={styles.dashaBadge}>{d.dashaRole}</span>}
    </li>
  )
}

const EVENT_FILTERS: Array<{ id: 'all' | ForecastEventKind | 'stations'; label: string }> = [
  { id: 'all', label: 'All' },
  { id: 'ingress', label: 'Ingress' },
  { id: 'stations', label: 'Stations' },
  { id: 'dasha', label: 'Dasha' },
]

function EventTimeline({ events }: { events: ForecastEvent[] }) {
  const [filter, setFilter] = useState<(typeof EVENT_FILTERS)[number]['id']>('all')
  const shown = events.filter(e => filter === 'all'
    || (filter === 'stations' ? e.kind === 'retrograde' || e.kind === 'direct' : e.kind === filter))
  const byMonth = new Map<string, ForecastEvent[]>()
  for (const e of shown) {
    const k = e.dateIso.slice(0, 7)
    byMonth.set(k, [...(byMonth.get(k) ?? []), e])
  }
  return (
    <div>
      <div className={styles.chips} role="tablist" aria-label="Event type">
        {EVENT_FILTERS.map(f => (
          <button key={f.id} type="button" role="tab" aria-selected={filter === f.id}
            className={`${styles.chip} ${filter === f.id ? styles.chipOn : ''}`} onClick={() => setFilter(f.id)}>
            {f.label}
          </button>
        ))}
      </div>
      {shown.length === 0 ? <p className={styles.muted}>No events of this type in the window.</p> : (
        <ol className={styles.timeline}>
          {[...byMonth.entries()].map(([month, list]) => (
            <li key={month}>
              <div className={styles.timelineMonth}>{fmtDate(`${month}-01`, { month: 'long', year: 'numeric' })}</div>
              <ul>
                {list.map(e => (
                  <li key={`${e.kind}-${e.planet}-${e.dateIso}`} className={styles.event}>
                    <span className={`${styles.eventDot} ${e.tone === 'supportive' ? styles.dotGood : e.tone === 'caution' ? styles.dotBad : styles.dotMid}`} />
                    <span className={styles.eventDate}>{fmtDate(e.dateIso, { day: 'numeric', month: 'short' })}</span>
                    <div>
                      <strong>{e.label}</strong>
                      <p>{e.detail}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ol>
      )}
    </div>
  )
}

// ── Panel ────────────────────────────────────────────────────

export function TransitForecastPanel({ chart }: TransitForecastPanelProps) {
  const [months, setMonths] = useState<Horizon>(12)
  const [report, setReport] = useState<TransitForecastReport | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [focusArea, setFocusArea] = useState<ForecastAreaId | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    ;(async () => {
      try {
        const res = await fetch('/api/transit/forecast', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(buildBody(chart, months)),
        })
        const json = await res.json()
        if (cancelled) return
        if (!res.ok || !json.success) {
          setError(json.error ?? 'Could not load forecast')
          return
        }
        setReport(json.data as TransitForecastReport)
      } catch {
        if (!cancelled) setError('Network error while loading forecast')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [chart, months])

  const areaSeries = useMemo(() => {
    const out = {} as Record<ForecastAreaId, number[]>
    for (const a of FORECAST_AREAS) out[a.id] = report?.points.map(p => p.areas[a.id].score) ?? []
    return out
  }, [report])

  const controls = (
    <div className={styles.toolbar}>
      <div className={styles.segmented} role="tablist" aria-label="Forecast horizon">
        {HORIZONS.map(h => (
          <button key={h} type="button" role="tab" aria-selected={months === h}
            className={months === h ? styles.segOn : ''} onClick={() => setMonths(h)}>
            {h} months
          </button>
        ))}
      </div>
      {loading && report && <span className={styles.muted}>Updating…</span>}
    </div>
  )

  if (error) {
    return <div className={styles.root}>{controls}<p className={styles.error}>{error}</p></div>
  }
  if (!report) {
    return (
      <div className={styles.root}>
        {controls}
        <div className={styles.skeleton} aria-busy="true">Reading the sky ahead…</div>
      </div>
    )
  }

  const now = report.now
  const favCount = report.windows.filter(w => w.kind === 'favourable').length
  const cautionCount = report.windows.length - favCount
  const focusLabel = focusArea ? FORECAST_AREAS.find(a => a.id === focusArea)?.label : null

  return (
    <div className={styles.root} style={{ opacity: loading ? 0.6 : 1 }}>
      {controls}

      <section className={styles.hero}>
        <Gauge score={now.overall} />
        <div className={styles.heroMeta}>
          <div className={styles.eyebrow}>
            <span>Transit weather · {fmtDate(report.asOfIso)}</span>
            {now.md && <span className={styles.dashaChip}>{GRAHA_NAMES[now.md]} MD / {now.ad ? GRAHA_NAMES[now.ad] : '—'} AD</span>}
          </div>
          <h2 className={`${styles.mood} ${toneClassOf(now.overall)}`}>{moodOf(now.overall)}</h2>
          <p className={styles.headline}>{report.headline}</p>
          <div className={styles.stats}>
            <span><b className={report.trend30 >= 0 ? styles.good : styles.bad}>{report.trend30 >= 0 ? '+' : ''}{report.trend30}</b> next 30 days</span>
            <span><b className={styles.good}>{favCount}</b> favourable windows</span>
            <span><b className={styles.bad}>{cautionCount}</b> caution windows</span>
          </div>
        </div>
      </section>

      {report.predictions && (
        <PredictionsSection p={report.predictions} onPlot={id => {
          setFocusArea(id)
          document.getElementById('tf-curve')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }} />
      )}

      <section className={styles.section} id="tf-curve">
        <div className={styles.sectionHead}>
          <h3>{focusLabel ? `${focusLabel} forecast` : 'Forecast curve'}</h3>
          <span className={styles.muted}>
            {focusLabel ? <button type="button" className={styles.linkBtn} onClick={() => setFocusArea(null)}>Show overall</button>
              : 'Shaded bands = favourable / caution windows · pins = Ju/Sa/Ra ingress · dashed = Antardasha change'}
          </span>
        </div>
        <ForecastCurve report={report} focusArea={focusArea} />
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHead}>
          <h3>Life areas</h3>
          <span className={styles.muted}>Colour = tone · intensity = activation · ★ = Jupiter + Saturn double transit. Click a row to plot it.</span>
        </div>
        <div className={styles.scrollX}>
          <AreaHeatmap report={report} months={months} focusArea={focusArea} onFocus={setFocusArea} />
        </div>
        <div className={styles.outlookGrid}>
          {report.areaOutlooks.map(o => (
            <OutlookCard key={o.id} o={o} series={areaSeries[o.id]} active={focusArea === o.id}
              onClick={() => setFocusArea(focusArea === o.id ? null : o.id)} />
          ))}
        </div>
      </section>

      <div className={styles.split}>
        <section className={styles.section}>
          <div className={styles.sectionHead}><h3>What drives today</h3></div>
          <ul className={styles.drivers}>
            {now.drivers.map(d => <DriverRow key={d.planet} d={d} />)}
          </ul>
        </section>
        <section className={styles.section}>
          <div className={styles.sectionHead}><h3>Key windows</h3></div>
          {report.windows.length === 0
            ? <p className={styles.muted}>No sharply favourable or difficult stretches — an even period.</p>
            : <div className={styles.windows}>{report.windows.map(w => (
                <WindowCard key={`${w.kind}-${w.startIso}`} w={w}
                  p={report.predictions?.windows.find(x => x.kind === w.kind && x.startIso === w.startIso)} />
              ))}</div>}
        </section>
      </div>

      <section className={styles.section}>
        <div className={styles.sectionHead}>
          <h3>Slow-planet ribbon</h3>
          <span className={styles.muted}>Sign · H = house from Lagna · M = house from Moon · b = BAV bindus. Teal = favourable gochar from Moon.</span>
        </div>
        <div className={styles.scrollX}>
          <PlanetRibbon report={report} />
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHead}><h3>Event timeline</h3></div>
        <EventTimeline events={report.events} />
      </section>

      <details className={styles.method}>
        <summary>How this forecast is computed</summary>
        <ul>{report.method.map(m => <li key={m}>{m}</li>)}</ul>
      </details>
    </div>
  )
}
