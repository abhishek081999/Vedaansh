// ─────────────────────────────────────────────────────────────
//  src/lib/engine/nadi/dashamsha.ts
//  Dashamsha career: lagna and 10th, placement before aspect.
//  The period of those planets is a rise. The 8th is a break.
//  The 3rd, or Gemini, is the neighborhood. Sign exchange only.
// ─────────────────────────────────────────────────────────────

import type { Rashi } from '@/types/astrology'
import { GRAHA_NAMES } from '@/types/astrology'
import { getDignity } from '@/lib/engine/dignity'
import {
  RASHI_LORDS,
  wholeSignHouseFromLagna,
  type ClassicalGrahaId,
  type HouseNumber,
} from '@/lib/engine/houseInterpretations'
import { rashiForHouseFromLagna } from '@/lib/engine/rashiInterpretations'
import { nadiAspectsSign } from '@/lib/engine/nadi/snapshots'
import { houseCountedFrom } from '@/lib/engine/nadi/rotation'
import { nadiConjunct, type NadiYogaPlacement } from '@/lib/engine/nadi/yogas'

export const NADI_DASHAMSHA_NOTE =
  'Dashamsha career is read from the lagna and the 10th. Placement is read before an aspect. The lines are options read together. An exchange is read ahead of the other lines.'

export const NADI_NEIGHBORHOOD_NOTE =
  'The 3rd house, and Gemini, are read for the immediate neighborhood. A sign exchange is read ahead of an aspect.'

const ORDER: readonly ClassicalGrahaId[] = ['Su', 'Mo', 'Ma', 'Me', 'Ju', 'Ve', 'Sa', 'Ra', 'Ke']
const SEVEN: readonly ClassicalGrahaId[] = ['Su', 'Mo', 'Ma', 'Me', 'Ju', 'Ve', 'Sa']

const WORK: Record<ClassicalGrahaId, string> = {
  Su: 'Government work',
  Mo: 'Food, or work with the public',
  Ma: 'Uniformed work, engineering, technology, or medicine',
  Me: 'Business, management, astrology, accounts, or mathematics',
  Ju: 'Teaching, or spiritual work',
  Ve: 'Business, food, luxury, entertainment, or medicine. The practical form is food, clothing, entertainment, or beauty. The trained form is finance',
  Sa: 'Law, or service',
  Ra: 'Technology, or an unconventional field',
  Ke: 'Technology, or an unconventional field',
}

