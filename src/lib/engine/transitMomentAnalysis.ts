// ─────────────────────────────────────────────────────────────
//  src/lib/engine/transitMomentAnalysis.ts
//  Natal vs transit moment scoring — pure GrahaData, no ephemeris
// ─────────────────────────────────────────────────────────────

import type { ChartOutput, GrahaData, GrahaId, Rashi } from '@/types/astrology'
import { GRAHA_NAMES, RASHI_NAMES } from '@/types/astrology'
import { DIGNITY_INTERPRETATIONS } from '@/lib/engine/interpretations'

export type PositionVerdict = 'good' | 'mixed' | 'caution'
export type MomentLabel = 'Excellent' | 'Good' | 'Neutral' | 'Challenging' | 'Avoid'

const GRAHA_ORDER: GrahaId[] = ['Su', 'Mo', 'Ma', 'Me', 'Ju', 'Ve', 'Sa', 'Ra', 'Ke']

const BENEFICS = new Set<GrahaId>(['Ju', 'Ve', 'Mo', 'Me'])
const MALEFICS = new Set<GrahaId>(['Sa', 'Ma', 'Ra', 'Ke'])
const TRIKONAS = new Set([1, 5, 9])
const KENDRAS = new Set([1, 4, 7, 10])
const DUSTHANAS = new Set([6, 8, 12])
const CHANDRA_FAVORABLE = new Set([1, 3, 6, 7, 10, 11])
const CHANDRA_HARD = new Set([4, 8, 12])

const HOUSE_THEMES: Record<number, string> = {
  1: 'self, vitality, and new beginnings',
  2: 'wealth, speech, and family resources',
  3: 'courage, communication, and siblings',
  4: 'home, peace of mind, and mother',
  5: 'creativity, children, and intelligence',
  6: 'health, service, debts, and competition',
  7: 'partnerships, marriage, and public dealings',
  8: 'transformation, longevity, and hidden matters',
  9: 'dharma, fortune, father, and long journeys',
  10: 'career, status, and public reputation',
  11: 'gains, networks, and fulfilled desires',
  12: 'loss, solitude, spirituality, and foreign lands',
}

const TRANSIT_HOUSE_TEXT: Partial<Record<GrahaId, Record<number, string>>> = {
  Ju: {
    1: 'Personal growth and confidence expand.',
    5: 'Creativity, education, and joy are supported.',
    9: 'Fortune, wisdom, and righteous opportunities open.',
    10: 'Career recognition and professional growth.',
    11: 'Gains and social support increase.',
  },
  Ve: {
    1: 'Charm, comfort, and aesthetic uplift.',
    4: 'Domestic harmony and emotional sweetness.',
    7: 'Relationships and agreements flourish.',
    10: 'Public image and creative career benefit.',
    11: 'Pleasures and social enjoyment.',
  },
  Sa: {
    1: 'Heavy responsibility on identity — pace yourself.',
    6: 'Discipline in health and overcoming obstacles.',
    8: 'Karmic tests and deep restructuring.',
    10: 'Career duties intensify; build long-term structure.',
    12: 'Withdrawal, closure, and spiritual austerity.',
  },
  Ma: {
    1: 'High energy but impulsive — channel into action.',
    3: 'Courage and initiative in communication.',
    6: 'Victory over rivals; watch anger and accidents.',
    10: 'Ambitious drive; conflict possible at work.',
  },
  Ra: {
    1: 'Restless ambition; unconventional self-image.',
    7: 'Intense relationship dynamics and surprises.',
    10: 'Sudden career twists or fame-seeking pressure.',
  },
  Ke: {
    1: 'Detachment from ego; spiritual introspection.',
    5: 'Letting go of romance/children drama for clarity.',
    9: 'Spiritual seeking over formal belief.',
    12: 'Liberation themes; endings and moksha focus.',
  },
  Mo: {
    1: 'Emotional focus on self and mood swings.',
    4: 'Strong home/mother themes; seek emotional safety.',
    9: 'Optimistic mind; travel and learning uplift mood.',
  },
  Su: {
    1: 'Vitality and authority highlighted.',
    10: 'Leadership and visibility in career matters.',
  },
  Me: {
    3: 'Sharp communication and learning.',
    6: 'Analytical problem-solving excels.',
    10: 'Business planning and structured thinking.',
  },
}

function grahaHouse(rashi: Rashi, ascRashi: Rashi): number {
  return ((rashi - ascRashi + 12) % 12) + 1
}

function houseFromMoon(moonRashi: Rashi, otherRashi: Rashi): number {
  return ((otherRashi - moonRashi + 12) % 12) + 1
}

function dignityScore(dignity: string): number {
  switch (dignity) {
    case 'exalted': return 3
    case 'moolatrikona': return 2
    case 'own': return 2
    case 'great_friend': return 1
    case 'friend': return 1
    case 'neutral': return 0
    case 'enemy': return -1
    case 'great_enemy': return -2
    case 'debilitated': return -3
    default: return 0
  }
}

