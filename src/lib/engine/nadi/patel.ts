// ─────────────────────────────────────────────────────────────
//  src/lib/engine/nadi/patel.ts
//  C.S. Patel’s three natal points: the 22nd drekkana (Khara),
//  the 64th Navamsha, and the Bhrigu Bindu.
//  A hard period is checked. The form of it is not named.
// ─────────────────────────────────────────────────────────────

import type { Rashi } from '@/types/astrology'
import { GRAHA_NAMES, RASHI_NAMES } from '@/types/astrology'
import { D9 } from '@/lib/engine/vargas'
import {
  RASHI_LORDS,
  wholeSignHouseFromLagna,
  type ClassicalGrahaId,
  type HouseNumber,
} from '@/lib/engine/houseInterpretations'
import { rashiForHouseFromLagna } from '@/lib/engine/rashiInterpretations'

export const NADI_PATEL_NOTE =
  'C.S. Patel reads the 22nd drekkana from the lagna and from the Moon, the 64th Navamsha from each of those, and the Bhrigu Bindu. The drekkana is a 10° band. The 64th Navamsha is the 4th of Navamsha. Jupiter on the Bhrigu Bindu is the fortune year. Jupiter on the 7th lord’s Navamsha, on Venus’s Navamsha, or on the Upapada is watched for marriage. Jupiter on Saturn’s Navamsha is watched for work. A period of the point’s lord times it. These lines check a hard period. They do not name its form.'

const PORTION = ['first', 'middle', 'last'] as const

export interface PatelPoint {
  id: string
  title: string
  sign: Rashi
  signName: string
  lordName: string
  house: HouseNumber
  running: boolean
  reading: string
}

export interface PatelReading {
  note: string
  points: PatelPoint[]
  lines: string[]
}

export interface PatelInput {
  ascRashi: Rashi
  ascDegree?: number
  grahas: readonly { id: ClassicalGrahaId; rashi: Rashi; degree?: number }[]
  navamsha?: Partial<Record<ClassicalGrahaId, Rashi>>
  navamshaLagna?: Rashi
  upapada?: Rashi
  bhriguBindu?: number
  dashaLords?: readonly ClassicalGrahaId[]
}

function lordOfSign(sign: Rashi): ClassicalGrahaId {
  return RASHI_LORDS.find((row) => row.number === sign)?.lord ?? 'Su'
}

function longitude(rashi: Rashi, degree: number | undefined): number | null {
  if (degree == null || !Number.isFinite(degree) || degree < 0 || degree >= 30) return null
  return (rashi - 1) * 30 + degree
}

function signOf(lon: number): Rashi {
  const norm = ((lon % 360) + 360) % 360
  return (Math.floor(norm / 30) + 1) as Rashi
}

function inBand(lon: number, start: number): boolean {
  const n = ((lon % 360) + 360) % 360
  const s = ((start % 360) + 360) % 360
  const end = s + 10
  if (end <= 360) return n >= s && n < end
  return n >= s || n < end - 360
}

function kharaOf(lon: number): { sign: Rashi; start: number; portion: string } {
  const index = (Math.floor((((lon % 360) + 360) % 360) / 10) + 21) % 36
  return {
    sign: (Math.floor(index / 3) + 1) as Rashi,
    start: index * 10,
    portion: PORTION[index % 3] ?? 'first',
  }
}

function fourthFrom(sign: Rashi): Rashi {
  return rashiForHouseFromLagna(sign, 4)
}

function sixtyFourth(lon: number): Rashi {
  return D9(lon + 210) as Rashi
}

function joinNames(names: readonly string[]): string {
  if (names.length <= 1) return names[0] ?? ''
  if (names.length === 2) return `${names[0]} and ${names[1]}`
  return `${names.slice(0, -1).join(', ')}, and ${names[names.length - 1]}`
}

function point(input: PatelInput, row: {
  id: string
  title: string
  sign: Rashi
  reading: string
}): PatelPoint {
  const lord = lordOfSign(row.sign)
  const running = (input.dashaLords ?? []).includes(lord)
  const reading = running
    ? `${row.reading} The period of ${GRAHA_NAMES[lord]} is open, so this point is timed now.`
    : row.reading
  return {
    id: row.id,
    title: row.title,
    sign: row.sign,
    signName: RASHI_NAMES[row.sign],
    lordName: GRAHA_NAMES[lord],
    house: wholeSignHouseFromLagna(input.ascRashi, row.sign),
    running,
    reading,
  }
}

function bandSentence(input: PatelInput, start: number): string {
  const names = input.grahas.flatMap((planet) => {
    const lon = longitude(planet.rashi, planet.degree)
    if (lon == null || !inBand(lon, start)) return []
    return [GRAHA_NAMES[planet.id]]
  })
  const known = input.grahas.some((planet) => longitude(planet.rashi, planet.degree) != null)
  if (names.length === 1) return `${names[0]} sits in that 10° band.`
  if (names.length > 1) return `${joinNames(names)} sit in that 10° band.`
  if (!known) return 'Planet degrees are missing, so the 10° band is not checked.'
  return 'No planet sits in that 10° band.'
}

