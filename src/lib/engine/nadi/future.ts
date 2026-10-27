// ─────────────────────────────────────────────────────────────
//  src/lib/engine/nadi/future.ts
//  Coming years and coming Vimshottari periods.
//  Each year stacks the year-count with the ages, degrees,
//  and scores that already land on it. A period ahead uses
//  the same career, money, marriage, property, and vehicle rules.
//  A planet's degree in the active house marks a date in that year.
// ─────────────────────────────────────────────────────────────

import type { Rashi } from '@/types/astrology'
import { GRAHA_NAMES } from '@/types/astrology'
import { getDignity } from '@/lib/engine/dignity'
import {
  RASHI_LORDS,
  isClassicalGraha,
  wholeSignHouseFromLagna,
  type ClassicalGrahaId,
  type HouseNumber,
} from '@/lib/engine/houseInterpretations'
import { rashiForHouseFromLagna } from '@/lib/engine/rashiInterpretations'
import { bcpDateLines, bcpHouse } from '@/lib/engine/nadi/bcp'
import { NADI_HOUSES } from '@/lib/engine/nadi/houses'
import { khaarabPeriodLine, type NadiYogaPlacement } from '@/lib/engine/nadi/yogas'

export const NADI_FUTURE_NOTE =
  'The coming years stack the year-count with the sign ages, the planet ages, the degree years, and the score years that land on the same year. A Vimshottari period ahead is read with the same career, money, marriage, property, and vehicle rules. A planet’s degree inside the active house marks a date in that birthday year.'

export type NadiFutureTechnique = 'year' | 'sign' | 'planet' | 'degree' | 'score' | 'afflicted' | 'wealth'

export interface NadiDashaNode {
  lord: string
  start: Date | string | number
  end: Date | string | number
  children?: readonly NadiDashaNode[]
}

export interface NadiFutureYear {
  year: number
  calendar: number | null
  now: boolean
  house: HouseNumber
  houseName: string
  techniques: NadiFutureTechnique[]
  lines: string[]
}

export interface NadiFuturePeriod {
  id: string
  title: string
  start: string
  end: string
  now: boolean
  lines: string[]
}

export interface NadiFutureReading {
  note: string
  runningYear: number | null
  years: NadiFutureYear[]
  periods: NadiFuturePeriod[]
  windows: string[]
}

type Varga = { ascRashi: Rashi; grahas: readonly NadiYogaPlacement[] }

export interface NadiFutureInput {
  ascRashi: Rashi
  grahas: readonly NadiYogaPlacement[]
  parivartana?: readonly { a: HouseNumber; b: HouseNumber }[]
  birthDate?: string
  asOf?: Date
  runningYear: number | null
  yearNotes: readonly string[]
  degreeNotes: readonly string[]
  afflictedNotes: readonly string[]
  wealthTiming: readonly string[]
  sav?: readonly number[]
  ninthArudha?: Rashi
  navamsha?: Partial<Record<ClassicalGrahaId, Rashi>>
  navamshaChart?: Varga
  dashamshaChart?: Varga
  chaturthamsha?: Varga
  shodashamsha?: Varga
  moonNakshatra?: number
  nakshatras?: Partial<Record<ClassicalGrahaId, number>>
  dashaNodes?: readonly NadiDashaNode[]
  /** Planets that form a khaarab yoga, used to time a coming period. */
  khaarabPlanets?: readonly ClassicalGrahaId[]
}

const TAG_ORDER: readonly NadiFutureTechnique[] = ['year', 'planet', 'sign', 'degree', 'score', 'afflicted', 'wealth']
const DUSTHANA = new Set<HouseNumber>([6, 8, 12])
const WINDOW = /Jupiter is in|is a wealth year|Bhrigu Bindu|wealth nakshatra|read as a gain|read as work|Jupiter on /

