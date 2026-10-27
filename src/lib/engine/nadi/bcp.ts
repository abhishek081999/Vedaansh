// ─────────────────────────────────────────────────────────────
//  src/lib/engine/nadi/bcp.ts
//  Bhrigu Chakra Paddhati for the running year.
//  Year 1 is the 1st house. The count repeats every 12 years.
//  The running year is completed years plus one.
//  A planet's degree in that house marks a date in the birthday year.
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
import { NADI_HOUSES } from '@/lib/engine/nadi/houses'
import type { NadiYogaPlacement } from '@/lib/engine/nadi/yogas'

const DUSTHANA = new Set<HouseNumber>([6, 8, 12])

export interface BcpReading {
  runningYear: number
  house: HouseNumber
  houseName: string
  lines: string[]
}

export interface BcpInput {
  ascRashi: Rashi
  grahas: readonly NadiYogaPlacement[]
  parivartana?: readonly { a: HouseNumber; b: HouseNumber }[]
  birthDate?: string
  asOf?: Date
}

export function bcpHouse(runningYear: number): HouseNumber {
  const year = Math.max(1, Math.floor(runningYear))
  return (((year - 1) % 12) + 1) as HouseNumber
}

export function readBcp(input: BcpInput): BcpReading | null {
  if (!input.birthDate) return null
  const completed = completedYears(input.birthDate, input.asOf ?? new Date())
  if (completed == null) return null
  const runningYear = completed + 1
  const house = bcpHouse(runningYear)
  const profile = NADI_HOUSES[house]
  const sign = rashiForHouseFromLagna(input.ascRashi, house)
  const occupants = input.grahas.filter((g) => wholeSignHouseFromLagna(input.ascRashi, g.rashi) === house)
  const lord = lordOf(input.ascRashi, house)
  const lordPlanet = input.grahas.find((g) => g.id === lord)
  const lordHouse = lordPlanet ? wholeSignHouseFromLagna(input.ascRashi, lordPlanet.rashi) : null
  const themes = profile.significances
    .filter((line) => !/death|die|passed/i.test(line))
    .slice(0, 3)
    .join(', ')
    .toLowerCase()

  const lines = [
    `The ${ordinal(runningYear)} running year activates the ${ordinal(house)} (${profile.name}). The same house runs every 12 years.`,
  ]
  if (runningYear > 12) lines.push(`It also ran in the ${ordinal(runningYear - 12)} year.`)
  lines.push(`It next runs in the ${ordinal(runningYear + 12)} year.`)
  lines.push(`This house is read for ${themes}.`)

  if (occupants.length === 0) {
    lines.push('No planet sits in this house.')
  } else {
    lines.push(`${occupants.map((g) => GRAHA_NAMES[g.id]).join(', ')} ${occupants.length === 1 ? 'sits' : 'sit'} here.`)
    if (occupants.length >= 3) lines.push('Three or more planets sit here, so the year’s events gather in this house.')
  }

  if (occupants.some((g) => g.id === 'Ra')) {
    lines.push('Rahu here: a sudden turn, a loss, a court matter, or a change of place or work.')
  }
  if (occupants.some((g) => g.id === 'Ke')) {
    lines.push('Ketu here: a cut, an injury, or a surgery, and a break in a relationship. A change of place is also checked.')
  }
  for (const g of occupants) {
    if (placedDignity(g) === 'exalted') {
      lines.push(`${GRAHA_NAMES[g.id]} is exalted here, so the year is read as strong.`)
    }
  }

  if (house === 6) {
    lines.push('A court matter, illness, enemies, a hospital, and heavy expense are checked.')
  }
  const seventhLord = lordOf(input.ascRashi, 7)
  if (house === 7 || occupants.some((g) => g.id === 'Ve' || g.id === seventhLord)) {
    lines.push('Marriage, a relationship, a vehicle, or jewelry is checked.')
  }
  if (sign === 8) lines.push('The sign is Scorpio, so tantra is also checked.')

  if (lordPlanet && lordHouse) {
    let lordLine = `Its lord ${GRAHA_NAMES[lord]} sits in the ${ordinal(lordHouse)}.`
    const dignity = placedDignity(lordPlanet)
    if (dignity === 'exalted') lordLine += ' The lord is exalted, so the year is read as strong.'
    if (dignity === 'debilitated') lordLine += ' The lord is debilitated, so the year is read as strained.'
    lines.push(lordLine)
  }

  const dusthanaLordHere = ([6, 8, 12] as const).some((h) => occupants.some((g) => g.id === lordOf(input.ascRashi, h)))
  if ((lordHouse != null && DUSTHANA.has(lordHouse)) || dusthanaLordHere) {
    lines.push('The lord meets the 6th, 8th, or 12th. An accident, an illness, or a heavy loss is checked.')
  }
  if (input.parivartana?.some((pair) => pair.a === house || pair.b === house)) {
    lines.push('An exchange touches this house, so its result is stronger this year.')
  }
  lines.push(...bcpDateLines({
    birthDate: input.birthDate,
    runningYear,
    occupants,
    lord: lordPlanet ?? null,
  }))

  return { runningYear, house, houseName: profile.name, lines }
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
] as const

