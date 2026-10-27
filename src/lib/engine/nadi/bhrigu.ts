// ─────────────────────────────────────────────────────────────
//  src/lib/engine/nadi/bhrigu.ts
//  Bhrigu Bhava on the birth chart only. The house number
//  matches the lagna sign. A hard result and a blessing can
//  both show. Affliction is a conjunction, and Jupiter with
//  Ketu is not one. This is not the Bhrigu Bindu.
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
import { rashiForHouseFromLagna } from '@/lib/engine/rashiInterpretations'
import { nadiAspectsSign } from '@/lib/engine/nadi/snapshots'
import { nadiConjunct, type NadiYogaPlacement } from '@/lib/engine/nadi/yogas'

export const NADI_BHRIGU_NOTE =
  'The Bhrigu Bhava is the house with the same number as the lagna sign. It is read on the birth chart. Planets in that house, and the planets with its lord, are the past-life carry. A blessing and a hard result can both show. Affliction is a conjunction with a malefic. Jupiter with Ketu is not an affliction. Exaltation alone is not that test. This house is not the Bhrigu Bindu.'

const ORDER: readonly ClassicalGrahaId[] = ['Su', 'Mo', 'Ma', 'Me', 'Ju', 'Ve', 'Sa', 'Ra', 'Ke']
const PAPA = new Set<ClassicalGrahaId>(['Ma', 'Sa', 'Ra', 'Ke'])
const BENEFIC = new Set<ClassicalGrahaId>(['Ju', 'Ve', 'Me', 'Mo'])
const WEALTH = new Set<HouseNumber>([2, 5, 9, 11])
const DURGA: readonly (readonly [ClassicalGrahaId, ClassicalGrahaId])[] = [
  ['Ma', 'Ra'],
  ['Ma', 'Ke'],
  ['Sa', 'Ra'],
  ['Sa', 'Ke'],
  ['Su', 'Ra'],
  ['Su', 'Ke'],
  ['Mo', 'Ra'],
  ['Mo', 'Ke'],
]

type Placement = NadiYogaPlacement

export function bhriguBhavaNotes(input: {
  ascRashi: Rashi
  grahas: readonly Placement[]
  parivartana?: readonly { a: HouseNumber; b: HouseNumber }[]
}): { house: HouseNumber; notes: string[] } {
  const lagna = input.ascRashi
  const house = lagna as HouseNumber
  const sign = rashiForHouseFromLagna(lagna, house)
  const lordId = signLord(sign)
  const lord = placed(input.grahas, lordId)
  const notes: string[] = [
    `The lagna is ${RASHI_NAMES[lagna]}, so the Bhrigu Bhava is the ${ordinal(house)}. It is the past-life house on the birth chart.`,
  ]

  const occupants = ORDER.filter((id) => {
    const planet = placed(input.grahas, id)
    return planet != null && planet.rashi === sign
  })
  if (occupants.length) {
    notes.push(`${joinNames(occupants.map((id) => GRAHA_NAMES[id]))} ${occupants.length === 1 ? 'sits' : 'sit'} in the Bhrigu Bhava.`)
  } else {
    notes.push('No planet sits in the Bhrigu Bhava. The lord carries the reading.')
  }

  if (input.parivartana?.some((pair) => pair.a === house || pair.b === house)) {
    notes.push('An exchange takes in the Bhrigu Bhava. That exchange is part of this reading.')
  }

  if (lord) {
    const lordHouse = wholeSignHouseFromLagna(lagna, lord.rashi)
    const withLord = ORDER.filter((id) => id !== lordId && conjunct(input.grahas, lordId, id))
    const company = withLord.length ? ` ${GRAHA_NAMES[lordId]} is with ${joinNames(withLord.map((id) => GRAHA_NAMES[id]))}.` : ''
    notes.push(`The lord, ${GRAHA_NAMES[lordId]}, sits in the ${ordinal(lordHouse)}.${company}`)
    if (WEALTH.has(lordHouse)) {
      notes.push(`The lord sits in the ${ordinal(lordHouse)}. Wealth is read from that, from the family or from the person's own work.`)
    }
  }

  const exempt = conjunct(input.grahas, 'Ju', 'Ke')
  const housePapa = occupants.filter((id) => PAPA.has(id) && !(id === 'Ke' && exempt))
  const lordPapa = lord
    ? ORDER.filter((id) => PAPA.has(id) && id !== lordId && conjunct(input.grahas, lordId, id) && !(id === 'Ke' && exempt))
    : []
  const afflicting = unique([...housePapa, ...lordPapa])
  if (afflicting.length) {
    const extreme = afflicting.includes('Ra') ? ' With Rahu, the result is read as extreme.' : ''
    notes.push(`${joinNames(afflicting.map((id) => GRAHA_NAMES[id]))} ${afflicting.length === 1 ? 'afflicts' : 'afflict'} the Bhrigu Bhava. Struggle, health, or a fall is checked.${extreme}`)
  }
  if (exempt && (occupants.includes('Ke') || (lord != null && conjunct(input.grahas, lordId, 'Ke')))) {
    notes.push('Jupiter with Ketu is not read as an affliction of this house.')
  }

  const exalted = unique([
    ...occupants.filter((id) => dignityOf(placed(input.grahas, id)!) === 'exalted'),
    ...(lord && dignityOf(lord) === 'exalted' ? [lordId] : []),
  ])
  if (exalted.length) {
    notes.push(`${joinNames(exalted.map((id) => GRAHA_NAMES[id]))} ${exalted.length === 1 ? 'is' : 'are'} exalted. A blessing is read from the Bhrigu Bhava.`)
  }
  const plainBenefic = occupants.filter((id) => BENEFIC.has(id) && !exalted.includes(id))
  if (plainBenefic.length) {
    notes.push(`${joinNames(plainBenefic.map((id) => GRAHA_NAMES[id]))} ${plainBenefic.length === 1 ? 'sits' : 'sit'} in the Bhrigu Bhava. A blessing is read.`)
  }
  if (lord && dignityOf(lord) === 'debilitated') {
    notes.push(`The lord, ${GRAHA_NAMES[lordId]}, is debilitated. A struggle is checked.`)
  }

  if (pairOnReading(input.grahas, lagna, house, lordId, ['Me', 'Ve'])) {
    notes.push('Mercury and Venus are together on this reading. Wealth is read from that pair.')
  } else if (lord && aspectsLord(input.grahas, lord, 'Me') && aspectsLord(input.grahas, lord, 'Ve')) {
    notes.push('Mercury and Venus aspect the Bhrigu Bhava lord. Wealth is read from that.')
  }

  if (nadiConjunct(input.grahas, ['Ju', 'Ra']) && pairOnReading(input.grahas, lagna, house, lordId, ['Ju', 'Ra'])) {
    notes.push('Jupiter with Rahu is read for fame, and a mark on that fame is checked.')
  }

  let durga = false
  for (const pair of DURGA) {
    if (!pairOnReading(input.grahas, lagna, house, lordId, pair)) continue
    durga = true
    notes.push(`${GRAHA_NAMES[pair[0]]} and ${GRAHA_NAMES[pair[1]]} are a Durga combination on the Bhrigu Bhava. A chronic illness, a surgery, or a serious accident is checked.`)
  }
  if (durga && house === 3) {
    notes.push('The 3rd includes the arms in that reading.')
  }

  if (pairOnReading(input.grahas, lagna, house, lordId, ['Sa', 'Ma', 'Ra'])) {
    notes.push('Saturn, Mars, and Rahu are together on this reading. A uniformed profession is one option, and an injury is checked.')
  }

  if (venusConnects(input.grahas, lordId, lord)) {
    notes.push('Venus connects with the Bhrigu Bhava lord. Healing work, including medicine, is one option.')
  }

  const jupiter = placed(input.grahas, 'Ju')
  const rahuInFifth = placed(input.grahas, 'Ra')
  if (
    lagna === 5
    && rahuInFifth
    && wholeSignHouseFromLagna(lagna, rahuInFifth.rashi) === 5
    && jupiter
    && wholeSignHouseFromLagna(lagna, jupiter.rashi) === 12
    && dignityOf(jupiter) === 'exalted'
  ) {
    notes.push('Rahu is in the 5th, and Jupiter, its lord, is exalted in the 12th. Delay in marriage and in childbirth is checked. Astrology, teaching, or consulting is also one option.')
  }

  return { house, notes }
}

