// ─────────────────────────────────────────────────────────────
//  src/lib/engine/dashamsaSynthesis.ts
//  D10 Synthesis — A10, profession card, gochara windows,
//  job vs business, foreign/transfer, Vimsopaka, Muntha year,
//  employer/boss, and a copyable career brief.
//  Pure relative to chart inputs; pass transitPositions from the API.
// ─────────────────────────────────────────────────────────────

import type {
  ChartOutput,
  Dignity,
  GrahaId,
  Rashi,
} from '@/types/astrology'
import { RASHI_SHORT } from '@/types/astrology'
import { getDashaPathAt } from '@/lib/engine/dasha/current'
import { getMunthaRashi } from '@/lib/engine/tajika'
import { NAKSHATRA_HI } from '@/i18n/jyotish'
import {
  buildCareerFormula,
  getCareerIndicators,
  getMatchingCombosForChart,
} from '@/lib/engine/nakshatraProfession'
import type { CareerTone, DashamsaAnalysis } from '@/lib/engine/dashamsaAnalysis'
import {
  NP_DIRECTION_HI,
  NP_FIELD_HI,
  NP_HIDDEN_POWER_HI,
  NP_INDICATOR_LABEL_HI,
  NP_PADA_STYLE_HI,
  NP_SKILL_HI,
  NP_SUMMARY_HI,
} from '@/lib/engine/locale/nakshatraProfessionD10.hi'
import {
  dignityText,
  fill,
  gName,
  pick,
  rName,
  type EngineLang,
} from '@/lib/engine/divisionalLang'
import {
  BOSS_NATURE_HI,
  D10S_TEXT_EN,
  D10S_TEXT_HI,
  TRACK_COPY_HI,
} from '@/lib/engine/locale/dashamsaSynthesis.hi'

type D10SText = typeof D10S_TEXT_EN
import {
  aspectsSign,
  type DashamsaClassical,
} from '@/lib/engine/dashamsaClassical'

const CLASSICAL: GrahaId[] = ['Su', 'Mo', 'Ma', 'Me', 'Ju', 'Ve', 'Sa', 'Ra', 'Ke']
const HEAVY: GrahaId[] = ['Ju', 'Sa', 'Ra', 'Ke', 'Su', 'Ma']

const SIGN_LORDS: Record<Rashi, GrahaId> = {
  1: 'Ma', 2: 'Ve', 3: 'Me', 4: 'Mo', 5: 'Su', 6: 'Me',
  7: 'Ve', 8: 'Ma', 9: 'Ju', 10: 'Sa', 11: 'Sa', 12: 'Ju',
}

const BOSS_NATURE: Record<GrahaId, string> = {
  Su: 'Authority as king — father-figure, state, or a proud leader',
  Mo: 'Public-facing or changeable boss — maternal, popular, mood-led',
  Ma: 'Commander boss — direct, technical, competitive, or military',
  Me: 'Merchant or analyst boss — deals, documents, and skill',
  Ju: 'Mentor boss — counsel, law, banking, or a teacher-patron',
  Ve: 'Refined boss — arts, luxury, diplomacy, or pleasant patronage',
  Sa: 'Institutional boss — slow, strict, endurance-based hierarchy',
  Ra: 'Unconventional or foreign boss — sudden, ambitious, opaque',
  Ke: 'Specialist or detached boss — little court, deep skill',
  Ur: '', Ne: '', Pl: '',
}

const TRACK_COPY = {
  service: 'Service / employment track — status through a post, hierarchy, or the state.',
  business: 'Business / trade track — clients, partners, and own venture carry the livelihood.',
  hybrid: 'Hybrid track — both a post and a side or partnered venture are live.',
} as const

export type CareerTrack = keyof typeof TRACK_COPY

export interface TransitHit {
  id: GrahaId
  name: string
  signName: string
  house: number
  isRetro: boolean
  tone: CareerTone
  note: string
}

export interface DashaWindow {
  id: string
  title: string
  lord: GrahaId
  lordName: string
  levelLabel: string
  start: string
  end: string
  live: boolean
  careerNote: string
}

export interface ProfessionField {
  field: string
  sources: string[]
}

