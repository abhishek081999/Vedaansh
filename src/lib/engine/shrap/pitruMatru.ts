// ─────────────────────────────────────────────────────────────
//  src/lib/engine/shrap/pitruMatru.ts
//  Pitru Dosha (Sun / 9th) and Matru Dosha (Moon / 4th)
//  Teaching: BPHS mentions Pitru; Matru from Nadi / specialized texts
// ─────────────────────────────────────────────────────────────

import type { ChartOutput } from '@/types/astrology'
import {
  emptyVerdict,
  findGraha,
  gn,
  houseOf,
  isDebilitated,
  lordAfflictedByNodesOrSaturn,
  lordOfHouse,
  maleficsOnHouse,
  onNodeAxis,
  severityFromScore,
  vargaHouseOf,
  vargaMaleficsOnHouse,
  type ShrapDoshaVerdict,
  type ShrapIndicator,
} from '@/lib/engine/shrap/helpers'

const PITRU_EFFECTS = [
  'Projects start but get interrupted or ruined',
  'Lack of blessings or support from paternal figures',
  'Bhagya (fortune) opens late in life',
  'Issues with children (health or birth complications)',
  'Results come slowly even when effort is present',
]

const PITRU_REMEDIES = [
  'Pitru Gayatri Mantra — regular chanting',
  'Tarpan (ancestral water offering) on Amavasya or during Pitru Paksha',
  'Sacred tarpan locations: Gaya (most powerful), Ujjain, Badrinath, Hastinapur',
  'Surya Arghya — daily water offering to the Sun at sunrise',
  'Surya Gayatri and Gayatri Mantra — daily chanting',
  'Interim: Pitru Gayatri + Surya worship while arranging formal tarpan',
]

const MATRU_EFFECTS = [
  'Emotional turmoil and confusion',
  'Persistent low mood or hopelessness',
  'Home environment rarely calm',
  'Forced or frequent changes of residence',
  'Mother’s health under strain (physical or mental)',
  'Seeking peace at home but finding none — often misread as Vastu alone',
]

const MATRU_REMEDIES = [
  'Durga Saptashati — regular recitation',
  'Shiva Abhishek — ritual bathing of Shivlinga',
  'Seva at Vridha Ashrams (old-age homes) or Vidhava Ashrams (widow shelters)',
  'Tarpan for female ancestors as well (not exclusively for male line)',
  'If the 5th house is also involved, prioritize tarpan',
]

export function analyzePitruDosha(chart: ChartOutput): ShrapDoshaVerdict {
  const sun = findGraha(chart, 'Su')
  const ra = findGraha(chart, 'Ra')
  const ke = findGraha(chart, 'Ke')
  if (!sun || !chart.lagnas?.ascRashi) {
    return emptyVerdict(
      'pitru',
      'Pitru Dosha',
      'Sun',
      '9th',
      'Tarpan, Surya Arghya, Pitru Gayatri',
      'Sun data unavailable — recalculate the chart.',
      PITRU_EFFECTS,
      PITRU_REMEDIES,
    )
  }

  const indicators: ShrapIndicator[] = []
  let score = 0

  const sunHouse = houseOf(chart, 'Su')
  if (isDebilitated(sun.dignity)) {
    score += 1
    indicators.push({ id: 'sun-deb', text: `Sun is debilitated in ${gn('Su')}’s chart placement` })
  }
  if (onNodeAxis(chart, 'Su')) {
    score += 1
    indicators.push({ id: 'sun-nodes', text: 'Sun sits on the Rahu–Ketu axis' })
  }

  // Surya-Rahu Grahan Yoga (same sign)
  if (ra && sun.rashi === ra.rashi) {
    score += 1
    indicators.push({ id: 'surya-rahu', text: 'Surya–Rahu Grahan Yoga (Sun with Rahu)' })
  }
  if (ke && sun.rashi === ke.rashi) {
    score += 0.5
    indicators.push({ id: 'surya-ketu', text: 'Sun with Ketu — ancestral / pitru pressure theme' })
  }

  const h9Mal = maleficsOnHouse(chart, 9).filter(id => id === 'Ra' || id === 'Ke' || id === 'Sa' || id === 'Ma')
  if (h9Mal.length >= 1) {
    score += h9Mal.length >= 2 ? 1.5 : 1
    indicators.push({
      id: 'h9-mal',
      text: `9th house afflicted by ${h9Mal.map(gn).join(', ')}`,
    })
  }

  const lord9 = lordOfHouse(chart, 9)
  if (lord9) {
    const hits = lordAfflictedByNodesOrSaturn(chart, lord9)
    if (hits.length) {
      score += 1
      indicators.push({
        id: 'l9-aff',
        text: `9th lord ${gn(lord9)} afflicted by ${hits.map(gn).join(', ')}`,
      })
    }
    const l9 = findGraha(chart, lord9)
    if (l9 && isDebilitated(l9.dignity)) {
      score += 0.5
      indicators.push({ id: 'l9-deb', text: `9th lord ${gn(lord9)} is debilitated` })
    }
  }

  // D9 confirmation — same pattern repeating
  const d9SunHouse = vargaHouseOf(chart, 'D9', 'Su')
  const d9H9Mal = vargaMaleficsOnHouse(chart, 'D9', 9)
  const d9Repeat =
    (d9SunHouse != null && (d9SunHouse === 9 || onNodeAxis(chart, 'Su'))) ||
    d9H9Mal.some(id => id === 'Ra' || id === 'Ke' || id === 'Sa')
  if (d9Repeat && score >= 1) {
    score += 1
    indicators.push({
      id: 'd9-repeat',
      text: 'Pattern also shows in D9 (Navamsa) — severity confirmation',
    })
  } else if (chart.vargas?.D9?.length && score >= 1) {
    indicators.push({
      id: 'd9-absent',
      text: 'D9 does not strongly repeat the Pitru pattern — D1 remains the primary signal',
    })
  }

  if (sunHouse === 9 && score < 1) {
    indicators.push({ id: 'sun-h9', text: 'Sun in 9th — father / dharma seat; weigh dignity and aspects' })
  }

  const severity = severityFromScore(score)
  const present = severity !== 'clear'

  return {
    id: 'pitru',
    label: 'Pitru Dosha',
    present,
    severity,
    summary: present
      ? `Pitru (ancestral / father’s) affliction looks ${severity}. Primary lenses: Sun, 9th house, and 9th lord${d9Repeat ? ', with D9 confirmation' : ''}.`
      : 'No clear Pitru Dosha from Sun / 9th / node patterns in this chart.',
    indicators,
    effects: PITRU_EFFECTS,
    remedies: PITRU_REMEDIES,
    primaryPlanet: 'Sun',
    primaryHouse: '9th',
    keyRemedy: 'Tarpan, Surya Arghya, Pitru Gayatri',
  }
}

