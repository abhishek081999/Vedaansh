// ─────────────────────────────────────────────────────────────
//  src/lib/engine/dasha/vimshottariAnalysis.ts
//  Chart-conditioned Vimshottari period flags (Chidra / Rikta / Arishta …)
//  Educational overlays — never imply death timing.
// ─────────────────────────────────────────────────────────────

import type {
  AshtakavargaResult,
  DashaNode,
  GrahaData,
  GrahaId,
  Rashi,
  ShadbalaResult,
} from '@/types/astrology'
import { DASHA_SEQUENCE } from '@/lib/engine/dasha/vimshottari'
import { getMarakaBadhakaFlags } from '@/lib/engine/marakaBadhaka'
import { estimateDashaResultPercent } from '@/lib/engine/ashtakavargaInsights'
import {
  getLagnaDashaProfile,
  getYogakaraka,
  isYogakarakaLord,
} from '@/lib/engine/dasha/yogakaraka'
import {
  getVimshottariAntarHint,
  getVimshottariInterpretation,
} from '@/lib/engine/dasha/vimshottariInterpretations'
import {
  DEBILITATION_SIGN,
  EXALTATION_DEGREE,
  EXALTATION_SIGN,
} from '@/lib/engine/dignity'

export type MdAdRelationKind =
  | 'conjoined'
  | 'opposing'
  | 'shadashtaka'
  | 'dwirdwadasa'
  | 'trikona'
  | 'kendra'
  | 'upachaya'
  | null

export interface MdAdRelation {
  kind: MdAdRelationKind
  /** Sign count from MD lord to AD lord (1 = same sign) */
  signCount: number
  label: string
  tone: 'supportive' | 'challenging' | 'mixed' | 'neutral'
}

export interface VimshottariFlag {
  id: string
  label: string
  tone: 'supportive' | 'caution' | 'mixed' | 'neutral'
  detail: string
}

export type ArohiniKind = 'arohini' | 'avarohini' | null

export interface VimshottariLordSnapshot {
  lord: GrahaId
  house: number | null
  /** Bhava numbers (1–12) this graha lords from the lagna */
  housesRuled: number[]
  dignity: string | null
  isRetro: boolean
  isGandantaEdge: boolean
  shadbalaRatio: number | null
  shadbalaBand: string | null
  bavBindus: number | null
  savBindus: number | null
  resultPercent: number | null
  isMaraka: boolean
  marakaCancelled: boolean
  isYogakaraka: boolean
  /** Approaching exaltation / debilitation peak within that sign */
  arohiniKind: ArohiniKind
}

export interface VimshottariCrispInsight {
  /** Overall tone label for UI */
  toneLabel: 'Favorable stretch' | 'Mixed period' | 'Challenging stretch'
  /** One-line: what to expect now */
  headline: string
  /** 2–3 crisp “what happens” bullets */
  bullets: string[]
  /** Soft watch-out (optional) */
  watch: string | null
}

export interface VimshottariPeriodAnalysis {
  mahadasha: VimshottariLordSnapshot
  antardasha: VimshottariLordSnapshot | null
  relation: MdAdRelation | null
  flags: VimshottariFlag[]
  /** Soft mix — never 100/0; always sums to 100 */
  favorableShare: number
  challengingShare: number
  neutralShare: number
  yogakarakaNote: string
  /** Lagna-specific special note */
  lagnaSpecialNote: string
  marakaNote: string
  /** Technical summary (flags) — prefer `insight` for UI */
  summary: string
  /** Plain-language “what happens in this dasha” */
  insight: VimshottariCrispInsight
}

export interface AnalyzeVimshottariInput {
  nodes: DashaNode[]
  ascRashi: Rashi
  grahas: GrahaData[]
  shadbala?: ShadbalaResult | null
  ashtakavarga?: AshtakavargaResult | null
  /** D9 grahas when available */
  navamshaGrahas?: GrahaData[] | null
}