export interface DashamsaSynthesis {
  framing: string
  headline: string
  a10: {
    rashi: Rashi
    rashiName: string
    rashiShort: string
    houseFromLagna: number
    houseFromD10: number
    lord: GrahaId
    lordName: string
    occupants: { id: GrahaId; name: string }[]
    aspectors: { id: GrahaId; name: string }[]
    headline: string
    prediction: string
    source: string
    bphsNote: string | null
  }
  profession: {
    headline: string
    doThis: string
    livelihoodPlanet: string
    digpalaFields: string[]
    fields: ProfessionField[]
    agreement: string
    nakshatraSummary: string
    confidence: 'high' | 'medium' | 'split'
    sources: string[]
  }
  track: {
    id: CareerTrack
    headline: string
    prediction: string
    factors: string[]
    source: string
  }
  foreign: {
    active: boolean
    score: number
    headline: string
    prediction: string
    factors: string[]
    directionAdvice: string | null
  }
  boss: {
    lordId: GrahaId
    lordName: string
    house: number
    dignity: Dignity
    nature: string
    prediction: string
    source: string
  }
  vimsopaka: {
    available: boolean
    tenthLord: { id: GrahaId; name: string; d10Points: number; dashavarga: number; strength: string } | null
    lagnaLord: { id: GrahaId; name: string; d10Points: number; dashavarga: number; strength: string } | null
    headline: string
    prediction: string
  }
  annual: {
    year: number
    age: number
    munthaRashi: Rashi
    munthaName: string
    houseFromD10: number
    headline: string
    prediction: string
    source: string
    openSolarReturn: boolean
  }
  transit: {
    asOf: string
    available: boolean
    hits: TransitHit[]
    headline: string
    prediction: string
  }
  windows: DashaWindow[]
  brief: {
    title: string
    markdown: string
    plain: string
    sections: { heading: string; body: string }[]
  }
}

function houseFrom(planetRashi: Rashi, from: Rashi): number {
  return ((planetRashi - from + 12) % 12) + 1
}

function houseSign(asc: Rashi, house: number): Rashi {
  return (((asc - 1 + house - 1) % 12) + 1) as Rashi
}

function formatDay(value: Date | string | number): string {
  const d = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(d.getTime())) return String(value)
  return d.toISOString().slice(0, 10)
}

function completedAge(birthDate: string, asOf: Date): number {
  const b = new Date(birthDate.includes('T') ? birthDate : `${birthDate}T12:00:00Z`)
  if (Number.isNaN(b.getTime())) return 0
  let age = asOf.getUTCFullYear() - b.getUTCFullYear()
  const m = asOf.getUTCMonth() - b.getUTCMonth()
  if (m < 0 || (m === 0 && asOf.getUTCDate() < b.getUTCDate())) age -= 1
  return Math.max(0, age)
}

function transitTone(house: number, id: GrahaId): CareerTone {
  if ([1, 10, 11].includes(house)) return id === 'Sa' || id === 'Ra' ? 'mixed' : 'supportive'
  if ([6, 8, 12].includes(house)) return 'challenging'
  if ([2, 5, 9].includes(house)) return 'mixed'
  return 'neutral'
}

function transitHouseNote(house: number, T: D10SText): string {
  const key = `transitH${house}` as keyof D10SText
  const v = T[key]
  return typeof v === 'string' && v ? v : T.transitHDefault
}

function transitNote(id: GrahaId, house: number, retro: boolean, T: D10SText): string {
  const extra = id === 'Ju' && [1, 2, 5, 9, 10, 11].includes(house)
    ? T.transitJuExtra
    : id === 'Sa' && [10, 11].includes(house)
      ? T.transitSaExtra
      : id === 'Ra' && [10, 11].includes(house)
        ? T.transitRaExtra
        : ''
  return `${transitHouseNote(house, T)}${extra}${retro ? T.transitRetro : ''}`
}

/** Pure: map current rashis into D10 houses. */
export function mapTransitsToD10(
  positions: { id: GrahaId; rashi: Rashi; isRetro?: boolean }[],
  d10Lagna: Rashi,
  lang: EngineLang = 'en',
): TransitHit[] {
  const T = pick(D10S_TEXT_EN, D10S_TEXT_HI as typeof D10S_TEXT_EN, lang)
  return positions
    .filter((p) => CLASSICAL.includes(p.id))
    .map((p) => {
      const house = houseFrom(p.rashi, d10Lagna)
      return {
        id: p.id,
        name: gName(p.id, lang),
        signName: rName(p.rashi, lang),
        house,
        isRetro: Boolean(p.isRetro),
        tone: transitTone(house, p.id),
        note: transitNote(p.id, house, Boolean(p.isRetro), T),
      }
    })
    .filter((h) => HEAVY.includes(h.id) || [1, 6, 7, 8, 9, 10, 11, 12].includes(h.house))
    .sort((a, b) => {
      const rank = (h: number) => ([10, 11, 1, 6, 7, 9, 8, 12].indexOf(h) + 1) || 20
      return rank(a.house) - rank(b.house)
    })
}

