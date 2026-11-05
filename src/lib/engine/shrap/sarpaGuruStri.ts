// ─────────────────────────────────────────────────────────────
//  src/lib/engine/shrap/sarpaGuruStri.ts
//  True Sarpa Dosha, Guru / Brahmin Dosha, Stri / Kanya Dosha
//  Commercial Kal Sarp Yoga is deliberately not calculated.
// ─────────────────────────────────────────────────────────────

import type { ChartOutput } from '@/types/astrology'
import {
  conjunct,
  emptyVerdict,
  findGraha,
  gn,
  houseOf,
  isDebilitated,
  isWeakDignity,
  lordAfflictedByNodesOrSaturn,
  lordOfHouse,
  maleficsOnHouse,
  onNodeAxis,
  severityFromScore,
  vargaHouseOf,
  vargaMaleficsOnHouse,
  vargaSlice,
  type ShrapDoshaVerdict,
  type ShrapIndicator,
} from '@/lib/engine/shrap/helpers'

const SARPA_EFFECTS = [
  'Repeated pregnancy losses or childbirth obstacles',
  'Children born with health challenges',
  'Difficulty extending the family line',
  'In severe cases, child survival concerns',
  'Snake dreams as ancestral communication (not automatic proof of this dosha)',
  'Unexplained anxiety or fear',
]

const SARPA_REMEDIES = [
  'Nag Panchami Pujan — annual worship on the 5th day of Shravan',
  'Maha Mrityunjaya Japa — protective mantra',
  'Rudra Abhishek — Shivalinga bathing with Rudra mantra',
  'Anant Naag Puja (Ananta / Shesha)',
  'Sacred locations: Ujjain — Sati Vat (not Mangalnath for Sarpa), Gaya, Badrinath',
]

const GURU_EFFECTS = [
  'Obstacles in studies at key stages',
  'Friction with teachers or mentors',
  'Difficulty finding a genuine spiritual guide',
  'Repeatedly misled by advisors',
  'Knowledge without recognition or respect',
]

const GURU_REMEDIES = [
  'Peepal tree seva — water daily (do not nurture a Peepal grown inside house walls)',
  'Guru Seva — serve a genuine teacher',
  'Shiva Abhishek on Thursdays (Guruvar)',
  'Rudra Abhishek on Thursdays',
  'Take a Guru Mantra from an authentic teacher',
]

const STRI_EFFECTS = [
  'Repeated broken marriages or engagements',
  'Marriage delayed or not happening',
  'Perpetual disputes involving female figures',
  'Karmic debt linked to disrespect toward women (past or present)',
]

const STRI_REMEDIES = [
  'Kanya Pujan — worship / feed / gift girls under 12 (most important)',
  'Respect all female figures in life — results scale with sincerity',
  'Stri Dosha and Kanya Dosha are the same issue under two names',
]

export const KAL_SARP_TEACHING =
  'Commercial “Kal Sarp Dosha” with thousands of variations is not treated as a classical product feature here. True Sarpa Dosha is rarer and centres on Rahu / 5th-house progeny themes, confirmed in D7 when available.'

export function analyzeSarpaDosha(chart: ChartOutput): ShrapDoshaVerdict {
  if (!chart.lagnas?.ascRashi) {
    return emptyVerdict(
      'sarpa',
      'Sarpa Dosha',
      'Rahu',
      '5th',
      'Nag Panchami, Maha Mrityunjaya, Rudra Abhishek',
      'Chart lagna unavailable.',
      SARPA_EFFECTS,
      SARPA_REMEDIES,
    )
  }

  const indicators: ShrapIndicator[] = []
  let score = 0

  const rahuHouse = houseOf(chart, 'Ra')
  const lord5 = lordOfHouse(chart, 5)
  const h5Mal = maleficsOnHouse(chart, 5)

  if (rahuHouse === 5) {
    score += 2
    indicators.push({
      id: 'ra-h5',
      text: 'Rahu in the 5th house (5th–11th axis) — primary True Sarpa signal',
    })
  }

  if (lord5) {
    const hits = lordAfflictedByNodesOrSaturn(chart, lord5).filter(id => id === 'Ra' || id === 'Ke')
    if (hits.length) {
      score += 1.5
      indicators.push({
        id: 'l5-ra',
        text: `5th lord ${gn(lord5)} afflicted by ${hits.map(gn).join(', ')}`,
      })
    }
  }

  // D7 confirmation
  const d7RahuHouse = vargaHouseOf(chart, 'D7', 'Ra')
  const d7H5 = vargaMaleficsOnHouse(chart, 'D7', 5)
  const d7Confirm =
    d7RahuHouse === 5 || d7H5.includes('Ra') || d7H5.includes('Ke')
  if (d7Confirm && score >= 1) {
    score += 1.5
    indicators.push({
      id: 'd7-confirm',
      text: 'D7 (Saptamsha) 5th also afflicted — confirms Sarpa severity',
    })
  } else if (chart.vargas?.D7?.length && score >= 1) {
    indicators.push({
      id: 'd7-soft',
      text: 'D7 does not strongly confirm — treat D1 as a watch, not a hard curse',
    })
  }

  if (rahuHouse === 11 && h5Mal.includes('Ke')) {
    score += 0.5
    indicators.push({
      id: 'ke-h5-axis',
      text: 'Ketu in 5th with Rahu in 11th — axis pressure on progeny house',
    })
  }

  indicators.push({ id: 'kal-sarp-note', text: KAL_SARP_TEACHING })

  // True Sarpa needs D1 signal first — don't flag on D7 alone
  if (score < 1.5 && rahuHouse !== 5) {
    score = Math.min(score, 0.5)
  }

  const severity = severityFromScore(score)
  const present = severity !== 'clear'

  return {
    id: 'sarpa',
    label: 'Sarpa Dosha',
    present,
    severity,
    summary: present
      ? `True Sarpa Dosha looks ${severity}. Focus on Rahu and the 5th house / lord; D7 confirms when present. Not the same as commercial Kal Sarp Yoga.`
      : 'No clear True Sarpa Dosha (Rahu–5th / D7) in this chart. Commercial Kal Sarp variations are not scored.',
    indicators,
    effects: SARPA_EFFECTS,
    remedies: SARPA_REMEDIES,
    primaryPlanet: 'Rahu',
    primaryHouse: '5th',
    keyRemedy: 'Nag Panchami, Maha Mrityunjaya, Rudra Abhishek',
  }
}

