// ─────────────────────────────────────────────────────────────
//  src/lib/engine/nadi/placements.ts
//  A planet is read from the house it occupies, the houses it
//  rules, and the sign it sits in. The sign brings its own
//  natural house. Whole sign. Teaching associations.
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
import { NADI_GRAHAS } from '@/lib/engine/nadi/grahas'
import { NADI_HOUSES } from '@/lib/engine/nadi/houses'

export const NADI_PLACEMENT_NOTE =
  'A planet is read from the house it occupies, then from the houses it rules, then from its sign. The sign brings the nature of its own natural house. Rahu and Ketu rule no sign: they act like the lord of the sign they occupy.'

const ORDER: readonly ClassicalGrahaId[] = ['Su', 'Mo', 'Ma', 'Me', 'Ju', 'Ve', 'Sa', 'Ra', 'Ke']
const HOUSES: readonly HouseNumber[] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
const PAPA = new Set<ClassicalGrahaId>(['Ma', 'Sa', 'Ra', 'Ke'])
const STRONG = new Set(['exalted', 'own', 'moolatrikona'])
const RETRO = new Set<ClassicalGrahaId>(['Ma', 'Me', 'Ju', 'Ve', 'Sa'])

/** Short theme, written so it can sit inside a sentence. */
const CARRY: Record<HouseNumber, string> = {
  1: 'the body',
  2: 'wealth',
  3: 'siblings',
  4: 'the home',
  5: 'children and study',
  6: 'service',
  7: 'marriage',
  8: 'hidden matters',
  9: 'luck',
  10: 'the career',
  11: 'gains',
  12: 'foreign lands',
}

export interface NadiPlacementBody {
  id: ClassicalGrahaId
  rashi: Rashi
  dignity?: string
  isRetro?: boolean
  degree?: number
}

export interface NadiPlacement {
  id: ClassicalGrahaId
  name: string
  house: HouseNumber
  houseName: string
  sign: Rashi
  signName: string
  naturalHouse: HouseNumber
  naturalHouseName: string
  /** Houses this graha rules from the lagna. Nodes rule none. */
  lordOf: HouseNumber[]
  dignity: string | null
  retro: boolean
  prediction: string
}

export function readNadiPlacements(input: {
  ascRashi: Rashi
  grahas: readonly NadiPlacementBody[]
}): NadiPlacement[] {
  const placed = new Map(input.grahas.map((g) => [g.id, g]))
  return ORDER.flatMap((id) => {
    const g = placed.get(id)
    if (!g) return []
    const house = wholeSignHouseFromLagna(input.ascRashi, g.rashi)
    const natural = g.rashi as HouseNumber
    const lordOf = housesRuled(input.ascRashi, id)
    const dignity = dignityOf(g)
    const retro = !!g.isRetro && RETRO.has(id)
    const co = input.grahas.filter((other) => other.rashi === g.rashi).map((other) => other.id)
    return [{
      id,
      name: GRAHA_NAMES[id],
      house,
      houseName: NADI_HOUSES[house].name,
      sign: g.rashi,
      signName: RASHI_NAMES[g.rashi],
      naturalHouse: natural,
      naturalHouseName: NADI_HOUSES[natural].name,
      lordOf,
      dignity,
      retro,
      prediction: planetPrediction(input, g, house, lordOf, dignity, retro, co),
    }]
  })
}

