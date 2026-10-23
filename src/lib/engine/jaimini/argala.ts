// ─────────────────────────────────────────────────────────────
//  src/lib/engine/jaimini/argala.ts
//  Jaimini argala and virodha, including pada-quarter obstruction
//  and the 3rd-house reverse argala of three malefics.
// ─────────────────────────────────────────────────────────────

import type { GrahaId, Rashi } from '@/types/astrology'

export interface ArgalaGraha {
  id: GrahaId
  rashi: Rashi
  degree: number
}

export interface ArgalaOccupant {
  id: GrahaId
  quarter: number
  isBlocked: boolean
  blockerIds: GrahaId[]
}

export interface ArgalaScheme {
  id: '2nd' | '4th' | '11th' | '5th'
  aSign: Rashi
  vSign: Rashi
  label: string
  occupants: ArgalaOccupant[]
  isArgalaActive: boolean
  isPartiallyBlocked: boolean
}

export interface ReverseArgala {
  thirdSign: Rashi
  occupants: GrahaId[]
  malefics: GrahaId[]
  active: boolean
}

const REVERSE_MALEFICS: GrahaId[] = ['Ma', 'Sa', 'Ra', 'Ke']

function signAt(sign: Rashi, house: number): Rashi {
  return ((((sign + house - 2) % 12) + 12) % 12 + 1) as Rashi
}

/** 1–4, each pada spanning 7°30'. */
export function degreeQuarter(degree: number): number {
  return Math.floor((degree % 30) / 7.5) + 1
}

function oppositeQuarter(a: number, b: number): boolean {
  return a + b === 5
}

/**
 * Argala from a reference sign.
 * Sources: 4th, 2nd, 11th, and conditional 5th.
 * Obstruction: 10th, 12th, 3rd, and 9th, and only when the
 * obstructing planet sits in the opposite quarter.
 */
export function evaluateArgala(sign: Rashi, grahas: ArgalaGraha[]): ArgalaScheme[] {
  const schemes: Array<Pick<ArgalaScheme, 'id' | 'label'> & { house: number; blockHouse: number }> = [
    { id: '2nd', house: 2, blockHouse: 12, label: 'Wealth' },
    { id: '4th', house: 4, blockHouse: 10, label: 'Happiness' },
    { id: '11th', house: 11, blockHouse: 3, label: 'Gains' },
    { id: '5th', house: 5, blockHouse: 9, label: 'Knowledge' },
  ]

  return schemes.map(scheme => {
    const aSign = signAt(sign, scheme.house)
    const vSign = signAt(sign, scheme.blockHouse)
    const occupants = grahas.filter(g => g.rashi === aSign)
    const blockers = grahas.filter(g => g.rashi === vSign)
    const details: ArgalaOccupant[] = occupants.map(planet => {
      const quarter = degreeQuarter(planet.degree)
      const activeBlockers = blockers.filter(b => oppositeQuarter(quarter, degreeQuarter(b.degree)))
      return {
        id: planet.id,
        quarter,
        isBlocked: activeBlockers.length > 0,
        blockerIds: activeBlockers.map(b => b.id),
      }
    })
    return {
      id: scheme.id,
      aSign,
      vSign,
      label: scheme.label,
      occupants: details,
      isArgalaActive: details.length > 0 && details.some(d => !d.isBlocked),
      isPartiallyBlocked: details.some(d => d.isBlocked),
    }
  })
}

/** Three or more of Mars, Saturn, Rahu, Ketu in the 3rd form unblockable reverse argala. */
export function evaluateReverseArgala(
  sign: Rashi,
  grahas: Array<Pick<ArgalaGraha, 'id' | 'rashi'>>,
): ReverseArgala {
  const thirdSign = signAt(sign, 3)
  const occupants = grahas.filter(g => g.rashi === thirdSign).map(g => g.id)
  const malefics = occupants.filter(id => REVERSE_MALEFICS.includes(id))
  return {
    thirdSign,
    occupants,
    malefics,
    active: malefics.length >= 3,
  }
}
