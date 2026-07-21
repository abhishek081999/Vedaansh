// ─────────────────────────────────────────────────────────────
//  src/lib/engine/ashtakavargaInsights.ts
//  Ashtakavarga interpretation layer (class / transcript rules)
//  Operates on house-ordered SAV — does not alter BAV/SAV bindu math.
// ─────────────────────────────────────────────────────────────

import { toHousesFromLagna } from '@/lib/engine/ashtakavarga'
import type { GrahaId, Rashi } from '@/types/astrology'
import { NAKSHATRA_NAMES } from '@/types/astrology'

export type BinduBand =
  | 'critical'
  | 'authority'
  | 'loss'
  | 'weak'
  | 'neutral'
  | 'functional'
  | 'clean'
  | 'strong'
  | 'abundant'

export interface HouseBinduRating {
  house: number
  bindus: number
  band: BinduBand
  label: string
}

export interface NamedTotal {
  id: string
  name: string
  houses: number[]
  total: number
  interpretation: string
}

export interface InternalExternalAnalysis {
  internal: number
  external: number
  dominant: 'internal' | 'external' | 'balanced'
  interpretation: string
}

export interface KhandaAnalysis {
  bandhu: NamedTotal
  sevak: NamedTotal
  poshak: NamedTotal
  ghatak: NamedTotal
  dominant: 'bandhu' | 'sevak' | 'poshak' | 'ghatak'
  bandhuBusiness: boolean
  ghatakCaution: boolean
}

export interface YogaFlags {
  growthAt37: boolean
  wealthAt40: boolean
  strongLagna: boolean
}

export interface AgeIndicators {
  saturnChallengeAge: number | null
  saturnChallengeRaw: number | null
  jupiterVenusProsperityAge: number | null
  jupiterVenusProsperityRaw: number | null
  saturnHouse: number | null
  jupiterHouse: number | null
  venusHouse: number | null
}

export interface PromotionTiming {
  sum: number
  janmaNakshatraNumber: number
  remainder: number
  targetNakshatraIndex: number
  targetNakshatraName: string
  tenthLord: GrahaId
  note: string
}

/** Relative-house role when a focus bhava is treated as Lagna. */
export type BhavaRole =
  | 'body'
  | 'resources'
  | 'effort'
  | 'comfort'
  | 'intellect'
  | 'struggle'
  | 'support'
  | 'sudden'
  | 'fortune'
  | 'status'
  | 'gains'
  | 'loss'

export interface BhavaBhaavamHouse {
  relativeHouse: number
  originalHouse: number
  bindus: number
  role: BhavaRole
  roleLabel: string
  label: string
  band: BinduBand
  /** Strength note inside this topic only — not vs other natal houses. */
  reading: string
}

export interface BhavaBhaavamView {
  focusHouse: number
  topic: string
  topicShort: string
  body: BhavaBhaavamHouse
  life: BhavaBhaavamHouse[]
  houses: BhavaBhaavamHouse[]
  /** Most-used class keys: body, income, struggle, support, sudden, gains */
  keyHouses: BhavaBhaavamHouse[]
  summary: string[]
  note: string
  caution: string
}

export interface AshtakavargaInsights {
  houseSav: number[]
  houseRatings: HouseBinduRating[]
  savTotal: number
  internalExternal: InternalExternalAnalysis
  khandas: KhandaAnalysis
  lifeStages: NamedTotal[]
  lifeStagePeak: string
  directions: NamedTotal[]
  directionPeak: string
  ashrams: NamedTotal[]
  ashramPeak: string
  yogas: YogaFlags
  ages: AgeIndicators
  promotion: PromotionTiming | null
}

export interface AshtakavargaInsightsInput {
  savByRashi: number[]
  ascRashi: number
  grahas: Array<{ id: string; rashi: number }>
  /** 0–26 Moon birth nakshatra index */
  janmaNakshatraIndex: number
}

const RASHI_LORD: Record<number, GrahaId> = {
  1: 'Ma', 2: 'Ve', 3: 'Me', 4: 'Mo',
  5: 'Su', 6: 'Me', 7: 'Ve', 8: 'Ma',
  9: 'Ju', 10: 'Sa', 11: 'Sa', 12: 'Ju',
}

const INTERNAL_HOUSES = [1, 4, 5, 7, 9, 10] as const
const EXTERNAL_HOUSES = [2, 3, 6, 8, 11, 12] as const

