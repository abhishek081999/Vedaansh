/**
 * Tara bala (nakshatra cycle from birth star) and Chandra bala (Moon’s sign from natal Moon sign).
 * Rules follow common North Indian / Drik-style muhurta summaries; lineages differ on edge cases.
 */

import { NAKSHATRA_NAMES, RASHI_NAMES, RASHI_SANSKRIT } from '@/types/astrology'
import type { Rashi } from '@/types/astrology'

/** Nine taras in order for distance mod 9 (1 = Janma … 9 = Atimitra). */
export const TARA_NAMES_EN = [
  'Janma',
  'Sampat',
  'Vipat',
  'Kshema',
  'Pratyak',
  'Sadhana',
  'Naidhana',
  'Mitra',
  'Ati-mitra',
] as const

export const TARA_NAMES_SA = [
  'Janma',
  'Sampat',
  'Vipat',
  'Kshema',
  'Pratyak',
  'Sadhana',
  'Naidhana',
  'Mitra',
  'Atimitra',
] as const

/** Hindi tara names, same order as TARA_NAMES_EN. */
export const TARA_NAMES_HI = ['जन्म', 'संपत्', 'विपत्', 'क्षेम', 'प्रत्यरि', 'साधक', 'नैधन', 'मित्र', 'अतिमित्र'] as const

const TARA_HINTS = {
  en: {
    good: 'Generally considered supportive for auspicious work in many almanacs.',
    bad: 'Often avoided for major beginnings in classical muhurta lists; routine activity is fine for many users.',
  },
  hi: {
    good: 'अनेक पंचांगों में शुभ कार्यों के लिए सामान्यतः सहायक मानी जाती है।',
    bad: 'शास्त्रीय मुहूर्त सूचियों में बड़े आरंभ के लिए प्रायः टाली जाती है; सामान्य कार्य अधिकांश लोगों के लिए ठीक हैं।',
  },
}

const CHANDRA_HINTS = {
  en: {
    approx: 'Natal Moon sign was estimated from the middle of your birth nakshatra; for precision, set your birth Moon rashi from the chart.',
    stated: 'Uses your stated natal Moon rashi. Favourable houses 1, 3, 6, 10, 11 from natal Moon are common in Drik-style summaries.',
  },
  hi: {
    approx: 'जन्म चंद्र राशि का अनुमान आपके जन्म नक्षत्र के मध्य से लगाया गया है; सटीकता के लिए कुंडली से अपनी जन्म चंद्र राशि चुनें।',
    stated: 'आपकी बताई गई जन्म चंद्र राशि का उपयोग किया गया है। दृक्-शैली के सारांशों में जन्म चंद्र से 1, 3, 6, 10, 11वें भाव शुभ माने जाते हैं।',
  },
}

/** Tara bala hint in `lang` (the API sends English; pages re-read it in their language). */
export function taraBalaHint(favorable: boolean, lang: 'en' | 'hi' = 'en'): string {
  return favorable ? TARA_HINTS[lang].good : TARA_HINTS[lang].bad
}

export function chandraBalaHint(usedApproxRashi: boolean, lang: 'en' | 'hi' = 'en'): string {
  return usedApproxRashi ? CHANDRA_HINTS[lang].approx : CHANDRA_HINTS[lang].stated
}

/** Favourable for beginnings in many muhurta manuals: Sampat, Kshema, Sadhana, Mitra, Ati-mitra. */
const TARA_FAVORABLE = new Set([2, 4, 6, 8, 9])

/** Chandra bala: Moon favourable in these whole-sign positions from natal Moon. */
const CHANDRA_FAVORABLE_HOUSES = new Set([1, 3, 6, 10, 11])

/** Middle-longitude of nakshatra → approximate natal Moon rashi if user only knows the star. */
export function approxMoonRashiFromNakshatra(nakIndex: number): Rashi {
  const span = 360 / 27
  const midLon = nakIndex * span + span / 2
  const r = (Math.floor(midLon / 30) + 1) as Rashi
  return r
}

export interface TaraBalaResult {
  /** Steps along the 27-nakshatra circle from birth to transit (1–27). */
  distance: number
  /** 1–9 tara type. */
  taraIndex: number
  nameSa: string
  nameEn: string
  favorable: boolean
  hint: string
}

export function computeTaraBala(birthNakIndex: number, transitNakIndex: number): TaraBalaResult {
  const d = ((transitNakIndex - birthNakIndex + 27) % 27) + 1
  const taraNumber = ((d - 1) % 9) + 1
  const favorable = TARA_FAVORABLE.has(taraNumber)
  const hint = taraBalaHint(favorable)

  return {
    distance: d,
    taraIndex: taraNumber,
    nameSa: TARA_NAMES_SA[taraNumber - 1],
    nameEn: TARA_NAMES_EN[taraNumber - 1],
    favorable,
    hint,
  }
}

export interface ChandraBalaResult {
  birthMoonRashi: Rashi
  transitMoonRashi: Rashi
  /** 1 = same sign as natal Moon, 2 = next sign, …, 12 = sign before natal. */
  houseFromNatalMoon: number
  favorable: boolean
  usedApproxRashi: boolean
  hint: string
}

export function computeChandraBala(
  birthMoonRashi: Rashi,
  transitMoonRashi: Rashi,
  usedApproxRashi: boolean,
): ChandraBalaResult {
  const houseFromNatalMoon = ((transitMoonRashi - birthMoonRashi + 12) % 12) + 1
  const favorable = CHANDRA_FAVORABLE_HOUSES.has(houseFromNatalMoon)
  const hint = chandraBalaHint(usedApproxRashi)

  return {
    birthMoonRashi,
    transitMoonRashi,
    houseFromNatalMoon,
    favorable,
    usedApproxRashi,
    hint,
  }
}

export function personalBalaPayload(
  birthNakIndex: number,
  transitNakIndex: number,
  transitMoonRashi: Rashi,
  explicitBirthMoonRashi: number | undefined,
): {
  birthNak: number
  birthNakName: string
  transitNakIndex: number
  transitNakName: string
  tara: TaraBalaResult
  chandra: ChandraBalaResult & {
    birthRashi: { sa: string; en: string }
    transitRashi: { sa: string; en: string }
  }
} {
  const usedApprox = explicitBirthMoonRashi == null
  const birthRashi = (explicitBirthMoonRashi ?? approxMoonRashiFromNakshatra(birthNakIndex)) as Rashi
  const ch = computeChandraBala(birthRashi, transitMoonRashi, usedApprox)

  return {
    birthNak: birthNakIndex,
    birthNakName: NAKSHATRA_NAMES[birthNakIndex],
    transitNakIndex,
    transitNakName: NAKSHATRA_NAMES[transitNakIndex],
    tara: computeTaraBala(birthNakIndex, transitNakIndex),
    chandra: {
      ...ch,
      birthRashi: rashiLabel(ch.birthMoonRashi),
      transitRashi: rashiLabel(ch.transitMoonRashi),
    },
  }
}

export function rashiLabel(r: Rashi): { sa: string; en: string } {
  return { sa: RASHI_SANSKRIT[r], en: RASHI_NAMES[r] }
}
