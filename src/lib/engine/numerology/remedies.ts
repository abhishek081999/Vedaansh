// ─────────────────────────────────────────────────────────────
//  src/lib/engine/numerology/remedies.ts
//  Personalized Anka Jyotish remedy package — aggregated from
//  weak/enemy numbers, missing grid numbers, karmic debts,
//  challenging personal year and Moolank–Bhagyank tension
// ─────────────────────────────────────────────────────────────

import {
  getNumberFriendship,
  numberHarmony,
  type Harmony,
} from './core'
import {
  MISSING_NUMBER_EFFECTS,
  NUMBER_PROFILES,
  PERSONAL_YEAR_THEMES,
  type CoreNumber,
} from './data'
export interface RemedyKarmicDebt {
  number: number
  source: string
  lesson: string
}

export type RemedyPriority = 'urgent' | 'important' | 'supportive'
export type RemedyCategory =
  | 'mantra'
  | 'gemstone'
  | 'donation'
  | 'fasting'
  | 'color'
  | 'lifestyle'
  | 'worship'
  | 'direction'
  | 'name'

export interface RemedyItem {
  id: string
  priority: RemedyPriority
  category: RemedyCategory
  title: string
  detail: string
  forNumber?: CoreNumber
  source: string
}

export interface RemedyPackage {
  focusNumbers: CoreNumber[]
  wearToday: { colors: string[]; avoid: string[]; metal: string }
  weeklyPlan: { day: string; actions: string[] }[]
  items: RemedyItem[]
  gemstoneAdvice: { primary: string; substitute: string; caution: string }[]
  mantraQueue: { number: CoreNumber; mantra: string; deity: string; count: string }[]
  summary: string
}

function unique<T>(arr: T[]): T[] {
  return [...new Set(arr)]
}

