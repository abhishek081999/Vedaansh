// ─────────────────────────────────────────────────────────────
//  src/lib/engine/manglikTeaching.ts
//  Educational Manglik (Kuja) status + house notes for chart UI
// ─────────────────────────────────────────────────────────────

import type { GrahaData, Rashi } from '@/types/astrology'
import type { ManglikAnalysis } from '@/lib/engine/doshas'
import {
  ANSHIK_PURNA_MANGLIK_NOTE,
  MANGLIK_OVERVIEW,
  MARS_CONTROL_NOTE,
  wholeSignHouseFromLagna,
} from '@/lib/engine/houseInterpretations'

export type ManglikStatus = 'present' | 'cancelled' | 'not_present'

export type ManglikScope = 'none' | 'anshik' | 'purna'

export interface ManglikPerspectiveFlags {
  fromLagna: boolean
  fromMoon: boolean
  fromVenus: boolean
  /** Count of perspectives where Mars is in a Kuja house */
  activeCount: number
  scope: ManglikScope
  /** Mars+Venus together in a Kuja house from Lagna */
  marsVenusConjunctInKuja: boolean
  scopeLabel: string
  scopeDetail: string
}

export interface ManglikTeaching {
  status: ManglikStatus
  /** Short badge label for UI */
  headline: string
  /** Optional house-specific teaching when Mars sits in 1/4/7/8/12 */
  houseNote: string | null
  overview: string
  /** Engine cancellation reasons (empty when none) */
  cancellationNotes: string[]
  /** Soft closing line for cancelled / clear charts */
  statusDetail: string
  /** Optional aṁśik / pūrṇa framing when grahas supplied */
  perspectives: ManglikPerspectiveFlags | null
  controlNote: string
}

const MANGLIK_HOUSES = new Set([1, 4, 7, 8, 12])

/** Soft house lines from class teaching — educational, not fatalistic. */
const HOUSE_NOTES: Record<number, string> = {
  1: 'Mars in the 1st: commander energy colors the whole personality—leadership and ego heat; partnership themes need conscious pacing.',
  4: 'Mars in the 4th: heat around home, emotional security, or property; channel into constructive action at the roots (classically watched for married-life comfort).',
  7: 'Mars in the 7th: aggression, leadership, authority, and independence in contracts and marriage (all genders). Space and clear boundaries soften friction more than fatalism.',
  8: 'Mars in the 8th: intensity around shared resources and transformation; traditional texts stress this house—judge dignity and partner matching carefully, without literal death absolutism.',
  12: 'Mars in the 12th: drive toward solitude, foreign settings, or behind-the-scenes effort; rest and boundaries matter.',
}

const CANCEL_SOFTEN =
  'Own-sign, exaltation, classical house×sign exceptions, or Jupiter’s influence can neutralize or soften Kuja doṣa—read the full chart, not the label alone. Mutual Manglik matching and age ~28 also soften marriage-fear readings.'

const MA_VE_NOTE =
  'Mars conjunct Venus in a Kuja house intensifies Manglik reading from both Lagna and Venus perspectives—treat as high-heat relating that needs maturity and matching, not panic.'

function houseFrom(refRashi: Rashi, planetRashi: Rashi): number {
  return wholeSignHouseFromLagna(refRashi, planetRashi)
}

/**
 * Educational multi-perspective Manglik scan (Lagna / Moon / Venus).
 * Does not change `calculateManglik` lagna verdict used for Milan matching.
 */