/** Whole-sign SIGN_LORDS — same table as marakaBadhaka (client-safe). */
const SIGN_LORDS: Record<number, GrahaId> = {
  1: 'Ma', 2: 'Ve', 3: 'Me', 4: 'Mo', 5: 'Su', 6: 'Me',
  7: 'Ve', 8: 'Ma', 9: 'Ju', 10: 'Sa', 11: 'Sa', 12: 'Ju',
}

function wholeSignHouse(planetRashi: number, ascRashi: number): number {
  return ((planetRashi - ascRashi + 12) % 12) + 1
}

function wholeSignHouseSign(ascRashi: Rashi, house: number): Rashi {
  return (((ascRashi - 1 + house - 1) % 12) + 1) as Rashi
}

function houseLord(ascRashi: Rashi, house: number): GrahaId {
  return SIGN_LORDS[wholeSignHouseSign(ascRashi, house)]
}

/** Which bhavas (1–12) a graha lords from this lagna. */
export function housesRuledBy(ascRashi: Rashi, grahaId: string): number[] {
  const out: number[] = []
  for (let h = 1; h <= 12; h++) {
    if (houseLord(ascRashi, h) === grahaId) out.push(h)
  }
  return out
}

/** Sign-count from A to B: 1 = same sign … 12 = 12th from A. */
export function signCount(fromRashi: number, toRashi: number): number {
  return ((toRashi - fromRashi + 12) % 12) + 1
}

export function relationFromSignCount(diff: number): MdAdRelation {
  if (diff === 1) {
    return { kind: 'conjoined', signCount: diff, label: 'Conjoined (1/1)', tone: 'mixed' }
  }
  if (diff === 7) {
    return { kind: 'opposing', signCount: diff, label: 'Opposing (1/7)', tone: 'mixed' }
  }
  if (diff === 6 || diff === 8) {
    return { kind: 'shadashtaka', signCount: diff, label: 'Challenging (6/8 Shadashtaka)', tone: 'challenging' }
  }
  if (diff === 2 || diff === 12) {
    return { kind: 'dwirdwadasa', signCount: diff, label: 'Adjustment (2/12 Dwir-dwadasa)', tone: 'challenging' }
  }
  if (diff === 5 || diff === 9) {
    return { kind: 'trikona', signCount: diff, label: 'Supportive (5/9 Trikona)', tone: 'supportive' }
  }
  if (diff === 4 || diff === 10) {
    return { kind: 'kendra', signCount: diff, label: 'Functional (4/10 Kendra)', tone: 'supportive' }
  }
  if (diff === 3 || diff === 11) {
    return { kind: 'upachaya', signCount: diff, label: 'Growth (3/11 Upachaya)', tone: 'mixed' }
  }
  return { kind: null, signCount: diff, label: 'Unclassified', tone: 'neutral' }
}

/** Degree-edge incomplete results (0–2° or 28–30°) or classical gandanta flag. */
export function isGandantaEdge(g: GrahaData | undefined): boolean {
  if (!g) return false
  if (g.gandanta?.isGandanta) return true
  const deg = g.degree
  return deg < 2 || deg >= 28
}

/**
 * Arohini = in exaltation sign, approaching or at exaltation peak.
 * Avarohini = in debilitation sign, approaching or at debilitation peak.
 * Nodes (Ra/Ke) without exact exaltation degrees are skipped.
 */
export function arohiniKindForGraha(g: GrahaData | undefined): ArohiniKind {
  if (!g) return null
  const exaltSign = EXALTATION_SIGN[g.id]
  const debilSign = DEBILITATION_SIGN[g.id]
  const peak = EXALTATION_DEGREE[g.id as GrahaId]
  if (peak == null) return null

  if (exaltSign != null && g.rashi === exaltSign) {
    // Approaching peak (degree rising toward peak) or within 5° after peak still "arohini support"
    if (g.degree <= peak + 5) return 'arohini'
  }
  if (debilSign != null && g.rashi === debilSign) {
    // Debilitation peak is exaltation + 180° → same degree-in-sign as exaltation peak
    if (g.degree <= peak + 5) return 'avarohini'
  }
  return null
}

