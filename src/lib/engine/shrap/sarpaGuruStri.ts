// ─────────────────────────────────────────────────────────────
//  src/lib/engine/shrap/sarpaGuruStri.ts
//  True Sarpa Dosha, Guru / Brahmin Dosha, Stri / Kanya Dosha
//  Commercial Kal Sarp Yoga is deliberately not calculated.
// ─────────────────────────────────────────────────────────────

import type { ChartOutput } from '@/types/astrology'
import type { EngineLang } from '@/lib/engine/lang'
import { SHRAP_HI, SHRAP_SEV_HI } from '@/lib/engine/locale/shrapDosha.hi'
import {
  conjunct,
  dignityWord,
  emptyVerdict,
  findGraha,
  gn,
  gnList,
  houseOf,
  isDebilitated,
  isWeakDignity,
  lordAfflictedByNodesOrSaturn,
  lordOfHouse,
  maleficsOnHouse,
  onNodeAxis,
  severityFromScore,
  tx,
  txList,
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

export function analyzeSarpaDosha(chart: ChartOutput, lang: EngineLang = 'en'): ShrapDoshaVerdict {
  const S = SHRAP_HI.sarpa
  const effects = txList(lang, SARPA_EFFECTS, S.effects)
  const remedies = txList(lang, SARPA_REMEDIES, S.remedies)
  if (!chart.lagnas?.ascRashi) {
    return emptyVerdict(
      'sarpa',
      tx(lang, 'Sarpa Dosha', S.label),
      gn('Ra', lang),
      tx(lang, '5th', SHRAP_HI.houses.h5),
      tx(lang, 'Nag Panchami, Maha Mrityunjaya, Rudra Abhishek', S.key),
      tx(lang, 'Chart lagna unavailable.', S.unavailable),
      effects,
      remedies,
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
      text: tx(lang, 'Rahu in the 5th house (5th–11th axis) — primary True Sarpa signal', S.raH5),
    })
  }

  if (lord5) {
    const hits = lordAfflictedByNodesOrSaturn(chart, lord5).filter(id => id === 'Ra' || id === 'Ke')
    if (hits.length) {
      score += 1.5
      indicators.push({
        id: 'l5-ra',
        text: tx(lang, `5th lord ${gn(lord5)} afflicted by ${hits.map(gn).join(', ')}`, S.l5, {
          lord: gn(lord5, lang),
          hits: gnList(hits, lang),
        }),
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
      text: tx(lang, 'D7 (Saptamsha) 5th also afflicted — confirms Sarpa severity', S.d7confirm),
    })
  } else if (chart.vargas?.D7?.length && score >= 1) {
    indicators.push({
      id: 'd7-soft',
      text: tx(lang, 'D7 does not strongly confirm — treat D1 as a watch, not a hard curse', S.d7soft),
    })
  }

  if (rahuHouse === 11 && h5Mal.includes('Ke')) {
    score += 0.5
    indicators.push({
      id: 'ke-h5-axis',
      text: tx(lang, 'Ketu in 5th with Rahu in 11th — axis pressure on progeny house', S.axis),
    })
  }

  indicators.push({ id: 'kal-sarp-note', text: tx(lang, KAL_SARP_TEACHING, S.kalSarp) })

  // True Sarpa needs D1 signal first — don't flag on D7 alone
  if (score < 1.5 && rahuHouse !== 5) {
    score = Math.min(score, 0.5)
  }

  const severity = severityFromScore(score)
  const present = severity !== 'clear'

  const sev = lang === 'hi' ? SHRAP_SEV_HI[severity] : severity
  return {
    id: 'sarpa',
    label: tx(lang, 'Sarpa Dosha', S.label),
    present,
    severity,
    summary: present
      ? tx(lang, `True Sarpa Dosha looks ${severity}. Focus on Rahu and the 5th house / lord; D7 confirms when present. Not the same as commercial Kal Sarp Yoga.`, S.summaryOn, { sev })
      : tx(lang, 'No clear True Sarpa Dosha (Rahu–5th / D7) in this chart. Commercial Kal Sarp variations are not scored.', S.summaryOff),
    indicators,
    effects,
    remedies,
    primaryPlanet: gn('Ra', lang),
    primaryHouse: tx(lang, '5th', SHRAP_HI.houses.h5),
    keyRemedy: tx(lang, 'Nag Panchami, Maha Mrityunjaya, Rudra Abhishek', S.key),
  }
}

export function analyzeGuruDosha(chart: ChartOutput, lang: EngineLang = 'en'): ShrapDoshaVerdict {
  const G = SHRAP_HI.guru
  const effects = txList(lang, GURU_EFFECTS, G.effects)
  const remedies = txList(lang, GURU_REMEDIES, G.remedies)
  const ju = findGraha(chart, 'Ju')
  const ra = findGraha(chart, 'Ra')
  if (!ju || !chart.lagnas?.ascRashi) {
    return emptyVerdict(
      'guru',
      tx(lang, 'Guru Dosha', G.label),
      gn('Ju', lang),
      tx(lang, '5th, 9th', SHRAP_HI.houses.h5h9),
      tx(lang, 'Peepal seva, Guru seva, Thursday Shiva Abhishek', G.key),
      tx(lang, 'Jupiter data unavailable.', G.unavailable),
      effects,
      remedies,
    )
  }

  const indicators: ShrapIndicator[] = []
  let score = 0

  if (isDebilitated(ju.dignity) || isWeakDignity(ju.dignity)) {
    score += isDebilitated(ju.dignity) ? 1.5 : 0.75
    indicators.push({
      id: 'ju-weak',
      text: tx(lang, `Jupiter is ${dignityWord(ju.dignity, 'en')}`, G.weak, {
        graha: gn('Ju', lang),
        dignity: dignityWord(ju.dignity, lang),
      }),
    })
  }
  if (ju.isCombust) {
    score += 1
    indicators.push({ id: 'ju-combust', text: tx(lang, 'Jupiter is combust (within the Sun’s orb)', G.combust) })
  }
  if (onNodeAxis(chart, 'Ju') || conjunct(ju, ra)) {
    score += 1.5
    indicators.push({ id: 'guru-chandal', text: tx(lang, 'Guru-Chandal pattern — Jupiter with Rahu / on node axis', G.chandal) })
  }

  const h5 = maleficsOnHouse(chart, 5)
  if (h5.length >= 2 || h5.includes('Ra')) {
    score += 0.75
    indicators.push({
      id: 'h5-aff',
      text: tx(lang, `5th house afflicted (${h5.map(gn).join(', ') || 'malefics'})`, G.h5, {
        list: gnList(h5, lang) || G.malefics,
      }),
    })
  }

  const lord9 = lordOfHouse(chart, 9)
  if (lord9) {
    const l9 = findGraha(chart, lord9)
    if (l9 && (isDebilitated(l9.dignity) || lordAfflictedByNodesOrSaturn(chart, lord9).length)) {
      score += 0.75
      indicators.push({ id: 'l9-weak', text: tx(lang, `9th lord ${gn(lord9)} weak or afflicted`, G.l9, { lord: gn(lord9, lang) }) })
    }
  }

  // Divisional confirmation (D9)
  const { grahas: d9, asc: d9Asc } = vargaSlice(chart, 'D9')
  if (d9.length && d9Asc) {
    const ju9 = d9.find(g => g.id === 'Ju')
    const ra9 = d9.find(g => g.id === 'Ra')
    if (ju9 && ra9 && ju9.rashi === ra9.rashi && score >= 1) {
      score += 1
      indicators.push({ id: 'd9-gc', text: tx(lang, 'Jupiter–Rahu also together in D9 — pattern repeats', G.d9) })
    }
  }

  const severity = severityFromScore(score)
  const present = severity !== 'clear'

  const sev = lang === 'hi' ? SHRAP_SEV_HI[severity] : severity
  return {
    id: 'guru',
    label: tx(lang, 'Guru Dosha', G.label),
    present,
    severity,
    summary: present
      ? tx(lang, `Guru Dosha looks ${severity}. Jupiter, 5th/9th, and mentor themes need care.`, G.summaryOn, { sev })
      : tx(lang, 'No clear Guru Dosha from Jupiter / 5th / 9th patterns.', G.summaryOff),
    indicators,
    effects,
    remedies,
    primaryPlanet: gn('Ju', lang),
    primaryHouse: tx(lang, '5th, 9th', SHRAP_HI.houses.h5h9),
    keyRemedy: tx(lang, 'Peepal seva, Guru seva, Thursday Shiva Abhishek', G.key),
  }
}

export function analyzeBrahminDosha(chart: ChartOutput, lang: EngineLang = 'en'): ShrapDoshaVerdict {
  const guru = analyzeGuruDosha(chart, lang)
  const B = SHRAP_HI.brahmin
  const sun = findGraha(chart, 'Su')
  const indicators: ShrapIndicator[] = [...guru.indicators.filter(i => i.id !== 'kal-sarp-note')]
  let score =
    guru.severity === 'strong' ? 3 : guru.severity === 'watch' ? 1.5 : 0

  if (sun && (isDebilitated(sun.dignity) || onNodeAxis(chart, 'Su'))) {
    score += 1
    indicators.push({
      id: 'brahmin-sun',
      text: tx(lang, 'Sun also weak or on node axis — Brahmin Dosha overlay (Nadi listing)', B.sun),
    })
  }

  const lord9 = lordOfHouse(chart, 9)
  if (lord9 === 'Su' || lord9 === 'Ju') {
    const l = lord9 ? findGraha(chart, lord9) : undefined
    if (l && isWeakDignity(l.dignity)) {
      score += 0.5
      indicators.push({
        id: 'brahmin-l9',
        text: tx(lang, `9th lord ${gn(lord9)} weak — teacher / brahmin axis`, B.l9, { lord: gn(lord9, lang) }),
      })
    }
  }

  // Brahmin is essentially Guru + Sun emphasis; require guru base or sun+9th
  if (guru.severity === 'clear' && score < 1.5) {
    score = Math.min(score, 0.5)
  }

  const severity = severityFromScore(score)
  const present = severity !== 'clear'

  const sev = lang === 'hi' ? SHRAP_SEV_HI[severity] : severity
  return {
    id: 'brahmin',
    label: tx(lang, 'Brahmin Dosha', B.label),
    present,
    severity,
    summary: present
      ? tx(lang, `Brahmin Dosha looks ${severity}. Same essence as Guru Dosha, with Sun also weighed (Nadi listing).`, B.summaryOn, { sev })
      : tx(lang, 'No clear Brahmin Dosha beyond ordinary Guru / Sun checks.', B.summaryOff),
    indicators: indicators.length
      ? indicators
      : [{ id: 'brahmin-same', text: tx(lang, 'Same remedies as Guru Dosha when present', B.same) }],
    effects: txList(lang, GURU_EFFECTS, SHRAP_HI.guru.effects),
    remedies: txList(lang, GURU_REMEDIES, SHRAP_HI.guru.remedies),
    primaryPlanet: tx(lang, 'Jupiter + Sun', B.planet, { ju: gn('Ju', lang), su: gn('Su', lang) }),
    primaryHouse: tx(lang, '9th', SHRAP_HI.houses.h9),
    keyRemedy: tx(lang, 'Same as Guru Dosha', B.key),
  }
}

export function analyzeStriKanyaDosha(chart: ChartOutput, lang: EngineLang = 'en'): ShrapDoshaVerdict {
  const K = SHRAP_HI.stri
  const effects = txList(lang, STRI_EFFECTS, K.effects)
  const remedies = txList(lang, STRI_REMEDIES, K.remedies)
  const ve = findGraha(chart, 'Ve')
  const ra = findGraha(chart, 'Ra')
  if (!ve || !chart.lagnas?.ascRashi) {
    return emptyVerdict(
      'stri',
      tx(lang, 'Stri / Kanya Dosha', K.label),
      tx(lang, 'Venus + Rahu', K.planet, { ve: gn('Ve', lang), ra: gn('Ra', lang) }),
      tx(lang, '—', SHRAP_HI.houses.dash),
      tx(lang, 'Kanya Pujan, female respect', K.key),
      tx(lang, 'Venus data unavailable.', K.unavailable),
      effects,
      remedies,
    )
  }

  const indicators: ShrapIndicator[] = []
  let score = 0

  if (isDebilitated(ve.dignity) || isWeakDignity(ve.dignity)) {
    score += isDebilitated(ve.dignity) ? 1.5 : 0.75
    indicators.push({
      id: 've-weak',
      text: tx(lang, `Venus is ${dignityWord(ve.dignity, 'en')}`, K.weak, {
        graha: gn('Ve', lang),
        dignity: dignityWord(ve.dignity, lang),
      }),
    })
  }
  if (ve.isCombust) {
    score += 0.75
    indicators.push({ id: 've-combust', text: tx(lang, 'Venus is combust', K.combust) })
  }

  if (conjunct(ve, ra) || onNodeAxis(chart, 'Ve')) {
    score += 2
    indicators.push({ id: 've-ra', text: tx(lang, 'Venus with Rahu / on Rahu–Ketu axis — primary Stri / Kanya signal', K.axis) })
  }

  // 7th affliction softens into watch when Venus already weak
  const h7 = maleficsOnHouse(chart, 7)
  if (h7.includes('Ra') && score >= 1) {
    score += 0.5
    indicators.push({ id: 'h7-ra', text: tx(lang, 'Rahu also pressures the 7th — marriage friction theme', K.h7) })
  }

  const { grahas: d9, asc: d9Asc } = vargaSlice(chart, 'D9')
  if (d9.length && d9Asc && score >= 1) {
    const ve9 = d9.find(g => g.id === 'Ve')
    const ra9 = d9.find(g => g.id === 'Ra')
    if (ve9 && ra9 && ve9.rashi === ra9.rashi) {
      score += 1
      indicators.push({ id: 'd9-ve-ra', text: tx(lang, 'Venus–Rahu together in D9 — confirmation', K.d9) })
    } else if (ve9 && isDebilitated(ve9.dignity)) {
      score += 0.5
      indicators.push({ id: 'd9-ve-weak', text: tx(lang, 'Venus weak in D9', K.d9weak) })
    }
  }

  const severity = severityFromScore(score)
  const present = severity !== 'clear'

  const sev = lang === 'hi' ? SHRAP_SEV_HI[severity] : severity
  return {
    id: 'stri',
    label: tx(lang, 'Stri / Kanya Dosha', K.label),
    present,
    severity,
    summary: present
      ? tx(lang, `Stri / Kanya Dosha looks ${severity}. Venus–Rahu and marriage / female-respect themes.`, K.summaryOn, { sev })
      : tx(lang, 'No clear Stri / Kanya Dosha from Venus–Rahu patterns.', K.summaryOff),
    indicators,
    effects,
    remedies,
    primaryPlanet: tx(lang, 'Venus + Rahu', K.planet, { ve: gn('Ve', lang), ra: gn('Ra', lang) }),
    primaryHouse: tx(lang, '—', SHRAP_HI.houses.dash),
    keyRemedy: tx(lang, 'Kanya Pujan, female respect', K.key),
  }
}

/** Compact flags for dashboard — excludes Kaal Sarp id entirely. */
export function shrapDoshaFlagIds(): readonly string[] {
  return ['pitru', 'matru', 'sarpa', 'guru', 'brahmin', 'stri'] as const
}
