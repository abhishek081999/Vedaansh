// ─────────────────────────────────────────────────────────────
//  src/lib/engine/todayDasha.ts
//  The running Vimshottari dasha, zoomed in on today: every level from
//  Maha to Deha with dates and progress, the finer periods that turn over
//  inside today's window, the next period changes, and where the dasha
//  lords are transiting right now. Pure: no React, DB or ephemeris.
// ─────────────────────────────────────────────────────────────

import type { DashaNode, GrahaId } from '@/types/astrology'
import { GRAHA_NAMES } from '@/types/astrology'
import { expandVimshottariNode } from '@/lib/engine/dasha/vimshottari'
import { isDashaRunning } from '@/lib/engine/dasha/current'
import type { DashaDay, GocharRow, MoonDay } from '@/lib/engine/todayReading'

export interface TodayDashaNatalInput {
  dashas?: { vimshottari?: DashaNode[] }
}

export interface TodayDashaInput {
  natal: TodayDashaNatalInput
  reading: { dasha: DashaDay[]; gochar: GocharRow[]; moon?: MoonDay }
  now: Date
  /** Start of today's window (sunrise). Defaults to `now`. */
  windowStart?: Date
  /** End of today's window (next sunrise). Defaults to 24h after `windowStart`. */
  windowEnd?: Date
}

export interface DashaLevelRow {
  level: number
  levelLabel: string
  lord: GrahaId
  lordName: string
  startIso: string
  endIso: string
  /** 0–1 share of this period already elapsed. */
  progress: number
  remaining: string
  tone?: DashaDay['tone']
  note?: string
}

export interface DashaMicroPeriod {
  level: number
  levelLabel: string
  lord: GrahaId
  lordName: string
  startIso: string
  endIso: string
  current: boolean
  past: boolean
}

export interface DashaChange {
  level: number
  levelLabel: string
  fromLordName: string
  toLordName: string | null
  atIso: string
  /** Human distance from now, e.g. "in 3d 4h". */
  inText: string
  /** True when the change lands inside today's window. */
  today: boolean
}

export interface DashaLordTransit {
  lord: GrahaId
  lordName: string
  /** Dasha levels this planet rules right now, e.g. ['Mahadasha', 'Pratyantar']. */
  roles: string[]
  rashiName: string
  fromMoon: number
  fromLagna: number
  /** Moon has no Vedha rule; it is read by Chandra Bala (good / average / bad). */
  status: GocharRow['status'] | 'neutral'
  isRetro: boolean
  note: string
}

export interface TodayDasha {
  levels: DashaLevelRow[]
  /** Sookshma periods around now (previous, running, next). */
  sookshma: DashaMicroPeriod[]
  /** Prana periods touching today's window. */
  prana: DashaMicroPeriod[]
  /** Next change at each of the first four levels, soonest first. */
  changes: DashaChange[]
  lords: DashaLordTransit[]
  summary: string
}

const LEVEL_LABEL: Record<number, string> = {
  1: 'Mahadasha', 2: 'Antardasha', 3: 'Pratyantar', 4: 'Sookshma', 5: 'Prana', 6: 'Deha',
}

const MAX_LEVEL = 6
const HOUR = 3_600_000
const DAY = 24 * HOUR

function toMs(v: Date | string | number): number {
  if (v instanceof Date) return v.getTime()
  if (typeof v === 'number') return v
  return new Date(v).getTime()
}

const iso = (ms: number) => new Date(ms).toISOString()

/** Compact span: "4y 2m", "3m 12d", "2d 5h", "7h 20m". */
export function formatSpan(ms: number): string {
  if (ms <= 0) return 'now'
  const days = ms / DAY
  if (days >= 365.25) {
    const y = Math.floor(days / 365.25)
    const m = Math.floor((days - y * 365.25) / 30.44)
    return m > 0 ? `${y}y ${m}m` : `${y}y`
  }
  if (days >= 60) {
    const m = Math.floor(days / 30.44)
    const d = Math.floor(days - m * 30.44)
    return d > 0 ? `${m}m ${d}d` : `${m}m`
  }
  if (days >= 1) {
    const d = Math.floor(days)
    const h = Math.floor((ms - d * DAY) / HOUR)
    return h > 0 ? `${d}d ${h}h` : `${d}d`
  }
  const h = Math.floor(ms / HOUR)
  const m = Math.floor((ms - h * HOUR) / 60_000)
  if (h === 0) return `${Math.max(m, 1)}m`
  return m > 0 ? `${h}h ${m}m` : `${h}h`
}