/** Antar index within a mahadasha (0 = first = MD lord, 8 = last). */
export function antardashaIndexInMaha(mahaLord: string, antarLord: string): number {
  const seq = DASHA_SEQUENCE as readonly string[]
  const mahaIdx = seq.indexOf(mahaLord)
  const antarIdx = seq.indexOf(antarLord)
  if (mahaIdx < 0 || antarIdx < 0) return -1
  return (antarIdx - mahaIdx + 9) % 9
}

export function isChidraAntardasha(mahaLord: string, antarLord: string): {
  isChidra: boolean
  phase: 'beginning' | 'end' | null
} {
  const idx = antardashaIndexInMaha(mahaLord, antarLord)
  if (idx === 0) return { isChidra: true, phase: 'beginning' }
  if (idx === 8) return { isChidra: true, phase: 'end' }
  return { isChidra: false, phase: null }
}

/**
 * 0-based index of current mahadasha among the level-1 nodes that cover the life
 * (birth MD = 0). 3rd / 5th / 7th → indices 2, 4, 6.
 */
export function mahadashaSequenceIndex(nodes: DashaNode[], currentMahaLord: string): number {
  const level1 = nodes.filter(n => n.level === 1 || n.level === undefined)
  const idx = level1.findIndex(n => n.lord === currentMahaLord && n.isCurrent)
  if (idx >= 0) return idx
  return level1.findIndex(n => n.lord === currentMahaLord)
}

export function isProblematicSequenceIndex(index: number): boolean {
  return index === 2 || index === 4 || index === 6
}

function findGraha(grahas: GrahaData[], id: string): GrahaData | undefined {
  return grahas.find(g => g.id === id)
}

function bavInOccupiedSign(
  ashtakavarga: AshtakavargaResult | null | undefined,
  lord: string,
  rashi: number | undefined,
): number | null {
  if (!ashtakavarga?.bav || rashi == null) return null
  const row = ashtakavarga.bav[lord]
  if (!row?.bindus) return null
  return row.bindus[rashi - 1] ?? null
}

function savInHouse(
  ashtakavarga: AshtakavargaResult | null | undefined,
  house: number | null,
  ascRashi: Rashi,
): number | null {
  if (!ashtakavarga?.sav || house == null) return null
  const sign = ((ascRashi - 1 + house - 1) % 12) + 1
  return ashtakavarga.sav[sign - 1] ?? null
}

function lordSnapshot(
  lord: string,
  ascRashi: Rashi,
  grahas: GrahaData[],
  shadbala: ShadbalaResult | null | undefined,
  ashtakavarga: AshtakavargaResult | null | undefined,
): VimshottariLordSnapshot {
  const g = findGraha(grahas, lord)
  const house = g ? wholeSignHouse(g.rashi, ascRashi) : null
  const mb = getMarakaBadhakaFlags(ascRashi, lord)
  const sb = shadbala?.planets?.[lord]
  const bav = bavInOccupiedSign(ashtakavarga, lord, g?.rashi)
  const sav = savInHouse(ashtakavarga, house, ascRashi)
  return {
    lord: lord as GrahaId,
    house,
    housesRuled: housesRuledBy(ascRashi, lord),
    dignity: g?.dignity ?? null,
    isRetro: g?.isRetro ?? false,
    isGandantaEdge: isGandantaEdge(g),
    shadbalaRatio: sb?.ratio ?? null,
    shadbalaBand: sb?.qualityBand ?? (sb ? (sb.isStrong ? 'strong' : 'weak') : null),
    bavBindus: bav,
    savBindus: sav,
    resultPercent: sav != null ? estimateDashaResultPercent(sav) : null,
    isMaraka: mb.isMaraka,
    marakaCancelled: mb.marakaCancelledByTrikona,
    isYogakaraka: isYogakarakaLord(ascRashi, lord),
    arohiniKind: arohiniKindForGraha(g),
  }
}

function isEnemyDignity(dignity: string | null | undefined): boolean {
  return dignity === 'enemy' || dignity === 'great_enemy'
}

