// ─────────────────────────────────────────────────────────────
//  src/lib/engine/yogiPoint.ts
//  Yogi Point, Sahayogi & Avayogi Calculations
//  Source: Jaimini Sutras, Kalpalatha
// ─────────────────────────────────────────────────────────────

import type { Rashi, GrahaId, YogiPointResult } from '@/types/astrology'
import { NAKSHATRA_LORDS } from '@/types/astrology'
import { fill, type EngineLang } from '@/lib/engine/lang'
import { GRAHA_HI, RASHI_HI } from '@/i18n/jyotish'
import { YOGI_TEXT_HI } from '@/lib/engine/locale/yogiPoint.hi'

/**
 * Yogi Point System
 * 
 * The Yogi Point is a highly auspicious point in the chart that indicates
 * wealth, prosperity, and spiritual growth. It's calculated from the
 * relationship between the Sun and Moon positions.
 * 
 * Key Concepts:
 * - Yogi Point: The most auspicious point for prosperity
 * - Sahayogi: The helping point that supports the Yogi
 * - Avayogi: The obstructing point that hinders prosperity
 * - Yogi Graha: The planet ruling the Yogi sign
 * - Avayogi Graha: The planet that obstructs prosperity
 * 
 * This system is particularly used in:
 * - Financial analysis
 * - Dasha interpretation
 * - Timing of wealth-giving events
 * - Spiritual progress assessment
 */

// Sign lords
const SIGN_LORDS: Record<Rashi, GrahaId> = {
  1: 'Ma', 2: 'Ve', 3: 'Me', 4: 'Mo',
  5: 'Su', 6: 'Me', 7: 'Ve', 8: 'Ma',
  9: 'Ju', 10: 'Sa', 11: 'Sa', 12: 'Ju',
}

/**
 * Calculate Yogi Point and related points (classical rule, as taught by
 * Sanjay Rath / P.V.R. Narasimha Rao and used by Jagannatha Hora):
 * 1. Yogi Point = Sun + Moon + 93°20'
 * 2. Yogi graha = lord of the NAKSHATRA the Yogi Point falls in
 * 3. Sahayogi (duplicate Yogi) = lord of the SIGN the Yogi Point falls in
 * 4. Avayogi Point = Yogi Point + 186°40'; Avayogi graha = its nakshatra lord
 *
 * `sahayogiPoint` equals `yogiPoint`: the duplicate Yogi is a planet, not a
 * separate point; the field stays for the existing result shape.
 *
 * @param sunLon - Sidereal longitude of Sun
 * @param moonLon - Sidereal longitude of Moon
 * @returns YogiPointResult with all calculated points
 */
export function calculateYogiPoint(sunLon: number, moonLon: number): YogiPointResult {
  const sunNorm = ((sunLon % 360) + 360) % 360
  const moonNorm = ((moonLon % 360) + 360) % 360
  const nakLord = (lon: number) => NAKSHATRA_LORDS[Math.min(26, Math.floor(lon / (360 / 27)))]

  const yogiPoint = (sunNorm + moonNorm + 93 + 1 / 3) % 360
  const yogiRashi = (Math.floor(yogiPoint / 30) + 1) as Rashi
  const yogiDegreeInSign = yogiPoint % 30

  const sahayogiPoint = yogiPoint
  const sahayogiRashi = yogiRashi
  const sahayogiDegreeInSign = yogiDegreeInSign

  const avayogiPoint = (yogiPoint + 186 + 2 / 3) % 360
  const avayogiRashi = (Math.floor(avayogiPoint / 30) + 1) as Rashi
  const avayogiDegreeInSign = avayogiPoint % 30

  const yogiGraha = nakLord(yogiPoint)
  const sahayogiGraha = SIGN_LORDS[yogiRashi]
  const avayogiGraha = nakLord(avayogiPoint)

  return {
    yogiPoint,
    yogiRashi,
    yogiDegreeInSign,
    yogiGraha,
    
    sahayogiPoint,
    sahayogiRashi,
    sahayogiDegreeInSign,
    sahayogiGraha,
    
    avayogiPoint,
    avayogiRashi,
    avayogiDegreeInSign,
    avayogiGraha,
    
    interpretation: {
      yogi: `Yogi Point at ${yogiDegreeInSign.toFixed(2)}° in sign ${yogiRashi}. Its nakshatra lord ${yogiGraha} is the Yogi Graha. This point indicates wealth and prosperity.`,
      sahayogi: `The sign lord of the Yogi Point, ${sahayogiGraha}, is the Sahayogi (duplicate Yogi) and supports prosperity.`,
      avayogi: `Avayogi Point at ${avayogiDegreeInSign.toFixed(2)}° in sign ${avayogiRashi}. Its nakshatra lord ${avayogiGraha} may create obstacles to prosperity.`,
    },
    
    remedy: `Strengthen ${yogiGraha} (Yogi Graha) for prosperity. Be mindful of ${avayogiGraha} (Avayogi Graha) periods.`,
  }
}

/**
 * Check if a planet is conjunct the Yogi Point
 */