export function readNadiFuture(input: NadiFutureInput): NadiFutureReading {
  const running = input.runningYear
  const born = birthYear(input.birthDate)
  const bucket = new Map<number, { tags: Set<NadiFutureTechnique>; lines: string[] }>()

  const keep = (year: number): boolean => {
    if (!Number.isInteger(year) || year < 0 || year > 96) return false
    if (running == null) return year <= 60
    if (year < running) return false
    return year <= running + 60
  }

  const add = (year: number, tag: NadiFutureTechnique, text: string) => {
    if (!keep(year) || !text) return
    const row = bucket.get(year) ?? { tags: new Set<NadiFutureTechnique>(), lines: [] }
    row.tags.add(tag)
    if (!row.lines.includes(text)) row.lines.push(text)
    bucket.set(year, row)
  }

  for (const line of [...input.yearNotes, ...input.degreeNotes, ...input.afflictedNotes]) {
    const parsed = lineYears(line)
    const years = parsed.repeat ? repeatFrom(parsed.years[0] ?? -1, running) : parsed.years
    const tag = tagOf(line)
    for (const year of years) add(year, tag, line)
  }
  for (const row of wealthAges(input)) add(row.year, 'wealth', row.text)

  if (running != null) {
    for (let step = 0; step < 12; step += 1) bucket.set(running + step, bucket.get(running + step) ?? { tags: new Set(), lines: [] })
  }

  const years = [...bucket.keys()].sort((a, b) => a - b).map((year) => {
    const row = bucket.get(year)!
    const glance = yearCountLines(input, year)
    row.tags.add('year')
    const lines = [...glance.lines, ...row.lines.filter((line) => !glance.lines.includes(line))]
    const techniques = TAG_ORDER.filter((tag) => row.tags.has(tag))
    return {
      year,
      calendar: born == null ? null : born + year,
      now: running === year,
      house: glance.house,
      houseName: glance.houseName,
      techniques,
      lines,
    }
  })

  return {
    note: NADI_FUTURE_NOTE,
    runningYear: running,
    years,
    periods: comingPeriods(input),
    windows: input.wealthTiming.filter((line) => WINDOW.test(line) && !/running period|money period/.test(line)),
  }
}

function yearCountLines(
  input: NadiFutureInput,
  year: number,
): { house: HouseNumber; houseName: string; lines: string[] } {
  const house = bcpHouse(year)
  const profile = NADI_HOUSES[house]
  const sign = rashiForHouseFromLagna(input.ascRashi, house)
  const occupants = input.grahas.filter((g) => wholeSignHouseFromLagna(input.ascRashi, g.rashi) === house)
  const themes = profile.significances
    .filter((line) => !/death|die|passed/i.test(line))
    .slice(0, 3)
    .join(', ')
    .toLowerCase()
  const who = occupants.length === 0
    ? 'No planet sits in this house.'
    : `${joinNames(occupants.map((g) => GRAHA_NAMES[g.id]))} ${occupants.length === 1 ? 'sits' : 'sit'} here.`
  const lines = [
    `The ${ordinal(year)} year activates the ${ordinal(house)} (${profile.name}), read for ${themes}. ${who}`,
  ]
  if (occupants.some((g) => g.id === 'Ra')) {
    lines.push('Rahu here: a sudden turn, a loss, a court matter, or a change of place or work.')
  }
  if (occupants.some((g) => g.id === 'Ke')) {
    lines.push('Ketu here: a cut, an injury, or a surgery, and a break in a relationship. A change of place is also checked.')
  }
  for (const g of occupants) {
    if (g.id !== 'Ra' && g.id !== 'Ke' && placedDignity(g) === 'exalted') {
      lines.push(`${GRAHA_NAMES[g.id]} is exalted here, so the year is read as strong.`)
    }
  }
  if (house === 6) lines.push('A court matter, illness, enemies, a hospital, and heavy expense are checked.')
  const seventhLord = lordOf(input.ascRashi, 7)
  if (house === 7 || occupants.some((g) => g.id === 'Ve' || g.id === seventhLord)) {
    lines.push('Marriage, a relationship, a vehicle, or jewelry is checked.')
  }
  if (sign === 8) lines.push('The sign is Scorpio, so tantra is also checked.')
  const lord = lordOf(input.ascRashi, house)
  const lordPlanet = input.grahas.find((g) => g.id === lord)
  const lordHouse = lordPlanet ? wholeSignHouseFromLagna(input.ascRashi, lordPlanet.rashi) : null
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
    runningYear: year,
    occupants,
    lord: lordPlanet ?? null,
  }))
  return { house, houseName: profile.name, lines }
}

