'use client'
// ─────────────────────────────────────────────────────────────
//  src/components/dasha/DashaVisualizer.tsx
//  Graphic dasha explorer — life wheel (MD/AD rings + now needle),
//  life ribbon with ages, zoom track for one Mahadasha (AD + sub
//  periods), running-period progress meters and upcoming changes.
//  Works for any DashaNode tree (Vimshottari, Yogini, Chara, …).
// ─────────────────────────────────────────────────────────────

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { useTranslations } from 'next-intl'
import { useLang } from '@/i18n/useLang'
import type { DashaNode } from '@/types/astrology'
import { expandVimshottariNode } from '@/lib/engine/dasha/vimshottari'
import { getDashaPathAt } from '@/lib/engine/dasha/current'
import { lordCodeIn, lordColor, lordNameIn } from './dashaPalette'
import styles from './dasha-visualizer.module.css'

interface DashaVisualizerProps {
  nodes: DashaNode[]
  birthDate: Date
  timezone?: string
  /** Highlight the period running at this instant. Defaults to now. */
  asOf?: Date
  /** Vimshottari only: lazily compute sub-periods that were pruned. */
  lazyExpand?: boolean
  tribhagi?: boolean
}

const YEAR_MS = 365.2425 * 24 * 60 * 60 * 1000
const LEVEL_NAMES = ['Mahadasha', 'Antardasha', 'Pratyantar', 'Sukshma', 'Prana', 'Deha']

/** Display text for the current locale; English defaults keep the component usable without a provider. */
interface VizText {
  hi: boolean
  tag: string
  levels: string[]
  t: (key: string, values?: Record<string, string | number>) => string
}

const EN_TEMPLATES: Record<string, string> = {
  d: '{n}d', m: '{n}m', y: '{n}y', ym: '{y}y {m}m', level: 'Level {n}',
  wheelAria: 'Dasha life wheel', nowAge: 'NOW · AGE {age}', adSuffix: '{lord} AD', mdDone: '{pct}% of MD done',
  outside: 'Outside dasha span', left: '{span} left', runningNow: 'Running now', noPeriod: 'No period runs at this moment.',
  nextChanges: 'Next changes', ribbon: 'Life ribbon', tapHint: 'Tap a Mahadasha to zoom in',
  md: 'MD', ad: 'AD', pd: 'PD', age: 'age', ageRange: ' · age {from}–{to}', noSub: 'Sub-periods are not available for this system.',
}

const EN_VIZ: VizText = {
  hi: false,
  tag: 'en-IN',
  levels: LEVEL_NAMES,
  t: (key, values) => (EN_TEMPLATES[key] ?? key).replace(/\{(\w+)\}/g, (_, k) => String(values?.[k] ?? '')),
}

const VizCtx = createContext<VizText>(EN_VIZ)

// ── Helpers ──────────────────────────────────────────────────

function ms(d: Date | string): number {
  return d instanceof Date ? d.getTime() : new Date(d).getTime()
}

function nodeKey(n: DashaNode): string {
  return `${n.level}:${n.lord}:${ms(n.start)}`
}

function label(n: DashaNode, x: VizText = EN_VIZ): string {
  return (x.hi ? '' : n.label) || lordNameIn(n.lord, x.hi)
}

function fmtDate(t: number, tz?: string, withDay = true, x: VizText = EN_VIZ): string {
  try {
    return new Intl.DateTimeFormat(x.tag, {
      day: withDay ? 'numeric' : undefined,
      month: 'short',
      year: 'numeric',
      timeZone: tz,
    }).format(new Date(t))
  } catch {
    return new Date(t).toLocaleDateString(x.tag)
  }
}

function fmtSpan(spanMs: number, x: VizText = EN_VIZ): string {
  const days = Math.max(0, Math.round(spanMs / 86_400_000))
  if (days < 45) return x.t('d', { n: days })
  const years = Math.floor(days / 365.2425)
  const months = Math.round((days - years * 365.2425) / 30.44)
  if (years === 0) return x.t('m', { n: months })
  if (months === 0 || months === 12) return x.t('y', { n: months === 12 ? years + 1 : years })
  return x.t('ym', { y: years, m: months })
}

