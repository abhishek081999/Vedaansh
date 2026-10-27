// ─────────────────────────────────────────────────────────────
//  src/lib/engine/nadi/dusthana.ts
//  In the 6th, 8th, or 12th, exaltation is read as debilitation
//  and debilitation as exaltation. Rahu and Ketu take the
//  dispositor’s dignity. An exchange or a crowd of three still stands.
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
import type { NadiYogaPlacement } from '@/lib/engine/nadi/yogas'

export const NADI_DUSTHANA_NOTE =
  'A planet exalted in the 6th, 8th, or 12th is read as debilitated. A planet debilitated there is read as exalted. Rahu and Ketu take this from the dispositor. An exchange, or a conjunction of three or more, still stands.'

const DUSTHANA = new Set<HouseNumber>([6, 8, 12])
const CLASSICAL: readonly ClassicalGrahaId[] = ['Su', 'Mo', 'Ma', 'Me', 'Ju', 'Ve', 'Sa']

export function dusthanaReversalNotes(input: {
  ascRashi: Rashi
  grahas: readonly NadiYogaPlacement[]
  parivartana?: readonly { a: HouseNumber; b: HouseNumber }[]
}): string[] {
  const lines: string[] = []
  const exchanging = new Set<ClassicalGrahaId>()
  for (const pair of input.parivartana ?? []) {
    exchanging.add(signLord(rashiForHouseFromLagna(input.ascRashi, pair.a)))
    exchanging.add(signLord(rashiForHouseFromLagna(input.ascRashi, pair.b)))
  }

  for (const id of CLASSICAL) {
    const planet = input.grahas.find((g) => g.id === id)
    if (!planet) continue
    const house = wholeSignHouseFromLagna(input.ascRashi, planet.rashi)
    if (!DUSTHANA.has(house)) continue
    const dignity = pole(planet)
    if (!dignity) continue
    if (id === 'Ve' && house === 12 && dignity === 'debilitated') {
      lines.push('Venus is debilitated in the 12th. That debilitation stays. The 12th does not turn it into exaltation. The placement is still read as auspicious.')
      continue
    }
    const reversed = dignity === 'exalted' ? 'debilitated' : 'exalted'
    let line = `${GRAHA_NAMES[id]} is ${dignity} in the ${ordinal(house)}. In the 6th, 8th, or 12th that is read as ${reversed}.`
    line += stillStands(id, planet.rashi, exchanging, input.grahas)
    lines.push(line)
  }

  for (const id of ['Ra', 'Ke'] as const) {
    const planet = input.grahas.find((g) => g.id === id)
    if (!planet) continue
    const house = wholeSignHouseFromLagna(input.ascRashi, planet.rashi)
    if (!DUSTHANA.has(house)) continue
    const lord = signLord(planet.rashi)
    const host = input.grahas.find((g) => g.id === lord)
    if (!host) continue
    const dignity = pole(host)
    if (!dignity) continue
    const reversed = dignity === 'exalted' ? 'debilitated' : 'exalted'
    let line = `${GRAHA_NAMES[id]}’s dispositor ${GRAHA_NAMES[lord]} is ${dignity}, and ${GRAHA_NAMES[id]} sits in the ${ordinal(house)}. ${GRAHA_NAMES[id]} is read as ${reversed}.`
    line += stillStands(id, planet.rashi, exchanging, input.grahas)
    lines.push(line)
  }
  return lines
}

function stillStands(
  id: ClassicalGrahaId,
  rashi: Rashi,
  exchanging: ReadonlySet<ClassicalGrahaId>,
  grahas: readonly NadiYogaPlacement[],
): string {
  const bits: string[] = []
  if (exchanging.has(id)) bits.push('The exchange still stands.')
  const crowd = grahas.filter((g) => g.rashi === rashi).length >= 3
  if (crowd) bits.push('The conjunction still stands.')
  return bits.length ? ` ${bits.join(' ')}` : ''
}

function pole(planet: NadiYogaPlacement): 'exalted' | 'debilitated' | null {
  if (planet.dignity === 'exalted' || planet.dignity === 'debilitated') return planet.dignity
  const dignity = getDignity(planet.id, planet.rashi, planet.degree ?? 15)
  return dignity === 'exalted' || dignity === 'debilitated' ? dignity : null
}

function signLord(sign: Rashi): ClassicalGrahaId {
  return RASHI_LORDS.find((row) => row.number === sign)?.lord ?? 'Su'
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
