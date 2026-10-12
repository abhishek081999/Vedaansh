// ─────────────────────────────────────────────────────────────
//  src/lib/engine/numerology/tools.ts
//  Applied Anka Jyotish tools — baby-name suggester, business
//  partnership matcher, and Vimshottari dasha ↔ number timing
// ─────────────────────────────────────────────────────────────

import type { DashaNode, GrahaId } from '@/types/astrology'
import { GRAHA_NAMES } from '@/types/astrology'
import { getDashaPathAt } from '@/lib/engine/dasha/current'
import {
  getBhagyank,
  getMoolank,
  getNameNumber,
  suggestNameTotals,
  type NameTarget,
} from './calc'
import {
  numberHarmony,
  parseBirthDate,
  reduceToCore,
  supportScore,
  type Harmony,
  type ParsedDate,
} from './core'
import {
  CHALDEAN_VALUES,
  CORE_NUMBERS,
  NUMBER_GRAHA,
  NUMBER_PROFILES,
  getCompoundMeaning,
  type CoreNumber,
} from './data'

// ── Graha ↔ number ────────────────────────────────────────────

/** Inverse of NUMBER_GRAHA (Rahu=4, Ketu=7). Outer planets have no Anka mapping. */
export const GRAHA_NUMBER: Partial<Record<GrahaId, CoreNumber>> = {
  Su: 1, Mo: 2, Ju: 3, Ra: 4, Me: 5, Ve: 6, Ke: 7, Sa: 8, Ma: 9,
}

export function numberForGraha(lord: string): CoreNumber | null {
  return GRAHA_NUMBER[lord as GrahaId] ?? null
}

// ── Baby name suggester ───────────────────────────────────────

export interface BabyNameTarget {
  total: number
  root: CoreNumber
  score: number
  compoundTitle: string | null
  quality: 'fortunate' | 'mixed' | null
  why: string
}

export interface BabyLetterGroup {
  root: CoreNumber
  letters: string[]
  planet: string
  note: string
}

export interface BabyNameScore {
  name: string
  compound: number
  root: CoreNumber
  score: number
  verdict: 'excellent' | 'good' | 'acceptable' | 'unfavourable'
  babyHarmony: { moolank: Harmony; bhagyank: Harmony } | null
  parentHarmony: Harmony[]
  compoundMeaning: string | null
  tips: string[]
}

export interface BabyNameSuggestion {
  /** Ideal name roots when baby DOB is known (or parent-friendly roots if not). */
  targetRoots: CoreNumber[]
  luckyTotals: BabyNameTarget[]
  startingLetters: BabyLetterGroup[]
  scored: BabyNameScore | null
  guidance: string
}

function parentRoots(parentDobs: string[]): CoreNumber[] {
  const roots: CoreNumber[] = []
  for (const iso of parentDobs) {
    const d = parseBirthDate(iso)
    if (!d) continue
    roots.push(getMoolank(d.day).value, getBhagyank(d).value)
  }
  return roots
}

function avgSupport(root: CoreNumber, against: CoreNumber[]): number {
  if (against.length === 0) return supportScore(root, root, root)
  let total = 0
  for (const a of against) {
    const h = numberHarmony(root, a)
    total += h === 'excellent' ? 50 : h === 'good' ? 38 : h === 'neutral' ? 25 : h === 'mixed' ? 18 : 0
  }
  return Math.round(total / against.length)
}

