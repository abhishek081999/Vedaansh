// src/lib/engine/marriageGochar.ts
// Jupiter–Saturn double transit is a bright chance for marriage only when
// the running dasha already touches a marriage house, and only inside the
// years a marriage is possible. The transit date is not computed here.
// Pure engine — no React/DB.

import type { ChartOutput, GrahaData, GrahaId, Rashi } from '@/types/astrology'
import { GRAHA_NAMES } from '@/types/astrology'
import { getDashaPathAt } from '@/lib/engine/dasha/current'
import type { LifeTone, MarriedLifeNote } from '@/lib/engine/marriedLifeAnalysis'

export interface MarriageGocharFlags {
  dashaSupports: boolean | null
  houses: number[]
  childrenVehicle: boolean
}

export interface MarriageGocharReading {
  headline: string
  summary: string
  principles: string
  window: MarriedLifeNote[]
  flags: MarriageGocharFlags
}

const SUPPORT = [7, 2, 5, 11, 3, 1, 4, 8]

const LORDS: Record<number, GrahaId> = {
  1: 'Ma', 2: 'Ve', 3: 'Me', 4: 'Mo', 5: 'Su', 6: 'Me',
  7: 'Ve', 8: 'Ma', 9: 'Ju', 10: 'Sa', 11: 'Sa', 12: 'Ju',
}

export const MARRIAGE_GOCHAR_PRINCIPLES =
  'A double transit of Saturn and Jupiter on the 1st or the 7th is one bright chance for marriage. It is not the marriage. Outside the years a marriage is possible, that transit passes. Jupiter’s transit on the lagna alone has coincided with marriage in charts the class studied, and still only when the dasha was already open. The period does not have to be Saturn’s and Jupiter’s. Any period tied to the 7th, 2nd, 5th, 11th, 3rd, 1st, 4th, or 8th can receive the event. Whether marriage is promised is a separate reading. Some marriages exist because a child is due through that union. Jupiter is the significator of life in that question.'

function houseOf(rashi: number, asc: number): number {
  return ((rashi - asc + 12) % 12) + 1
}

function signOf(asc: number, house: number): Rashi {
  return ((((asc - 1 + house - 1) % 12) + 1) as Rashi)
}

function gn(id: GrahaId | string): string {
  return GRAHA_NAMES[id as GrahaId] ?? id
}

function find(list: GrahaData[], id: GrahaId): GrahaData | undefined {
  return list.find(g => g.id === id)
}

function note(id: string, title: string, detail: string, tone: LifeTone): MarriedLifeNote {
  return { id, title, detail, tone }
}

function ordinalHouse(n: number): string {
  if (n === 1) return '1st'
  if (n === 2) return '2nd'
  if (n === 3) return '3rd'
  return `${n}th`
}

