/**
 * src/lib/engine/muhurtaElection.ts
 * Advanced electional overlays: lagna fitness, Moon gandanta, tyajya (visha),
 * approximate grahan yoga, dasha affinity, SAV bindus at lagna.
 */

import type { GrahaId } from '@/types/astrology'
import { checkGandanta } from '@/lib/engine/gandanta'
import {
  analyzeMuhurta,
  type MuhurtaActivity,
  type MuhurtaScore,
} from '@/lib/engine/muhurtaAnalysis'

/** Preferred / avoided lagna rashis (1–12) for common acts. */
export const ELECTIONAL_LAGNA: Record<
  MuhurtaActivity,
  { good: number[]; avoid: number[]; note: string }
> = {
  MARRIAGE: {
    good: [2, 5, 7, 8, 11],
    avoid: [1, 4, 10],
    note: 'Fixed / Venus-friendly lagna preferred for vivaha',
  },
  TRAVEL: {
    good: [1, 4, 7, 10],
    avoid: [2, 5, 8, 11],
    note: 'Movable lagna supports journeys',
  },
  BUSINESS: {
    good: [2, 3, 6, 7, 9, 11],
    avoid: [8, 12],
    note: 'Mercury / Jupiter / Venus signs for commerce',
  },
  REAL_ESTATE: {
    good: [2, 4, 5, 8, 11],
    avoid: [1, 7, 10],
    note: 'Fixed / earthy lagna for property',
  },
  RELATIONSHIP: {
    good: [2, 4, 7, 11],
    avoid: [6, 8, 12],
    note: 'Venus / Moon friendly lagna',
  },
  HEALTH: {
    good: [1, 5, 9],
    avoid: [6, 8, 12],
    note: 'Fire / vitality lagna; avoid dusthana lagna',
  },
  SPIRITUAL: {
    good: [4, 8, 9, 12],
    avoid: [3, 6],
    note: 'Water / dharma lagna for sadhana',
  },
  EDUCATION: {
    good: [2, 3, 6, 9],
    avoid: [8, 12],
    note: 'Mercury / Jupiter lagna for learning',
  },
  GENERAL: {
    good: [2, 5, 9, 11],
    avoid: [6, 8, 12],
    note: 'Stable auspicious lagna',
  },
}

/**
 * Tyajya (visha-style) start ghati within each nakshatra (0–26), from classical
 * almanac tables used by many North Indian panchangs. Span ≈ 4 ghatis.
 * 1 ghati = 1/60 of nakshatra ≈ 0.222…°.
 */
const TYAJYA_START_GHATI: number[] = [
  50, 24, 30, 40, 50, 20, 36, 40, 48, 20, 15, 30,
  16, 24, 36, 24, 40, 20, 20, 15, 20, 14, 10, 14,
  36, 24, 30,
]
const TYAJYA_SPAN_GHATI = 4
const NAK_SPAN = 360 / 27

export function isTyajyaPortion(nakIndex: number, degreeInNak: number): boolean {
  const idx = ((nakIndex % 27) + 27) % 27
  const startDeg = (TYAJYA_START_GHATI[idx] / 60) * NAK_SPAN
  const endDeg = startDeg + (TYAJYA_SPAN_GHATI / 60) * NAK_SPAN
  return degreeInNak >= startDeg && degreeInNak < endDeg
}

/** Approximate grahan yoga: Sun–Moon conjunction/opposition within orb (not a Swiss-Ephemeris eclipse). */
export function checkGrahanYoga(
  sunLonSidereal: number,
  moonLonSidereal: number,
  orbDeg = 12,
): { active: boolean; type: 'solar' | 'lunar' | null; separation: number } {
  let sep = Math.abs(moonLonSidereal - sunLonSidereal) % 360
  if (sep > 180) sep = 360 - sep
  if (sep <= orbDeg) return { active: true, type: 'solar', separation: sep }
  if (Math.abs(sep - 180) <= orbDeg) {
    return { active: true, type: 'lunar', separation: Math.abs(sep - 180) }
  }
  return { active: false, type: null, separation: sep }
}