function isArishta(
  snap: VimshottariLordSnapshot,
  navamshaGrahas: GrahaData[] | null | undefined,
): boolean {
  if (snap.dignity === 'debilitated') return true
  if (isEnemyDignity(snap.dignity)) return true
  if (navamshaGrahas?.length) {
    const d9 = findGraha(navamshaGrahas, snap.lord)
    if (d9 && (d9.dignity === 'debilitated' || isEnemyDignity(d9.dignity))) return true
  }
  return false
}

function clampMix(fav: number, chal: number, neu: number): {
  favorableShare: number
  challengingShare: number
  neutralShare: number
} {
  // Floor each at 5, then normalize so shares always sum to 100
  let f = Math.max(5, fav)
  let c = Math.max(5, chal)
  let n = Math.max(5, neu)
  const sum = f + c + n
  f = Math.round((f / sum) * 100)
  c = Math.round((c / sum) * 100)
  n = 100 - f - c
  // Keep each at least 5 after rounding drift
  if (n < 5) {
    const deficit = 5 - n
    n = 5
    if (f >= c && f > 5 + deficit) f -= deficit
    else if (c > 5 + deficit) c -= deficit
    else {
      f = Math.max(5, f - Math.ceil(deficit / 2))
      c = 100 - f - n
    }
  }
  if (f < 5) {
    const deficit = 5 - f
    f = 5
    if (c > n && c > 5 + deficit) c -= deficit
    else n = Math.max(5, n - deficit)
    c = 100 - f - n
  }
  if (c < 5) {
    const deficit = 5 - c
    c = 5
    if (f > n && f > 5 + deficit) f -= deficit
    else n = Math.max(5, n - deficit)
    f = 100 - c - n
  }
  // Final guarantee
  const total = f + c + n
  if (total !== 100) n = 100 - f - c
  return { favorableShare: f, challengingShare: c, neutralShare: n }
}

const HOUSE_THEME: Record<number, string> = {
  1: 'self & vitality',
  2: 'money & family speech',
  3: 'effort, siblings & short travel',
  4: 'home, mother & peace of mind',
  5: 'creativity, romance & children',
  6: 'work, competition & health friction',
  7: 'partnerships & contracts',
  8: 'sudden change & shared resources',
  9: 'fortune, mentors & long journeys',
  10: 'career & public status',
  11: 'gains, networks & ambitions',
  12: 'expenses, solitude & foreign ties',
}

function houseThemeList(houses: number[]): string {
  return houses
    .slice(0, 3)
    .map(h => HOUSE_THEME[h] ?? `H${h}`)
    .join('; ')
}

/**
 * Plain-language “what happens” copy for teaser / panel.
 * Prefer life themes over classical jargon.
 */
