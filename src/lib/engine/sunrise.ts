// ─────────────────────────────────────────────────────────────
//  src/lib/engine/sunrise.ts
//  Real sunrise / sunset using Swiss Ephemeris rise_trans
//  Replaces the 6:00 AM / 6:00 PM placeholder
// ─────────────────────────────────────────────────────────────

import sweph from 'sweph'
import { toJulianDay } from './ephemeris'
import { fromZonedTime } from 'date-fns-tz'

// ── swisseph rise_trans flags ─────────────────────────────────
// SE_CALC_RISE  = 1  (sunrise)
// SE_CALC_SET   = 2  (sunset)
const SE_CALC_RISE = 1
const SE_CALC_SET  = 2
// Atmospheric refraction flag
const SE_BIT_DISC_CENTER   = 256
const SEFLG_SWIEPH         = 2
const ATPRESS              = 1013.25   // average atmospheric pressure (mbar)
const ATTEMP               = 15        // average temperature (°C)

// sweph types are incomplete — cast to any for rise_trans
const swephAny = sweph as any
const C = sweph.constants
const SE_SUN  = C.SE_SUN  ?? 0
const SE_MOON = C.SE_MOON ?? 1

/**
 * Swiss Ephemeris `rise_trans` (sweph npm) returns `{ flag, error, data }` where `data` is the event JD.
 * Older code paths sometimes used `tret[0]` — support both.
 */
function jdFromRiseTrans(result: { flag: number; data?: number; tret?: number[] }): number | null {
  if (result.flag !== C.OK) return null
  if (typeof result.data === 'number' && result.data > 0) return result.data
  const t0 = result.tret?.[0]
  if (typeof t0 === 'number' && t0 > 0) return t0
  return null
}

/** Julian day for this exact instant (UTC components), for rise_trans search start. */
function dateToJulianDayUtc(d: Date): number {
  return toJulianDay(
    d.getUTCFullYear(),
    d.getUTCMonth() + 1,
    d.getUTCDate(),
    d.getUTCHours() + d.getUTCMinutes() / 60 + d.getUTCSeconds() / 3600 + d.getUTCMilliseconds() / 3_600_000,
  )
}

/**
 * Calculate true astronomical sunrise for a given date and location.
 * Returns a Date in UTC. Falls back to 6:00 AM local if sweph fails.
 */
export function getSunrise(
  dateStr:   string,   // 'YYYY-MM-DD'
  lat:       number,
  lng:       number,
  tz:        string,
): Date {
  try {
    // JD at local civil midnight (must use full UTC time — not UTC y/m/d @ 0h)
    const midnightLocal = fromZonedTime(`${dateStr}T00:00:00`, tz)
    const jdStart       = dateToJulianDayUtc(midnightLocal)

    const geopos: [number, number, number] = [lng, lat, 0]   // sweph: [longitude, latitude, altitude]

    const result = swephAny.rise_trans(
      jdStart,
      SE_SUN,
      '',
      SEFLG_SWIEPH,
      SE_CALC_RISE,
      geopos,
      ATPRESS,
      ATTEMP,
    )

    const jdEv = jdFromRiseTrans(result)
    if (jdEv == null) return fallbackSunrise(dateStr, tz)

    return julianDayToDate(jdEv)
  } catch {
    return fallbackSunrise(dateStr, tz)
  }
}

/**
 * Calculate true astronomical sunset for a given date and location.
 */
export function getSunset(
  dateStr:   string,
  lat:       number,
  lng:       number,
  tz:        string,
): Date {
  try {
    const midnightLocal = fromZonedTime(`${dateStr}T00:00:00`, tz)
    const jdStart       = dateToJulianDayUtc(midnightLocal)

    const geopos: [number, number, number] = [lng, lat, 0]

    const result = swephAny.rise_trans(
      jdStart,
      SE_SUN,
      '',
      SEFLG_SWIEPH,
      SE_CALC_SET,
      geopos,
      ATPRESS,
      ATTEMP,
    )

    const jdEv = jdFromRiseTrans(result)
    if (jdEv == null) return fallbackSunset(dateStr, tz)

    return julianDayToDate(jdEv)
  } catch {
    return fallbackSunset(dateStr, tz)
  }
}

