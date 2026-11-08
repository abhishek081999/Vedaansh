// Compare-page aura affinity, verdict and awareness helpers (pure engine).

import type { ChartOutput, GrahaData, Rashi } from '@/types/astrology'
import { RASHI_NAMES } from '@/types/astrology'
import type { AshtakootResult } from '@/lib/engine/ashtakoot'
import type { KootaKey } from '@/lib/engine/ashtakoot'
import type { EngineLang } from '@/lib/engine/lang'
import { fill } from '@/lib/engine/lang'
import { termHi } from '@/i18n/jyotish'
import { CC_HI } from '@/lib/engine/locale/compareCompat.hi'

export interface CompatItem {
  label: string
  score: number
  reason: string
  level: 'good' | 'neutral' | 'bad'
}

export const KOOTA_LABELS_EN: Record<KootaKey, string> = {
  varna: 'Varna',
  vashya: 'Vashya',
  tara: 'Tara',
  yoni: 'Yoni',
  maitri: 'Graha Maitri',
  gana: 'Gana',
  bhakoot: 'Bhakoot',
  nadi: 'Nadi',
}

function rn(s: number, lang: EngineLang): string {
  if (lang === 'hi') return termHi(RASHI_NAMES[s as Rashi] ?? '—')
  return RASHI_NAMES[s as Rashi] ?? '—'
}

function signOf(deg: number): number {
  return Math.floor((((deg % 360) + 360) % 360) / 30) + 1
}

function signDiff(a: number, b: number): number {
  return ((b - a + 12) % 12) + 1
}

export function getCompatibility(a: ChartOutput, b: ChartOutput, lang: EngineLang = 'en'): CompatItem[] {
  const items: CompatItem[] = []
  const hi = lang === 'hi'
  const L = hi ? CC_HI : null
  const aMo = a.grahas.find((g: GrahaData) => g.id === 'Mo')
  const bMo = b.grahas.find((g: GrahaData) => g.id === 'Mo')
  const aVe = a.grahas.find((g: GrahaData) => g.id === 'Ve')
  const bVe = b.grahas.find((g: GrahaData) => g.id === 'Ve')
  const aJu = a.grahas.find((g: GrahaData) => g.id === 'Ju')
  const bJu = b.grahas.find((g: GrahaData) => g.id === 'Ju')
  const aSu = a.grahas.find((g: GrahaData) => g.id === 'Su')
  const bSu = b.grahas.find((g: GrahaData) => g.id === 'Su')

  if (aMo && bMo) {
    const sA = signOf(aMo.totalDegree)
    const sB = signOf(bMo.totalDegree)
    const diff = signDiff(sA, sB)
    const reverseDiff = signDiff(sB, sA)
    const isGood = [1, 5, 9, 3, 7, 11].includes(diff)
    const isBad = [2, 12, 6, 8].includes(diff)
    items.push({
      label: hi ? L!.moonAffinity : 'Moon Sign Affinity',
      score: isGood ? 2 : isBad ? -1 : 0,
      level: isGood ? 'good' : isBad ? 'bad' : 'neutral',
      reason: hi
        ? fill(L!.reasonRelation, { a: rn(sA, lang), b: rn(sB, lang), diff, rev: reverseDiff })
        : `${rn(sA, lang)} ↔ ${rn(sB, lang)} (${diff}/${reverseDiff} relation)`,
    })
  }

  const aL = a.lagnas.ascRashi
  const bL = b.lagnas.ascRashi
  if (aL && bL) {
    const diff = signDiff(aL, bL)
    const isGood = [1, 5, 9, 3, 7, 11].includes(diff)
    items.push({
      label: hi ? L!.ascHarmony : 'Ascendant Harmony',
      score: isGood ? 2 : 0,
      level: isGood ? 'good' : 'neutral',
      reason: `${rn(aL, lang)} ↔ ${rn(bL, lang)}`,
    })
  }

  if (aVe && bMo) {
    const d = signDiff(signOf(aVe.totalDegree), signOf(bMo.totalDegree))
    if ([1, 5, 9].includes(d)) {
      items.push({
        label: hi ? L!.venusMoonP1 : "Person 1's Venus ↔ Person 2's Moon",
        score: 1.5,
        level: 'good',
        reason: hi ? L!.reasonEmotionalStrong : 'Emotional attraction tends to be strong',
      })
    }
  }
  if (bVe && aMo) {
    const d = signDiff(signOf(bVe.totalDegree), signOf(aMo.totalDegree))
    if ([1, 5, 9].includes(d)) {
      items.push({
        label: hi ? L!.venusMoonP2 : "Person 2's Venus ↔ Person 1's Moon",
        score: 1.5,
        level: 'good',
        reason: hi ? L!.reasonEmotionalStrong : 'Emotional attraction tends to be strong',
      })
    }
  }

  if (aJu && bMo) {
    const d = signDiff(signOf(aJu.totalDegree), signOf(bMo.totalDegree))
    if ([1, 5, 7, 9].includes(d)) {
      items.push({
        label: hi ? L!.jupiterMoonP1 : "Person 1's Jupiter supports Person 2's Moon",
        score: 1,
        level: 'good',
        reason: hi ? L!.reasonStability : 'Supports stability',
      })
    }
  }

  if (aSu && bSu) {
    const d = signDiff(signOf(aSu.totalDegree), signOf(bSu.totalDegree))
    if ([1, 5, 9].includes(d)) {
      items.push({
        label: hi ? L!.sunAffinity : 'Sun Sign Affinity',
        score: 1,
        level: 'good',
        reason: hi ? L!.reasonSharedOutlook : 'A sense of shared outlook',
      })
    }
  }

  return items
}