export function buildCrispInsight(
  mahadasha: VimshottariLordSnapshot,
  antardasha: VimshottariLordSnapshot | null,
  flags: VimshottariFlag[],
  mix: { favorableShare: number; challengingShare: number; neutralShare: number },
  mahaLord: string,
  antarLord: string | null,
): VimshottariCrispInsight {
  const mahaInterp = getVimshottariInterpretation(mahaLord)
  const antarHint = antarLord ? getVimshottariAntarHint(mahaLord, antarLord) : null

  const toneLabel: VimshottariCrispInsight['toneLabel'] =
    mix.favorableShare >= 55 && mix.favorableShare > mix.challengingShare + 10
      ? 'Favorable stretch'
      : mix.challengingShare >= 50 && mix.challengingShare > mix.favorableShare
        ? 'Challenging stretch'
        : 'Mixed period'

  const bullets: string[] = []

  // 1) Antar-specific “what happens” (most actionable)
  if (antarHint) {
    bullets.push(antarHint)
  } else if (mahaInterp) {
    bullets.push(mahaInterp.lifeEvents)
  }

  // 2) House themes from MD (and AD if different)
  if (mahadasha.housesRuled.length) {
    const placed = mahadasha.house != null ? ` — results deliver via ${HOUSE_THEME[mahadasha.house] ?? `H${mahadasha.house}`}` : ''
    bullets.push(`Mahadasha activates ${houseThemeList(mahadasha.housesRuled)}${placed}.`)
  }
  if (antardasha && antardasha.housesRuled.length && antardasha.lord !== mahadasha.lord) {
    const placed = antardasha.house != null
      ? ` (Antar placed in ${HOUSE_THEME[antardasha.house] ?? `H${antardasha.house}`})`
      : ''
    bullets.push(`This Antar colours results with ${houseThemeList(antardasha.housesRuled)}${placed}.`)
  }

  // 3) Supportive yoga / strength (plain language)
  if (flags.some(f => f.id === 'yogakaraka') || mahadasha.isYogakaraka) {
    bullets.push('Yogakaraka support — authority, status, and lasting gains are more available if you act.')
  }
  if (flags.some(f => f.id === 'lp-10in10')) {
    bullets.push('Career lord strong in career house — money, property, and power themes can land this period.')
  }
  if (flags.some(f => f.id === 'lp-4-10')) {
    bullets.push('Home–career axis active — property moves or authority at work are in play.')
  }
  if (flags.some(f => f.id === 'lp-5-9')) {
    bullets.push('Creative/fortune link active — children or creative projects (when age-fit) get a push.')
  }

  // Trim to 3 crisp bullets
  const trimmed = bullets.filter(Boolean).slice(0, 3)

  // Watch-outs in plain language (no jargon pile-up)
  const watches: string[] = []
  if (flags.some(f => f.id === 'chidra')) {
    watches.push('Opening or closing Antar — expect setup struggle or abrupt transitions.')
  }
  if (flags.some(f => f.id === 'arishta')) {
    watches.push('Planet is weak / afflicted — results may come with friction or incomplete delivery.')
  }
  if (flags.some(f => f.id === 'avarohini')) {
    watches.push('Strength is sliding — don’t force big bets; consolidate instead.')
  }
  if (flags.some(f => f.id === 'rikta')) {
    watches.push('Low support points — efforts can feel empty; focus on essentials.')
  }
  if (flags.some(f => f.id === 'maraka')) {
    watches.push('Hardship-lord period — pressure on body, money, or partnerships; pace yourself.')
  }
  if (flags.some(f => f.id === 'retrograde')) {
    watches.push('Retrograde lord — timing feels unpredictable; double-check decisions.')
  }

  const theme = mahaInterp?.keyTheme ?? 'period themes'
  const headline =
    toneLabel === 'Favorable stretch'
      ? `Expect progress in ${theme.toLowerCase()} — lean into openings.`
      : toneLabel === 'Challenging stretch'
        ? `Expect tests around ${theme.toLowerCase()} — move carefully, results still mixed.`
        : `Expect a mix around ${theme.toLowerCase()} — some gains, some friction.`

  return {
    toneLabel,
    headline,
    bullets: trimmed.length ? trimmed : [mahaInterp?.primaryPositive ?? 'Mixed life themes activate.'],
    watch: watches[0] ?? null,
  }
}

function activePath(nodes: DashaNode[]): DashaNode[] {
  const path: DashaNode[] = []
  let current = nodes.find(n => n.isCurrent)
  while (current) {
    path.push(current)
    current = current.children?.find(c => c.isCurrent)
  }
  return path
}

/** Vedic whole-sign aspect (Parashara): 7th all; Ma 4/8; Ju 5/9; Sa 3/10. */
function hasAspect(source: GrahaData, target: GrahaData): boolean {
  if (source.id === target.id) return false
  const diff = signCount(source.rashi, target.rashi)
  if (diff === 7) return true
  if (source.id === 'Ma' && (diff === 4 || diff === 8)) return true
  if (source.id === 'Ju' && (diff === 5 || diff === 9)) return true
  if (source.id === 'Sa' && (diff === 3 || diff === 10)) return true
  return false
}

function lordsConnected(
  a: GrahaData | undefined,
  b: GrahaData | undefined,
  ascRashi: Rashi,
): boolean {
  if (!a || !b) return false
  if (a.rashi === b.rashi) return true
  if (hasAspect(a, b) || hasAspect(b, a)) return true
  // Parivartana: each sits in a house the other lords
  const aHouse = wholeSignHouse(a.rashi, ascRashi)
  const bHouse = wholeSignHouse(b.rashi, ascRashi)
  return houseLord(ascRashi, aHouse) === b.id && houseLord(ascRashi, bHouse) === a.id
}

