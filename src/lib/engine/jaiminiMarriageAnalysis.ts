// ─────────────────────────────────────────────────────────────
//  src/lib/engine/jaiminiMarriageAnalysis.ts
//  Jaimini marriage & relationship framework
//  Pillars: DK · UL · 7th · DK-in-D9 · Rahu/Ketu influence
//  Timing: Chara dasha of key signs + Vimshottari UL-lord cross-check
// ─────────────────────────────────────────────────────────────

import type {
  ChartOutput,
  Dignity,
  GrahaData,
  GrahaId,
  Rashi,
} from '@/types/astrology'
import {
  GRAHA_NAMES,
  RASHI_NAMES,
  RASHI_SHORT,
} from '@/types/astrology'
import { calcCharaKarakas } from '@/lib/engine/karakas'
import { getRashiDrishti, getSignType, rashiAspectsOrOccupies } from '@/lib/engine/jaimini/aspects'
import { DEBILITATION_SIGN } from '@/lib/engine/dignity'
import { getDashaPathAt } from '@/lib/engine/dasha/current'
import { ensureCharaDashas } from '@/lib/engine/dasha/hydrateChara'

// ── Constants ────────────────────────────────────────────────

const CLASSICAL_ORDER: GrahaId[] = ['Su', 'Mo', 'Ma', 'Me', 'Ju', 'Ve', 'Sa', 'Ra', 'Ke']
const MALEFICS: GrahaId[] = ['Ma', 'Sa', 'Ra', 'Ke', 'Su']
const BENEFICS: GrahaId[] = ['Ju', 'Ve', 'Me', 'Mo']

const SIGN_LORDS: Record<Rashi, GrahaId> = {
  1: 'Ma', 2: 'Ve', 3: 'Me', 4: 'Mo', 5: 'Su', 6: 'Me',
  7: 'Ve', 8: 'Ma', 9: 'Ju', 10: 'Sa', 11: 'Sa', 12: 'Ju',
}

const STRONG_DIGNITY: Dignity[] = ['exalted', 'moolatrikona', 'own']
const WEAK_DIGNITY: Dignity[] = ['debilitated', 'great_enemy', 'enemy']

const HOUSE_INFLUENCE: Record<number, string> = {
  1: 'self-image and vitality',
  2: 'finances, speech, and family resources',
  3: 'courage, siblings, and short efforts',
  4: 'home comfort and emotional roots',
  5: 'romance, creativity, and children',
  6: 'service, debts, and rivalry',
  7: 'partnership contracts and public relating',
  8: 'hidden matters, intimacy, and shared resources',
  9: 'dharma, fortune, and higher ideals',
  10: 'career, status, and public karma',
  11: 'ambitions, gains, and desires',
  12: 'losses, foreign lands, and bed pleasures',
}

/** Partner nature / hidden challenge / karmic lesson by DK planet. */
export const DK_PLANET_PROFILES: Record<GrahaId, {
  nature: string
  hiddenChallenge: string
  karmicLesson: string
}> = {
  Su: {
    nature: 'Confident, authoritative, royal presence',
    hiddenChallenge: 'Power struggle; partner may dominate decisions',
    karmicLesson: 'Balance your ego; learn respectful leadership in partnership',
  },
  Mo: {
    nature: 'Emotional, caring, nurturing, family-oriented',
    hiddenChallenge: 'Mood swings and emotional instability',
    karmicLesson: 'Cultivate emotional balance and steady care',
  },
  Ma: {
    nature: 'Bold, passionate, action-oriented, assertive',
    hiddenChallenge: 'Fights, bedroom conflicts, high sexual intensity',
    karmicLesson: 'Control anger; channel drive into constructive action',
  },
  Me: {
    nature: 'Intelligent, witty, communicative',
    hiddenChallenge: 'Dual nature, over-communication, flirtatious tendencies',
    karmicLesson: 'Balance excessive talk; listen as much as you speak',
  },
  Ju: {
    nature: 'Wise, mature, teacher/guide type',
    hiddenChallenge: 'Moral superiority complex',
    karmicLesson: 'Stay open to receiving advice; avoid preaching',
  },
  Ve: {
    nature: 'Romantic, artistic, attractive, pleasure-seeking',
    hiddenChallenge: 'Extra affairs or indulgence (varies by position)',
    karmicLesson: 'Moderate pleasures; deepen devotion over novelty',
  },
  Sa: {
    nature: 'Mature (older-looking), serious, hardworking, practical',
    hiddenChallenge: 'Emotionally dry or distant',
    karmicLesson: 'Accept karmic discipline; build warmth deliberately',
  },
  Ra: {
    nature: 'Foreign, unconventional, or taboo-attracting partner',
    hiddenChallenge: 'Secret or non-traditional relationship patterns',
    karmicLesson: 'Accept unusual life paths without self-deception',
  },
  Ke: {
    nature: 'Detached, mystical, or past-life bonded partner',
    hiddenChallenge: 'Sudden separation themes or spiritual withdrawal',
    karmicLesson: 'Release control; honor completion of karmic contracts',
  },
  Ur: {
    nature: 'Sudden, reformist partner energy',
    hiddenChallenge: 'Unpredictable breaks in relating',
    karmicLesson: 'Adapt without clinging to fixed scripts',
  },
  Ne: {
    nature: 'Idealistic, compassionate, elusive partner',
    hiddenChallenge: 'Illusion or disappointment in romance',
    karmicLesson: 'See clearly; love without projection',
  },
  Pl: {
    nature: 'Intense, transformative partner',
    hiddenChallenge: 'Power and control dynamics',
    karmicLesson: 'Transform through honesty, not domination',
  },
}

const RASHI_SHORT_TO_NUM: Record<string, Rashi> = {
  Ar: 1, Ta: 2, Ge: 3, Cn: 4, Le: 5, Vi: 6,
  Li: 7, Sc: 8, Sg: 9, Cp: 10, Aq: 11, Pi: 12,
}

