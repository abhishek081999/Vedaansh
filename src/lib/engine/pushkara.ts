// ─────────────────────────────────────────────────────────────
//  src/lib/engine/pushkara.ts
//  Puṣkara Navāṃśa - Auspicious Navamsha for Remedies
//  Source: Brihat Parashara Hora Shastra, Deva Keralam
// ─────────────────────────────────────────────────────────────

import type { Rashi, PushkaraResult } from '@/types/astrology'

/**
 * Puṣkara Navāṃśa (Auspicious Navamsha)
 * 
 * Puṣkara means "lotus" - these are highly auspicious divisions in each sign
 * where remedies and spiritual practices are 1000x more effective.
 * 
 * Planets transiting or placed in these Navamshas:
 * - Have enhanced positive effects
 * - Remedies performed during these transits are highly effective
 * - Good for starting auspicious activities
 */

// Puṣkara Navāṃśa for each sign (which navamsha is auspicious)
// These are the navamsha numbers (1-9) that are Pushkara navamshas
export const PUSHKARA_NAVAMSHA: Record<Rashi, number[]> = {
  1:  [7, 9],    // Aries: 7th (20°00′-23°20′) and 9th (26°40′-30°00′)
  2:  [3, 5],    // Taurus: 3rd (06°40′-10°00′) and 5th (13°20′-16°40′)
  3:  [6, 8],    // Gemini: 6th (16°40′-20°00′) and 8th (23°20′-26°40′)
  4:  [1, 3],    // Cancer: 1st (00°00′-03°20′) and 3rd (06°40′-10°00′)
  5:  [7, 9],    // Leo: 7th (20°00′-23°20′) and 9th (26°40′-30°00′)
  6:  [3, 5],    // Virgo: 3rd (06°40′-10°00′) and 5th (13°20′-16°40′)
  7:  [6, 8],    // Libra: 6th (16°40′-20°00′) and 8th (23°20′-26°40′)
  8:  [1, 3],    // Scorpio: 1st (00°00′-03°20′) and 3rd (06°40′-10°00′)
  9:  [7, 9],    // Sagittarius: 7th (20°00′-23°20′) and 9th (26°40′-30°00′)
  10: [3, 5],    // Capricorn: 3rd (06°40′-10°00′) and 5th (13°20′-16°40′)
  11: [6, 8],    // Aquarius: 6th (16°40′-20°00′) and 8th (23°20′-26°40′)
  12: [1, 3],    // Pisces: 1st (00°00′-03°20′) and 3rd (06°40′-10°00′)
}

/**
 * Check if a planet is in Puṣkara Navāṃśa
 * 
 * @param lonSidereal - Sidereal longitude of the planet
 * @returns PushkaraResult with navamsha info
 */
export function checkPushkara(lonSidereal: number): PushkaraResult {
  const normalized = ((lonSidereal % 360) + 360) % 360
  const rashi = (Math.floor(normalized / 30) + 1) as Rashi
  const degreeInSign = normalized % 30
  
  // Calculate navamsha (1-9)
  const navamsha = Math.floor(degreeInSign / (30 / 9)) + 1
  
  const pushkaraNav = PUSHKARA_NAVAMSHA[rashi]
  
  // Check if in Puṣkara Navāṃśa
  const inPushkaraNavamsha = pushkaraNav.includes(navamsha)
  
  if (inPushkaraNavamsha) {
    return {
      isPushkara: true,
      type: 'pushkara_navamsha',
      rashi,
      degreeInSign,
      navamsha,
      isPushkaraNavamsha: true,
      remedy: 'Planet is in Pushkara Navamsha. Good for remedies and spiritual activities. Results are 1000x more effective.',
    }
  }
  
  return {
    isPushkara: false,
    type: null,
    rashi,
    degreeInSign,
    navamsha,
    isPushkaraNavamsha: false,
    remedy: null,
  }
}

/**
 * Check Puṣkara for all grahas
 */
export function checkAllPushkara(
  grahas: Array<{ id: string; lonSidereal: number }>,
): Record<string, PushkaraResult> {
  const result: Record<string, PushkaraResult> = {}
  for (const g of grahas) {
    result[g.id] = checkPushkara(g.lonSidereal)
  }
  return result
}
