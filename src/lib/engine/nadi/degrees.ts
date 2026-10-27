// ─────────────────────────────────────────────────────────────
//  src/lib/engine/nadi/degrees.ts
//  Lomash degree timing. A planet's degree in its sign is a year
//  of life. A fraction of 0.30 or more takes the next year
//  (19.30 → 20, 17.55 → 18). Planets in one conjunction are added.
// ─────────────────────────────────────────────────────────────

import type { Rashi } from '@/types/astrology'
import { GRAHA_NAMES } from '@/types/astrology'
import { wholeSignHouseFromLagna, type ClassicalGrahaId, type HouseNumber } from '@/lib/engine/houseInterpretations'
import { NADI_CONJUNCTION_ORB } from './grahas'
import { NADI_HOUSES, NADI_PAPA_GRAHAS } from './houses'

export const NADI_DEGREE_NOTE =
  'A planet’s degree is the year of life in which its result is read. A fraction of 0.30 or more takes the next year. Planets in a combination are added for the year of the full result. The same year can hold more than one event.'

const PAPA = new Set<string>(NADI_PAPA_GRAHAS)
const DUSTHANA = new Set<HouseNumber>([6, 8, 12])

export interface NadiDegreePlacement {
  id: ClassicalGrahaId
  rashi: Rashi
  degree?: number
}

interface Timed {
  id: ClassicalGrahaId
  rashi: Rashi
  degree: number
  year: number
  house: HouseNumber
}

/** Primary year. A fraction of 0.30 or more takes the next year. */
export function lomashYear(degree: number): number | null {
  if (!Number.isFinite(degree) || degree < 0 || degree >= 30) return null
  const whole = Math.floor(degree)
  return degree - whole >= 0.3 ? whole + 1 : whole
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

function joinNames(names: string[]): string {
  if (names.length <= 1) return names[0] ?? ''
  if (names.length === 2) return `${names[0]} and ${names[1]}`
  return `${names.slice(0, -1).join(', ')}, and ${names[names.length - 1]}`
}

function birthYear(birthDate?: string): number | null {
  const year = Number(birthDate?.slice(0, 4))
  return Number.isInteger(year) && year > 0 ? year : null
}

function around(year: number, born: number | null): string {
  if (born == null) return ''
  return `, around ${born + year}`
}

function shownDegree(degree: number): string {
  const rounded = Math.round(degree * 100) / 100
  return Number.isInteger(rounded) ? `${rounded}` : `${rounded}`
}

export function degreeTimingNotes(input: {
  ascRashi: Rashi
  grahas: readonly NadiDegreePlacement[]
  birthDate?: string
}): string[] {
  const born = birthYear(input.birthDate)
  const timed: Timed[] = []
  for (const graha of input.grahas) {
    if (typeof graha.degree !== 'number') continue
    const year = lomashYear(graha.degree)
    if (year == null) continue
    timed.push({
      id: graha.id,
      rashi: graha.rashi,
      degree: graha.degree,
      year,
      house: wholeSignHouseFromLagna(input.ascRashi, graha.rashi),
    })
  }
  if (!timed.length) return []

  const lines: { year: number; text: string }[] = []
  for (const planet of timed) {
    const alone = !timed.some((other) => other.id !== planet.id && other.rashi === planet.rashi)
    const themes = (NADI_HOUSES[planet.house]?.significances ?? [])
      .filter((line) => !/death|die|passed/i.test(line))
      .slice(0, 2)
      .join(', ')
      .toLowerCase()
    const bits = [
      `${GRAHA_NAMES[planet.id]} at ${shownDegree(planet.degree)}° is read in the ${ordinal(planet.year)} year${around(planet.year, born)}.`,
    ]
    if (planet.year === 0) bits[0] = `${GRAHA_NAMES[planet.id]} at ${shownDegree(planet.degree)}° is read in the year of birth${born != null ? ` (${born})` : ''}. The 1st year is also checked.`
    if (themes) bits.push(`It sits in the ${ordinal(planet.house)}, read for ${themes}.`)
    if (planet.house === 4) bits.push('A change of residence is checked.')
    if (planet.house === 7 || planet.id === 'Ve') bits.push('A relationship is checked.')
    if (planet.id === 'Ra' || planet.id === 'Ke') bits.push('Fame, or a sudden problem, is checked.')
    if (PAPA.has(planet.id) || DUSTHANA.has(planet.house)) bits.push('A problem is checked in the same year.')
    if (alone && planet.year <= 2) bits.push('A planet alone at a low degree is the harder form of this reading.')
    lines.push({ year: planet.year, text: bits.join(' ') })
  }

  const bySign = new Map<Rashi, Timed[]>()
  for (const planet of timed) {
    const list = bySign.get(planet.rashi) ?? []
    list.push(planet)
    bySign.set(planet.rashi, list)
  }
  for (const group of bySign.values()) {
    const ordered = [...group].sort((a, b) => a.degree - b.degree)
    const within = (set: Timed[]) => set[set.length - 1]!.degree - set[0]!.degree <= NADI_CONJUNCTION_ORB.weak
    const pushSum = (set: Timed[]) => {
      if (!within(set)) return
      const sum = set.reduce((total, planet) => total + planet.year, 0)
      const names = joinNames(set.map((planet) => GRAHA_NAMES[planet.id]))
      const zero = set.some((planet) => planet.year === 0)
      const text = !zero
        ? `${names} are together. The degrees sum to ${sum}, so the full result is read in the ${ordinal(sum)} year${around(sum, born)}.`
        : sum === 0
          ? `${names} are together. The degrees sum to 0, so the full result is read in the year of birth${born != null ? ` (${born})` : ''}. The 1st year is also checked.`
          : `${names} are together. The degrees sum to ${sum}. The ${ordinal(sum)} year${around(sum, born)} and the ${ordinal(sum + 1)} year${around(sum + 1, born)} are both checked, because a planet at 0° is also read in the 1st year.`
      lines.push({ year: sum, text })
    }
    for (let i = 0; i < ordered.length; i++) {
      for (let j = i + 1; j < ordered.length; j++) {
        pushSum([ordered[i]!, ordered[j]!])
      }
    }
    if (ordered.length >= 3) pushSum(ordered)
    if (ordered.length >= 4) {
      for (let i = 0; i < ordered.length; i++) {
        for (let j = i + 1; j < ordered.length; j++) {
          for (let k = j + 1; k < ordered.length; k++) {
            const triple = [ordered[i]!, ordered[j]!, ordered[k]!]
            if (triple.length < ordered.length) pushSum(triple)
          }
        }
      }
    }
  }

  return lines.sort((a, b) => a.year - b.year).map((line) => line.text)
}
