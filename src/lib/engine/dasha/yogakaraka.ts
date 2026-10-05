// ─────────────────────────────────────────────────────────────
//  src/lib/engine/dasha/yogakaraka.ts
//  Lagna-wise Yogakaraka, maraka notes, and dasha profile
//  (Laghu Parashari style — educational)
// ─────────────────────────────────────────────────────────────

import type { GrahaId, Rashi } from '@/types/astrology'
import { GRAHA_NAMES } from '@/types/astrology'
import { getMarakaLords } from '@/lib/engine/marakaBadhaka'

export interface YogakarakaInfo {
  /** Primary yogakaraka graha(s); empty when none is classical single YK */
  lords: GrahaId[]
  /** Short note for UI (best combo / substitute) */
  note: string
}

export interface LagnaDashaProfile {
  ascRashi: Rashi
  yogakaraka: YogakarakaInfo
  /** Soft maraka guidance — hardship lords, not life-ending forecasts */
  marakaNote: string
  /** Lagna-specific dasha nuance from classical teaching summaries */
  specialNote: string
}

const RASHI_NAMES_SHORT: Record<Rashi, string> = {
  1: 'Aries',
  2: 'Taurus',
  3: 'Gemini',
  4: 'Cancer',
  5: 'Leo',
  6: 'Virgo',
  7: 'Libra',
  8: 'Scorpio',
  9: 'Sagittarius',
  10: 'Capricorn',
  11: 'Aquarius',
  12: 'Pisces',
}

/** Classical single Yogakaraka + best-combo guidance by lagna. */
export function getYogakaraka(ascRashi: Rashi): YogakarakaInfo {
  switch (ascRashi) {
    case 1: // Aries — no single YK
      return { lords: [], note: 'No single Yogakaraka — Jupiter + Sun synergy is the best combo' }
    case 2: // Taurus
      return { lords: ['Sa'], note: 'Saturn (9th + 10th) is Yogakaraka; Saturn + Mercury is excellent' }
    case 3: // Gemini
      return { lords: ['Ve'], note: 'Venus is key; Mercury + Venus is the best combo' }
    case 4: // Cancer
      return { lords: ['Ma'], note: 'Mars (5th + 10th) is Yogakaraka; Mars + Jupiter supports' }
    case 5: // Leo
      return { lords: ['Ma'], note: 'Mars (4th + 9th) is Yogakaraka; Mars + Jupiter supports' }
    case 6: // Virgo
      return { lords: ['Ve'], note: 'Venus (2nd + 9th) is highly productive; not treated as maraka' }
    case 7: // Libra
      return { lords: ['Sa'], note: 'Saturn (4th + 5th) is Yogakaraka; Saturn + Mercury is excellent' }
    case 8: // Scorpio
      return { lords: [], note: 'No single Yogakaraka — Jupiter + Moon is the best combo' }
    case 9: // Sagittarius
      return { lords: [], note: 'No single Yogakaraka — Mars + Sun is the best combo' }
    case 10: // Capricorn
      return { lords: ['Ve'], note: 'Venus (5th + 10th) is the single Yogakaraka; Venus + Mercury supports' }
    case 11: // Aquarius
      return { lords: ['Ve'], note: 'Venus (4th + 9th) is Yogakaraka' }
    case 12: // Pisces
      return { lords: [], note: 'No single Yogakaraka — Mars + Jupiter + Moon synergy is preferred' }
    default:
      return { lords: [], note: 'Yogakaraka depends on lagna — check house lordships' }
  }
}

export function isYogakarakaLord(ascRashi: Rashi, grahaId: string): boolean {
  return getYogakaraka(ascRashi).lords.includes(grahaId as GrahaId)
}

function specialNoteForLagna(ascRashi: Rashi): string {
  switch (ascRashi) {
    case 1:
      return 'Jupiter alone is mixed (also 12th lord); Venus + Saturn together is especially heavy.'
    case 2:
      return 'Mercury is not treated as maraka here (also 5th lord).'
    case 3:
      return 'Moon is not maraka if unafflicted; Mars and Saturn need care.'
    case 4:
      return 'Saturn (7th + 8th) is the hardship lord; Jupiter remains supportive.'
    case 5:
      return 'Mercury can turn sharp when afflicted; Mars + Jupiter is the productive axis.'
    case 6:
      return 'Venus owns 2nd but also 9th — not treated as pure maraka.'
    case 7:
      return 'Moon + Mercury combinations work well; Mars is the main hardship lord.'
    case 8:
      return 'Jupiter is not maraka (also 5th lord); Jupiter + Moon is preferred.'
    case 9:
      return 'Venus tends inauspicious; Saturn is the main hardship lord.'
    case 10:
      return 'Single Yogakaraka Venus — Mars is the main hardship lord.'
    case 11:
      return 'Jupiter, Moon, and Mars can all feel challenging depending on chart context.'
    case 12:
      return 'Mars as 7th lord does not automatically bring severe hardship; Mercury and Saturn need care.'
    default:
      return 'Interpret dasha lords through house ownership for this lagna.'
  }
}

function marakaNoteForLagna(ascRashi: Rashi): string {
  const lords = getMarakaLords(ascRashi)
  const names = lords.map(id => GRAHA_NAMES[id] ?? id).join(' / ')
  // Soften classical exceptions called out in teaching summaries
  if (ascRashi === 2) {
    return `Classical 2nd/7th lords include ${names}; Mercury’s 5th-lordship softens maraka reading.`
  }
  if (ascRashi === 6) {
    return `Classical 2nd/7th lords include ${names}; Venus also owns 9th so maraka force is weak.`
  }
  if (ascRashi === 8) {
    return `Classical 2nd/7th lords include ${names}; Jupiter also owns 5th so maraka force is weak.`
  }
  return `Hardship (maraka) lords from 2nd/7th: ${names}. Maraka means hardship pressure, not a life-ending forecast.`
}

/** Full lagna profile for Vimshottari UI overlays. */
export function getLagnaDashaProfile(ascRashi: Rashi): LagnaDashaProfile {
  const yogakaraka = getYogakaraka(ascRashi)
  return {
    ascRashi,
    yogakaraka,
    marakaNote: marakaNoteForLagna(ascRashi),
    specialNote: `${RASHI_NAMES_SHORT[ascRashi]} lagna: ${specialNoteForLagna(ascRashi)}`,
  }
}
