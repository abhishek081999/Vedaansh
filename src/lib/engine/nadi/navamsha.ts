// ─────────────────────────────────────────────────────────────
//  src/lib/engine/nadi/navamsha.ts
//  Navamsha read as its own chart. Houses 1 and 7 judge the
//  marriage. The antardasha of either lord times it.
// ─────────────────────────────────────────────────────────────

import type { Rashi } from '@/types/astrology'
import { GRAHA_NAMES } from '@/types/astrology'
import {
  RASHI_LORDS,
  wholeSignHouseFromLagna,
  type ClassicalGrahaId,
} from '@/lib/engine/houseInterpretations'
import { rashiForHouseFromLagna } from '@/lib/engine/rashiInterpretations'
import { nadiAspectsSign } from '@/lib/engine/nadi/snapshots'
import { nadiConjunct, type NadiYogaPlacement } from '@/lib/engine/nadi/yogas'

export const NADI_NAVAMSHA_NOTE =
  'Navamsha is read as its own chart. Its 1st and 7th are the marriage houses. The antardasha of either lord is read for marriage or for meeting the partner.'

const LOOKS = new Set<ClassicalGrahaId>(['Ju', 'Ve', 'Mo'])
const HAPPY = new Set<ClassicalGrahaId>(['Ju', 'Ve', 'Mo', 'Me'])

export interface NavamshaPredictionInput {
  ascRashi: Rashi
  grahas: readonly NadiYogaPlacement[]
  navamshaLagna?: Rashi
  navamshaGrahas?: readonly NadiYogaPlacement[]
  dashaLords?: readonly ClassicalGrahaId[]
}

export function navamshaPredictionNotes(input: NavamshaPredictionInput): string[] {
  const lagna = input.navamshaLagna
  const grahas = input.navamshaGrahas
  if (lagna == null || !grahas?.length) return []

  const lines: string[] = []
  const houses: ('good' | 'bad' | null)[] = []
  for (const house of [1, 7] as const) {
    const ids = grahas
      .filter((g) => wholeSignHouseFromLagna(lagna, g.rashi) === house)
      .map((g) => g.id)
    const label = house === 1 ? '1st' : '7th'
    for (const id of ids) {
      const name = GRAHA_NAMES[id]
      if (id === 'Ra' || id === 'Ke') {
        lines.push(`The ${label} of Navamsha holds ${name}. Divorce or a separation is checked.`)
      } else if (id === 'Sa') {
        lines.push(`The ${label} of Navamsha holds Saturn. Marriage is read as delayed.`)
      } else if (id === 'Su') {
        lines.push(`The ${label} of Navamsha holds the Sun. The spouse is read as influential, and proud.`)
      } else if (LOOKS.has(id)) {
        lines.push(`The ${label} of Navamsha holds ${name}. The marriage is read as happy and stable, and the spouse as good-looking.`)
      } else if (id === 'Me') {
        lines.push(`The ${label} of Navamsha holds Mercury. The marriage is read as happy and stable.`)
      }
    }
    houses.push(ids.some((id) => id === 'Ra' || id === 'Ke') ? 'bad' : ids.some((id) => HAPPY.has(id)) ? 'good' : null)
  }

  const jupiter = grahas.find((g) => g.id === 'Ju')
  if (jupiter && jupiter.rashi !== lagna && nadiAspectsSign(jupiter.rashi, 'Ju', lagna)) {
    lines.push('Jupiter aspects the Navamsha lagna. That supports the marriage.')
  }

  const antar = input.dashaLords?.[1]
  if (antar) {
    const first = signLord(lagna)
    const seventh = signLord(rashiForHouseFromLagna(lagna, 7))
    const which = antar === first ? '1st' : antar === seventh ? '7th' : null
    if (which) {
      const name = GRAHA_NAMES[antar]
      lines.push(`The antardasha of ${name} is running. ${name} rules the ${which} of Navamsha, so this period is read for marriage or for meeting the partner. The two can fall in different periods of these lords.`)
    }
  }

  const d1Seventh = input.grahas
    .filter((g) => wholeSignHouseFromLagna(input.ascRashi, g.rashi) === 7)
    .map((g) => g.id)
  const d1 = d1Seventh.some((id) => id === 'Ra' || id === 'Ke') ? 'bad' : d1Seventh.some((id) => HAPPY.has(id)) ? 'good' : null
  const d9 = houses.includes('bad') ? 'bad' : houses.includes('good') ? 'good' : null
  if (d1 && d9) lines.push(compare(d1, d9))

  const fourth = signLord(rashiForHouseFromLagna(lagna, 4))
  const eleventh = signLord(rashiForHouseFromLagna(lagna, 11))
  if (fourth !== eleventh && nadiConjunct(grahas, [fourth, eleventh])) {
    lines.push('The 4th lord and the 11th lord of Navamsha are together. Property and gains are read from that combination.')
  }

  return lines
}

function compare(d1: 'good' | 'bad', d9: 'good' | 'bad'): string {
  if (d1 === 'good' && d9 === 'good') return 'The 7th of the birth chart and Navamsha both support the marriage. The result is read as excellent.'
  if (d1 === 'bad' && d9 === 'good') return 'The 7th of the birth chart is hard for marriage. Navamsha still supports it.'
  if (d1 === 'good' && d9 === 'bad') return 'The 7th of the birth chart supports the marriage. Navamsha reduces it.'
  return 'The 7th of the birth chart and Navamsha are both hard for marriage.'
}

function signLord(sign: Rashi): ClassicalGrahaId {
  return RASHI_LORDS.find((row) => row.number === sign)?.lord ?? 'Su'
}