/** Children of a node, built on demand for the deeper levels the chart API leaves empty. */
function childrenOf(node: DashaNode, nowMs: number): DashaNode[] {
  if (node.level >= MAX_LEVEL) return []
  if (node.children && node.children.length > 0) return node.children
  return expandVimshottariNode(node, node.level + 1, { now: nowMs })
}

/** Maha → Deha path running at `nowMs`, expanding levels the chart does not carry. */
function runningPath(roots: DashaNode[], nowMs: number): DashaNode[] {
  const path: DashaNode[] = []
  let cur = roots.find(n => isDashaRunning(n, nowMs))
  while (cur) {
    path.push(cur)
    cur = childrenOf(cur, nowMs).find(c => isDashaRunning(c, nowMs))
  }
  return path
}

function micro(n: DashaNode, nowMs: number): DashaMicroPeriod {
  const start = toMs(n.start)
  const end = toMs(n.end)
  return {
    level: n.level,
    levelLabel: LEVEL_LABEL[n.level] ?? `Level ${n.level}`,
    lord: n.lord as GrahaId,
    lordName: GRAHA_NAMES[n.lord as GrahaId] ?? n.lord,
    startIso: iso(start),
    endIso: iso(end),
    current: nowMs >= start && nowMs < end,
    past: end <= nowMs,
  }
}

const nameOf = (lord: string) => GRAHA_NAMES[lord as GrahaId] ?? lord

