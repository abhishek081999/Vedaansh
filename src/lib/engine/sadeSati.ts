// ─────────────────────────────────────────────────────────────
//  src/lib/engine/sadeSati.ts
//  Saturn gochar from natal Moon — Sade Sati, Kantaka/Dhaiya, Ashtama
//  Classical: Sade Sati = Sa in 12th / Moon-sign / 2nd from Moon;
//  Kantaka (Dhaiya) = 4th; Ashtama = 8th from Moon.
// ─────────────────────────────────────────────────────────────

import {
  SWISSEPH_IDS,
  dateToJD,
  jdToDate,
  getPlanetPosition,
  signOf,
} from '@/lib/engine/ephemeris'
import { RASHI_NAMES, type GrahaId, type Rashi } from '@/types/astrology'

export type SaturnMoonPhaseKind =
  | 'sade_sati_rising'
  | 'sade_sati_peak'
  | 'sade_sati_setting'
  | 'kantaka'
  | 'ashtama'
  | 'clear'

export interface SaturnMoonPhase {
  kind: SaturnMoonPhaseKind
  label: string
  fromMoonHouse: number
  saturnRashi: Rashi
  saturnRashiName: string
  startIso: string
  endIso: string
  isCurrent: boolean
  /** 0–100 progress through this phase at `asOf` (0 if not current). */
  progressPct: number
  summary: string
}

export interface SadeSatiCycle {
  startIso: string
  endIso: string
  phases: SaturnMoonPhase[]
  isCurrent: boolean
  progressPct: number
  label: string
}

export interface SadeSatiSoftener {
  id: string
  title: string
  detail: string
}

export interface SadeSatiReport {
  moonRashi: Rashi
  moonRashiName: string
  asOfIso: string
  windowStartIso: string
  windowEndIso: string
  now: {
    kind: SaturnMoonPhaseKind
    label: string
    saturnRashi: Rashi
    saturnRashiName: string
    fromMoonHouse: number
    inSadeSati: boolean
    inKantaka: boolean
    inAshtama: boolean
    summary: string
  }
  currentPhase: SaturnMoonPhase | null
  currentCycle: SadeSatiCycle | null
  cycles: SadeSatiCycle[]
  specials: SaturnMoonPhase[]
  upcoming: SaturnMoonPhase[]
  softeners: SadeSatiSoftener[]
}

const RASHI_LORD: Record<number, GrahaId> = {
  1: 'Ma', 2: 'Ve', 3: 'Me', 4: 'Mo', 5: 'Su', 6: 'Me',
  7: 'Ve', 8: 'Ma', 9: 'Ju', 10: 'Sa', 11: 'Sa', 12: 'Ju',
}

const PHASE_META: Record<SaturnMoonPhaseKind, { label: string; summary: string }> = {
  sade_sati_rising: {
    label: 'Sade Sati — Rising',
    summary: 'Saturn in the 12th from Moon. Preparation phase: expenses, solitude themes, and restructuring before the peak.',
  },
  sade_sati_peak: {
    label: 'Sade Sati — Peak',
    summary: 'Saturn over the natal Moon sign. Core Sade Sati pressure on mind, body, and life foundation — discipline and patience are the remedy.',
  },
  sade_sati_setting: {
    label: 'Sade Sati — Setting',
    summary: 'Saturn in the 2nd from Moon. Closing phase: speech, family resources, and values under Saturn’s finishing lessons.',
  },
  kantaka: {
    label: 'Kantaka / Dhaiya Shani',
    summary: 'Saturn in the 4th from Moon (~2.5 years). Classical “small panoti” — domestic peace, property, and emotional security need care.',
  },
  ashtama: {
    label: 'Ashtama Shani',
    summary: 'Saturn in the 8th from Moon (~2.5 years). Transformation, longevity themes, and sudden structural change — confirm with dasha.',
  },
  clear: {
    label: 'Clear of major Saturn–Moon stress',
    summary: 'Saturn is not in the 12th, Moon-sign, 2nd, 4th, or 8th from natal Moon.',
  },
}

function utcNoon(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 12, 0, 0))
}

function toIsoDate(d: Date): string {
  return d.toISOString().slice(0, 10)
}

function houseFromMoon(saturnRashi: Rashi, moonRashi: Rashi): number {
  return ((saturnRashi - moonRashi + 12) % 12) + 1
}

export function classifySaturnFromMoon(fromMoonHouse: number): SaturnMoonPhaseKind {
  if (fromMoonHouse === 12) return 'sade_sati_rising'
  if (fromMoonHouse === 1) return 'sade_sati_peak'
  if (fromMoonHouse === 2) return 'sade_sati_setting'
  if (fromMoonHouse === 4) return 'kantaka'
  if (fromMoonHouse === 8) return 'ashtama'
  return 'clear'
}

