// ─────────────────────────────────────────────────────────────
//  src/lib/engine/shrap/financeJupiter.ts
//  6th-house lending / recovery risk + Jupiter remedy timing
// ─────────────────────────────────────────────────────────────

import type { ChartOutput } from '@/types/astrology'
import { GRAHA_NAMES, RASHI_NAMES } from '@/types/astrology'
import {
  findGraha,
  houseOf,
  isDebilitated,
  isWeakDignity,
  occupantsOfHouse,
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

export function analyzeLendingRisk(chart: ChartOutput): LendingReading | null {
  const asc = chart.lagnas?.ascRashi
  if (!asc || !chart.grahas?.length) return null

  const occ = occupantsOfHouse(chart, 6)
  const ids = occ.map(g => g.id)
  const sixthOccupants = occ.map(g => GRAHA_NAMES[g.id] ?? g.id)
  const juIn6 = ids.includes('Ju')
  const maIn6 = ids.includes('Ma')
  const raIn6 = ids.includes('Ra')

  const notes: string[] = []
  if (juIn6) {
    const ju = findGraha(chart, 'Ju')
    const signNote = ju ? ` in ${RASHI_NAMES[ju.rashi]}` : ''
    notes.push(
      `Jupiter in the 6th${signNote}: money given tends not to return — avoid lending significant amounts. The 6th can create Lakshmi-style abundance for the *recipient* of your money, not for you.`,
    )
  }
  if (maIn6) {
    notes.push('Mars in the 6th: same recovery risk — loans and disputes often fail to settle cleanly.')
  }
  if (raIn6) {
    notes.push('Rahu in the 6th: can inflate the other party’s gain from what you lend — verify before releasing funds.')
  }
  if (!notes.length) {
    notes.push('6th house is not occupied by Jupiter, Mars, or Rahu — no automatic “money won’t return” flag from this rule set.')
  }
  notes.push(
    '6th house shows loans, disputes, enemies, and legal matters. Always weigh the running dasha at the time of lending vs expected return.',
  )

  const avoidLending = juIn6 || maIn6
  let severity: ShrapSeverity = 'clear'
  if (juIn6 && maIn6) severity = 'strong'
  else if (avoidLending || raIn6) severity = 'watch'

  return {
    headline: avoidLending
      ? 'Lending looks risky from the 6th-house rule set'
      : 'No hard 6th-house Jupiter/Mars lending block',
    severity,
    avoidLending,
    sixthOccupants,
    notes,
    checkList: [
      'Open the 6th house before lending significant amounts',
      'Check dasha running at lending vs expected return',
      'If Jupiter or Mars sits in 6th, prefer not to lend — or lend only what you can gift',
    ],
  }
}

export function analyzeJupiterRemedyTiming(chart: ChartOutput): JupiterRemedyReading | null {
  const ju = findGraha(chart, 'Ju')
  const asc = chart.lagnas?.ascRashi
  if (!ju || !asc) return null

  const house = houseOf(chart, 'Ju')
  const dusthana = house != null && [6, 8, 12].includes(house)
  const retrograde = !!ju.isRetro
  const combust = !!ju.isCombust
  const weak = isDebilitated(ju.dignity) || isWeakDignity(ju.dignity)

  const conditionTable = [
    {
      condition: 'Well-placed (own, exalted, friendly)',
      effect: 'Remedies work at standard pace',
      active: !weak && !dusthana && !combust,
    },
    {
      condition: 'Retrograde',
      effect: 'Blessings delayed — remedies need more time',
      active: retrograde,
    },
    {
      condition: 'Combust (within ~11° of Sun)',
      effect: 'Blessings still possible but difficult',
      active: combust,
    },
    {
      condition: 'In 6th, 8th, or 12th',
      effect: 'Blessings come with struggle / hard work',
      active: dusthana,
    },
    {
      condition: 'Debilitated / weak dignity',
      effect: 'Remedies need significantly longer duration',
      active: weak,
    },
  ]

  const standardDays = 40
  let recommendedDays = standardDays
  if (isDebilitated(ju.dignity) || (weak && (dusthana || combust))) {
    recommendedDays = 108
  } else if (weak || dusthana || combust || retrograde) {
    recommendedDays = Math.max(standardDays, 64)
  }

  const notes: string[] = [
    `Jupiter is in ${RASHI_NAMES[ju.rashi]}, house ${house ?? '—'}, dignity ${ju.dignity?.replace(/_/g, ' ') ?? 'unknown'}.`,
    `Standard remedy window: ${standardDays} days. Recommended here: ${recommendedDays} days.`,
  ]
  if (house === 6) {
    notes.push(
      'Jupiter in 6th is not automatically “bad” — it means extra effort for results. Wealth-sign placements in 6th still favour the other party when you lend.',
    )
  }
  notes.push('Principle: the weaker Jupiter is, the longer the remedy period must run.')

  let severity: ShrapSeverity = 'clear'
  if (recommendedDays >= 108) severity = 'strong'
  else if (recommendedDays > standardDays) severity = 'watch'

  return {
    headline:
      recommendedDays >= 108
        ? 'Jupiter is weak — run remedies at least 108 days'
        : recommendedDays > standardDays
          ? 'Jupiter needs a longer-than-standard remedy window'
          : 'Jupiter supports a standard ~40-day remedy window',
    severity,
    jupiterHouse: house,
    jupiterSign: RASHI_NAMES[ju.rashi],
    dignity: ju.dignity?.replace(/_/g, ' ') ?? 'unknown',
    retrograde,
    combust,
    standardDays,
    recommendedDays,
    notes,
    conditionTable,
  }
}

