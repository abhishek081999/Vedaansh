// Sidereal longitude → rāśi (sign) metadata for Pañcāṅga display
import type { Rashi } from '@/types/astrology'
import { RASHI_NAMES, RASHI_SANSKRIT } from '@/types/astrology'

export interface RashiBlock {
  rashi: Rashi
  en: string
  sa: string
  /** Degrees within the sign (0–30). */
  degInSign: number
  /** Ecliptic longitude 0–360° sidereal. */
  longitude: number
}

export function siderealLongitudeToRashi(lonSidereal: number): RashiBlock {
  const norm = ((lonSidereal % 360) + 360) % 360
  const rashi = (Math.floor(norm / 30) + 1) as Rashi
  const degInSign = norm % 30
  return {
    rashi,
    en: RASHI_NAMES[rashi],
    sa: RASHI_SANSKRIT[rashi],
    degInSign,
    longitude: norm,
  }
}

/** Format decimal degrees as ° ′ ″ (ecliptic longitude 0–360). */
export function formatLongitudeDMS(lon: number): string {
  let x = ((lon % 360) + 360) % 360
  const d = Math.floor(x)
  x = (x - d) * 60
  const m = Math.floor(x)
  x = (x - m) * 60
  const s = Math.min(59, Math.round(x))
  return `${d}° ${String(m).padStart(2, '0')}′ ${String(s).padStart(2, '0')}″`
}

/** Degrees within one sign (0–30) as ° ′ ″. */
export function formatDegreesInSign(degInSign: number): string {
  const d = Math.floor(degInSign)
  const mf = (degInSign - d) * 60
  const m = Math.floor(mf)
  const s = Math.min(59, Math.round((mf - m) * 60))
  return `${d}° ${String(m).padStart(2, '0')}′ ${String(s).padStart(2, '0')}″`
}

/** Full UI block for Sun/Moon rāśi (matches /api/panchang JSON when present). */
export function rashiBlockFromLongitude(lonSidereal: number): {
  rashi: number
  en: string
  sa: string
  dms: string
  dmsInSign: string
  degInSign: number
  longitude: number
} {
  const b = siderealLongitudeToRashi(lonSidereal)
  return {
    rashi: b.rashi,
    en: b.en,
    sa: b.sa,
    degInSign: b.degInSign,
    longitude: b.longitude,
    dms: formatLongitudeDMS(lonSidereal),
    dmsInSign: formatDegreesInSign(b.degInSign),
  }
}
