// ─────────────────────────────────────────────────────────────
//  src/lib/engine/nadi/shashtiamsa.ts
//  D60 is read with the same rules as the birth chart.
//  A result that has several forms is kept as the set.
//  No birth-time rectification is done here.
// ─────────────────────────────────────────────────────────────

import type { Rashi } from '@/types/astrology'
import { GRAHA_NAMES } from '@/types/astrology'
import {
  RASHI_LORDS,
  wholeSignHouseFromLagna,
  type ClassicalGrahaId,
  type HouseNumber,
} from '@/lib/engine/houseInterpretations'
import { rashiForHouseFromLagna } from '@/lib/engine/rashiInterpretations'
import { nadiConjunct, type NadiYogaPlacement } from '@/lib/engine/nadi/yogas'

export const NADI_SHASHTIAMSA_NOTE =
  'Shashtiamsa is read with the same rules as the birth chart. A combination with more than one result is read as the set. The 2nd and the 11th are read for wealth. These lines are only as fine as the birth time.'

const ORDER: readonly ClassicalGrahaId[] = ['Su', 'Mo', 'Ma', 'Me', 'Ju', 'Ve', 'Sa', 'Ra', 'Ke']
const RETROGRADE: readonly ClassicalGrahaId[] = ['Ma', 'Me', 'Ju', 'Ve', 'Sa']

type Placement = NadiYogaPlacement & { isRetro?: boolean }

export function shashtiamsaNotes(input: {
  shashtiamsa?: { ascRashi: Rashi; grahas: readonly Placement[] }
}): string[] {
  const chart = input.shashtiamsa
  if (!chart) return []
  const { ascRashi: lagna, grahas } = chart
  const lines: string[] = []
  const lagnaLord = signLord(lagna)
  const tenthLord = signLord(rashiForHouseFromLagna(lagna, 10))

  if (houseOf(grahas, lagna, tenthLord) === 5) {
    lines.push('The 10th lord of Shashtiamsa sits in the 5th. Teaching is read as prominent.')
  }

  for (const id of ['Ju', 'Ve'] as const) {
    const house = houseOf(grahas, lagna, id)
    if (house !== 1 && house !== 10) continue
    const where = house === 1 ? 'the Shashtiamsa lagna' : 'the 10th of Shashtiamsa'
    lines.push(`${GRAHA_NAMES[id]} sits in ${where}. Teaching, or astrology, is one option.`)
  }

  const third = ORDER.flatMap((id) => (houseOf(grahas, lagna, id) === 3 ? [GRAHA_NAMES[id]] : []))
  if (third.length) {
    lines.push(`${joinNames(third)} ${third.length === 1 ? 'sits' : 'sit'} in the 3rd of Shashtiamsa. Writing is one option.`)
  }

  if (housesConnect(lagna, grahas, 5, 6)) {
    lines.push('The 5th and the 6th of Shashtiamsa connect. Medicine or law, through education, is one option.')
  }

  if (nadiConjunct(grahas, ['Ma', 'Ke'])) {
    lines.push('Mars and Ketu together in Shashtiamsa. Surgery, or a uniformed profession, is one option.')
  }

  if (housesConnect(lagna, grahas, 2, 11)) {
    lines.push('The 2nd and the 11th of Shashtiamsa connect. Wealth is read from that.')
  }

  const dusthana = ([6, 8] as const).filter((house) => lagnaLordReaches(lagna, grahas, lagnaLord, house))
  if (dusthana.length === 2) {
    lines.push('The lagna lord connects with the 6th and the 8th of Shashtiamsa. A chronic illness is checked.')
  } else if (dusthana.length === 1) {
    lines.push(`The lagna lord connects with the ${ordinal(dusthana[0]!)} of Shashtiamsa. A chronic illness is checked.`)
  }

  const seventh = placed(grahas, signLord(rashiForHouseFromLagna(lagna, 7)))
  if (seventh?.isRetro && RETROGRADE.includes(seventh.id)) {
    lines.push('The 7th lord of Shashtiamsa is retrograde. Late marriage and a separation are read together. One of them is not picked out on its own.')
  }

  return lines
}

function housesConnect(
  lagna: Rashi,
  grahas: readonly Placement[],
  a: HouseNumber,
  b: HouseNumber,
): boolean {
  const lordA = signLord(rashiForHouseFromLagna(lagna, a))
  const lordB = signLord(rashiForHouseFromLagna(lagna, b))
  if (houseOf(grahas, lagna, lordA) === b || houseOf(grahas, lagna, lordB) === a) return true
  return lordA !== lordB && nadiConjunct(grahas, [lordA, lordB]) != null
}

function lagnaLordReaches(
  lagna: Rashi,
  grahas: readonly Placement[],
  lagnaLord: ClassicalGrahaId,
  house: HouseNumber,
): boolean {
  if (houseOf(grahas, lagna, lagnaLord) === house) return true
  const other = signLord(rashiForHouseFromLagna(lagna, house))
  return other !== lagnaLord && nadiConjunct(grahas, [lagnaLord, other]) != null
}

function houseOf(
  grahas: readonly Placement[],
  lagna: Rashi,
  id: ClassicalGrahaId,
): HouseNumber | null {
  const planet = placed(grahas, id)
  return planet ? wholeSignHouseFromLagna(lagna, planet.rashi) : null
}

function placed(grahas: readonly Placement[], id: ClassicalGrahaId): Placement | null {
  return grahas.find((g) => g.id === id) ?? null
}

function signLord(sign: Rashi): ClassicalGrahaId {
  return RASHI_LORDS.find((row) => row.number === sign)?.lord ?? 'Su'
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
