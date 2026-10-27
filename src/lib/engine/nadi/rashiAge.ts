// ─────────────────────────────────────────────────────────────
//  src/lib/engine/nadi/rashiAge.ts
//  Sign pairs open at fixed ages. A planet in the sign is read.
//  An empty sign is read from the house it falls in.
//  The year-count is a separate reading.
// ─────────────────────────────────────────────────────────────

import type { Rashi } from '@/types/astrology'
import { GRAHA_NAMES, RASHI_NAMES } from '@/types/astrology'
import { getDignity } from '@/lib/engine/dignity'
import {
  RASHI_LORDS,
  wholeSignHouseFromLagna,
  type ClassicalGrahaId,
  type HouseNumber,
} from '@/lib/engine/houseInterpretations'
import { bcpHouse } from '@/lib/engine/nadi/bcp'
import { NADI_GRAHAS } from '@/lib/engine/nadi/grahas'
import { NADI_HOUSES } from '@/lib/engine/nadi/houses'
import type { NadiYogaPlacement } from '@/lib/engine/nadi/yogas'

export const NADI_RASHI_AGE_NOTE =
  'Each pair of signs opens in its year: 20, 24, 28, 32, 36, and 40. A planet in the sign is read. An empty sign is read from the house it falls in. The year-count is a separate reading. When the same year is open on both, it is read more strongly.'

const PAIRS: readonly { age: number; signs: readonly [Rashi, Rashi] }[] = [
  { age: 20, signs: [1, 12] },
  { age: 24, signs: [2, 11] },
  { age: 28, signs: [3, 10] },
  { age: 32, signs: [4, 9] },
  { age: 36, signs: [5, 8] },
  { age: 40, signs: [6, 7] },
]

const ORDER: readonly ClassicalGrahaId[] = ['Su', 'Mo', 'Ma', 'Me', 'Ju', 'Ve', 'Sa', 'Ra', 'Ke']

export function rashiAgeNotes(input: {
  ascRashi: Rashi
  grahas: readonly NadiYogaPlacement[]
  runningYear?: number
}): string[] {
  return PAIRS.map((pair) => {
    const houses = pair.signs.map((sign) => wholeSignHouseFromLagna(input.ascRashi, sign))
    let line = `In the ${ordinal(pair.age)} year, ${RASHI_NAMES[pair.signs[0]]} and ${RASHI_NAMES[pair.signs[1]]} are active. ${pair.signs.map((sign) => signClause(input, sign)).join(' ')}`
    if (input.runningYear === pair.age) line += ' That year is the one now running.'
    const sameHouse = houses.includes(bcpHouse(pair.age))
    const marsYear = pair.age === 32 && input.grahas.some((g) => g.id === 'Ma')
    if (sameHouse && marsYear) {
      line += ' The year-count house is the same one, and Mars\'s year is also open, so this year is read more strongly.'
    } else if (sameHouse) {
      line += ' The year-count house is the same one, so this year is read more strongly.'
    } else if (marsYear) {
      line += ' Mars\'s year is also open, so the two readings are taken together.'
    }
    return line
  })
}

function signClause(input: { ascRashi: Rashi; grahas: readonly NadiYogaPlacement[] }, sign: Rashi): string {
  const house = wholeSignHouseFromLagna(input.ascRashi, sign)
  const there = ORDER.filter((id) => input.grahas.some((g) => g.id === id && g.rashi === sign))
  const bits: string[] = []
  if (there.length === 0) {
    const themes = houseThemes(house)
    bits.push(`${RASHI_NAMES[sign]} falls in the ${ordinal(house)}. No planet sits there, so the ${ordinal(house)} is read for ${themes}.`)
  } else {
    const named = there.filter((id) => id !== 'Ra' && id !== 'Ke').slice(0, 2)
    const shown = (named.length > 0 ? named : there.slice(0, 2)).map((id) => GRAHA_NAMES[id]).join(' and ')
    const theme = named.map((id) => NADI_GRAHAS[id].significances[0].toLowerCase()).join(' and ')
    bits.push(`${RASHI_NAMES[sign]} falls in the ${ordinal(house)}, with ${shown}${theme ? `, read for ${theme}` : ''}.`)
  }
  if (there.includes('Ra') || there.includes('Ke')) {
    const moonNode = there.includes('Mo') && (there.includes('Ra') || there.includes('Ke'))
    bits.push(moonNode
      ? 'An unexpected event is checked, and it is read more strongly.'
      : 'An unexpected event is checked.')
  }
  if (exchanged(sign, input.grahas)) bits.push('An exchange includes this sign.')
  const lord = RASHI_LORDS.find((row) => row.number === sign)?.lord
  const lordPlanet = lord ? input.grahas.find((g) => g.id === lord) : undefined
  if (lordPlanet) {
    const dignity = lordPlanet.dignity ?? getDignity(lordPlanet.id, lordPlanet.rashi, lordPlanet.degree ?? 15)
    if (dignity === 'exalted') bits.push('The lord is exalted.')
    if (dignity === 'debilitated') bits.push('The lord is debilitated, so a struggle is checked.')
    const lordHouse = wholeSignHouseFromLagna(input.ascRashi, lordPlanet.rashi)
    if (lordHouse === 5) bits.push('The lord sits in the 5th. A rise in rank is checked.')
    if (lordHouse === 12) bits.push('The lord sits in the 12th. A move away from home is checked.')
  }
  if (house === 2 || house === 11) bits.push('A gain or a large expense is checked.')
  else if ((house === 9 || house === 10) && there.length > 0 && wholeSignHouseFromLagna(input.ascRashi, lordPlanet?.rashi ?? sign) !== 5) {
    bits.push('A rise in work is checked.')
  }
  return bits.join(' ')
}

function houseThemes(house: HouseNumber): string {
  const safe = NADI_HOUSES[house].significances.filter((line) => !/death|die|passed/i.test(line))
  const source = safe.length > 0 ? safe : NADI_HOUSES[house].significances
  return source.slice(0, 2).join(' and ').toLowerCase()
}

function exchanged(sign: Rashi, grahas: readonly NadiYogaPlacement[]): boolean {
  const lord = RASHI_LORDS.find((row) => row.number === sign)?.lord
  const placed = lord ? grahas.find((g) => g.id === lord) : undefined
  if (!placed || placed.rashi === sign) return false
  const otherLord = RASHI_LORDS.find((row) => row.number === placed.rashi)?.lord
  const other = otherLord ? grahas.find((g) => g.id === otherLord) : undefined
  return other?.rashi === sign
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