const KHANDAS = {
  bandhu: { id: 'bandhu', name: 'Bandhu Khanda', houses: [1, 5, 9] },
  sevak:  { id: 'sevak',  name: 'Sevak Khanda',  houses: [2, 6, 10] },
  poshak: { id: 'poshak', name: 'Poshak Khanda', houses: [3, 7, 11] },
  ghatak: { id: 'ghatak', name: 'Ghatak Khanda', houses: [4, 8, 12] },
} as const

const LIFE_STAGES = [
  { id: 'childhood', name: 'Childhood (Balyakal)', houses: [1, 2, 3, 4] },
  { id: 'youth', name: 'Youth (Yuvavastha)', houses: [5, 6, 7, 8] },
  { id: 'elder', name: 'Elder (Vriddhavastha)', houses: [9, 10, 11, 12] },
] as const

const DIRECTIONS = [
  { id: 'east', name: 'East (Purva)', houses: [1, 5, 9] },
  { id: 'south', name: 'South (Dakshina)', houses: [2, 6, 10] },
  { id: 'west', name: 'West (Pashchim)', houses: [3, 7, 11] },
  { id: 'north', name: 'North (Uttar)', houses: [4, 8, 12] },
] as const

const ASHRAMS = [
  { id: 'brahmacharya', name: 'Brahmacharya', houses: [1, 2, 3, 4] },
  { id: 'grihastha', name: 'Grihastha', houses: [4, 5, 6, 7] },
  { id: 'vanaprastha', name: 'Vanaprastha', houses: [7, 8, 9, 10] },
  { id: 'sanyasa', name: 'Sanyasa', houses: [10, 11, 12] },
] as const

const BHAVA_ROLES: readonly { role: BhavaRole; roleLabel: string }[] = [
  { role: 'body', roleLabel: 'Body' },
  { role: 'resources', roleLabel: 'Resources' },
  { role: 'effort', roleLabel: 'Effort' },
  { role: 'comfort', roleLabel: 'Comfort / base' },
  { role: 'intellect', roleLabel: 'Intellect' },
  { role: 'struggle', roleLabel: 'Struggle' },
  { role: 'support', roleLabel: 'Support' },
  { role: 'sudden', roleLabel: 'Sudden / depth' },
  { role: 'fortune', roleLabel: 'Fortune' },
  { role: 'status', roleLabel: 'Status / work' },
  { role: 'gains', roleLabel: 'Gains' },
  { role: 'loss', roleLabel: 'Loss / exit' },
] as const

/** Key relative houses used in class-style guided reading. */
const BHAVA_KEY_RELATIVE = [1, 2, 6, 7, 8, 11] as const

/**
 * Topic-relative labels when a focus house is treated as Lagna (Bhava-Bhaavam).
 * Relative H1 = BODY of the topic; H2–H12 = LIFE of that topic only.
 */