export function suggestBabyNames(input: {
  /** Baby DOB if known — name will target baby's Moolank/Bhagyank. */
  babyDob?: string
  /** One or two parent DOBs (YYYY-MM-DD). */
  parentDobs?: string[]
  /** Draft first name to score. */
  candidateName?: string
  /** Prefer totals in this band (default 10–40). */
  maxTotal?: number
}): BabyNameSuggestion {
  const babyDate = input.babyDob ? parseBirthDate(input.babyDob) : null
  const babyM = babyDate ? getMoolank(babyDate.day).value : null
  const babyB = babyDate ? getBhagyank(babyDate).value : null
  const parents = parentRoots(input.parentDobs ?? [])
  const maxTotal = input.maxTotal ?? 40

  const targetRoots: CoreNumber[] = []
  if (babyM && babyB) {
    for (const n of CORE_NUMBERS) {
      if (supportScore(n, babyM, babyB) >= 63) targetRoots.push(n)
    }
  } else if (parents.length > 0) {
    for (const n of CORE_NUMBERS) {
      if (avgSupport(n, parents) >= 30 && !parents.every(p => numberHarmony(n, p) === 'challenging')) {
        targetRoots.push(n)
      }
    }
  } else {
    targetRoots.push(1, 3, 5, 6, 9)
  }

  const against: CoreNumber[] = babyM && babyB ? [babyM, babyB] : parents.length ? parents : [3, 6]
  const luckyTotals: BabyNameTarget[] = []
  for (let t = 10; t <= maxTotal; t++) {
    const root = reduceToCore(t) as CoreNumber
    if (!targetRoots.includes(root)) continue
    const compound = getCompoundMeaning(t)
    if (compound?.quality === 'warning') continue
    const score = babyM && babyB ? supportScore(root, babyM, babyB) : avgSupport(root, against)
    if (score < 50) continue
    luckyTotals.push({
      total: t,
      root,
      score,
      compoundTitle: compound?.title ?? null,
      quality: compound?.quality === 'fortunate' ? 'fortunate' : compound ? 'mixed' : null,
      why: babyM && babyB
        ? `Root ${root} supports baby Moolank ${babyM} & Bhagyank ${babyB}`
        : `Root ${root} is friendly to parent number(s) ${[...new Set(against)].join(', ')}`,
    })
  }
  luckyTotals.sort((a, b) => b.score - a.score || a.total - b.total)

  const startingLetters: BabyLetterGroup[] = targetRoots.slice(0, 5).map(root => {
    const letters = Object.entries(CHALDEAN_VALUES)
      .filter(([, v]) => v === root)
      .map(([l]) => l)
      .sort()
    return {
      root,
      letters,
      planet: NUMBER_PROFILES[root].planet,
      note: letters.length
        ? `Names starting with these letters vibrate with ${NUMBER_PROFILES[root].planet} (${root}).`
        : `Number 9 has no Chaldean letter — aim for a total that reduces to 9 (e.g. 18, 27, 36).`,
    }
  })

  let scored: BabyNameScore | null = null
  const candidate = input.candidateName?.trim()
  if (candidate) {
    const nam = getNameNumber(candidate, 'chaldean')
    if (nam) {
      const score = babyM && babyB
        ? supportScore(nam.value, babyM, babyB)
        : avgSupport(nam.value, against)
      const tips: string[] = []
      const nearest = suggestNameTotals(nam.compound, (babyM ?? against[0]!) as CoreNumber, (babyB ?? against[1] ?? against[0]!) as CoreNumber, 12)
        .slice(0, 3)
      if (score < 63 && nearest.length) {
        tips.push(`Try shifting the total toward ${nearest.map(n => n.total).join(', ')} (add/double a letter worth the delta).`)
      }
      if (nam.compoundMeaning?.quality === 'warning') {
        tips.push(`Compound ${nam.compound} (${nam.compoundMeaning.title}) is a warning number — prefer a different total.`)
      }
      if (babyM && numberHarmony(nam.value, babyM) === 'challenging') {
        tips.push(`Name root ${nam.value} conflicts with baby's Moolank ${babyM}.`)
      }
      scored = {
        name: candidate,
        compound: nam.compound,
        root: nam.value,
        score,
        verdict: score >= 76 ? 'excellent' : score >= 63 ? 'good' : score >= 43 ? 'acceptable' : 'unfavourable',
        babyHarmony: babyM && babyB
          ? { moolank: numberHarmony(nam.value, babyM), bhagyank: numberHarmony(nam.value, babyB) }
          : null,
        parentHarmony: parents.map(p => numberHarmony(nam.value, p)),
        compoundMeaning: nam.compoundMeaning ? `${nam.compoundMeaning.title}: ${nam.compoundMeaning.meaning}` : null,
        tips,
      }
    }
  }

  const guidance = babyM && babyB
    ? `Baby Moolank ${babyM} (${NUMBER_PROFILES[babyM].planet}) and Bhagyank ${babyB} (${NUMBER_PROFILES[babyB].planet}). Choose a first name whose Chaldean total reduces to ${targetRoots.slice(0, 4).join(', ')}.`
    : parents.length
      ? `Baby DOB unknown — favour name roots friendly to parent numbers ${[...new Set(parents)].join(', ')}. Recalculate after birth with the baby's date.`
      : 'Enter baby or parent date(s) for personalized targets. Meanwhile, fortunate totals with roots 1, 3, 5, 6, 9 are generally preferred.'

  return {
    targetRoots,
    luckyTotals: luckyTotals.slice(0, 12),
    startingLetters,
    scored,
    guidance,
  }
}

// ── Business partnership ──────────────────────────────────────

export interface BusinessPartnerInput {
  label: string
  birthDate: string
}

export interface BusinessPairScore {
  label: string
  moolank: CoreNumber
  bhagyank: CoreNumber
}

export interface BusinessPartnershipResult {
  a: BusinessPairScore
  b: BusinessPairScore
  percent: number
  pairs: { label: string; harmony: Harmony; weight: number }[]
  ventureNumber: CoreNumber
  ventureMeaning: string
  roles: { a: string; b: string }
  advice: string[]
  verdict: 'strong' | 'workable' | 'strained'
}

