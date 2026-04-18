/**
 * Sidereal longitudes and rāśi for all classical grahas (for pañcāṅga summary).
 */

import type { AyanamshaMode, GrahaId } from '@/types/astrology'
import { GRAHA_SANSKRIT } from '@/types/astrology'
import {
  getPlanetPosition,
  getAyanamsha,
  toSidereal,
  SWISSEPH_IDS,
  ketuLongitude,
  isCombust,
} from '@/lib/engine/ephemeris'
import { siderealLongitudeToRashi } from '@/lib/panchang/sidereal'

export interface PanchangPlanetRow {
  id: GrahaId
  sa: string
  longitude: number
  rashiEn: string
  rashiSa: string
  degInSign: number
  retro: boolean
  combust: boolean
}

const ORDER: GrahaId[] = ['Su', 'Mo', 'Ma', 'Me', 'Ju', 'Ve', 'Sa', 'Ra', 'Ke']

export function getPanchangPlanetSnapshot(jd: number, mode: AyanamshaMode): PanchangPlanetRow[] {
  const ayan = getAyanamsha(jd, mode)

  const sid = (id: GrahaId, lonTropical: number) => toSidereal(lonTropical, ayan)

  const sun = getPlanetPosition(jd, SWISSEPH_IDS.Su)
  const sunSid = sid('Su', sun.longitude)

  const rahuT = getPlanetPosition(jd, SWISSEPH_IDS.Ra)
  const rahuSid = sid('Ra', rahuT.longitude)
  const ketuSid = ketuLongitude(rahuSid)

  const rows: PanchangPlanetRow[] = []

  const push = (id: GrahaId, lon: number, retro: boolean) => {
    const r = siderealLongitudeToRashi(lon)
    rows.push({
      id,
      sa: GRAHA_SANSKRIT[id],
      longitude: lon,
      rashiEn: r.en,
      rashiSa: r.sa,
      degInSign: r.degInSign,
      retro,
      combust: id !== 'Su' && id !== 'Mo' && id !== 'Ra' && id !== 'Ke' && isCombust(id, lon, sunSid),
    })
  }

  const moon = getPlanetPosition(jd, SWISSEPH_IDS.Mo)
  push('Su', sunSid, sun.speed < 0)
  push('Mo', sid('Mo', moon.longitude), moon.speed < 0)

  for (const id of ['Ma', 'Me', 'Ju', 'Ve', 'Sa'] as const) {
    const p = getPlanetPosition(jd, SWISSEPH_IDS[id])
    push(id, sid(id, p.longitude), p.speed < 0)
  }

  push('Ra', rahuSid, rahuT.speed < 0)
  push('Ke', ketuSid, false)

  return rows.sort((a, b) => ORDER.indexOf(a.id) - ORDER.indexOf(b.id))
}