const BHAVA_BHAAVAM_TOPICS: Record<number, { topic: string; topicShort: string; labels: string[] }> = {
  1: {
    topic: 'Self / vitality (Lagna)',
    topicShort: 'Self',
    labels: [
      'Body, mind, and overall vitality',
      'Personal resources / speech / early sustenance',
      'Courage, siblings, initiative',
      'Home comfort, mother, emotional base',
      'Intelligence, creativity, children theme',
      'Illness, enemies, daily struggle',
      'Spouse / partnerships / public dealings',
      'Longevity, crises, transformation',
      'Fortune, dharma, teachers, long journeys',
      'Career, karma, public status',
      'Gains, friends, fulfillment of desires',
      'Expenses, losses, foreign / moksha leanings',
    ],
  },
  2: {
    topic: 'Wealth / speech / family resources',
    topicShort: 'Wealth',
    labels: [
      'Wealth body — capacity to hold & speak value',
      'Secondary income / savings from wealth',
      'Effort and courage to earn',
      'Comfort / security from money; family base',
      'Intelligence in finance / speculative skill',
      'Debts, competitors for resources, financial stress',
      'Business partners / joint finances',
      'Sudden gains-losses / inheritance shocks',
      'Luck and ethics around money',
      'Status earned through wealth / career of money',
      'Growth of wealth / fulfillment of money desires',
      'Expenses, drains, foreign money themes',
    ],
  },
  3: {
    topic: 'Courage / effort / skills / siblings',
    topicShort: 'Effort',
    labels: [
      'Effort body — drive, skills, initiative',
      'Gains from skills / short ventures',
      'Extra effort, co-workers, younger siblings',
      'Comfort in self-effort / local base of work',
      'Creative skills / media / hobbies that pay',
      'Competition in skills / rivals in effort',
      'Partners in ventures / contracts',
      'Sudden shifts in courage or skills path',
      'Fortune through effort / higher training',
      'Recognition of skills / professional use of effort',
      'Gains from courage and networking',
      'Burnout, travel drain, wasted effort',
    ],
  },
  4: {
    topic: 'Home / mother / vehicles / emotional base',
    topicShort: 'Home',
    labels: [
      'Home / happiness body — emotional foundation',
      'Resources of home / property funds',
      'Effort to build home or change residence',
      'Deepest comfort / ancestral property feel',
      'Creativity at home / education environment',
      'Domestic disputes / property litigation',
      'Spouse’s role in home / home partnerships',
      'Sudden moves / emotional upheavals',
      'Fortune through property / sacred home',
      'Public standing of home / real-estate career',
      'Gains from property / vehicles / mother side',
      'Away-from-home living / foreign residence',
    ],
  },
  5: {
    topic: 'Children / intellect / creativity / mantra',
    topicShort: 'Children',
    labels: [
      'Children / intellect body — creative core',
      'Resources for children / creative capital',
      'Effort in learning, sports, or creative work',
      'Comfort with children / education setting',
      'Further intelligence / speculative brilliance',
      'Obstacles to children / creative competition',
      'Partner’s influence on children / romance',
      'Sudden issues or deep transformation via progeny',
      'Fortune through children / higher learning',
      'Recognition of intellect / teaching / performance',
      'Gains from children, creativity, speculation',
      'Separation from children / creative exhaustion',
    ],
  },
  6: {
    topic: 'Health / service / enemies / competition',
    topicShort: 'Health',
    labels: [
      'Health / struggle body — disease & service capacity',
      'Resources for recovery / medical funds',
      'Effort against illness / fight to compete',
      'Healing comfort / care environment (not personal home)',
      'Intelligence in treatment / strategy vs rivals',
      'Secondary illness / layered enemies',
      'Doctors, carers, allies in struggle',
      'Chronicity / sudden health turns',
      'Long recovery path / destiny of health',
      'Nature of service / recognition of strength',
      'Gains from recovery or competitive wins',
      'Hospital, exhaustion, foreign treatment',
    ],
  },
  7: {
    topic: 'Partnership / marriage / public other',
    topicShort: 'Partner',
    labels: [
      'Partnership body — spouse / significant other',
      'Resources in the relationship',
      'Effort and courage inside the bond',
      'Comfort / homeland vs distance in the bond',
      'Creativity / children themes via partner',
      'Conflicts, rivals, or legal friction in partnership',
      'Other partnerships / public face of the bond',
      'Sudden shifts / intimacy crises',
      'Dharma and long journeys of the relationship',
      'Public role of the partnership',
      'Gains through partnership',
      'Losses, separations, foreign bond themes',
    ],
  },
  8: {
    topic: 'Longevity / crises / shared resources / occult',
    topicShort: 'Crises',
    labels: [
      'Crisis / longevity body — depth & endurance',
      'Resources through shared money / insurance',
      'Effort to survive shocks / research drive',
      'Emotional base during crisis / secret foundations',
      'Insight from trauma / occult intelligence',
      'Compounded crises / hidden enemies in depth',
      'Partners through crisis / therapists / advisors',
      'Deeper shocks / chronic transformation',
      'Fortune after upheaval / spiritual turn',
      'Public handling of crisis / research vocation',
      'Gains from inheritance, insurance, recovery',
      'Exhaustion from crises / hidden drains',
    ],
  },
  9: {
    topic: 'Fortune / dharma / father / long journeys',
    topicShort: 'Fortune',
    labels: [
      'Fortune body — dharma and luck capacity',
      'Resources from fortune / patronage',
      'Effort in higher learning / pilgrimage drive',
      'Comfort of belief / homeland of faith',
      'Creative expression of dharma / teaching',
      'Obstacles to fortune / ideological rivals',
      'Gurus, mentors, dharmic partners',
      'Sudden tests of faith / hidden grace',
      'Higher fortune / second luck cycle',
      'Public dharma / teaching / law career',
      'Gains from fortune, father, higher studies',
      'Foreign travel of faith / spiritual renunciation',
    ],
  },
  10: {
    topic: 'Career / karma / public status',
    topicShort: 'Career',
    labels: [
      "Career's body — strength of career itself",
      'Career income / recognition / awards',
      'Efforts in career / foreign-work possibility',
      'Homeland job vs abroad / comfort in career',
      'Intelligence / creativity in career',
      'Competition, office politics, hidden enemies',
      'Partner / mentor support in career',
      'Sudden losses / sudden changes in career',
      'Long journeys / destiny in career',
      'Nature of work done / awards (not income)',
      'Gains — whether career effort is utilized',
      'Foreign-country career prospects / career exits',
    ],
  },
  11: {
    topic: 'Gains / friends / fulfillment of desires',
    topicShort: 'Gains',
    labels: [
      'Gains body — capacity to fulfill desires',
      'Secondary profits / network resources',
      'Effort and networking to gain',
      'Comfort among friends / gain environment',
      'Creative gains / speculative fulfillment',
      'Obstacles to gains / rival networks',
      'Partners who multiply gains',
      'Sudden windfalls or gain shocks',
      'Fortune through friends / elder allies',
      'Public gains / reputation from fulfillment',
      'Multiplication of gains / desire completion',
      'Wasted gains / undesirable associations',
    ],
  },
  12: {
    topic: 'Expenses / foreign / isolation / moksha',
    topicShort: 'Foreign',
    labels: [
      'Expense / foreign body — outflow & exile themes',
      'Funds for foreign / hospital / charity',
      'Effort in foreign land / behind-the-scenes work',
      'Comfort abroad / sleep / private sanctuary',
      'Foreign creativity / spiritual intelligence',
      'Obstacles abroad / hidden costs',
      'Foreign partners / spiritual companions',
      'Sudden foreign shifts / deep isolation',
      'Fortune through foreign / ashram / retreat',
      'Public foreign role / hospital vocation',
      'Gains from foreign / export / charity returns',
      'Ultimate renunciation / total outflow',
    ],
  },
}