export function analyzeGuruDosha(chart: ChartOutput): ShrapDoshaVerdict {
  const ju = findGraha(chart, 'Ju')
  const ra = findGraha(chart, 'Ra')
  if (!ju || !chart.lagnas?.ascRashi) {
    return emptyVerdict(
      'guru',
      'Guru Dosha',
      'Jupiter',
      '5th, 9th',
      'Peepal seva, Guru seva, Thursday Shiva Abhishek',
      'Jupiter data unavailable.',
      GURU_EFFECTS,
      GURU_REMEDIES,
    )
  }

  const indicators: ShrapIndicator[] = []
  let score = 0

  if (isDebilitated(ju.dignity) || isWeakDignity(ju.dignity)) {
    score += isDebilitated(ju.dignity) ? 1.5 : 0.75
    indicators.push({ id: 'ju-weak', text: `Jupiter is ${ju.dignity?.replace(/_/g, ' ') ?? 'weak'}` })
  }
  if (ju.isCombust) {
    score += 1
    indicators.push({ id: 'ju-combust', text: 'Jupiter is combust (within the Sun’s orb)' })
  }
  if (onNodeAxis(chart, 'Ju') || conjunct(ju, ra)) {
    score += 1.5
    indicators.push({ id: 'guru-chandal', text: 'Guru-Chandal pattern — Jupiter with Rahu / on node axis' })
  }

  const h5 = maleficsOnHouse(chart, 5)
  if (h5.length >= 2 || h5.includes('Ra')) {
    score += 0.75
    indicators.push({ id: 'h5-aff', text: `5th house afflicted (${h5.map(gn).join(', ') || 'malefics'})` })
  }

  const lord9 = lordOfHouse(chart, 9)
  if (lord9) {
    const l9 = findGraha(chart, lord9)
    if (l9 && (isDebilitated(l9.dignity) || lordAfflictedByNodesOrSaturn(chart, lord9).length)) {
      score += 0.75
      indicators.push({ id: 'l9-weak', text: `9th lord ${gn(lord9)} weak or afflicted` })
    }
  }

  // Divisional confirmation (D9)
  const { grahas: d9, asc: d9Asc } = vargaSlice(chart, 'D9')
  if (d9.length && d9Asc) {
    const ju9 = d9.find(g => g.id === 'Ju')
    const ra9 = d9.find(g => g.id === 'Ra')
    if (ju9 && ra9 && ju9.rashi === ra9.rashi && score >= 1) {
      score += 1
      indicators.push({ id: 'd9-gc', text: 'Jupiter–Rahu also together in D9 — pattern repeats' })
    }
  }

  const severity = severityFromScore(score)
  const present = severity !== 'clear'

  return {
    id: 'guru',
    label: 'Guru Dosha',
    present,
    severity,
    summary: present
      ? `Guru Dosha looks ${severity}. Jupiter, 5th/9th, and mentor themes need care.`
      : 'No clear Guru Dosha from Jupiter / 5th / 9th patterns.',
    indicators,
    effects: GURU_EFFECTS,
    remedies: GURU_REMEDIES,
    primaryPlanet: 'Jupiter',
    primaryHouse: '5th, 9th',
    keyRemedy: 'Peepal seva, Guru seva, Thursday Shiva Abhishek',
  }
}