function wealthAges(input: NadiFutureInput): { year: number; text: string }[] {
  const sav = input.sav
  if (!sav || sav.length < 12) return []
  const rows: { year: number; text: string }[] = []
  if (input.ninthArudha != null) {
    const score = Math.round(sav[input.ninthArudha - 1] ?? 0)
    if (score > 0) {
      rows.push({
        year: score,
        text: `The arudha of the 9th scores ${score}. That age is given the most weight for wealth.`,
      })
    }
  }
  for (const house of [2, 9, 11] as const) {
    const sign = rashiForHouseFromLagna(input.ascRashi, house)
    const score = Math.round(sav[sign - 1] ?? 0)
    if (score <= 0) continue
    rows.push({
      year: score,
      text: `The ${ordinal(house)} scores ${score}. That age is watched for wealth.`,
    })
  }
  return rows
}

function comingPeriods(input: NadiFutureInput): NadiFuturePeriod[] {
  const nodes = input.dashaNodes
  if (!nodes || nodes.length === 0) return []
  const now = (input.asOf ?? new Date()).getTime()
  const mahas = nodes.filter((node) => toMs(node.end) > now && isClassicalGraha(node.lord))
  const spans: { maha: ClassicalGrahaId; antar: ClassicalGrahaId | null; start: number; end: number }[] = []
  const pushChildren = (maha: NadiDashaNode, limit: number) => {
    if (!isClassicalGraha(maha.lord)) return
    const children = (maha.children ?? []).filter((node) => toMs(node.end) > now && isClassicalGraha(node.lord)).slice(0, limit)
    if (children.length === 0) {
      spans.push({ maha: maha.lord, antar: null, start: toMs(maha.start), end: toMs(maha.end) })
      return
    }
    for (const child of children) {
      if (!isClassicalGraha(child.lord)) continue
      spans.push({ maha: maha.lord, antar: child.lord, start: toMs(child.start), end: toMs(child.end) })
    }
  }
  if (mahas[0]) pushChildren(mahas[0], 5)
  if (mahas[1]) pushChildren(mahas[1], 3)

  const seenMaha = new Set<ClassicalGrahaId>()
  const periods = spans.slice(0, 8).map((span) => {
    const lords = [span.maha, span.antar].filter((id): id is ClassicalGrahaId => id != null)
    const lines = periodLines(input, lords, !seenMaha.has(span.maha), span.start <= now && now < span.end)
    seenMaha.add(span.maha)
    const antarName = span.antar ? GRAHA_NAMES[span.antar] : null
    return {
      id: `${span.maha}-${span.antar ?? 'maha'}-${span.start}`,
      title: antarName
        ? `${GRAHA_NAMES[span.maha]} mahadasha · ${antarName} antardasha`
        : `${GRAHA_NAMES[span.maha]} mahadasha`,
      start: new Date(span.start).toISOString(),
      end: new Date(span.end).toISOString(),
      now: span.start <= now && now < span.end,
      lines,
    }
  })
  return periods.filter((period, index) => index < 2 || period.lines.length > 0).slice(0, 8)
}

