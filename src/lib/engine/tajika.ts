
import { type GrahaData, type Rashi, type GrahaId } from '@/types/astrology'

export interface TajikaYoga {
  name: string
  graha1: GrahaId
  graha2: GrahaId
  description: string
  type: 'auspicious' | 'inauspicious' | 'neutral'
}

/**
 * Muntha: Starts in natal ascendant rashi at birth (Age 0).
 * Moves 1 Rashi per year.
 */
export function getMunthaRashi(natalAscRashi: Rashi, completedAge: number): Rashi {
  const rIdx = ((natalAscRashi - 1 + completedAge) % 12) + 1
  return rIdx as Rashi
}

/**
 * Panchadhikari candidate selection for Lord of the Year (Varsheshwara).
 * 1. Muntha Lord (Ruler of Muntha Rashi in SR chart)
 * 2. Janma Lagna Lord (Natal Asc Lord)
 * 3. Varsha Lagna Lord (Solar Return Asc Lord)
 * 4. Dina/Ratri Pati (Sun if day, Moon if night)
 * 5. Thamthra Lord (Lord of Sun's rashi or Moon's rashi based on day/night)
 */
export function getYearLordCandidates(
  natalAscRashi: Rashi,
  srAscRashi: Rashi,
  munthaRashi: Rashi,
  srSunRashi: Rashi,
  srMoonRashi: Rashi,
  isDayBirth: boolean
) {
  // Simplified logic for now
  return {
    munthaLord: getRashiLord(munthaRashi),
    natalAscLord: getRashiLord(natalAscRashi),
    srAscLord: getRashiLord(srAscRashi),
    dinaRatriLord: isDayBirth ? 'Su' : 'Mo',
  }
}

/**
 * Simple Lord mapping (Classical)
 */
function getRashiLord(r: Rashi): GrahaId {
  const lords: Record<number, GrahaId> = {
    1: 'Ma', 2: 'Ve', 3: 'Me', 4: 'Mo', 5: 'Su', 6: 'Me',
    7: 'Ve', 8: 'Ma', 9: 'Ju', 10: 'Sa', 11: 'Sa', 12: 'Ju'
  }
  return lords[r] || 'Su'
}

/**
 * Tajika Aspects:
 * Friendly: 3, 5, 9, 11 (3/11 and 5/9)
 * Hostile: 1, 4, 7, 10
 * Neutral: 2, 6, 8, 12
 */
export function checkTajikaAspect(r1: Rashi, r2: Rashi) {
  const diff = ((r2 - r1 + 12) % 12) + 1
  if ([3, 5, 9, 11].includes(diff)) return 'friendly'
  if ([4, 7, 10].includes(diff)) return 'hostile'
  if (diff === 1) return 'hostile' // Conjunction
  return 'neutral'
}

/**
 * 16 Tajika Yogas (Basic Implementation of primary ones)
 * 1. Ithasala: Fast planet behind slow planet, applying aspect.
 */
export function getTajikaYogas(grahas: GrahaData[]): TajikaYoga[] {
  const yogas: TajikaYoga[] = []
  
  // Speed order (Classical Tajika)
  const speeds: Record<string, number> = {
    Mo: 1, Me: 2, Ve: 3, Su: 4, Ma: 5, Ju: 6, Sa: 7 // Higher is slower
  }

  for (let i = 0; i < grahas.length; i++) {
    for (let j = i + 1; j < grahas.length; j++) {
      const g1 = grahas[i]
      const g2 = grahas[j]
      
      if (!speeds[g1.id] || !speeds[g2.id]) continue
      
      const aspect = checkTajikaAspect(g1.rashi, g2.rashi)
      if (aspect === 'neutral') continue

      // Ithasala check (Simplified: fast planet at lower degree than slow planet in aspecting signs)
      const p1 = speeds[g1.id] < speeds[g2.id] ? g1 : g2 // fast
      const p2 = speeds[g1.id] < speeds[g2.id] ? g2 : g1 // slow
      
      if (p1.degree < p2.degree && (p2.degree - p1.degree) < 12) {
         yogas.push({
           name: 'Ithasala',
           graha1: p1.id,
           graha2: p2.id,
           type: aspect === 'friendly' ? 'auspicious' : 'inauspicious',
           description: `${p1.id} (fast) is applying to ${p2.id} (slow) — results indicated shortly.`
         })
      }
    }
  }
  
  return yogas
}
