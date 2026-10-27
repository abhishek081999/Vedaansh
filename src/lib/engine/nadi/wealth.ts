// ─────────────────────────────────────────────────────────────
//  src/lib/engine/nadi/wealth.ts
//  Timing a gain from the natal chart: the degree and the
//  Navamsha sign of the 2nd, 9th, and 11th lords, and the
//  Ashtakavarga score of the 9th arudha as an age.
//  Jupiter’s present sign is not calculated here.
// ─────────────────────────────────────────────────────────────

import { GRAHA_NAMES, NAKSHATRA_NAMES, RASHI_NAMES, type Rashi } from '@/types/astrology'
import {
  RASHI_LORDS,
  wholeSignHouseFromLagna,
  type ClassicalGrahaId,
  type HouseNumber,
} from '@/lib/engine/houseInterpretations'
import { rashiForHouseFromLagna } from '@/lib/engine/rashiInterpretations'
import { getDignity } from '@/lib/engine/dignity'

export const NADI_WEALTH_TIMING_NOTE =
  'Wealth is read from the 2nd, the 9th, and the 11th. The Navamsha sign of those lords is the wealth year, and the same sign weighs more than a trine to it. Jupiter on the lord’s degree is the peak. An aspect is not. It applies when the person is of an age to earn. The size of the gain is not read. The period of a vargottama planet, a strong 9th lord, or an exchanging planet is also a money period. The Sun and Saturn exchange is the one that is not. Jupiter on the Bhrigu Bindu, and Jupiter in the wealth nakshatra, are further years.'

export interface WealthTimingInput {
  ascRashi: Rashi
  grahas: readonly { id: ClassicalGrahaId; rashi: Rashi; degree?: number; dignity?: string }[]
  navamsha?: Partial<Record<ClassicalGrahaId, Rashi>>
  /** Sarvashtakavarga bindus, index 0 = Aries. */
  sav?: readonly number[]
  /** Sign of the 9th arudha. The exception-corrected pada when the chart has one. */
  ninthArudha?: Rashi
  /** Bhrigu year house now running, for the high and low scores. */
  runningHouse?: HouseNumber
  arudhaLagna?: Rashi
  dashaLords?: readonly ClassicalGrahaId[]
  parivartana?: readonly { a: HouseNumber; b: HouseNumber }[]
  /** Sidereal longitude of the Bhrigu Bindu, when the chart has one. */
  bhriguBindu?: number
  moonNakshatra?: number
  nakshatras?: Partial<Record<ClassicalGrahaId, number>>
}

export function wealthTimingNotes(input: WealthTimingInput): string[] {
  const lines: string[] = []
  lines.push(...lordLines(input, [2, 9, 11], 'gain'))
  lines.push(...lordLines(input, [10], 'work'))
  lines.push(...navamshaLines(input))
  lines.push(...binduLines(input))
  if (input.arudhaLagna != null && wholeSignHouseFromLagna(input.ascRashi, input.arudhaLagna) === 7) {
    lines.push('The arudha lagna falls in the 7th. Marriage and the spouse are read as supported.')
  }
  lines.push(...periodLines(input))
  lines.push(...binduFortune(input))
  lines.push(...sampatLine(input))
  return lines
}

function lordLines(input: WealthTimingInput, houses: HouseNumber[], kind: 'gain' | 'work'): string[] {
  const byLord = new Map<ClassicalGrahaId, HouseNumber[]>()
  for (const house of houses) {
    const lord = lordOf(input.ascRashi, house)
    const list = byLord.get(lord) ?? []
    list.push(house)
    byLord.set(lord, list)
  }
  const lines: string[] = []
  for (const [lord, ruled] of byLord) {
    const planet = input.grahas.find((g) => g.id === lord)
    if (!planet) continue
    const name = GRAHA_NAMES[lord]
    const place = `${name} rules ${houseList(ruled)} and sits in ${RASHI_NAMES[planet.rashi]}`
    const deg = wholeDegree(planet.degree)
    if (kind === 'work') {
      lines.push(deg == null
        ? `${place}. Jupiter on that planet is read as work.`
        : `${place} at ${deg}°. Jupiter on ${deg}° is read as work.`)
      continue
    }
    const year = `The year Jupiter is in ${RASHI_NAMES[planet.rashi]} is read as a gain.`
    lines.push(deg == null
      ? `${place}. ${year}`
      : `${place} at ${deg}°. ${year} The peak is the day Jupiter reaches ${deg}° in any sign.`)
  }
  return lines
}

function navamshaLines(input: WealthTimingInput): string[] {
  if (!input.navamsha) return []
  const bySign = new Map<Rashi, HouseNumber[]>()
  for (const house of [2, 9, 11] as const) {
    const sign = input.navamsha[lordOf(input.ascRashi, house)]
    if (sign == null) continue
    const list = bySign.get(sign) ?? []
    if (!list.includes(house)) list.push(house)
    bySign.set(sign, list)
  }
  const lines: string[] = []
  for (const [sign, houses] of bySign) {
    lines.push(`Jupiter in ${RASHI_NAMES[sign]}, the Navamsha of ${lordList(houses)}, is a wealth year.`)
  }
  return lines
}