const CONFIDENCE_HI: Record<'high' | 'medium' | 'split', string> = { high: 'ऊँची', medium: 'मध्यम', split: 'बँटी हुई' }
const TRACK_WORD_HI: Record<CareerTrack, string> = { service: 'सेवा', business: 'व्यापार', hybrid: 'मिश्रित' }
const VIMS_STRENGTH_HI: Record<string, string> = {
  very_strong: 'बहुत बलवान', strong: 'बलवान', moderate: 'मध्यम', weak: 'कमज़ोर', very_weak: 'बहुत कमज़ोर',
  excellent: 'उत्कृष्ट', good: 'अच्छा', average: 'औसत', poor: 'कमज़ोर',
}

/** Hindi twin of buildCareerFormula(chart).summary (same parts, glossary names). */
function careerFormulaHi(chart: ChartOutput): string {
  const primary = getCareerIndicators(chart)[0]!
  const pid = primary.planetId ?? 'Sa'
  return fill(NP_SUMMARY_HI, {
    planet: gName(pid, 'hi'),
    skill: NP_SKILL_HI[pid] ?? '',
    nakshatra: NAKSHATRA_HI[primary.nakshatraIndex] ?? primary.nakshatraName,
    how: NP_HIDDEN_POWER_HI[primary.nakshatraIndex] ?? primary.profile.hiddenPower,
    style: NP_PADA_STYLE_HI[primary.padaRashi] ?? '',
    pada: rName(primary.padaRashi, 'hi'),
    direction: NP_DIRECTION_HI[primary.nakshatraIndex] ?? '',
  })
}

function collectFields(classical: DashamsaClassical, chart: ChartOutput, T: D10SText, lang: EngineLang = 'en'): ProfessionField[] {
  // nakshatraProfession is shared and English; Hindi looks its strings up.
  const np = (f: string) => (lang === 'hi' ? NP_FIELD_HI[f] ?? f : f)
  const map = new Map<string, Set<string>>()
  const add = (field: string, source: string) => {
    const key = field.trim()
    if (!key) return
    let set = map.get(key)
    if (!set) {
      set = new Set()
      map.set(key, set)
    }
    set.add(source)
  }

  const winnerFields = new Set(classical.livelihood.winner.fields)
  for (const f of classical.livelihood.winner.fields) add(f, T.srcPhaladeepika)
  for (const f of classical.livelihood.candidates.slice(0, 2).flatMap((c) => c.fields.slice(0, 2))) {
    if (!winnerFields.has(f)) add(f, T.srcPhaladeepikaSupport)
  }
  for (const f of classical.mahatEmphasis.winner.fields.slice(0, 3)) add(f, T.srcD10Mahatphala)
  for (const f of classical.phala?.lagna.careers.slice(0, 6) ?? []) add(f, T.srcD10LagnaRashi)

  try {
    const indicators = getCareerIndicators(chart)
    for (const ind of indicators.slice(0, 3)) {
      for (const f of ind.profile.careerFields.slice(0, 3)) {
        add(np(f), fill(T.srcNakshatra, { label: lang === 'hi' ? NP_INDICATOR_LABEL_HI[ind.key] ?? ind.label : ind.label }))
      }
    }
    for (const combo of getMatchingCombosForChart(chart).slice(0, 4)) {
      add(np(combo.expression), T.srcPlanetNakCombo)
    }
  } catch {
    // chart stubs in unit tests may omit nakshatra fields
  }

  return [...map.entries()]
    .map(([field, sources]) => ({ field, sources: [...sources] }))
    .sort((a, b) => b.sources.length - a.sources.length || a.field.localeCompare(b.field))
}