export function nadiHouseLine(input: {
  ascRashi: Rashi
  house: HouseNumber
  lordHouse: HouseNumber | null
  placements: readonly NadiPlacement[]
}): string {
  const sign = rashiForHouseFromLagna(input.ascRashi, input.house)
  const signName = RASHI_NAMES[sign]
  const natural = sign as HouseNumber
  const lord = RASHI_LORDS.find((row) => row.number === sign)?.lord ?? 'Su'
  const lordName = GRAHA_NAMES[lord]
  const there = input.placements.filter((row) => row.house === input.house)
  const lines: string[] = []

  if (natural === input.house) {
    const theme = CARRY[input.house]
    lines.push(`The ${ordinal(input.house)} is ${signName}, and ${signName} carries the ${ordinal(input.house)} as well, so ${theme} ${be(theme)} read twice.`)
  } else {
    lines.push(`The ${ordinal(input.house)} is ${signName}. ${signName} carries the nature of the ${ordinal(natural)} (${NADI_HOUSES[natural].name}), so ${CARRY[natural]} joins ${CARRY[input.house]}.`)
  }

  if (input.lordHouse == null) {
    lines.push(`Its lord, ${lordName}, is not placed on this chart.`)
  } else if (input.lordHouse === input.house) {
    lines.push(`Its lord, ${lordName}, sits in it, so the ${ordinal(input.house)} is read from itself.`)
  } else {
    lines.push(`Its lord, ${lordName}, sits in the ${ordinal(input.lordHouse)}, so the ${ordinal(input.house)} is read from the ${ordinal(input.lordHouse)}.`)
  }

  if (there.length === 0) {
    lines.push('No planet occupies it.')
  } else {
    const names = join(there.map((row) => row.name))
    const verb = there.length === 1 ? 'occupies' : 'occupy'
    const carried = there.flatMap((row) => {
      const bit = carryBit(row, input.house)
      return bit ? [bit] : []
    })
    lines.push(carried.length > 0 ? `${names} ${verb} it. ${carried.join('. ')}.` : `${names} ${verb} it.`)
  }

  const papas = there.filter((row) => PAPA.has(row.id))
  if (papas.length > 0) {
    const names = join(papas.map((row) => row.name))
    lines.push(`${names} ${papas.length === 1 ? 'is' : 'are'} here, so the living significances of the ${ordinal(input.house)} are under pressure.`)
  }

  return lines.join(' ')
}

function planetPrediction(
  input: { ascRashi: Rashi; grahas: readonly NadiPlacementBody[] },
  g: NadiPlacementBody,
  house: HouseNumber,
  lordOf: HouseNumber[],
  dignity: string | null,
  retro: boolean,
  co: ClassicalGrahaId[],
): string {
  const name = GRAHA_NAMES[g.id]
  const signName = RASHI_NAMES[g.rashi]
  const natural = g.rashi as HouseNumber
  const lines = [
    `${name} sits in ${signName} in the ${ordinal(house)} (${NADI_HOUSES[house].name}).`,
    g.id === 'Ra' || g.id === 'Ke'
      ? nodeSentence(input, g)
      : lordSentence(house, lordOf),
    signSentence(signName, natural, house),
  ]
  const note = NADI_HOUSES[house].occupants[g.id]
  if (note) lines.push(finish(note))
  const dignityLine = dignitySentence(g.id, name, dignity)
  if (dignityLine) lines.push(dignityLine)
  if (retro) lines.push(`${name} is retrograde, so this result is late.`)
  lines.push(...companionSentences(g.id, house, co))
  return lines.join(' ')
}

function nodeSentence(
  input: { ascRashi: Rashi; grahas: readonly NadiPlacementBody[] },
  g: NadiPlacementBody,
): string {
  const lord = RASHI_LORDS.find((row) => row.number === g.rashi)?.lord
  if (!lord) return `${GRAHA_NAMES[g.id]} rules no sign.`
  const themes = joinThemes(housesRuled(input.ascRashi, lord))
  const manner = g.id === 'Ke' ? 'with a cut' : 'with a sudden turn'
  let line = `${GRAHA_NAMES[g.id]} rules no sign. It acts like ${GRAHA_NAMES[lord]}, lord of ${RASHI_NAMES[g.rashi]}, so ${themes} ${be(themes)} read ${manner}.`
  if (input.grahas.some((other) => other.id === lord && other.rashi === g.rashi)) {
    line += ` ${GRAHA_NAMES[lord]} sits with it, so that reading is stronger.`
  }
  return line
}

function lordSentence(house: HouseNumber, lordOf: HouseNumber[]): string {
  const extra = lordOf.filter((ruled) => ruled !== house)
  const ownsHere = lordOf.includes(house)
  const ruled = join(lordOf.map((h) => `the ${ordinal(h)}`))
  if (ownsHere && extra.length === 0) {
    return `It rules this house, so the ${ordinal(house)} is read from itself.`
  }
  const themes = joinThemes(extra)
  const here = ownsHere ? ` It is also the lord of the ${ordinal(house)}.` : ''
  return `It rules ${ruled}. ${cap(themes)} ${be(themes)} read from the ${ordinal(house)}.${here}`
}