export function analyzeBrahminDosha(chart: ChartOutput): ShrapDoshaVerdict {
  const guru = analyzeGuruDosha(chart)
  const sun = findGraha(chart, 'Su')
  const indicators: ShrapIndicator[] = [...guru.indicators.filter(i => i.id !== 'kal-sarp-note')]
  let score =
    guru.severity === 'strong' ? 3 : guru.severity === 'watch' ? 1.5 : 0

  if (sun && (isDebilitated(sun.dignity) || onNodeAxis(chart, 'Su'))) {
    score += 1
    indicators.push({
      id: 'brahmin-sun',
      text: 'Sun also weak or on node axis — Brahmin Dosha overlay (Nadi listing)',
    })
  }

  const lord9 = lordOfHouse(chart, 9)
  if (lord9 === 'Su' || lord9 === 'Ju') {
    const l = lord9 ? findGraha(chart, lord9) : undefined
    if (l && isWeakDignity(l.dignity)) {
      score += 0.5
      indicators.push({ id: 'brahmin-l9', text: `9th lord ${gn(lord9)} weak — teacher / brahmin axis` })
    }
  }

  // Brahmin is essentially Guru + Sun emphasis; require guru base or sun+9th
  if (guru.severity === 'clear' && score < 1.5) {
    score = Math.min(score, 0.5)
  }

  const severity = severityFromScore(score)
  const present = severity !== 'clear'

  return {
    id: 'brahmin',
    label: 'Brahmin Dosha',
    present,
    severity,
    summary: present
      ? `Brahmin Dosha looks ${severity}. Same essence as Guru Dosha, with Sun also weighed (Nadi listing).`
      : 'No clear Brahmin Dosha beyond ordinary Guru / Sun checks.',
    indicators: indicators.length
      ? indicators
      : [{ id: 'brahmin-same', text: 'Same remedies as Guru Dosha when present' }],
    effects: GURU_EFFECTS,
    remedies: GURU_REMEDIES,
    primaryPlanet: 'Jupiter + Sun',
    primaryHouse: '9th',
    keyRemedy: 'Same as Guru Dosha',
  }
}

export function analyzeStriKanyaDosha(chart: ChartOutput): ShrapDoshaVerdict {
  const ve = findGraha(chart, 'Ve')
  const ra = findGraha(chart, 'Ra')
  if (!ve || !chart.lagnas?.ascRashi) {
    return emptyVerdict(
      'stri',
      'Stri / Kanya Dosha',
      'Venus + Rahu',
      '—',
      'Kanya Pujan, female respect',
      'Venus data unavailable.',
      STRI_EFFECTS,
      STRI_REMEDIES,
    )
  }

  const indicators: ShrapIndicator[] = []
  let score = 0

  if (isDebilitated(ve.dignity) || isWeakDignity(ve.dignity)) {
    score += isDebilitated(ve.dignity) ? 1.5 : 0.75
    indicators.push({ id: 've-weak', text: `Venus is ${ve.dignity?.replace(/_/g, ' ') ?? 'weak'}` })
  }
  if (ve.isCombust) {
    score += 0.75
    indicators.push({ id: 've-combust', text: 'Venus is combust' })
  }

  if (conjunct(ve, ra) || onNodeAxis(chart, 'Ve')) {
    score += 2
    indicators.push({ id: 've-ra', text: 'Venus with Rahu / on Rahu–Ketu axis — primary Stri / Kanya signal' })
  }

  // 7th affliction softens into watch when Venus already weak
  const h7 = maleficsOnHouse(chart, 7)
  if (h7.includes('Ra') && score >= 1) {
    score += 0.5
    indicators.push({ id: 'h7-ra', text: 'Rahu also pressures the 7th — marriage friction theme' })
  }

  const { grahas: d9, asc: d9Asc } = vargaSlice(chart, 'D9')
  if (d9.length && d9Asc && score >= 1) {
    const ve9 = d9.find(g => g.id === 'Ve')
    const ra9 = d9.find(g => g.id === 'Ra')
    if (ve9 && ra9 && ve9.rashi === ra9.rashi) {
      score += 1
      indicators.push({ id: 'd9-ve-ra', text: 'Venus–Rahu together in D9 — confirmation' })
    } else if (ve9 && isDebilitated(ve9.dignity)) {
      score += 0.5
      indicators.push({ id: 'd9-ve-weak', text: 'Venus weak in D9' })
    }
  }

  const severity = severityFromScore(score)
  const present = severity !== 'clear'

  return {
    id: 'stri',
    label: 'Stri / Kanya Dosha',
    present,
    severity,
    summary: present
      ? `Stri / Kanya Dosha looks ${severity}. Venus–Rahu and marriage / female-respect themes.`
      : 'No clear Stri / Kanya Dosha from Venus–Rahu patterns.',
    indicators,
    effects: STRI_EFFECTS,
    remedies: STRI_REMEDIES,
    primaryPlanet: 'Venus + Rahu',
    primaryHouse: '—',
    keyRemedy: 'Kanya Pujan, female respect',
  }
}

/** Compact flags for dashboard — excludes Kaal Sarp id entirely. */
export function shrapDoshaFlagIds(): readonly string[] {
  return ['pitru', 'matru', 'sarpa', 'guru', 'brahmin', 'stri'] as const
}
