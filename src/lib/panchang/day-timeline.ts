/**
 * Limb timeline between local sunrise and next sunrise (Hindu civil day style).
 * Boundaries = union of tithi, nakṣatra, yoga, and karaṇa changes from ephemeris search.
 */

import type { AyanamshaMode } from '@/types/astrology'
import { getPlanetPosition, getAyanamsha, toSidereal, SWISSEPH_IDS } from '@/lib/engine/ephemeris'
import { getTithi, getNakshatra, getYoga, getKarana, getVara } from '@/lib/engine/nakshatra'
import {
  findNextTithiEnd,
  findNextNakshatraEnd,
  findNextYogaEnd,
  findNextKaranaEnd,
  dateToJulianDayUtc,
} from '@/lib/panchang/transitions'

const JD_UNIX = 2440587.5

function jdToIso(jd: number): string {
  return new Date((jd - JD_UNIX) * 86400000).toISOString()
}

function siderealAt(jd: number, mode: AyanamshaMode): { sun: number; moon: number } {
  const sunT = getPlanetPosition(jd, SWISSEPH_IDS.Su).longitude
  const moonT = getPlanetPosition(jd, SWISSEPH_IDS.Mo).longitude
  const ayan = getAyanamsha(jd, mode)
  return { sun: toSidereal(sunT, ayan), moon: toSidereal(moonT, ayan) }
}

export interface TimelineSegment {
  start: string
  end: string
  label: string
  /** e.g. pakṣa for tithi */
  sub?: string
}

export interface PanchangDayTimeline {
  windowStart: string
  windowEnd: string
  sunrise: string
  sunset: string
  /** Sorted union of segment end-times (after per-limb merge) — any limb changed */
  boundaryTimes: string[]
  tithi: TimelineSegment[]
  nakshatra: TimelineSegment[]
  yoga: TimelineSegment[]
  karana: TimelineSegment[]
  vara: { name: string; sanskrit: string }
}

function collectBoundaryJds(jdStart: number, jdEnd: number, mode: AyanamshaMode): number[] {
  const bset = new Set<number>([jdStart, jdEnd])
  let jd = jdStart + 3 / 86400
  const maxIter = 72

  for (let i = 0; i < maxIter && jd < jdEnd - 3 / 86400; i++) {
    const cands: number[] = []
    const t1 = findNextTithiEnd(jd, mode)
    const t2 = findNextNakshatraEnd(jd, mode)
    const t3 = findNextYogaEnd(jd, mode)
    const t4 = findNextKaranaEnd(jd, mode)
    if (t1) cands.push(dateToJulianDayUtc(t1))
    if (t2) cands.push(dateToJulianDayUtc(t2))
    if (t3) cands.push(dateToJulianDayUtc(t3))
    if (t4) cands.push(dateToJulianDayUtc(t4))

    const inWin = cands.filter((x) => x > jdStart + 1 / 86400 && x < jdEnd - 1 / 86400)
    if (inWin.length === 0) break

    const next = Math.min(...inWin)
    if (next <= jd || next >= jdEnd - 1 / 86400) {
      jd += 1 / 12
      continue
    }
    bset.add(next)
    jd = next + 3 / 86400
  }

  const sorted = Array.from(bset).sort((a, b) => a - b)
  const deduped: number[] = []
  for (const x of sorted) {
    if (deduped.length === 0 || x - deduped[deduped.length - 1] > 5 / 86400) deduped.push(x)
  }
  return deduped
}

function buildSegments(
  boundaries: number[],
  mode: AyanamshaMode,
  pick: (sun: number, moon: number) => { label: string; sub?: string },
): TimelineSegment[] {
  const out: TimelineSegment[] = []
  for (let i = 0; i < boundaries.length - 1; i++) {
    const a = boundaries[i]
    const b = boundaries[i + 1]
    if (b - a < 1 / 86400) continue
    const mid = (a + b) / 2
    const { sun, moon } = siderealAt(mid, mode)
    const { label, sub } = pick(sun, moon)
    out.push({
      start: jdToIso(a),
      end: jdToIso(b),
      label,
      sub,
    })
  }
  return out
}

/** Union boundaries split rows; merge runs where this limb’s label (+ sub) is unchanged. */
function mergeAdjacentSameLimb(segments: TimelineSegment[]): TimelineSegment[] {
  if (segments.length === 0) return []
  const key = (s: TimelineSegment) => `${s.label}\0${s.sub ?? ''}`
  const out: TimelineSegment[] = []
  let cur = { ...segments[0] }
  for (let i = 1; i < segments.length; i++) {
    const s = segments[i]
    if (key(s) === key(cur)) {
      cur = { ...cur, end: s.end }
    } else {
      out.push(cur)
      cur = { ...s }
    }
  }
  out.push(cur)
  return out
}

function unionSegmentEndTimes(rows: TimelineSegment[][], windowEndIso: string): string[] {
  const ends = new Set<string>()
  for (const row of rows) {
    for (const seg of row) {
      if (seg.end !== windowEndIso) ends.add(seg.end)
    }
  }
  return Array.from(ends).sort((a, b) => new Date(a).getTime() - new Date(b).getTime())
}

export function buildPanchangDayTimeline(
  sunrise: Date,
  nextSunrise: Date,
  sunset: Date,
  mode: AyanamshaMode,
): PanchangDayTimeline {
  const jdStart = dateToJulianDayUtc(sunrise)
  const jdEnd = dateToJulianDayUtc(nextSunrise)
  const boundaries = collectBoundaryJds(jdStart, jdEnd, mode)
  const v = getVara(jdStart)

  const windowEndIso = nextSunrise.toISOString()

  const tithi = mergeAdjacentSameLimb(
    buildSegments(boundaries, mode, (sun, moon) => {
      const t = getTithi(moon, sun)
      return { label: t.name, sub: t.paksha === 'shukla' ? 'Śukla' : 'Kṛṣṇa' }
    }),
  )
  const nakshatra = mergeAdjacentSameLimb(
    buildSegments(boundaries, mode, (sun, moon) => {
      const n = getNakshatra(moon)
      return { label: n.name }
    }),
  )
  const yoga = mergeAdjacentSameLimb(
    buildSegments(boundaries, mode, (sun, moon) => {
      const y = getYoga(sun, moon)
      return { label: y.name }
    }),
  )
  const karana = mergeAdjacentSameLimb(
    buildSegments(boundaries, mode, (sun, moon) => {
      const k = getKarana(moon, sun)
      return { label: k.name, sub: k.isBhadra ? 'Bhadra' : undefined }
    }),
  )

  const boundaryTimes = unionSegmentEndTimes([tithi, nakshatra, yoga, karana], windowEndIso)

  return {
    windowStart: sunrise.toISOString(),
    windowEnd: windowEndIso,
    sunrise: sunrise.toISOString(),
    sunset: sunset.toISOString(),
    boundaryTimes,
    tithi,
    nakshatra,
    yoga,
    karana,
    vara: { name: v.name, sanskrit: v.sanskrit },
  }
}
