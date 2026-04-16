// ─────────────────────────────────────────────────────────────
//  src/lib/engine/transits.ts
//  Calculates personal transits for a date range with detailed interpretations
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

const TRANSIT_INTERPRETATIONS: Record<string, Record<number, string>> = {
  Ju: {
    1: "A cycle of personal growth and new beginnings. Confidence and vitality increase.",
    2: "Financial growth and expansion of family resources. Values become more philosophical.",
    3: "Enhanced communication, learning new skills, and supportive short journeys.",
    4: "Expansion of domestic happiness, property gains, and deepened inner peace.",
    5: "Peak creativity, joy through children, and success in education or romance.",
    6: "Success over obstacles, improved health routines, and meaningful service.",
    7: "Expansion in partnerships and public relations. Growth through collaboration.",
    8: "Psychological transformation and gains through legacy or shared resources.",
    9: "Broadening horizons through travel, wisdom, and higher philosophical study.",
    10: "Significant career advancement, social recognition, and professional peak.",
    11: "Fulfillment of long-held desires and great social networking success.",
    12: "Introspective healing, spiritual expansion, and growth in solitude."
  },
  Sa: {
    1: "Discipline of self-identity. A time for building a serious foundation for the future.",
    2: "Focus on financial discipline and long-term security. Restructuring family duties.",
    3: "Mental discipline and hard work in acquiring precise skills or communication.",
    4: "Taking responsibility for domestic life and home-related foundations.",
    5: "Structure in creative pursuits and a serious approach to children's education.",
    6: "Hard work in health management and daily service. Clearing debts/obstacles.",
    7: "Testing and strengthening of commitments. Realism in partnerships.",
    8: "Facing transformations with endurance. Prudence in shared financial matters.",
    9: "Structured approach to higher ethics and long-term vision. Testing beliefs.",
    10: "Heavy professional duties. Integrity leads to solid corporate or social status.",
    11: "Refining social circles. Connecting with serious, goal-oriented groups.",
    12: "Closure of old cycles. Introspection and clearing of subconscious burdens."
  },
  Ra: {
    1: "Ambition for self-projection. A drive to innovate one's public identity.",
    2: "Focus on unconventional wealth creation or change in family values.",
    3: "Courageous communication and curiosity for cutting-edge technology/travel.",
    4: "Restlessness in the domestic sphere. Seeking unconventional roots.",
    5: "Intense focus on creative speculation or unique educational paths.",
    6: "Innovative approaches to health and routine. Winning over subtle enemies.",
    7: "Unconventional attractions in partnerships. Intense focus on the 'Other'.",
    8: "Fascination with hidden secrets or rapid transformational shifts.",
    9: "Quest for foreign wisdom or unconventional spiritual paths.",
    10: "Ambitious drive for fame and status. Unusual paths to career success.",
    11: "Engagement with diverse social networks. Sudden gains through technology.",
    12: "Intense dreams and exploration of foreign lands or subconscious depth."
  },
  Ke: {
    1: "Detachment from self-ego. A cycle of internal focus and spiritual identity.",
    2: "Detachment from material possessions. Focus on inner values and spiritual family.",
    3: "Introspection in communication. Letting go of superficial interests.",
    4: "Letgo of domestic attachments. Focus on inner emotional security.",
    5: "Spiritual approach to creativity and education. Detachment in romance.",
    6: "Transcending daily conflicts. Service without attachment to results.",
    7: "Detachment from public projection. Focus on spiritual/karmic relations.",
    8: "Deep spiritual transformation and letting go of shared attachments.",
    9: "Transcending formal religion. Seeking the essence of wisdom.",
    10: "Detachment from fame and status. Working with a sense of higher purpose.",
    11: "Pruning of social desires. Focus on spiritual communities.",
    12: "Ultimate release and spiritual liberation. High introspective growth."
  }
}

function getDetailedInterpretation(pid: GrahaId, house: number, type: string): string {
  const base = TRANSIT_INTERPRETATIONS[pid]?.[house]
  if (!base) return `${GRAHA_NAMES[pid]} transits your ${house}${getOrdinal(house)} house.`

  switch (type) {
    case 'house_change':
      return `Activation: ${base}`
    case 'retrograde_start':
      return `Reflection: Pause and review themes of ${base.split('.')[0].toLowerCase()}.`
    case 'retrograde_end':
      return `Progress: Direct movement resumes for ${base.split('.')[0].toLowerCase()}.`
    default:
      return base
  }
}

export function calculatePersonalTransits(
  birthAscRashi: number,
  startDate: Date,
  months: number = 12
): TransitEvent[] {
  const events: TransitEvent[] = []
  const planets: GrahaId[] = ['Ju', 'Sa', 'Ra', 'Ke'] // Focus on slow movers for timeline clarity
  
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
            description: `${GRAHA_NAMES[pid]} enters ${RASHI_NAMES[rashi]}. ${getDetailedInterpretation(pid, house, 'sign_change')}`
          })
        }

        // 2. Detect House Change
        if (prev.house !== house) {
          events.push({
            planetId: pid,
            date: dateStr,
            type: 'house_change',
            from: prev.house,
            to: house,
            sign: rashi,
            house,
            description: getDetailedInterpretation(pid, house, 'house_change')
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
            description: `${GRAHA_NAMES[pid]} turns Retrograde. ${getDetailedInterpretation(pid, house, 'retrograde_start')}`
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
            description: `${GRAHA_NAMES[pid]} turns Direct. ${getDetailedInterpretation(pid, house, 'retrograde_end')}`
          })
        }
      }

      prevState[key] = { rashi, house, isRetro }
    }
  }

  // Deduplicate and filter: sometimes house change and sign change happen at the same sampling step.
  // We prefer house change for personal relevance.
  return events.filter((ev, idx, self) => 
    self.findIndex(t => t.date === ev.date && t.planetId === ev.planetId) === idx
  )
}

function getOrdinal(n: number) {
  const s = ["th", "st", "nd", "rd"]
  const v = n % 100
  return s[(v - 20) % 10] || s[v] || s[0]
}
