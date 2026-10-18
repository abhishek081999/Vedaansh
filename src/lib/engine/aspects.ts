// ─────────────────────────────────────────────────────────────
//  src/lib/engine/aspects.ts
//  Parashara whole-sign drishti helpers (UI + gochar shared)
// ─────────────────────────────────────────────────────────────

import type { GrahaId, Rashi } from '@/types/astrology'

/**
 * Standard Vedic (Parashari) Aspects
 * Every planet aspects the 7th house (count including the house they reside in).
 * Special aspects:
 * Mars (Ma): 4, 8
 * Jupiter (Ju): 5, 9
 * Saturn (Sa): 3, 10
 * Rahu/Ketu: none (classical Parashari — nodes do not cast drishti)
 */
export const GRAHA_ASPECTS: Record<GrahaId, number[]> = {
  Su: [7],
  Mo: [7],
  Ma: [4, 7, 8],
  Me: [7],
  Ju: [5, 7, 9],
  Ve: [7],
  Sa: [3, 7, 10],
  Ra: [],
  Ke: [],
  Ur: [7],
  Ne: [7],
  Pl: [7],
}

/**
 * Get aspected houses for a planet given its current house location.
 * @param planetId GrahaId
 * @param currentHouse 1-12
 * @returns number[] 1-12 (aspected houses)
 */
export function getAspectedHouses(planetId: GrahaId, currentHouse: number): number[] {
  const aspects = GRAHA_ASPECTS[planetId] || [7]
  return aspects.map(a => {
    const target = (currentHouse + a - 1) % 12
    return target === 0 ? 12 : target
  })
}

/**
 * Short aspect labels for tooltips.
 * Prefer planet-aware labels for Ma / Ju / Sa special drishti when `planetId` is set.
 */
export function getAspectDescription(a: number, planetId?: GrahaId): string {
  if (planetId === 'Ma') {
    if (a === 4) return 'Protection / territory'
    if (a === 7) return 'Partnership / energy'
    if (a === 8) return 'Eliminates threats (not house itself)'
  }
  if (planetId === 'Ju') {
    if (a === 5) return 'Learning capacity'
    if (a === 7) return 'Partner counsel'
    if (a === 9) return 'Blessings / fortune-rise'
  }
  if (planetId === 'Sa') {
    if (a === 3) return 'Thoughtful effort / mental tension'
    if (a === 7) return 'Relationships / domestic atmosphere'
    if (a === 10) return 'Karma discipline / honest work'
  }
  if (a === 3) return 'Effort & Valor'
  if (a === 4) return 'Happiness & Home'
  if (a === 5) return 'Wisdom & Children'
  if (a === 7) return 'Direct Influence / Partners'
  if (a === 8) return 'Transformation'
  if (a === 9) return 'Fortune & Grace'
  if (a === 10) return 'Action & Karma'
  return ''
}

/** Whole-sign house count from `fromRashi` to `toRashi` (1 = same sign). */
export function wholeSignCount(fromRashi: number, toRashi: number): number {
  return ((toRashi - fromRashi + 12) % 12) + 1
}

/**
 * Vedic whole-sign aspect (Parashara) by sign:
 * all grahas 7th; Mars 4/8; Jupiter 5/9; Saturn 3/10.
 * Conjunction (same sign) is NOT an aspect here — check separately.
 * Nodes: no classical drishti (matches GRAHA_ASPECTS).
 */
export function hasParasharaAspect(
  sourceSign: Rashi,
  sourceId: GrahaId,
  targetSign: Rashi,
): boolean {
  const diff = wholeSignCount(sourceSign, targetSign)
  const aspects = GRAHA_ASPECTS[sourceId] ?? [7]
  return aspects.includes(diff)
}

export type TransitRelation = 'conjunction' | 'aspect'

export function transitRelationToSign(
  sourceSign: Rashi,
  sourceId: GrahaId,
  targetSign: Rashi,
): TransitRelation | null {
  if (sourceSign === targetSign) return 'conjunction'
  if (hasParasharaAspect(sourceSign, sourceId, targetSign)) return 'aspect'
  return null
}
