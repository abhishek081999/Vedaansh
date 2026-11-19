// ─────────────────────────────────────────────────────────────
//  src/lib/engine/lalKitab/phal.ts
//  Planet-in-house readings and life-area predictions.
//
//  Which side of a reading applies follows the Lal Kitab idea that a
//  planet gives its own good when it is safe and its hard side when an
//  enemy harms it:
//    dharmi                         → good (it does no harm)
//    debilitated, nothing to lift it → hard
//    harmed but also strong          → mixed
//    harmed (enemy beside, aspect or takkar) → hard
//    otherwise                       → good
//  Strong = exalted, in its permanent house, or dharmi.
//  A sleeping planet keeps its side but gives it only once woken.
// ─────────────────────────────────────────────────────────────

import type { EngineLang } from '@/lib/engine/lang'
import { LK_PHAL_HI } from '@/lib/engine/locale/lalKitabPhal.hi'
import { LK_MATURITY_AGE } from './age'
import { LK_PHAL } from './catalogue/phal'
import type { LkFacts } from './facts'
import { lkRelation } from './friendship'
import { LK_NEECH, LK_PAKKA_GHAR, LK_UCHCHA } from './pakkaGhar'
import { LK_GRAHAS, type LkGraha, type LkHouse } from './types'

export type LkPhalSide = 'good' | 'hard' | 'mixed'

/** Why a side was chosen. Codes only; the UI words them. */
export type LkPhalReason = 'dharmi' | 'uchcha' | 'pakka' | 'neech' | 'enemyWith' | 'enemyAspect' | 'enemyTakkar' | 'safe'

export interface LkPhalReading {
  planet: LkGraha
  house: LkHouse
  side: LkPhalSide
  reasons: LkPhalReason[]
  asleep: boolean
  maturityAge: number
  good: string
  hard: string
}

export function lkPhalSide(planet: LkGraha, f: LkFacts): { side: LkPhalSide; reasons: LkPhalReason[] } {
  const h = f.teva.house[planet]
  const reasons: LkPhalReason[] = []
  const dharmi = f.states.dharmi.includes(planet)
  const uchcha = LK_UCHCHA[planet].includes(h)
  const pakka = LK_PAKKA_GHAR[planet].includes(h)
  const neech = LK_NEECH[planet].includes(h)
  const enemyWith = f.teva.occupants[h].some((o) => o !== planet && lkRelation(planet, o) === 'enemy')
  const enemyAspect = f.aspects.some((a) => a.to === planet && a.relation === 'enemy')
  const enemyTakkar = f.takkars.some((t) => t.to === planet && t.relation === 'enemy')
  if (dharmi) reasons.push('dharmi')
  if (uchcha) reasons.push('uchcha')
  if (pakka) reasons.push('pakka')
  if (neech) reasons.push('neech')
  if (enemyWith) reasons.push('enemyWith')
  if (enemyAspect) reasons.push('enemyAspect')
  if (enemyTakkar) reasons.push('enemyTakkar')
  const strong = dharmi || uchcha || pakka
  const harmed = enemyWith || enemyAspect || enemyTakkar
  if (dharmi) return { side: 'good', reasons }
  if (neech && !strong) return { side: 'hard', reasons }
  if (harmed && strong) return { side: 'mixed', reasons }
  if (harmed) return { side: 'hard', reasons }
  if (reasons.length === 0) reasons.push('safe')
  return { side: 'good', reasons }
}

export function lkPhalText(planet: LkGraha, house: LkHouse, lang: EngineLang = 'en'): { good: string; hard: string } {
  const [good, hard] = (lang === 'hi' ? LK_PHAL_HI : LK_PHAL)[planet][house - 1]
  return { good, hard }
}

export function lkPhalReadings(f: LkFacts, lang: EngineLang = 'en'): LkPhalReading[] {
  return LK_GRAHAS.filter((p) => f.teva.house[p]).map((planet) => {
    const house = f.teva.house[planet]
    return {
      planet,
      house,
      ...lkPhalSide(planet, f),
      asleep: f.states.sleepingPlanets.includes(planet),
      maturityAge: LK_MATURITY_AGE[planet],
      ...lkPhalText(planet, house, lang),
    }
  })
}

// ── Life areas ────────────────────────────────────────────────

export type LkLifeArea =
  | 'wealth' | 'career' | 'marriage' | 'children' | 'health' | 'property' | 'education'
  | 'travel' | 'siblings' | 'parents' | 'enemies' | 'longevity' | 'spiritual'

/** Houses and karaka planets that speak for each area. */
export const LK_LIFE_AREAS: Record<LkLifeArea, { houses: readonly LkHouse[]; karakas: readonly LkGraha[] }> = {
  wealth: { houses: [2, 11], karakas: ['Ju', 'Mo'] },
  career: { houses: [10], karakas: ['Su', 'Sa'] },
  marriage: { houses: [7], karakas: ['Ve'] },
  children: { houses: [5], karakas: ['Ju', 'Ke'] },
  health: { houses: [1, 6], karakas: ['Su', 'Ma'] },
  property: { houses: [4], karakas: ['Mo', 'Sa'] },
  education: { houses: [5, 9], karakas: ['Me', 'Ju'] },
  travel: { houses: [3, 12], karakas: ['Ra', 'Ke'] },
  siblings: { houses: [3], karakas: ['Ma'] },
  parents: { houses: [4, 9], karakas: ['Su', 'Mo'] },
  enemies: { houses: [6], karakas: ['Ma'] },
  longevity: { houses: [8], karakas: ['Sa'] },
  spiritual: { houses: [9, 12], karakas: ['Ju', 'Ke'] },
}

export const LK_LIFE_AREA_ORDER = Object.keys(LK_LIFE_AREAS) as LkLifeArea[]

export type LkAreaTone = 'strong' | 'mixed' | 'weak'

export interface LkAreaReading {
  area: LkLifeArea
  tone: LkAreaTone
  score: number
  /** Planets that speak for the area, with how they speak. */
  voices: { planet: LkGraha; role: 'inHouse' | 'karaka'; side: LkPhalSide; text: string }[]
}

const SIDE_SCORE: Record<LkPhalSide, number> = { good: 1, mixed: 0, hard: -1 }

export function lkAreaReadings(readings: readonly LkPhalReading[]): LkAreaReading[] {
  const byPlanet = new Map(readings.map((r) => [r.planet, r]))
  return LK_LIFE_AREA_ORDER.map((area) => {
    const def = LK_LIFE_AREAS[area]
    const voices: LkAreaReading['voices'] = []
    for (const r of readings) {
      if (def.houses.includes(r.house)) voices.push({ planet: r.planet, role: 'inHouse', side: r.side, text: r.side === 'hard' ? r.hard : r.good })
    }
    for (const k of def.karakas) {
      const r = byPlanet.get(k)
      if (r && !voices.some((v) => v.planet === k)) voices.push({ planet: k, role: 'karaka', side: r.side, text: r.side === 'hard' ? r.hard : r.good })
    }
    const score = voices.reduce((s, v) => s + SIDE_SCORE[v.side], 0)
    const tone: LkAreaTone = score > 0 ? 'strong' : score < 0 ? 'weak' : 'mixed'
    return { area, tone, score, voices }
  })
}
