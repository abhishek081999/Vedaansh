// Turns a cast prashna ChartOutput into the plain inputs the pure
// Prashna Essentials engine functions take.

import type { ChartOutput, GrahaId, Rashi } from '@/types/astrology'
import { SHADVARGA, type GlancePlanet } from '@/lib/engine/prashnaGlance'

const BODIES: GrahaId[] = ['Su', 'Mo', 'Ma', 'Me', 'Ju', 'Ve', 'Sa', 'Ra', 'Ke']

/** True when the moment falls between that day's sunrise and sunset. */
export function isDayAt(chart: ChartOutput, at: Date): boolean {
  const rise = new Date(chart.panchang.sunrise).getTime()
  const set = new Date(chart.panchang.sunset).getTime()
  const ms = at.getTime()
  return Number.isFinite(rise) && Number.isFinite(set) && ms >= rise && ms < set
}

export function glancePlanets(chart: ChartOutput): GlancePlanet[] {
  return chart.grahas.filter(g => BODIES.includes(g.id)).map(g => ({
    id: g.id, rashi: g.rashi, degree: ((g.degree % 30) + 30) % 30,
    lonSidereal: g.lonSidereal, latitude: g.latitude, isCombust: g.isCombust, isRetro: g.isRetro,
  }))
}

/** Each planet's sign in the shadvarga (D1, D2, D3, D9, D12, D30), where the chart has them. */
export function shadvargaOf(chart: ChartOutput): Partial<Record<GrahaId, Rashi[]>> {
  const out: Partial<Record<GrahaId, Rashi[]>> = {}
  for (const id of BODIES) {
    const signs = SHADVARGA.map(v => chart.vargas?.[v]?.find(g => g.id === id)?.rashi).filter((r): r is Rashi => r != null)
    if (signs.length) out[id] = signs
  }
  return out
}