function periodLines(
  input: NadiFutureInput,
  lords: readonly ClassicalGrahaId[],
  includeMahaVarga: boolean,
  open: boolean,
): string[] {
  const lines: string[] = []
  const timed = khaarabPeriodLine(input.khaarabPlanets ?? [], lords, open)
  if (timed) lines.push(timed)
  const antar = lords[1]
  const d9 = input.navamshaChart
  if (antar && d9) {
    const first = signLord(d9.ascRashi)
    const seventh = signLord(rashiForHouseFromLagna(d9.ascRashi, 7))
    const which = antar === first ? '1st' : antar === seventh ? '7th' : null
    if (which) {
      lines.push(`${GRAHA_NAMES[antar]} rules the ${which} of Navamsha. This period is read for marriage or for meeting the partner.`)
    }
  }

  const pressured = new Set<ClassicalGrahaId>()
  const supportive = new Set<ClassicalGrahaId>()
  for (const pair of input.parivartana ?? []) {
    const pairLords = [lordOf(input.ascRashi, pair.a), lordOf(input.ascRashi, pair.b)]
    const target = pairLords.includes('Su') && pairLords.includes('Sa') ? pressured : supportive
    for (const id of pairLords) target.add(id)
  }
  if (lords.some((id) => pressured.has(id))) {
    lines.push('A lord of the Sun and Saturn exchange falls in this period. The career result is read as under pressure.')
    lines.push('This period is not read as a money period.')
  } else if (lords.some((id) => supportive.has(id))) {
    lines.push('A lord of the exchange falls in this period. The career result is read then.')
    lines.push('This period is read as a strong money period.')
  }

  const ninth = lordOf(input.ascRashi, 9)
  if (lords.includes(ninth) && !pressured.has(ninth)) {
    const planet = input.grahas.find((g) => g.id === ninth)
    const dusthana = ([6, 8, 12] as const).some((house) => lordOf(input.ascRashi, house) === ninth)
    const dignity = planet ? placedDignity(planet) : null
    const strong = dignity === 'exalted' || dignity === 'own' || dignity === 'moolatrikona'
    if (strong && !dusthana) lines.push(`${GRAHA_NAMES[ninth]} rules the 9th and is strong. This period is read for money, luck, and travel.`)
    else if (dusthana) lines.push(`${GRAHA_NAMES[ninth]} rules the 9th and also a dusthana. A gain is checked together with strain on health or the family.`)
  }

  const vargottama = lords.filter((id) => {
    const planet = input.grahas.find((g) => g.id === id)
    return planet != null && input.navamsha?.[id] === planet.rashi
  })
  if (vargottama.length > 0) {
    const names = joinNames(vargottama.map((id) => GRAHA_NAMES[id]))
    lines.push(`${names} ${vargottama.length === 1 ? 'is' : 'are'} vargottama. This period is read as a strong money period.`)
  }

  const moon = input.moonNakshatra
  if (moon != null && moon >= 0 && moon <= 26) {
    const sampat = (moon + 1) % 27
    const sitting = lords.filter((id) => input.nakshatras?.[id] === sampat)
    if (sitting.length > 0) {
      const names = joinNames(sitting.map((id) => GRAHA_NAMES[id]))
      lines.push(`${names} ${sitting.length === 1 ? 'sits' : 'sit'} in the wealth nakshatra. This period is read as a money period.`)
    }
  }

  if (lords.includes('Ma')) lines.push('Mars falls in this period. Travel toward the south, or a temple in the south, is checked.')

  const vargaLords = includeMahaVarga || lords.length < 2 ? lords : lords.slice(1)
  for (const id of vargaLords) lines.push(...vargaPeriodLines(input.dashamshaChart, id, 'career'))
  for (const id of vargaLords) lines.push(...vargaPeriodLines(input.chaturthamsha, id, 'property'))
  for (const id of vargaLords) lines.push(...vargaPeriodLines(input.shodashamsha, id, 'vehicle'))

  const sixth = lordOf(input.ascRashi, 6)
  if ((lords.includes('Ra') && lords.includes('Sa')) || lords.includes(sixth)) {
    lines.push('This period is read as a poor time for a major decision, a deal, or a new project.')
  }
  const exchanging = new Set<ClassicalGrahaId>([...pressured, ...supportive])
  if (lords.some((id) => exchanging.has(id))) {
    lines.push('A decision made in this period is read as supported.')
  }
  return [...new Set(lines)]
}

function vargaPeriodLines(chart: Varga | undefined, lord: ClassicalGrahaId, kind: 'career' | 'property' | 'vehicle'): string[] {
  if (!chart) return []
  const lagna = chart.ascRashi
  const name = GRAHA_NAMES[lord]
  if (kind === 'career') {
    const planet = chart.grahas.find((g) => g.id === lord)
    const occupied = planet ? wholeSignHouseFromLagna(lagna, planet.rashi) : null
    const rise: string[] = []
    const fall: string[] = []
    if (lord === signLord(lagna)) rise.push('rules the Dashamsha lagna')
    if (lord === signLord(rashiForHouseFromLagna(lagna, 10))) rise.push('rules the 10th')
    if (occupied === 1) rise.push('sits in the Dashamsha lagna')
    if (occupied === 10) rise.push('sits in the 10th of Dashamsha')
    if (lord === signLord(rashiForHouseFromLagna(lagna, 8))) fall.push('rules the 8th of Dashamsha')
    if (occupied === 8) fall.push('sits in the 8th of Dashamsha')
    const lines: string[] = []
    if (rise.length) lines.push(`${name} ${joinNames(rise)}, so a rise in the career is checked.`)
    if (fall.length) lines.push(`${name} ${joinNames(fall)}, so a loss of work, a transfer, or a break is checked.`)
    return lines
  }
  const lagnaLord = signLord(lagna)
  const fourthLord = signLord(rashiForHouseFromLagna(lagna, 4))
  const karaka: ClassicalGrahaId = kind === 'property' ? 'Ma' : 'Ve'
  const roles: string[] = []
  if (lord === lagnaLord) roles.push(kind === 'property' ? 'rules the Chaturthamsha lagna' : 'rules the Shodashamsha lagna')
  if (lord === fourthLord) roles.push('rules the 4th')
  if (lord === karaka) roles.push(kind === 'property' ? 'is the property significator' : 'is the vehicle significator')
  if (exchangeLords(chart).includes(lord)) roles.push('is in the exchange')
  if (!roles.length) return []
  const onlyExchange = roles.length === 1 && roles[0] === 'is in the exchange'
  const effect = onlyExchange
    ? `so this period is read as supported for ${kind === 'property' ? 'property' : 'a vehicle'}`
    : kind === 'property'
      ? 'so property is checked'
      : 'so a vehicle is checked, including through the parents when the person is not earning'
  return [`${name} ${joinNames(roles)}, ${effect}.`]
}

