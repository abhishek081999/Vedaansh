// ─────────────────────────────────────────────────────────────
//  src/lib/engine/jaimini/argala.ts
//  Jaimini argala and virodha, including pada-quarter obstruction
//  and the 3rd-house reverse argala of three malefics.
// ─────────────────────────────────────────────────────────────

import type { GrahaId, Rashi } from '@/types/astrology'
import type { JaiminiMethod } from './method'

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

export type ArgalaStatus = 'none' | 'open' | 'strong' | 'partial' | 'blocked'

export interface ArgalaSource {
  id: ArgalaScheme['id']
  label: string
  aSign: Rashi
  vSign: Rashi
  occupants: GrahaId[]
  blockers: GrahaId[]
  /** Blockers that actually obstruct under the chosen method. */
  activeBlockers: GrahaId[]
  sourceStrength: number
  blockStrength: number
  status: ArgalaStatus
  note: string
}

export interface ArgalaHouseRow {
  house: number
  sign: Rashi
  occupants: GrahaId[]
  sources: ArgalaSource[]
  /** How many of the 2nd, 4th, and 11th hold a planet. */
  coverage: 'none' | 'partial' | 'full'
  selfDriven: boolean
  reverse: boolean
  meaning: string
  summary: string
}

const HOUSE_ARGALA_MEANING = [
  '',
  'Argala on the Lagna brings fame and luck to the person.',
  'Argala on the 2nd brings money and family support.',
  'Argala on the 3rd brings support from siblings and neighbours.',
  'Argala on the 4th brings home and emotional support.',
  'Argala on the 5th brings intelligence and creation. With the 9th unobstructed, the person rises like a king.',
  'Argala on the 6th keeps the person active because rivals and critics multiply.',
  'Argala on the 7th brings partnership and marriage results.',
  'Argala on the 8th brings serious problems to work through.',
  'Argala on the 9th brings fortune and dharma. With the 5th unobstructed, destiny opens.',
  'Argala on the 10th brings career growth after real struggle.',
  'Argala on the 11th brings gains and a wider network.',
  'Argala on the 12th times expense, distance, and release.',
] as const

const SOURCE_ORDER: Record<JaiminiMethod, Array<{ id: ArgalaScheme['id']; house: number; blockHouse: number; label: string }>> = {
  classical: [
    { id: '2nd', house: 2, blockHouse: 12, label: 'Wealth' },
    { id: '4th', house: 4, blockHouse: 10, label: 'Happiness' },
    { id: '11th', house: 11, blockHouse: 3, label: 'Gains' },
    { id: '5th', house: 5, blockHouse: 9, label: 'Knowledge' },
  ],
  // Practical order is by influence: the 4th weighs most, then the 2nd, then the 11th.
  practical: [
    { id: '4th', house: 4, blockHouse: 10, label: 'Happiness' },
    { id: '2nd', house: 2, blockHouse: 12, label: 'Wealth' },
    { id: '11th', house: 11, blockHouse: 3, label: 'Gains' },
    { id: '5th', house: 5, blockHouse: 9, label: 'Knowledge' },
  ],
}

function sumStrength(ids: GrahaId[], strengthOf: (id: GrahaId) => number): number {
  return ids.reduce((total, id) => total + strengthOf(id), 0)
}

