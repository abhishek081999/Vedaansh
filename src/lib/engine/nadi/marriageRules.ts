// ─────────────────────────────────────────────────────────────
//  src/lib/engine/nadi/marriageRules.ts
//  Three marriage rules, read together. One or two are delay
//  or trouble. All three are the strong separation reading.
//  The Moon chart is not used. Birth time is not judged here.
// ─────────────────────────────────────────────────────────────

import type { Rashi } from '@/types/astrology'
import { GRAHA_NAMES, RASHI_NAMES } from '@/types/astrology'
import { getDignity } from '@/lib/engine/dignity'
import { getRashiDrishti } from '@/lib/engine/jaimini/aspects'
import {
  wholeSignHouseFromLagna,
  type ClassicalGrahaId,
  type HouseNumber,
} from '@/lib/engine/houseInterpretations'
import { rashiForHouseFromLagna } from '@/lib/engine/rashiInterpretations'
import { NADI_HOUSES } from '@/lib/engine/nadi/houses'
import { houseCountedFrom } from '@/lib/engine/nadi/rotation'
import { rashiAgeNotes } from '@/lib/engine/nadi/rashiAge'
import { nadiAspectsSign } from '@/lib/engine/nadi/snapshots'
import { nadiConjunct, type NadiYogaPlacement } from '@/lib/engine/nadi/yogas'

export const NADI_MARRIAGE_RULE_NOTE =
  'Three checks are read together: Mars with Saturn, the Upapada and the 2nd from it, and a score under 25 in the 7th or the 8th. One or two are delay or trouble. All three are the stronger separation reading. Yogas and transits stay on the lagna and Navamsha. The Moon chart is kept for dasha.'

const MALEFIC: readonly ClassicalGrahaId[] = ['Su', 'Ma', 'Ra', 'Ke', 'Sa']
const BENEFIC: readonly ClassicalGrahaId[] = ['Ju', 'Ve', 'Me', 'Mo']
const UPACHAYA = new Set<HouseNumber>([3, 6, 10, 11])
const AGES: readonly { age: number; id: ClassicalGrahaId }[] = [
  { age: 25, id: 'Su' },
  { age: 30, id: 'Ra' },
  { age: 32, id: 'Ma' },
  { age: 37, id: 'Ju' },
]

type Placement = NadiYogaPlacement

export interface ChartLectureReading {
  marriage: string[]
  afflicted: string[]
  years: string[]
  wealth: string[]
}

export function readChartLectures(input: {
  ascRashi: Rashi
  grahas: readonly Placement[]
  sav?: readonly number[]
  upapada?: Rashi
  runningYear?: number
}): ChartLectureReading {
  return {
    marriage: marriageNotes(input),
    afflicted: afflictedNotes(input),
    years: [...activationNotes(input), ...rashiAgeNotes(input), ...savJumpNotes(input)],
    wealth: wealthNotes(input),
  }
}

function marriageNotes(input: {
  ascRashi: Rashi
  grahas: readonly Placement[]
  sav?: readonly number[]
  upapada?: Rashi
}): string[] {
  const lines: string[] = []
  const rules: string[] = []
  const marsSaturn = marsSaturnLink(input.grahas)
  if (marsSaturn) {
    rules.push('Mars and Saturn')
    const axis = onMarriageAxis(input.ascRashi, input.grahas, ['Ma', 'Sa'])
    lines.push(`Mars and Saturn ${marsSaturn}.${axis} Trouble in marriage is checked.`)
  }
  if (input.upapada && upapadaTouched(input.upapada, input.grahas, lines)) rules.push('the Upapada')
  if (lowSav(input)) {
    rules.push('a low score')
    lines.push('The 7th or the 8th scores under 25. Separation or discord in marriage is checked.')
  }
  if (rules.length === 3) {
    lines.push('All three marriage rules are present. Separation is the strong reading.')
  } else if (rules.length > 0) {
    lines.push('Not all three marriage rules are present. Delay or trouble in marriage is checked.')
  }

  const rahu = input.grahas.find((g) => g.id === 'Ra')
  const ketu = input.grahas.find((g) => g.id === 'Ke')
  if (
    (rahu && [1, 7].includes(wholeSignHouseFromLagna(input.ascRashi, rahu.rashi)))
    || (ketu && [1, 7].includes(wholeSignHouseFromLagna(input.ascRashi, ketu.rashi)))
  ) {
    const seventh = rashiForHouseFromLagna(input.ascRashi, 7)
    const jupiter = input.grahas.find((g) => g.id === 'Ju')
    const lighter = jupiter && (jupiter.rashi === seventh || nadiAspectsSign(jupiter.rashi, 'Ju', seventh))
      ? ' Jupiter reaches the 7th, so the trouble is read more lightly.'
      : ''
    lines.push(`Rahu or Ketu is on the lagna and the 7th. Trouble in marriage is checked.${lighter}`)
  }

  const venus = input.grahas.find((g) => g.id === 'Ve')
  if (venus && saturnAspects(input.grahas, venus.rashi) && (conjunct(input.grahas, 'Ve', 'Ma') || conjunct(input.grahas, 'Ve', 'Ra'))) {
    lines.push('Venus is with Mars or Rahu, and Saturn aspects it. The marriage is read as under heavy pressure.')
  }
  if (venus && wholeSignHouseFromLagna(input.ascRashi, venus.rashi) === 12 && dignityOf(venus) !== 'debilitated') {
    lines.push('Venus in the 12th is read as auspicious.')
  }
  return lines
}

