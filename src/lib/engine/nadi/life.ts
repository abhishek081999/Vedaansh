// ─────────────────────────────────────────────────────────────
//  src/lib/engine/nadi/life.ts
//  Study, the family counted from each relative, and settlement
//  away from the birthplace. Whole sign. Teaching associations.
// ─────────────────────────────────────────────────────────────

import { GRAHA_NAMES } from '@/types/astrology'
import type { Rashi } from '@/types/astrology'
import { getDignity } from '@/lib/engine/dignity'
import {
  RASHI_LORDS,
  wholeSignHouseFromLagna,
  type ClassicalGrahaId,
  type HouseNumber,
} from '@/lib/engine/houseInterpretations'
import { rashiForHouseFromLagna } from '@/lib/engine/rashiInterpretations'
import { educationNotes, houseCountedFrom } from '@/lib/engine/nadi/rotation'
import type { NadiYogaPlacement } from '@/lib/engine/nadi/yogas'

export const NADI_LIFE_NOTE =
  'Study is read from the 5th and from Jupiter. A relative’s marriage is the 7th from their house, and their study is the 5th. Settlement away from the birthplace needs the 3rd, the 9th, and the 12th linked.'

const STRONG = new Set(['exalted', 'own', 'moolatrikona'])
const PRESSURE = new Set<ClassicalGrahaId>(['Sa', 'Ra', 'Ke'])
const FAMILY: readonly { id: string; label: string; house: HouseNumber }[] = [
  { id: 'mother', label: 'Mother', house: 4 },
  { id: 'father', label: 'Father', house: 10 },
  { id: 'children', label: 'Children', house: 5 },
  { id: 'spouse', label: 'Spouse', house: 7 },
  { id: 'younger', label: 'Younger siblings', house: 3 },
  { id: 'elder', label: 'Elder siblings', house: 11 },
]

export interface NadiLifeReading {
  note: string
  education: string[]
  family: string[]
  settlement: string[]
}

export function readNadiLife(input: {
  ascRashi: Rashi
  grahas: readonly NadiYogaPlacement[]
}): NadiLifeReading {
  return {
    note: NADI_LIFE_NOTE,
    education: educationLines(input),
    family: familyLines(input),
    settlement: settlementLines(input),
  }
}

function educationLines(input: { ascRashi: Rashi; grahas: readonly NadiYogaPlacement[] }): string[] {
  const lord = lordOf(input.ascRashi, 5)
  const lordPlanet = input.grahas.find((g) => g.id === lord)
  const jupiter = input.grahas.find((g) => g.id === 'Ju')
  const inFifth = input.grahas.filter((g) => houseOf(input.ascRashi, g.rashi) === 5).map((g) => g.id)
  const pressure: string[] = []
  const support: string[] = []

  if (inFifth.includes('Ra')) pressure.push('Rahu sits in the 5th')
  if (inFifth.includes('Ke')) pressure.push('Ketu sits in the 5th')
  if (inFifth.includes('Sa') && !inFifth.includes('Ra') && !inFifth.includes('Ke')) pressure.push('Saturn sits in the 5th')
  const withLord = joinedWith(input, lord, ['Sa', 'Ra', 'Ke'])
  if (lordPlanet && withLord) pressure.push(`${withLord} sits with the 5th lord`)
  if (lordPlanet && dignityOf(lordPlanet) === 'debilitated') pressure.push('the 5th lord is debilitated')
  if (jupiter && dignityOf(jupiter) === 'debilitated') pressure.push('Jupiter is debilitated')
  const withJupiter = joinedWith(input, 'Ju', ['Sa', 'Ra', 'Ke'])
  if (jupiter && withJupiter) pressure.push(`${withJupiter} sits with Jupiter`)

  if (lordPlanet && STRONG.has(dignityOf(lordPlanet))) support.push(`the 5th lord, ${GRAHA_NAMES[lord]}, is ${dignityWord(dignityOf(lordPlanet))}`)
  if (jupiter && STRONG.has(dignityOf(jupiter))) support.push(`Jupiter is ${dignityWord(dignityOf(jupiter))}`)

  const lines: string[] = []
  if (support.length > 0 && pressure.length > 0) {
    lines.push(`${cap(join(support))}, and ${join(pressure)}. A degree can still be completed. The work may leave the subject of that degree.`)
  } else if (pressure.length > 0) {
    lines.push(`${cap(join(pressure))}. Study is the part under pressure, so the practical form of the career is the one to read.`)
  } else if (support.length > 0) {
    lines.push(`${cap(join(support))}. Study is supported, so the trained form of the career is the one to read.`)
  } else if (lordPlanet && houseOf(input.ascRashi, lordPlanet.rashi) !== 12) {
    const house = houseOf(input.ascRashi, lordPlanet.rashi)
    lines.push(`The 5th lord, ${GRAHA_NAMES[lord]}, sits in the ${ordinal(house)}. Children and study are read from that house.`)
  }

  if (lordPlanet && houseOf(input.ascRashi, lordPlanet.rashi) === 12) {
    lines.push('The 5th lord is in the 12th. Study abroad, a foreign partner, or children born abroad is the form checked.')
  }

  lines.push(...educationNotes(inFifth))
  return lines
}

