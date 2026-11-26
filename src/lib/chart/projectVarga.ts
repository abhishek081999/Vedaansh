// ─────────────────────────────────────────────────────────────
//  src/lib/chart/projectVarga.ts
//  Place overlay grahas (transit / partner) in a divisional chart.
// ─────────────────────────────────────────────────────────────

import type { GrahaData, Rashi } from '@/types/astrology'
import { getVargaPosition, VARGA_FUNCTIONS, type VargaName } from '@/lib/engine/vargas'

/** Place grahas in the selected divisional chart. D1 keeps the original signs. */
export function projectGrahasToVarga(grahas: GrahaData[], vargaName: string): GrahaData[] {
  if (grahas.length === 0 || vargaName === 'D1') return grahas
  if (!(vargaName in VARGA_FUNCTIONS)) return []
  return grahas.map(g => {
    const lon = g.lonSidereal || g.totalDegree
    const pos = getVargaPosition(lon, vargaName as VargaName)
    return {
      ...g,
      rashi: pos.rashi as Rashi,
      degree: pos.degree,
      totalDegree: pos.totalDegree,
    }
  })
}