/**
 * Get both sunrise and sunset in one call (more efficient).
 */
export function getSunriseSunset(
  dateStr: string,
  lat:     number,
  lng:     number,
  tz:      string,
): { sunrise: Date; sunset: Date } {
  return {
    sunrise: getSunrise(dateStr, lat, lng, tz),
    sunset:  getSunset(dateStr, lat, lng, tz),
  }
}

/** True if instant falls on the given civil calendar date in `tz`. */
function isLocalDate(iso: Date, dateStr: string, tz: string): boolean {
  return new Intl.DateTimeFormat('en-CA', { timeZone: tz }).format(iso) === dateStr
}

/**
 * First Moon rise on the civil day `dateStr` at `lat`/`lng`, or null (high lat / ephemeris edge cases).
 */
export function getMoonrise(dateStr: string, lat: number, lng: number, tz: string): Date | null {
  try {
    const dayStart = fromZonedTime(`${dateStr}T00:00:00`, tz)
    const jd0      = dateToJulianDayUtc(dayStart)
    const geopos: [number, number, number] = [lng, lat, 0]

    const result = swephAny.rise_trans(
      jd0,
      SE_MOON,
      '',
      SEFLG_SWIEPH,
      SE_CALC_RISE,
      geopos,
      ATPRESS,
      ATTEMP,
    )

    const jdEv = jdFromRiseTrans(result)
    if (jdEv == null) return null

    const t = julianDayToDate(jdEv)
    return isLocalDate(t, dateStr, tz) ? t : null
  } catch {
    return null
  }
}

/**
 * First Moon set on the civil day `dateStr` at `lat`/`lng`, or null.
 */
export function getMoonset(dateStr: string, lat: number, lng: number, tz: string): Date | null {
  try {
    const dayStart = fromZonedTime(`${dateStr}T00:00:00`, tz)
    const jd0      = dateToJulianDayUtc(dayStart)
    const geopos: [number, number, number] = [lng, lat, 0]

    const result = swephAny.rise_trans(
      jd0,
      SE_MOON,
      '',
      SEFLG_SWIEPH,
      SE_CALC_SET,
      geopos,
      ATPRESS,
      ATTEMP,
    )

    const jdEv = jdFromRiseTrans(result)
    if (jdEv == null) return null

    const t = julianDayToDate(jdEv)
    return isLocalDate(t, dateStr, tz) ? t : null
  } catch {
    return null
  }
}

export function getMoonriseMoonset(
  dateStr: string,
  lat: number,
  lng: number,
  tz: string,
): { moonrise: Date | null; moonset: Date | null } {
  return {
    moonrise: getMoonrise(dateStr, lat, lng, tz),
    moonset:  getMoonset(dateStr, lat, lng, tz),
  }
}

// ── Helpers ───────────────────────────────────────────────────

/**
 * Convert Julian Day Number to JavaScript Date (UTC).
 * JD 2440587.5 = 1970-01-01 00:00:00 UTC
 */
function julianDayToDate(jd: number): Date {
  const unixSeconds = (jd - 2440587.5) * 86400
  return new Date(unixSeconds * 1000)
}

function fallbackSunrise(dateStr: string, tz: string): Date {
  try { return fromZonedTime(`${dateStr}T06:00:00`, tz) }
  catch { return new Date(`${dateStr}T00:30:00Z`) }
}

function fallbackSunset(dateStr: string, tz: string): Date {
  try { return fromZonedTime(`${dateStr}T18:00:00`, tz) }
  catch { return new Date(`${dateStr}T12:30:00Z`) }
}