function periodLordsInvolve(md: string, ad: string | null, a: string, b: string): boolean {
  const set = new Set([md, ad].filter(Boolean) as string[])
  return set.has(a) || set.has(b)
}

/**
 * Laghu Parashari style flags relevant to the running MD/AD.
 * Educational only — age-appropriate caveats for progeny themes.
 */
export function collectLaghuParashariFlags(
  ascRashi: Rashi,
  grahas: GrahaData[],
  mahaLord: string,
  antarLord: string | null,
): VimshottariFlag[] {
  const flags: VimshottariFlag[] = []
  const lord10 = houseLord(ascRashi, 10)
  const lord4 = houseLord(ascRashi, 4)
  const lord5 = houseLord(ascRashi, 5)
  const lord9 = houseLord(ascRashi, 9)

  const g10 = findGraha(grahas, lord10)
  if (g10 && (mahaLord === lord10 || antarLord === lord10)) {
    const h10 = wholeSignHouse(g10.rashi, ascRashi)
    if (h10 === 10) {
      flags.push({
        id: 'lp-10in10',
        label: '10th lord in 10th',
        tone: 'supportive',
        detail: 'Classically linked with money, property, and authority themes during this lord’s periods.',
      })
    }
  }

  const g5 = findGraha(grahas, lord5)
  const g9 = findGraha(grahas, lord9)
  if (
    periodLordsInvolve(mahaLord, antarLord, lord5, lord9)
    && lordsConnected(g5, g9, ascRashi)
  ) {
    flags.push({
      id: 'lp-5-9',
      label: '5th–9th lord link',
      tone: 'supportive',
      detail: '5th and 9th lords connected — progeny / creative fortune themes when age-appropriate; not a guarantee.',
    })
  }

  const g4 = findGraha(grahas, lord4)
  if (
    periodLordsInvolve(mahaLord, antarLord, lord4, lord10)
    && lordsConnected(g4, g10, ascRashi)
  ) {
    flags.push({
      id: 'lp-4-10',
      label: '4th–10th lord link',
      tone: 'supportive',
      detail: '4th and 10th lords connected — authority and property / home-building themes during this period.',
    })
  }

  return flags
}

/**
 * Analyze the current Vimshottari MD/AD path against chart strengths and classical flags.
 */
