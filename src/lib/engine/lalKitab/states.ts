// ─────────────────────────────────────────────────────────────
//  src/lib/engine/lalKitab/states.ts
//  Decoded Lal Kitab states, computed from the Teva and its aspects.
//
//  Soya ghar (sleeping house): an empty house that no planet aspects.
//  Soya grah (sleeping planet): its house aspects other houses, but
//    every house it aspects is empty, so it has no one to act on.
//    Planets in houses with no forward aspect are not counted asleep.
//  Jagane wala grah: the planet that wakes a sleeping house.
//  Kayam grah: no enemy sits with it, aspects it or strikes it.
//  Dharmi grah: Rahu in 4, Ketu in 11, Saturn in 11, and any planet
//    sitting with Jupiter and Saturn together.
//  Chart types: andhi (blind), ratandh (night-blind), nabalig (minor),
//    dharmi teva.
//
//  Source: 1952 edition for the definitions. The waking-planet table,
//  the andhi / ratandh conditions and the kismat method follow common
//  commentary and are tagged so in LK_STATE_EDITION.
// ─────────────────────────────────────────────────────────────

import type { LkTeva } from './chart'
import { lkAspectsFromHouse, LK_HOUSE_ASPECTS, type LkPlanetAspect, type LkTakkar } from './drishti'
import { lkMutualClash, lkRelation } from './friendship'
import { LK_PAKKA_GHAR, LK_UCHCHA } from './pakkaGhar'
import { LK_GRAHAS, LK_HOUSES, type LkEdition, type LkGraha, type LkHouse } from './types'

export type LkChartType = 'andhi' | 'ratandh' | 'nabalig' | 'dharmi'

/** The planet that wakes each house when it is asleep. */
export const LK_HOUSE_WAKER: Record<LkHouse, LkGraha> = {
  1: 'Ma', 2: 'Mo', 3: 'Me', 4: 'Mo', 5: 'Su', 6: 'Ra',
  7: 'Ve', 8: 'Mo', 9: 'Ju', 10: 'Sa', 11: 'Ju', 12: 'Ra',
}

export const LK_STATE_EDITION: Record<'sleeping' | 'waker' | 'kayam' | 'dharmi' | 'andhi' | 'ratandh' | 'nabalig' | 'kismat', LkEdition> = {
  sleeping: '1952', waker: 'commentary', kayam: '1952', dharmi: '1952',
  andhi: 'commentary', ratandh: 'commentary', nabalig: '1952', kismat: 'commentary',
}

export type LkKismatMethod = 'uchcha' | 'pakka' | 'fortuneHouse'

export interface LkStates {
  sleepingHouses: { house: LkHouse; waker: LkGraha }[]
  sleepingPlanets: LkGraha[]
  kayam: LkGraha[]
  dharmi: LkGraha[]
  chartTypes: LkChartType[]
  /** Likely planet of destiny, with the method used to pick it. */
  kismat?: { planet: LkGraha; method: LkKismatMethod }
}

/** Houses that some planet aspects. */
function aspectedHouses(teva: LkTeva): Set<LkHouse> {
  const out = new Set<LkHouse>()
  for (const a of LK_HOUSE_ASPECTS) if (teva.occupants[a.from].length > 0) out.add(a.to)
  return out
}

export function lkStates(teva: LkTeva, aspects: LkPlanetAspect[], takkars: LkTakkar[]): LkStates {
  const { occupants, house } = teva
  const looked = aspectedHouses(teva)
  const sleepingHouses = LK_HOUSES
    .filter((h) => occupants[h].length === 0 && !looked.has(h))
    .map((h) => ({ house: h, waker: LK_HOUSE_WAKER[h] }))

  const placed = LK_GRAHAS.filter((p) => house[p])

  const sleepingPlanets = placed.filter((p) => {
    const targets = lkAspectsFromHouse(house[p])
    return targets.length > 0 && targets.every((a) => occupants[a.to].length === 0)
  })

  const kayam = placed.filter((p) => {
    const mates = occupants[house[p]].filter((o) => o !== p)
    if (mates.some((o) => lkRelation(p, o) === 'enemy')) return false
    if (aspects.some((a) => a.to === p && a.relation === 'enemy')) return false
    if (takkars.some((t) => t.to === p && t.relation === 'enemy')) return false
    return true
  })

  const juSaTogether = !!house.Ju && house.Ju === house.Sa
  const dharmi = placed.filter((p) =>
    (p === 'Ra' && house.Ra === 4)
    || (p === 'Ke' && house.Ke === 11)
    || (p === 'Sa' && house.Sa === 11)
    || (juSaTogether && house[p] === house.Ju))

  const chartTypes: LkChartType[] = []
  const tenth = occupants[10]
  if (tenth.some((a, i) => tenth.slice(i + 1).some((b) => lkMutualClash(a, b)))) chartTypes.push('andhi')
  if (house.Su === 4 && house.Sa === 7) chartTypes.push('ratandh')
  if ([1, 4, 7, 10].every((h) => occupants[h as LkHouse].length === 0)) chartTypes.push('nabalig')
  if (juSaTogether) chartTypes.push('dharmi')

  const kismat = pickKismat(teva, placed)

  return { sleepingHouses, sleepingPlanets, kayam, dharmi, chartTypes, kismat }
}

/**
 * Commentary method for the planet of destiny: an exalted planet first,
 * then a planet in its permanent house, then the first planet in the
 * houses of fortune (9, 10, 11). Planet order breaks ties.
 */
function pickKismat(teva: LkTeva, placed: LkGraha[]): LkStates['kismat'] {
  const uchcha = placed.find((p) => LK_UCHCHA[p].includes(teva.house[p]))
  if (uchcha) return { planet: uchcha, method: 'uchcha' }
  const pakka = placed.find((p) => LK_PAKKA_GHAR[p].includes(teva.house[p]))
  if (pakka) return { planet: pakka, method: 'pakka' }
  for (const h of [9, 10, 11] as const) {
    const p = teva.occupants[h][0]
    if (p) return { planet: p, method: 'fortuneHouse' }
  }
  return undefined
}