function binduLines(input: WealthTimingInput): string[] {
  const sav = input.sav
  if (!sav || sav.length !== 12) return []
  const lines: string[] = []
  if (input.ninthArudha != null) {
    const house = wholeSignHouseFromLagna(input.ascRashi, input.ninthArudha)
    const score = Math.round(sav[input.ninthArudha - 1] ?? 0)
    lines.push(`The arudha of the 9th falls in the ${ordinal(house)}. Its score is ${score}, read as a strong year at age ${score}. This score is given more weight than the other wealth houses.`)
  }
  const scored = ([2, 9, 11] as const).map((house) => {
    const sign = rashiForHouseFromLagna(input.ascRashi, house)
    return `the ${ordinal(house)} scores ${Math.round(sav[sign - 1] ?? 0)}`
  })
  lines.push(`${capitalize(scored[0]!)}, ${scored[1]}, and ${scored[2]}. Each score is an age to watch for wealth.`)
  const houses = ([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] as const).map((house) => {
    const sign = rashiForHouseFromLagna(input.ascRashi, house)
    return { house, score: Math.round(sav[sign - 1] ?? 0) }
  })
  const max = Math.max(...houses.map((row) => row.score))
  const min = Math.min(...houses.map((row) => row.score))
  const highest = houses.filter((row) => row.score === max)
  const lowest = houses.filter((row) => row.score === min)
  if (highest.length === 1 && highest[0]!.house === 11) {
    const tenth = houses.find((row) => row.house === 10)
    let line = 'The 11th holds the highest score, the house of gains. This is a lucky placement.'
    if (tenth && tenth.score < highest[0]!.score) {
      line += ' The 10th sits lower, so the gains are read as coming without matching labour.'
    }
    lines.push(line)
  } else if (highest.length === 1 && highest[0]!.house === 8) {
    lines.push('The highest score falls in the 8th. Occult study, wealthy in-laws, and an inheritance are the forms read.')
  } else if (highest.length === 1 && (highest[0]!.house === 2 || highest[0]!.house === 9 || highest[0]!.house === 10)) {
    const house = highest[0]!.house
    const theme = house === 2 ? 'Wealth is read as strong.' : house === 9 ? 'Fortune is read as strong, including travel abroad.' : 'Career is read as strong, including a steady post.'
    lines.push(`The ${ordinal(house)} holds the highest score. ${theme} This is a lucky placement.`)
  } else if (highest.length === 1 && (highest[0]!.house === 6 || highest[0]!.house === 12)) {
    lines.push(`The highest score falls in the ${ordinal(highest[0]!.house)}. A high score there is not read as a benefit.`)
  } else if (highest.length === 1) {
    lines.push(`The ${ordinal(highest[0]!.house)} holds the highest score. That house is read as strong.`)
  }
  if (lowest.length === 1 && lowest[0]!.house === 5) {
    lines.push('The 5th holds the lowest score. Education and children are the strained part.')
  } else if (lowest.length === 1 && lowest[0]!.house === 1) {
    lines.push('The lagna holds the lowest score. The native’s health is the strained part.')
  } else if (lowest.length === 1 && lowest[0]!.house === 7) {
    lines.push('The 7th holds the lowest score. Marriage and the body of that house are the strained part.')
  } else if (lowest.length === 1 && lowest[0]!.house === 11) {
    lines.push('The 11th holds the lowest score. The labour stays, and the gains are read as thin.')
  } else if (lowest.length === 1 && (lowest[0]!.house === 6 || lowest[0]!.house === 12)) {
    lines.push(`The lowest score falls in the ${ordinal(lowest[0]!.house)}. A low score there is read as less trouble from that house.`)
  } else if (lowest.length === 1) {
    lines.push(`The ${ordinal(lowest[0]!.house)} holds the lowest score. That house’s matters are the strained part.`)
  }
  if (lowest.length === 1) {
    const house = lowest[0]!.house
    const next = (house === 12 ? 1 : house + 1) as HouseNumber
    const nextScore = houses.find((row) => row.house === next)?.score ?? 0
    if (nextScore > lowest[0]!.score) {
      lines.push(`The ${ordinal(next)} scores higher than the ${ordinal(house)}. The years those two houses run are read as a turning point.`)
    }
  }
  if (input.runningHouse != null && highest.length === 1 && input.runningHouse === highest[0]!.house) {
    lines.push(`The running year activates the ${ordinal(input.runningHouse)}, the highest score. That year is read as strong.`)
  }
  if (input.runningHouse != null && lowest.length === 1 && input.runningHouse === lowest[0]!.house) {
    lines.push(`The running year activates the ${ordinal(input.runningHouse)}, the lowest score. That year is read as difficult.`)
  }
  return lines
}