function childrenOf(n: DashaNode, lazy: boolean, tribhagi: boolean, now: number): DashaNode[] {
  if (n.children?.length) return n.children
  if (!lazy) return []
  try {
    return expandVimshottariNode(n, n.level + 1, { tribhagi, now })
  } catch {
    return []
  }
}

// ── Life wheel ───────────────────────────────────────────────

const VB = 340
const C = VB / 2

function polar(r: number, deg: number): [number, number] {
  const a = ((deg - 90) * Math.PI) / 180
  // Rounded so SVG output is stable (no float noise between renders).
  return [Math.round((C + r * Math.cos(a)) * 100) / 100, Math.round((C + r * Math.sin(a)) * 100) / 100]
}

function arcPath(r0: number, r1: number, a0: number, a1: number): string {
  const sweep = Math.min(359.999, a1 - a0)
  const end = a0 + sweep
  const large = sweep > 180 ? 1 : 0
  const [x0, y0] = polar(r1, a0)
  const [x1, y1] = polar(r1, end)
  const [x2, y2] = polar(r0, end)
  const [x3, y3] = polar(r0, a0)
  return `M${x0},${y0} A${r1},${r1} 0 ${large} 1 ${x1},${y1} L${x2},${y2} A${r0},${r0} 0 ${large} 0 ${x3},${y3} Z`
}

function LifeWheel({ nodes, t0, t1, now, birth, selected, onSelect, path }: {
  nodes: DashaNode[]
  t0: number
  t1: number
  now: number
  birth: number
  selected: DashaNode | null
  onSelect: (n: DashaNode) => void
  path: DashaNode[]
}) {
  const x = useContext(VizCtx)
  const span = t1 - t0
  const ang = (t: number) => ((t - t0) / span) * 360
  const nowIn = now >= t0 && now <= t1
  const nowA = ang(Math.min(Math.max(now, t0), t1))
  const ageNow = (now - birth) / YEAR_MS
  const totalYears = span / YEAR_MS
  const ageStep = totalYears > 60 ? 10 : 5
  const ageTicks: number[] = []
  for (let y = Math.ceil(((t0 - birth) / YEAR_MS) / ageStep) * ageStep; birth + y * YEAR_MS <= t1; y += ageStep) ageTicks.push(y)

  const md = path[0]
  const ad = path[1]
  const mdPct = md ? Math.round(((now - ms(md.start)) / (ms(md.end) - ms(md.start))) * 100) : 0

  return (
    <svg viewBox={`0 0 ${VB} ${VB}`} className={styles.wheel} role="img" aria-label={x.t('wheelAria')}>
      <circle cx={C} cy={C} r={150} className={styles.wheelBg} />

      {/* past shading */}
      {nowIn && nowA > 0.5 && <path d={arcPath(84, 150, 0, nowA)} className={styles.past} />}

      {/* Mahadasha ring */}
      {nodes.map(n => {
        const a0 = ang(ms(n.start))
        const a1 = ang(ms(n.end))
        const color = lordColor(n.lord)
        const isSel = selected && nodeKey(selected) === nodeKey(n)
        const [lx, ly] = polar(133, (a0 + a1) / 2)
        return (
          <g key={nodeKey(n)} className={styles.seg} onClick={() => onSelect(n)}>
            <title>{`${label(n, x)} ${x.levels[0]} · ${fmtDate(ms(n.start), undefined, false, x)} – ${fmtDate(ms(n.end), undefined, false, x)} (${fmtSpan(ms(n.end) - ms(n.start), x)})`}</title>
            <path d={arcPath(116, 150, a0, a1)} fill={color} fillOpacity={isSel ? 0.95 : 0.7}
              className={isSel ? styles.segSel : styles.segEdge} />
            {a1 - a0 > 11 && (
              <text x={lx} y={ly} className={styles.ringText} textAnchor="middle" dominantBaseline="central">{lordCodeIn(n.lord, x.hi)}</text>
            )}
          </g>
        )
      })}

      {/* Antardasha ring */}
      {nodes.flatMap(n => n.children ?? []).map(c => {
        const a0 = ang(ms(c.start))
        const a1 = ang(ms(c.end))
        if (a1 - a0 < 0.15) return null
        return (
          <path key={nodeKey(c)} d={arcPath(90, 112, a0, a1)} fill={lordColor(c.lord)} fillOpacity={0.55}
            className={styles.segEdge}>
            <title>{`${label(c, x)} ${x.levels[1]} · ${fmtDate(ms(c.start), undefined, false, x)} – ${fmtDate(ms(c.end), undefined, false, x)}`}</title>
          </path>
        )
      })}

      {/* age ticks */}
      {ageTicks.map(y => {
        const a = ang(birth + y * YEAR_MS)
        const [x0, y0] = polar(152, a)
        const [x1, y1] = polar(158, a)
        const [tx, ty] = polar(165, a)
        return (
          <g key={y}>
            <line x1={x0} y1={y0} x2={x1} y2={y1} className={styles.tick} />
            {(ageStep === 10 || y % 10 === 0) && (
              <text x={tx} y={ty} className={styles.tickText} textAnchor="middle" dominantBaseline="central">{y}</text>
            )}
          </g>
        )
      })}

      {/* now needle */}
      {nowIn && (() => {
        const [x0, y0] = polar(80, nowA)
        const [x1, y1] = polar(156, nowA)
        return (
          <g pointerEvents="none">
            <line x1={x0} y1={y0} x2={x1} y2={y1} className={styles.needle} />
            <circle cx={x1} cy={y1} r={4} className={styles.needleDot} />
          </g>
        )
      })()}

      {/* centre */}
      <circle cx={C} cy={C} r={78} className={styles.hub} />
      {md ? (
        <>
          <text x={C} y={C - 30} textAnchor="middle" className={styles.hubEyebrow}>{x.t('nowAge', { age: Math.floor(ageNow) })}</text>
          <text x={C} y={C - 6} textAnchor="middle" className={styles.hubTitle} style={{ fill: lordColor(md.lord) }}>{label(md, x)}</text>
          {ad && <text x={C} y={C + 16} textAnchor="middle" className={styles.hubSub}>{x.t('adSuffix', { lord: label(ad, x) })}</text>}
          <text x={C} y={C + 38} textAnchor="middle" className={styles.hubMeta}>{x.t('mdDone', { pct: mdPct })}</text>
        </>
      ) : (
        <text x={C} y={C} textAnchor="middle" className={styles.hubSub}>{x.t('outside')}</text>
      )}
    </svg>
  )
}

