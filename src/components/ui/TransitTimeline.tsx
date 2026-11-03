// ─────────────────────────────────────────────────────────────
//  src/components/ui/TransitTimeline.tsx
//  Visual 12-Month Cosmic Roadmap — year-at-a-glance chart (dasha
//  bands + planet sign spans), current sky, and a month-grouped
//  ingress timeline with same-day events merged per planet.
// ─────────────────────────────────────────────────────────────

'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { GRAHA_NAMES, RASHI_NAMES, RASHI_SHORT, type DashaNode, type GrahaId, type Rashi } from '@/types/astrology'
import {
  buildTransitDashaOverlay,
  dashaLordsAt,
  formatDashaPathAt,
  type DashaBandSegment,
} from '@/lib/engine/dasha/transitDashaOverlay'
import styles from './transit-roadmap.module.css'

type EventType = 'sign_change' | 'house_change' | 'nakshatra_change' | 'pada_change' | 'retrograde_start' | 'retrograde_end'

interface TransitEvent {
  planetId:    GrahaId
  date:        string
  type:        EventType
  description: string
  house:       number
  sign:        number
  nakshatra:   string
  pada:        number
  isMajor:     boolean
}

interface TransitPosition {
  planetId: GrahaId
  sign: number
  house: number
  nakshatra: string
  pada: number
  isRetro: boolean
}

interface TransitTimelineProps {
  ascRashi: number
  /** Natal Vimshottari tree — enables MD/AD band overlay on the roadmap. */
  vimshottari?: DashaNode[]
  /** Roadmap horizon in months (matches /api/transit). */
  months?: number
}

type Movement = 'major' | 'rashi' | 'nakshatra' | 'pada' | 'all'
type Scope = 'major_planets' | 'all_planets'

const MAJOR_PLANETS = new Set<GrahaId>(['Ju', 'Sa', 'Ra', 'Ke'])
const ALL_ORDER: GrahaId[] = ['Ju', 'Sa', 'Ra', 'Ke', 'Ma', 'Su', 'Ve', 'Me', 'Mo']
/** Moon changes sign every ~2.5 days — too dense for the glance chart. */
const GLANCE_EXCLUDE = new Set<GrahaId>(['Mo'])

const GRAHA_ICONS: Record<string, string> = {
  Su: '☉', Mo: '☾', Ma: '♂', Me: '☿', Ju: '♃', Ve: '♀', Sa: '♄', Ra: '☊', Ke: '☋',
}

const GRAHA_COLORS: Record<string, string> = {
  Su: 'var(--amber)',
  Mo: 'var(--text-secondary)',
  Ma: 'var(--rose)',
  Me: 'var(--teal)',
  Ju: 'var(--teal)',
  Ve: '#d986ff',
  Sa: 'var(--gold)',
  Ra: 'var(--rose)',
  Ke: 'var(--amber)',
}

const SANSKRIT: Record<string, string> = {
  Su: 'Surya', Mo: 'Chandra', Ma: 'Mangal', Me: 'Budha', Ju: 'Guru', Ve: 'Shukra', Sa: 'Shani', Ra: 'Rahu', Ke: 'Ketu',
}

const MOVEMENTS: Array<{ id: Movement; label: string }> = [
  { id: 'major', label: 'Key shifts' },
  { id: 'rashi', label: 'Sign' },
  { id: 'nakshatra', label: 'Nakshatra' },
  { id: 'pada', label: 'Pada' },
  { id: 'all', label: 'All' },
]

const TYPE_RANK: Record<EventType, number> = {
  house_change: 0,
  sign_change: 0,
  retrograde_start: 1,
  retrograde_end: 1,
  nakshatra_change: 2,
  pada_change: 3,
}

// ── Helpers ──────────────────────────────────────────────────

function dateAt(iso: string): Date {
  return new Date(`${iso.slice(0, 10)}T12:00:00Z`)
}

function fmt(d: Date, opts: Intl.DateTimeFormatOptions): string {
  return new Intl.DateTimeFormat('en-IN', { ...opts, timeZone: 'UTC' }).format(d)
}

interface RoadmapWindow { start: Date; end: Date; span: number }

