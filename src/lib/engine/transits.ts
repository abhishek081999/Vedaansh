// ─────────────────────────────────────────────────────────────
//  src/lib/engine/transits.ts
//  Calculates personal transits for a date range
// ─────────────────────────────────────────────────────────────

import { 
  SWISSEPH_IDS, 
  dateToJD, 
  getPlanetPosition, 
  signOf 
} from './ephemeris'
import { GRAHA_NAMES, RASHI_NAMES, type GrahaId, type Rashi } from '@/types/astrology'

export interface TransitEvent {
  planetId:  GrahaId
  date:      string
  type:      'sign_change' | 'house_change' | 'retrograde_start' | 'retrograde_end'
  from:      number | string
  to:        number | string
  sign:      Rashi
  house:     number
  description: string
}

export function calculatePersonalTransits(
  birthAscRashi: number,
  startDate: Date,
  months: number = 12
): TransitEvent[] {
  const events: TransitEvent[] = []
  const planets: GrahaId[] = ['Ju', 'Sa', 'Ra'] // Focus on slow movers for timeline clarity
  
  // Track state to detect changes
  const prevState: Record<string, { rashi: number; house: number; isRetro: boolean }> = {}

  // Sample every 5 days for 12 months (approx 72 samples)
  for (let i = 0; i <= months * 30; i += 5) {
    const currentDate = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000)
    const jd = dateToJD(currentDate)
    const dateStr = currentDate.toISOString().split('T')[0]

    for (const pid of planets) {
      const pos = getPlanetPosition(jd, SWISSEPH_IDS[pid as keyof typeof SWISSEPH_IDS] || SWISSEPH_IDS.Ju, true)
      const rashi = signOf(pos.longitude) as Rashi
      
      // Calculate house (relative to natal Ascendant)
      // House 1 is the sign of the Ascendant
      const house = ((rashi - birthAscRashi + 12) % 12) + 1
      const isRetro = pos.isRetro

      const key = pid
      if (prevState[key]) {
        const prev = prevState[key]

        // 1. Detect Sign Change
        if (prev.rashi !== rashi) {
          events.push({
            planetId: pid,
            date: dateStr,
            type: 'sign_change',
            from: prev.rashi,
            to: rashi,
            sign: rashi,
            house,
            description: `${GRAHA_NAMES[pid]} enters ${RASHI_NAMES[rashi]}`
          })
        }

        // 2. Detect House Change (usually happens with sign change in Whole Sign houses)
        if (prev.house !== house) {
          events.push({
            planetId: pid,
            date: dateStr,
            type: 'house_change',
            from: prev.house,
            to: house,
            sign: rashi,
            house,
            description: `${GRAHA_NAMES[pid]} enters your ${house}${getOrdinal(house)} house`
          })
        }

        // 3. Detect Retrograde Changes
        if (!prev.isRetro && isRetro) {
          events.push({
            planetId: pid,
            date: dateStr,
            type: 'retrograde_start',
            from: 'Direct',
            to: 'Retrograde',
            sign: rashi,
            house,
            description: `${GRAHA_NAMES[pid]} turns Retrograde in ${RASHI_NAMES[rashi]}`
          })
        } else if (prev.isRetro && !isRetro) {
          events.push({
            planetId: pid,
            date: dateStr,
            type: 'retrograde_end',
            from: 'Retrograde',
            to: 'Direct',
            sign: rashi,
            house,
            description: `${GRAHA_NAMES[pid]} turns Direct in ${RASHI_NAMES[rashi]}`
          })
        }
      }

      prevState[key] = { rashi, house, isRetro }
    }
  }

  return events
}

function getOrdinal(n: number) {
  const s = ["th", "st", "nd", "rd"]
  const v = n % 100
  return s[(v - 20) % 10] || s[v] || s[0]
}