function sumHouses(houseSav: number[], houses: readonly number[]): number {
  return houses.reduce((acc, h) => acc + (houseSav[h - 1] ?? 0), 0)
}

function planetHouse(
  grahas: Array<{ id: string; rashi: number }>,
  planetId: string,
  ascRashi: number,
): number | null {
  const g = grahas.find((x) => x.id === planetId)
  if (!g || g.rashi < 1 || g.rashi > 12) return null
  return ((g.rashi - ascRashi + 12) % 12) + 1
}

/** Classical age formula: binduSum × 7 ÷ 27 */
export function ageFromBinduSum(binduSum: number): number {
  return (binduSum * 7) / 27
}

export function rateBindus(bindus: number): { band: BinduBand; label: string } {
  if (bindus < 14) {
    return { band: 'critical', label: 'Extremely rare; life-threatening for this house’s domain' }
  }
  if (bindus === 15) {
    return { band: 'authority', label: 'Fear from government / police / tax authorities' }
  }
  if (bindus === 21) {
    return { band: 'loss', label: 'Financial loss, illness, or setbacks for this house' }
  }
  if (bindus <= 23) {
    return { band: 'weak', label: 'Completely weak house' }
  }
  if (bindus < 28) {
    return { band: 'neutral', label: 'Neutral / somewhat weak — mixed results' }
  }
  if (bindus < 30) {
    return { band: 'functional', label: 'Average / functional — house is operating' }
  }
  if (bindus === 30) {
    return { band: 'clean', label: 'Clean & auspicious — honor, money, respect' }
  }
  if (bindus <= 33) {
    return { band: 'clean', label: 'Good results — material benefits likely' }
  }
  if (bindus <= 40) {
    return { band: 'strong', label: 'Strong — pleasures, growth, and wealth manifest well' }
  }
  return { band: 'abundant', label: 'Multiple income sources / extraordinary gains' }
}

/**
 * Soft dasha-result % from house SAV (transcript: ~23 → 50–60%; full strike ~75+ rare).
 */