// ── Linear tracks ────────────────────────────────────────────

function Track({ items, t0, t1, now, selectedKey, onPick, height = 30, minLabelPct = 7 }: {
  items: DashaNode[]
  t0: number
  t1: number
  now: number
  selectedKey?: string | null
  onPick?: (n: DashaNode) => void
  height?: number
  minLabelPct?: number
}) {
  const x = useContext(VizCtx)
  const span = Math.max(1, t1 - t0)
  const pct = (t: number) => Math.min(100, Math.max(0, ((t - t0) / span) * 100))
  return (
    <div className={styles.track} style={{ height }}>
      {items.map(n => {
        const l = pct(ms(n.start))
        const w = Math.max(0.3, pct(ms(n.end)) - l)
        const color = lordColor(n.lord)
        const k = nodeKey(n)
        const sel = selectedKey === k
        const running = now >= ms(n.start) && now < ms(n.end)
        return (
          <button
            key={k}
            type="button"
            className={`${styles.bar} ${sel ? styles.barSel : ''} ${running ? styles.barNow : ''}`}
            style={{
              left: `${l}%`,
              width: `${w}%`,
              background: `color-mix(in oklab, ${color} ${sel ? 55 : 32}%, var(--surface-2))`,
              borderColor: `color-mix(in oklab, ${color} 70%, transparent)`,
            }}
            title={`${label(n, x)} ${x.levels[n.level - 1] ?? ''} · ${fmtDate(ms(n.start), undefined, true, x)} – ${fmtDate(ms(n.end), undefined, true, x)} (${fmtSpan(ms(n.end) - ms(n.start), x)})`}
            onClick={onPick ? () => onPick(n) : undefined}
            tabIndex={onPick ? 0 : -1}
          >
            {/* Bar is a size container: CSS picks the full or short label by its own pixel width. */}
            {w >= minLabelPct / 3 ? (
              <>
                <span className={styles.full}>{label(n, x)}</span>
                <span className={styles.short}>{lordCodeIn(n.lord, x.hi)}</span>
              </>
            ) : null}
          </button>
        )
      })}
      {now >= t0 && now <= t1 && <span className={styles.nowLine} style={{ left: `${pct(now)}%` }} />}
    </div>
  )
}