export function isSadeSatiKind(kind: SaturnMoonPhaseKind): boolean {
  return kind === 'sade_sati_rising' || kind === 'sade_sati_peak' || kind === 'sade_sati_setting'
}

function saturnRashiAtJd(jd: number): Rashi {
  const pos = getPlanetPosition(jd, SWISSEPH_IDS.Sa, true)
  return signOf(pos.longitude) as Rashi
}

function findSignChangeJd(leftJd: number, rightJd: number, prevRashi: Rashi): number {
  let lo = leftJd
  let hi = rightJd
  for (let i = 0; i < 24; i += 1) {
    const mid = (lo + hi) / 2
    if (saturnRashiAtJd(mid) === prevRashi) lo = mid
    else hi = mid
  }
  return hi
}

interface SignSegment {
  rashi: Rashi
  startJd: number
  endJd: number
}

/**
 * Saturn whole-sign timeline with day-level ingresses (handles Rx re-entries).
 */
export function buildSaturnSignTimeline(startDate: Date, endDate: Date): SignSegment[] {
  const start = utcNoon(startDate)
  const end = utcNoon(endDate)
  const startJd = dateToJD(start)
  const endJd = dateToJD(end)
  if (endJd <= startJd) return []

  const stepDays = 5
  const segments: SignSegment[] = []
  let boundaryJd = startJd
  let prevRashi = saturnRashiAtJd(boundaryJd)

  for (let jd = startJd + stepDays; jd <= endJd + stepDays; jd += stepDays) {
    const sampleJd = Math.min(jd, endJd)
    const rashi = saturnRashiAtJd(sampleJd)
    if (rashi !== prevRashi) {
      const changeJd = findSignChangeJd(boundaryJd, sampleJd, prevRashi)
      segments.push({ rashi: prevRashi, startJd: boundaryJd, endJd: changeJd })
      boundaryJd = changeJd
      prevRashi = rashi
    }
    if (sampleJd >= endJd) break
  }

  segments.push({ rashi: prevRashi, startJd: boundaryJd, endJd: endJd })
  return segments.filter(s => s.endJd > s.startJd)
}

function progressPct(startMs: number, endMs: number, nowMs: number): number {
  if (nowMs < startMs) return 0
  if (nowMs >= endMs) return 100
  const span = endMs - startMs
  if (span <= 0) return 0
  return Math.round(((nowMs - startMs) / span) * 1000) / 10
}

function segmentToPhase(
  seg: SignSegment,
  moonRashi: Rashi,
  nowMs: number,
): SaturnMoonPhase {
  const fromMoonHouse = houseFromMoon(seg.rashi, moonRashi)
  const kind = classifySaturnFromMoon(fromMoonHouse)
  const meta = PHASE_META[kind]
  const start = jdToDate(seg.startJd)
  const end = jdToDate(seg.endJd)
  const startMs = start.getTime()
  const endMs = end.getTime()
  const isCurrent = nowMs >= startMs && nowMs < endMs
  return {
    kind,
    label: meta.label,
    fromMoonHouse,
    saturnRashi: seg.rashi,
    saturnRashiName: RASHI_NAMES[seg.rashi],
    startIso: toIsoDate(start),
    endIso: toIsoDate(end),
    isCurrent,
    progressPct: isCurrent ? progressPct(startMs, endMs, nowMs) : 0,
    summary: `${meta.summary} Saturn in ${RASHI_NAMES[seg.rashi]} (${fromMoonHouse}th from Moon).`,
  }
}

function mergeAdjacentPhases(phases: SaturnMoonPhase[]): SaturnMoonPhase[] {
  if (phases.length === 0) return []
  const out: SaturnMoonPhase[] = [{ ...phases[0] }]
  for (let i = 1; i < phases.length; i += 1) {
    const prev = out[out.length - 1]
    const cur = phases[i]
    if (
      prev.kind === cur.kind &&
      prev.saturnRashi === cur.saturnRashi &&
      prev.endIso === cur.startIso
    ) {
      prev.endIso = cur.endIso
      if (cur.isCurrent) {
        prev.isCurrent = true
        prev.progressPct = cur.progressPct
      }
    } else {
      out.push({ ...cur })
    }
  }
  return out
}