export function buildTodayDasha(input: TodayDashaInput): TodayDasha | null {
  const roots = input.natal.dashas?.vimshottari ?? []
  const nowMs = input.now.getTime()
  const path = runningPath(roots, nowMs)
  if (path.length === 0) return null

  const winStart = (input.windowStart ?? input.now).getTime()
  const winEnd = (input.windowEnd ?? new Date(winStart + DAY)).getTime()
  const readingBy = new Map(input.reading.dasha.map(d => [d.level, d]))

  // ── Every running level with progress ─────────────────────
  const levels: DashaLevelRow[] = path.map(n => {
    const start = toMs(n.start)
    const end = toMs(n.end)
    const span = Math.max(end - start, 1)
    const r = readingBy.get(n.level)
    return {
      level: n.level,
      levelLabel: LEVEL_LABEL[n.level] ?? `Level ${n.level}`,
      lord: n.lord as GrahaId,
      lordName: nameOf(n.lord),
      startIso: iso(start),
      endIso: iso(end),
      progress: Math.min(Math.max((nowMs - start) / span, 0), 1),
      remaining: formatSpan(end - nowMs),
      tone: r?.tone,
      note: r?.note,
    }
  })

  // ── Sookshma around now (previous / running / next) ───────
  const pratyantar = path.find(n => n.level === 3)
  const sookshmaNode = path.find(n => n.level === 4)
  let sookshma: DashaMicroPeriod[] = []
  if (pratyantar && sookshmaNode) {
    const siblings = childrenOf(pratyantar, nowMs)
    const idx = siblings.findIndex(s => isDashaRunning(s, nowMs))
    if (idx >= 0) sookshma = siblings.slice(Math.max(idx - 1, 0), idx + 2).map(s => micro(s, nowMs))
  }

  // ── Prana touching today's window ─────────────────────────
  let prana: DashaMicroPeriod[] = []
  if (sookshmaNode) {
    const candidates = [...childrenOf(sookshmaNode, nowMs)]
    // A window that runs past this Sookshma pulls in the next one's first Prana periods.
    if (toMs(sookshmaNode.end) < winEnd && pratyantar) {
      const next = childrenOf(pratyantar, nowMs).find(s => toMs(s.start) >= toMs(sookshmaNode.end))
      if (next) candidates.push(...childrenOf(next, nowMs))
    }
    prana = candidates
      .filter(p => toMs(p.end) > winStart && toMs(p.start) < winEnd)
      .map(p => micro(p, nowMs))
  }

  // ── Next change at each of the first four levels ──────────
  const changes: DashaChange[] = []
  path.slice(0, 4).forEach((n, i) => {
    const siblings = i === 0 ? roots : childrenOf(path[i - 1], nowMs)
    const idx = siblings.findIndex(s => s === n || (s.lord === n.lord && toMs(s.start) === toMs(n.start)))
    const next = idx >= 0 ? siblings[idx + 1] : undefined
    const at = toMs(n.end)
    changes.push({
      level: n.level,
      levelLabel: LEVEL_LABEL[n.level] ?? `Level ${n.level}`,
      fromLordName: nameOf(n.lord),
      toLordName: next ? nameOf(next.lord) : null,
      atIso: iso(at),
      inText: `in ${formatSpan(at - nowMs)}`,
      today: at >= winStart && at < winEnd,
    })
  })
  changes.sort((a, b) => a.atIso.localeCompare(b.atIso))

  // ── Where the Maha / Antar / Pratyantar lords sit today ───
  const lordRoles = new Map<GrahaId, string[]>()
  for (const n of path.slice(0, 3)) {
    const lord = n.lord as GrahaId
    lordRoles.set(lord, [...(lordRoles.get(lord) ?? []), LEVEL_LABEL[n.level] ?? `Level ${n.level}`])
  }
  const lords: DashaLordTransit[] = []
  for (const [lord, roles] of lordRoles) {
    if (lord === 'Mo' && input.reading.moon) {
      const m = input.reading.moon
      lords.push({
        lord, lordName: nameOf(lord), roles,
        rashiName: m.rashiName, fromMoon: m.chandraPosition, fromLagna: m.lagnaHouse,
        status: m.chandraQuality === 'good' ? 'favourable' : m.chandraQuality === 'bad' ? 'unfavourable' : 'neutral',
        isRetro: false, note: m.chandraNote,
      })
      continue
    }
    const row = input.reading.gochar.find(g => g.planet === lord)
    if (!row) continue
    lords.push({
      lord, lordName: nameOf(lord), roles,
      rashiName: row.rashiName, fromMoon: row.fromMoon, fromLagna: row.fromLagna,
      status: row.status, isRetro: row.isRetro, note: row.note,
    })
  }

  // ── Summary ───────────────────────────────────────────────
  const trail = path.slice(0, 4).map(n => nameOf(n.lord)).join(' › ')
  const TONE_TEXT: Record<DashaDay['tone'], string> = {
    supportive: 'is well placed',
    mixed: 'is mixed',
    challenging: 'is under strain',
  }
  const lead = [3, 2]
    .map(l => readingBy.get(l))
    .filter((d): d is DashaDay => Boolean(d))
    .map(d => `the ${d.levelLabel} lord ${d.lordName} ${TONE_TEXT[d.tone]}`)
    .join(' and ')
  const turnovers = prana.filter(p => toMs(p.startIso) > winStart && toMs(p.startIso) < winEnd).length
  const parts = [`Running ${trail}.`]
  if (lead) parts.push(`${lead[0].toUpperCase()}${lead.slice(1)}.`)
  if (turnovers > 0) parts.push(`${turnovers === 1 ? 'One' : turnovers} Prana period${turnovers === 1 ? '' : 's'} turn${turnovers === 1 ? 's' : ''} over today.`)
  const soon = changes.find(c => c.today && c.level <= 3)
  if (soon) parts.push(`The ${soon.levelLabel} changes today${soon.toLordName ? ` from ${soon.fromLordName} to ${soon.toLordName}` : ''}.`)

  return { levels, sookshma, prana, changes, lords, summary: parts.join(' ') }
}