// ── Types ────────────────────────────────────────────────────

export type StrengthBand = 'strong' | 'moderate' | 'weak'
export type MarriageBalance = 'balanced' | 'imbalanced'
export type MarriagePathType = 'love' | 'arranged' | 'love_cum_arranged' | 'unclear'
export type DkUlScenario =
  | 'strong_dk_weak_ul'
  | 'weak_dk_strong_ul'
  | 'both_strong'
  | 'both_weak'
  | 'mixed'

export type InsightTone = 'supportive' | 'challenging' | 'mixed' | 'neutral'

export interface JaiminiMarriageInsight {
  title: string
  text: string
  tone: InsightTone
}

export interface SignPoint {
  rashi: Rashi
  rashiName: string
  rashiShort: string
  houseFromLagna: number
  lord: GrahaId
  lordName: string
}

export interface OccupantSummary {
  id: GrahaId
  name: string
  dignity: Dignity
  isRetro: boolean
  isCombust: boolean
  charaKaraka: string | null
}

export interface AspectHit {
  id: GrahaId
  name: string
  fromRashi: Rashi
  fromRashiName: string
  relation: 'conjunct' | 'aspect'
  isMalefic: boolean
  isBenefic: boolean
}

export interface InfluenceArea {
  house: number
  theme: string
  note: string
}

export interface RedFlag {
  id: string
  label: string
  active: boolean
  detail: string
}

export interface TimingWindow {
  id: string
  label: string
  rashi: Rashi
  rashiName: string
  rashiShort: string
  system: 'chara' | 'vimshottari'
  note: string
  isActiveNow: boolean
  activePathLabel: string | null
}

export interface StrengthScore {
  band: StrengthBand
  score: number
  reasons: string[]
}

export interface DarakarakaBlock {
  id: GrahaId
  name: string
  degree: number
  isRetro: boolean
  isCombust: boolean
  dignity: Dignity
  sign: SignPoint
  signType: ReturnType<typeof getSignType>
  profile: (typeof DK_PLANET_PROFILES)[GrahaId]
  companions: OccupantSummary[]
  aspects: AspectHit[]
  influenceAreas: InfluenceArea[]
  rahuInfluence: boolean
  ketuInfluence: boolean
  saturnWithDk: boolean
  strength: StrengthScore
  notes: string[]
}

export interface UpapadaBlock {
  sign: SignPoint
  seventhFromUl: SignPoint
  secondFromUl: SignPoint
  ulLord: {
    id: GrahaId
    name: string
    rashi: Rashi
    rashiName: string
    houseFromLagna: number
    dignity: Dignity
    isCombust: boolean
    isDebilitated: boolean
  }
  occupantsUl: OccupantSummary[]
  aspectsOnUl: AspectHit[]
  occupants2nd: OccupantSummary[]
  aspectsOn2nd: AspectHit[]
  occupants7th: OccupantSummary[]
  secondFromUlDamaged: boolean
  ulOnRahuKetuAxis: boolean
  strength: StrengthScore
  notes: string[]
}

export interface SeventhHouseBlock {
  sign: SignPoint
  occupants: OccupantSummary[]
  lord: {
    id: GrahaId
    name: string
    rashi: Rashi
    rashiName: string
    houseFromLagna: number
    dignity: Dignity
    isCombust: boolean
  }
  notes: string[]
}

export interface DkNavamshaBlock {
  rashi: Rashi
  rashiName: string
  houseFromD9Lagna: number
  dignity: Dignity
  isDebilitated: boolean
  seventhFromDk: SignPoint
  seventhOccupants: OccupantSummary[]
  aspectsOnDk: AspectHit[]
  trinalBlessing: boolean
  dusthanaPlacement: boolean
  notes: string[]
}

export interface SocialAcceptanceBlock {
  sun: {
    rashi: Rashi
    rashiName: string
    houseFromLagna: number
    dignity: Dignity
    withRahuKetu: boolean
    withSeventhLord: boolean
    afflicted: boolean
  }
  moon: {
    rashi: Rashi
    rashiName: string
    houseFromLagna: number
    dignity: Dignity
    withRahuKetu: boolean
  }
  familySupport: StrengthBand
  notes: string[]
}

export interface MarriagePathBlock {
  type: MarriagePathType
  label: string
  loveScore: number
  arrangedScore: number
  notes: string[]
}

export interface JaiminiMarriageAnalysis {
  darakaraka: DarakarakaBlock
  upapada: UpapadaBlock
  seventh: SeventhHouseBlock
  dkNavamsha: DkNavamshaBlock
  social: SocialAcceptanceBlock
  marriagePath: MarriagePathBlock
  dkUlScenario: DkUlScenario
  dkUlScenarioLabel: string
  dkUlScenarioNote: string
  balance: MarriageBalance
  qualityBand: StrengthBand
  qualitySummary: string
  redFlags: RedFlag[]
  activeRedFlagCount: number
  timing: TimingWindow[]
  insights: JaiminiMarriageInsight[]
  checklist: string[]
  quotes: string[]
  summary: string
}

// ── Helpers ──────────────────────────────────────────────────

function wholeSignHouse(asc: Rashi, target: Rashi): number {
  return ((target - asc + 12) % 12) + 1
}

function houseSign(asc: Rashi, house: number): Rashi {
  return (((asc - 1 + house - 1) % 12) + 1) as Rashi
}

function signPoint(asc: Rashi, rashi: Rashi): SignPoint {
  return {
    rashi,
    rashiName: RASHI_NAMES[rashi],
    rashiShort: RASHI_SHORT[rashi],
    houseFromLagna: wholeSignHouse(asc, rashi),
    lord: SIGN_LORDS[rashi],
    lordName: GRAHA_NAMES[SIGN_LORDS[rashi]],
  }
}

