// ─────────────────────────────────────────────────────────────
//  src/lib/engine/nadi/transits.ts
//  Slow-planet transits in Nadi: Saturn, Rahu, and Ketu,
//  read by the natal planet they pass. Jupiter is listed
//  beside them. The house of the transit is not the reading.
// ─────────────────────────────────────────────────────────────

import { GRAHA_NAMES, RASHI_NAMES, type Rashi } from '@/types/astrology'
import { getDignity } from '@/lib/engine/dignity'
import {
  RASHI_LORDS,
  wholeSignHouseFromLagna,
  type ClassicalGrahaId,
  type HouseNumber,
} from '@/lib/engine/houseInterpretations'
import { rashiForHouseFromLagna } from '@/lib/engine/rashiInterpretations'
import { nadiConjunct, type NadiYogaPlacement } from '@/lib/engine/nadi/yogas'

export const NADI_SLOW_TRANSIT_NOTE =
  'Nadi timing uses Jupiter, Saturn, Rahu, and Ketu, by the planet they pass. Saturn’s sign is the window and the natal degree is the peak. A planet within two or three degrees of a sign edge can still show in the neighbouring sign. The hard phase for the mother is Saturn on the natal Moon. The years on either side are not read the same way. Jupiter or Saturn on Rahu or Ketu, and Rahu on Saturn, are poor times to begin a venture.'

export const NADI_SATURN_TRANSIT = [
  { planet: 'Venus', result: 'The most useful Saturn transit. Wealth, a marriage or a relationship, and growth in vehicles, land, or a house. The size of the gain is not read.' },
  { planet: 'Rahu', result: 'A hard period. A death in the family, a serious illness, a fall in work, or a change of residence is checked.' },
  { planet: 'Mars', result: 'Disputes, surgery, an accident, a fracture, or a court case are checked. Building, land, and property are the useful form.' },
  { planet: 'Ketu', result: 'A change of work is read as likely. A supportive running period can make it a step up rather than a loss. Expenditure is also checked.' },
  { planet: 'Sun', result: 'A rise in work. Conflict, separation, or illness is checked for the father or grandfather. Government, a court matter, tax, or a visa is also checked.' },
  { planet: 'Jupiter', result: 'Professional growth and a promotion, the same family as Jupiter over Saturn.' },
  { planet: 'Moon', result: 'Illness is checked for the mother or a motherly figure. Separation from the family, or a change of place, can go with it.' },
  { planet: 'Mercury', result: 'A favorable period, including a start in one’s own work.' },
] as const

export const NADI_NODE_TRANSIT = [
  { planet: 'Rahu over Saturn', result: 'A financial loss, a change of residence, illness, or a death in the immediate family is checked.' },
  { planet: 'Ketu over Saturn', result: 'A change of work, or the loss of it.' },
  { planet: 'Rahu over Venus', result: 'Wealth, luxury, relationships, and a vehicle or gadgets.' },
  { planet: 'Venus over Saturn', result: 'For about a month each year, wealth is read for a person in business. A fixed salary does not show this.' },
  { planet: 'Mars over Rahu', result: 'A sudden disturbance is checked: a dispute, a change of place, or a fire risk. The peak is Mars on the natal degree of Rahu.' },
] as const

const SATURN_OVER: Partial<Record<ClassicalGrahaId, string>> = {
  Ve: 'wealth, a marriage or a relationship, and property',
  Ra: 'a hard period for the family, work, or a move',
  Ma: 'disputes, surgery, an accident, or property',
  Ke: 'a change of work',
  Su: 'a rise in work, and strain on the father or grandfather',
  Ju: 'professional growth',
  Mo: 'the mother’s health, or a motherly figure, and a change of place',
  Me: 'a favorable period, including one’s own work',
}

/** Planets that share a sign are read together when Saturn reaches that sign. */
export function saturnTransitGroups(grahas: readonly { id: ClassicalGrahaId; rashi: Rashi }[]): string[] {
  const bySign = new Map<Rashi, ClassicalGrahaId[]>()
  for (const g of grahas) {
    const list = bySign.get(g.rashi) ?? []
    list.push(g.id)
    bySign.set(g.rashi, list)
  }
  const lines: string[] = []
  for (const [sign, ids] of bySign) {
    const woken = ids.filter((id) => SATURN_OVER[id])
    if (ids.length < 2 || woken.length === 0) continue
    const names = joinNames(ids.map((id) => GRAHA_NAMES[id]))
    const results = woken.map((id) => SATURN_OVER[id]).join('; ')
    let line = `${names} share ${RASHI_NAMES[sign]}. Saturn over that sign is read as ${results}.`
    if (woken.includes('Mo')) line += ' That is the time Saturn is on the Moon.'
    lines.push(line)
  }
  return lines
}

function joinNames(names: string[]): string {
  if (names.length <= 1) return names[0] ?? ''
  if (names.length === 2) return `${names[0]} and ${names[1]}`
  return `${names.slice(0, -1).join(', ')}, and ${names[names.length - 1]}`
}

export interface SlowTransitInput {
  ascRashi: Rashi
  grahas: readonly NadiYogaPlacement[]
  arudhaLagna?: Rashi
  gender?: 'male' | 'female' | 'other'
}

