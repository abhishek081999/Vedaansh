// ─────────────────────────────────────────────────────────────
//  src/lib/engine/numerology/remedies.ts
//  Personalized Anka Jyotish remedy package — aggregated from
//  weak/enemy numbers, missing grid numbers, karmic debts,
//  challenging personal year and Moolank–Bhagyank tension
// ─────────────────────────────────────────────────────────────

import type { EngineLang } from '@/lib/engine/lang'
import { fill } from '@/lib/engine/lang'
import { REMEDY_HI } from '@/lib/engine/locale/numerologyRemedies.hi'
import {
  getNumberFriendship,
  numberHarmony,
  type Harmony,
} from './core'
import {
  NUMBER_PROFILES,
  getNumberProfile,
  missingNumberEffect,
  personalYearTheme,
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
  lang?: EngineLang
}): RemedyPackage {
  const { moolank, bhagyank, namank, personalYear, missingNumbers, karmicDebts, coreHarmony } = input
  const lang = input.lang ?? 'en'
  const hi = lang === 'hi'
  const profile = (n: CoreNumber) => getNumberProfile(n, lang)
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
    const mProf = profile(moolank)
    const bProf = profile(bhagyank)
    items.push({
      id: 'core-tension',
      priority: 'urgent',
      category: 'lifestyle',
      title: hi ? fill(REMEDY_HI.coreTitle, { m: moolank, b: bhagyank }) : `Bridge Moolank ${moolank} and Bhagyank ${bhagyank}`,
      detail: hi
        ? fill(REMEDY_HI.coreDetail, { day1: mProf.fastingDay, planet1: mProf.planet, day2: bProf.fastingDay, planet2: bProf.planet })
        : `These rulers are natural enemies. Strengthen ${mProf.planet} remedies on ${mProf.fastingDay}s and ${bProf.planet} remedies on ${bProf.fastingDay}s — never wear both primary gemstones together without a trial.`,
      source: hi ? REMEDY_HI.coreSource : 'Moolank–Bhagyank harmony',
    })
  }

  if (numberHarmony(personalYear, moolank) === 'challenging') {
    pushFocus(personalYear)
    items.push({
      id: 'year-caution',
      priority: 'urgent',
      category: 'lifestyle',
      title: hi ? fill(REMEDY_HI.yearTitle, { py: personalYear }) : `Personal year ${personalYear} challenges your Moolank`,
      detail: hi
        ? fill(REMEDY_HI.yearDetail, {
          guidance: personalYearTheme(personalYear, lang).guidance,
          color: profile(moolank).luckyColors[0] ?? '',
          enemies: friends.enemies.join(', ') || '—',
        })
        : `${personalYearTheme(personalYear, lang).guidance} Move slowly this year; favour ${profile(moolank).luckyColors[0]} clothing on important days and avoid launching on dates that reduce to enemy numbers ${friends.enemies.join(', ') || '—'}.`,
      forNumber: personalYear,
      source: hi ? REMEDY_HI.yearSource : 'Personal year',
    })
  }

  // Missing grid numbers
  for (const n of missingNumbers) {
    pushFocus(n)
    const miss = missingNumberEffect(n, lang)
    const p = profile(n)
    items.push({
      id: `missing-${n}`,
      priority: missingNumbers.length <= 3 ? 'important' : 'supportive',
      category: 'lifestyle',
      title: hi ? fill(REMEDY_HI.missingTitle, { n, planet: p.planet }) : `Activate missing number ${n} (${p.planet})`,
      detail: `${miss.effect} ${miss.remedy}`,
      forNumber: n,
      source: hi ? REMEDY_HI.missingSource : 'Lo Shu / Vedic grid',
    })
    items.push({
      id: `missing-mantra-${n}`,
      priority: 'supportive',
      category: 'mantra',
      title: hi ? fill(REMEDY_HI.mantraTitle, { n }) : `Beej mantra for ${n}`,
      detail: hi
        ? fill(REMEDY_HI.mantraDetail, { day: p.fastingDay, mantra: p.beejMantra })
        : `Chant 11 or 108 times on ${p.fastingDay}: ${p.beejMantra}`,
      forNumber: n,
      source: hi ? REMEDY_HI.mantraSource : 'Missing number',
    })
  }

  // Karmic debts
  for (const k of karmicDebts) {
    items.push({
      id: `karmic-${k.number}-${k.source}`,
      priority: 'important',
      category: 'lifestyle',
      title: hi ? fill(REMEDY_HI.karmicTitle, { n: k.number, source: k.source }) : `Karmic debt ${k.number} (${k.source})`,
      detail: k.lesson,
      source: hi ? REMEDY_HI.karmicSource : 'Compound karmic debt',
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
        title: hi ? fill(REMEDY_HI.nameTitle, { n: namank }) : `Name number ${namank} needs correction`,
        detail: hi
          ? fill(REMEDY_HI.nameDetail, {
            which: input.nameHarmony.moolank === 'challenging' && input.nameHarmony.bhagyank === 'challenging'
              ? REMEDY_HI.nameWhichBoth
              : input.nameHarmony.moolank === 'challenging' ? REMEDY_HI.nameWhichM : REMEDY_HI.nameWhichB,
          })
          : `Current Namank conflicts with ${input.nameHarmony.moolank === 'challenging' ? 'Moolank' : ''}${input.nameHarmony.moolank === 'challenging' && input.nameHarmony.bhagyank === 'challenging' ? ' and ' : ''}${input.nameHarmony.bhagyank === 'challenging' ? 'Bhagyank' : ''}. Use the Name tab to pick a favourable total, then adjust spelling (add/double a vowel or consonant) and use it consistently on documents.`,
        forNumber: namank,
        source: hi ? REMEDY_HI.nameSource : 'Namank harmony',
      })
    }
  }

  // Core profile remedies for focus numbers
  for (const n of focus.slice(0, 4)) {
    const p = profile(n)
    const enRemedies = NUMBER_PROFILES[n].remedies
    const donateIdx = enRemedies.findIndex(r => /donat/i.test(r))
    items.push({
      id: `worship-${n}`,
      priority: n === moolank || n === personalYear ? 'important' : 'supportive',
      category: 'worship',
      title: hi ? fill(REMEDY_HI.worshipTitle, { deity: p.deity, n }) : `Worship ${p.deity} for number ${n}`,
      detail: p.remedies[0] ?? (hi ? fill(REMEDY_HI.worshipFallback, { day: p.fastingDay, planet: p.planet }) : `Observe ${p.fastingDay} practices for ${p.planet}.`),
      forNumber: n,
      source: hi ? fill(REMEDY_HI.worshipSource, { n }) : `Number ${n} profile`,
    })
    items.push({
      id: `donation-${n}`,
      priority: 'supportive',
      category: 'donation',
      title: hi ? fill(REMEDY_HI.danaTitle, { day: p.fastingDay, n }) : `Dana on ${p.fastingDay} for ${n}`,
      detail: (donateIdx >= 0 ? p.remedies[donateIdx] : undefined)
        ?? (hi ? fill(REMEDY_HI.danaFallback, { day: p.fastingDay, planet: p.planet }) : `Donate items linked to ${p.planet} on ${p.fastingDay}.`),
      forNumber: n,
      source: hi ? fill(REMEDY_HI.worshipSource, { n }) : `Number ${n} profile`,
    })
  }

  // Daily color / metal from Moolank + personal year blend
  const mProfile = profile(moolank)
  const yProfile = profile(personalYear)
  const wearToday = {
    colors: unique([...mProfile.luckyColors.slice(0, 2), yProfile.luckyColors[0]!]),
    avoid: unique([...mProfile.avoidColors, ...yProfile.avoidColors]),
    metal: mProfile.metal,
  }
  items.push({
    id: 'colors-today',
    priority: 'supportive',
    category: 'color',
    title: hi ? REMEDY_HI.colorTitle : 'Wear supportive colours',
    detail: hi
      ? fill(REMEDY_HI.colorDetail, { colors: wearToday.colors.join(', '), avoid: wearToday.avoid.join(', '), metal: wearToday.metal })
      : `Favour ${wearToday.colors.join(', ')}. Avoid ${wearToday.avoid.join(', ')}. Metal: ${wearToday.metal}.`,
    source: hi ? REMEDY_HI.colorSource : 'Moolank + personal year',
  })

  // Direction from Moolank
  items.push({
    id: 'direction',
    priority: 'supportive',
    category: 'direction',
    title: hi ? fill(REMEDY_HI.directionTitle, { dir: mProfile.direction }) : `Face ${mProfile.direction} when working`,
    detail: hi
      ? fill(REMEDY_HI.directionDetail, { n: moolank, planet: mProfile.planet, dir: mProfile.direction })
      : `Number ${moolank} (${mProfile.planet}) is strengthened when your desk, puja or important conversations face ${mProfile.direction}.`,
    forNumber: moolank,
    source: hi ? REMEDY_HI.directionSource : 'Moolank direction',
  })

  // Weekly plan from focus numbers' fasting days
  const dayMap: Record<string, string[]> = {}
  for (const n of focus) {
    const p = profile(n)
    const day = p.fastingDay
    if (!dayMap[day]) dayMap[day] = []
    const action = p.remedies[0] ?? ''
    dayMap[day]!.push(hi ? fill(REMEDY_HI.weeklyAction, { planet: p.planet, n, remedy: action }) : `${p.planet} (${n}): ${action}`)
  }
  const weeklyPlan = Object.entries(dayMap).map(([day, actions]) => ({ day, actions: unique(actions) }))

  const gemstoneAdvice = focus.slice(0, 3).map(n => {
    const p = profile(n)
    return {
      primary: p.gemstone,
      substitute: p.substituteGem,
      caution: n === 8
        ? (hi ? REMEDY_HI.gem8 : 'Blue Sapphire must be trial-tested — never wear permanently without a 3-day trial in silver on the middle finger.')
        : n === 4 || n === 7
          ? (hi ? REMEDY_HI.gem47 : 'Hessonite / Cat\'s Eye should be worn only after checking natal Rahu/Ketu strength with an astrologer.')
          : (hi ? fill(REMEDY_HI.gemOther, { sub: p.substituteGem }) : `Prefer substitute (${p.substituteGem}) if budget or purity of primary stone is uncertain.`),
    }
  })

  const mantraQueue = focus.slice(0, 4).map(n => {
    const p = profile(n)
    return {
      number: n,
      mantra: p.beejMantra,
      deity: p.deity,
      count: n === moolank || n === personalYear
        ? (hi ? REMEDY_HI.countDaily : '108× daily')
        : (hi ? REMEDY_HI.countFast : '11× on fasting day'),
    }
  })

  const presentYogasNote = coreHarmony === 'challenging'
    ? (hi ? REMEDY_HI.priorityTension : 'Priority one is calming Moolank–Bhagyank tension.')
    : missingNumbers.length > 0
      ? (hi ? fill(REMEDY_HI.priorityMissing, { n: missingNumbers.length }) : `Priority one is activating ${missingNumbers.length} missing grid number(s).`)
      : (hi ? REMEDY_HI.priorityKeep : 'Maintain existing strengths with light weekly upkeep.')

  const summary = hi
    ? fill(REMEDY_HI.summary, {
      focus: focus.join(', '),
      note: presentYogasNote,
      color: wearToday.colors[0] ?? '',
      dir: mProfile.direction,
      day: mProfile.fastingDay,
    })
    : `Focus on numbers ${focus.join(', ')}. ${presentYogasNote} This week: wear ${wearToday.colors[0]}, face ${mProfile.direction}, and keep ${mProfile.fastingDay} as your main remedy day.`

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