function occupantsOf(grahas: GrahaData[], rashi: Rashi): OccupantSummary[] {
  return grahas
    .filter(g => CLASSICAL_ORDER.includes(g.id) && g.rashi === rashi)
    .map(g => ({
      id: g.id,
      name: GRAHA_NAMES[g.id],
      dignity: g.dignity,
      isRetro: g.isRetro,
      isCombust: g.isCombust,
      charaKaraka: g.charaKaraka,
    }))
}

function aspectHitsOnSign(grahas: GrahaData[], target: Rashi): AspectHit[] {
  const hits: AspectHit[] = []
  for (const g of grahas) {
    if (!CLASSICAL_ORDER.includes(g.id)) continue
    if (g.rashi === target) {
      hits.push({
        id: g.id,
        name: GRAHA_NAMES[g.id],
        fromRashi: g.rashi,
        fromRashiName: RASHI_NAMES[g.rashi],
        relation: 'conjunct',
        isMalefic: MALEFICS.includes(g.id),
        isBenefic: BENEFICS.includes(g.id),
      })
    } else if (getRashiDrishti(g.rashi).includes(target)) {
      hits.push({
        id: g.id,
        name: GRAHA_NAMES[g.id],
        fromRashi: g.rashi,
        fromRashiName: RASHI_NAMES[g.rashi],
        relation: 'aspect',
        isMalefic: MALEFICS.includes(g.id),
        isBenefic: BENEFICS.includes(g.id),
      })
    }
  }
  return hits
}

function bandFromScore(score: number): StrengthBand {
  if (score >= 65) return 'strong'
  if (score >= 40) return 'moderate'
  return 'weak'
}

function rashiFromDashaLord(lord: string): Rashi | null {
  if (RASHI_SHORT_TO_NUM[lord]) return RASHI_SHORT_TO_NUM[lord]
  // Some trees store full names
  const entry = (Object.entries(RASHI_NAMES) as [string, string][])
    .find(([, name]) => name.toLowerCase() === lord.toLowerCase())
  if (entry) return Number(entry[0]) as Rashi
  return null
}

function formatDashaPath(path: { lord: string }[]): string | null {
  if (!path.length) return null
  return path.map(n => {
    const r = rashiFromDashaLord(n.lord)
    return r ? RASHI_NAMES[r] : GRAHA_NAMES[n.lord as GrahaId] ?? n.lord
  }).join(' / ')
}

function isRahuKetuLinked(hits: AspectHit[], id: GrahaId): boolean {
  return hits.some(h => h.id === id)
}

function scorePlanetStrength(opts: {
  dignity: Dignity
  isCombust: boolean
  house: number
  withRahu: boolean
  withSaturn: boolean
  beneficAspectCount: number
  maleficAspectCount: number
}): StrengthScore {
  let score = 50
  const reasons: string[] = []

  if (STRONG_DIGNITY.includes(opts.dignity)) {
    score += 18
    reasons.push(`Dignity ${opts.dignity} supports strength`)
  } else if (WEAK_DIGNITY.includes(opts.dignity)) {
    score -= 18
    reasons.push(`Dignity ${opts.dignity} weakens expression`)
  }

  if (opts.isCombust) {
    score -= 15
    reasons.push('Combustion weakens the significator')
  }

  if ([1, 4, 5, 7, 9, 10].includes(opts.house)) {
    score += 12
    reasons.push(`Placed in house ${opts.house} (kendra/trikona support)`)
  } else if ([6, 8, 12].includes(opts.house)) {
    score -= 12
    reasons.push(`Dusthana house ${opts.house} pressures the significator`)
  }

  if (opts.withRahu) {
    score -= 14
    reasons.push('Rahu link adds unconventional / unstable pressure')
  }
  if (opts.withSaturn) {
    score -= 8
    reasons.push('Saturn link adds delay and karmic weight')
  }

  score += Math.min(12, opts.beneficAspectCount * 6)
  score -= Math.min(12, opts.maleficAspectCount * 5)
  if (opts.beneficAspectCount) reasons.push(`${opts.beneficAspectCount} benefic Jaimini link(s)`)
  if (opts.maleficAspectCount) reasons.push(`${opts.maleficAspectCount} malefic Jaimini link(s)`)

  score = Math.max(0, Math.min(100, score))
  return { band: bandFromScore(score), score, reasons }
}

function scoreUlStrength(opts: {
  lordDignity: Dignity
  lordCombust: boolean
  lordDebilitated: boolean
  secondDamaged: boolean
  onNodeAxis: boolean
  beneficOnUl: number
  maleficOnUl: number
  beneficOn2nd: number
}): StrengthScore {
  let score = 52
  const reasons: string[] = []

  if (STRONG_DIGNITY.includes(opts.lordDignity)) {
    score += 14
    reasons.push('UL lord well dignified')
  } else if (opts.lordDebilitated || WEAK_DIGNITY.includes(opts.lordDignity)) {
    score -= 16
    reasons.push('UL lord weak / debilitated')
  }
  if (opts.lordCombust) {
    score -= 12
    reasons.push('UL lord combust')
  }
  if (opts.secondDamaged) {
    score -= 18
    reasons.push('2nd from UL damaged — family stability under stress')
  }
  if (opts.onNodeAxis) {
    score -= 16
    reasons.push('UL on Rahu–Ketu axis — classic marriage instability marker')
  }
  score += Math.min(12, opts.beneficOnUl * 6)
  score -= Math.min(14, opts.maleficOnUl * 6)
  if (opts.beneficOn2nd > 0 && opts.secondDamaged) {
    score += 10
    reasons.push('Benefic aspect on damaged 2nd from UL can save the marriage')
  }

  score = Math.max(0, Math.min(100, score))
  return { band: bandFromScore(score), score, reasons }
}