interface Ymd {
  y: number
  m: number
  d: number
}

/** Degree 0 is the birthday. A degree near 30 falls near the next birthday. */
export function bcpDegreeDate(birthDate: string, runningYear: number, degree: number): string | null {
  if (!Number.isInteger(runningYear) || runningYear < 1) return null
  if (!Number.isFinite(degree) || degree < 0 || degree >= 30) return null
  const birth = parseYmd(birthDate)
  if (!birth) return null
  const start = addYears(birth, runningYear - 1)
  const end = addYears(birth, runningYear)
  const span = daysBetween(start, end)
  if (span <= 0) return null
  let offset = Math.round((degree / 30) * span)
  if (offset < 0) offset = 0
  if (offset >= span) offset = span - 1
  return formatYmd(addDays(start, offset))
}

export function bcpDateLines(input: {
  birthDate?: string
  runningYear: number
  occupants: readonly NadiYogaPlacement[]
  lord: NadiYogaPlacement | null
}): string[] {
  if (!input.birthDate) return []
  const lines: string[] = []
  const seen = new Set<ClassicalGrahaId>()
  for (const planet of input.occupants) {
    const date = planet.degree == null
      ? null
      : bcpDegreeDate(input.birthDate, input.runningYear, planet.degree)
    if (!date) continue
    seen.add(planet.id)
    lines.push(`${GRAHA_NAMES[planet.id]} at ${shownDegree(planet.degree!)}° in this house is read around ${date}.`)
  }
  const lord = input.lord
  if (lord && !seen.has(lord.id) && lord.degree != null) {
    const date = bcpDegreeDate(input.birthDate, input.runningYear, lord.degree)
    if (date) lines.push(`Its lord ${GRAHA_NAMES[lord.id]} at ${shownDegree(lord.degree)}° is read around ${date}.`)
  }
  return lines
}

function parseYmd(value: string): Ymd | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value.trim())
  if (!match) return null
  const y = Number(match[1])
  const m = Number(match[2])
  const d = Number(match[3])
  if (m < 1 || m > 12 || d < 1 || d > daysInMonth(y, m)) return null
  return { y, m, d }
}

function isLeap(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0
}

function daysInMonth(year: number, month: number): number {
  const lengths = [31, isLeap(year) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]
  return lengths[month - 1] ?? 30
}

function addYears(date: Ymd, years: number): Ymd {
  const y = date.y + years
  const d = Math.min(date.d, daysInMonth(y, date.m))
  return { y, m: date.m, d }
}

function daysBetween(start: Ymd, end: Ymd): number {
  return Math.round((utc(end) - utc(start)) / 86400000)
}

function addDays(start: Ymd, days: number): Ymd {
  const date = new Date(utc(start) + days * 86400000)
  return { y: date.getUTCFullYear(), m: date.getUTCMonth() + 1, d: date.getUTCDate() }
}

function utc(date: Ymd): number {
  return Date.UTC(date.y, date.m - 1, date.d)
}

function formatYmd(date: Ymd): string {
  return `${date.d} ${MONTHS[date.m - 1]} ${date.y}`
}

function shownDegree(degree: number): string {
  const rounded = Math.round(degree * 100) / 100
  return Number.isInteger(rounded) ? `${rounded}` : `${rounded}`
}

function completedYears(birthDate: string, asOf: Date): number | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(birthDate.trim())
  if (!match) return null
  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  if (month < 1 || month > 12 || day < 1 || day > 31) return null
  let age = asOf.getFullYear() - year
  const monthDiff = asOf.getMonth() + 1 - month
  if (monthDiff < 0 || (monthDiff === 0 && asOf.getDate() < day)) age -= 1
  if (age < 0) return null
  return age
}

function lordOf(asc: Rashi, house: HouseNumber): ClassicalGrahaId {
  const sign = rashiForHouseFromLagna(asc, house)
  return RASHI_LORDS.find((row) => row.number === sign)?.lord ?? 'Su'
}

function placedDignity(g: NadiYogaPlacement): string {
  if (g.dignity) return g.dignity
  return getDignity(g.id, g.rashi, g.degree ?? 15)
}

function ordinal(n: number): string {
  const mod = n % 10
  if (mod === 1 && n !== 11) return `${n}st`
  if (mod === 2 && n !== 12) return `${n}nd`
  if (mod === 3 && n !== 13) return `${n}rd`
  return `${n}th`
}