function fracIn(w: RoadmapWindow, d: Date): number {
  return Math.min(1, Math.max(0, (d.getTime() - w.start.getTime()) / w.span))
}

function rashiName(n: number): string {
  return RASHI_NAMES[n as Rashi] ?? String(n)
}

function rashiShort(n: number): string {
  return RASHI_SHORT[n as Rashi] ?? String(n)
}

function ordinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd']
  const v = n % 100
  return `${n}${s[(v - 20) % 10] ?? s[v] ?? s[0]}`
}

function eventTitle(ev: TransitEvent): string {
  const name = GRAHA_NAMES[ev.planetId]
  switch (ev.type) {
    case 'house_change':
    case 'sign_change':
      return `${name} enters ${rashiName(ev.sign)}`
    case 'retrograde_start':
      return `${name} turns retrograde`
    case 'retrograde_end':
      return `${name} turns direct`
    case 'nakshatra_change':
      return `${name} enters ${ev.nakshatra}`
    default:
      return `${name} moves to ${ev.nakshatra} pada ${ev.pada}`
  }
}

function eventTag(ev: TransitEvent): string {
  switch (ev.type) {
    case 'house_change':
    case 'sign_change':
      return 'Ingress'
    case 'retrograde_start':
      return 'Retrograde'
    case 'retrograde_end':
      return 'Direct'
    case 'nakshatra_change':
      return 'Nakshatra'
    default:
      return 'Pada'
  }
}

/** Strip the engine's lead-ins so the body reads as interpretation only. */
function eventBody(ev: TransitEvent): string | null {
  if (ev.type === 'nakshatra_change' || ev.type === 'pada_change') return null
  return ev.description
    .replace(/^Activation \(H\d+\):\s*/, '')
    .replace(/^[A-Za-z]+ (enters [A-Za-z]+|turns (Direct|Retrograde))\.\s*/, '')
    .trim() || null
}

interface EventGroup {
  key: string
  date: string
  planetId: GrahaId
  primary: TransitEvent
  rest: TransitEvent[]
}

function groupEvents(list: TransitEvent[]): EventGroup[] {
  const map = new Map<string, TransitEvent[]>()
  for (const ev of list) {
    const k = `${ev.date}|${ev.planetId}`
    map.set(k, [...(map.get(k) ?? []), ev])
  }
  const out: EventGroup[] = []
  for (const [key, evs] of map) {
    const sorted = [...evs].sort((a, b) => TYPE_RANK[a.type] - TYPE_RANK[b.type])
    out.push({ key, date: sorted[0].date, planetId: sorted[0].planetId, primary: sorted[0], rest: sorted.slice(1) })
  }
  return out.sort((a, b) => a.date.localeCompare(b.date) || ALL_ORDER.indexOf(a.planetId) - ALL_ORDER.indexOf(b.planetId))
}

interface Span { startFrac: number; endFrac: number; sign: number; house: number; start: Date; end: Date }
interface RetroSpan { startFrac: number; endFrac: number }

// ── Year at a glance ─────────────────────────────────────────

