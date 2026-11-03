// ─────────────────────────────────────────────────────────────
//  src/lib/engine/numerology/tithiAtSunrise.ts
//  Udaya tithi (tithi prevailing at local sunrise) for calendar
//  overlays. Server-only: uses Swiss Ephemeris.
// ─────────────────────────────────────────────────────────────

import { dateToJD, getPlanetPosition, PLANET_IDS } from '@/lib/engine/ephemeris'
import { getSunrise } from '@/lib/engine/sunrise'

/** Tithi 1–30 from tropical Sun and Moon (ayanamsha cancels in the difference). */
export function tithiFromLongitudes(sunLon: number, moonLon: number): number {
  const elong = (((moonLon - sunLon) % 360) + 360) % 360
  return Math.min(30, Math.floor(elong / 12) + 1)
}

export function tithiAtSunrise(isoDate: string, lat: number, lng: number, tz: string): number {
  const jd = dateToJD(getSunrise(isoDate, lat, lng, tz))
  const sun = getPlanetPosition(jd, PLANET_IDS.Su).longitude
  const moon = getPlanetPosition(jd, PLANET_IDS.Mo).longitude
  return tithiFromLongitudes(sun, moon)
}
