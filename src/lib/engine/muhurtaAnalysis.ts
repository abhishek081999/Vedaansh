/**
 * src/lib/engine/muhurtaAnalysis.ts
 * Logic for scoring specific activities based on Panchanga and planetary transits.
 */

import { NakshatraResult, TithiResult, YogaResult, KaranaResult, VaraResult } from './nakshatra'
import { GrahaId, NAKSHATRA_NAMES } from '@/types/astrology'
import { fill, type EngineLang } from '@/lib/engine/lang'
import { termHi, GRAHA_HI } from '@/i18n/jyotish'
import {
  MA_HI,
  MUHURTA_ACTIVITY_LABELS_HI,
  SCORE_LABELS_HI,
  TARA_FACTORS_HI,
  choghadiyaTypeHi,
} from '@/lib/engine/locale/muhurtaAnalysis.hi'
import { panchakaDisplayLabel } from '@/lib/engine/muhurtaAdvanced'

export type MuhurtaActivity =
  | 'BUSINESS'
  | 'TRAVEL'
  | 'REAL_ESTATE'
  | 'RELATIONSHIP'
  | 'HEALTH'
  | 'SPIRITUAL'
  | 'MARRIAGE'
  | 'EDUCATION'
  | 'GENERAL'

/** Canonical activity IDs — use across day-finder UI, timeline UI, and API. */
export const MUHURTA_ACTIVITIES: readonly MuhurtaActivity[] = [
  'BUSINESS',
  'TRAVEL',
  'REAL_ESTATE',
  'RELATIONSHIP',
  'HEALTH',
  'SPIRITUAL',
  'MARRIAGE',
  'EDUCATION',
  'GENERAL',
] as const

export const MUHURTA_ACTIVITY_LABELS: Record<MuhurtaActivity, string> = {
  BUSINESS: 'Business',
  TRAVEL: 'Travel',
  REAL_ESTATE: 'Property',
  RELATIONSHIP: 'Relationship',
  HEALTH: 'Wellness',
  SPIRITUAL: 'Spiritual',
  MARRIAGE: 'Marriage',
  EDUCATION: 'Education',
  GENERAL: 'General',
}

export function muhurtaActivityLabel(activity: MuhurtaActivity, lang: EngineLang = 'en'): string {
  return lang === 'hi' ? MUHURTA_ACTIVITY_LABELS_HI[activity] : MUHURTA_ACTIVITY_LABELS[activity]
}

function displayScoreLabel(label: MuhurtaScore['label'], lang: EngineLang): MuhurtaScore['label'] {
  if (lang !== 'hi') return label
  return SCORE_LABELS_HI[label] as MuhurtaScore['label']
}

function jyotishTerm(name: string, lang: EngineLang): string {
  return lang === 'hi' ? termHi(name) : name
}

function horaLordLabel(lord: GrahaId, lang: EngineLang): string {
  return lang === 'hi' ? (GRAHA_HI[lord] ?? lord) : lord
}

export type ChoghadiyaType = 'Amrit' | 'Shubh' | 'Labh' | 'Chala' | 'Rog' | 'Kaal' | 'Udveg'

export interface MuhurtaScore {
  score: number // 0-100
  label: 'Excellent' | 'Good' | 'Neutral' | 'Challenging' | 'Avoid'
  factors: string[]
  diagnostics?: {
    choghadiya?: { type: string; quality: string }
    panchaka?: { label: string; isAuspicious: boolean; remainder: number }
    taraBala?: { name: string; score: number; favorable: boolean }
    chandraBala?: { house: number; isFavorable: boolean; isChallenging: boolean }
    lagna?: { rashi: number; fit: 'good' | 'avoid' | 'neutral'; note: string }
    gandanta?: { active: boolean; severity: string }
    tyajya?: boolean
    grahan?: { active: boolean; type: string | null }
    dasha?: { maha: string; antar?: string; fit: string }
    sav?: { bindus: number; lagna: number }
  }
}