function dignityVerdict(dignity: string): PositionVerdict {
  const s = dignityScore(dignity)
  if (s >= 2) return 'good'
  if (s <= -2) return 'caution'
  return 'mixed'
}

function houseTransitScore(pid: GrahaId, house: number): number {
  let score = 0
  if (TRIKONAS.has(house) && BENEFICS.has(pid)) score += 2
  if (KENDRAS.has(house) && BENEFICS.has(pid)) score += 1
  if (DUSTHANAS.has(house) && MALEFICS.has(pid)) score -= 1
  if (DUSTHANAS.has(house) && BENEFICS.has(pid)) score -= 2
  if (DUSTHANAS.has(house) && pid === 'Sa') score -= 2
  if (house === 1 && (pid === 'Sa' || pid === 'Ra')) score -= 2
  if (house === 5 && pid === 'Sa') score -= 1
  if (house === 7 && (pid === 'Sa' || pid === 'Ra')) score -= 1
  if (TRIKONAS.has(house) && pid === 'Ju') score += 2
  if ([4, 7, 10].includes(house) && pid === 'Ve') score += 1
  return score
}

function houseVerdict(pid: GrahaId, house: number): PositionVerdict {
  const s = houseTransitScore(pid, house)
  if (s >= 2) return 'good'
  if (s <= -2) return 'caution'
  return 'mixed'
}

function combinedVerdict(dignity: string, pid: GrahaId, house: number): PositionVerdict {
  const d = dignityScore(dignity)
  const h = houseTransitScore(pid, house)
  const total = d + h
  if (total >= 2) return 'good'
  if (total <= -2) return 'caution'
  return 'mixed'
}

function taraBala(natalMoonNak: number, transitMoonNak: number): { name: string; score: number } {
  const diff = ((transitMoonNak - natalMoonNak + 27) % 27) + 1
  const tara = diff % 9 || 9
  const map: Record<number, { score: number; name: string }> = {
    1: { score: -10, name: 'Janma (sensitive)' },
    2: { score: 15, name: 'Sampat (wealth)' },
    3: { score: -15, name: 'Vipat (danger)' },
    4: { score: 12, name: 'Kshem (safety)' },
    5: { score: -12, name: 'Pratyari (obstacles)' },
    6: { score: 15, name: 'Sadhaka (success)' },
    7: { score: -18, name: 'Vadha (destructive)' },
    8: { score: 8, name: 'Mitra (friend)' },
    9: { score: 12, name: 'Ati-Mitra (best friend)' },
  }
  return map[tara] ?? { score: 0, name: 'Neutral' }
}

export interface PlanetMomentAnalysis {
  planetId: GrahaId
  natalHouse: number
  transitHouse: number
  natalDignity: string
  transitDignity: string
  natalVerdict: PositionVerdict
  transitVerdict: PositionVerdict
  prediction: string
  detail: string
  isRetro: boolean
  sameSignAsNatal: boolean
}

export interface TransitMomentAnalysis {
  score: number
  label: MomentLabel
  goodFactors: string[]
  cautionFactors: string[]
  planets: PlanetMomentAnalysis[]
  summary: string
}

function momentLabel(score: number): MomentLabel {
  if (score >= 75) return 'Excellent'
  if (score >= 58) return 'Good'
  if (score >= 42) return 'Neutral'
  if (score >= 28) return 'Challenging'
  return 'Avoid'
}

function buildPlanetPrediction(
  pid: GrahaId,
  natal: GrahaData,
  transit: GrahaData,
  natalAsc: Rashi,
): PlanetMomentAnalysis {
  const natalH = grahaHouse(natal.rashi, natalAsc)
  const transitH = grahaHouse(transit.rashi, natalAsc)
  const natalV = dignityVerdict(natal.dignity)
  const transitV = combinedVerdict(transit.dignity, pid, transitH)
  const sameSign = natal.rashi === transit.rashi

  const houseText = TRANSIT_HOUSE_TEXT[pid]?.[transitH]
    ?? `${GRAHA_NAMES[pid]} activates your ${transitH}${ordinal(transitH)} house — themes of ${HOUSE_THEMES[transitH] ?? 'life activity'}.`

  let prediction = houseText
  if (sameSign) {
    prediction = `Return to natal sign (${RASHI_NAMES[natal.rashi]}): karmic completion and renewal cycle for ${GRAHA_NAMES[pid]}. ${houseText}`
  } else if (natalH !== transitH) {
    prediction = `Moves from natal H${natalH} to transit H${transitH}. ${houseText}`
  }

  if (transit.isRetro) {
    prediction += ` Retrograde — review and rework rather than push forward.`
  }

  const detail = [
    `Natal: ${RASHI_NAMES[natal.rashi]} H${natalH}, ${natal.dignity} — ${DIGNITY_INTERPRETATIONS[natal.dignity]?.split('.')[0] ?? 'average strength'}.`,
    `Transit: ${RASHI_NAMES[transit.rashi]} H${transitH}, ${transit.dignity}${transit.isRetro ? ', retrograde' : ''}.`,
  ].join(' ')

  return {
    planetId: pid,
    natalHouse: natalH,
    transitHouse: transitH,
    natalDignity: natal.dignity,
    transitDignity: transit.dignity,
    natalVerdict: natalV,
    transitVerdict: transitV,
    prediction,
    detail,
    isRetro: transit.isRetro,
    sameSignAsNatal: sameSign,
  }
}

function ordinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd']
  const v = n % 100
  return s[(v - 20) % 10] || s[v] || s[0]
}

export function analyzeTransitMoment(
  natalChart: ChartOutput,
  transitChart: ChartOutput,
): TransitMomentAnalysis {
  const natalAsc = natalChart.lagnas.ascRashi
  const natalMoon = natalChart.grahas.find(g => g.id === 'Mo')
  const transitMoon = transitChart.grahas.find(g => g.id === 'Mo')

  let score = 52
  const goodFactors: string[] = []
  const cautionFactors: string[] = []

  const planets: PlanetMomentAnalysis[] = []

  for (const pid of GRAHA_ORDER) {
    const natal = natalChart.grahas.find(g => g.id === pid)
    const transit = transitChart.grahas.find(g => g.id === pid)
    if (!natal || !transit) continue

    const analysis = buildPlanetPrediction(pid, natal, transit, natalAsc)
    planets.push(analysis)

    const hScore = houseTransitScore(pid, analysis.transitHouse)
    const dScore = dignityScore(transit.dignity)
    score += (hScore + dScore) * (pid === 'Ju' || pid === 'Sa' ? 1.5 : pid === 'Mo' ? 1.2 : 0.6)

    if (analysis.transitVerdict === 'good' && (pid === 'Ju' || pid === 'Ve' || pid === 'Mo')) {
      goodFactors.push(`${GRAHA_NAMES[pid]} in favorable transit (${RASHI_NAMES[transit.rashi]}, H${analysis.transitHouse})`)
    }
    if (analysis.transitVerdict === 'caution' && MALEFICS.has(pid)) {
      cautionFactors.push(`${GRAHA_NAMES[pid]} in demanding transit (H${analysis.transitHouse}${transit.isRetro ? ', ℞' : ''})`)
    }
  }

  if (natalMoon && transitMoon) {
    const chandraH = houseFromMoon(natalMoon.rashi, transitMoon.rashi)
    if (CHANDRA_FAVORABLE.has(chandraH)) {
      score += 12
      goodFactors.push(`Chandra Bala: Moon ${chandraH}${ordinal(chandraH)} from natal Moon — emotionally supportive`)
    } else if (CHANDRA_HARD.has(chandraH)) {
      score -= 14
      cautionFactors.push(`Chandra Bala: Moon ${chandraH}${ordinal(chandraH)} from natal Moon — emotional sensitivity`)
    }

    const tara = taraBala(natalMoon.nakshatraIndex, transitMoon.nakshatraIndex)
    score += tara.score
    if (tara.score > 0) goodFactors.push(`Tara Bala: ${tara.name}`)
    else if (tara.score < -10) cautionFactors.push(`Tara Bala: ${tara.name}`)
  }

  const ju = planets.find(p => p.planetId === 'Ju')
  const sa = planets.find(p => p.planetId === 'Sa')
  if (ju?.transitVerdict === 'good' && [1, 5, 9, 11].includes(ju.transitHouse)) {
    score += 8
    goodFactors.push(`Jupiter blessing in H${ju.transitHouse} — expansion and protection`)
  }
  if (sa?.transitVerdict === 'caution' && [1, 4, 7, 8, 12].includes(sa.transitHouse)) {
    score -= 10
    cautionFactors.push(`Saturn pressure in H${sa.transitHouse} — patience and discipline required`)
  }

  score = Math.max(5, Math.min(95, Math.round(score)))
  const label = momentLabel(score)

  const summary =
    label === 'Excellent' || label === 'Good'
      ? 'Overall supportive window for initiative, meetings, and positive action — especially where Jupiter/Venus/Moon are strong.'
      : label === 'Neutral'
        ? 'Mixed cosmic weather — proceed with awareness; favor routine work over high-stakes launches.'
        : label === 'Challenging'
          ? 'Demanding period — delay irreversible decisions; focus on remediation, health, and spiritual practice.'
          : 'Highly sensitive moment — avoid conflict, surgery, and major commitments if possible.'

  return {
    score,
    label,
    goodFactors: goodFactors.slice(0, 6),
    cautionFactors: cautionFactors.slice(0, 6),
    planets,
    summary,
  }
}