function buildTrack(
  analysis: DashamsaAnalysis,
  classical: DashamsaClassical,
  trackCopy: Record<CareerTrack, string>,
  T: D10SText,
  lang: EngineLang,
): DashamsaSynthesis['track'] {
  const h7 = analysis.houses[6]!
  const h10 = analysis.houses[9]!
  const h2 = analysis.houses[1]!
  const h11 = analysis.houses[10]!
  const factors: string[] = []
  let service = 0
  let business = 0

  if (h10.occupants.length) {
    service += 2
    factors.push(fill(T.trackFactorD10H10Occ, { names: h10.occupants.map((o) => o.name).join(', ') }))
  }
  if (h7.occupants.length) {
    business += 2
    factors.push(fill(T.trackFactorD10H7Occ, { names: h7.occupants.map((o) => o.name).join(', ') }))
  }

  const tenth = classical.tenthLord
  if ([1, 10].includes(tenth.house)) {
    service += 2
    factors.push(fill(T.trackFactorTenthLordKendra, { house: tenth.house }))
  }
  if (tenth.house === 7) {
    business += 3
    factors.push(T.trackFactorTenthLord7)
  }
  if ([2, 11].includes(tenth.house)) {
    business += 1
    service += 1
    factors.push(fill(T.trackFactorTenthLord211, { house: tenth.house }))
  }

  const seventhLord = analysis.planets.find((p) => p.id === h7.lord)
  if (seventhLord && [1, 10, 11].includes(seventhLord.d10House)) {
    business += 2
    factors.push(
      fill(T.trackFactor7thLord, { name: seventhLord.name, house: seventhLord.d10House }),
    )
  }

  if (h2.occupants.some((o) => o.id === 'Me' || o.id === 'Ve') || h11.occupants.length >= 2) {
    business += 1
    factors.push(T.trackFactor211Emphasis)
  }

  const sunIn10 = h10.occupants.some((o) => o.id === 'Su')
  const satIn10 = h10.occupants.some((o) => o.id === 'Sa')
  if (sunIn10 || satIn10) {
    service += 2
    factors.push(
      fill(T.trackFactorSunSatH10, {
        planet: gName(sunIn10 ? 'Su' : 'Sa', lang),
      }),
    )
  }

  const id: CareerTrack =
    Math.abs(service - business) <= 1 && service > 0 && business > 0
      ? 'hybrid'
      : business > service
        ? 'business'
        : 'service'

  return {
    id,
    headline: trackCopy[id],
    prediction:
      id === 'hybrid'
        ? T.trackPredHybrid
        : id === 'business'
          ? T.trackPredBusiness
          : T.trackPredService,
    factors,
    source: T.trackSource,
  }
}

function buildForeign(
  analysis: DashamsaAnalysis,
  classical: DashamsaClassical,
  T: D10SText,
): DashamsaSynthesis['foreign'] {
  const factors: string[] = []
  let score = 0
  if (analysis.direction.foreignTheme || analysis.lagnaDigpala.id === 'varuna') {
    score += 3
    factors.push(fill(T.foreignFactorLagnaDigpala, { name: analysis.lagnaDigpala.name }))
  }
  const tenthDig = analysis.keyLords[1]?.digpala
  if (tenthDig?.id === 'varuna') {
    score += 2
    factors.push(fill(T.foreignFactorTenthDigpala, { name: tenthDig.name }))
  }
  const h9 = analysis.houses[8]!
  const h12 = analysis.houses[11]!
  if (h9.occupants.length) {
    score += 1
    factors.push(T.foreignFactorD10H9)
  }
  if (h12.occupants.length) {
    score += 2
    factors.push(T.foreignFactorD10H12)
  }
  if (classical.tenthLord.house === 12 || classical.tenthLord.house === 9) {
    score += 2
    factors.push(fill(T.foreignFactorTenthLordHouse, { house: classical.tenthLord.house }))
  }
  if (analysis.planets.some((p) => p.id === 'Ra' && [9, 10, 12].includes(p.d10House))) {
    score += 1
    factors.push(T.foreignFactorRahu)
  }

  const active = score >= 3
  return {
    active,
    score,
    headline: active
      ? T.foreignHeadlineActive
      : score > 0
        ? T.foreignHeadlineMild
        : T.foreignHeadlineDomestic,
    prediction: active
      ? T.foreignPredActive
      : score > 0
        ? T.foreignPredMild
        : T.foreignPredDomestic,
    factors,
    directionAdvice: analysis.direction.advice,
  }
}

function buildBoss(
  analysis: DashamsaAnalysis,
  bossNature: Record<GrahaId, string>,
  T: D10SText,
  lang: EngineLang,
): DashamsaSynthesis['boss'] {
  const tenth = analysis.keyLords[1]!
  const nature =
    bossNature[tenth.id] || fill(T.bossNatureFallback, { name: tenth.name })
  return {
    lordId: tenth.id,
    lordName: tenth.name,
    house: tenth.d10House,
    dignity: tenth.d10Dignity,
    nature,
    prediction: fill(T.bossPrediction, {
      name: tenth.name,
      dignity: dignityText(tenth.d10Dignity, lang),
      house: tenth.d10House,
      digpala: tenth.digpalaName,
      nature,
    }),
    source: T.bossSource,
  }
}