/** Lords often supportive for an activity (mahadasha affinity). */
const DASHA_FRIENDLY: Record<MuhurtaActivity, GrahaId[]> = {
  BUSINESS: ['Me', 'Ju', 'Su'],
  TRAVEL: ['Mo', 'Me', 'Ve'],
  REAL_ESTATE: ['Ma', 'Sa', 'Ju'],
  RELATIONSHIP: ['Ve', 'Mo'],
  HEALTH: ['Su', 'Ma', 'Ju'],
  SPIRITUAL: ['Ju', 'Ke', 'Sa'],
  MARRIAGE: ['Ve', 'Ju', 'Mo'],
  EDUCATION: ['Me', 'Ju'],
  GENERAL: ['Ju', 'Ve', 'Mo'],
}

const DASHA_HARD: Record<MuhurtaActivity, GrahaId[]> = {
  BUSINESS: ['Sa', 'Ra'],
  TRAVEL: ['Ra', 'Ke', 'Sa'],
  REAL_ESTATE: ['Ra', 'Ke'],
  RELATIONSHIP: ['Sa', 'Ra', 'Ke'],
  HEALTH: ['Sa', 'Ra', 'Ke'],
  SPIRITUAL: ['Ma', 'Ra'],
  MARRIAGE: ['Sa', 'Ra', 'Ke', 'Ma'],
  EDUCATION: ['Ra', 'Ke'],
  GENERAL: ['Ra', 'Ke'],
}

export interface MuhurtaAdvancedInput {
  lagnaRashi?: number
  moonLonSidereal?: number
  sunLonSidereal?: number
  dasha?: { maha: GrahaId; antar?: GrahaId }
  /** SAV bindus by rashi index 0=Aries … 11=Pisces */
  savBindusByRashi?: number[]
}

/**
 * Apply advanced electional overlays onto a base MuhurtaScore (mutates copy).
 */