function BandRow({ label, short, segments }: { label: string; short: string; segments: DashaBandSegment[] }) {
  if (segments.length === 0) return null
  return (
    <div className={styles.glanceRow}>
      <span className={styles.rowLabel}>
        <span className={styles.long}>{label}</span><span className={styles.short}>{short}</span>
      </span>
      <div className={styles.track}>
        {segments.map(seg => {
          const color = GRAHA_COLORS[seg.lord] ?? 'var(--gold)'
          const width = Math.max(0.6, (seg.endFrac - seg.startFrac) * 100)
          return (
            <div
              key={`${seg.lord}-${seg.start.toISOString()}-${seg.level}`}
              className={styles.band}
              title={`${seg.lordName}: ${seg.start.toLocaleDateString()} – ${seg.end.toLocaleDateString()}`}
              style={{
                left: `${seg.startFrac * 100}%`,
                width: `${width}%`,
                background: `color-mix(in oklab, ${color} 30%, var(--surface-2))`,
                borderColor: `color-mix(in oklab, ${color} 60%, transparent)`,
              }}
            >
              {width > 9 && <span>{seg.lordName}</span>}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function PlanetRow({ pid, spans, retro, pips, dim }: {
  pid: GrahaId
  spans: Span[]
  retro: RetroSpan[]
  pips: number[]
  dim: boolean
}) {
  const color = GRAHA_COLORS[pid]
  return (
    <div className={`${styles.glanceRow} ${dim ? styles.dim : ''}`}>
      <span className={styles.rowLabel} style={{ color }}>
        <span className={styles.rowGlyph}>{GRAHA_ICONS[pid]}</span><span className={styles.long}>{GRAHA_NAMES[pid]}</span>
      </span>
      <div className={styles.track}>
        {spans.map(s => {
          const width = (s.endFrac - s.startFrac) * 100
          return (
            <div
              key={`${pid}-${s.startFrac}`}
              className={styles.span}
              title={`${GRAHA_NAMES[pid]} in ${rashiName(s.sign)} (house ${s.house}) · ${fmt(s.start, { day: 'numeric', month: 'short' })} – ${fmt(s.end, { day: 'numeric', month: 'short', year: 'numeric' })}`}
              style={{
                left: `${s.startFrac * 100}%`,
                width: `${width}%`,
                background: `color-mix(in oklab, ${color} 20%, var(--surface-2))`,
                borderColor: `color-mix(in oklab, ${color} 50%, transparent)`,
              }}
            >
              {width > 13 ? <span>{rashiName(s.sign)} · H{s.house}</span> : width > 5 ? <span>{rashiShort(s.sign)}</span> : null}
            </div>
          )
        })}
        {retro.map(r => (
          <div key={`rx-${r.startFrac}`} className={styles.retro} title="Retrograde"
            style={{ left: `${r.startFrac * 100}%`, width: `${Math.max(0.5, (r.endFrac - r.startFrac) * 100)}%` }} />
        ))}
        {pips.map(f => (
          <span key={`pip-${f}`} className={styles.pip} style={{ left: `${f * 100}%`, background: color }} />
        ))}
      </div>
    </div>
  )
}

// ── Component ────────────────────────────────────────────────

export function TransitTimeline({ ascRashi, vimshottari, months = 12 }: TransitTimelineProps) {
  const [events, setEvents] = useState<TransitEvent[]>([])
  const [positions, setPositions] = useState<TransitPosition[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [movement, setMovement] = useState<Movement>('major')
  const [scope, setScope] = useState<Scope>('major_planets')
  const [planet, setPlanet] = useState<'all' | GrahaId>('all')

  const window0 = useMemo<RoadmapWindow>(() => {
    const now = new Date()
    const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 12))
    const end = new Date(start)
    end.setUTCMonth(end.getUTCMonth() + months)
    return { start, end, span: end.getTime() - start.getTime() }
  }, [months])

  const dashaOverlay = useMemo(() => {
    if (!vimshottari?.length) return null
    return buildTransitDashaOverlay(vimshottari, window0.start, window0.end)
  }, [vimshottari, window0])

  useEffect(() => {
    let cancelled = false
    async function fetchTransits() {
      try {
        const res = await fetch(`/api/transit?ascRashi=${ascRashi}&months=${months}`)
        const json = await res.json()
        if (cancelled) return
        if (json.success) {
          setEvents(json.data)
          setPositions(json.currentPositions || [])
        } else {
          setError(true)
        }
      } catch (err) {
        console.error('Failed to fetch transits:', err)
        if (!cancelled) setError(true)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    fetchTransits()
    return () => { cancelled = true }
  }, [ascRashi, months])

  const scopePlanets = useMemo(
    () => (scope === 'major_planets' ? ALL_ORDER.filter(p => MAJOR_PLANETS.has(p)) : ALL_ORDER),
    [scope],
  )

  // Glance rows: sign spans from current sign + ingress events; retro spans from stations.
  const glance = useMemo(() => {
    const frac = (d: Date) => fracIn(window0, d)
    return scopePlanets.filter(p => !GLANCE_EXCLUDE.has(p)).map(pid => {
      const pos = positions.find(p => p.planetId === pid)
      const evs = events.filter(e => e.planetId === pid)
      const ingress = evs.filter(e => e.type === 'house_change' || e.type === 'sign_change')
      const spans: Span[] = []
      let curStart = window0.start
      let curSign = pos?.sign ?? ingress[0]?.sign ?? 1
      let curHouse = pos?.house ?? ingress[0]?.house ?? 1
      for (const ev of ingress) {
        const d = dateAt(ev.date)
        if (d.getTime() > curStart.getTime()) {
          spans.push({ startFrac: frac(curStart), endFrac: frac(d), sign: curSign, house: curHouse, start: curStart, end: d })
        }
        curStart = d
        curSign = ev.sign
        curHouse = ev.house
      }
      spans.push({ startFrac: frac(curStart), endFrac: 1, sign: curSign, house: curHouse, start: curStart, end: window0.end })

      const retro: RetroSpan[] = []
      if (pid !== 'Ra' && pid !== 'Ke') {
        let rxStart: Date | null = pos?.isRetro ? window0.start : null
        for (const ev of evs) {
          if (ev.type === 'retrograde_start') rxStart = dateAt(ev.date)
          if (ev.type === 'retrograde_end' && rxStart) {
            retro.push({ startFrac: frac(rxStart), endFrac: frac(dateAt(ev.date)) })
            rxStart = null
          }
        }
        if (rxStart) retro.push({ startFrac: frac(rxStart), endFrac: 1 })
      }
      return { pid, spans, retro, pips: ingress.map(e => frac(dateAt(e.date))) }
    })
  }, [events, positions, scopePlanets, window0])

  const monthTicks = useMemo(() => {
    const out: Array<{ f: number; label: string; year: string | null }> = []
    const d = new Date(Date.UTC(window0.start.getUTCFullYear(), window0.start.getUTCMonth() + 1, 1, 12))
    while (d.getTime() < window0.end.getTime()) {
      out.push({
        f: (d.getTime() - window0.start.getTime()) / window0.span,
        label: fmt(d, { month: 'short' }),
        year: d.getUTCMonth() === 0 ? String(d.getUTCFullYear()).slice(2) : null,
      })
      d.setUTCMonth(d.getUTCMonth() + 1)
    }
    return out
  }, [window0])

  if (loading) {
    return (
      <div className={styles.loading}>
        <div className={`spin-loader ${styles.spinner}`} />
        <div>Calculating your personal roadmap…</div>
      </div>
    )
  }

  if (error) {
    return <div className={styles.empty}>Could not load transits. Please refresh to try again.</div>
  }

  const filteredEvents = events.filter(ev => {
    if (!scopePlanets.includes(ev.planetId)) return false
    if (planet !== 'all' && ev.planetId !== planet) return false
    if (movement === 'major') return ev.isMajor
    if (movement === 'rashi') return ev.type === 'sign_change' || ev.type === 'house_change'
    if (movement === 'nakshatra') return ev.type === 'nakshatra_change'
    if (movement === 'pada') return ev.type === 'pada_change'
    return true
  })
  const groups = groupEvents(filteredEvents)

  const byMonth = new Map<string, EventGroup[]>()
  for (const g of groups) {
    const k = g.date.slice(0, 7)
    byMonth.set(k, [...(byMonth.get(k) ?? []), g])
  }
  const adStarts = (dashaOverlay?.antar ?? []).filter(s => s.startFrac > 0.0001)

  const shownPositions = ALL_ORDER
    .map(id => positions.find(p => p.planetId === id))
    .filter((p): p is TransitPosition => !!p && scopePlanets.includes(p.planetId))

  const rangeLabel = `${fmt(window0.start, { month: 'short', year: 'numeric' })} – ${fmt(window0.end, { month: 'short', year: 'numeric' })}`
  const nowPath = vimshottari?.length ? formatDashaPathAt(vimshottari, Date.now()) : ''

  return (
    <div className={`fade-up ${styles.root}`}>
      <header className={styles.head}>
        <div>
          <h2>Cosmic Roadmap</h2>
          <p>{rangeLabel} · ingresses, stations and nakshatra shifts against your Lagna</p>
        </div>
        {nowPath && <span className={styles.nowChip}>Dasha now · {nowPath}</span>}
      </header>

      {/* ── Year at a glance ── */}
      <section className={styles.panel}>
        <div className={styles.panelHead}>
          <h3>Year at a glance</h3>
          <span className={styles.muted}>Bars = sign held (house from Lagna) · hatched = retrograde · dots = ingress</span>
        </div>
        <div className={styles.glance}>
          <div className={styles.axisRow}>
            <span />
            <div className={styles.axis}>
              <span className={styles.todayLabel} style={{ left: 0 }}>Today</span>
              {monthTicks.map(t => (
                <span key={t.f} className={`${styles.tick} ${t.year ? styles.tickYear : ''}`} style={{ left: `${t.f * 100}%` }}>
                  {t.label}{t.year ? ` ’${t.year}` : ''}
                </span>
              ))}
            </div>
          </div>
          {dashaOverlay && (
            <>
              <BandRow label="Mahadasha" short="MD" segments={dashaOverlay.maha} />
              <BandRow label="Antardasha" short="AD" segments={dashaOverlay.antar} />
              <div className={styles.divider} />
            </>
          )}
          {glance.map(row => (
            <PlanetRow key={row.pid} pid={row.pid} spans={row.spans} retro={row.retro} pips={row.pips}
              dim={planet !== 'all' && planet !== row.pid} />
          ))}
          <div className={styles.gridOverlay} aria-hidden>
            {monthTicks.map(t => <span key={t.f} style={{ left: `${t.f * 100}%` }} />)}
          </div>
        </div>
      </section>

      {/* ── Sky now ── */}
      <section className={styles.panel}>
        <div className={styles.panelHead}>
          <h3>Sky right now</h3>
          <span className={styles.muted}>House counted from your Lagna</span>
        </div>
        <div className={styles.nowGrid}>
          {shownPositions.map(p => (
            <div key={p.planetId} className={styles.nowCard} style={{ borderTopColor: GRAHA_COLORS[p.planetId] }}>
              <span className={styles.nowGlyph} style={{ color: GRAHA_COLORS[p.planetId] }}>{GRAHA_ICONS[p.planetId]}</span>
              <div className={styles.nowBody}>
                <div className={styles.nowTop}>
                  <strong>{GRAHA_NAMES[p.planetId]}</strong>
                  {p.isRetro && p.planetId !== 'Ra' && p.planetId !== 'Ke' && <span className={styles.rx}>Rx</span>}
                </div>
                <div className={styles.nowSign}>{rashiName(p.sign)} · <b>{ordinal(p.house)} house</b></div>
                <div className={styles.nowNak}>{p.nakshatra} · pada {p.pada}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Filters ── */}
      <div className={styles.toolbar}>
        <div className={styles.seg} role="tablist" aria-label="Planet scope">
          {(['major_planets', 'all_planets'] as const).map(s => (
            <button key={s} type="button" role="tab" aria-selected={scope === s}
              className={scope === s ? styles.segOn : ''}
              onClick={() => { setScope(s); if (s === 'major_planets' && planet !== 'all' && !MAJOR_PLANETS.has(planet)) setPlanet('all') }}>
              {s === 'major_planets' ? 'Slow planets' : 'All planets'}
            </button>
          ))}
        </div>
        <div className={styles.planetChips} role="tablist" aria-label="Planet">
          <button type="button" role="tab" aria-selected={planet === 'all'}
            className={`${styles.pchip} ${planet === 'all' ? styles.pchipOn : ''}`} onClick={() => setPlanet('all')}>All</button>
          {scopePlanets.map(id => (
            <button key={id} type="button" role="tab" aria-selected={planet === id} title={GRAHA_NAMES[id]}
              className={`${styles.pchip} ${planet === id ? styles.pchipOn : ''}`}
              style={planet === id ? { background: GRAHA_COLORS[id], borderColor: GRAHA_COLORS[id] } : { color: GRAHA_COLORS[id] }}
              onClick={() => setPlanet(id)}>
              {GRAHA_ICONS[id]} <span>{GRAHA_NAMES[id]}</span>
            </button>
          ))}
        </div>
        <div className={styles.seg} role="tablist" aria-label="Movement type">
          {MOVEMENTS.map(m => (
            <button key={m.id} type="button" role="tab" aria-selected={movement === m.id}
              className={movement === m.id ? styles.segOn : ''} onClick={() => setMovement(m.id)}>
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Timeline ── */}
      {groups.length === 0 ? (
        <div className={styles.empty}>No transit events for this filter in the window.</div>
      ) : (
        <div className={styles.timeline}>
          {[...byMonth.entries()].map(([month, list]) => {
            const mid = dateAt(`${month}-15`)
            const lords = vimshottari?.length ? dashaLordsAt(vimshottari, mid) : { maha: null, antar: null }
            const adHere = adStarts.filter(s => s.start.toISOString().slice(0, 7) === month)
            return (
              <section key={month} className={styles.month}>
                <h3 className={styles.monthHead}>
                  <span>{fmt(mid, { month: 'long', year: 'numeric' })}</span>
                  <span className={styles.monthMeta}>
                    {list.length} event{list.length > 1 ? 's' : ''}
                    {lords.maha && <> · {lords.maha}{lords.antar ? ` / ${lords.antar}` : ''}</>}
                  </span>
                </h3>
                <ol className={styles.events}>
                  {adHere.map(s => (
                    <li key={`ad-${s.start.toISOString()}`} className={styles.dashaEvent}>
                      <span className={styles.date}>
                        <b>{fmt(s.start, { day: 'numeric' })}</b>{fmt(s.start, { month: 'short' })}
                      </span>
                      <span className={styles.dashaMark}>◆</span>
                      <div>
                        <strong>{s.lordName} Antardasha begins</strong>
                        <p>Transits of {s.lordName} carry extra weight until {fmt(s.end, { month: 'short', year: 'numeric' })}.</p>
                      </div>
                    </li>
                  ))}
                  {list.map(g => {
                    const color = GRAHA_COLORS[g.planetId] ?? 'var(--gold)'
                    const d = dateAt(g.date)
                    const body = eventBody(g.primary)
                    const isIngress = TYPE_RANK[g.primary.type] === 0
                    const extras = g.rest.map(r => r.type === 'nakshatra_change' ? `→ ${r.nakshatra}`
                      : r.type === 'pada_change' ? `Pada ${r.pada}`
                      : r.type === 'retrograde_start' ? 'Turns Rx' : r.type === 'retrograde_end' ? 'Turns direct' : eventTag(r))
                    return (
                      <li key={g.key} className={`${styles.event} ${isIngress ? styles.eventMajor : ''}`}
                        style={{ '--accent': color } as React.CSSProperties}>
                        <span className={styles.date}>
                          <b>{fmt(d, { day: 'numeric' })}</b>{fmt(d, { month: 'short' })}
                        </span>
                        <span className={styles.glyph} style={{ color }}>{GRAHA_ICONS[g.planetId]}</span>
                        <div className={styles.eventBody}>
                          <div className={styles.eventTop}>
                            <strong>{eventTitle(g.primary)}</strong>
                            <span className={styles.tag}>{eventTag(g.primary)}</span>
                          </div>
                          {body && <p>{body}</p>}
                          <div className={styles.meta}>
                            <span className={styles.house}>{ordinal(g.primary.house)} house</span>
                            <span>{rashiName(g.primary.sign)}</span>
                            <span>{g.primary.nakshatra} · P{g.primary.pada}</span>
                            <span className={styles.sanskrit}>{SANSKRIT[g.planetId]}</span>
                            {extras.map(x => <span key={x} className={styles.extra}>{x}</span>)}
                          </div>
                        </div>
                      </li>
                    )
                  })}
                </ol>
              </section>
            )
          })}
        </div>
      )}

      <p className={styles.footnote}>
        Tip: use <b>Key shifts</b> for cycle-level changes; switch to Sign, Nakshatra or Pada for precise timing.
        A transit planet that is also your running dasha lord tends to deliver its theme more strongly.
      </p>
    </div>
  )
}