export function analyzeMarriageGochar(chart: ChartOutput | null | undefined): MarriageGocharReading | null {
  const asc = chart?.lagnas?.ascRashi
  if (!chart || !asc) return null

  const grahas = chart.grahas ?? []
  const ties = (planet: GrahaData | undefined, house: number): boolean => {
    if (!planet) return false
    const sign = signOf(asc, house)
    if (LORDS[sign] === planet.id) return true
    if (planet.rashi === sign) return true
    const lord = find(grahas, LORDS[sign])
    return !!lord && lord.id !== planet.id && lord.rashi === planet.rashi
  }

  const path = chart.dashas?.vimshottari ? getDashaPathAt(chart.dashas.vimshottari) : []
  const periodGraha = (index: number) => {
    const id = path[index]?.lord
    return id ? find(grahas, id as GrahaId) : undefined
  }
  const md = periodGraha(0)
  const ad = periodGraha(1)
  const houses = SUPPORT.filter(h => ties(md, h) || ties(ad, h))
  const dashaSupports = path.length ? houses.length > 0 : null

  const jupiter = find(grahas, 'Ju')
  const fifthLord = find(grahas, LORDS[signOf(asc, 5)])
  const fifthTied = houses.includes(5)
  const jupiterOnFifth = !!jupiter && (
    houseOf(jupiter.rashi, asc) === 5
    || jupiter.id === LORDS[signOf(asc, 5)]
    || (!!fifthLord && fifthLord.id !== 'Ju' && fifthLord.rashi === jupiter.rashi)
  )
  const childrenVehicle = fifthTied && jupiterOnFifth

  const window: MarriedLifeNote[] = []
  const periodNames = path.slice(0, 2).map(p => gn(p.lord))
  const names = periodNames.filter((name, i) => i === 0 || name !== periodNames[i - 1]).join(' → ')

  if (dashaSupports && md) {
    window.push(note(
      'gochar-open',
      'This period can receive a marriage transit',
      `${names} is tied to ${houses.map(ordinalHouse).join(', ')}. Those are houses the class allows to carry a wedding: the 7th, the family, romance, fulfillment, courage, the self, the home, and the transformation after marriage. A double transit of Saturn and Jupiter on the 1st or the 7th is a bright chance while this period is open, and only inside the years a marriage is possible. Jupiter’s transit on the lagna, without Saturn, has also coincided with marriage when the period was already like this. The transit date is not taken from the birth chart. If the years are wrong, or the period is not this one, the same sky passes with no wedding.`,
      'mixed',
    ))
  } else if (dashaSupports === false && md) {
    window.push(note(
      'gochar-pass',
      'A favorable transit would pass',
      `${names} is not tied to the 7th, 2nd, 5th, 11th, 3rd, 1st, 4th, or 8th. The class is explicit that a Saturn–Jupiter double transit, and even Jupiter alone on the lagna, does not marry anyone by itself. While this period runs, that sky passes without the event.`,
      'caution',
    ))
  } else {
    window.push(note(
      'gochar-no-period',
      'The period is not on this chart',
      'A double transit of Saturn and Jupiter on the 1st or the 7th is a bright chance only beside a dasha that already touches marriage. This chart has no running Vimshottari period to test, so the transit cannot be confirmed or dismissed from here.',
      'mixed',
    ))
  }

  if (childrenVehicle && jupiter) {
    window.push(note(
      'gochar-children',
      'A child can be the reason the marriage is due',
      `Jupiter, significator of progeny, is on the 5th, and the 5th is in ${names}. The class has seen marriages that exist so a child can be born through that union. This is not a finding that a child is assured. If the person is not yet of an age to marry and is already in a relationship, the same period is a reason for caution: an unplanned pregnancy is how this pattern has shown, and health trouble has followed it.`,
      'caution',
    ))
  }

  const headline = dashaSupports
    ? 'The period is open. A double transit can brighten it'
    : dashaSupports === false
      ? 'The period is not open. A double transit would pass'
      : 'Marriage transit cannot be read without the period'

  const summary = dashaSupports
    ? `${names} touches ${houses.map(ordinalHouse).join(', ')}. Saturn and Jupiter together on the 1st or the 7th are a chance in this window, not a date.`
    : dashaSupports === false
      ? `${names} does not touch a house the class uses to time marriage.`
      : 'No Vimshottari period is available to set beside the transit.'

  return {
    headline,
    summary,
    principles: MARRIAGE_GOCHAR_PRINCIPLES,
    window,
    flags: { dashaSupports, houses, childrenVehicle },
  }
}

export function compareMarriageGochar(
  a: MarriageGocharReading,
  b: MarriageGocharReading,
  nameA: string,
  nameB: string,
): MarriedLifeNote[] {
  if (a.flags.dashaSupports && b.flags.dashaSupports) {
    return [note(
      'gochar-pair-both',
      'Both periods can receive a marriage transit',
      `${nameA} and ${nameB} are both in a dasha tied to a marriage house. A double transit of Saturn and Jupiter on the 1st or the 7th is a bright chance for each, still only inside a marriageable age, and still not a date taken from either birth chart.`,
      'mixed',
    )]
  }
  if (a.flags.dashaSupports || b.flags.dashaSupports) {
    const open = a.flags.dashaSupports ? nameA : nameB
    const closed = a.flags.dashaSupports ? nameB : nameA
    return [note(
      'gochar-pair-one',
      `Only ${open} is in a period a transit can use`,
      `${open} has a dasha tied to a marriage house. ${closed} does not. A Saturn–Jupiter double transit would have somewhere to land for ${open} and would pass for ${closed}.`,
      'mixed',
    )]
  }
  if (a.flags.dashaSupports === false && b.flags.dashaSupports === false) {
    return [note(
      'gochar-pair-pass',
      'Neither period can carry a marriage transit',
      `${nameA} and ${nameB} are both in dashas that do not touch the houses this class uses. A double transit on the 1st or the 7th would pass for both.`,
      'caution',
    )]
  }
  return []
}
