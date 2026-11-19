// ─────────────────────────────────────────────────────────────
//  src/lib/engine/slowTransitSpans.ts
//  Sidereal sign spans of the slow planets (Saturn, Jupiter, Rahu,
//  Ketu) over a horizon of years. Server-side: uses the ephemeris.
//  Feeds careerChange windows so dasha windows can be cross-checked
//  against future gochar, not just today's sky.
// ─────────────────────────────────────────────────────────────

import { SWISSEPH_IDS, dateToJD, jdToDate, getPlanetPosition, signOf, ketuLongitude } from './ephemeris'
import type { GrahaId, Rashi } from '@/types/astrology'

export type SlowPlanet = 'Sa' | 'Ju' | 'Ra' | 'Ke'

export interface SlowTransitSpan {
  id: SlowPlanet
  rashi: Rashi
  /** ISO day the planet enters (or was already in, for the first span) the sign. */
  start: string
  /** ISO day it leaves the sign (or the horizon end). */
  end: string
}

const STEP_DAYS = 4

function rashiAt(id: SlowPlanet, jd: number): Rashi {
  if (id === 'Ke') return signOf(ketuLongitude(getPlanetPosition(jd, SWISSEPH_IDS.Ra, true).longitude)) as Rashi
  return signOf(getPlanetPosition(jd, SWISSEPH_IDS[id as Exclude<GrahaId, 'Ke'> & keyof typeof SWISSEPH_IDS], true).longitude) as Rashi
}

function isoDay(jd: number): string {
  return jdToDate(jd).toISOString().slice(0, 10)
}

export function getSlowTransitSpans(start: Date, years: number, planets: SlowPlanet[] = ['Sa', 'Ju', 'Ra', 'Ke']): SlowTransitSpan[] {
  const startJd = dateToJD(new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate(), 12)))
  const endJd = startJd + Math.round(years * 365.25)
  const out: SlowTransitSpan[] = []
  for (const id of planets) {
    let spanStart = startJd
    let current = rashiAt(id, startJd)
    for (let jd = startJd + STEP_DAYS; jd <= endJd + STEP_DAYS; jd += STEP_DAYS) {
      const probe = Math.min(jd, endJd)
      const next = rashiAt(id, probe)
      if (next !== current) {
        let lo = probe - STEP_DAYS
        let hi = probe
        for (let i = 0; i < 16; i++) {
          const mid = (lo + hi) / 2
          if (rashiAt(id, mid) === current) lo = mid
          else hi = mid
        }
        out.push({ id, rashi: current, start: isoDay(spanStart), end: isoDay(hi) })
        spanStart = hi
        current = next
      }
      if (probe === endJd) break
    }
    out.push({ id, rashi: current, start: isoDay(spanStart), end: isoDay(endJd) })
  }
  return out
}