export function estimateDashaResultPercent(savBindus: number): number {
  if (savBindus >= 75) return 100
  if (savBindus >= 40) return Math.min(95, 70 + (savBindus - 40))
  if (savBindus >= 30) return 65 + Math.round(((savBindus - 30) / 10) * 10)
  if (savBindus >= 25) return 55 + Math.round(((savBindus - 25) / 5) * 10)
  if (savBindus >= 21) return 45 + Math.round(((savBindus - 21) / 4) * 10)
  if (savBindus >= 15) return 30 + Math.round(((savBindus - 15) / 6) * 15)
  return Math.max(10, Math.round((savBindus / 15) * 30))
}

/** Class thresholds: under 4 weak, 4 borderline, 5 good, 6+ excellent. */
export function bavTransitQuality(bavPoints: number): 'weak' | 'borderline' | 'good' | 'excellent' {
  if (bavPoints >= 6) return 'excellent'
  if (bavPoints >= 5) return 'good'
  if (bavPoints === 4) return 'borderline'
  return 'weak'
}

function buildNamedTotals(
  houseSav: number[],
  defs: readonly { id: string; name: string; houses: readonly number[] }[],
  interpret: (id: string, total: number, isPeak: boolean) => string,
): { items: NamedTotal[]; peakId: string } {
  const items = defs.map((d) => ({
    id: d.id,
    name: d.name,
    houses: [...d.houses],
    total: sumHouses(houseSav, d.houses),
    interpretation: '',
  }))
  let peakId = items[0]?.id ?? ''
  let peakTotal = -1
  for (const item of items) {
    if (item.total > peakTotal) {
      peakTotal = item.total
      peakId = item.id
    }
  }
  for (const item of items) {
    item.interpretation = interpret(item.id, item.total, item.id === peakId)
  }
  return { items, peakId }
}

function khandaInterpretation(id: string, total: number, isPeak: boolean): string {
  switch (id) {
    case 'bandhu':
      return total >= 88
        ? 'Excellent business / self-earned livelihood potential (score ≥ 88).'
        : isPeak
          ? 'Dominant Bandhu — prefers independence; strong for own resources / business.'
          : 'Self-earned wealth & independence theme.'
    case 'sevak':
      return isPeak
        ? 'Dominant Sevak — builds identity through job / service.'
        : 'Service / employment theme.'
    case 'poshak':
      return isPeak
        ? 'Dominant Poshak — capacity to nourish / financially support others.'
        : 'Nourishing / supporting-others theme.'
    case 'ghatak':
      return total > 73
        ? 'Ghatak above 73 — caution with loans, hidden enemies, and excess show; correlate with lifestyle.'
        : isPeak
          ? 'Dominant Ghatak — watch losses, travel load, and family time balance.'
          : 'Loss / disruption theme (classically kept modest).'
    default:
      return ''
  }
}

function relativeStrengthReading(role: BhavaRole, bindus: number, topicShort: string): string {
  const { band } = rateBindus(bindus)
  const strong = bindus >= 30
  const weak = bindus <= 23
  const mid = !strong && !weak

  switch (role) {
    case 'body':
      if (strong) return `${topicShort} body is strong — the signification itself has force.`
      if (weak) return `${topicShort} body is soft — expect support from mentors/events rather than raw self-strength.`
      return `${topicShort} body is moderate — neither fully strong nor collapsed.`
    case 'resources':
      if (strong) return `Income / resources of ${topicShort} are well supported.`
      if (weak) return `Resources around ${topicShort} need careful management.`
      return `Moderate resource flow for ${topicShort}.`
    case 'effort':
      if (strong) return `Strong effort capacity in ${topicShort}.`
      if (weak) return `Effort for ${topicShort} may feel limited — pace yourself.`
      return `Average effort available for ${topicShort}.`
    case 'comfort':
      if (strong) return `Comfort / base of ${topicShort} is supportive (e.g. homeland vs abroad for career).`
      if (weak) return `Comfort base of ${topicShort} is unsettled.`
      return `Mixed comfort around ${topicShort}.`
    case 'intellect':
      if (strong) return `Intelligence / creativity for ${topicShort} is active.`
      if (weak) return `Creative / intellectual expression of ${topicShort} is muted.`
      return `Average intellect applied to ${topicShort}.`
    case 'struggle':
      if (weak) return `Classical: fewer obstacles in ${topicShort}. Modern: also less competitive “fight fuel”.`
      if (strong) return `Strong struggle zone — competition/enemies rise, but so can courage & recovery.`
      return `Moderate struggle / competition around ${topicShort}.`
    case 'support':
      if (strong) return `Mentors / partners are likely to support ${topicShort}.`
      if (weak) return `Less external support for ${topicShort} — self-reliance matters.`
      return `Average support network for ${topicShort}.`
    case 'sudden':
      if (weak) return `Fewer sudden shocks in ${topicShort}; recovery may be slower when they come.`
      if (strong) return `Sudden changes in ${topicShort} are more active — transform, don’t freeze.`
      return `Occasional sudden turns in ${topicShort}.`
    case 'fortune':
      if (strong) return `Fortune / long-path destiny favors ${topicShort}.`
      if (weak) return `Fortune for ${topicShort} needs patience and dharma alignment.`
      return `Mixed fortune for ${topicShort}.`
    case 'status':
      if (strong) return `Public role / quality of work in ${topicShort} can be recognized.`
      if (weak) return `Status expression of ${topicShort} is quieter.`
      return `Average status expression for ${topicShort}.`
    case 'gains':
      if (strong) return `Gains from ${topicShort} are well indicated — effort is likely utilized.`
      if (weak) return `Gains from ${topicShort} may feel under-utilized.`
      return `Moderate gains from ${topicShort}.`
    case 'loss':
      if (weak) return `Classical: fewer wasteful exits/expenses for ${topicShort}.`
      if (strong) return `Strong exit/foreign/expense theme for ${topicShort} — plan outflows.`
      return `Moderate loss / foreign theme for ${topicShort}.`
    default:
      return band
  }
}

