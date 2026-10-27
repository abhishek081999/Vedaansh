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
      return { lords: [], note: 'There is no single yogakaraka. Jupiter with the Sun is the strongest pairing.' }
    case 2: // Taurus
      return { lords: ['Sa'], note: 'Saturn, lord of the 9th and the 10th, is yogakaraka. Saturn with Mercury is excellent.' }
    case 3: // Gemini
      return { lords: ['Ve'], note: 'Venus is the key planet. Mercury with Venus is the strongest pairing.' }
    case 4: // Cancer
      return { lords: ['Ma'], note: 'Mars, lord of the 5th and the 10th, is yogakaraka. Mars with Jupiter supports it.' }
    case 5: // Leo
      return { lords: ['Ma'], note: 'Mars, lord of the 4th and the 9th, is yogakaraka. Mars with Jupiter supports it.' }
    case 6: // Virgo
      return { lords: ['Ve'], note: 'Venus, lord of the 2nd and the 9th, is highly productive, and is not read as a maraka.' }
    case 7: // Libra
      return { lords: ['Sa'], note: 'Saturn, lord of the 4th and the 5th, is yogakaraka. Saturn with Mercury is excellent.' }
    case 8: // Scorpio
      return { lords: [], note: 'There is no single yogakaraka. Jupiter with the Moon is the strongest pairing.' }
    case 9: // Sagittarius
      return { lords: [], note: 'There is no single yogakaraka. Mars with the Sun is the strongest pairing.' }
    case 10: // Capricorn
      return { lords: ['Ve'], note: 'Venus, lord of the 5th and the 10th, is the single yogakaraka. Venus with Mercury supports it.' }
    case 11: // Aquarius
      return { lords: ['Ve'], note: 'Venus, lord of the 4th and the 9th, is yogakaraka.' }
    case 12: // Pisces
      return { lords: [], note: 'There is no single yogakaraka. Mars with Jupiter and the Moon is the preferred pairing.' }
    default:
      return { lords: [], note: 'Yogakaraka depends on the lagna. Read it from the house lordships.' }
  }
}

export function isYogakarakaLord(ascRashi: Rashi, grahaId: string): boolean {
  return getYogakaraka(ascRashi).lords.includes(grahaId as GrahaId)
}

function specialNoteForLagna(ascRashi: Rashi): string {
  switch (ascRashi) {
    case 1:
      return 'Jupiter alone is mixed, because it also rules the 12th. Venus with Saturn is especially heavy.'
    case 2:
      return 'Mercury is not read as a maraka here, because it also rules the 5th.'
    case 3:
      return 'The Moon is not a maraka if it is unafflicted. Mars and Saturn need care.'
    case 4:
      return 'Saturn, lord of the 7th and the 8th, is the hardship lord. Jupiter remains supportive.'
    case 5:
      return 'Mercury can turn sharp when it is afflicted. Mars with Jupiter is the productive axis.'
    case 6:
      return 'Venus rules the 2nd, and also the 9th, so it is not read as a pure maraka.'
    case 7:
      return 'The Moon with Mercury works well. Mars is the main hardship lord.'
    case 8:
      return 'Jupiter is not a maraka, because it also rules the 5th. Jupiter with the Moon is preferred.'
    case 9:
      return 'Venus tends to be inauspicious. Saturn is the main hardship lord.'
    case 10:
      return 'Venus is the single yogakaraka. Mars is the main hardship lord.'
    case 11:
      return 'Jupiter, the Moon, and Mars can each feel challenging, according to the chart.'
    case 12:
      return 'Mars as lord of the 7th does not by itself bring severe hardship. Mercury and Saturn need care.'
    default:
      return 'Read the dasha lords through the houses they own for this lagna.'
  }
}

function marakaNoteForLagna(ascRashi: Rashi): string {
  const lords = getMarakaLords(ascRashi)
  const names = lords.map(id => GRAHA_NAMES[id] ?? id).join(' / ')
  // Soften classical exceptions called out in teaching summaries
  if (ascRashi === 2) {
    return `The classical lords of the 2nd and the 7th include ${names}. Mercury’s lordship of the 5th softens the maraka reading.`
  }
  if (ascRashi === 6) {
    return `The classical lords of the 2nd and the 7th include ${names}. Venus also rules the 9th, so the maraka force is weak.`
  }
  if (ascRashi === 8) {
    return `The classical lords of the 2nd and the 7th include ${names}. Jupiter also rules the 5th, so the maraka force is weak.`
  }
  return `Hardship lords, the marakas, from the 2nd and the 7th: ${names}. Maraka means the pressure of hardship. It is not a forecast of the end of life.`
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