export function analyzeVimshottariPeriod(input: AnalyzeVimshottariInput): VimshottariPeriodAnalysis | null {
  const { nodes, ascRashi, grahas, shadbala, ashtakavarga, navamshaGrahas } = input
  const path = activePath(nodes)
  if (path.length < 1) return null

  const mahaNode = path[0]
  const antarNode = path[1] ?? null
  const mahadasha = lordSnapshot(mahaNode.lord, ascRashi, grahas, shadbala, ashtakavarga)
  const antardasha = antarNode
    ? lordSnapshot(antarNode.lord, ascRashi, grahas, shadbala, ashtakavarga)
    : null

  const profile = getLagnaDashaProfile(ascRashi)
  const yk = getYogakaraka(ascRashi)
  const flags: VimshottariFlag[] = []

  let fav = 45
  let chal = 25
  let neu = 30

  if (mahadasha.house != null) {
    if ([1, 4, 5, 7, 9, 10].includes(mahadasha.house)) {
      fav += 12
      flags.push({
        id: 'kendra-trikona',
        label: 'Kendra / Trikona',
        tone: 'supportive',
        detail: `Mahadasha lord sits in house ${mahadasha.house} — classically supportive for delivery.`,
      })
    } else if ([6, 8, 12].includes(mahadasha.house)) {
      chal += 10
      flags.push({
        id: 'dusthana',
        label: 'Dusthana placement',
        tone: 'caution',
        detail: `Mahadasha lord in house ${mahadasha.house} — expect more friction; results still mixed.`,
      })
    }
  }

  if (mahadasha.isYogakaraka) {
    fav += 15
    flags.push({
      id: 'yogakaraka',
      label: 'Yogakaraka',
      tone: 'supportive',
      detail: yk.note,
    })
  }

  if (mahadasha.shadbalaRatio != null) {
    if (mahadasha.shadbalaRatio >= 1.1) {
      fav += 10
      flags.push({
        id: 'shadbala-strong',
        label: 'Strong Shadbala',
        tone: 'supportive',
        detail: `Shadbala ratio ${mahadasha.shadbalaRatio.toFixed(2)} (${mahadasha.shadbalaBand ?? 'strong'}).`,
      })
    } else if (mahadasha.shadbalaRatio < 0.85) {
      chal += 8
      flags.push({
        id: 'shadbala-weak',
        label: 'Weak Shadbala',
        tone: 'caution',
        detail: `Shadbala ratio ${mahadasha.shadbalaRatio.toFixed(2)} — delivery may feel muted.`,
      })
    }
  }

  const riktaLord = mahadasha.bavBindus != null && mahadasha.bavBindus < 4
    ? mahadasha
    : antardasha && antardasha.bavBindus != null && antardasha.bavBindus < 4
      ? antardasha
      : null
  if (riktaLord) {
    chal += 10
    fav -= 5
    flags.push({
      id: 'rikta',
      label: 'Rikta (low Ashtakavarga)',
      tone: 'caution',
      detail: `${riktaLord.lord} has ${riktaLord.bavBindus} BAV bindu(s) in its sign (< 4) — results often feel empty or unsatisfactory.`,
    })
  } else if (mahadasha.bavBindus != null && mahadasha.bavBindus >= 5) {
    fav += 6
    flags.push({
      id: 'bav-good',
      label: 'Healthy Ashtakavarga',
      tone: 'supportive',
      detail: `Mahadasha lord has ${mahadasha.bavBindus} BAV bindus in its sign.`,
    })
  }

  if (isArishta(mahadasha, navamshaGrahas) || (antardasha && isArishta(antardasha, navamshaGrahas))) {
    chal += 12
    flags.push({
      id: 'arishta',
      label: 'Arishta (affliction)',
      tone: 'caution',
      detail: 'Debilitation and/or enemy dignity in D1 or D9 — expect more troubles; not absolute misfortune.',
    })
  }

  if (antarNode) {
    const chidra = isChidraAntardasha(mahaNode.lord, antarNode.lord)
    if (chidra.isChidra) {
      chal += 10
      fav -= 5
      flags.push({
        id: 'chidra',
        label: chidra.phase === 'beginning' ? 'Chidra (beginning)' : 'Chidra (ending)',
        tone: 'caution',
        detail: chidra.phase === 'beginning'
          ? 'First Antardasha of the Mahadasha — often a struggle/setup phase regardless of planetary strength.'
          : 'Last Antardasha of the Mahadasha — classically unpredictable; transitions can feel abrupt.',
      })
    }
  }

  const seqIdx = mahadashaSequenceIndex(nodes, mahaNode.lord)
  if (seqIdx >= 0 && isProblematicSequenceIndex(seqIdx)) {
    chal += 6
    flags.push({
      id: 'sequence-357',
      label: `${seqIdx + 1}th from birth dasha`,
      tone: 'caution',
      detail: '3rd, 5th, and 7th mahadashas from birth are often not fully favorable — benefic status can still soften this.',
    })
  }

  if (mahadasha.isMaraka || antardasha?.isMaraka) {
    chal += 8
    flags.push({
      id: 'maraka',
      label: 'Maraka lordship',
      tone: 'caution',
      detail: 'Owns 2nd and/or 7th without trikona cancellation — can bring severe hardship or pressure. Maraka means hardship intensity, not a life-ending forecast.',
    })
  } else if (mahadasha.marakaCancelled || antardasha?.marakaCancelled) {
    flags.push({
      id: 'maraka-cancelled',
      label: 'Maraka cancelled',
      tone: 'mixed',
      detail: 'Owns maraka houses but also trikona — maraka potency is greatly weakened.',
    })
  }

  if (mahadasha.isRetro || antardasha?.isRetro) {
    chal += 4
    neu += 4
    flags.push({
      id: 'retrograde',
      label: 'Retrograde period lord',
      tone: 'mixed',
      detail: 'Retrograde dasha lords are harder to pin down — expect unexpected turns; soft health caution applies.',
    })
  }

  if (mahadasha.isGandantaEdge || antardasha?.isGandantaEdge) {
    chal += 5
    flags.push({
      id: 'gandanta',
      label: 'Gandanta / edge degrees',
      tone: 'caution',
      detail: 'Lord near sign junction or 0–2° / 28–30° — results may feel incomplete or abrupt.',
    })
  }

  // Arohini / Avarohini on MD (primary) then AD
  const aroTarget = mahadasha.arohiniKind
    ? mahadasha
    : antardasha?.arohiniKind
      ? antardasha
      : null
  if (aroTarget?.arohiniKind === 'arohini') {
    fav += 8
    flags.push({
      id: 'arohini',
      label: 'Arohini (toward exaltation)',
      tone: 'supportive',
      detail: `${aroTarget.lord} is in exaltation sign approaching its peak — classically supportive delivery.`,
    })
  } else if (aroTarget?.arohiniKind === 'avarohini') {
    chal += 8
    flags.push({
      id: 'avarohini',
      label: 'Avarohini (toward debilitation)',
      tone: 'caution',
      detail: `${aroTarget.lord} is in debilitation sign approaching its peak — results often feel strained.`,
    })
  }

  const lpFlags = collectLaghuParashariFlags(
    ascRashi,
    grahas,
    mahaNode.lord,
    antarNode?.lord ?? null,
  )
  for (const f of lpFlags) {
    if (f.tone === 'supportive') fav += 6
    flags.push(f)
  }

  let relation: MdAdRelation | null = null
  if (antarNode) {
    const g1 = findGraha(grahas, mahaNode.lord)
    const g2 = findGraha(grahas, antarNode.lord)
    if (g1 && g2) {
      relation = relationFromSignCount(signCount(g1.rashi, g2.rashi))
      if (relation.tone === 'supportive') fav += 8
      if (relation.tone === 'challenging') chal += 8
      flags.push({
        id: 'md-ad-relation',
        label: relation.label,
        tone: relation.tone === 'challenging' ? 'caution' : relation.tone === 'supportive' ? 'supportive' : 'mixed',
        detail: `Mahadasha and Antardasha lords are ${relation.label.toLowerCase()}.`,
      })
    }
  }

  const mix = clampMix(fav, chal, neu)
  const summaryParts: string[] = []
  if (mahadasha.isYogakaraka) summaryParts.push('Yogakaraka support')
  if (flags.some(f => f.id === 'chidra')) summaryParts.push('Chidra phase')
  if (flags.some(f => f.id === 'rikta')) summaryParts.push('Rikta pressure')
  if (flags.some(f => f.id === 'arishta')) summaryParts.push('Arishta affliction')
  if (flags.some(f => f.id === 'arohini')) summaryParts.push('Arohini lift')
  if (flags.some(f => f.id === 'avarohini')) summaryParts.push('Avarohini strain')
  if (flags.some(f => f.id.startsWith('lp-'))) summaryParts.push('Laghu Parashari yoga')
  if (relation?.tone === 'supportive') summaryParts.push('harmonious MD–AD link')
  if (relation?.tone === 'challenging') summaryParts.push('strained MD–AD link')

  const summary = summaryParts.length
    ? `Mixed period with ${summaryParts.join(', ')}. No dasha is 100% good or bad.`
    : 'Mixed period — every mahadasha delivers some supportive, challenging, and neutral themes.'

  const insight = buildCrispInsight(
    mahadasha,
    antardasha,
    flags,
    mix,
    mahaNode.lord,
    antarNode?.lord ?? null,
  )

  return {
    mahadasha,
    antardasha,
    relation,
    flags,
    ...mix,
    yogakarakaNote: yk.note,
    lagnaSpecialNote: profile.specialNote,
    marakaNote: profile.marakaNote,
    summary,
    insight,
  }
}
