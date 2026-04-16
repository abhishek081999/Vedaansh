import { getNakshatra, getVara } from './nakshatra'
import { degreeInSign, signOf } from './ephemeris'
import { RASHI_NAMES, GRAHA_NAMES, type UpagrahaData, type Rashi } from '@/types/astrology'

/**
 * Calculations for Upagrahas (Secondary Planets) and special mathematical points.
 * Includes:
 * 1. Gulika & Maandi (Traditional Yama-based)
 * 2. Apragashtakas (Non-luminous points: Dhooma, Vyatipata, Paridhi, Indrachapa, Upaketu)
 */

interface YamaPart {
  start: number // degrees or hours? We'll use time offset from sunrise/sunset
  end: number
}

/**
 * Calculates Gulika and Maandi positions.
 * Based on the division of Day/Night into 8 equal parts (Yamas).
 * The Saturn part (Shani Yama) determines Gulika.
 */
export function calculateGulikaMaandi(
  jd: number,
  sunrise: Date,
  sunset: Date,
  isDay: boolean,
  dayVara: number, // 0=Sun, 1=Mon, ..., 6=Sat
  ascDegree: number // To help with bhavas if needed, but usually just longitude
): { gulika: number; maandi: number } {
  const durationMs = isDay 
    ? (sunset.getTime() - sunrise.getTime()) 
    : (24 * 3600000 - (sunset.getTime() - sunrise.getTime()))

  const partDurationMs = durationMs / 8

  // Saturn's part index (0-7) for day and night
  // Day: Sun=6, Mon=5, Tue=4, Wed=3, Thu=2, Fri=1, Sat=0
  // Night: Sun=2, Mon=1, Tue=0, Wed=6, Thu=5, Fri=4, Sat=3 (Shifted by 5 lords)
  const daySaturnParts = [6, 5, 4, 3, 2, 1, 0]
  const nightSaturnParts = [2, 1, 0, 6, 5, 4, 3]

  const saturnPartIdx = isDay ? daySaturnParts[dayVara] : nightSaturnParts[dayVara]
  
  // Time from sunrise (day) or sunset (night) to the start of Saturn's part
  const timeOffsetMs = saturnPartIdx * partDurationMs
  
  // To get the longitude, we assume a linear movement of the ascendant or just the start degree.
  // Traditional Jyotish method: Find the Ascendant for the MOMENT Saturn's part begins.
  // This requires re-calculating the ascendant for that specific time.
  // Since we don't have the full orchestrator here, we'll return the time offset and 
  // let the calculator handle the actual SWISSEPH call for the ascendant.
  // But for now, we'll just calculate a proxy if we can't do a full recalculation.
  
  // Wait, the standard way is: Gulika = Ascendant at start of Saturn's part.
  // Maandi = Ascendant at END of Saturn's part (or beginning of next).
  
  return {
    gulika: timeOffsetMs, // return offset in ms
    maandi: (saturnPartIdx + 1) * partDurationMs
  }
}

/**
 * Calculates the Non-luminous planets (Apragashtakas)
 * Based on Sun's sidereal longitude.
 */
export function calculateNonLuminous(sunLon: number): Record<string, number> {
  const dhooma = (sunLon + 133 + 20 / 60) % 360
  const vyatipata = (360 - dhooma) % 360
  const paridhi = (vyatipata + 180) % 360
  const indrachapa = (360 - paridhi) % 360
  const upaketu = (indrachapa + 16 + 40 / 60) % 360

  return {
    Dhooma: dhooma,
    Vyatipata: vyatipata,
    Paridhi: paridhi,
    Indrachapa: indrachapa,
    Upaketu: upaketu
  }
}

/**
 * Beeja Sphuta (for males): Sun + Venus + Jupiter
 */
export function calculateBeejaSphuta(sunLon: number, venusLon: number, jupiterLon: number): number {
  return (sunLon + venusLon + jupiterLon) % 360
}

/**
 * Kshetra Sphuta (for females): Moon + Mars + Jupiter
 */
export function calculateKshetraSphuta(moonLon: number, marsLon: number, jupiterLon: number): number {
  return (moonLon + marsLon + jupiterLon) % 360
}

export function buildUpagrahaData(id: string, lonSidereal: number): UpagrahaData {
  const nak = getNakshatra(lonSidereal)
  const rashi = signOf(lonSidereal) as Rashi
  const deg = degreeInSign(lonSidereal)

  return {
    id,
    name: id,
    lonSidereal,
    rashi,
    rashiName: RASHI_NAMES[rashi],
    degree: deg,
    nakshatraName: nak.name,
    pada: nak.pada,
  }
}
