// ─────────────────────────────────────────────────────────────
//  src/lib/engine/nadi/retrograde.ts
//  Retrograde planets on the birth chart. Rahu and Ketu are
//  always retrograde, and the Sun and Moon never are, so those
//  four are not given a retrograde reading.
//  An exchange reduces the trouble and does not remove it.
//  Saturn keeps the career trouble even in a strong sign.
// ─────────────────────────────────────────────────────────────

import type { Rashi } from '@/types/astrology'
import { getDignity } from '@/lib/engine/dignity'
import {
  RASHI_LORDS,
  wholeSignHouseFromLagna,
  type ClassicalGrahaId,
  type HouseNumber,
} from '@/lib/engine/houseInterpretations'
import { rashiForHouseFromLagna } from '@/lib/engine/rashiInterpretations'
import { nadiAfflictedBy } from '@/lib/engine/nadi/grahas'
import type { NadiGrahaPlacement } from '@/lib/engine/nadi/read'

const OWN: Partial<Record<ClassicalGrahaId, readonly Rashi[]>> = {
  Su: [5],
  Mo: [4],
  Ma: [1, 8],
  Me: [3, 6],
  Ju: [9, 12],
  Ve: [2, 7],
  Sa: [10, 11],
}

const EXALTED: Partial<Record<ClassicalGrahaId, Rashi>> = {
  Su: 1, Mo: 2, Ma: 10, Me: 6, Ju: 4, Ve: 12, Sa: 7,
}

const DEBILITATED: Partial<Record<ClassicalGrahaId, Rashi>> = {
  Su: 7, Mo: 8, Ma: 4, Me: 12, Ju: 10, Ve: 6, Sa: 1,
}

const STRONG = new Set(['exalted', 'own', 'moolatrikona'])
const DUSTHANA = new Set<HouseNumber>([6, 8, 12])
const READ: readonly ClassicalGrahaId[] = ['Ma', 'Me', 'Ju', 'Ve', 'Sa']

export interface RetrogradeInput {
  ascRashi: Rashi
  grahas: readonly NadiGrahaPlacement[]
  parivartana: readonly { a: HouseNumber; b: HouseNumber }[]
}

export interface RetrogradeReading {
  saturn: string | null
  others: string[]
}

export function readRetrograde(input: RetrogradeInput): RetrogradeReading {
  return {
    saturn: saturnNote(input),
    others: otherNotes(input),
  }
}

function saturnNote(input: RetrogradeInput): string | null {
  const saturn = input.grahas.find((g) => g.id === 'Sa')
  if (!saturn?.isRetro) return null
  const house = wholeSignHouseFromLagna(input.ascRashi, saturn.rashi)
  let note = house === 5
    ? 'Saturn retrograde in the 5th: a break in education, more than one change of profession, and a direction that settles around the mid-thirties. A change of place is also checked.'
    : 'Saturn retrograde: more than one change of profession, a change of place, and a direction that settles around the mid-thirties. An early success can still break.'
  if (inOwnOrExalted(saturn)) note += ' The sign is strong, and the career trouble is still read.'
  if (lordStrong(input, 10) && lordStrong(input, 2)) {
    note += ' The 10th lord and the 2nd lord are both strong, so this is the rare case where the trouble is read more lightly. The changes of line still remain.'
  } else if (exchanged(input, house)) {
    note += ' An exchange on Saturn’s house reduces the trouble, and the changes of line still remain.'
  }
  return note
}