function familyLines(input: { ascRashi: Rashi; grahas: readonly NadiYogaPlacement[] }): string[] {
  const lines: string[] = []
  for (const person of FAMILY) {
    const marriage = houseCountedFrom(person.house, 7)
    const study = houseCountedFrom(person.house, 5)
    const married = namesIn(input, marriage)
    const studied = namesIn(input, study)
    if (married.length > 0) {
      lines.push(`${person.label}: the marriage house, the ${ordinal(marriage)}, holds ${join(married)}. Their marriage is read from that contact.`)
    }
    if (studied.length > 0 && study !== 5) {
      lines.push(`${person.label}: the education house, the ${ordinal(study)}, holds ${join(studied)}. Their study is read from that contact.`)
    }
  }
  return lines
}

function settlementLines(input: { ascRashi: Rashi; grahas: readonly NadiYogaPlacement[] }): string[] {
  const lines: string[] = []
  const lordHouse = (house: HouseNumber) => {
    const planet = input.grahas.find((g) => g.id === lordOf(input.ascRashi, house))
    return planet ? houseOf(input.ascRashi, planet.rashi) : null
  }
  const linked = (a: HouseNumber, b: HouseNumber) => {
    const ha = lordHouse(a)
    const hb = lordHouse(b)
    if (ha == null || hb == null) return false
    return ha === b || hb === a || ha === hb
  }
  const travel = linked(3, 12)
  const fortune = linked(3, 9) || linked(9, 12)
  if (travel && fortune) {
    lines.push('The 3rd, 9th, and 12th are linked. Settlement away from the birthplace is read, not only a trip.')
  }
  const fifth = namesIn(input, 5)
  const ninth = namesIn(input, 9)
  if (fifth.includes('Rahu')) {
    lines.push('Rahu is in the 5th. Foreign education is the form checked.')
  } else if (ninth.includes('Rahu')) {
    lines.push('Rahu is in the 9th. Foreign education is the form checked.')
  }
  if (namesIn(input, 12).includes('Rahu')) {
    lines.push('Rahu in the 12th. Addiction is checked before a foreign-travel reading.')
  }
  return lines
}

function namesIn(input: { ascRashi: Rashi; grahas: readonly NadiYogaPlacement[] }, house: HouseNumber): string[] {
  return input.grahas
    .filter((g) => houseOf(input.ascRashi, g.rashi) === house)
    .map((g) => GRAHA_NAMES[g.id])
}

function joinedWith(
  input: { grahas: readonly NadiYogaPlacement[] },
  target: ClassicalGrahaId,
  others: readonly ClassicalGrahaId[],
): string {
  const names = others.filter((id) => sameSign(input, target, id)).map((id) => GRAHA_NAMES[id])
  return join(names)
}

function sameSign(
  input: { grahas: readonly NadiYogaPlacement[] },
  a: ClassicalGrahaId,
  b: ClassicalGrahaId,
): boolean {
  const left = input.grahas.find((g) => g.id === a)
  const right = input.grahas.find((g) => g.id === b)
  return !!left && !!right && left.rashi === right.rashi && a !== b
}

function dignityOf(g: NadiYogaPlacement): string {
  if (g.dignity) return g.dignity
  if (PRESSURE.has(g.id) && g.id !== 'Sa') return ''
  return getDignity(g.id, g.rashi, g.degree ?? 15)
}

function dignityWord(dignity: string): string {
  if (dignity === 'own') return 'in its own sign'
  if (dignity === 'moolatrikona') return 'in moolatrikona'
  return dignity
}

function lordOf(asc: Rashi, house: HouseNumber): ClassicalGrahaId {
  const sign = rashiForHouseFromLagna(asc, house)
  return RASHI_LORDS.find((row) => row.number === sign)?.lord ?? 'Su'
}

function houseOf(asc: Rashi, sign: Rashi): HouseNumber {
  return wholeSignHouseFromLagna(asc, sign)
}

function join(parts: readonly string[]): string {
  if (parts.length <= 1) return parts[0] ?? ''
  if (parts.length === 2) return `${parts[0]} and ${parts[1]}`
  return `${parts.slice(0, -1).join(', ')}, and ${parts[parts.length - 1]}`
}

function cap(text: string): string {
  return text ? text.charAt(0).toUpperCase() + text.slice(1) : text
}

function ordinal(n: number): string {
  const mod = n % 10
  if (mod === 1 && n !== 11) return `${n}st`
  if (mod === 2 && n !== 12) return `${n}nd`
  if (mod === 3 && n !== 13) return `${n}rd`
  return `${n}th`
}
