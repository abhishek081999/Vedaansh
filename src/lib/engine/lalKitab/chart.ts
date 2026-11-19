// ─────────────────────────────────────────────────────────────
//  src/lib/engine/lalKitab/chart.ts
//  Lal Kitab Teva. Each planet keeps the house it holds in the
//  birth chart (whole-sign from the lagna), and the signs are then
//  dropped: house 1 is always treated as Aries, house 2 as Taurus,
//  and so on. The Chandra Teva does the same with the Moon's sign
//  as house 1. Source: 1952 edition.
// ─────────────────────────────────────────────────────────────

import type { ChartOutput, Rashi } from '@/types/astrology'
import { isLkGraha, LK_GRAHAS, LK_HOUSES, type LkChartBasis, type LkGraha, type LkHouse } from './types'

export interface LkTeva {
  basis: LkChartBasis
  /** Rashi counted as house 1 in the birth chart (lagna or Moon sign). */
  startRashi: Rashi
  house: Record<LkGraha, LkHouse>
  occupants: Record<LkHouse, LkGraha[]>
  retro: Partial<Record<LkGraha, boolean>>
}

export function houseOfRashi(rashi: Rashi, startRashi: Rashi): LkHouse {
  return ((((rashi - startRashi) % 12) + 12) % 12 + 1) as LkHouse
}

export function buildTeva(chart: ChartOutput, basis: LkChartBasis = 'lagna'): LkTeva {
  const moon = chart.grahas.find((g) => g.id === 'Mo')
  const startRashi = (basis === 'chandra' && moon ? moon.rashi : chart.lagnas.ascRashi) as Rashi
  const house = {} as Record<LkGraha, LkHouse>
  const retro: Partial<Record<LkGraha, boolean>> = {}
  for (const g of chart.grahas) {
    if (!isLkGraha(g.id)) continue
    house[g.id] = houseOfRashi(g.rashi, startRashi)
    retro[g.id] = g.isRetro
  }
  const occupants = Object.fromEntries(LK_HOUSES.map((h) => [h, [] as LkGraha[]])) as unknown as Record<LkHouse, LkGraha[]>
  for (const id of LK_GRAHAS) {
    const h = house[id]
    if (h) occupants[h].push(id)
  }
  return { basis, startRashi, house, occupants, retro }
}