export function isConjunctYogiPoint(
  planetLon: number,
  yogiPoint: number,
  orb: number = 5,
): boolean {
  let diff = Math.abs(planetLon - yogiPoint) % 360
  if (diff > 180) diff = 360 - diff
  return diff <= orb
}

/**
 * Get planets conjunct Yogi, Sahayogi, or Avayogi points
 */
export function getPlanetsAtYogiPoints(
  grahas: Array<{ id: string; lonSidereal: number }>,
  yogiResult: YogiPointResult,
  orb: number = 5,
): {
  conjunctYogi: string[]
  conjunctSahayogi: string[]
  conjunctAvayogi: string[]
} {
  const conjunctYogi: string[] = []
  // The duplicate Yogi (Sahayogi) is a planet, not a separate point, so no conjunctions.
  const conjunctSahayogi: string[] = []
  const conjunctAvayogi: string[] = []
  
  for (const g of grahas) {
    if (isConjunctYogiPoint(g.lonSidereal, yogiResult.yogiPoint, orb)) {
      conjunctYogi.push(g.id)
    }
    if (isConjunctYogiPoint(g.lonSidereal, yogiResult.avayogiPoint, orb)) {
      conjunctAvayogi.push(g.id)
    }
  }
  
  return { conjunctYogi, conjunctSahayogi, conjunctAvayogi }
}

/**
 * Get wealth potential score based on Yogi system
 * 
 * Factors:
 * - Planets conjunct Yogi Point: +2 each
 * - Planets conjunct Sahayogi: +1 each
 * - Planets conjunct Avayogi: -1 each
 * - Yogi Graha well-placed: +2
 * - Avayogi Graha afflicted: +1 (paradoxically good)
 */
export function calculateYogiWealthScore(
  grahas: Array<{ id: string; lonSidereal: number; rashi: Rashi; dignity: string }>,
  yogiResult: YogiPointResult,
): {
  score: number
  factors: string[]
} {
  const factors: string[] = []
  let score = 0
  
  const { conjunctYogi, conjunctSahayogi, conjunctAvayogi } = getPlanetsAtYogiPoints(
    grahas, yogiResult, 5
  )
  
  // Yogi conjunctions
  for (const id of conjunctYogi) {
    score += 2
    factors.push(`${id} conjunct Yogi Point (+2)`)
  }
  
  // Sahayogi conjunctions
  for (const id of conjunctSahayogi) {
    score += 1
    factors.push(`${id} conjunct Sahayogi Point (+1)`)
  }
  
  // Avayogi conjunctions
  for (const id of conjunctAvayogi) {
    score -= 1
    factors.push(`${id} conjunct Avayogi Point (-1)`)
  }
  
  // Yogi Graha placement
  const yogiGrahaData = grahas.find(g => g.id === yogiResult.yogiGraha)
  if (yogiGrahaData) {
    if (yogiGrahaData.dignity === 'exalted' || yogiGrahaData.dignity === 'own') {
      score += 2
      factors.push(`Yogi Graha (${yogiResult.yogiGraha}) in good dignity (+2)`)
    } else if (yogiGrahaData.dignity === 'debilitated') {
      score -= 1
      factors.push(`Yogi Graha (${yogiResult.yogiGraha}) debilitated (-1)`)
    }
  }
  
  // Avayogi Graha placement (afflicted is good)
  const avayogiGrahaData = grahas.find(g => g.id === yogiResult.avayogiGraha)
  if (avayogiGrahaData) {
    if (avayogiGrahaData.dignity === 'debilitated') {
      score += 1
      factors.push(`Avayogi Graha (${yogiResult.avayogiGraha}) debilitated - obstacles reduced (+1)`)
    }
  }
  
  return { score, factors }
}

/**
 * Interpretation + remedy text in the requested language. English returns the
 * strings stored on the result unchanged; Hindi rebuilds them from its fields.
 */
export function getYogiPointText(
  r: YogiPointResult,
  lang: EngineLang = 'en',
): { interpretation: YogiPointResult['interpretation']; remedy: string } {
  if (lang !== 'hi') return { interpretation: r.interpretation, remedy: r.remedy }
  const row = (tpl: string, rashi: Rashi, deg: number, graha: GrahaId) =>
    fill(tpl, { rashi: RASHI_HI[rashi], deg: deg.toFixed(2), graha: GRAHA_HI[graha] })
  return {
    interpretation: {
      yogi: row(YOGI_TEXT_HI.yogi, r.yogiRashi, r.yogiDegreeInSign, r.yogiGraha),
      sahayogi: row(YOGI_TEXT_HI.sahayogi, r.sahayogiRashi, r.sahayogiDegreeInSign, r.sahayogiGraha),
      avayogi: row(YOGI_TEXT_HI.avayogi, r.avayogiRashi, r.avayogiDegreeInSign, r.avayogiGraha),
    },
    remedy: fill(YOGI_TEXT_HI.remedy, { yogi: GRAHA_HI[r.yogiGraha], avayogi: GRAHA_HI[r.avayogiGraha] }),
  }
}
