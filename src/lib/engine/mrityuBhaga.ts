// ─────────────────────────────────────────────────────────────
//  src/lib/engine/mrityuBhaga.ts
//  Mrityu Bhaga - Death-Inflicting Degrees
//  Source: Phaladipika, Sarvartha Chintamani
// ─────────────────────────────────────────────────────────────

import type { Rashi, MrityuBhagaResult } from '@/types/astrology'

/**
 * Mrityu Bhaga (Death Degrees)
 * 
 * These are specific degrees in each sign that have a connection to
 * death, transformation, and major life changes. Planets at these
 * degrees can indicate:
 * - Health vulnerabilities
 * - Transformation periods
 * - Near-death experiences
 * - Major life transitions
 * 
 * The term "Mrityu" means death, but in Vedic astrology it often
 * refers to transformation and spiritual rebirth rather than
 * physical death.
 * 
 * Source: Phaladipika Chapter 4, Sarvartha Chintamani
 */

// Mrityu Bhaga degrees for each sign
// These are the exact degrees considered inauspicious for health/longevity
export const MRITYU_BHAGA_DEGREES: Record<Rashi, number> = {
  1:  19,   // Aries: 19°
  2:  7,    // Taurus: 7°
  3:  25,   // Gemini: 25°
  4:  13,   // Cancer: 13°
  5:  1,    // Leo: 1°
  6:  19,   // Virgo: 19°
  7:  7,    // Libra: 7°
  8:  25,   // Scorpio: 25°
  9:  13,   // Sagittarius: 13°
  10: 1,    // Capricorn: 1°
  11: 19,   // Aquarius: 19°
  12: 7,    // Pisces: 7°
}

// Alternative Mrityu Bhaga from different texts (Sarvartha Chintamani)
export const MRITYU_BHAGA_ALT: Record<Rashi, number> = {
  1:  10,   // Aries
  2:  22,   // Taurus
  3:  14,   // Gemini
  4:  26,   // Cancer
  5:  18,   // Leo
  6:  2,    // Virgo
  7:  22,   // Libra
  8:  14,   // Scorpio
  9:  6,    // Sagittarius
  10: 26,   // Capricorn
  11: 18,   // Aquarius
  12: 10,   // Pisces
}

// Orbs for Mrityu Bhaga detection
const MRITYU_ORB_EXACT = 0.5   // Within 0.5° is exact
const MRITYU_ORB_NEAR = 1.5    // Within 1.5° is near
const MRITYU_ORB_WIDE = 3.0    // Within 3° is wide

/**
 * Check if a planet is in Mrityu Bhaga
 * 
 * @param lonSidereal - Sidereal longitude of the planet
 * @param useAlt - Use alternative degrees from Sarvartha Chintamani
 * @returns MrityuBhagaResult with severity and interpretation
 */
export function checkMrityuBhaga(
  lonSidereal: number,
  useAlt = false,
): MrityuBhagaResult {
  const normalized = ((lonSidereal % 360) + 360) % 360
  const rashi = (Math.floor(normalized / 30) + 1) as Rashi
  const degreeInSign = normalized % 30
  
  const mrityuDegrees = useAlt ? MRITYU_BHAGA_ALT : MRITYU_BHAGA_DEGREES
  const mrityuDegree = mrityuDegrees[rashi]
  
  const distance = Math.abs(degreeInSign - mrityuDegree)
  
  // Check severity levels
  if (distance <= MRITYU_ORB_EXACT) {
    return {
      isMrityuBhaga: true,
      severity: 'exact',
      rashi,
      degreeInSign,
      mrityuDegree,
      distanceFromMrityu: distance,
      interpretation: 'This planet is exactly on a Mrityu Bhaga degree, a sensitive point in classical astrology. It can point to big life changes and a need to look after your health. It does not predict any harm. Regular spiritual practice and remedies can help.',
      remedy: 'Worship Lord Shiva. Recite the Maha Mrityunjaya Mantra, a prayer for health and protection. You can also perform Rudra Abhishekam, a Shiva ritual.',
    }
  }
  
  if (distance <= MRITYU_ORB_NEAR) {
    return {
      isMrityuBhaga: true,
      severity: 'near',
      rashi,
      degreeInSign,
      mrityuDegree,
      distanceFromMrityu: distance,
      interpretation: 'This planet is close to a Mrityu Bhaga degree, a sensitive point in classical astrology. It can point to change and a reason to look after your health.',
      remedy: 'Regular prayer and routine health check-ups. You may also consider Mrityunjaya Japa, a healing mantra practice.',
    }
  }
  
  if (distance <= MRITYU_ORB_WIDE) {
    return {
      isMrityuBhaga: true,
      severity: 'wide',
      rashi,
      degreeInSign,
      mrityuDegree,
      distanceFromMrityu: distance,
      interpretation: 'This planet is in the wider zone around a Mrityu Bhaga degree, a sensitive point in classical astrology. Simple care of your health is enough.',
      remedy: 'Maintain good health practices. Regular meditation.',
    }
  }
  
  return {
    isMrityuBhaga: false,
    severity: 'none',
    rashi,
    degreeInSign,
    mrityuDegree,
    distanceFromMrityu: distance,
    interpretation: null,
    remedy: null,
  }
}

/**
 * Check both Mrityu Bhaga systems
 */
export function checkMrityuBhagaBoth(lonSidereal: number): {
  primary: MrityuBhagaResult
  alternative: MrityuBhagaResult
} {
  return {
    primary: checkMrityuBhaga(lonSidereal, false),
    alternative: checkMrityuBhaga(lonSidereal, true),
  }
}

/**
 * Check Mrityu Bhaga for all grahas
 */
export function checkAllMrityuBhaga(
  grahas: Array<{ id: string; lonSidereal: number }>,
): Record<string, MrityuBhagaResult> {
  const result: Record<string, MrityuBhagaResult> = {}
  for (const g of grahas) {
    result[g.id] = checkMrityuBhaga(g.lonSidereal)
  }
  return result
}

/**
 * Get planets in Mrityu Bhaga from a chart
 */
export function getPlanetsInMrityuBhaga(
  grahas: Array<{ id: string; lonSidereal: number }>,
): Array<{ id: string; result: MrityuBhagaResult }> {
  const results: Array<{ id: string; result: MrityuBhagaResult }> = []
  
  for (const g of grahas) {
    const result = checkMrityuBhaga(g.lonSidereal)
    if (result.isMrityuBhaga) {
      results.push({ id: g.id, result })
    }
  }
  
  return results.sort((a, b) => a.result.distanceFromMrityu - b.result.distanceFromMrityu)
}