function marsSaturnLink(grahas: readonly Placement[]): string | null {
  const mars = grahas.find((g) => g.id === 'Ma')
  const saturn = grahas.find((g) => g.id === 'Sa')
  if (!mars || !saturn) return null
  if (nadiConjunct(grahas, ['Ma', 'Sa'])) return 'are together'
  if (nadiAspectsSign(mars.rashi, 'Ma', saturn.rashi) && nadiAspectsSign(saturn.rashi, 'Sa', mars.rashi)) return 'aspect each other'
  if (houseCountedFrom(mars.rashi, 2) === saturn.rashi || houseCountedFrom(mars.rashi, 12) === saturn.rashi) {
    return 'sit in the 2nd and the 12th from each other'
  }
  return null
}

function upapadaTouched(ul: Rashi, grahas: readonly Placement[], lines: string[]): boolean {
  const second = houseCountedFrom(ul, 2)
  const malefic = [...hitsOn(ul, grahas, MALEFIC), ...hitsOn(second, grahas, MALEFIC)]
  if (malefic.length === 0) return false
  const benefic = [...hitsOn(ul, grahas, BENEFIC), ...hitsOn(second, grahas, BENEFIC)]
  const light = benefic.length > malefic.length ? ' Benefics on these signs outnumber the malefics, so the trouble is read more lightly.' : ''
  lines.push(`A malefic reaches the Upapada (${RASHI_NAMES[ul]}) or the 2nd from it. Trouble in marriage is checked.${light}`)
  return true
}

function hitsOn(sign: Rashi, grahas: readonly Placement[], ids: readonly ClassicalGrahaId[]): ClassicalGrahaId[] {
  return ids.filter((id) => {
    const planet = grahas.find((g) => g.id === id)
    if (!planet) return false
    return planet.rashi === sign || getRashiDrishti(planet.rashi).includes(sign)
  })
}

function lowSav(input: { ascRashi: Rashi; sav?: readonly number[] }): boolean {
  const sav = input.sav
  if (!sav || sav.length < 12) return false
  return [7, 8].some((house) => {
    const sign = rashiForHouseFromLagna(input.ascRashi, house as HouseNumber)
    const score = sav[sign - 1]
    return typeof score === 'number' && score < 25
  })
}

function afflictedNotes(input: { ascRashi: Rashi; grahas: readonly Placement[] }): string[] {
  let best = 0
  const winners: { house: HouseNumber; score: number }[] = []
  for (let house = 1; house <= 12; house += 1) {
    const score = afflictionScore(input, house as HouseNumber)
    if (score < 2 || score < best) continue
    if (score > best) winners.length = 0
    best = score
    winners.push({ house: house as HouseNumber, score })
  }
  return winners.map(({ house }) => {
    const profile = NADI_HOUSES[house]
    const people = profile.relatives.slice(0, 2).join(' and ').toLowerCase()
    const body = house === 3 ? 'both arms and the hands' : profile.bodyParts.slice(0, 2).join(' and ').toLowerCase()
    const matter = people.length > 0 ? `${people}, and ${body}, are checked.` : `${body} are checked.`
    const checked = matter.charAt(0).toUpperCase() + matter.slice(1)
    const sign = rashiForHouseFromLagna(input.ascRashi, house)
    const benefic = input.grahas.some((g) => BENEFIC.includes(g.id) && g.rashi === sign)
    const softer = benefic ? ' A benefic is also there, so the severity is read as lower.' : ''
    return `The ${ordinal(house)} is the most afflicted house. ${checked}${softer} The ${ordinal(house)} year, and every 12 years after it, is when this house is read.`
  })
}