function groupSadeSatiCycles(phases: SaturnMoonPhase[], nowMs: number): SadeSatiCycle[] {
  const cycles: SadeSatiCycle[] = []
  let bucket: SaturnMoonPhase[] = []

  const flush = () => {
    if (bucket.length === 0) return
    const startIso = bucket[0].startIso
    const endIso = bucket[bucket.length - 1].endIso
    const startMs = new Date(`${startIso}T12:00:00Z`).getTime()
    const endMs = new Date(`${endIso}T12:00:00Z`).getTime()
    const isCurrent = nowMs >= startMs && nowMs < endMs
    cycles.push({
      startIso,
      endIso,
      phases: bucket,
      isCurrent,
      progressPct: isCurrent ? progressPct(startMs, endMs, nowMs) : 0,
      label: `Sade Sati ${startIso.slice(0, 4)}–${endIso.slice(0, 4)}`,
    })
    bucket = []
  }

  for (const p of phases) {
    if (isSadeSatiKind(p.kind)) {
      bucket.push(p)
    } else {
      flush()
    }
  }
  flush()
  return cycles
}

function computeSofteners(ascRashi?: Rashi): SadeSatiSoftener[] {
  if (!ascRashi) return []
  const softeners: SadeSatiSoftener[] = []
  const trikonaLords = [1, 5, 9].map((h) => {
    const rashi = (((ascRashi - 1 + (h - 1)) % 12) + 1) as Rashi
    return RASHI_LORD[rashi]
  })
  if (trikonaLords.some((l) => l === 'Mo' || l === 'Sa')) {
    softeners.push({
      id: 'trikona-moon-saturn',
      title: 'Sade Sati softener',
      detail: '1st, 5th, or 9th lord from Lagna is Moon or Saturn — classical texts note a gentler Sade Sati. Still confirm with dasha and Ashtakavarga.',
    })
  }
  return softeners
}

export interface AnalyzeSadeSatiOptions {
  asOf?: Date
  /** Years before asOf to include (default 12). */
  lookbackYears?: number
  /** Years after asOf to include (default 20). */
  lookAheadYears?: number
  /** Optional lagna for softener rules. */
  ascRashi?: Rashi
}

/**
 * Full Saturn–Moon stress report for a natal Moon rashi.
 */
export function analyzeSadeSati(
  moonRashi: Rashi,
  options: AnalyzeSadeSatiOptions = {},
): SadeSatiReport {
  const asOf = utcNoon(options.asOf ?? new Date())
  const lookback = options.lookbackYears ?? 12
  const lookAhead = options.lookAheadYears ?? 20
  const windowStart = new Date(asOf)
  windowStart.setUTCFullYear(windowStart.getUTCFullYear() - lookback)
  const windowEnd = new Date(asOf)
  windowEnd.setUTCFullYear(windowEnd.getUTCFullYear() + lookAhead)

  const nowMs = asOf.getTime()
  const timeline = buildSaturnSignTimeline(windowStart, windowEnd)
  const rawPhases = timeline.map(seg => segmentToPhase(seg, moonRashi, nowMs))
  const phases = mergeAdjacentPhases(rawPhases)

  const currentPhase = phases.find(p => p.isCurrent) ?? null
  const cycles = groupSadeSatiCycles(phases, nowMs)
  const currentCycle = cycles.find(c => c.isCurrent) ?? null
  const specials = phases.filter(p => p.kind === 'kantaka' || p.kind === 'ashtama')
  const upcoming = phases.filter(p => {
    if (p.kind === 'clear') return false
    const startMs = new Date(`${p.startIso}T12:00:00Z`).getTime()
    return startMs > nowMs
  }).slice(0, 8)

  const saNow = saturnRashiAtJd(dateToJD(asOf))
  const fromMoonHouse = houseFromMoon(saNow, moonRashi)
  const kind = classifySaturnFromMoon(fromMoonHouse)
  const meta = PHASE_META[kind]

  return {
    moonRashi,
    moonRashiName: RASHI_NAMES[moonRashi],
    asOfIso: toIsoDate(asOf),
    windowStartIso: toIsoDate(windowStart),
    windowEndIso: toIsoDate(windowEnd),
    now: {
      kind,
      label: meta.label,
      saturnRashi: saNow,
      saturnRashiName: RASHI_NAMES[saNow],
      fromMoonHouse,
      inSadeSati: isSadeSatiKind(kind),
      inKantaka: kind === 'kantaka',
      inAshtama: kind === 'ashtama',
      summary: `${meta.summary} Transit Saturn in ${RASHI_NAMES[saNow]} — ${fromMoonHouse}th from Moon in ${RASHI_NAMES[moonRashi]}.`,
    },
    currentPhase,
    currentCycle,
    cycles,
    specials,
    upcoming,
    softeners: computeSofteners(options.ascRashi),
  }
}

export function phaseTone(kind: SaturnMoonPhaseKind): 'caution' | 'mixed' | 'clear' {
  if (kind === 'sade_sati_peak' || kind === 'ashtama') return 'caution'
  if (kind === 'clear') return 'clear'
  return 'mixed'
}

export { PHASE_META }