function buildBhavaSummary(topicShort: string, houses: BhavaBhaavamHouse[]): string[] {
  const byRel = (r: number) => houses.find((h) => h.relativeHouse === r)!
  const body = byRel(1)
  const resources = byRel(2)
  const struggle = byRel(6)
  const support = byRel(7)
  const sudden = byRel(8)
  const gains = byRel(11)
  const lines: string[] = []

  lines.push(body.reading)

  if (gains.bindus > body.bindus && gains.bindus >= 28) {
    lines.push(
      `Within ${topicShort}: gains (rel H11 = ${gains.bindus}) exceed the body (rel H1 = ${body.bindus}) — rewards can outpace the base strength of the topic itself.`,
    )
  } else if (body.bindus > gains.bindus && body.bindus >= 30 && gains.bindus < 28) {
    lines.push(
      `Within ${topicShort}: body is stronger than gains — capacity exists, but fulfillment needs better timing / utilization.`,
    )
  }

  if (support.bindus >= 30) {
    lines.push(`Support (rel H7 = ${support.bindus}) is strong — mentors/partners can stabilize ${topicShort}.`)
  } else if (body.bindus < 28 && support.bindus >= body.bindus) {
    lines.push(
      `Body is soft but support is present — help can arrive when ${topicShort} wobbles (“marte-marte bach jaoge” logic).`,
    )
  }

  if (struggle.bindus <= 23) {
    lines.push(`Struggle (rel H6 = ${struggle.bindus}) is low — fewer obstacles classically; also less competitive edge.`)
  } else if (struggle.bindus >= 30) {
    lines.push(`Struggle (rel H6 = ${struggle.bindus}) is strong — expect politics/competition, and use it as fuel.`)
  }

  if (sudden.bindus <= 23) {
    lines.push(`Sudden zone (rel H8 = ${sudden.bindus}) is quiet — fewer shocks, slower bounce when they hit.`)
  }

  if (resources.bindus >= 30) {
    lines.push(`Resources/income of ${topicShort} (rel H2 = ${resources.bindus}) look supportive.`)
  }

  return lines
}

/**
 * Remap SAV houses so `focusHouse` becomes relative Lagna (Bhava-Bhaavam).
 * relativeHouse 1 = BODY of the signification; other houses = LIFE of that topic only.
 *
 * Important (class rule):
 * - Do NOT read relative H4 as natal “home/property for self” when focus is Career —
 *   it means homeland-vs-abroad / comfort *of career*.
 * - Compare bindus inside this rotated topic; do not rank Career body against natal Lagna.
 */