function otherNotes(input: RetrogradeInput): string[] {
  const notes: string[] = []
  const venus = placed(input, 'Ve')
  if (venus?.isRetro) {
    notes.push(finish(
      input,
      venus,
      'Venus retrograde: marriage trouble, more than one relationship, or no marriage. The kidneys and the reproductive organs are checked.',
      'the marriage trouble still remains',
    ))
  }
  const mercury = placed(input, 'Me')
  if (mercury?.isRetro) {
    notes.push(finish(
      input,
      mercury,
      'Mercury retrograde: speech is read as very sharp and not to be taken at face value. A change of study is also checked.',
      'the change of study still remains',
    ))
  }
  const jupiter = placed(input, 'Ju')
  if (jupiter?.isRetro) {
    notes.push(finish(
      input,
      jupiter,
      'Jupiter retrograde: childbirth is checked as delayed, lost, or limited to daughters. A break in education is also checked.',
      'the childbirth reading still remains',
    ))
  }
  const mars = placed(input, 'Ma')
  if (mars?.isRetro) {
    notes.push(finish(
      input,
      mars,
      'Mars retrograde: a long dispute over property, and a dispute with siblings, are checked.',
      'the dispute still remains',
    ))
  }

  const fifthLord = lordOf(input.ascRashi, 5)
  const fifthLordPlanet = input.grahas.find((g) => g.id === fifthLord)
  const saturnInFifth = fifthLordPlanet?.id === 'Sa'
    && fifthLordPlanet.isRetro
    && wholeSignHouseFromLagna(input.ascRashi, fifthLordPlanet.rashi) === 5
  const retroFifth = input.grahas.some((g) => (
    g.isRetro && READ.includes(g.id) && g.id !== 'Sa' && wholeSignHouseFromLagna(input.ascRashi, g.rashi) === 5
  ))
  if (fifthLordPlanet?.isRetro && READ.includes(fifthLordPlanet.id) && !saturnInFifth) {
    notes.push('The 5th lord is retrograde, so the course of study is left.')
  } else if (retroFifth) {
    notes.push('A retrograde planet in the 5th: a break or a change of study.')
  }

  const seventhLord = lordOf(input.ascRashi, 7)
  const seventh = input.grahas.find((g) => g.id === seventhLord)
  if (seventh?.isRetro && READ.includes(seventh.id)) {
    notes.push('The 7th lord is retrograde. Late marriage and a separation are read together. One of them is not picked out on its own.')
  }
  return notes
}

function finish(input: RetrogradeInput, planet: NadiGrahaPlacement, base: string, remains: string): string {
  let note = base
  const kind = signKind(planet, input.grahas)
  if (kind === 'strong') note += ' The sign is strong, so the result is read as powerful.'
  if (kind === 'weak') note += ' The planet is weak, so the result is read as heavy.'
  const house = wholeSignHouseFromLagna(input.ascRashi, planet.rashi)
  if (exchanged(input, house)) note += ` An exchange on this house reduces the trouble, and ${remains}.`
  return note
}

function signKind(planet: NadiGrahaPlacement, grahas: readonly NadiGrahaPlacement[]): 'strong' | 'weak' | 'open' {
  if (inOwnOrExalted(planet)) return 'strong'
  const co = grahas.filter((g) => g.rashi === planet.rashi).map((g) => g.id)
  if (planet.rashi === DEBILITATED[planet.id] || nadiAfflictedBy(planet.id, co).length > 0) return 'weak'
  return 'open'
}

function inOwnOrExalted(planet: NadiGrahaPlacement): boolean {
  return planet.rashi === EXALTED[planet.id] || (OWN[planet.id]?.includes(planet.rashi) ?? false)
}

function lordStrong(input: RetrogradeInput, house: HouseNumber): boolean {
  const lord = lordOf(input.ascRashi, house)
  const planet = input.grahas.find((g) => g.id === lord)
  if (!planet) return false
  const dignity = planet.dignity || getDignity(planet.id, planet.rashi, planet.degree ?? 15)
  const houseOfLord = wholeSignHouseFromLagna(input.ascRashi, planet.rashi)
  const co = input.grahas.filter((g) => g.rashi === planet.rashi).map((g) => g.id)
  return STRONG.has(dignity) && !DUSTHANA.has(houseOfLord) && nadiAfflictedBy(lord, co).length === 0
}

function exchanged(input: RetrogradeInput, house: HouseNumber): boolean {
  return input.parivartana.some((pair) => pair.a === house || pair.b === house)
}

function placed(input: RetrogradeInput, id: ClassicalGrahaId): NadiGrahaPlacement | undefined {
  return input.grahas.find((g) => g.id === id)
}

function lordOf(asc: Rashi, house: HouseNumber): ClassicalGrahaId {
  const sign = rashiForHouseFromLagna(asc, house)
  return RASHI_LORDS.find((row) => row.number === sign)?.lord ?? 'Su'
}
