// ─────────────────────────────────────────────────────────────
//  src/lib/engine/shrap/financeJupiter.ts
//  6th-house lending / recovery risk + Jupiter remedy timing
// ─────────────────────────────────────────────────────────────

import type { ChartOutput, GrahaId } from '@/types/astrology'
import type { EngineLang } from '@/lib/engine/lang'
import { SHRAP_HI } from '@/lib/engine/locale/shrapDosha.hi'
import {
  dignityWord,
  findGraha,
  gn,
  houseOf,
  isDebilitated,
  isWeakDignity,
  occupantsOfHouse,
  rn,
  tx,
  txList,
  type ShrapSeverity,
} from '@/lib/engine/shrap/helpers'

export interface LendingReading {
  headline: string
  severity: ShrapSeverity
  avoidLending: boolean
  sixthOccupants: string[]
  notes: string[]
  checkList: string[]
}

export interface JupiterRemedyReading {
  headline: string
  severity: ShrapSeverity
  jupiterHouse: number | null
  jupiterSign: string
  dignity: string
  retrograde: boolean
  combust: boolean
  standardDays: number
  recommendedDays: number
  notes: string[]
  conditionTable: Array<{ condition: string; effect: string; active: boolean }>
}

export function analyzeLendingRisk(chart: ChartOutput, lang: EngineLang = 'en'): LendingReading | null {
  const asc = chart.lagnas?.ascRashi
  if (!asc || !chart.grahas?.length) return null

  const occ = occupantsOfHouse(chart, 6)
  const ids = occ.map(g => g.id)
  const sixthOccupants = occ.map(g => gn(g.id as GrahaId, lang))
  const L = SHRAP_HI.lending
  const juIn6 = ids.includes('Ju')
  const maIn6 = ids.includes('Ma')
  const raIn6 = ids.includes('Ra')

  const notes: string[] = []
  if (juIn6) {
    const ju = findGraha(chart, 'Ju')
    const signNote = ju ? ` in ${rn(ju.rashi, 'en')}` : ''
    notes.push(tx(
      lang,
      `Jupiter in the 6th${signNote}: money given tends not to return — avoid lending significant amounts. The 6th can create Lakshmi-style abundance for the *recipient* of your money, not for you.`,
      L.ju,
      {
        graha: gn('Ju', lang),
        sign: ju ? tx(lang, '', L.signIn, { rashi: rn(ju.rashi, lang) }) : '',
      },
    ))
  }
  if (maIn6) {
    notes.push(tx(lang, 'Mars in the 6th: same recovery risk — loans and disputes often fail to settle cleanly.', L.ma))
  }
  if (raIn6) {
    notes.push(tx(lang, 'Rahu in the 6th: can inflate the other party’s gain from what you lend — verify before releasing funds.', L.ra))
  }
  if (!notes.length) {
    notes.push(tx(lang, '6th house is not occupied by Jupiter, Mars, or Rahu — no automatic “money won’t return” flag from this rule set.', L.clear))
  }
  notes.push(tx(
    lang,
    '6th house shows loans, disputes, enemies, and legal matters. Always weigh the running dasha at the time of lending vs expected return.',
    L.always,
  ))

  const avoidLending = juIn6 || maIn6
  let severity: ShrapSeverity = 'clear'
  if (juIn6 && maIn6) severity = 'strong'
  else if (avoidLending || raIn6) severity = 'watch'

  return {
    headline: avoidLending
      ? tx(lang, 'Lending looks risky from the 6th-house rule set', L.headlineRisk)
      : tx(lang, 'No hard 6th-house Jupiter/Mars lending block', L.headlineClear),
    severity,
    avoidLending,
    sixthOccupants,
    notes,
    checkList: txList(lang, [
      'Open the 6th house before lending significant amounts',
      'Check dasha running at lending vs expected return',
      'If Jupiter or Mars sits in 6th, prefer not to lend — or lend only what you can gift',
    ], L.check),
  }
}

export function analyzeJupiterRemedyTiming(chart: ChartOutput, lang: EngineLang = 'en'): JupiterRemedyReading | null {
  const ju = findGraha(chart, 'Ju')
  const asc = chart.lagnas?.ascRashi
  if (!ju || !asc) return null

  const house = houseOf(chart, 'Ju')
  const dusthana = house != null && [6, 8, 12].includes(house)
  const retrograde = !!ju.isRetro
  const combust = !!ju.isCombust
  const weak = isDebilitated(ju.dignity) || isWeakDignity(ju.dignity)

  const J = SHRAP_HI.jupiter
  const conditionEn = [
    { condition: 'Well-placed (own, exalted, friendly)', effect: 'Remedies work at standard pace' },
    { condition: 'Retrograde', effect: 'Blessings delayed — remedies need more time' },
    { condition: 'Combust (within ~11° of Sun)', effect: 'Blessings still possible but difficult' },
    { condition: 'In 6th, 8th, or 12th', effect: 'Blessings come with struggle / hard work' },
    { condition: 'Debilitated / weak dignity', effect: 'Remedies need significantly longer duration' },
  ]
  const activeFlags = [
    !weak && !dusthana && !combust,
    retrograde,
    combust,
    dusthana,
    weak,
  ]
  const conditionTable = conditionEn.map((row, i) => ({
    condition: tx(lang, row.condition, J.conditions[i].condition),
    effect: tx(lang, row.effect, J.conditions[i].effect),
    active: activeFlags[i],
  }))

  const standardDays = 40
  let recommendedDays = standardDays
  if (isDebilitated(ju.dignity) || (weak && (dusthana || combust))) {
    recommendedDays = 108
  } else if (weak || dusthana || combust || retrograde) {
    recommendedDays = Math.max(standardDays, 64)
  }

  const dignity = dignityWord(ju.dignity, lang, 'unknown')
  const sign = rn(ju.rashi, lang)
  const notes: string[] = [
    tx(
      lang,
      `Jupiter is in ${rn(ju.rashi, 'en')}, house ${house ?? '—'}, dignity ${dignityWord(ju.dignity, 'en', 'unknown')}.`,
      J.place,
      { graha: gn('Ju', lang), sign, house: house ?? '—', dignity },
    ),
    tx(
      lang,
      `Standard remedy window: ${standardDays} days. Recommended here: ${recommendedDays} days.`,
      J.window,
      { standard: standardDays, days: recommendedDays },
    ),
  ]
  if (house === 6) {
    notes.push(tx(
      lang,
      'Jupiter in 6th is not automatically “bad” — it means extra effort for results. Wealth-sign placements in 6th still favour the other party when you lend.',
      J.sixth,
    ))
  }
  notes.push(tx(lang, 'Principle: the weaker Jupiter is, the longer the remedy period must run.', J.principle))

  let severity: ShrapSeverity = 'clear'
  if (recommendedDays >= 108) severity = 'strong'
  else if (recommendedDays > standardDays) severity = 'watch'

  return {
    headline: recommendedDays >= 108
      ? tx(lang, 'Jupiter is weak — run remedies at least 108 days', J.headline108)
      : recommendedDays > standardDays
        ? tx(lang, 'Jupiter needs a longer-than-standard remedy window', J.headlineLong)
        : tx(lang, 'Jupiter supports a standard ~40-day remedy window', J.headlineStd),
    severity,
    jupiterHouse: house,
    jupiterSign: sign,
    dignity,
    retrograde,
    combust,
    standardDays,
    recommendedDays,
    notes,
    conditionTable,
  }
}