export function getManglikPerspectives(
  grahas: GrahaData[],
  ascRashi: Rashi,
): ManglikPerspectiveFlags {
  const mars = grahas.find((g) => g.id === 'Ma')
  const moon = grahas.find((g) => g.id === 'Mo')
  const venus = grahas.find((g) => g.id === 'Ve')

  const fromLagna = mars ? MANGLIK_HOUSES.has(houseFrom(ascRashi, mars.rashi)) : false
  const fromMoon = mars && moon ? MANGLIK_HOUSES.has(houseFrom(moon.rashi, mars.rashi)) : false
  const fromVenus = mars && venus ? MANGLIK_HOUSES.has(houseFrom(venus.rashi, mars.rashi)) : false

  const activeCount = [fromLagna, fromMoon, fromVenus].filter(Boolean).length
  const scope: ManglikScope =
    activeCount === 0 ? 'none' : activeCount === 1 ? 'anshik' : 'purna'

  const marsHouseFromLagna = mars ? houseFrom(ascRashi, mars.rashi) : 0
  const venusHouseFromLagna = venus ? houseFrom(ascRashi, venus.rashi) : -1
  const marsVenusConjunctInKuja =
    !!mars &&
    !!venus &&
    marsHouseFromLagna === venusHouseFromLagna &&
    MANGLIK_HOUSES.has(marsHouseFromLagna)

  let scopeLabel = 'No Kuja-house Mars from Lagna / Moon / Venus'
  let scopeDetail = ANSHIK_PURNA_MANGLIK_NOTE
  if (scope === 'anshik') {
    const parts: string[] = []
    if (fromLagna) parts.push('Lagna')
    if (fromMoon) parts.push('Moon')
    if (fromVenus) parts.push('Venus')
    scopeLabel = `Aṁśik (partial) · from ${parts.join(', ')}`
  } else if (scope === 'purna') {
    const parts: string[] = []
    if (fromLagna) parts.push('Lagna')
    if (fromMoon) parts.push('Moon')
    if (fromVenus) parts.push('Venus')
    scopeLabel = `Pūrṇa (fuller) · from ${parts.join(', ')} (${activeCount}/3)`
  }

  if (marsVenusConjunctInKuja) {
    scopeDetail = `${ANSHIK_PURNA_MANGLIK_NOTE} ${MA_VE_NOTE}`
  }

  return {
    fromLagna,
    fromMoon,
    fromVenus,
    activeCount,
    scope,
    marsVenusConjunctInKuja,
    scopeLabel,
    scopeDetail,
  }
}

export function getManglikStatusLabel(analysis: ManglikAnalysis): ManglikStatus {
  if (analysis.isManglik) return 'present'
  if (analysis.cancellations.length > 0 && MANGLIK_HOUSES.has(analysis.house)) {
    return 'cancelled'
  }
  return 'not_present'
}

export function getManglikTeaching(
  analysis: ManglikAnalysis,
  grahas?: GrahaData[],
  ascRashi?: Rashi,
): ManglikTeaching {
  const status = getManglikStatusLabel(analysis)
  const inDoshaHouse = MANGLIK_HOUSES.has(analysis.house)
  const houseNote = inDoshaHouse ? (HOUSE_NOTES[analysis.house] ?? null) : null
  const perspectives =
    grahas && ascRashi != null ? getManglikPerspectives(grahas, ascRashi) : null

  const base = {
    houseNote,
    overview: MANGLIK_OVERVIEW,
    perspectives,
    controlNote: MARS_CONTROL_NOTE,
  }

  if (status === 'present') {
    const intensityBit =
      analysis.intensity === 'High'
        ? ' Intensity reads high for this placement—match carefully and weigh the whole chart.'
        : analysis.intensity === 'Low'
          ? ' Intensity reads milder—still weigh dignity, aspects, and dashā.'
          : ''
    return {
      ...base,
      status,
      headline: 'Present',
      cancellationNotes: [],
      statusDetail: `Mars occupies the ${analysis.house}th house from Lagna (a classical Kuja house).${intensityBit}`,
    }
  }

  if (status === 'cancelled') {
    return {
      ...base,
      status,
      headline: 'Cancelled',
      cancellationNotes: [...analysis.cancellations],
      statusDetail: CANCEL_SOFTEN,
    }
  }

  return {
    ...base,
    status,
    headline: 'Not present',
    houseNote: null,
    cancellationNotes: [],
    statusDetail:
      analysis.house > 0
        ? `Mars is in the ${analysis.house}th house from Lagna—outside the usual Kuja houses (1, 4, 7, 8, 12). Other perspectives (Moon/Venus) may still show aṁśik cues—see scope below when available.`
        : 'Mars placement could not be resolved for this chart.',
  }
}