export function analyzeMatruDosha(chart: ChartOutput): ShrapDoshaVerdict {
  const moon = findGraha(chart, 'Mo')
  if (!moon || !chart.lagnas?.ascRashi) {
    return emptyVerdict(
      'matru',
      'Matru Dosha',
      'Moon',
      '4th',
      'Durga Saptashati, Shiva Abhishek, widow seva',
      'Moon data unavailable — recalculate the chart.',
      MATRU_EFFECTS,
      MATRU_REMEDIES,
    )
  }

  const indicators: ShrapIndicator[] = []
  let score = 0

  if (isDebilitated(moon.dignity)) {
    score += 1
    indicators.push({ id: 'mo-deb', text: 'Moon is debilitated' })
  }
  if (onNodeAxis(chart, 'Mo')) {
    score += 1
    indicators.push({ id: 'mo-nodes', text: 'Moon sits on the Rahu–Ketu axis' })
  }
  if (moon.isCombust) {
    score += 0.5
    indicators.push({ id: 'mo-combust', text: 'Moon is combust (too close to the Sun)' })
  }

  const h4Mal = maleficsOnHouse(chart, 4).filter(id => ['Ra', 'Ke', 'Sa', 'Ma', 'Su'].includes(id))
  if (h4Mal.length >= 1) {
    score += h4Mal.length >= 2 ? 1.5 : 1
    indicators.push({
      id: 'h4-mal',
      text: `4th house afflicted by ${h4Mal.map(gn).join(', ')}`,
    })
  }

  const lord4 = lordOfHouse(chart, 4)
  if (lord4) {
    const l4 = findGraha(chart, lord4)
    if (l4 && isDebilitated(l4.dignity)) {
      score += 1
      indicators.push({ id: 'l4-deb', text: `4th lord ${gn(lord4)} is debilitated` })
    }
    const hits = lordAfflictedByNodesOrSaturn(chart, lord4)
    if (hits.length) {
      score += 1
      indicators.push({
        id: 'l4-aff',
        text: `4th lord ${gn(lord4)} afflicted by ${hits.map(gn).join(', ')}`,
      })
    }
  }

  // Moon afflicted in D1 by malefics (conjunction / aspect)
  const moonMal = lordAfflictedByNodesOrSaturn(chart, 'Mo')
  const mars = findGraha(chart, 'Ma')
  if (mars && (mars.rashi === moon.rashi || onNodeAxis(chart, 'Mo'))) {
    // already counted nodes; add Mars conjunction
  }
  if (moonMal.length && !indicators.some(i => i.id === 'mo-nodes')) {
    score += 0.5
    indicators.push({
      id: 'mo-mal',
      text: `Moon pressured by ${moonMal.map(gn).join(', ')}`,
    })
  }

  const h5Also = maleficsOnHouse(chart, 5).length >= 2
  if (h5Also && score >= 1) {
    indicators.push({
      id: 'h5-link',
      text: '5th house also under pressure — tarpan becomes especially important',
    })
  }

  const severity = severityFromScore(score)
  const present = severity !== 'clear'

  return {
    id: 'matru',
    label: 'Matru Dosha',
    present,
    severity,
    summary: present
      ? `Matru (mother / home peace) affliction looks ${severity}. Primary lenses: Moon, 4th house, and 4th lord.`
      : 'No clear Matru Dosha from Moon / 4th patterns in this chart.',
    indicators,
    effects: MATRU_EFFECTS,
    remedies: MATRU_REMEDIES,
    primaryPlanet: 'Moon',
    primaryHouse: '4th',
    keyRemedy: 'Durga Saptashati, Shiva Abhishek, widow seva',
  }
}