function exchangeLords(chart: Varga): ClassicalGrahaId[] {
  const lordHouse = (house: HouseNumber): HouseNumber | null => {
    const lord = signLord(rashiForHouseFromLagna(chart.ascRashi, house))
    const planet = chart.grahas.find((g) => g.id === lord)
    return planet ? wholeSignHouseFromLagna(chart.ascRashi, planet.rashi) : null
  }
  const lords: ClassicalGrahaId[] = []
  for (let house = 1; house <= 12; house += 1) {
    const other = lordHouse(house as HouseNumber)
    if (other == null || other === house || house > other) continue
    if (lordHouse(other) !== house) continue
    lords.push(signLord(rashiForHouseFromLagna(chart.ascRashi, house as HouseNumber)), signLord(rashiForHouseFromLagna(chart.ascRashi, other)))
  }
  return lords
}

function lineYears(line: string): { years: number[]; repeat: boolean } {
  if (/year of birth/i.test(line)) {
    const years = [0]
    if (/1st year is also checked/i.test(line)) years.push(1)
    for (const match of line.matchAll(/(\d+)(?:st|nd|rd|th) year/gi)) years.push(Number(match[1]))
    return { years: [...new Set(years)], repeat: false }
  }
  if (/every 12 years/i.test(line)) {
    const match = line.match(/The (\d+)(?:st|nd|rd|th) year, and every 12 years/)
    return { years: match ? [Number(match[1])] : [], repeat: true }
  }
  if (/are both checked/i.test(line)) {
    return { years: [...line.matchAll(/(\d+)(?:st|nd|rd|th) year/gi)].map((match) => Number(match[1])), repeat: false }
  }
  const opened = line.match(/In the (\d+)(?:st|nd|rd|th) year/)
  if (opened) return { years: [Number(opened[1])], repeat: false }
  const read = line.match(/in the (\d+)(?:st|nd|rd|th) year/i)
  if (read) return { years: [Number(read[1])], repeat: false }
  return { years: [], repeat: false }
}

function repeatFrom(base: number, running: number | null): number[] {
  if (base < 0) return []
  let year = base
  const start = running ?? 0
  if (year < start) year += Math.ceil((start - year) / 12) * 12
  const cap = (running ?? 0) + 24
  const years: number[] = []
  while (year <= cap && years.length < 3) {
    years.push(year)
    year += 12
  }
  return years
}

function tagOf(line: string): NadiFutureTechnique {
  if (/activates the/.test(line)) return 'planet'
  if (/are active/.test(line)) return 'sign'
  if (/score jump|transformative/.test(line)) return 'score'
  if (/most afflicted/.test(line)) return 'afflicted'
  if (/°|year of birth|are together/.test(line)) return 'degree'
  return 'year'
}

function placedDignity(g: NadiYogaPlacement): string {
  if (g.dignity) return g.dignity
  if (g.id === 'Ra' || g.id === 'Ke') return 'neutral'
  return getDignity(g.id, g.rashi, g.degree ?? 15)
}

function lordOf(asc: Rashi, house: HouseNumber): ClassicalGrahaId {
  return signLord(rashiForHouseFromLagna(asc, house))
}

function signLord(sign: Rashi): ClassicalGrahaId {
  return RASHI_LORDS.find((row) => row.number === sign)?.lord ?? 'Su'
}

function birthYear(birthDate?: string): number | null {
  const year = Number(birthDate?.slice(0, 4))
  return Number.isInteger(year) && year > 0 ? year : null
}

function toMs(value: Date | string | number): number {
  if (value instanceof Date) return value.getTime()
  if (typeof value === 'number') return value
  return new Date(value).getTime()
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