export function bhavaBhaavam(houseSav: number[], focusHouse: number): BhavaBhaavamView {
  const focus = Math.min(12, Math.max(1, Math.round(focusHouse)))
  const topicDef = BHAVA_BHAAVAM_TOPICS[focus]
  const topic = topicDef?.topic ?? `House ${focus} as Lagna`
  const topicShort = topicDef?.topicShort ?? `H${focus}`
  const labels = topicDef?.labels

  const houses: BhavaBhaavamHouse[] = Array.from({ length: 12 }, (_, i) => {
    const relativeHouse = i + 1
    const originalHouse = ((focus + relativeHouse - 2) % 12) + 1
    const bindus = houseSav[originalHouse - 1] ?? 0
    const { role, roleLabel } = BHAVA_ROLES[i]
    const { band } = rateBindus(bindus)
    const label = labels?.[i] ?? `Relative house ${relativeHouse} (natal H${originalHouse})`
    return {
      relativeHouse,
      originalHouse,
      bindus,
      role,
      roleLabel,
      label,
      band,
      reading: relativeStrengthReading(role, bindus, topicShort),
    }
  })

  const body = houses[0]
  const life = houses.slice(1)
  const keyHouses = BHAVA_KEY_RELATIVE.map((r) => houses[r - 1])
  const summary = buildBhavaSummary(topicShort, houses)

  return {
    focusHouse: focus,
    topic,
    topicShort,
    body,
    life,
    houses,
    keyHouses,
    summary,
    note:
      'Bhava-Bhaavam: the chosen house becomes the BODY of that topic; the other eleven houses describe only the LIFE of that topic.',
    caution:
      'Do not keep original D1 meanings after rotation (e.g. 4th from Career ≠ personal property). Compare bindus inside this topic — not Career vs natal Lagna.',
  }
}

export function negativeHouseNotes(house: number, bindus: number): string[] {
  if (![6, 8, 12].includes(house)) return []
  const classical =
    bindus < 28
      ? 'Classical: lower score here means fewer obstacles / shocks / wasteful expenses.'
      : 'Classical: higher score here increases struggle themes for this dusthana.'
  const modern =
    'Modern view: strength in 3/6/8/11 also supports effort, competitiveness, recovery, and gains — correlate with the whole chart.'
  return [classical, modern]
}

