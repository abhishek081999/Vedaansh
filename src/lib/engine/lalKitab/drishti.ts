// ─────────────────────────────────────────────────────────────
//  src/lib/engine/lalKitab/drishti.ts
//  Lal Kitab aspects. Unlike Parashari drishti they run one way
//  only, from the lower house to the higher one, and the strength
//  depends on the pair of houses, not on the planet.
//    full (100%):    1→7, 4→10
//    half (50%):     3→9, 3→11, 5→9
//    quarter (25%):  2→6, 6→12, 8→2
//  Takkar (collision): a planet strikes the 8th house from it.
//  Bunyad (foundation): the 9th house from a house is its base.
//  Source: 1952 edition. Gupt and achanak-chot pairs come later.
// ─────────────────────────────────────────────────────────────

import type { LkTeva } from './chart'
import { lkRelation } from './friendship'
import { LK_GRAHAS, lkHouseFrom, type LkAspectKind, type LkGraha, type LkHouse, type LkRelation } from './types'

export interface LkHouseAspectRule { from: LkHouse; to: LkHouse; kind: LkAspectKind }

export const LK_HOUSE_ASPECTS: readonly LkHouseAspectRule[] = [
  { from: 1, to: 7, kind: 'full' },
  { from: 4, to: 10, kind: 'full' },
  { from: 3, to: 9, kind: 'half' },
  { from: 3, to: 11, kind: 'half' },
  { from: 5, to: 9, kind: 'half' },
  { from: 2, to: 6, kind: 'quarter' },
  { from: 6, to: 12, kind: 'quarter' },
  { from: 8, to: 2, kind: 'quarter' },
]

export const LK_ASPECT_PERCENT: Record<LkAspectKind, number> = { full: 100, half: 50, quarter: 25 }

/** House a planet in `h` collides with (8th from it). */
export function lkTakkarHouse(h: LkHouse): LkHouse {
  return lkHouseFrom(h, 8)
}

/** Foundation (bunyad) house of `h` (9th from it). */
export function lkBunyadHouse(h: LkHouse): LkHouse {
  return lkHouseFrom(h, 9)
}

export interface LkPlanetAspect {
  from: LkGraha
  to: LkGraha
  fromHouse: LkHouse
  toHouse: LkHouse
  kind: LkAspectKind
  percent: number
  /** How the aspecting planet regards the one it looks at. */
  relation: LkRelation
}

export interface LkTakkar {
  from: LkGraha
  to: LkGraha
  fromHouse: LkHouse
  toHouse: LkHouse
  relation: LkRelation
}

/** Houses that `h` aspects, with kind. */
export function lkAspectsFromHouse(h: LkHouse): LkHouseAspectRule[] {
  return LK_HOUSE_ASPECTS.filter((a) => a.from === h)
}

export function lkPlanetAspects(teva: LkTeva): LkPlanetAspect[] {
  const out: LkPlanetAspect[] = []
  for (const from of LK_GRAHAS) {
    const fromHouse = teva.house[from]
    if (!fromHouse) continue
    for (const rule of lkAspectsFromHouse(fromHouse)) {
      for (const to of teva.occupants[rule.to]) {
        out.push({ from, to, fromHouse, toHouse: rule.to, kind: rule.kind, percent: LK_ASPECT_PERCENT[rule.kind], relation: lkRelation(from, to) })
      }
    }
  }
  return out
}

export function lkTakkars(teva: LkTeva): LkTakkar[] {
  const out: LkTakkar[] = []
  for (const from of LK_GRAHAS) {
    const fromHouse = teva.house[from]
    if (!fromHouse) continue
    const toHouse = lkTakkarHouse(fromHouse)
    for (const to of teva.occupants[toHouse]) {
      out.push({ from, to, fromHouse, toHouse, relation: lkRelation(from, to) })
    }
  }
  return out
}
