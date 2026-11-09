// ─────────────────────────────────────────────────────────────
//  src/lib/engine/shrap/pitruMatru.ts
//  Pitru Dosha (Sun / 9th) and Matru Dosha (Moon / 4th)
//  Teaching: BPHS mentions Pitru; Matru from Nadi / specialized texts
// ─────────────────────────────────────────────────────────────

import type { ChartOutput } from '@/types/astrology'
import type { EngineLang } from '@/lib/engine/lang'
import { SHRAP_HI, SHRAP_SEV_HI } from '@/lib/engine/locale/shrapDosha.hi'
import {
  emptyVerdict,
  findGraha,
  gn,
  gnList,
  houseOf,
  isDebilitated,
  lordAfflictedByNodesOrSaturn,
  lordOfHouse,
  maleficsOnHouse,
  onNodeAxis,
  severityFromScore,
  tx,
  txList,
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

export function analyzePitruDosha(chart: ChartOutput, lang: EngineLang = 'en'): ShrapDoshaVerdict {
  const sun = findGraha(chart, 'Su')
  const ra = findGraha(chart, 'Ra')
  const ke = findGraha(chart, 'Ke')
  const P = SHRAP_HI.pitru
  const effects = txList(lang, PITRU_EFFECTS, P.effects)
  const remedies = txList(lang, PITRU_REMEDIES, P.remedies)
  if (!sun || !chart.lagnas?.ascRashi) {
    return emptyVerdict(
      'pitru',
      tx(lang, 'Pitru Dosha', P.label),
      gn('Su', lang),
      tx(lang, '9th', SHRAP_HI.houses.h9),
      tx(lang, 'Tarpan, Surya Arghya, Pitru Gayatri', P.key),
      tx(lang, 'Sun data unavailable — recalculate the chart.', P.unavailable),
      effects,
      remedies,
    )
  }

  const indicators: ShrapIndicator[] = []
  let score = 0

  const sunHouse = houseOf(chart, 'Su')
  if (isDebilitated(sun.dignity)) {
    score += 1
    indicators.push({
      id: 'sun-deb',
      text: tx(lang, `Sun is debilitated in ${gn('Su')}’s chart placement`, P.sunDeb, { graha: gn('Su', lang) }),
    })
  }
  if (onNodeAxis(chart, 'Su')) {
    score += 1
    indicators.push({ id: 'sun-nodes', text: tx(lang, 'Sun sits on the Rahu–Ketu axis', P.sunNodes) })
  }

  // Surya-Rahu Grahan Yoga (same sign)
  if (ra && sun.rashi === ra.rashi) {
    score += 1
    indicators.push({ id: 'surya-rahu', text: tx(lang, 'Surya–Rahu Grahan Yoga (Sun with Rahu)', P.suryaRahu) })
  }
  if (ke && sun.rashi === ke.rashi) {
    score += 0.5
    indicators.push({ id: 'surya-ketu', text: tx(lang, 'Sun with Ketu — ancestral / pitru pressure theme', P.suryaKetu) })
  }

  const h9Mal = maleficsOnHouse(chart, 9).filter(id => id === 'Ra' || id === 'Ke' || id === 'Sa' || id === 'Ma')
  if (h9Mal.length >= 1) {
    score += h9Mal.length >= 2 ? 1.5 : 1
    indicators.push({
      id: 'h9-mal',
      text: tx(lang, `9th house afflicted by ${h9Mal.map(gn).join(', ')}`, P.h9, { grahas: gnList(h9Mal, lang) }),
    })
  }

  const lord9 = lordOfHouse(chart, 9)
  if (lord9) {
    const hits = lordAfflictedByNodesOrSaturn(chart, lord9)
    if (hits.length) {
      score += 1
      indicators.push({
        id: 'l9-aff',
        text: tx(lang, `9th lord ${gn(lord9)} afflicted by ${hits.map(gn).join(', ')}`, P.l9aff, {
          lord: gn(lord9, lang),
          hits: gnList(hits, lang),
        }),
      })
    }
    const l9 = findGraha(chart, lord9)
    if (l9 && isDebilitated(l9.dignity)) {
      score += 0.5
      indicators.push({ id: 'l9-deb', text: tx(lang, `9th lord ${gn(lord9)} is debilitated`, P.l9deb, { lord: gn(lord9, lang) }) })
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
      text: tx(lang, 'Pattern also shows in D9 (Navamsa) — severity confirmation', P.d9repeat),
    })
  } else if (chart.vargas?.D9?.length && score >= 1) {
    indicators.push({
      id: 'd9-absent',
      text: tx(lang, 'D9 does not strongly repeat the Pitru pattern — D1 remains the primary signal', P.d9absent),
    })
  }

  if (sunHouse === 9 && score < 1) {
    indicators.push({ id: 'sun-h9', text: tx(lang, 'Sun in 9th — father / dharma seat; weigh dignity and aspects', P.sunH9) })
  }

  const severity = severityFromScore(score)
  const present = severity !== 'clear'

  const sev = lang === 'hi' ? SHRAP_SEV_HI[severity] : severity
  return {
    id: 'pitru',
    label: tx(lang, 'Pitru Dosha', P.label),
    present,
    severity,
    summary: present
      ? tx(
          lang,
          `Pitru (ancestral / father’s) affliction looks ${severity}. Primary lenses: Sun, 9th house, and 9th lord${d9Repeat ? ', with D9 confirmation' : ''}.`,
          P.summaryOn,
          { sev, d9: d9Repeat ? P.summaryOnD9 : '' },
        )
      : tx(lang, 'No clear Pitru Dosha from Sun / 9th / node patterns in this chart.', P.summaryOff),
    indicators,
    effects,
    remedies,
    primaryPlanet: gn('Su', lang),
    primaryHouse: tx(lang, '9th', SHRAP_HI.houses.h9),
    keyRemedy: tx(lang, 'Tarpan, Surya Arghya, Pitru Gayatri', P.key),
  }
}