function buildVimsopaka(
  chart: ChartOutput,
  tenthId: GrahaId,
  lagnaLordId: GrahaId,
  T: D10SText,
  lang: EngineLang,
): DashamsaSynthesis['vimsopaka'] {
  const vim = chart.vimsopaka
  if (!vim?.planets) {
    return {
      available: false,
      tenthLord: null,
      lagnaLord: null,
      headline: T.vimsUnavailableHeadline,
      prediction: T.vimsUnavailablePred,
    }
  }
  const pack = (id: GrahaId) => {
    const p = vim.planets[id]
    if (!p) return null
    return {
      id,
      name: gName(id, lang),
      d10Points: Number(p.vargaContributions?.D10 ?? 0),
      dashavarga: p.dashavarga,
      strength: p.strength,
    }
  }
  const tenthLord = pack(tenthId)
  const lagnaLord = pack(lagnaLordId)
  const strong = (tenthLord?.d10Points ?? 0) >= 10 || (lagnaLord?.d10Points ?? 0) >= 10
  return {
    available: true,
    tenthLord,
    lagnaLord,
    headline: strong ? T.vimsStrongHeadline : T.vimsModerateHeadline,
    prediction: [
      tenthLord
        ? fill(T.vimsTenthLordLine, {
            name: tenthLord.name,
            d10Points: tenthLord.d10Points,
            dashavarga: tenthLord.dashavarga,
            strength: lang === 'hi' ? VIMS_STRENGTH_HI[tenthLord.strength] ?? tenthLord.strength.replace(/_/g, ' ') : tenthLord.strength.replace(/_/g, ' '),
          })
        : null,
      lagnaLord
        ? fill(T.vimsLagnaLordLine, {
            name: lagnaLord.name,
            d10Points: lagnaLord.d10Points,
            dashavarga: lagnaLord.dashavarga,
          })
        : null,
      T.vimsBphsNote,
    ].filter(Boolean).join(' '),
  }
}

function annualThemeForHouse(house: number, T: D10SText): string {
  const key = `annualTheme${house}` as keyof D10SText
  const v = T[key]
  return typeof v === 'string' && v ? v : T.annualThemeFallback
}

function buildAnnual(
  chart: ChartOutput,
  d10Lagna: Rashi,
  asOf: Date,
  T: D10SText,
  lang: EngineLang,
): DashamsaSynthesis['annual'] {
  const birth = chart.meta?.birthDate ?? '2000-01-01'
  const age = chart.varshaphal?.completedAge ?? completedAge(birth, asOf)
  const year = chart.varshaphal?.returnYear ?? asOf.getUTCFullYear()
  const muntha = (chart.varshaphal?.munthaRashi ?? getMunthaRashi(chart.lagnas.ascRashi, age)) as Rashi
  const houseFromD10 = houseFrom(muntha, d10Lagna)
  const munthaLabel = rName(muntha, lang)
  return {
    year,
    age,
    munthaRashi: muntha,
    munthaName: munthaLabel,
    houseFromD10,
    headline: fill(T.annualHeadline, { muntha: munthaLabel, house: houseFromD10, age }),
    prediction: `${annualThemeForHouse(houseFromD10, T)}${T.annualPredictionSuffix}`,
    source: T.annualSource,
    openSolarReturn: true,
  }
}

function dashaLevelLabel(level: number, T: D10SText): string {
  const labels = [
    '',
    T.winLevelMaha,
    T.winLevelAntar,
    T.winLevelPratyantar,
    T.winLevelSukshma,
    T.winLevelPrana,
  ]
  return labels[level] ?? fill(T.winLevelN, { level })
}