/** Every argala source on one sign, judged by the chosen method. */
export function readArgalaSources(
  sign: Rashi,
  grahas: ArgalaGraha[],
  strengthOf: (id: GrahaId) => number,
  method: JaiminiMethod,
): ArgalaSource[] {
  return SOURCE_ORDER[method].map(scheme => {
    const aSign = signAt(sign, scheme.house)
    const vSign = signAt(sign, scheme.blockHouse)
    const sources = grahas.filter(g => g.rashi === aSign)
    const blockers = grahas.filter(g => g.rashi === vSign)
    const occupants = sources.map(g => g.id)
    const blockerIds = blockers.map(g => g.id)
    const sourceStrength = sumStrength(occupants, strengthOf)

    const base = {
      id: scheme.id,
      label: scheme.label,
      aSign,
      vSign,
      occupants,
      blockers: blockerIds,
      sourceStrength,
    }

    if (!sources.length) {
      return { ...base, activeBlockers: [], blockStrength: 0, status: 'none' as const, note: 'No planet here, so no argala from this house.' }
    }

    if (method === 'classical') {
      const blockStrength = sumStrength(blockerIds, strengthOf)
      if (!blockers.length) {
        return { ...base, activeBlockers: [], blockStrength, status: 'open' as const, note: 'No planet obstructs this argala.' }
      }
      const blocked = blockers.length > sources.length
        || (blockers.length === sources.length && blockStrength >= sourceStrength)
      return blocked
        ? { ...base, activeBlockers: blockerIds, blockStrength, status: 'blocked' as const, note: 'The obstructing house has more planets, or equal planets with more strength.' }
        : { ...base, activeBlockers: [], blockStrength, status: 'open' as const, note: 'Obstruction is present but has fewer planets or less strength.' }
    }

    const quarterBlocked = sources.map(planet => {
      const quarter = degreeQuarter(planet.degree)
      return blockers.filter(b => oppositeQuarter(quarter, degreeQuarter(b.degree))).map(b => b.id)
    })
    const activeBlockers = [...new Set(quarterBlocked.flat())]
    const blockStrength = sumStrength(activeBlockers, strengthOf)
    if (!activeBlockers.length) {
      return {
        ...base,
        activeBlockers,
        blockStrength,
        status: 'open' as const,
        note: blockers.length
          ? 'A planet sits in the obstructing house, but not in the opposite degree quarter, so argala runs at full power.'
          : 'No planet obstructs this argala, so it runs at full power.',
      }
    }
    if (sourceStrength > blockStrength) {
      return { ...base, activeBlockers, blockStrength, status: 'strong' as const, note: 'The degree quarters oppose, but the argala planets are stronger than the obstruction.' }
    }
    return quarterBlocked.every(list => list.length > 0)
      ? { ...base, activeBlockers, blockStrength, status: 'blocked' as const, note: 'Every argala planet is obstructed from the opposite degree quarter by stronger planets.' }
      : { ...base, activeBlockers, blockStrength, status: 'partial' as const, note: 'Some argala planets are obstructed from the opposite degree quarter.' }
  })
}

/** Argala on all twelve houses from the Lagna. */
export function readArgalaTable(
  lagna: Rashi,
  grahas: ArgalaGraha[],
  strengthOf: (id: GrahaId) => number,
  method: JaiminiMethod,
): ArgalaHouseRow[] {
  const rows: ArgalaHouseRow[] = []
  for (let house = 1; house <= 12; house++) {
    const sign = signAt(lagna, house)
    const sources = readArgalaSources(sign, grahas, strengthOf, method)
    const occupants = grahas.filter(g => g.rashi === sign).map(g => g.id)
    const main = sources.filter(s => s.id !== '5th' && s.occupants.length > 0).length
    const coverage: ArgalaHouseRow['coverage'] = main === 0 ? 'none' : main === 3 ? 'full' : 'partial'
    const anySource = sources.some(s => s.occupants.length > 0)
    const selfDriven = !anySource && occupants.length > 0
    const reverse = evaluateReverseArgala(sign, grahas).active
    const working = sources.filter(s => s.status === 'open' || s.status === 'strong' || s.status === 'partial')
    const blocked = sources.filter(s => s.status === 'blocked')

    let summary: string
    if (selfDriven) {
      summary = 'No outside argala falls here, but planets occupy the house. Results are self-driven: growth comes from your own effort, with less interference.'
    } else if (!anySource) {
      summary = 'No argala and no occupant. This house follows its lord and the running dasha.'
    } else if (!working.length) {
      summary = `Argala from ${blocked.map(s => s.id).join(', ')} is obstructed, so its result is held back.`
    } else {
      summary = `Working argala from ${working.map(s => s.id).join(', ')}${blocked.length ? `. Obstructed from ${blocked.map(s => s.id).join(', ')}` : ''}.`
    }
    if (reverse) summary += ' Three or more malefics in the 3rd form reverse argala here, which cannot be obstructed.'

    rows.push({ house, sign, occupants, sources, coverage, selfDriven, reverse, meaning: HOUSE_ARGALA_MEANING[house], summary })
  }
  return rows
}

/**
 * Practical rule: argala works like a toll booth. Effort comes first and the
 * results gather in roughly the last 30% of the period (6 of Venus's 20 years).
 */
export function argalaResultPhaseStart(start: Date | string, end: Date | string): Date {
  const s = new Date(start).getTime()
  const e = new Date(end).getTime()
  return new Date(s + (e - s) * 0.7)
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
