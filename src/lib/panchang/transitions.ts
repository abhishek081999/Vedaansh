/**
 * Find next change times for tithi, nakṣatra, and yoga by bisection on Julian day (UT).
 */

import type { AyanamshaMode } from '@/types/astrology'
import { getPlanetPosition, getAyanamsha, toSidereal, SWISSEPH_IDS } from '@/lib/engine/ephemeris'
import { getTithi, getNakshatra, getYoga, getKarana } from '@/lib/engine/nakshatra'

function siderealPair(jd: number, mode: AyanamshaMode): { sun: number; moon: number } {
  const sunT = getPlanetPosition(jd, SWISSEPH_IDS.Su).longitude
  const moonT = getPlanetPosition(jd, SWISSEPH_IDS.Mo).longitude
  const ayan = getAyanamsha(jd, mode)
  return {
    sun: toSidereal(sunT, ayan),
    moon: toSidereal(moonT, ayan),
  }
}

function tithiKey(moon: number, sun: number): string {
  const t = getTithi(moon, sun)
  return `${t.paksha}-${t.number}`
}

function nakKey(moon: number): string {
  return String(getNakshatra(moon).index)
}

function yogaKey(moon: number, sun: number): string {
  return String(getYoga(sun, moon).number)
}

function karanaKey(moon: number, sun: number): string {
  const k = getKarana(moon, sun)
  return `${k.number}-${k.name}`
}

const JD_UNIX = 2440587.5

/** Swiss Ephemeris JD (UT) → JavaScript Date (UTC). */
function jdUtToDate(jd: number): Date {
  return new Date((jd - JD_UNIX) * 86400000)
}

const JD_SEC = 1 / 86400

function bisectNextChange(
  jdStart: number,
  mode: AyanamshaMode,
  keyOf: (jd: number) => string,
  maxDays: number,
): Date | null {
  const k0 = keyOf(jdStart)
  const hour = 1 / 24
  let hi = jdStart + hour
  while (hi <= jdStart + maxDays && keyOf(hi) === k0) hi += hour
  if (hi > jdStart + maxDays) return null

  let low = jdStart
  let high = hi
  while (high - low > JD_SEC) {
    const mid = (low + high) / 2
    if (keyOf(mid) === k0) low = mid
    else high = mid
  }
  return jdUtToDate(high)
}

export function findNextTithiEnd(jdStart: number, mode: AyanamshaMode): Date | null {
  return bisectNextChange(jdStart, mode, (jd) => {
    const { sun, moon } = siderealPair(jd, mode)
    return tithiKey(moon, sun)
  }, 4)
}

export function findNextNakshatraEnd(jdStart: number, mode: AyanamshaMode): Date | null {
  return bisectNextChange(jdStart, mode, (jd) => {
    const { moon } = siderealPair(jd, mode)
    return nakKey(moon)
  }, 2.5)
}

export function findNextYogaEnd(jdStart: number, mode: AyanamshaMode): Date | null {
  return bisectNextChange(jdStart, mode, (jd) => {
    const { sun, moon } = siderealPair(jd, mode)
    return yogaKey(moon, sun)
  }, 2.5)
}

/** Next karaṇa change (~6° elongation); bracket up to ~1.5 civil days. */
export function findNextKaranaEnd(jdStart: number, mode: AyanamshaMode): Date | null {
  return bisectNextChange(jdStart, mode, (jd) => {
    const { sun, moon } = siderealPair(jd, mode)
    return karanaKey(moon, sun)
  }, 1.5)
}

/** JavaScript Date (UTC) ↔ Swiss Ephemeris Julian day (UT). */
export function dateToJulianDayUtc(d: Date): number {
  return d.getTime() / 86400000 + JD_UNIX
}