function Axis({ t0, t1, birth, mode }: { t0: number; t1: number; birth: number; mode: 'age' | 'year' }) {
  const x = useContext(VizCtx)
  const span = t1 - t0
  const years = span / YEAR_MS
  const ticks: Array<{ p: number; text: string }> = []
  if (mode === 'age') {
    const step = years > 60 ? 10 : 5
    for (let y = Math.ceil(((t0 - birth) / YEAR_MS) / step) * step; birth + y * YEAR_MS <= t1; y += step) {
      ticks.push({ p: ((birth + y * YEAR_MS - t0) / span) * 100, text: `${y}` })
    }
  } else if (years < 2.5) {
    // Short spans (an Antardasha): month ticks, thinned to stay legible.
    const d = new Date(Date.UTC(new Date(t0).getUTCFullYear(), new Date(t0).getUTCMonth() + 1, 1))
    const step = years > 1.2 ? 3 : years > 0.6 ? 2 : 1
    for (; d.getTime() <= t1; d.setUTCMonth(d.getUTCMonth() + step)) {
      const m = d.toLocaleString(x.tag, { month: 'short', timeZone: 'UTC' })
      ticks.push({ p: ((d.getTime() - t0) / span) * 100, text: d.getUTCMonth() < step ? `${m} ’${String(d.getUTCFullYear()).slice(2)}` : m })
    }
  } else {
    const startY = new Date(t0).getUTCFullYear()
    const step = years > 12 ? 2 : 1
    for (let y = startY + 1; ; y += step) {
      const t = Date.UTC(y, 0, 1)
      if (t > t1) break
      ticks.push({ p: ((t - t0) / span) * 100, text: `${y}` })
    }
    if (ticks.length === 0) ticks.push({ p: 0, text: `${startY}` })
  }
  return (
    <div className={styles.axis}>
      {ticks.map(t => <span key={t.p} style={{ left: `${t.p}%` }}>{t.text}</span>)}
    </div>
  )
}

// ── Progress meters & upcoming ───────────────────────────────

function Meter({ n, now, tz }: { n: DashaNode; now: number; tz?: string }) {
  const x = useContext(VizCtx)
  const s = ms(n.start)
  const e = ms(n.end)
  const pct = Math.min(100, Math.max(0, ((now - s) / (e - s)) * 100))
  const color = lordColor(n.lord)
  return (
    <div className={styles.meter} style={{ '--accent': color } as React.CSSProperties}>
      <div className={styles.meterHead}>
        <span className={styles.meterLevel}>{x.levels[n.level - 1] ?? x.t('level', { n: n.level })}</span>
        <span className={styles.meterLeft}>{x.t('left', { span: fmtSpan(e - now, x) })}</span>
      </div>
      <strong className={styles.meterLord}>{label(n, x)}</strong>
      <div className={styles.meterTrack}>
        <i style={{ width: `${pct}%` }} />
      </div>
      <div className={styles.meterDates}>
        <span>{fmtDate(s, tz, n.level > 1, x)}</span>
        <b>{Math.round(pct)}%</b>
        <span>{fmtDate(e, tz, n.level > 1, x)}</span>
      </div>
    </div>
  )
}

interface Upcoming { t: number; n: DashaNode; parent?: DashaNode }

function collectUpcoming(nodes: DashaNode[], now: number, lazy: boolean, tribhagi: boolean, limit = 8): Upcoming[] {
  const out: Upcoming[] = []
  const mdIdx = nodes.findIndex(n => now < ms(n.end))
  for (const md of nodes.slice(Math.max(0, mdIdx), Math.max(0, mdIdx) + 2)) {
    if (ms(md.start) > now) out.push({ t: ms(md.start), n: md })
    for (const ad of childrenOf(md, lazy, tribhagi, now)) {
      if (ms(ad.end) <= now) continue
      if (ms(ad.start) > now && ms(ad.start) > ms(md.start)) out.push({ t: ms(ad.start), n: ad, parent: md })
      if (ms(ad.start) - now < 3 * YEAR_MS) {
        for (const pd of childrenOf(ad, lazy, tribhagi, now)) {
          // Skip the first sub-period: it starts with its parent and would repeat that change.
          if (ms(pd.start) > now && ms(pd.start) > ms(ad.start)) out.push({ t: ms(pd.start), n: pd, parent: ad })
        }
      }
    }
  }
  return out.sort((a, b) => a.t - b.t || a.n.level - b.n.level).slice(0, limit)
}