const ROLE_BY_NUMBER: Record<CoreNumber, string> = {
  1: 'Vision, leadership, final decisions',
  2: 'Client relations, diplomacy, team harmony',
  3: 'Strategy, mentoring, legal/finance counsel',
  4: 'Tech, R&D, unconventional markets',
  5: 'Sales, marketing, ops, negotiations',
  6: 'Brand, design, hospitality, partnerships',
  7: 'Research, quality, specialist depth',
  8: 'Systems, compliance, long-term assets',
  9: 'Execution, field work, crisis leadership',
}

export function matchBusinessPartners(
  partnerA: BusinessPartnerInput,
  partnerB: BusinessPartnerInput,
): BusinessPartnershipResult | null {
  const da = parseBirthDate(partnerA.birthDate)
  const db = parseBirthDate(partnerB.birthDate)
  if (!da || !db) return null

  const a = { label: partnerA.label || 'Partner A', moolank: getMoolank(da.day).value, bhagyank: getBhagyank(da).value }
  const b = { label: partnerB.label || 'Partner B', moolank: getMoolank(db.day).value, bhagyank: getBhagyank(db).value }

  const pairs: BusinessPartnershipResult['pairs'] = [
    { label: `Working style (Moolank ${a.moolank} ↔ ${b.moolank})`, harmony: numberHarmony(a.moolank, b.moolank), weight: 2.5 },
    { label: `Long-term fortune (Bhagyank ${a.bhagyank} ↔ ${b.bhagyank})`, harmony: numberHarmony(a.bhagyank, b.bhagyank), weight: 2 },
    { label: `${a.label} drive ↔ ${b.label} destiny`, harmony: numberHarmony(a.moolank, b.bhagyank), weight: 1 },
    { label: `${b.label} drive ↔ ${a.label} destiny`, harmony: numberHarmony(b.moolank, a.bhagyank), weight: 1 },
  ]
  const pts: Record<Harmony, number> = { excellent: 4, good: 3, neutral: 2, mixed: 1, challenging: 0 }
  const max = pairs.reduce((s, p) => s + 4 * p.weight, 0)
  const got = pairs.reduce((s, p) => s + pts[p.harmony] * p.weight, 0)
  const percent = Math.round((got / max) * 100)

  const ventureNumber = reduceToCore(a.moolank + b.moolank) as CoreNumber
  const ventureMeaning = `${NUMBER_PROFILES[ventureNumber].keyword} venture — ${NUMBER_PROFILES[ventureNumber].nature}`

  const advice: string[] = []
  if (numberHarmony(a.moolank, b.moolank) === 'challenging') {
    advice.push('Working styles clash — define clear roles and decision rights in writing.')
  }
  if (numberHarmony(a.bhagyank, b.bhagyank) === 'challenging') {
    advice.push('Long-term fortune numbers conflict — review equity and exit clauses carefully.')
  }
  if (percent >= 70) advice.push('Strong numeric foundation — invest in a shared brand number (mobile / GST / office) that supports both.')
  else if (percent >= 50) advice.push('Workable with discipline — use a mediator or advisor whose number is friendly to both (often 3, 5 or 6).')
  else advice.push('Strained combination — prefer project-based collaboration over lifelong equity partnership.')

  if (a.moolank === 8 || b.moolank === 8) advice.push('Saturn influence present — expect slower ramp-up; favour asset-backed or compliance-heavy businesses.')
  if (a.moolank === 5 || b.moolank === 5) advice.push('Mercury energy supports trade, media and multi-location ops.')

  return {
    a, b, percent, pairs, ventureNumber, ventureMeaning,
    roles: { a: ROLE_BY_NUMBER[a.moolank], b: ROLE_BY_NUMBER[b.moolank] },
    advice,
    verdict: percent >= 70 ? 'strong' : percent >= 50 ? 'workable' : 'strained',
  }
}

// ── Dasha ↔ number timing ─────────────────────────────────────

export interface DashaNumberLevel {
  level: number
  levelName: string
  lord: GrahaId
  lordName: string
  number: CoreNumber | null
  start: string
  end: string
  moolankHarmony: Harmony | null
  bhagyankHarmony: Harmony | null
  personalYearHarmony: Harmony | null
  outlook: 'favourable' | 'mixed' | 'caution' | 'unknown'
  note: string
}

export interface UpcomingMahaNumber {
  lord: GrahaId
  lordName: string
  number: CoreNumber | null
  start: string
  end: string
  moolankHarmony: Harmony | null
  outlook: 'favourable' | 'mixed' | 'caution' | 'unknown'
  note: string
}

export interface DashaNumberBridge {
  current: DashaNumberLevel[]
  upcomingMahas: UpcomingMahaNumber[]
  amplification: string | null
  summary: string
}