export function applyMuhurtaAdvanced(
  activity: MuhurtaActivity,
  base: MuhurtaScore,
  adv: MuhurtaAdvancedInput,
): MuhurtaScore {
  let score = base.score
  const factors = [...base.factors]
  const diagnostics = { ...(base.diagnostics ?? {}) } as NonNullable<MuhurtaScore['diagnostics']> & {
    lagna?: { rashi: number; fit: 'good' | 'avoid' | 'neutral'; note: string }
    gandanta?: { active: boolean; severity: string }
    tyajya?: boolean
    grahan?: { active: boolean; type: string | null }
    dasha?: { maha: string; antar?: string; fit: string }
    sav?: { bindus: number; lagna: number }
  }

  if (adv.lagnaRashi && adv.lagnaRashi >= 1 && adv.lagnaRashi <= 12) {
    const rules = ELECTIONAL_LAGNA[activity]
    let fit: 'good' | 'avoid' | 'neutral' = 'neutral'
    if (rules.good.includes(adv.lagnaRashi)) {
      fit = 'good'
      score += 12
      factors.push(`Electional lagna R${adv.lagnaRashi} (Favorable)`)
    } else if (rules.avoid.includes(adv.lagnaRashi)) {
      fit = 'avoid'
      score -= 12
      factors.push(`Electional lagna R${adv.lagnaRashi} (Less suited)`)
    } else {
      factors.push(`Electional lagna R${adv.lagnaRashi} (Neutral)`)
    }
    diagnostics.lagna = { rashi: adv.lagnaRashi, fit, note: rules.note }
  }

  if (typeof adv.moonLonSidereal === 'number') {
    const g = checkGandanta(adv.moonLonSidereal)
    if (g.isGandanta) {
      const pen = g.severity === 'exact' ? 25 : 12
      score -= pen
      factors.push(`Moon Gandanta (${g.severity})`)
      diagnostics.gandanta = { active: true, severity: g.severity }
    } else {
      diagnostics.gandanta = { active: false, severity: 'none' }
    }

    const degInNak = ((adv.moonLonSidereal % 360) + 360) % 360 % NAK_SPAN
    const nakIndex = Math.floor((((adv.moonLonSidereal % 360) + 360) % 360) / NAK_SPAN)
    if (isTyajyaPortion(nakIndex, degInNak)) {
      score -= 18
      factors.push('Tyajya / Visha portion of Nakshatra')
      diagnostics.tyajya = true
    } else {
      diagnostics.tyajya = false
    }
  }

  if (typeof adv.sunLonSidereal === 'number' && typeof adv.moonLonSidereal === 'number') {
    const gr = checkGrahanYoga(adv.sunLonSidereal, adv.moonLonSidereal)
    if (gr.active) {
      score -= 30
      factors.push(`Grahan yoga (${gr.type}) — avoid major beginnings`)
      diagnostics.grahan = { active: true, type: gr.type }
    } else {
      diagnostics.grahan = { active: false, type: null }
    }
  }

  if (adv.dasha?.maha) {
    const friendly = DASHA_FRIENDLY[activity]
    const hard = DASHA_HARD[activity]
    let fit = 'neutral'
    if (friendly.includes(adv.dasha.maha)) {
      score += 10
      fit = 'supportive'
      factors.push(`Mahadasha ${adv.dasha.maha} supportive for ${activity}`)
    } else if (hard.includes(adv.dasha.maha)) {
      score -= 10
      fit = 'challenging'
      factors.push(`Mahadasha ${adv.dasha.maha} challenging for ${activity}`)
    }
    if (adv.dasha.antar && hard.includes(adv.dasha.antar)) {
      score -= 5
      factors.push(`Antardasha ${adv.dasha.antar} caution`)
    }
    diagnostics.dasha = {
      maha: adv.dasha.maha,
      antar: adv.dasha.antar,
      fit,
    }
  }

  if (
    adv.lagnaRashi &&
    adv.savBindusByRashi &&
    adv.savBindusByRashi.length === 12
  ) {
    const bindus = adv.savBindusByRashi[adv.lagnaRashi - 1] ?? 0
    diagnostics.sav = { bindus, lagna: adv.lagnaRashi }
    if (bindus >= 30) {
      score += 8
      factors.push(`SAV at lagna: ${bindus} bindus (Strong)`)
    } else if (bindus <= 22) {
      score -= 8
      factors.push(`SAV at lagna: ${bindus} bindus (Weak)`)
    } else {
      factors.push(`SAV at lagna: ${bindus} bindus`)
    }
  }

  const finalScore = Math.max(0, Math.min(100, score))
  let label: MuhurtaScore['label'] = 'Neutral'
  if (finalScore >= 80) label = 'Excellent'
  else if (finalScore >= 65) label = 'Good'
  else if (finalScore >= 45) label = 'Neutral'
  else if (finalScore >= 30) label = 'Challenging'
  else label = 'Avoid'

  return {
    score: finalScore,
    label,
    factors,
    diagnostics: diagnostics as MuhurtaScore['diagnostics'],
  }
}

export function lagnaRashiName(r: number): string {
  const names = [
    'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
    'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces',
  ]
  return names[((r - 1) % 12 + 12) % 12] ?? `R${r}`
}

/** Base panchanga score + optional advanced electional overlays. */
export function scoreMuhurtaFull(
  activity: MuhurtaActivity,
  panchang: Parameters<typeof analyzeMuhurta>[1],
  natal: { moonNak: number; moonSign: number },
  adv?: MuhurtaAdvancedInput,
): MuhurtaScore {
  const base = analyzeMuhurta(activity, panchang, natal)
  if (!adv) return base
  return applyMuhurtaAdvanced(activity, base, adv)
}