// ── Component ────────────────────────────────────────────────

export function DashaVisualizer({ nodes, birthDate, timezone, asOf, lazyExpand = false, tribhagi = false }: DashaVisualizerProps) {
  const tv = useTranslations('chart.dashaViz')
  const { hi, tag } = useLang()
  const x = useMemo<VizText>(
    () => (hi ? { hi, tag, levels: tv.raw('levels') as string[], t: (k, v) => tv(k, v) } : EN_VIZ),
    [hi, tag, tv],
  )
  const asOfMs = asOf?.getTime()
  // Freeze "now" per asOf so memoised paths and selection don't reset on every render.
  const now = useMemo(() => asOfMs ?? Date.now(), [asOfMs])
  const birth = birthDate.getTime()
  const path = useMemo(() => getDashaPathAt(nodes, now), [nodes, now])

  const [selMd, setSelMd] = useState<DashaNode | null>(null)
  const [selAd, setSelAd] = useState<DashaNode | null>(null)

  useEffect(() => {
    setSelMd(path[0] ?? nodes[0] ?? null)
    setSelAd(path[1] ?? null)
  }, [nodes, path])

  const t0 = nodes.length ? ms(nodes[0].start) : 0
  const t1 = nodes.length ? ms(nodes[nodes.length - 1].end) : 1

  const ads = useMemo(() => (selMd ? childrenOf(selMd, lazyExpand, tribhagi, now) : []), [selMd, lazyExpand, tribhagi, now])
  const activeAd = selAd && ads.some(a => nodeKey(a) === nodeKey(selAd)) ? selAd : (ads.find(a => now >= ms(a.start) && now < ms(a.end)) ?? ads[0] ?? null)
  const pds = useMemo(() => (activeAd ? childrenOf(activeAd, lazyExpand, tribhagi, now) : []), [activeAd, lazyExpand, tribhagi, now])

  // Running path with lazily expanded deeper levels for the meters.
  const meterPath = useMemo(() => {
    const out = [...path]
    while (out.length > 0 && out.length < 3) {
      const last = out[out.length - 1]
      const next = childrenOf(last, lazyExpand, tribhagi, now).find(c => now >= ms(c.start) && now < ms(c.end))
      if (!next) break
      out.push(next)
    }
    return out.slice(0, 3)
  }, [path, lazyExpand, tribhagi, now])

  const upcoming = useMemo(() => collectUpcoming(nodes, now, lazyExpand, tribhagi), [nodes, now, lazyExpand, tribhagi])

  if (!nodes.length) return null

  const selMdKey = selMd ? nodeKey(selMd) : null

  return (
    <VizCtx.Provider value={x}>
    <div className={styles.root}>
      <div className={styles.top}>
        <LifeWheel nodes={nodes} t0={t0} t1={t1} now={now} birth={birth} selected={selMd} path={path}
          onSelect={n => { setSelMd(n); setSelAd(null) }} />

        <div className={styles.side}>
          <h4 className={styles.h}>{x.t('runningNow')}</h4>
          {meterPath.length ? (
            <div className={styles.meters}>
              {meterPath.map(n => <Meter key={nodeKey(n)} n={n} now={now} tz={timezone} />)}
            </div>
          ) : <p className={styles.muted}>{x.t('noPeriod')}</p>}

          {upcoming.length > 0 && (
            <>
              <h4 className={styles.h}>{x.t('nextChanges')}</h4>
              <ol className={styles.upcoming}>
                {upcoming.map(u => (
                  <li key={nodeKey(u.n)}>
                    <span className={styles.upDot} style={{ background: lordColor(u.n.lord) }} />
                    <span className={styles.upDate}>{fmtDate(u.t, timezone, true, x)}</span>
                    <span className={styles.upText}>
                      <b>{label(u.n, x)}</b> {x.hi ? x.levels[u.n.level - 1] : LEVEL_NAMES[u.n.level - 1]?.toLowerCase()}
                      {u.parent ? <em>{x.hi ? x.t('inParent', { lord: label(u.parent, x) }) : <> in {label(u.parent)}</>}</em> : null}
                    </span>
                    <span className={styles.upIn}>{x.hi ? x.t('inSpan', { span: fmtSpan(u.t - now, x) }) : <>in {fmtSpan(u.t - now)}</>}</span>
                  </li>
                ))}
              </ol>
            </>
          )}
        </div>
      </div>

      <section className={styles.block}>
        <div className={styles.blockHead}>
          <h4 className={styles.h}>{x.t('ribbon')}</h4>
          <span className={styles.muted}>{x.t('tapHint')}</span>
        </div>
        <div className={styles.rowGrid}>
          <span className={styles.rowLabel}>{x.t('md')}</span>
          <Track items={nodes} t0={t0} t1={t1} now={now} selectedKey={selMdKey}
            onPick={n => { setSelMd(n); setSelAd(null) }} height={34} minLabelPct={5} />
          <span className={styles.rowLabel}>{x.t('age')}</span>
          <Axis t0={t0} t1={t1} birth={birth} mode="age" />
        </div>
      </section>

      {selMd && (
        <section className={styles.block}>
          <div className={styles.blockHead}>
            <h4 className={styles.h}>
              <span className={styles.swatch} style={{ background: lordColor(selMd.lord) }} />
              {x.hi ? x.t('mahaTitle', { lord: label(selMd, x) }) : <>{label(selMd)} Mahadasha</>}
            </h4>
            <span className={styles.muted}>
              {fmtDate(ms(selMd.start), timezone, true, x)} – {fmtDate(ms(selMd.end), timezone, true, x)} · {fmtSpan(ms(selMd.end) - ms(selMd.start), x)}
              {x.t('ageRange', { from: Math.max(0, Math.floor((ms(selMd.start) - birth) / YEAR_MS)), to: Math.floor((ms(selMd.end) - birth) / YEAR_MS) })}
            </span>
          </div>
          {ads.length === 0 ? (
            <p className={styles.muted}>{x.t('noSub')}</p>
          ) : (
            <div className={styles.rowGrid}>
              <span className={styles.rowLabel}>{x.t('ad')}</span>
              <Track items={ads} t0={ms(selMd.start)} t1={ms(selMd.end)} now={now}
                selectedKey={activeAd ? nodeKey(activeAd) : null} onPick={setSelAd} height={32} />
              <span />
              <Axis t0={ms(selMd.start)} t1={ms(selMd.end)} birth={birth} mode="year" />
              {activeAd && pds.length > 0 && (
                <>
                  <span className={styles.rowLabel}>{x.t('pd')}</span>
                  <div className={styles.zoomWrap}>
                    <div className={styles.connector} style={{
                      left: `${((ms(activeAd.start) - ms(selMd.start)) / (ms(selMd.end) - ms(selMd.start))) * 100}%`,
                      width: `${((ms(activeAd.end) - ms(activeAd.start)) / (ms(selMd.end) - ms(selMd.start))) * 100}%`,
                    }} />
                    <Track items={pds} t0={ms(activeAd.start)} t1={ms(activeAd.end)} now={now} height={26} minLabelPct={6} />
                  </div>
                  <span />
                  <Axis t0={ms(activeAd.start)} t1={ms(activeAd.end)} birth={birth} mode="year" />
                </>
              )}
            </div>
          )}
          {activeAd && (
            <p className={styles.caption}>
              <b style={{ color: lordColor(activeAd.lord) }}>{label(selMd, x)} / {label(activeAd, x)}</b>
              {' '}· {fmtDate(ms(activeAd.start), timezone, true, x)} – {fmtDate(ms(activeAd.end), timezone, true, x)} ({fmtSpan(ms(activeAd.end) - ms(activeAd.start), x)})
              {pds.length > 0 ? (x.hi ? x.t('pdHint') : ' — the PD row shows its sub-periods.') : ''}
            </p>
          )}
        </section>
      )}
    </div>
    </VizCtx.Provider>
  )
}