const LEVEL_NAME = ['', 'Mahadasha', 'Antardasha', 'Pratyantardasha', 'Sookshma', 'Prana', 'Deha'] as const

function outlookFrom(m: Harmony | null, b: Harmony | null): DashaNumberLevel['outlook'] {
  if (!m && !b) return 'unknown'
  const bad = m === 'challenging' || b === 'challenging'
  const good = m === 'excellent' || m === 'good' || b === 'excellent' || b === 'good'
  if (bad && !good) return 'caution'
  if (good && !bad) return 'favourable'
  return 'mixed'
}

function dashaNote(lord: GrahaId, num: CoreNumber | null, moolank: CoreNumber, outlook: DashaNumberLevel['outlook']): string {
  if (!num) return `${GRAHA_NAMES[lord]} has no classical Anka number — judge by Jyotish dignity alone.`
  const planet = NUMBER_PROFILES[num].planet
  if (outlook === 'favourable') {
    return `${planet} dasha (${num}) supports your Moolank ${moolank} — push career, remedies of ${planet}, and dates that reduce to ${num}.`
  }
  if (outlook === 'caution') {
    return `${planet} dasha (${num}) tensions with Moolank ${moolank} — favour patience, ${NUMBER_PROFILES[moolank].fastingDay} remedies, and avoid enemy-number launches.`
  }
  return `${planet} dasha (${num}) is mixed with your core numbers — steady effort; amplify with friendly personal-year timing.`
}

export function buildDashaNumberBridge(input: {
  vimshottari: DashaNode[] | undefined | null
  moolank: CoreNumber
  bhagyank: CoreNumber
  personalYear: CoreNumber
  now?: number
}): DashaNumberBridge | null {
  const tree = input.vimshottari
  if (!tree || tree.length === 0) return null
  const now = input.now ?? Date.now()
  const path = getDashaPathAt(tree, now)
  if (path.length === 0) return null

  const current: DashaNumberLevel[] = path.slice(0, 3).map(node => {
    const lord = node.lord as GrahaId
    const num = numberForGraha(lord)
    const mh = num ? numberHarmony(num, input.moolank) : null
    const bh = num ? numberHarmony(num, input.bhagyank) : null
    const py = num ? numberHarmony(num, input.personalYear) : null
    const outlook = outlookFrom(mh, bh)
    return {
      level: node.level,
      levelName: LEVEL_NAME[node.level] ?? `L${node.level}`,
      lord,
      lordName: GRAHA_NAMES[lord] ?? lord,
      number: num,
      start: new Date(node.start).toISOString().slice(0, 10),
      end: new Date(node.end).toISOString().slice(0, 10),
      moolankHarmony: mh,
      bhagyankHarmony: bh,
      personalYearHarmony: py,
      outlook,
      note: dashaNote(lord, num, input.moolank, outlook),
    }
  })

  const upcomingMahas: UpcomingMahaNumber[] = tree
    .filter(n => n.level === 1 && new Date(n.start).getTime() > now)
    .slice(0, 4)
    .map(node => {
      const lord = node.lord as GrahaId
      const num = numberForGraha(lord)
      const mh = num ? numberHarmony(num, input.moolank) : null
      const outlook = outlookFrom(mh, num ? numberHarmony(num, input.bhagyank) : null)
      return {
        lord,
        lordName: GRAHA_NAMES[lord] ?? lord,
        number: num,
        start: new Date(node.start).toISOString().slice(0, 10),
        end: new Date(node.end).toISOString().slice(0, 10),
        moolankHarmony: mh,
        outlook,
        note: dashaNote(lord, num, input.moolank, outlook),
      }
    })

  const maha = current.find(c => c.level === 1)
  const antar = current.find(c => c.level === 2)
  let amplification: string | null = null
  if (maha?.number === input.personalYear) {
    amplification = `Personal year ${input.personalYear} matches Mahadasha number ${maha.number} (${maha.lordName}) — this year’s theme is amplified by dasha. Act on aligned goals.`
  } else if (antar?.number === input.personalYear) {
    amplification = `Personal year ${input.personalYear} matches Antardasha number ${antar.number} (${antar.lordName}) — short-term windows this year are especially charged.`
  } else if (maha?.number === input.moolank) {
    amplification = `Mahadasha lord number equals your Moolank ${input.moolank} — identity and dasha move together; strong period for self-driven projects.`
  }

  const summary = maha
    ? `Current ${maha.levelName}: ${maha.lordName} (number ${maha.number ?? '—'}, ${maha.outlook})` +
      (antar ? ` · ${antar.levelName}: ${antar.lordName} (${antar.number ?? '—'}, ${antar.outlook})` : '')
    : 'No current dasha path found.'

  return { current, upcomingMahas, amplification, summary }
}

/** Re-export for tests that score name totals via baby flow. */
export type { NameTarget, ParsedDate }