function scenarioFromBands(dk: StrengthBand, ul: StrengthBand): {
  scenario: DkUlScenario
  label: string
  note: string
} {
  if (dk === 'strong' && ul === 'weak') {
    return {
      scenario: 'strong_dk_weak_ul',
      label: 'Attraction strong · Stability weak',
      note: 'Love / desire can arise, but UL weakness threatens survival of the marriage.',
    }
  }
  if (dk === 'weak' && ul === 'strong') {
    return {
      scenario: 'weak_dk_strong_ul',
      label: 'Stability strong · Attraction weak',
      note: 'Marriage may survive through duty or social pressure, with limited happiness.',
    }
  }
  if (dk === 'strong' && ul === 'strong') {
    return {
      scenario: 'both_strong',
      label: 'Both DK and UL strong',
      note: 'Happy, relatively stable marriage potential when timing confirms.',
    }
  }
  if (dk === 'weak' && ul === 'weak') {
    return {
      scenario: 'both_weak',
      label: 'Both DK and UL weak',
      note: 'Problematic overall — friction, delays, or repeated relationship stress.',
    }
  }
  return {
    scenario: 'mixed',
    label: 'Mixed DK / UL strength',
    note: 'Outcome depends on dasha activation and benefic rescue aspects on UL / DK.',
  }
}

// ── Main analyzer ────────────────────────────────────────────