export function analyzeMuhurta(
  activity: MuhurtaActivity,
  panchang: {
    tithi: TithiResult
    nakshatra: NakshatraResult
    yoga: YogaResult
    karana: KaranaResult
    vara: VaraResult
    isRahuKalam: boolean
    isGulikaKalam: boolean
    isYamaganda: boolean
    isAbhijit: boolean
    horaLord?: GrahaId
    choghadiya?: { type: ChoghadiyaType; quality: 'Good' | 'Neutral' | 'Bad' }
    panchaka?: { isAuspicious: boolean; label: string; remainder: number }
  },
  natal: { moonNak: number; moonSign: number } | null,
  lang: EngineLang = 'en',
): MuhurtaScore {
  let score = 50 // Base score
  const factors: string[] = []
  const diag: NonNullable<MuhurtaScore['diagnostics']> = {}

  // --- Common Factors (Universal) ---
  if (panchang.isRahuKalam) {
    score -= 30
    factors.push(lang === 'hi' ? MA_HI.rahuKalam : 'Rahu Kalam (Negative)')
  }
  if (panchang.isGulikaKalam) {
    score -= 15
    factors.push(lang === 'hi' ? MA_HI.gulikaKalam : 'Gulika Kalam (Negative)')
  }
  if (panchang.isYamaganda) {
    score -= 20
    factors.push(lang === 'hi' ? MA_HI.yamaganda : 'Yamaganda (Negative)')
  }
  if (panchang.isAbhijit && activity !== 'TRAVEL') {
    score += 20
    factors.push(lang === 'hi' ? MA_HI.abhijit : 'Abhijit Muhurta (Highly Auspicious)')
  }

  // --- Yoga quality (Sun+Moon yoga from panchang) ---
  const yogaName = jyotishTerm(panchang.yoga.name, lang)
  if (panchang.yoga.quality === 'auspicious') {
    score += 10
    factors.push(
      lang === 'hi'
        ? fill(MA_HI.yogaAuspicious, { name: yogaName })
        : `Yoga: ${panchang.yoga.name} (Auspicious)`,
    )
  } else if (panchang.yoga.quality === 'inauspicious') {
    score -= 15
    factors.push(
      lang === 'hi'
        ? fill(MA_HI.yogaInauspicious, { name: yogaName })
        : `Yoga: ${panchang.yoga.name} (Inauspicious)`,
    )
  } else {
    factors.push(
      lang === 'hi'
        ? fill(MA_HI.yogaNeutral, { name: yogaName })
        : `Yoga: ${panchang.yoga.name} (Neutral)`,
    )
  }

  // --- Karana / Bhadra (Vishti) ---
  const karanaName = jyotishTerm(panchang.karana.name, lang)
  if (panchang.karana.isBhadra) {
    score -= 25
    factors.push(lang === 'hi' ? MA_HI.karanaBhadra : 'Karana: Bhadra / Vishti (Avoid lasting acts)')
  } else if (panchang.karana.type === 'fixed') {
    score -= 5
    factors.push(
      lang === 'hi'
        ? fill(MA_HI.karanaFixed, { name: karanaName })
        : `Karana: ${panchang.karana.name} (Fixed — mild caution)`,
    )
  } else {
    factors.push(
      lang === 'hi' ? fill(MA_HI.karanaPlain, { name: karanaName }) : `Karana: ${panchang.karana.name}`,
    )
  }

  // Tara / Chandra Bala need the person's Moon; skipped when no chart is loaded.
  if (natal) {
    // --- Tara Bala (Natal Alignment) ---
    const diff = ((panchang.nakshatra.index - natal.moonNak + 27) % 27) + 1
    const tara = diff % 9 || 9
    const taraScores: Record<number, { score: number; name: string; favorable: boolean }> = {
      1: { score: 0, name: 'Janma', favorable: false },
      2: { score: 20, name: 'Sampat (Wealth)', favorable: true },
      3: { score: -20, name: 'Vipat (Caution)', favorable: false },
      4: { score: 15, name: 'Kshem (Safety)', favorable: true },
      5: { score: -15, name: 'Pratyari (Obstacles)', favorable: false },
      6: { score: 20, name: 'Sadhaka (Success)', favorable: true },
      7: { score: -25, name: 'Vadha (Major obstacles)', favorable: false },
      8: { score: 10, name: 'Mitra (Friend)', favorable: true },
      9: { score: 15, name: 'Ati-Mitra (Best Friend)', favorable: true },
    }
    score += taraScores[tara].score
    const taraDisplay =
      lang === 'hi' ? (TARA_FACTORS_HI[tara] ?? taraScores[tara].name) : taraScores[tara].name
    factors.push(lang === 'hi' ? fill(MA_HI.taraBala, { name: taraDisplay }) : `Tara Bala: ${taraScores[tara].name}`)
    diag.taraBala = {
      name: taraDisplay,
      score: taraScores[tara].score,
      favorable: taraScores[tara].favorable,
    }

    // --- Chandra Bala (Moon Sign Alignment) ---
    // Favourable houses 1, 3, 6, 10, 11 from natal Moon (Drik-style; house 7 omitted — see tara-chandra-bala.ts)
    const transitSign = Math.floor(panchang.nakshatra.exactDegree / 30) + 1
    const dist = ((transitSign - natal.moonSign + 12) % 12) + 1
    const favorableDist = [1, 3, 6, 10, 11]
    const challengingDist = [4, 8, 12]
    const isChandraFavorable = favorableDist.includes(dist)
    const isChandraChallenging = challengingDist.includes(dist)
    diag.chandraBala = {
      house: dist,
      isFavorable: isChandraFavorable,
      isChallenging: isChandraChallenging,
    }

    if (isChandraFavorable) {
      score += 15
      factors.push(
        lang === 'hi'
          ? fill(MA_HI.chandraFav, { house: dist })
          : `Chandra Bala: ${dist}th House (Favorable)`,
      )
    } else if (isChandraChallenging) {
      score -= 20
      factors.push(
        lang === 'hi'
          ? fill(MA_HI.chandraHard, { house: dist })
          : `Chandra Bala: ${dist}th House (Challenging)`,
      )
    } else {
      factors.push(
        lang === 'hi'
          ? fill(MA_HI.chandraNeutral, { house: dist })
          : `Chandra Bala: ${dist}th House (Neutral)`,
      )
    }
  }

  // --- Choghadiya ---
  if (panchang.choghadiya) {
    const chogType =
      lang === 'hi' ? choghadiyaTypeHi(panchang.choghadiya.type) : panchang.choghadiya.type
    if (panchang.choghadiya.quality === 'Good') {
      score += 15
      factors.push(
        lang === 'hi'
          ? fill(MA_HI.choghadiyaGood, { type: chogType })
          : `Choghadiya: ${panchang.choghadiya.type} (Good)`,
      )
    } else if (panchang.choghadiya.quality === 'Bad') {
      score -= 20
      factors.push(
        lang === 'hi'
          ? fill(MA_HI.choghadiyaBad, { type: chogType })
          : `Choghadiya: ${panchang.choghadiya.type} (Bad)`,
      )
    }
    diag.choghadiya = { type: panchang.choghadiya.type, quality: panchang.choghadiya.quality }
  }

  // --- Panchaka ---
  if (panchang.panchaka) {
    const pkLabel = panchakaDisplayLabel(
      panchang.panchaka.remainder,
      panchang.panchaka.isAuspicious,
      lang,
    )
    if (!panchang.panchaka.isAuspicious) {
      score -= 15
      factors.push(lang === 'hi' ? fill(MA_HI.panchaka, { label: pkLabel }) : `Panchaka: ${panchang.panchaka.label}`)
    } else {
      factors.push(lang === 'hi' ? MA_HI.panchakaShubh : 'Panchaka: Shubh')
    }
    diag.panchaka = {
      label: pkLabel,
      isAuspicious: panchang.panchaka.isAuspicious,
      remainder: panchang.panchaka.remainder,
    }
  }

  // --- Hora ---
  if (panchang.horaLord) {
    const horaTargets: Record<MuhurtaActivity, GrahaId[]> = {
      BUSINESS: ['Me', 'Ju'],
      TRAVEL: ['Ve', 'Me'],
      REAL_ESTATE: ['Ju', 'Ma'],
      RELATIONSHIP: ['Ve', 'Mo'],
      HEALTH: ['Su', 'Ma'],
      SPIRITUAL: ['Ju', 'Su'],
      MARRIAGE: ['Ve', 'Ju'],
      EDUCATION: ['Ju', 'Me'],
      GENERAL: ['Ju', 'Mo'],
    }
    if (horaTargets[activity].includes(panchang.horaLord)) {
      score += 10
      factors.push(
        lang === 'hi'
          ? fill(MA_HI.horaGood, { lord: horaLordLabel(panchang.horaLord, lang) })
          : `Auspicious Hora: ${panchang.horaLord}`,
      )
    }
  }

  const varaDay = jyotishTerm(panchang.vara.name, lang)
  // Compare by index / number, never by display name (names may be localised or spelled differently)
  const nakIs = (names: string[]) => names.includes(NAKSHATRA_NAMES[panchang.nakshatra.index] ?? '')
  const VARA_NUM: Record<string, number> = { Sunday: 0, Monday: 1, Tuesday: 2, Wednesday: 3, Thursday: 4, Friday: 5, Saturday: 6 }
  const varaIs = (...days: string[]) => days.some(d => VARA_NUM[d] === panchang.vara.number)
  const pakshaTithi = panchang.tithi.number % 15 || 15

  // --- Activity Specific Logic ---
  switch (activity) {
    case 'BUSINESS':
      if ([2, 3, 5, 7, 10, 11, 13].includes(pakshaTithi)) {
        score += 15
        factors.push(lang === 'hi' ? MA_HI.commerceTithi : 'Favorable Tithi for Commerce')
      }
      if (nakIs(['Ashwini', 'Pushya', 'Hasta', 'Chitra', 'Revati'])) {
        score += 15
        factors.push(lang === 'hi' ? MA_HI.prosperityNak : 'Prosperity Nakshatra')
      }
      if (varaIs('Wednesday', 'Thursday')) {
        score += 10
        factors.push(
          lang === 'hi'
            ? fill(MA_HI.mercuryJupiterDay, { day: varaDay })
            : `${panchang.vara.name} (Mercury/Jupiter Day)`,
        )
      }
      break

    case 'TRAVEL':
      if (nakIs(['Ashwini', 'Mrigashira', 'Punarvasu', 'Pushya', 'Hasta', 'Anuradha', 'Shravana', 'Dhanishtha', 'Shatabhisha'])) {
        score += 20
        factors.push(lang === 'hi' ? MA_HI.travelNak : 'Excellent Nakshatra for Journey')
      }
      if (pakshaTithi === 4 || pakshaTithi === 9 || pakshaTithi === 14) { // Rikta, both pakshas
        score -= 20
        factors.push(lang === 'hi' ? MA_HI.riktaTravel : 'Rikta Tithi (Avoid Travel)')
      }
      break

    case 'REAL_ESTATE':
      if (nakIs(['Rohini', 'Mrigashira', 'Chitra', 'Anuradha', 'Revati'])) {
        score += 20
        factors.push(lang === 'hi' ? MA_HI.stabilityNak : 'Stability Nakshatra')
      }
      if (varaIs('Thursday', 'Friday')) {
        score += 10
        factors.push(lang === 'hi' ? MA_HI.auspiciousWeekday : 'Auspicious Weekday')
      }
      break

    case 'SPIRITUAL':
      if (nakIs(['Pushya', 'Shravana'])) {
        score += 25
        factors.push(lang === 'hi' ? MA_HI.divineNak : 'Divine Nakshatra')
      }
      if (panchang.tithi.number === 15 || pakshaTithi === 11) { // Purnima, or Ekadashi in either paksha
        score += 20
        factors.push(lang === 'hi' ? MA_HI.soulTithi : 'Soul-Cleaning Tithi')
      }
      break

    case 'HEALTH':
      if (nakIs(['Ashwini', 'Pushya', 'Hasta'])) {
        score += 20
        factors.push(lang === 'hi' ? MA_HI.healthNak : 'Vibrant Health Nakshatra')
      }
      if (varaIs('Sunday')) {
        score += 10
        factors.push(lang === 'hi' ? MA_HI.sunVitalityDay : 'Sun (Vitality) Day')
      }
      break

    case 'RELATIONSHIP':
      if (nakIs(['Rohini', 'Mrigashira', 'Anuradha', 'Revati'])) {
        score += 20
        factors.push(lang === 'hi' ? MA_HI.harmonyNak : 'Connection Harmony Nakshatra')
      }
      if (varaIs('Friday', 'Monday')) {
        score += 10
        factors.push(lang === 'hi' ? MA_HI.loveEmotionDay : 'Love/Emotion Day')
      }
      break

    case 'MARRIAGE':
      if (nakIs(['Rohini', 'Mrigashira', 'Magha', 'Uttara Phalguni', 'Hasta', 'Swati', 'Anuradha', 'Mula', 'Uttara Ashadha', 'Uttara Bhadra', 'Revati'])) {
        score += 25
        factors.push(lang === 'hi' ? MA_HI.vivahaNak : 'Classical Vivaha Nakshatra')
      }
      if ([2, 3, 5, 7, 10, 11, 13].includes(pakshaTithi)) {
        score += 15
        factors.push(lang === 'hi' ? MA_HI.marriageTithi : 'Strong Marriage Tithi')
      }
      if (varaIs('Friday', 'Thursday')) {
        score += 10
        factors.push(lang === 'hi' ? MA_HI.weddingDay : 'Auspicious Wedding Day')
      }
      break

    case 'EDUCATION':
      if (nakIs(['Rohini', 'Mrigashira', 'Punarvasu', 'Hasta', 'Chitra', 'Swati', 'Anuradha', 'Shravana'])) {
        score += 20
        factors.push(lang === 'hi' ? MA_HI.knowledgeNak : 'Knowledge Seeker Nakshatra')
      }
      if ([2, 5, 6, 7, 10, 11].includes(pakshaTithi)) {
        score += 10
        factors.push(lang === 'hi' ? MA_HI.learningTithi : 'Good Tithi for Learning')
      }
      break

    case 'GENERAL':
      if (panchang.choghadiya?.quality === 'Good') score += 10
      if (panchang.isAbhijit) score += 10
      break
  }

  // Final normalization
  const finalScore = Math.max(0, Math.min(100, score))
  let label: MuhurtaScore['label'] = 'Neutral'
  if (finalScore >= 80) label = 'Excellent'
  else if (finalScore >= 65) label = 'Good'
  else if (finalScore >= 45) label = 'Neutral'
  else if (finalScore >= 30) label = 'Challenging'
  else label = 'Avoid'

  return {
    score: finalScore,
    label: displayScoreLabel(label, lang),
    factors,
    diagnostics: diag,
  }
}