function buildWindows(
  chart: ChartOutput,
  careerLords: GrahaId[],
  T: D10SText,
  lang: EngineLang,
): DashaWindow[] {
  const nodes = chart.dashas?.vimshottari ?? []
  if (!nodes.length) return []
  const path = getDashaPathAt(nodes)
  const out: DashaWindow[] = []
  const seen = new Set<string>()

  for (const seg of path.slice(0, 4)) {
    const lord = seg.lord as GrahaId
    if (!careerLords.includes(lord) && !CLASSICAL.includes(lord)) continue
    const key = `${seg.level}-${lord}-live`
    if (seen.has(key)) continue
    seen.add(key)
    const level = dashaLevelLabel(seg.level, T) || T.winLevelDasha
    const lordLabel = gName(lord, lang)
    out.push({
      id: key,
      title: fill(T.winTitleLive, { level, lord: lordLabel }),
      lord,
      lordName: lordLabel,
      levelLabel: level,
      start: formatDay(seg.start),
      end: formatDay(seg.end),
      live: true,
      careerNote: careerLords.includes(lord)
        ? T.winCareerLive
        : fill(T.winCareerActive, { end: formatDay(seg.end) }),
    })
  }

  // Next mahadashas that are career lords
  const now = Date.now()
  for (const maha of nodes) {
    const lord = maha.lord as GrahaId
    if (!careerLords.includes(lord)) continue
    const start = new Date(maha.start).getTime()
    if (start <= now) continue
    const key = `maha-next-${lord}`
    if (seen.has(key)) continue
    seen.add(key)
    const lordLabel = gName(lord, lang)
    out.push({
      id: key,
      title: fill(T.winTitleNext, { lord: lordLabel }),
      lord,
      lordName: lordLabel,
      levelLabel: T.winLevelMaha,
      start: formatDay(maha.start),
      end: formatDay(maha.end),
      live: false,
      careerNote: T.winCareerUpcoming,
    })
    if (out.filter((w) => !w.live).length >= 3) break
  }

  return out.slice(0, 7)
}

function buildBrief(
  parts: {
    name: string
    headline: string
    a10: DashamsaSynthesis['a10']
    profession: DashamsaSynthesis['profession']
    track: DashamsaSynthesis['track']
    foreign: DashamsaSynthesis['foreign']
    boss: DashamsaSynthesis['boss']
    annual: DashamsaSynthesis['annual']
    classical: DashamsaClassical
    transit: DashamsaSynthesis['transit']
    windows: DashaWindow[]
  },
  T: D10SText,
  lang: EngineLang = 'en',
): DashamsaSynthesis['brief'] {
  const sections = [
    {
      heading: T.briefSecSummary,
      body: parts.headline,
    },
    {
      heading: T.briefSecProfession,
      body: fill(T.briefProfessionBody, {
        doThis: parts.profession.doThis,
        agreement: parts.profession.agreement,
        confidence: lang === 'hi' ? CONFIDENCE_HI[parts.profession.confidence] : parts.profession.confidence,
      }),
    },
    {
      heading: T.briefSecA10,
      body: parts.a10.prediction,
    },
    {
      heading: T.briefSecMahatphala,
      body: fill(T.briefMahatBody, {
        headline: parts.classical.mahatphala.headline,
        score: parts.classical.mahatphala.score,
        tenthPred: parts.classical.tenthLord.prediction,
      }),
    },
    {
      heading: T.briefSecD10Phala,
      body: [
        fill(T.briefPhalaBodyLagna, {
          rashiName: parts.classical.phala.lagna.rashiName,
          keyword: parts.classical.phala.lagna.keyword,
          careers: parts.classical.phala.lagna.careers.slice(0, 4).join('; ') || T.briefSeeClassical,
        }),
        ...parts.classical.phala.priorityPlanets.slice(0, 3).map((p) => p.careerLens),
      ].join('\n'),
    },
    {
      heading: T.briefSecJobBiz,
      body: `${parts.track.headline}\n${parts.track.prediction}`,
    },
    {
      heading: T.briefSecForeign,
      body: `${parts.foreign.headline}\n${parts.foreign.prediction}`,
    },
    {
      heading: T.briefSecBoss,
      body: parts.boss.prediction,
    },
    {
      heading: T.briefSecAnnual,
      body: `${parts.annual.headline}\n${parts.annual.prediction}`,
    },
    {
      heading: T.briefSecTransit,
      body: parts.transit.available
        ? `${parts.transit.headline}\n${parts.transit.hits
            .slice(0, 5)
            .map((h) =>
              fill(T.briefTransitHitLine, {
                name: h.name,
                house: h.house,
                signName: h.signName,
                note: h.note,
              }),
            )
            .join('\n')}`
        : T.briefTransitUnavailable,
    },
    {
      heading: T.briefSecTiming,
      body:
        parts.windows
          .map((w) =>
            fill(T.briefWindowLine, {
              title: w.title,
              start: w.start,
              end: w.end,
              live: w.live ? T.briefLiveTag : '',
              note: w.careerNote,
            }),
          )
          .join('\n') || T.briefNoWindows,
    },
  ]

  const title = fill(T.briefTitle, { name: parts.name })
  const markdown = [
    `# ${title}`,
    '',
    ...sections.flatMap((s) => [`## ${s.heading}`, s.body, '']),
    T.briefMdFooter,
  ].join('\n')

  const plain = sections.map((s) => `${s.heading}\n${s.body}`).join('\n\n')

  return {
    title,
    markdown,
    plain,
    sections,
  }
}