function pairOnReading(
  grahas: readonly Placement[],
  lagna: Rashi,
  house: HouseNumber,
  lordId: ClassicalGrahaId,
  planets: readonly ClassicalGrahaId[],
): boolean {
  const group = nadiConjunct(grahas, planets)
  if (!group) return false
  const groupHouse = wholeSignHouseFromLagna(lagna, group[0]!.rashi)
  return groupHouse === house || planets.includes(lordId) || groupHouse === houseOf(grahas, lagna, lordId)
}

function venusConnects(grahas: readonly Placement[], lordId: ClassicalGrahaId, lord: Placement | null): boolean {
  if (lordId === 'Ve') return true
  if (!lord) return false
  if (conjunct(grahas, lordId, 'Ve')) return true
  return aspectsLord(grahas, lord, 'Ve')
}

function aspectsLord(grahas: readonly Placement[], lord: Placement, id: ClassicalGrahaId): boolean {
  const planet = placed(grahas, id)
  return planet != null && planet.rashi !== lord.rashi && nadiAspectsSign(planet.rashi, id, lord.rashi)
}

function conjunct(grahas: readonly Placement[], a: ClassicalGrahaId, b: ClassicalGrahaId): boolean {
  return nadiConjunct(grahas, [a, b]) != null
}

function houseOf(grahas: readonly Placement[], lagna: Rashi, id: ClassicalGrahaId): HouseNumber | null {
  const planet = placed(grahas, id)
  return planet ? wholeSignHouseFromLagna(lagna, planet.rashi) : null
}

function dignityOf(planet: Placement): string {
  if (planet.dignity) return planet.dignity
  if (planet.id === 'Ra' || planet.id === 'Ke') return 'neutral'
  return getDignity(planet.id, planet.rashi, planet.degree ?? 15)
}

function placed(grahas: readonly Placement[], id: ClassicalGrahaId): Placement | null {
  return grahas.find((g) => g.id === id) ?? null
}

function signLord(sign: Rashi): ClassicalGrahaId {
  return RASHI_LORDS.find((row) => row.number === sign)?.lord ?? 'Su'
}

function unique(ids: ClassicalGrahaId[]): ClassicalGrahaId[] {
  return ids.filter((id, index) => ids.indexOf(id) === index)
}

function joinNames(names: string[]): string {
  if (names.length <= 1) return names[0] ?? ''
  if (names.length === 2) return `${names[0]} and ${names[1]}`
  return `${names.slice(0, -1).join(', ')}, and ${names[names.length - 1]}`
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