function signSentence(signName: string, natural: HouseNumber, house: HouseNumber): string {
  if (natural === house) {
    const theme = CARRY[house]
    return `${signName} carries the ${ordinal(house)} as well, so ${theme} ${be(theme)} read twice.`
  }
  const brought = CARRY[natural]
  return `${signName} carries the nature of the ${ordinal(natural)} (${NADI_HOUSES[natural].name}), so ${brought} ${plural(brought) ? 'join' : 'joins'} ${CARRY[house]}.`
}

function carryBit(row: NadiPlacement, house: HouseNumber): string | null {
  if (row.id === 'Ra') return 'Rahu brings a sudden turn'
  if (row.id === 'Ke') return 'Ketu brings a cut'
  const extra = row.lordOf.filter((ruled) => ruled !== house)
  if (extra.length === 0) return null
  return `${row.name} carries ${join(extra.map((ruled) => `the ${ordinal(ruled)}`))}`
}

function dignitySentence(id: ClassicalGrahaId, name: string, dignity: string | null): string | null {
  if (id === 'Ra' || id === 'Ke' || !dignity) return null
  if (STRONG.has(dignity)) {
    const word = dignity === 'own' ? 'in its own sign' : dignity === 'moolatrikona' ? 'in moolatrikona' : 'exalted'
    return `${name} is ${word}, so ${themesOf(id, 2)} arrive cleanly.`
  }
  if (dignity === 'debilitated') {
    const text = themesOf(id, 1)
    return `${name} is debilitated, so ${text} ${be(text)} strained.`
  }
  return null
}

function companionSentences(self: ClassicalGrahaId, house: HouseNumber, co: readonly ClassicalGrahaId[]): string[] {
  const others = ORDER.filter((id) => id !== self && co.includes(id))
  const papa = others.filter((id) => PAPA.has(id))
  const rest = others.filter((id) => !PAPA.has(id)).slice(0, 2)
  const lines: string[] = []
  if (papa.length > 0) {
    const names = join(papa.map((id) => GRAHA_NAMES[id]))
    lines.push(`${names} ${papa.length === 1 ? 'sits' : 'sit'} with it, so the living themes of the ${ordinal(house)} are under pressure.`)
  }
  for (const id of rest) {
    const text = themesOf(id, 1)
    lines.push(`${GRAHA_NAMES[id]} sits with it, so ${text} ${plural(text) ? 'join' : 'joins'} the ${ordinal(house)}.`)
  }
  return lines
}

function housesRuled(asc: Rashi, id: ClassicalGrahaId): HouseNumber[] {
  if (id === 'Ra' || id === 'Ke') return []
  return HOUSES.filter((house) => {
    const sign = rashiForHouseFromLagna(asc, house)
    return RASHI_LORDS.find((row) => row.number === sign)?.lord === id
  })
}

function dignityOf(g: NadiPlacementBody): string | null {
  if (g.dignity) return g.dignity
  if (g.id === 'Ra' || g.id === 'Ke') return null
  return getDignity(g.id, g.rashi, g.degree ?? 15)
}

function themesOf(id: ClassicalGrahaId, count: number): string {
  return join(NADI_GRAHAS[id].significances.slice(0, count).map((item) => item.charAt(0).toLowerCase() + item.slice(1)))
}

function joinThemes(houses: readonly HouseNumber[]): string {
  return join(houses.map((house) => CARRY[house]))
}

function plural(theme: string): boolean {
  return /\band\b|\b(gains|siblings|matters|lands)\b/.test(theme)
}

function be(theme: string): 'is' | 'are' {
  return plural(theme) ? 'are' : 'is'
}

function join(parts: readonly string[]): string {
  if (parts.length <= 1) return parts[0] ?? ''
  if (parts.length === 2) {
    const glue = parts.some((part) => part.includes(' and ')) ? ', and ' : ' and '
    return `${parts[0]}${glue}${parts[1]}`
  }
  return `${parts.slice(0, -1).join(', ')}, and ${parts[parts.length - 1]}`
}

function cap(text: string): string {
  return text ? text.charAt(0).toUpperCase() + text.slice(1) : text
}

function finish(text: string): string {
  return /[.!?]$/.test(text) ? text : `${text}.`
}

function ordinal(n: number): string {
  const mod = n % 10
  if (mod === 1 && n !== 11) return `${n}st`
  if (mod === 2 && n !== 12) return `${n}nd`
  if (mod === 3 && n !== 13) return `${n}rd`
  return `${n}th`
}
