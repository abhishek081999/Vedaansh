// ─────────────────────────────────────────────────────────────
//  src/lib/engine/gocharRules.ts
//  Classical Parashari gochar (transit-from-Moon) tables:
//  favourable houses and Vedha (obstruction) pairs.
//  Source: BPHS Gochara-phala / Phaladeepika ch. 26 (standard tables).
//  Rahu/Ketu: no classical Vedha table — favourable 3, 6, 11 only
//  (conservative reading; some lineages add the 10th).
// ─────────────────────────────────────────────────────────────

import type { GrahaId, Rashi } from '@/types/astrology'

export type GocharPlanet = 'Su' | 'Mo' | 'Ma' | 'Me' | 'Ju' | 'Ve' | 'Sa' | 'Ra' | 'Ke'

/** Houses counted from the natal Moon where the transiting planet gives good results. */
export const GOCHAR_FAVOURABLE: Record<GocharPlanet, readonly number[]> = {
  Su: [3, 6, 10, 11],
  Mo: [1, 3, 6, 7, 10, 11],
  Ma: [3, 6, 11],
  Me: [2, 4, 6, 8, 10, 11],
  Ju: [2, 5, 7, 9, 11],
  Ve: [1, 2, 3, 4, 5, 8, 9, 11, 12],
  Sa: [3, 6, 11],
  Ra: [3, 6, 11],
  Ke: [3, 6, 11],
}

/**
 * Vedha: a favourable house is cancelled when another graha sits in the
 * paired house (both counted from the natal Moon).
 */
export const GOCHAR_VEDHA: Partial<Record<GocharPlanet, Readonly<Record<number, number>>>> = {
  Su: { 3: 9, 6: 12, 10: 4, 11: 5 },
  Mo: { 1: 5, 3: 9, 6: 12, 7: 2, 10: 4, 11: 8 },
  Ma: { 3: 12, 6: 9, 11: 5 },
  Me: { 2: 5, 4: 3, 6: 9, 8: 1, 10: 8, 11: 12 },
  Ju: { 2: 12, 5: 4, 7: 3, 9: 10, 11: 8 },
  Ve: { 1: 8, 2: 7, 3: 1, 4: 10, 5: 9, 8: 5, 9: 11, 11: 6, 12: 3 },
  Sa: { 3: 12, 6: 9, 11: 5 },
}

/** Classical exceptions: these pairs never obstruct each other. */
function isVedhaExempt(a: GocharPlanet, b: GocharPlanet): boolean {
  return (
    (a === 'Su' && b === 'Sa') || (a === 'Sa' && b === 'Su') ||
    (a === 'Mo' && b === 'Me') || (a === 'Me' && b === 'Mo')
  )
}

export type GocharStatus = 'favourable' | 'vedha' | 'unfavourable'

export interface GocharEval {
  planet: GocharPlanet
  /** House counted from the natal Moon (1–12). */
  houseFromMoon: number
  status: GocharStatus
  /** Planet causing the Vedha, when status is 'vedha'. */
  vedhaBy?: GocharPlanet
  /** House (from Moon) holding the obstructing planet. */
  vedhaHouse?: number
}

/** House of `rashi` counted from `from` (both 1–12), inclusive count. */
export function houseFrom(rashi: Rashi | number, from: Rashi | number): number {
  return ((rashi - from + 12) % 12) + 1
}

const CLASSICAL = new Set<string>(['Su', 'Mo', 'Ma', 'Me', 'Ju', 'Ve', 'Sa', 'Ra', 'Ke'])

export function isGocharPlanet(id: GrahaId | string): id is GocharPlanet {
  return CLASSICAL.has(id)
}

/**
 * Evaluate one planet's gochar from the natal Moon.
 * `housesFromMoon` maps every transiting graha to its house from the natal Moon.
 */
export function evaluateGochar(
  planet: GocharPlanet,
  housesFromMoon: Partial<Record<GocharPlanet, number>>,
): GocharEval | null {
  const house = housesFromMoon[planet]
  if (!house) return null

  if (!GOCHAR_FAVOURABLE[planet].includes(house)) {
    return { planet, houseFromMoon: house, status: 'unfavourable' }
  }

  const vedhaHouse = GOCHAR_VEDHA[planet]?.[house]
  if (vedhaHouse) {
    for (const [other, otherHouse] of Object.entries(housesFromMoon) as Array<[GocharPlanet, number]>) {
      if (other === planet || isVedhaExempt(planet, other)) continue
      if (otherHouse === vedhaHouse) {
        return { planet, houseFromMoon: house, status: 'vedha', vedhaBy: other, vedhaHouse }
      }
    }
  }
  return { planet, houseFromMoon: house, status: 'favourable' }
}
