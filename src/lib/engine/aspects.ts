
import type { GrahaId } from '@/types/astrology'

/**
 * Standard Vedic (Parashari) Aspects
 * Every planet aspects the 7th house (count including the house they reside in).
 * Special aspects:
 * Mars (Ma): 4, 8
 * Jupiter (Ju): 5, 9
 * Saturn (Sa): 3, 10
 * Rahu/Ketu: 5, 9 (standard KP/Modern Vedic)
 */
export const GRAHA_ASPECTS: Record<GrahaId, number[]> = {
  Su: [7],
  Mo: [7],
  Ma: [4, 7, 8],
  Me: [7],
  Ju: [5, 7, 9],
  Ve: [7],
  Sa: [3, 7, 10],
  Ra: [5, 7, 9],
  Ke: [5, 7, 9],
  Ur: [7],
  Ne: [7],
  Pl: [7]
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
 * Get aspected symptoms/tags for the tooltip
 */
export function getAspectDescription(a: number): string {
  if (a === 3) return 'Effort & Valor'
  if (a === 4) return 'Happiness & Home'
  if (a === 5) return 'Wisdom & Children'
  if (a === 7) return 'Direct Influence / Partners'
  if (a === 8) return 'Transformation'
  if (a === 9) return 'Fortune & Grace'
  if (a === 10) return 'Action & Karma'
  return ''
}