export function buildRemedyPackage(input: {
  moolank: CoreNumber
  bhagyank: CoreNumber
  namank: CoreNumber | null
  personalYear: CoreNumber
  missingNumbers: CoreNumber[]
  karmicDebts: RemedyKarmicDebt[]
  coreHarmony: Harmony
  nameHarmony: { moolank: Harmony; bhagyank: Harmony } | null
}): RemedyPackage {
  const { moolank, bhagyank, namank, personalYear, missingNumbers, karmicDebts, coreHarmony } = input
  const items: RemedyItem[] = []
  const focus: CoreNumber[] = []

  const pushFocus = (n: CoreNumber) => { if (!focus.includes(n)) focus.push(n) }

  // Always strengthen Moolank (self) and current personal year
  pushFocus(moolank)
  if (personalYear !== moolank) pushFocus(personalYear)

  // Strengthen Bhagyank if in destiny phase or always as secondary
  pushFocus(bhagyank)

  // Enemy of Moolank that appears as Bhagyank / personal year
  const friends = getNumberFriendship(moolank)
  if (friends.enemies.includes(bhagyank) || coreHarmony === 'challenging') {
    pushFocus(moolank)
    items.push({
      id: 'core-tension',
      priority: 'urgent',
      category: 'lifestyle',
      title: `Bridge Moolank ${moolank} and Bhagyank ${bhagyank}`,
      detail: `These rulers are natural enemies. Strengthen ${NUMBER_PROFILES[moolank].planet} remedies on ${NUMBER_PROFILES[moolank].fastingDay}s and ${NUMBER_PROFILES[bhagyank].planet} remedies on ${NUMBER_PROFILES[bhagyank].fastingDay}s — never wear both primary gemstones together without a trial.`,
      source: 'Moolank–Bhagyank harmony',
    })
  }

  if (numberHarmony(personalYear, moolank) === 'challenging') {
    pushFocus(personalYear)
    items.push({
      id: 'year-caution',
      priority: 'urgent',
      category: 'lifestyle',
      title: `Personal year ${personalYear} challenges your Moolank`,
      detail: `${PERSONAL_YEAR_THEMES[personalYear].guidance} Move slowly this year; favour ${NUMBER_PROFILES[moolank].luckyColors[0]} clothing on important days and avoid launching on dates that reduce to enemy numbers ${friends.enemies.join(', ') || '—'}.`,
      forNumber: personalYear,
      source: 'Personal year',
    })
  }

  // Missing grid numbers
  for (const n of missingNumbers) {
    pushFocus(n)
    const miss = MISSING_NUMBER_EFFECTS[n]
    const p = NUMBER_PROFILES[n]
    items.push({
      id: `missing-${n}`,
      priority: missingNumbers.length <= 3 ? 'important' : 'supportive',
      category: 'lifestyle',
      title: `Activate missing number ${n} (${p.planet})`,
      detail: `${miss.effect} ${miss.remedy}`,
      forNumber: n,
      source: 'Lo Shu / Vedic grid',
    })
    items.push({
      id: `missing-mantra-${n}`,
      priority: 'supportive',
      category: 'mantra',
      title: `Beej mantra for ${n}`,
      detail: `Chant 11 or 108 times on ${p.fastingDay}: ${p.beejMantra}`,
      forNumber: n,
      source: 'Missing number',
    })
  }

  // Karmic debts
  for (const k of karmicDebts) {
    items.push({
      id: `karmic-${k.number}-${k.source}`,
      priority: 'important',
      category: 'lifestyle',
      title: `Karmic debt ${k.number} (${k.source})`,
      detail: k.lesson,
      source: 'Compound karmic debt',
    })
  }

  // Name misalignment
  if (input.nameHarmony && namank != null) {
    const bad = input.nameHarmony.moolank === 'challenging' || input.nameHarmony.bhagyank === 'challenging'
    if (bad) {
      items.push({
        id: 'name-fix',
        priority: 'important',
        category: 'name',
        title: `Name number ${namank} needs correction`,
        detail: `Current Namank conflicts with ${input.nameHarmony.moolank === 'challenging' ? 'Moolank' : ''}${input.nameHarmony.moolank === 'challenging' && input.nameHarmony.bhagyank === 'challenging' ? ' and ' : ''}${input.nameHarmony.bhagyank === 'challenging' ? 'Bhagyank' : ''}. Use the Name tab to pick a favourable total, then adjust spelling (add/double a vowel or consonant) and use it consistently on documents.`,
        forNumber: namank,
        source: 'Namank harmony',
      })
    }
  }

  // Core profile remedies for focus numbers
  for (const n of focus.slice(0, 4)) {
    const p = NUMBER_PROFILES[n]
    items.push({
      id: `worship-${n}`,
      priority: n === moolank || n === personalYear ? 'important' : 'supportive',
      category: 'worship',
      title: `Worship ${p.deity} for number ${n}`,
      detail: p.remedies[0] ?? `Observe ${p.fastingDay} practices for ${p.planet}.`,
      forNumber: n,
      source: `Number ${n} profile`,
    })
    items.push({
      id: `donation-${n}`,
      priority: 'supportive',
      category: 'donation',
      title: `Dana on ${p.fastingDay} for ${n}`,
      detail: p.remedies.find(r => /donat/i.test(r)) ?? `Donate items linked to ${p.planet} on ${p.fastingDay}.`,
      forNumber: n,
      source: `Number ${n} profile`,
    })
  }

  // Daily color / metal from Moolank + personal year blend
  const mProfile = NUMBER_PROFILES[moolank]
  const yProfile = NUMBER_PROFILES[personalYear]
  const wearToday = {
    colors: unique([...mProfile.luckyColors.slice(0, 2), yProfile.luckyColors[0]!]),
    avoid: unique([...mProfile.avoidColors, ...yProfile.avoidColors]),
    metal: mProfile.metal,
  }
  items.push({
    id: 'colors-today',
    priority: 'supportive',
    category: 'color',
    title: 'Wear supportive colours',
    detail: `Favour ${wearToday.colors.join(', ')}. Avoid ${wearToday.avoid.join(', ')}. Metal: ${wearToday.metal}.`,
    source: 'Moolank + personal year',
  })

  // Direction from Moolank
  items.push({
    id: 'direction',
    priority: 'supportive',
    category: 'direction',
    title: `Face ${mProfile.direction} when working`,
    detail: `Number ${moolank} (${mProfile.planet}) is strengthened when your desk, puja or important conversations face ${mProfile.direction}.`,
    forNumber: moolank,
    source: 'Moolank direction',
  })

  // Weekly plan from focus numbers' fasting days
  const dayMap: Record<string, string[]> = {}
  for (const n of focus) {
    const p = NUMBER_PROFILES[n]
    const day = p.fastingDay
    if (!dayMap[day]) dayMap[day] = []
    dayMap[day]!.push(`${p.planet} (${n}): ${p.remedies[0]}`)
  }
  const weeklyPlan = Object.entries(dayMap).map(([day, actions]) => ({ day, actions: unique(actions) }))

  const gemstoneAdvice = focus.slice(0, 3).map(n => {
    const p = NUMBER_PROFILES[n]
    return {
      primary: p.gemstone,
      substitute: p.substituteGem,
      caution: n === 8
        ? 'Blue Sapphire must be trial-tested — never wear permanently without a 3-day trial in silver on the middle finger.'
        : n === 4 || n === 7
          ? 'Hessonite / Cat\'s Eye should be worn only after checking natal Rahu/Ketu strength with an astrologer.'
          : `Prefer substitute (${p.substituteGem}) if budget or purity of primary stone is uncertain.`,
    }
  })

  const mantraQueue = focus.slice(0, 4).map(n => {
    const p = NUMBER_PROFILES[n]
    return {
      number: n,
      mantra: p.beejMantra,
      deity: p.deity,
      count: n === moolank || n === personalYear ? '108× daily' : '11× on fasting day',
    }
  })

  const presentYogasNote = coreHarmony === 'challenging'
    ? 'Priority one is calming Moolank–Bhagyank tension.'
    : missingNumbers.length > 0
      ? `Priority one is activating ${missingNumbers.length} missing grid number(s).`
      : 'Maintain existing strengths with light weekly upkeep.'

  const summary = `Focus on numbers ${focus.join(', ')}. ${presentYogasNote} This week: wear ${wearToday.colors[0]}, face ${mProfile.direction}, and keep ${mProfile.fastingDay} as your main remedy day.`

  // Sort: urgent → important → supportive
  const order: Record<RemedyPriority, number> = { urgent: 0, important: 1, supportive: 2 }
  items.sort((a, b) => order[a.priority] - order[b.priority])

  return {
    focusNumbers: focus,
    wearToday,
    weeklyPlan,
    items,
    gemstoneAdvice,
    mantraQueue,
    summary,
  }
}