function navamshaSentence(input: PatelInput, sign: Rashi): string {
  const names = input.grahas.flatMap((planet) => (
    input.navamsha?.[planet.id] === sign ? [GRAHA_NAMES[planet.id]] : []
  ))
  if (!input.navamsha) return 'Navamsha positions are missing, so occupants of this Navamsha are not checked.'
  if (names.length === 1) return `${names[0]} sits in this Navamsha.`
  if (names.length > 1) return `${joinNames(names)} sit in this Navamsha.`
  return 'No planet sits in this Navamsha.'
}

export function readPatel(input: PatelInput): PatelReading {
  const points: PatelPoint[] = []
  const lines: string[] = []
  const lords = input.dashaLords ?? []

  const lagnaLon = longitude(input.ascRashi, input.ascDegree)
  if (lagnaLon != null) {
    const khara = kharaOf(lagnaLon)
    points.push(point(input, {
      id: 'khara-lagna',
      title: '22nd drekkana · lagna',
      sign: khara.sign,
      reading: `The 22nd drekkana from the lagna is the ${khara.portion} 10° of ${RASHI_NAMES[khara.sign]}. Its lord is ${GRAHA_NAMES[lordOfSign(khara.sign)]}. ${bandSentence(input, khara.start)} Health, an accident, or a hard turn is checked when this lord’s period runs.`,
    }))
  }

  const moon = input.grahas.find((planet) => planet.id === 'Mo')
  const moonLon = moon ? longitude(moon.rashi, moon.degree) : null
  if (moonLon != null) {
    const khara = kharaOf(moonLon)
    points.push(point(input, {
      id: 'khara-moon',
      title: '22nd drekkana · Moon',
      sign: khara.sign,
      reading: `The 22nd drekkana from the Moon is the ${khara.portion} 10° of ${RASHI_NAMES[khara.sign]}. Its lord is ${GRAHA_NAMES[lordOfSign(khara.sign)]}. ${bandSentence(input, khara.start)} The mind and the mother are checked when this lord’s period runs.`,
    }))
  } else if (moon) {
    lines.push('The Moon’s degree is missing, so its 22nd drekkana is not read.')
  }

  const lagnaSixth = input.navamshaLagna != null
    ? fourthFrom(input.navamshaLagna)
    : lagnaLon != null
      ? sixtyFourth(lagnaLon)
      : null
  if (lagnaSixth != null) {
    points.push(point(input, {
      id: 'navamsha-64-lagna',
      title: '64th Navamsha · lagna',
      sign: lagnaSixth,
      reading: `The 64th Navamsha from the lagna is ${RASHI_NAMES[lagnaSixth]}, the 4th of Navamsha. Its lord is ${GRAHA_NAMES[lordOfSign(lagnaSixth)]}. ${navamshaSentence(input, lagnaSixth)} A hard period for health is checked when this lord’s period runs.`,
    }))
  }

  const moonNav = input.navamsha?.Mo ?? (moonLon != null ? (D9(moonLon) as Rashi) : null)
  if (moonNav != null) {
    const sign = fourthFrom(moonNav)
    points.push(point(input, {
      id: 'navamsha-64-moon',
      title: '64th Navamsha · Moon',
      sign,
      reading: `The 64th Navamsha from the Moon is ${RASHI_NAMES[sign]}. Its lord is ${GRAHA_NAMES[lordOfSign(sign)]}. ${navamshaSentence(input, sign)} The mind and the mother are checked when this lord’s period runs.`,
    }))
  }

  if (input.bhriguBindu != null && Number.isFinite(input.bhriguBindu)) {
    const sign = signOf(input.bhriguBindu)
    lines.push(`The Bhrigu Bindu falls in ${RASHI_NAMES[sign]}. Jupiter in that sign is read as fortune. A trine of that sign is the lighter year.`)
  }

  const watch: string[] = []
  const seventh = lordOfSign(rashiForHouseFromLagna(input.ascRashi, 7))
  const seventhSign = input.navamsha?.[seventh]
  if (seventhSign != null) watch.push(`${RASHI_NAMES[seventhSign]} (Navamsha of the 7th lord)`)
  if (input.navamsha?.Ve != null) watch.push(`${RASHI_NAMES[input.navamsha.Ve]} (Venus’s Navamsha)`)
  if (input.upapada != null) watch.push(`${RASHI_NAMES[input.upapada]} (Upapada)`)
  const unique = [...new Set(watch)]
  if (unique.length > 0) {
    lines.push(`Marriage is watched when Jupiter reaches ${joinNames(unique)}.`)
  }
  if (input.navamsha?.Sa != null) {
    lines.push(`Work is watched when Jupiter reaches ${RASHI_NAMES[input.navamsha.Sa]}, Saturn’s Navamsha.`)
  }

  if (lords.length === 0) {
    lines.push('No Vimshottari period is open, so these points are not timed.')
  }

  return { note: NADI_PATEL_NOTE, points, lines }
}
