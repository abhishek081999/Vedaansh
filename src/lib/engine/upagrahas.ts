// ─────────────────────────────────────────────────────────────
//  src/lib/engine/upagrahas.ts
//  Upagrahas & Aprakasha grahas — BPHS Ch.3 + Uttara Kalamrita Mandi
// ─────────────────────────────────────────────────────────────

import { getNakshatra } from './nakshatra'
import { degreeInSign, signOf } from './ephemeris'
import { getSunrise, getSunset } from './sunrise'
import { RASHI_NAMES, type UpagrahaData, type Rashi } from '@/types/astrology'

/** Normalize ecliptic longitude to [0, 360). */
export function normalizeLon(lon: number): number {
  return ((lon % 360) + 360) % 360
}

/** Calendar weekday 0=Sun … 6=Sat for a YYYY-MM-DD (civil date, not timezone-shifted). */
export function weekdayFromDateStr(dateStr: string): number {
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay()
}

export function shiftDateStr(dateStr: string, deltaDays: number): string {
  const [y, m, d] = dateStr.split('-').map(Number)
  const dt = new Date(Date.UTC(y, m - 1, d + deltaDays))
  return dt.toISOString().slice(0, 10)
}

/**
 * Aprakasha (non-luminous) grahas from sidereal Sun — BPHS:
 *   Dhuma      = Sun + 133°20′
 *   Vyatipata  = 360° − Dhuma
 *   Parivesha  = Vyatipata + 180°   (aka Paridhi)
 *   Indrachapa = 360° − Parivesha
 *   Upaketu    = Indrachapa + 16°40′
 * Chain identity: Upaketu + 30° ≡ Sun
 */
export function calculateNonLuminous(sunLon: number): Record<string, number> {
  const dhooma = normalizeLon(sunLon + 133 + 20 / 60)
  const vyatipata = normalizeLon(360 - dhooma)
  const paridhi = normalizeLon(vyatipata + 180)
  const indrachapa = normalizeLon(360 - paridhi)
  const upaketu = normalizeLon(indrachapa + 16 + 40 / 60)

  return {
    Dhooma: dhooma,
    Vyatipata: vyatipata,
    Paridhi: paridhi,
    Indrachapa: indrachapa,
    Upaketu: upaketu,
  }
}

/**
 * Saturn's 1/8-day (yama) index per BPHS:
 * Day: lords from weekday lord; Night: lords from 5th weekday lord.
 * Index 0–6 are lorded; 7 is lordless.
 */
export function saturnYamaIndex(dayVara: number, isDay: boolean): number {
  const daySaturnParts = [6, 5, 4, 3, 2, 1, 0] as const
  const nightSaturnParts = [2, 1, 0, 6, 5, 4, 3] as const
  const v = ((dayVara % 7) + 7) % 7
  return isDay ? daySaturnParts[v]! : nightSaturnParts[v]!
}

export interface GulikaMaandiOffsets {
  /** ms from period start → Gulika (start of Saturn yama, BPHS) */
  gulikaMs: number
  /** ms from period start → Maandi (midpoint of Saturn yama, Uttara Kalamrita) */
  maandiMs: number
  saturnPartIdx: number
}

/**
 * Offsets within the current day or night period.
 * Gulika = Asc at beginning of Saturn's portion (BPHS).
 * Maandi = Asc at middle of Saturn's portion (Uttara Kalamrita / common Mandi).
 */
export function calculateGulikaMaandiOffsets(
  periodDurationMs: number,
  dayVara: number,
  isDay: boolean,
): GulikaMaandiOffsets {
  const partDurationMs = periodDurationMs / 8
  const saturnPartIdx = saturnYamaIndex(dayVara, isDay)
  return {
    gulikaMs: saturnPartIdx * partDurationMs,
    maandiMs: (saturnPartIdx + 0.5) * partDurationMs,
    saturnPartIdx,
  }
}

/** @deprecated Prefer calculateGulikaMaandiOffsets — kept for call-site compatibility. */
export function calculateGulikaMaandi(
  _jd: number,
  sunrise: Date,
  sunset: Date,
  isDay: boolean,
  dayVara: number,
  _ascDegree: number,
): { gulika: number; maandi: number } {
  const durationMs = isDay
    ? sunset.getTime() - sunrise.getTime()
    : 24 * 3_600_000 - (sunset.getTime() - sunrise.getTime())
  const o = calculateGulikaMaandiOffsets(durationMs, dayVara, isDay)
  return { gulika: o.gulikaMs, maandi: o.maandiMs }
}

export interface UpagrahaTimeContext {
  isDay: boolean
  /** Sunrise (day) or sunset that opens the night period */
  periodStart: Date
  periodDurationMs: number
  /** Weekday (0=Sun) whose lords assign the 8 yamas */
  dayVara: number
}

/**
 * Resolve the correct day/night window for Gulika/Maandi.
 * Pre-sunrise births use the previous night (prev sunset → today's sunrise)
 * and the previous civil day's weekday (Vedic day runs sunrise→sunrise).
 */
export function resolveUpagrahaTimeContext(
  birthUtc: Date,
  birthDateStr: string,
  lat: number,
  lng: number,
  tz: string,
  sunrise: Date,
  sunset: Date,
): UpagrahaTimeContext {
  const t = birthUtc.getTime()
  const rise = sunrise.getTime()
  const set = sunset.getTime()

  if (t >= rise && t < set) {
    return {
      isDay: true,
      periodStart: sunrise,
      periodDurationMs: set - rise,
      dayVara: weekdayFromDateStr(birthDateStr),
    }
  }

  if (t >= set) {
    // Night after sunset — ends at next sunrise
    const nextStr = shiftDateStr(birthDateStr, 1)
    const nextSunrise = getSunrise(nextStr, lat, lng, tz)
    return {
      isDay: false,
      periodStart: sunset,
      periodDurationMs: Math.max(1, nextSunrise.getTime() - set),
      dayVara: weekdayFromDateStr(birthDateStr),
    }
  }

  // Before sunrise → previous night
  const prevStr = shiftDateStr(birthDateStr, -1)
  const prevSunset = getSunset(prevStr, lat, lng, tz)
  return {
    isDay: false,
    periodStart: prevSunset,
    periodDurationMs: Math.max(1, rise - prevSunset.getTime()),
    dayVara: weekdayFromDateStr(prevStr),
  }
}

/** Beeja Sphuta (males): Sun + Venus + Jupiter */
export function calculateBeejaSphuta(sunLon: number, venusLon: number, jupiterLon: number): number {
  return normalizeLon(sunLon + venusLon + jupiterLon)
}

/** Kshetra Sphuta (females): Moon + Mars + Jupiter */
export function calculateKshetraSphuta(moonLon: number, marsLon: number, jupiterLon: number): number {
  return normalizeLon(moonLon + marsLon + jupiterLon)
}

export function buildUpagrahaData(id: string, lonSidereal: number): UpagrahaData {
  const lon = normalizeLon(lonSidereal)
  const nak = getNakshatra(lon)
  const rashi = signOf(lon) as Rashi
  const deg = degreeInSign(lon)

  return {
    id,
    name: id,
    lonSidereal: lon,
    rashi,
    rashiName: RASHI_NAMES[rashi],
    degree: deg,
    nakshatraName: nak.name,
    pada: nak.pada,
  }
}