export function slowTransitNotes(input: SlowTransitInput): string[] {
  const notes: string[] = []
  const lord = lordOf(input.ascRashi, 1)
  const lordPlanet = input.grahas.find((g) => g.id === lord)
  const lordHouse = lordPlanet ? wholeSignHouseFromLagna(input.ascRashi, lordPlanet.rashi) : null
  const lordExalted = lordPlanet ? isExalted(lordPlanet) : false
  if (lordExalted && lordHouse === 9) {
    notes.push('The lagna lord is exalted in the 9th. Wealth is read as present from birth, with little need to earn it.')
  }
  const exaltedCount = input.grahas.filter((g) => isExalted(g)).length
  if (lordExalted || exaltedCount >= 3) {
    notes.push('Exalted strength is read as comfort that can reduce the push to work.')
  }
  if (nadiConjunct(input.grahas, ['Ve', 'Me'])) {
    const trading = 'Venus with Mercury is read as stock trading.'
    notes.push(input.gender === 'male'
      ? `${trading} In this chart the wife is read as the higher earner.`
      : trading)
  }
  const mercury = input.grahas.find((g) => g.id === 'Me')
  const jupiter = input.grahas.find((g) => g.id === 'Ju')
  if (mercury?.rashi === 12 && (jupiter?.rashi === 3 || jupiter?.rashi === 6)) {
    notes.push('Mercury is debilitated and exchanges with Jupiter, so the debilitation is read as cancelled.')
  }
  if (jupiter && input.arudhaLagna != null && jupiter.rashi === input.arudhaLagna) {
    notes.push('Jupiter in the arudha lagna: a strong rise is read, with prosperity and protection. Misfortunes are read as reduced, and longevity is supported.')
  }
  return notes
}

function isExalted(g: NadiYogaPlacement): boolean {
  if (g.dignity === 'exalted') return true
  if (g.dignity && g.dignity !== 'exalted') return false
  return getDignity(g.id, g.rashi, g.degree ?? 15) === 'exalted'
}

function lordOf(asc: Rashi, house: HouseNumber): ClassicalGrahaId {
  const sign = rashiForHouseFromLagna(asc, house)
  return RASHI_LORDS.find((row) => row.number === sign)?.lord ?? 'Su'
}

export interface HardTransitInput {
  ascRashi: Rashi
  grahas: readonly { id: ClassicalGrahaId; rashi: Rashi; degree?: number }[]
  navamsha?: Partial<Record<ClassicalGrahaId, Rashi>>
  navamshaLagna?: Rashi
}

/** Signs to watch. Today’s Saturn and Rahu are not calculated. */
export function hardTransitNotes(input: HardTransitInput): string[] {
  const lines: string[] = []
  for (const id of ['Su', 'Mo'] as const) {
    const planet = input.grahas.find((g) => g.id === id)
    if (!planet) continue
    const who = id === 'Su' ? 'the father and grandfather, and for government or a court matter' : 'the mother or a motherly figure'
    const deg = planet.degree != null && Number.isFinite(planet.degree) ? Math.floor(planet.degree) : null
    const peak = deg == null ? '' : ` The peak is ${deg}°.`
    lines.push(`Saturn in ${RASHI_NAMES[planet.rashi]} is the window for ${who}.${peak}`)
  }
  if (input.navamshaLagna != null) {
    const sign = rashiForHouseFromLagna(input.navamshaLagna, 4)
    lines.push(`The 4th of Navamsha is ${RASHI_NAMES[sign]}. Rahu or Saturn in that sign is read as a death in the family or among close relations.`)
  }
  if (input.navamsha) {
    const eighth = lordOf(input.ascRashi, 8)
    const sign = input.navamsha[eighth]
    if (sign != null) {
      lines.push(`Saturn in ${RASHI_NAMES[sign]}, the Navamsha of the 8th lord ${GRAHA_NAMES[eighth]}, is read as a death in the family, a major mishap, or a hard year for the native.`)
    }
    const fifth = lordOf(input.ascRashi, 5)
    const birth = input.navamsha[fifth]
    if (birth != null) {
      const trines = [shiftSign(birth, 4), shiftSign(birth, 8)].map((sign) => RASHI_NAMES[sign])
      lines.push(`Jupiter in ${RASHI_NAMES[birth]}, ${trines[0]}, or ${trines[1]}, the Navamsha of the 5th lord, is read as a year of childbirth.`)
    }
  }
  for (const house of [1, 7] as const) {
    const malefic = input.grahas.some((g) => (
      wholeSignHouseFromLagna(input.ascRashi, g.rashi) === house
      && (g.id === 'Ma' || g.id === 'Sa' || g.id === 'Ra' || g.id === 'Ke')
    ))
    if (!malefic) continue
    lines.push(house === 1
      ? 'The lagna holds a malefic. Reputation and temper are checked.'
      : 'The 7th holds a malefic. Reputation through a partnership is checked.')
  }
  return lines
}

function shiftSign(sign: Rashi, by: number): Rashi {
  return ((((sign - 1 + by) % 12) + 12) % 12 + 1) as Rashi
}