export function dashamshaCareerNotes(input: {
  dashamsha?: { ascRashi: Rashi; grahas: readonly NadiYogaPlacement[] }
  dashaLords?: readonly ClassicalGrahaId[]
}): string[] {
  const chart = input.dashamsha
  if (!chart) return []
  const { ascRashi: lagna, grahas } = chart
  const lines: string[] = []
  const exchanges = parivartana(lagna, grahas)

  for (const [house, group] of byHouse(lagna, grahas)) {
    if (group.length < 4) continue
    lines.push(`${joinNames(group.map((g) => GRAHA_NAMES[g.id]))} sit together in the ${ordinal(house)} of Dashamsha. That crowd is the first career hint.`)
  }

  for (const pair of exchanges) {
    let line = `An exchange of the ${ordinal(pair.a)} and the ${ordinal(pair.b)} is present in Dashamsha. It is read ahead of the lagna and the 10th.`
    if (pair.a === 5 && pair.b === 9) line += ' Teaching and education are read from that.'
    if (pair.a === 1 && pair.b === 11) line += ' Wealth, including from the father, is read from that.'
    lines.push(line)
  }

  const lagnaSign = lagna
  const tenthSign = rashiForHouseFromLagna(lagna, 10)
  for (const id of ORDER) {
    const planet = grahas.find((g) => g.id === id)
    if (!planet) continue
    const house = wholeSignHouseFromLagna(lagna, planet.rashi)
    const sits = house === 1 ? 'sits in the Dashamsha lagna' : house === 10 ? 'sits in the 10th of Dashamsha' : null
    const aspects = [
      planet.rashi !== lagnaSign && nadiAspectsSign(planet.rashi, id, lagnaSign) ? 'aspects the Dashamsha lagna' : null,
      planet.rashi !== tenthSign && nadiAspectsSign(planet.rashi, id, tenthSign) ? 'aspects the 10th of Dashamsha' : null,
    ].filter((part): part is string => part !== null)
    const parts = [sits, ...aspects].filter((part): part is string => part !== null)
    if (!parts.length) continue
    lines.push(`${GRAHA_NAMES[id]} ${joinParts(parts)}. ${WORK[id]} is one option.`)
  }

  const saturn = grahas.find((g) => g.id === 'Sa')
  if (saturn) {
    const signs = new Set([houseCountedFrom(saturn.rashi, 5), houseCountedFrom(saturn.rashi, 9)])
    const trine = ORDER.filter((id) => {
      if (id === 'Sa') return false
      const other = grahas.find((g) => g.id === id)
      return other != null && signs.has(other.rashi)
    })
    if (!(trine.length === 1 && trine[0] === 'Ma')) {
      for (const id of trine) {
        lines.push(`In the 5th or 9th from Saturn in Dashamsha: ${GRAHA_NAMES[id]}. ${WORK[id]} is one option.`)
      }
    }
  }

  for (const id of SEVEN) {
    const planet = grahas.find((g) => g.id === id)
    if (!planet || pole(planet) !== 'debilitated') continue
    const lord = signLord(planet.rashi)
    const host = grahas.find((g) => g.id === lord)
    if (!host || pole(host) !== 'exalted') continue
    if (host.rashi === planet.rashi || !nadiAspectsSign(host.rashi, lord, planet.rashi)) continue
    lines.push(`${GRAHA_NAMES[id]} is debilitated in Dashamsha, and ${GRAHA_NAMES[lord]} is exalted and aspects it. The debilitation is read as cancelled for the career.`)
  }

  if (nadiConjunct(grahas, ['Su', 'Me'])) {
    lines.push('Sun and Mercury together in Dashamsha. Business with a government link is one option.')
  }
  const marsRahu = nadiConjunct(grahas, ['Ma', 'Ra'])
  if (marsRahu && wholeSignHouseFromLagna(lagna, marsRahu[0]!.rashi) === 7) {
    lines.push('Mars and Rahu in the 7th of Dashamsha. Medicine is one option.')
  }
  if (nadiConjunct(grahas, ['Ma', 'Ke'])) {
    lines.push('Mars and Ketu together in Dashamsha. Surgery is one option.')
  }

  const lords = input.dashaLords ?? []
  const lagnaLord = signLord(lagna)
  const tenthLord = signLord(tenthSign)
  const eighthLord = signLord(rashiForHouseFromLagna(lagna, 8))
  const periods: { lord: ClassicalGrahaId; which: string }[] = []
  if (lords[0] && lords[1] && lords[0] === lords[1]) {
    periods.push({ lord: lords[0], which: 'mahadasha and antardasha' })
  } else {
    if (lords[0]) periods.push({ lord: lords[0], which: 'mahadasha' })
    if (lords[1]) periods.push({ lord: lords[1], which: 'antardasha' })
  }
  for (const period of periods) {
    const lord = period.lord
    const house = grahas.find((g) => g.id === lord)
    const occupied = house ? wholeSignHouseFromLagna(lagna, house.rashi) : null
    const rise: string[] = []
    const fall: string[] = []
    if (lord === lagnaLord) rise.push('rules the Dashamsha lagna')
    if (lord === tenthLord) rise.push('rules the 10th')
    if (occupied === 1) rise.push('sits in the lagna')
    if (occupied === 10) rise.push('sits in the 10th')
    if (lord === eighthLord) fall.push('rules the 8th')
    if (occupied === 8) fall.push('sits in the 8th')
    const name = GRAHA_NAMES[lord]
    const verb = period.which.includes(' and ') ? 'are' : 'is'
    if (rise.length) {
      lines.push(`The ${period.which} of ${name} ${verb} running. ${name} ${joinParts(rise)}, so a rise in the career is checked.`)
    }
    if (fall.length) {
      lines.push(`The ${period.which} of ${name} ${verb} running. ${name} ${joinParts(fall)}, so a loss of work, a transfer, or a break is checked.`)
    }
  }

  if (exchanges.some((pair) => signLord(rashiForHouseFromLagna(lagna, pair.a)) === 'Mo' || signLord(rashiForHouseFromLagna(lagna, pair.b)) === 'Mo')) {
    lines.push('The Moon is in an exchange in Dashamsha. Cash and comfort are read from that.')
  }

  return lines
}