/**
 * Full D10 synthesis. Pass `transitPositions` in tests to avoid ephemeris I/O.
 */
export function buildDashamsaSynthesis(
  analysis: DashamsaAnalysis,
  classical: DashamsaClassical,
  chart: ChartOutput,
  opts?: {
    asOf?: Date
    transitPositions?: { id: GrahaId; rashi: Rashi; isRetro?: boolean }[]
  },
  lang: EngineLang = 'en',
): DashamsaSynthesis | null {
  const T = pick(D10S_TEXT_EN, D10S_TEXT_HI as typeof D10S_TEXT_EN, lang)
  const TRACK = pick(TRACK_COPY, TRACK_COPY_HI, lang)
  const BOSS = pick(BOSS_NATURE, BOSS_NATURE_HI, lang)
  const d1Asc = chart.lagnas?.ascRashi
  if (!d1Asc) return null
  const asOf = opts?.asOf ?? new Date()
  const arudhas = chart.arudhasBphs ?? chart.arudhas
  if (!arudhas?.A10) return null

  const a10Rashi = arudhas.A10 as Rashi
  const a10Lord = SIGN_LORDS[a10Rashi]
  const occupants = analysis.planets
    .filter((p) => p.d1Rashi === a10Rashi)
    .map((p) => ({ id: p.id, name: p.name }))
  const aspectors = analysis.planets
    .filter((p) => aspectsSign(p.d1Rashi, p.id, a10Rashi))
    .map((p) => ({ id: p.id, name: p.name }))

  const a10RashiName = rName(a10Rashi, lang)
  const a10LordName = gName(a10Lord, lang)
  const a10HouseFromLagna = houseFrom(a10Rashi, d1Asc)
  const a10HouseFromD10 = houseFrom(a10Rashi, analysis.d10Lagna)
  const a10 = {
    rashi: a10Rashi,
    rashiName: a10RashiName,
    rashiShort: RASHI_SHORT[a10Rashi],
    houseFromLagna: a10HouseFromLagna,
    houseFromD10: a10HouseFromD10,
    lord: a10Lord,
    lordName: a10LordName,
    occupants,
    aspectors,
    headline: fill(T.a10Headline, { rashi: a10RashiName, house: a10HouseFromLagna }),
    prediction: [
      fill(T.a10PredRajya, { rashi: a10RashiName, lord: a10LordName }),
      T.a10PredFraming,
      occupants.length
        ? fill(T.a10PredOccupants, { names: occupants.map((o) => o.name).join(', ') })
        : T.a10PredNoOccupants,
      aspectors.length
        ? fill(T.a10PredAspectors, { names: aspectors.map((a) => a.name).join(', ') })
        : null,
      fill(T.a10PredHouse, { house: a10HouseFromD10 }),
    ].filter(Boolean).join(' '),
    source: T.a10Source,
    bphsNote:
      chart.arudhasBphs && chart.arudhas && chart.arudhasBphs.A10 !== chart.arudhas.A10
        ? fill(T.a10BphsNote, {
            bphs: rName(chart.arudhasBphs.A10 as Rashi, lang),
            raw: rName(chart.arudhas.A10 as Rashi, lang),
          })
        : null,
  }

  const digpalaFields = [
    ...analysis.lagnaDigpala.professions.slice(0, 3),
    ...(analysis.keyLords[1]?.digpala.professions.slice(0, 2) ?? []),
  ]
  const fields = collectFields(classical, chart, T, lang)
  for (const f of new Set(digpalaFields)) {
    const hit = fields.find((x) => x.field === f)
    if (hit) {
      if (!hit.sources.includes(T.srcDigpala)) hit.sources.push(T.srcDigpala)
    } else {
      fields.push({ field: f, sources: [T.srcDigpala] })
    }
  }
  fields.sort((a, b) => b.sources.length - a.sources.length)

  let nakshatraSummary = ''
  try {
    nakshatraSummary = lang === 'hi' ? careerFormulaHi(chart) : buildCareerFormula(chart).summary
  } catch {
    nakshatraSummary = T.profNakshatraUnavailable
  }

  const agrees = classical.mahatEmphasis.agrees
  const overlap = fields.filter((f) => f.sources.length >= 2)
  const confidence: 'high' | 'medium' | 'split' =
    agrees && overlap.length >= 2 ? 'high' : agrees || overlap.length >= 1 ? 'medium' : 'split'

  const fieldSlice = classical.livelihood.winner.fields.slice(0, 3).join('; ')
  const profession = {
    headline: agrees
      ? fill(T.profHeadlineAgree, { name: classical.livelihood.winner.name })
      : fill(T.profHeadlineSplit, {
          livelihood: classical.livelihood.winner.name,
          mahat: classical.mahatEmphasis.winner.name,
        }),
    doThis: overlap.length
      ? fill(T.profDoThisOverlap, {
          fields: overlap.slice(0, 4).map((f) => f.field).join('; '),
        })
      : fieldSlice
        ? fill(T.profDoThisFields, { fields: fieldSlice })
        : fill(T.profDoThisSignifications, { name: classical.livelihood.winner.name }),
    livelihoodPlanet: classical.livelihood.winner.name,
    digpalaFields: [...new Set(digpalaFields)].slice(0, 6),
    fields: fields.slice(0, 12),
    agreement: classical.mahatEmphasis.agreement,
    nakshatraSummary,
    confidence,
    sources: [
      T.profSourceLivelihood,
      T.profSourceDigpala,
      T.profSourceNakshatra,
      T.profSourceMahat,
      T.profSourceLagnaCareers,
    ],
  }

  const track = buildTrack(analysis, classical, TRACK, T, lang)
  const foreign = buildForeign(analysis, classical, T)
  const boss = buildBoss(analysis, BOSS, T, lang)
  const lagnaLordId = SIGN_LORDS[analysis.d10Lagna]
  const tenthId = classical.tenthLord.id
  const vimsopaka = buildVimsopaka(chart, tenthId, lagnaLordId, T, lang)
  const annual = buildAnnual(chart, analysis.d10Lagna, asOf, T, lang)

  let transitHits: TransitHit[] = []
  let transitAvailable = false
  if (opts?.transitPositions?.length) {
    transitHits = mapTransitsToD10(opts.transitPositions, analysis.d10Lagna, lang)
    transitAvailable = transitHits.length > 0
  }

  const hot = transitHits.filter((h) => [10, 11, 1, 6, 7].includes(h.house))
  const transit = {
    asOf: formatDay(asOf),
    available: transitAvailable,
    hits: transitHits,
    headline: transitAvailable
      ? hot.length
        ? fill(T.transitHeadHot, { names: hot.map((h) => h.name).join(', ') })
        : T.transitHeadBg
      : T.transitHeadUnavailable,
    prediction: transitAvailable
      ? hot.length
        ? fill(T.transitPredHot, {
            detail: hot
              .map((h) => fill(T.transitPredDetail, { name: h.name, house: h.house }))
              .join('; '),
          })
        : T.transitPredNoHeavy
      : T.transitPredLoad,
  }

  const careerLords = [
    classical.livelihood.winner.id,
    classical.mahatEmphasis.winner.id,
    tenthId,
    ...(classical.amatyakaraka ? [classical.amatyakaraka.id] : []),
    a10Lord,
  ]
  const windows = buildWindows(chart, [...new Set(careerLords)], T, lang)

  const headline = [
    profession.headline,
    fill(T.headlineMahatphala, {
      grade: classical.mahatphala.gradeLabel,
      score: classical.mahatphala.score,
    }),
    lang === 'hi' ? TRACK_WORD_HI[track.id] : track.id,
    foreign.active ? T.headlineForeignLean : null,
  ].filter(Boolean).join(' · ')

  const brief = buildBrief(
    {
      name: chart.meta?.name || T.chartNameFallback,
      headline,
      a10,
      profession,
      track,
      foreign,
      boss,
      annual,
      classical,
      transit,
      windows,
    },
    T,
    lang,
  )

  return {
    framing: T.framing,
    headline,
    a10,
    profession,
    track,
    foreign,
    boss,
    vimsopaka,
    annual,
    transit,
    windows,
    brief,
  }
}