export function kootaLabels(lang: EngineLang): Record<KootaKey, string> {
  return lang === 'hi' ? CC_HI.kootaLabels : KOOTA_LABELS_EN
}

export function sameNadi(score: AshtakootResult): boolean {
  return score.nadi.p1 === score.nadi.p2
}

export function countsAsStrength(key: KootaKey, score: AshtakootResult): boolean {
  if (key === 'nadi') return score.nadi.points > 0 && !sameNadi(score)
  if (key === 'maitri') return score.maitri.points >= 3
  if (key === 'gana') return score.gana.points >= 5
  if (key === 'yoni') return score.yoni.points >= 3
  if (key === 'bhakoot') return score.bhakoot.points === 7
  return false
}

function awarenessText(
  key: KootaKey,
  points: number,
  max: number,
  insight: string,
  lang: EngineLang,
): string {
  const mark = lang === 'hi' ? fill(CC_HI.awareness.mark, { points, max }) : `${points} of ${max}.`
  if (key === 'varna') {
    return lang === 'hi' ? fill(CC_HI.awareness.varna, { mark }) : `${mark} Work and values may not line up easily between you.`
  }
  if (key === 'yoni') {
    return lang === 'hi' ? fill(CC_HI.awareness.yoni, { mark }) : `${mark} Physical affinity is lighter here, so closeness may grow through choice and care rather than instinct.`
  }
  if (key === 'gana') {
    return lang === 'hi' ? fill(CC_HI.awareness.gana, { mark }) : `${mark} Temperaments differ, and you may react at different speeds.`
  }
  return `${mark} ${insight}`
}