export function analyzeMatruDosha(chart: ChartOutput, lang: EngineLang = 'en'): ShrapDoshaVerdict {
  const moon = findGraha(chart, 'Mo')
  const M = SHRAP_HI.matru
  const effects = txList(lang, MATRU_EFFECTS, M.effects)
  const remedies = txList(lang, MATRU_REMEDIES, M.remedies)
  if (!moon || !chart.lagnas?.ascRashi) {
    return emptyVerdict(
      'matru',
      tx(lang, 'Matru Dosha', M.label),
      gn('Mo', lang),
      tx(lang, '4th', SHRAP_HI.houses.h4),
      tx(lang, 'Durga Saptashati, Shiva Abhishek, widow seva', M.key),
      tx(lang, 'Moon data unavailable — recalculate the chart.', M.unavailable),
      effects,
      remedies,
    )
  }

  const indicators: ShrapIndicator[] = []
  let score = 0

  if (isDebilitated(moon.dignity)) {
    score += 1
    indicators.push({ id: 'mo-deb', text: tx(lang, 'Moon is debilitated', M.deb) })
  }
  if (onNodeAxis(chart, 'Mo')) {
    score += 1
    indicators.push({ id: 'mo-nodes', text: tx(lang, 'Moon sits on the Rahu–Ketu axis', M.nodes) })
  }
  if (moon.isCombust) {
    score += 0.5
    indicators.push({ id: 'mo-combust', text: tx(lang, 'Moon is combust (too close to the Sun)', M.combust) })
  }

  const h4Mal = maleficsOnHouse(chart, 4).filter(id => ['Ra', 'Ke', 'Sa', 'Ma', 'Su'].includes(id))
  if (h4Mal.length >= 1) {
    score += h4Mal.length >= 2 ? 1.5 : 1
    indicators.push({
      id: 'h4-mal',
      text: tx(lang, `4th house afflicted by ${h4Mal.map(gn).join(', ')}`, M.h4, { grahas: gnList(h4Mal, lang) }),
    })
  }

  const lord4 = lordOfHouse(chart, 4)
  if (lord4) {
    const l4 = findGraha(chart, lord4)
    if (l4 && isDebilitated(l4.dignity)) {
      score += 1
      indicators.push({ id: 'l4-deb', text: tx(lang, `4th lord ${gn(lord4)} is debilitated`, M.l4deb, { lord: gn(lord4, lang) }) })
    }
    const hits = lordAfflictedByNodesOrSaturn(chart, lord4)
    if (hits.length) {
      score += 1
      indicators.push({
        id: 'l4-aff',
        text: tx(lang, `4th lord ${gn(lord4)} afflicted by ${hits.map(gn).join(', ')}`, M.l4aff, {
          lord: gn(lord4, lang),
          hits: gnList(hits, lang),
        }),
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
      text: tx(lang, `Moon pressured by ${moonMal.map(gn).join(', ')}`, M.moonPress, { grahas: gnList(moonMal, lang) }),
    })
  }

  const h5Also = maleficsOnHouse(chart, 5).length >= 2
  if (h5Also && score >= 1) {
    indicators.push({
      id: 'h5-link',
      text: tx(lang, '5th house also under pressure — tarpan becomes especially important', M.h5),
    })
  }

  const severity = severityFromScore(score)
  const present = severity !== 'clear'

  const sev = lang === 'hi' ? SHRAP_SEV_HI[severity] : severity
  return {
    id: 'matru',
    label: tx(lang, 'Matru Dosha', M.label),
    present,
    severity,
    summary: present
      ? tx(lang, `Matru (mother / home peace) affliction looks ${severity}. Primary lenses: Moon, 4th house, and 4th lord.`, M.summaryOn, { sev })
      : tx(lang, 'No clear Matru Dosha from Moon / 4th patterns in this chart.', M.summaryOff),
    indicators,
    effects,
    remedies,
    primaryPlanet: gn('Mo', lang),
    primaryHouse: tx(lang, '4th', SHRAP_HI.houses.h4),
    keyRemedy: tx(lang, 'Durga Saptashati, Shiva Abhishek, widow seva', M.key),
  }
}
