// ─────────────────────────────────────────────────────────────
//  src/lib/engine/lagnaChartOverlay.ts
//  Layers a chart's real planets on top of its Lagna's whole-sign houses:
//  house lord placement + occupants (house → sign → planet reading order)
// ─────────────────────────────────────────────────────────────

import type { Dignity, GrahaData, GrahaId, Rashi } from '@/types/astrology'
import {
  isClassicalGraha,
  RASHI_LORDS,
  wholeSignHouseFromLagna,
  type ClassicalGrahaId,
  type HouseNumber,
} from '@/lib/engine/houseInterpretations'

export interface OverlayOccupant {
  id: GrahaId
  rashi: Rashi
  degree: number
  dignity: Dignity
  isRetro: boolean
  isCombust: boolean
}

export interface HouseOverlay {
  house: HouseNumber
  /** Sign that falls on this house for this Lagna. */
  signRashi: Rashi
  lordId: ClassicalGrahaId
  /** House where the lord sits, null when the lord is not in the chart data. */
  lordPlacedHouse: HouseNumber | null
  lordPlacedRashi: Rashi | null
  occupants: OverlayOccupant[]
}

export const HOUSE_NUMBERS: HouseNumber[] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]

export function signOfHouse(ascRashi: number, house: number): Rashi {
  return ((((ascRashi - 1 + house - 1) % 12) + 1) as Rashi)
}

export function lordOfSign(rashi: number): ClassicalGrahaId {
  const row = RASHI_LORDS.find((r) => r.number === rashi)
  if (!row) throw new Error(`No lord for rashi ${rashi}`)
  return row.lord
}

export function buildLagnaChartOverlay(ascRashi: Rashi, grahas: GrahaData[]): HouseOverlay[] {
  return HOUSE_NUMBERS.map((house) => {
    const signRashi = signOfHouse(ascRashi, house)
    const lordId = lordOfSign(signRashi)
    const lord = grahas.find((g) => g.id === lordId)
    const occupants: OverlayOccupant[] = grahas
      .filter((g) => isClassicalGraha(g.id) && wholeSignHouseFromLagna(ascRashi, g.rashi) === house)
      .map((g) => ({
        id: g.id,
        rashi: g.rashi,
        degree: g.degree,
        dignity: g.dignity,
        isRetro: g.isRetro,
        isCombust: g.isCombust,
      }))
    return {
      house,
      signRashi,
      lordId,
      lordPlacedHouse: lord ? wholeSignHouseFromLagna(ascRashi, lord.rashi) : null,
      lordPlacedRashi: lord ? lord.rashi : null,
      occupants,
    }
  })
}

/** Houses a planet rules for a given Lagna (e.g. Saturn for Capricorn Lagna: [1, 2]). */
export function housesRuledBy(ascRashi: Rashi, planetId: string): HouseNumber[] {
  return HOUSE_NUMBERS.filter((h) => lordOfSign(signOfHouse(ascRashi, h)) === planetId)
}