export function awarenessItems(score: AshtakootResult, lang: EngineLang = 'en') {
  const labels = kootaLabels(lang)
  const hi = lang === 'hi'
  const items: { id: string; label: string; text: string }[] = (Object.keys(labels) as KootaKey[])
    .filter((key) => {
      if (key === 'nadi' && sameNadi(score)) return false
      return score[key].points < score[key].max && !countsAsStrength(key, score)
    })
    .map((key) => ({
      id: key,
      label: labels[key],
      text: awarenessText(key, score[key].points, score[key].max, score[key].insight, lang),
    }))
  if (sameNadi(score)) {
    items.push({
      id: 'nadi-same',
      label: labels.nadi,
      text:
        score.nadi.points === 8
          ? hi
            ? CC_HI.awareness.nadiSame8
            : 'Same Nadi with a classical cancellation: the points are restored, though many traditions still advise caution and a routine health check before children.'
          : hi
            ? CC_HI.awareness.nadiSameDosha
            : 'Same Nadi (Nadi Dosha): traditionally a point of caution for children’s health. Cancellation rules and a routine health check are worth considering.',
    })
  }
  if (score.total < 18) {
    items.push({
      id: 'low',
      label: hi ? CC_HI.awareness.lowGunaLabel : 'Lower guna total',
      text: hi ? CC_HI.awareness.lowGuna : 'The guna score is under 18. The houses, the 7th lord and the Navamsha give a fuller picture, and the guna total alone does not decide a match.',
    })
  }
  if (score.total > 32) {
    items.push({
      id: 'high',
      label: score.total === 36 ? (hi ? CC_HI.awareness.high36 : '36/36 total') : hi ? CC_HI.awareness.highVery : 'Very high total',
      text:
        score.total === 36
          ? hi
            ? CC_HI.awareness.high36Text
            : 'Many traditions see a score above 32 as being very alike. It is worth confirming that Nadi differs and that you each keep your own identity and spark.'
          : hi
            ? CC_HI.awareness.highText
            : 'Many traditions see a score above 32 as being very alike. It is worth confirming that Nadi differs and that you each keep your own identity and spark.',
    })
  }
  return items
}

export function getVerdict(score: AshtakootResult, lang: EngineLang = 'en') {
  const total = score.total
  const nadiSame = sameNadi(score)
  const hi = lang === 'hi'
  const V = CC_HI.verdict
  if (total > 32) {
    return {
      label: total === 36 ? (hi ? V.veryHigh36 : '36/36: read with care') : hi ? V.veryHigh : 'Very high: read with care',
      sub: nadiSame
        ? hi
          ? V.subHighNadi
          : 'The guna score is very high, but both charts share the same Nadi, traditionally the most weighty koota concern even when points are restored by an exception.'
        : hi
          ? V.subHigh
          : 'Over 32 gunas: many traditions read this as being very alike. It is worth confirming that Nadi differs and looking at the Venus–Mars link.',
      color: 'var(--text-gold)',
      icon: '◇',
    }
  }
  if (total >= 28) {
    return {
      label: hi ? V.verySupportive : 'Very Supportive',
      sub: hi ? V.subVerySupportive : 'A strong Stage 1 guna score. Venus–Mars chemistry and the partner longevity cues add important detail, since gunas alone are not the whole story.',
      color: 'var(--teal)',
      icon: '✦',
    }
  }
  if (total >= 21) {
    return {
      label: hi ? V.supportive : 'Supportive',
      sub: hi ? V.subSupportive : 'Within the classical 18–32 range with solid cohesion. Dosha exceptions and Stage 3 chemistry add further detail.',
      color: 'var(--text-gold)',
      icon: '★',
    }
  }
  if (total >= 18) {
    return {
      label: hi ? V.moderate : 'Moderate',
      sub: hi ? V.subModerate : 'Meets the traditional minimum of 18. Conscious effort helps, and strong chart links can outweigh low-to-middle gunas.',
      color: 'var(--accent)',
      icon: '✓',
    }
  }
  return {
    label: hi ? V.below : 'Below the Traditional Range',
    sub: hi ? V.subBelow : 'Under 18 gunas is below the traditional range, yet many marriages with a lower score do well when other chart links are strong. Stages 2 and 3 are worth reading.',
    color: 'var(--rose)',
    icon: '!',
  }
}