export function analyzeJaiminiMarriage(chart: ChartOutput): JaiminiMarriageAnalysis | null {
  const { grahas, lagnas, arudhas, vargas, vargaLagnas } = chart
  if (!grahas?.length || !lagnas?.ascRashi || !arudhas?.A12) return null

  const d9 = vargas?.D9
  const d9Asc = vargaLagnas?.D9
  if (!d9?.length || !d9Asc) return null

  const asc = lagnas.ascRashi
  const karakas = calcCharaKarakas(
    grahas.map(g => ({ id: g.id, lonSidereal: g.lonSidereal, degree: g.degree })),
    7,
  )
  const dkId = karakas.DK
  const dkGraha = grahas.find(g => g.id === dkId)
  if (!dkGraha) return null

  const ulRashi = arudhas.A12
  const ul = signPoint(asc, ulRashi)
  const seventhUl = signPoint(asc, houseSign(ulRashi, 7))
  const secondUl = signPoint(asc, houseSign(ulRashi, 2))

  // ── DK block ───────────────────────────────────────────────
  const dkSign = signPoint(asc, dkGraha.rashi)
  const dkCompanions = occupantsOf(grahas, dkGraha.rashi).filter(o => o.id !== dkId)
  const dkAspects = aspectHitsOnSign(grahas, dkGraha.rashi).filter(h => h.id !== dkId)
  const rahuOnDk = isRahuKetuLinked(
    aspectHitsOnSign(grahas, dkGraha.rashi),
    'Ra',
  ) || dkCompanions.some(c => c.id === 'Ra')
  const ketuOnDk = isRahuKetuLinked(
    aspectHitsOnSign(grahas, dkGraha.rashi),
    'Ke',
  ) || dkCompanions.some(c => c.id === 'Ke')
  const saturnWithDk = dkCompanions.some(c => c.id === 'Sa')
    || dkAspects.some(a => a.id === 'Sa' && a.relation === 'conjunct')

  const dkAspectTargets = getRashiDrishti(dkGraha.rashi)
  const influenceAreas: InfluenceArea[] = dkAspectTargets.map(r => {
    const house = wholeSignHouse(asc, r)
    return {
      house,
      theme: HOUSE_INFLUENCE[house] ?? `house ${house}`,
      note: `DK ${GRAHA_NAMES[dkId]} aspects ${RASHI_NAMES[r]} (H${house}) — spouse influence on ${HOUSE_INFLUENCE[house]}.`,
    }
  })

  const profile = DK_PLANET_PROFILES[dkId]
  const dkNotes: string[] = [
    `Darakaraka is ${GRAHA_NAMES[dkId]} at ${dkGraha.degree.toFixed(2)}° in ${dkSign.rashiName} (H${dkSign.houseFromLagna}) — primary access point to marriage.`,
    `Partner nature: ${profile.nature}.`,
    `Hidden challenge: ${profile.hiddenChallenge}.`,
    `Karmic lesson: ${profile.karmicLesson}.`,
  ]
  if (dkGraha.isRetro) {
    dkNotes.push(`${GRAHA_NAMES[dkId]} retrograde intensifies partner traits (e.g. Mercury DK → over-communication).`)
  }
  if (dkCompanions.length) {
    const names = dkCompanions.map(c => c.name).join(', ')
    dkNotes.push(`Companions with DK (${names}) colour spouse temperament and power dynamics.`)
  }
  if (getSignType(dkGraha.rashi) === 'Dual') {
    dkNotes.push('DK in a dual sign — dual nature / adaptability themes in the partner.')
  }
  if (rahuOnDk) {
    dkNotes.push('Rahu linked to DK — unconventional, foreign, or secret relationship patterns are possible.')
  }
  if (saturnWithDk) {
    dkNotes.push('Saturn with DK — delays, coldness, or heavy karmic weight in marriage.')
  }
  if (dkGraha.isCombust) {
    dkNotes.push('DK combust — partner signification is weakened or identity under pressure.')
  }

  const dkStrength = scorePlanetStrength({
    dignity: dkGraha.dignity,
    isCombust: dkGraha.isCombust,
    house: dkSign.houseFromLagna,
    withRahu: rahuOnDk,
    withSaturn: saturnWithDk,
    beneficAspectCount: dkAspects.filter(a => a.isBenefic).length,
    maleficAspectCount: dkAspects.filter(a => a.isMalefic).length,
  })

  const darakaraka: DarakarakaBlock = {
    id: dkId,
    name: GRAHA_NAMES[dkId],
    degree: dkGraha.degree,
    isRetro: dkGraha.isRetro,
    isCombust: dkGraha.isCombust,
    dignity: dkGraha.dignity,
    sign: dkSign,
    signType: getSignType(dkGraha.rashi),
    profile,
    companions: dkCompanions,
    aspects: dkAspects,
    influenceAreas,
    rahuInfluence: rahuOnDk,
    ketuInfluence: ketuOnDk,
    saturnWithDk,
    strength: dkStrength,
    notes: dkNotes,
  }

  // ── UL block ───────────────────────────────────────────────
  const ulLordId = SIGN_LORDS[ulRashi]
  const ulLordG = grahas.find(g => g.id === ulLordId)
  const ulAspects = aspectHitsOnSign(grahas, ulRashi)
  const secondOccupants = occupantsOf(grahas, secondUl.rashi)
  const secondAspects = aspectHitsOnSign(grahas, secondUl.rashi)
  const seventhOccupants = occupantsOf(grahas, seventhUl.rashi)

  const maleficsOn2nd = [...secondOccupants, ...secondAspects.filter(a => a.relation === 'aspect')]
    .filter(x => MALEFICS.includes(x.id))
  const beneficsOn2nd = secondAspects.filter(a => a.isBenefic).length
    + secondOccupants.filter(o => BENEFICS.includes(o.id)).length
  const secondDamaged = maleficsOn2nd.length >= 2
    || (maleficsOn2nd.length >= 1 && beneficsOn2nd === 0)

  const nodes = grahas.filter(g => g.id === 'Ra' || g.id === 'Ke')
  const ulOnNodeAxis = nodes.some(n => n.rashi === ulRashi)
    || ulAspects.some(a => (a.id === 'Ra' || a.id === 'Ke') && a.relation === 'conjunct')

  const ulLordDignity = ulLordG?.dignity ?? 'neutral'
  const ulLordDebil = ulLordG
    ? (ulLordG.dignity === 'debilitated' || DEBILITATION_SIGN[ulLordId] === ulLordG.rashi)
    : false

  const ulStrength = scoreUlStrength({
    lordDignity: ulLordDignity,
    lordCombust: !!ulLordG?.isCombust,
    lordDebilitated: ulLordDebil,
    secondDamaged,
    onNodeAxis: ulOnNodeAxis,
    beneficOnUl: ulAspects.filter(a => a.isBenefic).length,
    maleficOnUl: ulAspects.filter(a => a.isMalefic).length,
    beneficOn2nd: beneficsOn2nd,
  })

  const ulNotes: string[] = [
    `Upapada Lagna is ${ul.rashiName} (H${ul.houseFromLagna}) — reality check for marriage survival.`,
    `7th from UL is ${seventhUl.rashiName} — nature of the partner through the UL lens.`,
    `2nd from UL is ${secondUl.rashiName} — family stability after marriage.`,
  ]
  if (ulOnNodeAxis) {
    ulNotes.push('UL on Rahu–Ketu axis — high-priority divorce / instability indicator in Jaimini.')
  }
  if (secondDamaged) {
    ulNotes.push('2nd from UL damaged by malefics — family break risk unless benefics rescue.')
  } else if (beneficsOn2nd && maleficsOn2nd.length) {
    ulNotes.push('2nd from UL has malefic pressure but benefic aspects may preserve the marriage.')
  }
  if (ulLordDebil || ulLordG?.isCombust) {
    ulNotes.push('UL lord combust or debilitated — marriage problems more likely.')
  }

  const upapada: UpapadaBlock = {
    sign: ul,
    seventhFromUl: seventhUl,
    secondFromUl: secondUl,
    ulLord: {
      id: ulLordId,
      name: GRAHA_NAMES[ulLordId],
      rashi: ulLordG?.rashi ?? ulRashi,
      rashiName: RASHI_NAMES[ulLordG?.rashi ?? ulRashi],
      houseFromLagna: ulLordG ? wholeSignHouse(asc, ulLordG.rashi) : ul.houseFromLagna,
      dignity: ulLordDignity,
      isCombust: !!ulLordG?.isCombust,
      isDebilitated: ulLordDebil,
    },
    occupantsUl: occupantsOf(grahas, ulRashi),
    aspectsOnUl: ulAspects.filter(a => a.relation === 'aspect'),
    occupants2nd: secondOccupants,
    aspectsOn2nd: secondAspects.filter(a => a.relation === 'aspect'),
    occupants7th: seventhOccupants,
    secondFromUlDamaged: secondDamaged,
    ulOnRahuKetuAxis: ulOnNodeAxis,
    strength: ulStrength,
    notes: ulNotes,
  }

  // ── 7th house (classical + rashi value) ────────────────────
  const h7 = signPoint(asc, houseSign(asc, 7))
  const h7LordId = h7.lord
  const h7LordG = grahas.find(g => g.id === h7LordId)!
  const seventhNotes: string[] = [
    `7th house is ${h7.rashiName} — will marriage happen, and partner’s broad character.`,
    `7th lord ${GRAHA_NAMES[h7LordId]} in ${RASHI_NAMES[h7LordG.rashi]} (H${wholeSignHouse(asc, h7LordG.rashi)}) — dignity colours marital quality.`,
    'In Jaimini, add rashi value (sign type + drishti) to the classical 7th reading.',
  ]
  const seventh: SeventhHouseBlock = {
    sign: h7,
    occupants: occupantsOf(grahas, h7.rashi),
    lord: {
      id: h7LordId,
      name: GRAHA_NAMES[h7LordId],
      rashi: h7LordG.rashi,
      rashiName: RASHI_NAMES[h7LordG.rashi],
      houseFromLagna: wholeSignHouse(asc, h7LordG.rashi),
      dignity: h7LordG.dignity,
      isCombust: h7LordG.isCombust,
    },
    notes: seventhNotes,
  }

  // ── DK in D9 ───────────────────────────────────────────────
  const dkD9 = d9.find(g => g.id === dkId)
  if (!dkD9) return null
  const dkD9House = wholeSignHouse(d9Asc, dkD9.rashi)
  const seventhFromDkD9Rashi = houseSign(dkD9.rashi, 7)
  const seventhFromDk = {
    ...signPoint(d9Asc, seventhFromDkD9Rashi),
    houseFromLagna: wholeSignHouse(d9Asc, seventhFromDkD9Rashi),
  }
  const trinalBlessing = [1, 5, 9].includes(dkD9House)
  const dusthanaPlacement = [6, 8, 12].includes(dkD9House)
  const dkD9Notes: string[] = [
    `DK in Navamsha: ${RASHI_NAMES[dkD9.rashi]} (D9 H${dkD9House}) — partner’s true / inner nature.`,
    `7th from DK in D9 is ${RASHI_NAMES[seventhFromDkD9Rashi]} — destiny of the marriage.`,
  ]
  if (trinalBlessing) {
    dkD9Notes.push('DK in a trine (1/5/9) in D9 — marriage receives divine blessings despite other challenges.')
  }
  if (dusthanaPlacement) {
    dkD9Notes.push('DK in 6/8/12 in D9 — red flag for marital friction or separation themes.')
  }
  if (dkD9.dignity === 'debilitated' || DEBILITATION_SIGN[dkId] === dkD9.rashi) {
    dkD9Notes.push('DK debilitated in D9 — partner qualities not ideal; maturity required.')
  }
  const juAspectsDkD9 = d9.some(g =>
    g.id === 'Ju' && rashiAspectsOrOccupies(g.rashi, dkD9.rashi),
  )
  if (juAspectsDkD9) {
    dkD9Notes.push('Jupiter linked to DK in D9 — grace supports the union.')
  }

  const dkNavamsha: DkNavamshaBlock = {
    rashi: dkD9.rashi,
    rashiName: RASHI_NAMES[dkD9.rashi],
    houseFromD9Lagna: dkD9House,
    dignity: dkD9.dignity,
    isDebilitated: dkD9.dignity === 'debilitated' || DEBILITATION_SIGN[dkId] === dkD9.rashi,
    seventhFromDk,
    seventhOccupants: occupantsOf(d9, seventhFromDkD9Rashi),
    aspectsOnDk: aspectHitsOnSign(d9, dkD9.rashi).filter(h => h.id !== dkId),
    trinalBlessing,
    dusthanaPlacement,
    notes: dkD9Notes,
  }

  // ── Social acceptance (Sun / Moon) ─────────────────────────
  const sun = grahas.find(g => g.id === 'Su')!
  const moon = grahas.find(g => g.id === 'Mo')!
  const sunWithNodes = occupantsOf(grahas, sun.rashi).some(o => o.id === 'Ra' || o.id === 'Ke')
  const moonWithNodes = occupantsOf(grahas, moon.rashi).some(o => o.id === 'Ra' || o.id === 'Ke')
  const sunWith7L = occupantsOf(grahas, sun.rashi).some(o => o.id === h7LordId)
  const sunAfflicted =
    sun.dignity === 'debilitated'
    || sun.rashi === 8
    || sun.rashi === 10
    || sunWithNodes
  const socialNotes: string[] = [
    'Sun shows family/society acceptance; Moon shows mass / emotional family support.',
  ]
  if (sunAfflicted) {
    socialNotes.push('Sun afflicted (debility, Scorpio/Capricorn stress, or nodes) — family/society may resist the match.')
  } else {
    socialNotes.push('Sun not heavily afflicted — social/family acceptance of marriage is supported.')
  }
  if (sunWith7L) {
    socialNotes.push('Sun with 7th lord — supports marriage through family/social channels.')
  }
  if (moonWithNodes) {
    socialNotes.push('Moon with Rahu/Ketu — emotional family support can be unstable or polarized.')
  }

  let familySupport: StrengthBand = 'moderate'
  if (!sunAfflicted && !moonWithNodes) familySupport = 'strong'
  else if (sunAfflicted && moonWithNodes) familySupport = 'weak'

  const social: SocialAcceptanceBlock = {
    sun: {
      rashi: sun.rashi,
      rashiName: RASHI_NAMES[sun.rashi],
      houseFromLagna: wholeSignHouse(asc, sun.rashi),
      dignity: sun.dignity,
      withRahuKetu: sunWithNodes,
      withSeventhLord: sunWith7L,
      afflicted: sunAfflicted,
    },
    moon: {
      rashi: moon.rashi,
      rashiName: RASHI_NAMES[moon.rashi],
      houseFromLagna: wholeSignHouse(asc, moon.rashi),
      dignity: moon.dignity,
      withRahuKetu: moonWithNodes,
    },
    familySupport,
    notes: socialNotes,
  }

  // ── Love vs arranged ───────────────────────────────────────
  const h5 = houseSign(asc, 5)
  const h5Lord = SIGN_LORDS[h5]
  const h5Occ = occupantsOf(grahas, h5)
  const h5Aspects = aspectHitsOnSign(grahas, h5)
  const fifthStrong =
    h5Occ.some(o => BENEFICS.includes(o.id) || STRONG_DIGNITY.includes(o.dignity))
    || h5Aspects.some(a => a.isBenefic)
  const fifthLinksDk =
    dkGraha.rashi === h5
    || getRashiDrishti(dkGraha.rashi).includes(h5)
    || h5Occ.some(o => o.id === dkId)
    || h5Lord === dkId
  const fifthLinks7 =
    getRashiDrishti(h5).includes(h7.rashi)
    || h5Occ.some(o => o.id === h7LordId)
    || occupantsOf(grahas, h7.rashi).some(o => o.id === h5Lord)

  const juVeOn7 =
    occupantsOf(grahas, h7.rashi).some(o => o.id === 'Ju' || o.id === 'Ve')
    || aspectHitsOnSign(grahas, h7.rashi).some(a => a.id === 'Ju' || a.id === 'Ve')
  const familyHousesActive =
    [2, 9].some(h => {
      const s = houseSign(asc, h)
      return occupantsOf(grahas, s).length > 0
        || aspectHitsOnSign(grahas, s).some(a => a.isBenefic)
    })

  let loveScore = 0
  let arrangedScore = 0
  const pathNotes: string[] = []
  if (fifthStrong) { loveScore += 2; pathNotes.push('5th house strength supports romance / love choice.') }
  if (fifthLinksDk) { loveScore += 2; pathNotes.push('5th connects with DK — love marriage indicator.') }
  if (fifthLinks7) { loveScore += 1; pathNotes.push('5th links 7th — romance feeds into marriage.') }
  if (juVeOn7) { arrangedScore += 2; pathNotes.push('Jupiter/Venus influence on 7th — classical arranged / blessed match.') }
  if (upapada.strength.band !== 'weak') { arrangedScore += 1; pathNotes.push('UL relatively clear — family-structured marriage path.') }
  if (familyHousesActive) { arrangedScore += 1; pathNotes.push('2nd/9th activity — family involvement visible.') }
  if (familySupport === 'strong') { arrangedScore += 1; pathNotes.push('Sun/Moon support society-accepted match.') }

  let pathType: MarriagePathType = 'unclear'
  let pathLabel = 'Path unclear — weigh dasha and living context'
  if (loveScore >= 3 && arrangedScore >= 3) {
    pathType = 'love_cum_arranged'
    pathLabel = 'Love-cum-arranged (modern blend)'
  } else if (loveScore >= arrangedScore + 2 && loveScore >= 2) {
    pathType = 'love'
    pathLabel = 'Love marriage lean'
  } else if (arrangedScore >= loveScore + 2 && arrangedScore >= 2) {
    pathType = 'arranged'
    pathLabel = 'Arranged / family-mediated lean'
  } else if (loveScore > 0 && arrangedScore > 0) {
    pathType = 'love_cum_arranged'
    pathLabel = 'Mixed love & family factors'
  }

  const marriagePath: MarriagePathBlock = {
    type: pathType,
    label: pathLabel,
    loveScore,
    arrangedScore,
    notes: pathNotes.length ? pathNotes : ['No decisive 5th/7th/UL cluster — confirm with dasha and biography.'],
  }

  // ── DK vs UL scenario + quality ────────────────────────────
  const { scenario, label: scenarioLabel, note: scenarioNote } = scenarioFromBands(
    dkStrength.band,
    ulStrength.band,
  )
  const balance: MarriageBalance =
    scenario === 'both_strong' || (dkStrength.band === 'moderate' && ulStrength.band === 'moderate')
      ? 'balanced'
      : 'imbalanced'

  let qualityBand: StrengthBand = 'moderate'
  const qualityScore =
    (dkStrength.score + ulStrength.score) / 2
    + (trinalBlessing ? 8 : 0)
    - (dusthanaPlacement ? 8 : 0)
    - (rahuOnDk ? 6 : 0)
    - (secondDamaged ? 8 : 0)
  qualityBand = bandFromScore(Math.max(0, Math.min(100, qualityScore)))

  let qualitySummary =
    qualityBand === 'strong'
      ? 'Marriage quality potential is relatively supportive when dashas cooperate.'
      : qualityBand === 'weak'
        ? 'Marriage quality under stress — tolerance, counseling, or karmic completion themes may appear.'
        : 'Marriage quality mixed — ongoing effort with pockets of support (often social / dharmic).'

  if (trinalBlessing && qualityBand !== 'strong') {
    qualitySummary += ' D9 trinal DK placement helps the bond survive friction.'
  }

  // ── Red flags ──────────────────────────────────────────────
  const rkThrough7 = nodes.some(n => n.rashi === h7.rashi)
    || (nodes.some(n => n.rashi === houseSign(asc, 1)) && nodes.some(n => n.rashi === h7.rashi))

  const redFlags: RedFlag[] = [
    {
      id: 'rahu_dk',
      label: 'Rahu conjunct or aspecting DK',
      active: rahuOnDk,
      detail: rahuOnDk
        ? 'Rahu–DK link: secret/unconventional relationship risk (classic Jaimini divorce cluster).'
        : 'No strong Rahu–DK link.',
    },
    {
      id: 'ul_lord_weak',
      label: 'UL lord combust / debilitated',
      active: !!ulLordG?.isCombust || ulLordDebil,
      detail: (!!ulLordG?.isCombust || ulLordDebil)
        ? 'UL lord damaged — marriage problems more likely.'
        : 'UL lord not combust/debilitated.',
    },
    {
      id: 'ul_2nd_damaged',
      label: '2nd from UL fully damaged',
      active: secondDamaged,
      detail: secondDamaged
        ? 'Family stability significator damaged — break risk without benefic rescue.'
        : '2nd from UL not fully damaged.',
    },
    {
      id: 'dk_d9_dusthana',
      label: 'DK in 6, 8, or 12 in D9',
      active: dusthanaPlacement,
      detail: dusthanaPlacement
        ? 'DK in dusthana in Navamsha — marital friction / separation themes.'
        : 'DK not in D9 dusthana.',
    },
    {
      id: 'dk_ul_conflict',
      label: 'UL and DK in direct conflict (one strong, one very weak)',
      active: scenario === 'strong_dk_weak_ul' || scenario === 'weak_dk_strong_ul',
      detail: scenario === 'strong_dk_weak_ul' || scenario === 'weak_dk_strong_ul'
        ? scenarioNote
        : 'DK and UL not in extreme conflict.',
    },
    {
      id: 'rk_7th',
      label: 'Rahu–Ketu axis cutting through 7th house',
      active: rkThrough7 || ulOnNodeAxis,
      detail: (rkThrough7 || ulOnNodeAxis)
        ? 'Nodal pressure on marriage axis / UL — instability marker.'
        : 'Nodes not cutting the 7th / UL strongly.',
    },
  ]
  const activeRedFlagCount = redFlags.filter(f => f.active).length

  // ── Timing (Chara + Vimshottari UL lord) ───────────────────
  const existingChara = chart.dashas?.chara
  const charaTree = (existingChara && existingChara.length > 0)
    ? existingChara
    : (chart.meta?.birthDate
      ? ensureCharaDashas(grahas, lagnas, chart.meta, chart.dashas).chara
      : [])
  const charaPath = getDashaPathAt(charaTree)
  const activeCharaRashis = new Set(
    charaPath.map(n => rashiFromDashaLord(n.lord)).filter((r): r is Rashi => r != null),
  )
  const vimPath = getDashaPathAt(chart.dashas?.vimshottari ?? [])
  const vimLords = new Set(vimPath.map(n => n.lord))

  const timingDefs: Array<{
    id: string
    label: string
    rashi: Rashi
    system: 'chara' | 'vimshottari'
    note: string
    grahaLord?: GrahaId
  }> = [
    {
      id: 'dk_sign',
      label: 'DK sign dasha',
      rashi: dkGraha.rashi,
      system: 'chara',
      note: 'DK sign activation — marriage / relationship begins or intensifies.',
    },
    {
      id: 'ul_sign',
      label: 'UL sign dasha',
      rashi: ulRashi,
      system: 'chara',
      note: 'UL sign activation — marriage quality peak or crisis.',
    },
    {
      id: 'ul_7th',
      label: '7th from UL dasha',
      rashi: seventhUl.rashi,
      system: 'chara',
      note: '7th from UL — relationship turning point.',
    },
    {
      id: 'dk_7th',
      label: '7th from DK dasha',
      rashi: houseSign(dkGraha.rashi, 7),
      system: 'chara',
      note: '7th from DK — partnership destiny window.',
    },
    {
      id: 'ul_2nd',
      label: '2nd from UL dasha',
      rashi: secondUl.rashi,
      system: 'chara',
      note: '2nd from UL — family formation or breakdown window.',
    },
    {
      id: 'ul_lord_vim',
      label: 'UL lord Vimshottari',
      rashi: ulRashi,
      system: 'vimshottari',
      grahaLord: ulLordId,
      note: 'Confirm Jaimini windows with UL lord dasha in Vimshottari.',
    },
  ]

  const timing: TimingWindow[] = timingDefs.map(def => {
    const isActiveNow = def.system === 'chara'
      ? activeCharaRashis.has(def.rashi)
      : !!(def.grahaLord && vimLords.has(def.grahaLord))
    return {
      id: def.id,
      label: def.label,
      rashi: def.rashi,
      rashiName: RASHI_NAMES[def.rashi],
      rashiShort: RASHI_SHORT[def.rashi],
      system: def.system,
      note: def.note,
      isActiveNow,
      activePathLabel: def.system === 'chara'
        ? formatDashaPath(charaPath)
        : formatDashaPath(vimPath.map(n => ({ lord: n.lord }))),
    }
  })

  // ── Insights ───────────────────────────────────────────────
  const insights: JaiminiMarriageInsight[] = [
    {
      title: 'DK vs UL',
      text: `${scenarioLabel}. ${scenarioNote}`,
      tone: scenario === 'both_strong' ? 'supportive' : scenario === 'both_weak' ? 'challenging' : 'mixed',
    },
    {
      title: 'Marriage path',
      text: `${pathLabel}. Love markers ${loveScore}, arranged markers ${arrangedScore}.`,
      tone: 'neutral',
    },
    {
      title: 'Quality',
      text: qualitySummary,
      tone: qualityBand === 'strong' ? 'supportive' : qualityBand === 'weak' ? 'challenging' : 'mixed',
    },
  ]
  if (trinalBlessing) {
    insights.push({
      title: 'D9 blessing',
      text: 'DK in trine in Navamsha — divine support for survival of the bond.',
      tone: 'supportive',
    })
  }
  if (activeRedFlagCount >= 3) {
    insights.push({
      title: 'Red flags clustered',
      text: `${activeRedFlagCount} divorce / instability flags active. Prioritize UL and Rahu diagnostics.`,
      tone: 'challenging',
    })
  }
  if (timing.some(t => t.isActiveNow)) {
    const active = timing.filter(t => t.isActiveNow).map(t => t.label).join(', ')
    insights.push({
      title: 'Active timing',
      text: `Currently activated: ${active}. Cross-check with Vimshottari before predicting events.`,
      tone: 'mixed',
    })
  }

  const checklist = [
    'Identify Darakaraka (lowest degree planet)',
    'Note DK’s sign in D1',
    'Find UL (Upapada Lagna / A12)',
    'See 7th from UL',
    'Check 2nd from UL (family stability)',
    'Examine 7th lord (classical + Jaimini rashi value)',
    'Go to D9 — find DK’s position',
    'Find 7th from DK in D9',
    'Check Sun & Moon for social acceptance',
    'Match all timing with Vimshottari',
  ]

  const quotes = [
    'DK is your attraction. UL is your stability. Both must be assessed separately.',
    '7th house shows what is missing inside you — and your spouse brings exactly that.',
    'Jaimini and Yogini — always confirm with Vimshottari. Events must match.',
    'Divorce is not always failure — sometimes karmic contracts simply complete.',
    'If DK is in a trine (1, 5, 9) in D9, the marriage receives divine blessings regardless of other challenges.',
  ]

  const summary =
    `${GRAHA_NAMES[dkId]} DK in ${dkSign.rashiName} · UL ${ul.rashiName} · ${scenarioLabel}. `
    + `${pathLabel}. Quality: ${qualityBand}. `
    + `${activeRedFlagCount} red flag(s) active.`

  return {
    darakaraka,
    upapada,
    seventh,
    dkNavamsha,
    social,
    marriagePath,
    dkUlScenario: scenario,
    dkUlScenarioLabel: scenarioLabel,
    dkUlScenarioNote: scenarioNote,
    balance,
    qualityBand,
    qualitySummary,
    redFlags,
    activeRedFlagCount,
    timing,
    insights,
    checklist,
    quotes,
    summary,
  }
}