function afflictionScore(input: { ascRashi: Rashi; grahas: readonly Placement[] }, house: HouseNumber): number {
  const sign = rashiForHouseFromLagna(input.ascRashi, house)
  const placed = MALEFIC.filter((id) => input.grahas.some((g) => g.id === id && g.rashi === sign))
  const aspecting = MALEFIC.filter((id) => {
    const planet = input.grahas.find((g) => g.id === id)
    return planet != null && planet.rashi !== sign && nadiAspectsSign(planet.rashi, id, sign)
  })
  if (UPACHAYA.has(house)) {
    const seventh = signLord(rashiForHouseFromLagna(input.ascRashi, 7))
    const lord = input.grahas.find((g) => g.id === seventh)
    if (!lord || wholeSignHouseFromLagna(input.ascRashi, lord.rashi) !== house || aspecting.length < 2) return 0
    return aspecting.length
  }
  return placed.length + aspecting.length
}

function activationNotes(input: { ascRashi: Rashi; grahas: readonly Placement[]; runningYear?: number }): string[] {
  const lines: string[] = []
  for (const row of AGES) {
    const planet = input.grahas.find((g) => g.id === row.id)
    if (!planet) continue
    const house = wholeSignHouseFromLagna(input.ascRashi, planet.rashi)
    const themes = NADI_HOUSES[house].significances
      .filter((line) => !/death|die|passed/i.test(line))
      .slice(0, 2)
      .join(' and ')
      .toLowerCase()
    let line = `In the ${ordinal(row.age)} year, ${GRAHA_NAMES[row.id]} activates the ${ordinal(house)}, read for ${themes}.`
    if (input.runningYear === row.age) line += ' That year is the one now running.'
    if (row.id === 'Ju' && (house === 5 || house === 9)) {
      line += ' Childbirth is read from the 5th and the 9th together.'
      const fifth = rashiForHouseFromLagna(input.ascRashi, 5)
      if (fifth % 2 === 0) line += ' The 5th sign is even, so a daughter is the form read.'
    }
    lines.push(line)
  }
  return lines
}

function savJumpNotes(input: { ascRashi: Rashi; sav?: readonly number[] }): string[] {
  const sav = input.sav
  if (!sav || sav.length < 12) return []
  let best = 0
  const pairs: { low: HouseNumber; high: HouseNumber }[] = []
  for (let house = 1; house <= 12; house += 1) {
    const next = (house === 12 ? 1 : house + 1) as HouseNumber
    const left = sav[rashiForHouseFromLagna(input.ascRashi, house as HouseNumber) - 1]
    const right = sav[rashiForHouseFromLagna(input.ascRashi, next) - 1]
    if (typeof left !== 'number' || typeof right !== 'number') continue
    const jump = Math.abs(left - right)
    if (jump === 0 || jump < best) continue
    if (jump > best) {
      best = jump
      pairs.length = 0
    }
    const low = left <= right ? house as HouseNumber : next
    const high = low === house ? next : house as HouseNumber
    pairs.push({ low, high })
  }
  return pairs.map((pair) => `The largest score jump is between the ${ordinal(pair.low)} and the ${ordinal(pair.high)}. The ${ordinal(pair.low)} year, and every 12 years after it, is read as transformative.`)
}

function wealthNotes(input: { grahas: readonly Placement[] }): string[] {
  if (!nadiConjunct(input.grahas, ['Mo', 'Ma'])) return []
  return ['The Moon and Mars are together. Wealth is read from that.']
}

function onMarriageAxis(asc: Rashi, grahas: readonly Placement[], ids: readonly ClassicalGrahaId[]): string {
  const hit = ids.some((id) => {
    const planet = grahas.find((g) => g.id === id)
    if (!planet) return false
    const house = wholeSignHouseFromLagna(asc, planet.rashi)
    return house === 1 || house === 7
  })
  return hit ? ' They sit on the lagna or the 7th.' : ''
}

function saturnAspects(grahas: readonly Placement[], sign: Rashi): boolean {
  const saturn = grahas.find((g) => g.id === 'Sa')
  return saturn != null && saturn.rashi !== sign && nadiAspectsSign(saturn.rashi, 'Sa', sign)
}

function conjunct(grahas: readonly Placement[], a: ClassicalGrahaId, b: ClassicalGrahaId): boolean {
  return nadiConjunct(grahas, [a, b]) != null
}

function dignityOf(planet: Placement): string {
  if (planet.dignity) return planet.dignity
  return getDignity(planet.id, planet.rashi, planet.degree ?? 15)
}

function signLord(sign: Rashi): ClassicalGrahaId {
  const lords: Record<number, ClassicalGrahaId> = {
    1: 'Ma', 2: 'Ve', 3: 'Me', 4: 'Mo', 5: 'Su', 6: 'Me',
    7: 'Ve', 8: 'Ma', 9: 'Ju', 10: 'Sa', 11: 'Sa', 12: 'Ju',
  }
  return lords[sign] ?? 'Su'
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