export function analyzeAshtakavargaInsights(input: AshtakavargaInsightsInput): AshtakavargaInsights {
  const houseSav = toHousesFromLagna(input.savByRashi, input.ascRashi)
  const savTotal = houseSav.reduce((a, b) => a + b, 0)

  const houseRatings: HouseBinduRating[] = houseSav.map((bindus, i) => {
    const { band, label } = rateBindus(bindus)
    return { house: i + 1, bindus, band, label }
  })

  const internal = sumHouses(houseSav, INTERNAL_HOUSES)
  const external = sumHouses(houseSav, EXTERNAL_HOUSES)
  const ieDiff = internal - external
  const dominantIe: InternalExternalAnalysis['dominant'] =
    Math.abs(ieDiff) <= 3 ? 'balanced' : ieDiff > 0 ? 'internal' : 'external'
  const internalExternal: InternalExternalAnalysis = {
    internal,
    external,
    dominant: dominantIe,
    interpretation:
      dominantIe === 'internal'
        ? 'Internal > External — builds wealth through karma, experience, knowledge, and wisdom; often generous.'
        : dominantIe === 'external'
          ? 'External > Internal — builds wealth more through outer circumstances and material-world interactions.'
          : 'Internal and External nearly equal — balanced inner wisdom and outer drive.',
  }

  const bandhuTotal = sumHouses(houseSav, KHANDAS.bandhu.houses)
  const sevakTotal = sumHouses(houseSav, KHANDAS.sevak.houses)
  const poshakTotal = sumHouses(houseSav, KHANDAS.poshak.houses)
  const ghatakTotal = sumHouses(houseSav, KHANDAS.ghatak.houses)
  const khandaEntries = [
    { key: 'bandhu' as const, total: bandhuTotal },
    { key: 'sevak' as const, total: sevakTotal },
    { key: 'poshak' as const, total: poshakTotal },
    { key: 'ghatak' as const, total: ghatakTotal },
  ]
  const dominantKhanda = khandaEntries.reduce((best, cur) => (cur.total > best.total ? cur : best)).key

  const makeKhanda = (key: keyof typeof KHANDAS, total: number): NamedTotal => ({
    id: KHANDAS[key].id,
    name: KHANDAS[key].name,
    houses: [...KHANDAS[key].houses],
    total,
    interpretation: khandaInterpretation(key, total, key === dominantKhanda),
  })

  const khandas: KhandaAnalysis = {
    bandhu: makeKhanda('bandhu', bandhuTotal),
    sevak: makeKhanda('sevak', sevakTotal),
    poshak: makeKhanda('poshak', poshakTotal),
    ghatak: makeKhanda('ghatak', ghatakTotal),
    dominant: dominantKhanda,
    bandhuBusiness: bandhuTotal >= 88,
    ghatakCaution: ghatakTotal > 73,
  }

  const stages = buildNamedTotals(houseSav, LIFE_STAGES, (id, _t, isPeak) =>
    isPeak ? 'Peak life stage — strongest bindu support in this phase.' : `${id} phase total.`,
  )
  const dirs = buildNamedTotals(houseSav, DIRECTIONS, (id, _t, isPeak) =>
    isPeak ? 'Best growth direction for career, relocation, and business.' : `${id} direction total.`,
  )
  const ashramBuilt = buildNamedTotals(houseSav, ASHRAMS, (id, _t, isPeak) =>
    isPeak ? 'Strongest ashram / life-phase block.' : `${id} block total.`,
  )

  const yogas: YogaFlags = {
    growthAt37: houseSav[0] >= 30 && houseSav[9] >= 30 && houseSav[10] >= 30,
    wealthAt40: houseSav[3] >= 30 && houseSav[10] >= 30,
    strongLagna: houseSav[0] >= 40,
  }

  const saturnHouse = planetHouse(input.grahas, 'Sa', input.ascRashi)
  const jupiterHouse = planetHouse(input.grahas, 'Ju', input.ascRashi)
  const venusHouse = planetHouse(input.grahas, 'Ve', input.ascRashi)

  let saturnChallengeRaw: number | null = null
  if (saturnHouse != null) {
    const pathHouses = Array.from({ length: saturnHouse }, (_, i) => i + 1)
    saturnChallengeRaw = ageFromBinduSum(sumHouses(houseSav, pathHouses))
  }

  let jupiterVenusProsperityRaw: number | null = null
  if (jupiterHouse != null && venusHouse != null) {
    const juVeSum = (houseSav[jupiterHouse - 1] ?? 0) + (houseSav[venusHouse - 1] ?? 0)
    jupiterVenusProsperityRaw = ageFromBinduSum(juVeSum)
  }

  const ages: AgeIndicators = {
    saturnChallengeAge: saturnChallengeRaw != null ? Math.round(saturnChallengeRaw) : null,
    saturnChallengeRaw,
    jupiterVenusProsperityAge:
      jupiterVenusProsperityRaw != null ? Math.round(jupiterVenusProsperityRaw) : null,
    jupiterVenusProsperityRaw,
    saturnHouse,
    jupiterHouse,
    venusHouse,
  }

  const nakIdx = ((input.janmaNakshatraIndex % 27) + 27) % 27
  const janmaNumber = nakIdx + 1
  const h10 = houseSav[9] ?? 0
  const h6 = houseSav[5] ?? 0
  const promoSum = h10 + h6
  const remainder = janmaNumber === 0 ? 0 : promoSum % janmaNumber
  const targetNakshatraIndex =
    remainder === 0 ? nakIdx : (nakIdx + remainder - 1) % 27
  const tenthRashi = ((((input.ascRashi as number) - 1 + 9) % 12) + 1) as Rashi
  const tenthLord = RASHI_LORD[tenthRashi] ?? 'Sa'

  const promotion: PromotionTiming = {
    sum: promoSum,
    janmaNakshatraNumber: janmaNumber,
    remainder,
    targetNakshatraIndex,
    targetNakshatraName: NAKSHATRA_NAMES[targetNakshatraIndex] ?? `Nakshatra ${targetNakshatraIndex + 1}`,
    tenthLord,
    note: `When Sun or ${tenthLord} (10th lord) transits ${NAKSHATRA_NAMES[targetNakshatraIndex]}, promotion yoga is strong (indicative).`,
  }

  return {
    houseSav,
    houseRatings,
    savTotal,
    internalExternal,
    khandas,
    lifeStages: stages.items,
    lifeStagePeak: stages.peakId,
    directions: dirs.items,
    directionPeak: dirs.peakId,
    ashrams: ashramBuilt.items,
    ashramPeak: ashramBuilt.peakId,
    yogas,
    ages,
    promotion,
  }
}