export function neighborhoodNotes(input: {
  ascRashi: Rashi
  grahas: readonly NadiYogaPlacement[]
  parivartana?: readonly { a: HouseNumber; b: HouseNumber }[]
}): string[] {
  const lines: string[] = []
  const third = rashiForHouseFromLagna(input.ascRashi, 3)
  if (input.parivartana?.some((pair) => pair.a === 3 || pair.b === 3)) {
    lines.push('An exchange takes in the 3rd. That is read ahead of an aspect for the neighborhood.')
  }

  const placed = (id: ClassicalGrahaId) => {
    const planet = input.grahas.find((g) => g.id === id)
    if (!planet) return null
    const house = wholeSignHouseFromLagna(input.ascRashi, planet.rashi)
    if (house === 3) return 'the 3rd'
    if (planet.rashi === 3) return 'Gemini'
    return null
  }

  const saturn = placed('Sa')
  if (saturn) lines.push(`Saturn in ${saturn}. Iron work nearby is checked.`)
  const jupiter = placed('Ju')
  const venus = placed('Ve')
  if (jupiter && venus && jupiter === venus) {
    lines.push(`Jupiter and Venus in ${jupiter}. A temple nearby is checked.`)
  }
  const rahu = placed('Ra')
  if (rahu) lines.push(`Rahu in ${rahu}. Wireless signal nearby is checked.`)

  const aspect = (id: ClassicalGrahaId) => {
    const planet = input.grahas.find((g) => g.id === id)
    return planet != null && planet.rashi !== third && nadiAspectsSign(planet.rashi, id, third)
  }
  if (!saturn && aspect('Sa')) lines.push('Saturn aspects the 3rd. Iron work nearby is checked. An aspect is the weaker form.')
  if (!(jupiter && venus) && aspect('Ju') && aspect('Ve')) {
    lines.push('Jupiter and Venus aspect the 3rd. A temple nearby is checked. An aspect is the weaker form.')
  }
  if (!rahu && aspect('Ra')) lines.push('Rahu aspects the 3rd. Wireless signal nearby is checked. An aspect is the weaker form.')
  return lines
}

function parivartana(asc: Rashi, grahas: readonly NadiYogaPlacement[]): { a: HouseNumber; b: HouseNumber }[] {
  const lordHouse = (house: HouseNumber): HouseNumber | null => {
    const lord = signLord(rashiForHouseFromLagna(asc, house))
    const placed = grahas.find((g) => g.id === lord)
    return placed ? wholeSignHouseFromLagna(asc, placed.rashi) : null
  }
  const pairs: { a: HouseNumber; b: HouseNumber }[] = []
  for (let house = 1; house <= 12; house++) {
    const other = lordHouse(house as HouseNumber)
    if (other == null || other === house || house > other) continue
    if (lordHouse(other) === house) pairs.push({ a: house as HouseNumber, b: other })
  }
  return pairs
}

function byHouse(asc: Rashi, grahas: readonly NadiYogaPlacement[]): Map<HouseNumber, NadiYogaPlacement[]> {
  const map = new Map<HouseNumber, NadiYogaPlacement[]>()
  for (const id of ORDER) {
    const planet = grahas.find((g) => g.id === id)
    if (!planet) continue
    const house = wholeSignHouseFromLagna(asc, planet.rashi)
    const list = map.get(house) ?? []
    list.push(planet)
    map.set(house, list)
  }
  return map
}

function pole(planet: NadiYogaPlacement): 'exalted' | 'debilitated' | null {
  if (planet.dignity === 'exalted' || planet.dignity === 'debilitated') return planet.dignity
  const dignity = getDignity(planet.id, planet.rashi, planet.degree ?? 15)
  return dignity === 'exalted' || dignity === 'debilitated' ? dignity : null
}

function signLord(sign: Rashi): ClassicalGrahaId {
  return RASHI_LORDS.find((row) => row.number === sign)?.lord ?? 'Su'
}

function joinNames(names: string[]): string {
  if (names.length <= 1) return names[0] ?? ''
  if (names.length === 2) return `${names[0]} and ${names[1]}`
  return `${names.slice(0, -1).join(', ')}, and ${names[names.length - 1]}`
}

function joinParts(parts: string[]): string {
  if (parts.length <= 1) return parts[0] ?? ''
  if (parts.length === 2) return `${parts[0]} and ${parts[1]}`
  return `${parts.slice(0, -1).join(', ')}, and ${parts[parts.length - 1]}`
}

function ordinal(n: number): string {
  const teen = n % 100
  if (teen >= 11 && teen <= 13) return `${n}th`
  const last = n % 10
  if (last === 1) return `${n}st`
  if (last === 2) return `${n}nd`
  if (last === 3) return `${n}rd`
  return `${n}th`
}