function periodLines(input: WealthTimingInput): string[] {
  const lords = (input.dashaLords ?? []).slice(0, 3)
  if (lords.length === 0) return []
  const lines: string[] = []
  const vargottama = lords.filter((id) => {
    const planet = input.grahas.find((g) => g.id === id)
    return planet != null && input.navamsha?.[id] === planet.rashi
  })
  if (vargottama.length > 0) {
    const names = joinList(vargottama.map((id) => GRAHA_NAMES[id]))
    lines.push(`${names} ${vargottama.length === 1 ? 'is' : 'are'} vargottama and in the running period. That period is read as a strong money period.`)
  }
  const ninth = lordOf(input.ascRashi, 9)
  if (lords.includes(ninth)) {
    const planet = input.grahas.find((g) => g.id === ninth)
    const dusthana = ([6, 8, 12] as const).some((house) => lordOf(input.ascRashi, house) === ninth)
    const dignity = planet ? planet.dignity ?? getDignity(planet.id, planet.rashi, planet.degree ?? 15) : null
    const strong = dignity === 'exalted' || dignity === 'own' || dignity === 'moolatrikona'
    if (strong && !dusthana) {
      lines.push(`${GRAHA_NAMES[ninth]} rules the 9th and is strong. This period is read for money, luck, and travel.`)
    } else if (dusthana) {
      lines.push(`${GRAHA_NAMES[ninth]} rules the 9th and also a dusthana. A gain is checked together with strain on health or the family.`)
    }
  }
  const pressured = new Set<ClassicalGrahaId>()
  const supportive = new Set<ClassicalGrahaId>()
  for (const pair of input.parivartana ?? []) {
    const pairLords = [lordOf(input.ascRashi, pair.a), lordOf(input.ascRashi, pair.b)]
    const target = pairLords.includes('Su') && pairLords.includes('Sa') ? pressured : supportive
    for (const id of pairLords) target.add(id)
  }
  const running = new Set(lords)
  if ([...running].some((id) => pressured.has(id))) {
    lines.push('A lord of the Sun and Saturn exchange is in the running period. That period is not read as a money period.')
  } else if ([...running].some((id) => supportive.has(id))) {
    lines.push('A lord of the exchange is in the running period. That period is read as a strong money period.')
  }
  return lines
}

function binduFortune(input: WealthTimingInput): string[] {
  if (input.bhriguBindu == null || !Number.isFinite(input.bhriguBindu)) return []
  const sign = (Math.floor((((input.bhriguBindu % 360) + 360) % 360) / 30) + 1) as Rashi
  return [`The Bhrigu Bindu falls in ${RASHI_NAMES[sign]}. The year Jupiter is in that sign is read as fortune. A trine of that sign is the lighter form.`]
}

function sampatLine(input: WealthTimingInput): string[] {
  const moon = input.moonNakshatra
  if (moon == null || moon < 0 || moon > 26) return []
  const sampat = (moon + 1) % 27
  const name = NAKSHATRA_NAMES[sampat] ?? 'that nakshatra'
  const sitting = (['Su', 'Mo', 'Ma', 'Me', 'Ju', 'Ve', 'Sa', 'Ra', 'Ke'] as const)
    .filter((id) => input.nakshatras?.[id] === sampat)
  const who = sitting.length > 0
    ? ` ${joinList(sitting.map((id) => GRAHA_NAMES[id]))} ${sitting.length === 1 ? 'sits' : 'sit'} there, so that period is read as a money period.`
    : ''
  return [`The wealth nakshatra is ${name}.${who} Jupiter in that nakshatra, or the 9th or the 18th from it, is a money window.`]
}

function lordOf(asc: Rashi, house: HouseNumber): ClassicalGrahaId {
  const sign = rashiForHouseFromLagna(asc, house)
  return RASHI_LORDS.find((row) => row.number === sign)?.lord ?? 'Su'
}

function wholeDegree(degree: number | undefined): number | null {
  if (degree == null || !Number.isFinite(degree)) return null
  return Math.floor(degree)
}

function houseList(houses: readonly HouseNumber[]): string {
  const names = houses.map((house) => `the ${ordinal(house)}`)
  return joinList(names)
}

function lordList(houses: readonly HouseNumber[]): string {
  return joinList(houses.map((house) => `the ${ordinal(house)} lord`))
}

function joinList(names: string[]): string {
  if (names.length <= 1) return names[0] ?? ''
  if (names.length === 2) return `${names[0]} and ${names[1]}`
  return `${names.slice(0, -1).join(', ')}, and ${names[names.length - 1]}`
}

function ordinal(n: number): string {
  const mod = n % 10
  if (mod === 1 && n !== 11) return `${n}st`
  if (mod === 2 && n !== 12) return `${n}nd`
  if (mod === 3 && n !== 13) return `${n}rd`
  return `${n}th`
}

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1)
}
