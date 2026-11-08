// ─────────────────────────────────────────────────────────────
//  src/lib/engine/dashamsaPractical.ts
//  Practical D10 — karma verticals, recognition, sign sectors
//  Classroom / survival-series techniques (modern counseling)
// ─────────────────────────────────────────────────────────────

import type { ChartOutput, Dignity, GrahaData, GrahaId, Rashi } from '@/types/astrology'
import { RASHI_SHORT } from '@/types/astrology'
import type {
  CareerTone,
  DashamsaAnalysis,
  DashamsaPlanetRow,
} from '@/lib/engine/dashamsaAnalysis'
import { getDashaPathAt } from '@/lib/engine/dasha/current'
import { analyzeDashamsa } from '@/lib/engine/dashamsaAnalysis'
import { dignityText, fill, gName, pick, rName, type EngineLang } from '@/lib/engine/divisionalLang'
import {
  D10_SIGN_SECTORS_HI,
  D10P_TEXT_EN,
  D10P_TEXT_HI,
} from '@/lib/engine/locale/dashamsaPractical.hi'

type D10PText = typeof D10P_TEXT_EN

function d10pText(lang: EngineLang): D10PText {
  return pick(D10P_TEXT_EN, D10P_TEXT_HI as unknown as D10PText, lang)
}

const CHARITY_KEY: Partial<Record<GrahaId, keyof D10PText>> = {
  Su: 'charitySu',
  Mo: 'charityMo',
  Ma: 'charityMa',
  Me: 'charityMe',
  Ju: 'charityJu',
  Ve: 'charityVe',
  Sa: 'charitySa',
  Ra: 'charityRa',
  Ke: 'charityKe',
  Ur: 'charityUr',
  Ne: 'charityNe',
  Pl: 'charityPl',
}

function charityFor(id: GrahaId, _lang: EngineLang, T: D10PText): string {
  const key = CHARITY_KEY[id]
  return (key ? T[key] : undefined) ?? T.charityDefault
}

function lagnaRechargeText(rashi: Rashi, T: D10PText): string {
  const byRashi: Record<Rashi, keyof D10PText> = {
    1: 'lagnaRecharge1',
    2: 'lagnaRecharge2',
    3: 'lagnaRecharge3',
    4: 'lagnaRecharge4',
    5: 'lagnaRecharge5',
    6: 'lagnaRecharge6',
    7: 'lagnaRecharge7',
    8: 'lagnaRecharge8',
    9: 'lagnaRecharge9',
    10: 'lagnaRecharge10',
    11: 'lagnaRecharge11',
    12: 'lagnaRecharge12',
  }
  return T[byRashi[rashi]]
}

function elementLabelText(el: 'fire' | 'earth' | 'air' | 'water', T: D10PText): string {
  const map = {
    fire: T.elementLabelFire,
    earth: T.elementLabelEarth,
    air: T.elementLabelAir,
    water: T.elementLabelWater,
  } as const
  return map[el]
}

function inheritedMeta(T: D10PText): {
  id: GrahaId
  source: string
  detail: string
  toolHow: string
}[] {
  return [
    { id: 'Ma', source: T.inheritedMaSource, detail: T.inheritedMaDetail, toolHow: T.inheritedMaToolHow },
    { id: 'Ve', source: T.inheritedVeSource, detail: T.inheritedVeDetail, toolHow: T.inheritedVeToolHow },
    { id: 'Sa', source: T.inheritedSaSource, detail: T.inheritedSaDetail, toolHow: T.inheritedSaToolHow },
    { id: 'Mo', source: T.inheritedMoSource, detail: T.inheritedMoDetail, toolHow: T.inheritedMoToolHow },
    { id: 'Su', source: T.inheritedSuSource, detail: T.inheritedSuDetail, toolHow: T.inheritedSuToolHow },
    { id: 'Me', source: T.inheritedMeSource, detail: T.inheritedMeDetail, toolHow: T.inheritedMeToolHow },
    { id: 'Ra', source: T.inheritedRaSource, detail: T.inheritedRaDetail, toolHow: T.inheritedRaToolHow },
    { id: 'Ke', source: T.inheritedKeSource, detail: T.inheritedKeDetail, toolHow: T.inheritedKeToolHow },
    { id: 'Ju', source: T.inheritedJuSource, detail: T.inheritedJuDetail, toolHow: T.inheritedJuToolHow },
  ]
}

const VERTICAL_THEME: Partial<Record<number, keyof D10PText>> = {
  1: 'verticalTheme1',
  4: 'verticalTheme4',
  5: 'verticalTheme5',
  6: 'verticalTheme6',
  8: 'verticalTheme8',
  10: 'verticalTheme10',
  11: 'verticalTheme11',
}

const STRONG: Dignity[] = ['exalted', 'moolatrikona', 'own']
const WEAK: Dignity[] = ['debilitated', 'great_enemy', 'enemy']

function houseFrom(asc: Rashi, planetRashi: Rashi): number {
  return ((planetRashi - asc + 12) % 12) + 1
}

// ── Sign sector lore (D10 industry flavor) ───────────────────

export interface D10SignSector {
  rashi: Rashi
  name: string
  short: string
  headline: string
  flavor: string
  industries: string[]
  caution: string | null
}

export const D10_SIGN_SECTORS: Record<Rashi, Omit<D10SignSector, 'rashi' | 'name' | 'short'>> = {
  1: {
    headline: 'All-or-nothing start. Begin small and build up',
    flavor: 'Extremely competitive; start small, climb hard; impulsive launch energy; warriors vs those who choke.',
    industries: ['Mechanics / bare parts', 'Sales from scratch', 'Founders / own firm', 'Engineering grind without status'],
    caution: 'New ventures can struggle in the first 3–4 months because of cash burn, poor strategy, or no resources — luxury offices are not this path.',
  },
  2: {
    headline: 'Resources & capital wars — gold mine for finance',
    flavor: 'Investors and fund managers; dominate markets through capital, not mere survival fights.',
    industries: ['Investment banking / RBI / banks', 'CEO / COO / CTO / fund managers', 'Heavy factories / marble / tenders', 'Builders & capital-heavy agencies'],
    caution: 'Stubborn resource battles (cashback / poaching / EdTech wars) — need real capital to compete.',
  },
  3: {
    headline: 'Deal makers — analytics & paperwork',
    flavor: 'Pure analytics, automation, meetings, budgets, media/PR/compliance — software side of IT.',
    industries: ['CS / accountants / compliance', 'Data science / ML / coding', 'IT support & security', 'Media / PR / HR paperwork'],
    caution: 'Do not confuse with Virgo: Gemini automates; Virgo drives efficiency and delivery experience.',
  },
  4: {
    headline: 'Public / healing — lethal if rising alone',
    flavor: 'Masses, mood, CSR, medical care; cannot thrive on rigid corporate politics alone.',
    industries: ['Nurses / doctors / therapists', 'CSR / charity / schools for poor', 'Complaint / refund / public care', 'Healing & patient work'],
    caution: 'Cancer rising with Moon in D10 lagna often = stuck in toxic office mood; needs public-centric roles.',
  },
  5: {
    headline: 'Marketing & long power — dominate the stage',
    flavor: 'Selected players, entertainment, government/PSU; managers who hold power for long stretches.',
    industries: ['Entertainment / OTT / brands', 'Government / PSU (esp. Saturn in Leo)', 'Long-tenure company runners', 'Market-dominating managers'],
    caution: 'Often misread — Leo is selection + stable power, not “anyone can join” (that is Aquarius).',
  },
  6: {
    headline: 'SOPs, improvement & health data',
    flavor: 'Rules, IAS/IPS SOP makers, cleaning/improvement markets, healthcare analytics.',
    industries: ['IAS / IPS / rule-makers', 'Healthcare / diagnostics / ML on health', 'Urban Company–style services', 'Skincare / medicine (Venus/Moon in Virgo)'],
    caution: 'Doctors often stack Virgo with 6/8/12 — efficiency and service under pressure.',
  },
  7: {
    headline: 'Excellence — start on the 27th floor',
    flavor: 'Business-class careers; needs polish, pantry, gym, big-brand aura — not small clients.',
    industries: ['Top-tier corporates / RBI–SBI style desks', 'Luxury / brand environments', 'High-floor executive work (Rahu)', 'Design-class roles'],
    caution: 'Messes up with common-public grind; Ketu without support can keep work on the ground floor.',
  },
  8: {
    headline: 'Transformation clients — aging & crisis pay',
    flavor: 'Client bases in crisis: prolonged illness, anti-aging, recovery, psychiatry depth.',
    industries: ['Anti-aging / recovery', 'Prolonged illness care', 'Psychiatrists (Moon–Saturn)', 'ORS / dehydration / slow healing'],
    caution: 'Heavy Scorpio = secretive or crisis-paid work; ethics of 8th must be watched.',
  },
  9: {
    headline: 'Third-party consultancy — low error margin',
    flavor: 'Working for Wipro/Apple-style clients as vendor; bench risk, project cancel culture.',
    industries: ['Third-party consultancy', 'Client-base delivery', 'Vendor / outsourcing projects'],
    caution: 'Project cancel / bench / removal cycles are common — margin of error is very low.',
  },
  10: {
    headline: 'Rise hard — name, barriers, one-product empires',
    flavor: 'Heavy struggle hours; generational wealth potential; single-product global barriers (steel, oil, defense).',
    industries: ['Transport (Mars)', 'Steel / cement / bricks', 'Crude / heavy infra / defense lines', 'Core auto / railways-scale capital'],
    caution: 'Thankless Capricorn stacks = used then discarded; recognition needs separate Sun–Jupiter–Moon–Lagna check.',
  },
  11: {
    headline: 'Rule-breakers & side hustles',
    flavor: 'Overnight swings, MLM layering, network marketing, never-normal channels.',
    industries: ['Side hustles / MLM layers', 'Stock / overnight speculation flavor', 'Marketing connectors', 'Norm-breaking startups'],
    caution: 'Not main-channel legitimacy — Sun vs Rahu: Sun gives, Rahu takes opportunity.',
  },
  12: {
    headline: 'Side / night / aviation / freelance',
    flavor: 'Spiritual, night shift, freelancers, non-core work; Mars here flags aviation.',
    industries: ['Pilots / cabin / airport', 'Freelancers / night shifts', 'Spiritual livelihood', 'Non-core side work'],
    caution: 'Routine 9–5 bondage clashes; 12th = independence opposite 6th bondage.',
  },
}

// ── Types ────────────────────────────────────────────────────

export interface KarmaVerticalSlice {
  id: 'body' | 'mind' | 'soul'
  label: string
  labelSa: string
  ascRashi: Rashi
  ascName: string
  meaning: string
  houseNotes: { house: number; theme: string; occupants: string; note: string }[]
  summary: string
}

export interface DesireFearAxis {
  desire: { house: 11; occupants: string[]; lordNote: string; text: string }
  fear: { house: 8; occupants: string[]; lordNote: string; text: string }
  prarabdha: { house: 6; occupants: string[]; lordNote: string; text: string }
}

export interface RecognitionReading {
  tone: CareerTone
  score: number
  headline: string
  text: string
  factors: { id: string; label: string; ok: boolean; detail: string }[]
  thanklessNotes: string[]
}

export interface SecondHouseKarma {
  occupants: string[]
  lordNote: string
  speechBased: boolean
  lineageLink: boolean
  text: string
  tips: string[]
}

export interface KarmicBondNote {
  d10LagnaSign: Rashi
  d10LagnaName: string
  lagnaLordName: string
  lagnaLordHouse: number
  occupants: string[]
  text: string
  mutualTip: string
}

export interface MoonLagnaMind {
  moonAsc: Rashi
  moonAscName: string
  sukhHouse: number
  sukhOccupants: string[]
  sukhNote: string
  twelfthOccupants: string[]
  twelfthNote: string
  fireInitiative: boolean
  fireNote: string
}

export interface DashamsaKarmaPractical {
  whyToday: string
  bonds: KarmicBondNote
  secondHouse: SecondHouseKarma
  moonMind: MoonLagnaMind
  verticals: KarmaVerticalSlice[]
  desireFear: DesireFearAxis
  recognition: RecognitionReading
  takeaways: string[]
}

export interface SectorHit {
  rashi: Rashi
  name: string
  role: string
  sector: D10SignSector
  planetNames: string[]
}

export interface CareerComboHit {
  id: string
  title: string
  matched: boolean
  detail: string
}

export interface DashamsaSectorsPractical {
  method: string
  lagnaSector: D10SignSector
  hits: SectorHit[]
  combos: CareerComboHit[]
  houseFlavorNotes: string[]
  energyNotes: string[]
}

export interface PendingKarmaItem {
  planetId: GrahaId
  planetName: string
  house: 2 | 6 | 10
  rashiName: string
  pendingTheme: string
  charity: string
}

export interface ClinicalFlag {
  id: string
  title: string
  matched: boolean
  severity: CareerTone
  detail: string
}

export interface RemedyCard {
  id: string
  title: string
  when: string
  action: string
}

export interface DashamsaPendingPractical {
  axisRule: string
  items: PendingKarmaItem[]
  capricornHardWork: { active: boolean; headline: string; text: string; notes: string[] }
  flags: ClinicalFlag[]
  remedies: RemedyCard[]
  methodSteps: string[]
}

/** Inherited / source karma each planet carries into embodiment. */
export interface InheritedKarmaPlanet {
  id: GrahaId
  name: string
  source: string
  detail: string
  d10House: number | null
  d10RashiName: string | null
  strengthHint: 'strong' | 'mixed' | 'soft' | 'absent'
  toolNote: string
}

export interface LayeredReading {
  id: string
  title: string
  priority: string
  house: { label: string; text: string }
  rashi: { label: string; text: string }
  planet: { label: string; text: string }
  synthesis: string
}

export interface DashamsaBondagePractical {
  framing: string
  goldenOrder: string[]
  inherited: InheritedKarmaPlanet[]
  layered: LayeredReading[]
  navigationTools: { planet: string; how: string; active: boolean }[]
  principles: string[]
  homework: string
}

export type TriadId = 'fire' | 'earth' | 'air' | 'water'

export interface TriadRemedy {
  id: TriadId
  houses: string
  element: string
  signs: string
  remedy: string
  active: boolean
  reason: string
}

export interface DashaHouseEvent {
  levelLabel: string
  lordName: string
  d10House: number | null
  event: string
  tone: CareerTone
  pathHint: string | null
}

export interface CorruptionNote {
  id: GrahaId
  name: string
  d1Dignity: string
  d9Dignity: string
  d10House: number | null
  d10Note: string
}

export type LagnaSyncStatus = 'synced' | 'element-bridge' | 'soft-link' | 'offset' | 'strain'

export interface LagnaSyncReading {
  /** Exact D1 = D10 lagna match */
  synced: boolean
  status: LagnaSyncStatus
  statusLabel: string
  d1Lagna: Rashi
  d10Lagna: Rashi
  d1LagnaName: string
  d10LagnaName: string
  headline: string
  /** One-paragraph verdict */
  text: string
  d1Role: string
  d10Role: string
  bridge: string
  recharge: string[]
  counsel: string
}

export interface DashamsaKarmaYogaPractical {
  framing: string
  sync: LagnaSyncReading
  dashaEvents: DashaHouseEvent[]
  crisisMode: {
    active: boolean
    headline: string
    jnanaPath: string
    bhaktiPath: string
    acceptanceRule: string
  }
  triads: TriadRemedy[]
  corruption: CorruptionNote[]
  oilField: string
  multiChart: string[]
  ethics: string[]
}

export type CircuitVargaCode = 'D3' | 'D7' | 'D9' | 'D10' | 'D2'

export interface CircuitNote {
  id: string
  title: string
  text: string
  tone: CareerTone
}

export interface CircuitLayer {
  code: CircuitVargaCode
  title: string
  represents: string
  available: boolean
  lagnaName: string | null
  lagnaOccupants: string[]
  dashaNotes: CircuitNote[]
  staticNotes: CircuitNote[]
}

export interface JobLossFlavor {
  id: GrahaId
  name: string
  nature: string
  active: boolean
}

export interface DashamsaCircuitPractical {
  framing: string
  sequence: string[]
  layers: CircuitLayer[]
  syncVerdict: { synced: boolean; theme: string; detail: string }
  relationshipFlags: CircuitNote[]
  jobDisruption: {
    active: boolean
    headline: string
    flavors: JobLossFlavor[]
    caveat: string
  }
  mindFears: CircuitNote[]
  practiceAdvice: string[]
}

export interface SignDistinction {
  id: string
  left: string
  right: string
  rule: string
  relevant: boolean
}

export interface PartnershipRule {
  id: string
  pair: string
  effect: string
  tone: CareerTone
}

export interface SurvivalFlag {
  id: string
  title: string
  matched: boolean
  detail: string
  tone: CareerTone
}

export interface DashamsaSurvivalPractical {
  framing: string
  threeLayer: string
  d10VsD9: string
  distinctions: SignDistinction[]
  extraCombos: CareerComboHit[]
  energyDrain: {
    risk: CareerTone
    headline: string
    bulletRule: string
    recoveryNote: string
    flags: SurvivalFlag[]
  }
  helpability: {
    good: string[]
    bad: string[]
    text: string
  }
  partnership: {
    method: string
    rules: PartnershipRule[]
    hardHeaded: boolean
    hardHeadedNote: string
  }
  sunHouseGuide: { house: number; role: string }[]
  takeaways: string[]
}

export interface DashamsaPractical {
  karma: DashamsaKarmaPractical
  sectors: DashamsaSectorsPractical
  pending: DashamsaPendingPractical
  bondage: DashamsaBondagePractical
  karmaYoga: DashamsaKarmaYogaPractical
  circuit: DashamsaCircuitPractical
  survival: DashamsaSurvivalPractical
}

function occupantsInHouse(planets: DashamsaPlanetRow[], house: number): DashamsaPlanetRow[] {
  return planets.filter((p) => p.d10House === house)
}

function lordOfHouse(analysis: DashamsaAnalysis, house: number): DashamsaPlanetRow | undefined {
  const h = analysis.houses[house - 1]
  if (!h) return undefined
  return analysis.planets.find((p) => p.id === h.lord)
}

function buildVertical(
  id: KarmaVerticalSlice['id'],
  asc: Rashi,
  planets: DashamsaPlanetRow[],
  lang: EngineLang = 'en',
): KarmaVerticalSlice {
  const T = d10pText(lang)
  const labelKey = { body: 'verticalLabelBody', mind: 'verticalLabelMind', soul: 'verticalLabelSoul' } as const
  const meaningKey = { body: 'verticalMeaningBody', mind: 'verticalMeaningMind', soul: 'verticalMeaningSoul' } as const
  const label = T[labelKey[id]]
  const labelSa = id === 'body' ? 'शरीर' : id === 'mind' ? 'मन' : 'आत्मन्'
  const meaning = T[meaningKey[id]]
  const focusHouses = [1, 4, 5, 6, 8, 10]
  const houseNotes = focusHouses.map((house) => {
    const occ = planets.filter((p) => houseFrom(asc, p.d10Rashi) === house)
    const names = occ.map((p) => p.name).join(', ') || '—'
    const themeKey = VERTICAL_THEME[house]
    const theme = themeKey ? T[themeKey] : fill(T.verticalHouseFallback, { house: String(house) })
    let note = theme
    if (house === 8 && id === 'soul') note = T.verticalNote8Soul
    if (house === 8 && id === 'mind') note = T.verticalNote8Mind
    if (house === 6 && id === 'mind') note = T.verticalNote6Mind
    return { house, theme, occupants: names, note }
  })
  const h1 = houseNotes[0]!
  const ascName = rName(asc, lang)
  const summary = fill(T.verticalSummary, { label, ascName, h1Occupants: h1.occupants })
  return { id, label, labelSa, ascRashi: asc, ascName, meaning, houseNotes, summary }
}

function buildRecognition(analysis: DashamsaAnalysis, lang: EngineLang = 'en'): RecognitionReading {
  const T = d10pText(lang)
  const sun = analysis.planets.find((p) => p.id === 'Su')
  const ju = analysis.planets.find((p) => p.id === 'Ju')
  const mo = analysis.planets.find((p) => p.id === 'Mo')
  const lagnaLord = analysis.keyLords[0]

  const factors = [
    {
      id: 'sun',
      label: T.recognitionFactorSunLabel,
      ok: Boolean(sun && (STRONG.includes(sun.d10Dignity) || [1, 5, 9, 10].includes(sun.d10House))),
      detail: sun
        ? fill(T.recognitionSunDetail, {
          rashi: sun.d10RashiName,
          house: String(sun.d10House),
          dignity: dignityText(sun.d10Dignity, lang),
        })
        : T.recognitionSunMissing,
    },
    {
      id: 'jupiter',
      label: T.recognitionFactorJupiterLabel,
      ok: Boolean(ju && (STRONG.includes(ju.d10Dignity) || [1, 5, 9, 11].includes(ju.d10House))),
      detail: ju
        ? fill(T.recognitionJupiterDetail, {
          rashi: ju.d10RashiName,
          house: String(ju.d10House),
          dignity: dignityText(ju.d10Dignity, lang),
        })
        : T.recognitionJupiterMissing,
    },
    {
      id: 'moon',
      label: T.recognitionFactorMoonLabel,
      ok: Boolean(mo && !WEAK.includes(mo.d10Dignity) && ![6, 8, 12].includes(mo.d10House)),
      detail: mo
        ? fill(T.recognitionMoonDetail, {
          rashi: mo.d10RashiName,
          house: String(mo.d10House),
          dignity: dignityText(mo.d10Dignity, lang),
        })
        : T.recognitionMoonMissing,
    },
    {
      id: 'lagna',
      label: T.recognitionFactorLagnaLabel,
      ok: Boolean(
        analysis.lagnaVargottama
        || (lagnaLord && (STRONG.includes(lagnaLord.d10Dignity) || [1, 4, 7, 10].includes(lagnaLord.d10House))),
      ),
      detail: lagnaLord
        ? fill(T.recognitionLagnaDetail, {
          name: lagnaLord.name,
          house: String(lagnaLord.d10House),
          vargottama: analysis.lagnaVargottama ? T.recognitionLagnaVargottama : '',
        })
        : T.recognitionLagnaMissing,
    },
  ]

  const okCount = factors.filter((f) => f.ok).length
  const score = Math.round((okCount / 4) * 100)

  const thanklessNotes: string[] = []
  const capPlanets = analysis.planets.filter((p) => p.d10Rashi === 10)
  if (capPlanets.length >= 2) {
    thanklessNotes.push(fill(T.recognitionThanklessCapPlanets, { n: String(capPlanets.length) }))
  }
  const sa = analysis.planets.find((p) => p.id === 'Sa')
  if (sa) {
    if (sa.d10House === 10) thanklessNotes.push(T.recognitionThanklessSaH10)
    if (sa.d10House === 4) thanklessNotes.push(T.recognitionThanklessSaH4)
    if (sa.d10House === 7) thanklessNotes.push(T.recognitionThanklessSaH7)
    if (sa.d10Rashi === 10) thanklessNotes.push(T.recognitionThanklessSaCap)
  }
  if (analysis.d10Lagna === 10) {
    thanklessNotes.push(T.recognitionThanklessCapLagna)
  }

  let tone: CareerTone = 'mixed'
  let headline: string = T.recognitionHeadlineMixed
  let text: string = T.recognitionTextMixed
  if (okCount >= 4) {
    tone = 'supportive'
    headline = T.recognitionHeadlineStrong
    text = T.recognitionTextStrong
  } else if (okCount === 3) {
    tone = 'supportive'
    headline = T.recognitionHeadlineLikely
    text = T.recognitionTextLikely
  } else if (okCount <= 1 && thanklessNotes.length) {
    tone = 'challenging'
    headline = T.recognitionHeadlineThankless
    text = T.recognitionTextThankless
  } else if (okCount <= 1) {
    tone = 'challenging'
    headline = T.recognitionHeadlineSoft
    text = T.recognitionTextSoft
  }

  return { tone, score, headline, text, factors, thanklessNotes }
}

function buildSecondHouse(analysis: DashamsaAnalysis, lang: EngineLang = 'en'): SecondHouseKarma {
  const T = d10pText(lang)
  const h2 = analysis.houses[1]!
  const occ = h2.occupants
  const lord = lordOfHouse(analysis, 2)
  const lagnaLord = analysis.keyLords[0]
  const speechBased = Boolean(
    lagnaLord && (lagnaLord.d10House === 2 || occ.some((o) => o.id === lagnaLord.id)),
  )
  const eleventh = analysis.keyLords[2]
  // lineage: 2nd–11th link via lords
  const lineage = Boolean(
    (lord && lord.d10House === 11)
    || (eleventh && eleventh.d10House === 2),
  )

  const tips: string[] = []
  if (speechBased) tips.push(T.secondTipSpeech)
  if (lineage) tips.push(T.secondTipLineage)
  if (occ.some((o) => o.id === 'Mo')) tips.push(T.secondTipMoon)
  if (occ.some((o) => o.id === 'Ra')) tips.push(T.secondTipRahu)
  if (occ.length === 0) tips.push(T.secondTipEmpty)

  const text = [
    fill(T.secondHouseText, { rashi: h2.rashiName }),
    lord
      ? fill(T.secondLordDigpala, {
        name: lord.name,
        house: String(lord.d10House),
        digpala: lord.digpala.name,
      })
      : '',
    occ.length
      ? fill(T.secondOccupants, { names: occ.map((o) => o.name).join(', ') })
      : T.secondEmpty,
  ].filter(Boolean).join(' ')

  return {
    occupants: occ.map((o) => o.name),
    lordNote: lord ? fill(T.secondLordNote, { name: lord.name, house: String(lord.d10House) }) : '—',
    speechBased,
    lineageLink: lineage,
    text,
    tips,
  }
}

function buildDesireFear(analysis: DashamsaAnalysis, lang: EngineLang = 'en'): DesireFearAxis {
  const T = d10pText(lang)
  const pack = <H extends 6 | 8 | 11>(house: H, label: string, base: string) => {
    const occ = occupantsInHouse(analysis.planets, house)
    const lord = lordOfHouse(analysis, house)
    return {
      house,
      occupants: occ.map((p) => `${p.name} (${p.d10RashiShort})`),
      lordNote: lord
        ? fill(T.desireLordNote, {
          label,
          name: lord.name,
          house: String(lord.d10House),
          digpala: lord.digpala.name,
        })
        : fill(T.desireLordUnavailable, { label }),
      text: base,
    }
  }
  return {
    desire: pack(11, '11th', T.desireText),
    fear: pack(8, '8th', T.fearText),
    prarabdha: pack(6, '6th', T.prarabdhaText),
  }
}

function natalLon(p: DashamsaPlanetRow): number {
  return (p.d1Rashi - 1) * 30 + p.d1Degree
}

function angleDiff(a: number, b: number): number {
  const d = Math.abs(a - b) % 360
  return d > 180 ? 360 - d : d
}

function buildMoonMind(analysis: DashamsaAnalysis, lang: EngineLang = 'en'): MoonLagnaMind {
  const T = d10pText(lang)
  const mo = analysis.planets.find((p) => p.id === 'Mo')
  const moonAsc = (mo?.d10Rashi ?? analysis.d10Lagna) as Rashi
  const sukhHouse = 4
  const twelfthHouse = 12
  const inFromMoon = (house: number) =>
    analysis.planets.filter((p) => houseFrom(moonAsc, p.d10Rashi) === house)

  const sukh = inFromMoon(sukhHouse)
  const twelfth = inFromMoon(twelfthHouse)
  const fireSigns: Rashi[] = [1, 5, 9]
  const fireHits = analysis.planets.filter(
    (p) => fireSigns.includes(p.d10Rashi) && [1, 5, 9].includes(houseFrom(moonAsc, p.d10Rashi)),
  )
  const moonInFire = mo ? fireSigns.includes(mo.d10Rashi) : false
  const fireInitiative = moonInFire || fireHits.length >= 2

  let sukhNote = T.moonSukhNoteBase
  if (sukh.some((p) => p.id === 'Ve' || p.id === 'Me')) {
    sukhNote += T.moonSukhVeMe
    if (sukh.some((p) => p.d10Rashi === 8)) {
      sukhNote += T.moonSukhScorpio
    }
  } else if (sukh.length === 0) {
    sukhNote += T.moonSukhEmpty
  }

  let twelfthNote: string = T.moonTwelfthNoteBase
  if (twelfth.some((p) => p.id === 'Ke')) {
    twelfthNote = T.moonTwelfthKetu
  }

  const fireNote = fireInitiative ? T.moonFireYes : T.moonFireNo

  return {
    moonAsc,
    moonAscName: rName(moonAsc, lang),
    sukhHouse,
    sukhOccupants: sukh.map((p) => `${p.name} (${p.d10RashiShort})`),
    sukhNote,
    twelfthOccupants: twelfth.map((p) => `${p.name} (${p.d10RashiShort})`),
    twelfthNote,
    fireInitiative,
    fireNote,
  }
}

function buildPending(analysis: DashamsaAnalysis, lang: EngineLang = 'en'): DashamsaPendingPractical {
  const T = d10pText(lang)
  const items: PendingKarmaItem[] = []
  for (const house of [2, 6, 10] as const) {
    for (const p of occupantsInHouse(analysis.planets, house)) {
      let pendingTheme = fill(T.pendingThemeDefault, {
        planet: gName(p.id, lang),
        house: String(house),
      })
      if (p.id === 'Ke' && house === 2 && p.d10Rashi === 2) {
        pendingTheme = T.pendingThemeKetuTa2
      } else if (house === 2) {
        pendingTheme = fill(T.pendingThemeH2, { name: p.name, rashi: p.d10RashiName })
      } else if (house === 6) {
        pendingTheme = fill(T.pendingThemeH6, { name: p.name })
      } else {
        pendingTheme = fill(T.pendingThemeH10, { name: p.name })
      }
      items.push({
        planetId: p.id,
        planetName: p.name,
        house,
        rashiName: p.d10RashiName,
        pendingTheme,
        charity: charityFor(p.id, lang, T),
      })
    }
  }

  const capNotes: string[] = []
  const sa = analysis.planets.find((p) => p.id === 'Sa')
  const ju = analysis.planets.find((p) => p.id === 'Ju')
  const capLagna = analysis.d10Lagna === 10
  const saIn10 = sa?.d10House === 10
  const saIn11 = sa?.d10House === 11
  const juIn10 = ju?.d10House === 10
  const capActive = capLagna || saIn10 || saIn11 || analysis.planets.filter((p) => p.d10Rashi === 10).length >= 2

  if (capLagna) capNotes.push(T.capNoteLagna)
  if (saIn10) capNotes.push(T.capNoteSa10)
  if (saIn11) capNotes.push(T.capNoteSa11)
  if (juIn10) capNotes.push(T.capNoteJu10)

  const capricornHardWork = {
    active: capActive,
    headline: capActive ? T.capHeadlineActive : T.capHeadlineQuiet,
    text: capActive ? T.capTextActive : T.capTextQuiet,
    notes: capNotes,
  }

  const mo = analysis.planets.find((p) => p.id === 'Mo')
  const ke = analysis.planets.find((p) => p.id === 'Ke')
  const ve = analysis.planets.find((p) => p.id === 'Ve')
  const ra = analysis.planets.find((p) => p.id === 'Ra')
  const ma = analysis.planets.find((p) => p.id === 'Ma')
  const me = analysis.planets.find((p) => p.id === 'Me')

  const moSaOrb =
    mo && sa ? angleDiff(natalLon(mo), natalLon(sa)) : 999
  const parashuram =
    Boolean(ma && sa && ma.d10House === 9 && sa.d10House === 9)
    || Boolean(ma && sa && ma.d10Rashi === sa.d10Rashi && ma.d10House === 9)

  const houseCount = (from: number, to: number) => ((to - from + 12) % 12) + 1
  const veRaLink = Boolean(
    ve && ra && (
      ve.d10Rashi === ra.d10Rashi
      || [1, 5, 9].includes(houseCount(ve.d10House, ra.d10House))
    ),
  )

  const doc612 = Boolean(
    (occupantsInHouse(analysis.planets, 6).length && occupantsInHouse(analysis.planets, 12).length)
    || (ju && (ju.d10House === 6 || ju.d10House === 12 || ju.d10House === 10)),
  )

  const surgical = Boolean(ma && ra && ma.d10House === 5 && (ma.d10Rashi === ra.d10Rashi || ra.d10House === 5))

  const chhaya = Boolean(
    ke && sa && mo
    && ke.d10Rashi === sa.d10Rashi
    && ke.d10Degree > sa.d10Degree
    && ke.d10Degree > (mo.d10Rashi === ke.d10Rashi ? mo.d10Degree : -1),
  )

  const meJuConj = Boolean(me && ju && me.d10Rashi === ju.d10Rashi)
  const veSuConj = Boolean(ve && analysis.planets.find((p) => p.id === 'Su' && p.d10Rashi === ve.d10Rashi))
  const ketuLagna = Boolean(ke && ke.d10House === 1)

  const flags: ClinicalFlag[] = [
    {
      id: 'parashuram',
      title: T.flagParashuramTitle,
      matched: parashuram,
      severity: parashuram ? 'challenging' : 'neutral',
      detail: parashuram ? T.flagParashuramYes : T.flagParashuramNo,
    },
    {
      id: 'moon-saturn',
      title: T.flagMoonSaturnTitle,
      matched: moSaOrb <= 3.333,
      severity: moSaOrb <= 3.333 ? 'challenging' : 'neutral',
      detail: moSaOrb <= 3.333
        ? fill(T.flagMoonSaturnYes, { orb: moSaOrb.toFixed(2) })
        : moSaOrb === 999
          ? T.flagMoonSaturnNa
          : fill(T.flagMoonSaturnNo, { orb: `${moSaOrb.toFixed(1)}°` }),
    },
    {
      id: 'venus-rahu',
      title: T.flagVenusRahuTitle,
      matched: veRaLink,
      severity: 'mixed',
      detail: veRaLink ? T.flagVenusRahuYes : T.flagVenusRahuNo,
    },
    {
      id: 'surgical',
      title: T.flagSurgicalTitle,
      matched: surgical,
      severity: 'mixed',
      detail: surgical ? T.flagSurgicalYes : T.flagSurgicalNo,
    },
    {
      id: 'doctor-612',
      title: T.flagDoctor612Title,
      matched: doc612,
      severity: 'mixed',
      detail: doc612 ? T.flagDoctor612Yes : T.flagDoctor612No,
    },
    {
      id: 'ketu-lagna',
      title: T.flagKetuLagnaTitle,
      matched: ketuLagna,
      severity: ketuLagna ? 'challenging' : 'neutral',
      detail: ketuLagna ? T.flagKetuLagnaYes : T.flagKetuLagnaNo,
    },
    {
      id: 'chhaya',
      title: T.flagChhayaTitle,
      matched: chhaya,
      severity: chhaya ? 'challenging' : 'neutral',
      detail: chhaya ? T.flagChhayaYes : T.flagChhayaNo,
    },
    {
      id: 'me-ju',
      title: T.flagMeJuTitle,
      matched: meJuConj,
      severity: meJuConj ? 'mixed' : 'neutral',
      detail: meJuConj ? T.flagMeJuYes : T.flagMeJuNo,
    },
    {
      id: 've-su',
      title: T.flagVeSuTitle,
      matched: Boolean(veSuConj),
      severity: 'mixed',
      detail: veSuConj ? T.flagVeSuYes : T.flagVeSuNo,
    },
  ]

  const remedies: RemedyCard[] = [
    { id: '260', title: T.remedy260Title, when: T.remedy260When, action: T.remedy260Action },
    { id: 'moon-ketu', title: T.remedyMoonKetuTitle, when: T.remedyMoonKetuWhen, action: T.remedyMoonKetuAction },
    { id: 'capricorn', title: T.remedyCapTitle, when: T.remedyCapWhen, action: T.remedyCapAction },
    { id: 'food', title: T.remedyFoodTitle, when: T.remedyFoodWhen, action: T.remedyFoodAction },
  ]

  const methodSteps = [
    T.pendingMethod0,
    T.pendingMethod1,
    T.pendingMethod2,
    T.pendingMethod3,
    T.pendingMethod4,
    T.pendingMethod5,
  ]

  return {
    axisRule: T.pendingAxisRule,
    items,
    capricornHardWork,
    flags,
    remedies,
    methodSteps,
  }
}

function buildBonds(analysis: DashamsaAnalysis, lang: EngineLang = 'en'): KarmicBondNote {
  const T = d10pText(lang)
  const h1 = analysis.houses[0]!
  const lagnaLord = analysis.keyLords[0]!
  return {
    d10LagnaSign: analysis.d10Lagna,
    d10LagnaName: analysis.d10LagnaName,
    lagnaLordName: lagnaLord.name,
    lagnaLordHouse: lagnaLord.d10House,
    occupants: h1.occupants.map((o) => o.name),
    text: fill(T.bondsText, { d10LagnaName: analysis.d10LagnaName }),
    mutualTip: T.bondsMutualTip,
  }
}

function buildKarma(analysis: DashamsaAnalysis, lang: EngineLang = 'en'): DashamsaKarmaPractical {
  const T = d10pText(lang)
  const sun = analysis.planets.find((p) => p.id === 'Su')
  const mo = analysis.planets.find((p) => p.id === 'Mo')
  const sunAsc = (sun?.d10Rashi ?? analysis.d10Lagna) as Rashi
  const moonAsc = (mo?.d10Rashi ?? analysis.d10Lagna) as Rashi

  const verticals: KarmaVerticalSlice[] = [
    buildVertical('body', analysis.d10Lagna, analysis.planets, lang),
    buildVertical('mind', moonAsc, analysis.planets, lang),
    buildVertical('soul', sunAsc, analysis.planets, lang),
  ]

  return {
    whyToday: T.karmaWhyToday,
    bonds: buildBonds(analysis, lang),
    secondHouse: buildSecondHouse(analysis, lang),
    moonMind: buildMoonMind(analysis, lang),
    verticals,
    desireFear: buildDesireFear(analysis, lang),
    recognition: buildRecognition(analysis, lang),
    takeaways: [
      T.karmaTakeaway0,
      T.karmaTakeaway1,
      T.karmaTakeaway2,
      T.karmaTakeaway3,
      T.karmaTakeaway4,
      T.karmaTakeaway5,
      T.karmaTakeaway6,
    ],
  }
}

function buildCombos(analysis: DashamsaAnalysis, lang: EngineLang = 'en'): CareerComboHit[] {
  const T = d10pText(lang)
  const byId = new Map(analysis.planets.map((p) => [p.id, p]))
  const sameSign = (a: GrahaId, b: GrahaId) => {
    const pa = byId.get(a)
    const pb = byId.get(b)
    return Boolean(pa && pb && pa.d10Rashi === pb.d10Rashi)
  }
  const inHouse = (id: GrahaId, houses: number[]) => {
    const p = byId.get(id)
    return Boolean(p && houses.includes(p.d10House))
  }
  const inSign = (id: GrahaId, rashis: Rashi[]) => {
    const p = byId.get(id)
    return Boolean(p && rashis.includes(p.d10Rashi))
  }

  const axis371 = analysis.planets.filter((p) => [3, 7, 11].includes(p.d10House))

  const meIn7 = inHouse('Me', [7])
  const multiBizDetail = meIn7
    ? inSign('Me', [1])
      ? T.comboMultiBizDetailYes
      : T.comboMultiBizDetailPackets
    : T.comboMultiBizDetailNo

  return [
    {
      id: 'civil',
      title: T.comboCivilTitle,
      matched: sameSign('Su', 'Sa'),
      detail: sameSign('Su', 'Sa') ? T.comboCivilDetailYes : T.comboCivilDetailNo,
    },
    {
      id: 'electrical',
      title: T.comboElectricalTitle,
      matched: sameSign('Ma', 'Ra'),
      detail: sameSign('Ma', 'Ra') ? T.comboElectricalDetailYes : T.comboElectricalDetailNo,
    },
    {
      id: 'aviation',
      title: T.comboAviationTitle,
      matched: inSign('Ma', [12]),
      detail: inSign('Ma', [12]) ? T.comboAviationDetailYes : T.comboAviationDetailNo,
    },
    {
      id: 'fashion',
      title: T.comboFashionTitle,
      matched: Boolean(byId.get('Ve') && (STRONG.includes(byId.get('Ve')!.d10Dignity) || [1, 7, 10].includes(byId.get('Ve')!.d10House))),
      detail: T.comboFashionDetail,
    },
    {
      id: 'influencer',
      title: T.comboInfluencerTitle,
      matched: axis371.length >= 2 && (sameSign('Ve', 'Ju') || (inHouse('Ve', [3, 7, 11]) && inHouse('Ju', [3, 7, 11]))),
      detail: axis371.length
        ? fill(T.comboInfluencerDetailYes, { n: String(axis371.length) })
        : T.comboInfluencerDetailNo,
    },
    {
      id: 'telecom',
      title: T.comboTelecomTitle,
      matched: sameSign('Sa', 'Ra'),
      detail: sameSign('Sa', 'Ra') ? T.comboTelecomDetailYes : T.comboTelecomDetailNo,
    },
    {
      id: 'bondage',
      title: T.comboBondageTitle,
      matched: occupantsInHouse(analysis.planets, 6).length >= 2 || inHouse('Sa', [6]),
      detail: T.comboBondageDetail,
    },
    {
      id: 'independent',
      title: T.comboIndependentTitle,
      matched: occupantsInHouse(analysis.planets, 12).length >= 1,
      detail: occupantsInHouse(analysis.planets, 12).length
        ? T.comboIndependentDetailYes
        : T.comboIndependentDetailNo,
    },
    {
      id: 'medical-ve-ra',
      title: T.comboMedicalVeRaTitle,
      matched: Boolean(
        byId.get('Ve')
        && byId.get('Ra')
        && (
          byId.get('Ve')!.d10Rashi === byId.get('Ra')!.d10Rashi
          || [1, 5, 9].includes(((byId.get('Ra')!.d10House - byId.get('Ve')!.d10House + 12) % 12) + 1)
        ),
      ),
      detail: T.comboMedicalVeRaDetail,
    },
    {
      id: 'jupiter-10',
      title: T.comboJupiter10Title,
      matched: inHouse('Ju', [10]),
      detail: inHouse('Ju', [10]) ? T.comboJupiter10DetailYes : T.comboJupiter10DetailNo,
    },
    {
      id: 'fluid',
      title: T.comboFluidTitle,
      matched: inSign('Ma', [4]),
      detail: inSign('Ma', [4]) ? T.comboFluidDetailYes : T.comboFluidDetailNo,
    },
    {
      id: 'delivery-apps',
      title: T.comboDeliveryAppsTitle,
      matched: Boolean(byId.get('Ma') && (STRONG.includes(byId.get('Ma')!.d10Dignity) || [1, 3, 6, 10].includes(byId.get('Ma')!.d10House))),
      detail: T.comboDeliveryAppsDetail,
    },
    {
      id: 'multi-biz',
      title: T.comboMultiBizTitle,
      matched: meIn7,
      detail: multiBizDetail,
    },
    {
      id: 've-ke',
      title: T.comboVeKeTitle,
      matched: sameSign('Ve', 'Ke'),
      detail: sameSign('Ve', 'Ke') ? T.comboVeKeDetailYes : T.comboVeKeDetailNo,
    },
    {
      id: 'ketu-lagna',
      title: T.comboKetuLagnaTitle,
      matched: inHouse('Ke', [1]),
      detail: inHouse('Ke', [1]) ? T.comboKetuLagnaDetailYes : T.comboKetuLagnaDetailNo,
    },
    {
      id: 'libra-rahu-floor',
      title: T.comboLibraRahuFloorTitle,
      matched: inSign('Ra', [7]),
      detail: inSign('Ra', [7]) ? T.comboLibraRahuFloorDetailYes : T.comboLibraRahuFloorDetailNo,
    },
    {
      id: 'libra-ketu-ground',
      title: T.comboLibraKetuGroundTitle,
      matched: inSign('Ke', [7]) && !sameSign('Ke', 'Mo'),
      detail: inSign('Ke', [7]) ? T.comboLibraKetuGroundDetailYes : T.comboLibraKetuGroundDetailNo,
    },
    {
      id: 'wfhome',
      title: T.comboWfhomeTitle,
      matched: inHouse('Sa', [4]),
      detail: inHouse('Sa', [4]) ? T.comboWfhomeDetailYes : T.comboWfhomeDetailNo,
    },
    {
      id: 'lagna-lord-7',
      title: T.comboLagnaLord7Title,
      matched: Boolean(analysis.planets.find((p) => p.id === analysis.keyLords[0]?.id && p.d10House === 7)),
      detail: T.comboLagnaLord7Detail,
    },
  ]
}

function sectorMeta(rashi: Rashi, lang: EngineLang) {
  const en = D10_SIGN_SECTORS[rashi]
  const hi = D10_SIGN_SECTORS_HI[rashi]
  if (lang !== 'hi' || !hi) return en
  return {
    headline: hi.headline,
    flavor: hi.flavor,
    industries: hi.industries,
    caution: hi.caution,
  }
}

function buildSectors(analysis: DashamsaAnalysis, lang: EngineLang = 'en'): DashamsaSectorsPractical {
  const T = d10pText(lang)
  const lagnaMeta = sectorMeta(analysis.d10Lagna, lang)
  const lagnaSector: D10SignSector = {
    rashi: analysis.d10Lagna,
    name: analysis.d10LagnaName,
    short: lang === 'hi' ? rName(analysis.d10Lagna, lang) : RASHI_SHORT[analysis.d10Lagna],
    ...lagnaMeta,
  }

  const byRashi = new Map<Rashi, DashamsaPlanetRow[]>()
  for (const p of analysis.planets) {
    const list = byRashi.get(p.d10Rashi) ?? []
    list.push(p)
    byRashi.set(p.d10Rashi, list)
  }

  const hits: SectorHit[] = []
  hits.push({
    rashi: analysis.d10Lagna,
    name: analysis.d10LagnaName,
    role: T.sectorsRoleLagna,
    sector: lagnaSector,
    planetNames: analysis.houses[0]?.occupants.map((o) => o.name) ?? [],
  })

  for (const [rashi, plist] of byRashi) {
    if (rashi === analysis.d10Lagna && plist.length === 0) continue
    if (plist.length < 2 && rashi !== analysis.d10Lagna) continue
    if (rashi === analysis.d10Lagna) continue
    const meta = sectorMeta(rashi, lang)
    const name = rName(rashi, lang)
    hits.push({
      rashi,
      name,
      role: fill(T.sectorsRoleSecondary, { n: String(plist.length) }),
      sector: {
        rashi,
        name,
        short: lang === 'hi' ? name : RASHI_SHORT[rashi],
        ...meta,
      },
      planetNames: plist.map((p) => p.name),
    })
  }

  // Always include 10th house sign flavor
  const h10 = analysis.houses[9]!
  if (h10.rashi !== analysis.d10Lagna) {
    const meta = sectorMeta(h10.rashi, lang)
    hits.push({
      rashi: h10.rashi,
      name: h10.rashiName,
      role: T.sectorsRoleH10,
      sector: { rashi: h10.rashi, name: h10.rashiName, short: h10.rashiShort, ...meta },
      planetNames: h10.occupants.map((o) => o.name),
    })
  }

  const houseFlavorNotes = [T.sectorsHouseNote0, T.sectorsHouseNote1, T.sectorsHouseNote2]

  const energyNotes = [T.sectorsEnergy0, T.sectorsEnergy1, T.sectorsEnergy2, T.sectorsEnergy3]

  return {
    method: T.sectorsMethod,
    lagnaSector,
    hits,
    combos: buildCombos(analysis, lang),
    houseFlavorNotes,
    energyNotes,
  }
}

function strengthHint(p: DashamsaPlanetRow | undefined): InheritedKarmaPlanet['strengthHint'] {
  if (!p) return 'absent'
  const strong = ['exalted', 'moolatrikona', 'own'].includes(p.d10Dignity)
  const weak = ['debilitated', 'great_enemy', 'enemy'].includes(p.d10Dignity)
  const angular = [1, 4, 7, 10].includes(p.d10House)
  if (strong || (angular && !weak)) return 'strong'
  if (weak || [6, 8, 12].includes(p.d10House)) return 'soft'
  return 'mixed'
}

function buildBondage(analysis: DashamsaAnalysis, lang: EngineLang = 'en'): DashamsaBondagePractical {
  const T = d10pText(lang)
  const byId = new Map(analysis.planets.map((p) => [p.id, p]))
  const sector = sectorMeta(analysis.d10Lagna, lang)
  const h1 = analysis.houses[0]!
  const lagnaLord = analysis.keyLords[0]
  const mo = byId.get('Mo')
  const moonHouseTheme = mo
    ? (analysis.houses[mo.d10House - 1]?.theme ?? fill(T.verticalHouseFallback, { house: String(mo.d10House) }))
    : T.bondageMoonMissing
  const moonSector = mo ? sectorMeta(mo.d10Rashi, lang) : null

  const inherited: InheritedKarmaPlanet[] = inheritedMeta(T).map((meta) => {
    const p = byId.get(meta.id)
    const hint = strengthHint(p)
    return {
      id: meta.id,
      name: gName(meta.id, lang),
      source: meta.source,
      detail: meta.detail,
      d10House: p?.d10House ?? null,
      d10RashiName: p?.d10RashiName ?? null,
      strengthHint: hint,
      toolNote:
        hint === 'strong'
          ? fill(T.inheritedToolActive, { tool: meta.toolHow })
          : hint === 'soft'
            ? fill(T.inheritedToolSoft, { tool: meta.toolHow })
            : hint === 'mixed'
              ? fill(T.inheritedToolMixed, { tool: meta.toolHow })
              : meta.toolHow,
    }
  })

  const moonConj = mo
    ? analysis.planets
      .filter((p) => p.id !== 'Mo' && p.d10Rashi === mo.d10Rashi)
      .map((p) => p.name)
    : []

  const lagnaOccNames = h1.occupants.map((o) => o.name).join(', ') || (lang === 'hi' ? 'खाली' : 'empty')
  const houseWord = lang === 'hi' ? 'भाव {house}' : 'House {house}'
  const layered: LayeredReading[] = [
    {
      id: 'lagna',
      title: T.bondageLayerLagnaTitle,
      priority: T.bondageLayerLagnaPriority,
      house: {
        label: T.bondageHouse1Label,
        text: fill(T.bondageHouseThemeOcc, { theme: h1.theme, names: lagnaOccNames }),
      },
      rashi: {
        label: analysis.d10LagnaName,
        text: `${sector.headline}. ${sector.flavor}`,
      },
      planet: {
        label: T.bondageLagnaColorLabel,
        text: h1.occupants.length
          ? fill(T.bondagePlanetsOnLagna, { names: h1.occupants.map((o) => o.name).join(', ') })
          : T.bondageEmptyLagna,
      },
      synthesis: fill(T.bondageSynthesisLagna, {
        lagna: analysis.d10LagnaName,
        industries: sector.industries.slice(0, 3).join(', '),
      }),
    },
    {
      id: 'moon',
      title: T.bondageLayerMoonTitle,
      priority: T.bondageLayerMoonPriority,
      house: {
        label: mo ? fill(houseWord, { house: String(mo.d10House) }) : gName('Mo', lang),
        text: mo
          ? fill(T.bondageMoonHouseText, { theme: moonHouseTheme })
          : T.bondageMoonMissing,
      },
      rashi: {
        label: mo?.d10RashiName ?? '—',
        text: moonSector
          ? `${moonSector.headline}. ${moonSector.flavor}`
          : T.bondageSignFlavorMissing,
      },
      planet: {
        label: T.bondageConjLabel,
        text: moonConj.length
          ? fill(T.bondageMoonConj, { names: moonConj.join(', ') })
          : T.bondageMoonAlone,
      },
      synthesis: mo
        ? fill(T.bondageMoonSynthesis, {
          house: String(mo.d10House),
          rashi: mo.d10RashiName,
          conj: moonConj.length ? (lang === 'hi' ? ` ${moonConj.join(', ')} के साथ` : ` with ${moonConj.join(', ')}`) : '',
        })
        : T.bondageMoonSynthesisMissing,
    },
    {
      id: 'lagna-lord',
      title: T.bondageLayerLordTitle,
      priority: T.bondageLayerLordPriority,
      house: {
        label: lagnaLord ? fill(houseWord, { house: String(lagnaLord.d10House) }) : '—',
        text: lagnaLord
          ? fill(T.bondageLordHouseText, {
            theme: analysis.houses[lagnaLord.d10House - 1]?.theme ?? '',
          })
          : T.bondageLordUnavailable,
      },
      rashi: {
        label: lagnaLord?.d10RashiName ?? '—',
        text: lagnaLord
          ? sectorMeta(lagnaLord.d10Rashi, lang).headline
          : '—',
      },
      planet: {
        label: lagnaLord?.name ?? '—',
        text: lagnaLord
          ? fill(T.bondageLordDigpala, {
            name: lagnaLord.name,
            dignity: dignityText(lagnaLord.d10Dignity, lang),
            digpala: lagnaLord.digpala.name,
          })
          : '—',
      },
      synthesis: lagnaLord
        ? fill(T.bondageLordSynthesis, {
          lagna: analysis.d10LagnaName,
          name: lagnaLord.name,
          house: String(lagnaLord.d10House),
          rashi: lagnaLord.d10RashiName,
        })
        : T.bondageLordSynthesisPending,
    },
  ]

  const navigationTools = [
    { planet: gName('Me', lang), how: T.bondageNavMercury, active: strengthHint(byId.get('Me')) === 'strong' },
    { planet: gName('Ma', lang), how: T.bondageNavMars, active: strengthHint(byId.get('Ma')) === 'strong' },
    { planet: gName('Su', lang), how: T.bondageNavSun, active: strengthHint(byId.get('Su')) === 'strong' },
    { planet: gName('Ve', lang), how: T.bondageNavVenus, active: strengthHint(byId.get('Ve')) === 'strong' },
    { planet: gName('Ju', lang), how: T.bondageNavJupiter, active: strengthHint(byId.get('Ju')) === 'strong' },
    { planet: gName('Sa', lang), how: T.bondageNavSaturn, active: strengthHint(byId.get('Sa')) === 'strong' },
  ]

  return {
    framing: T.bondageFraming,
    goldenOrder: [T.bondageGolden0, T.bondageGolden1, T.bondageGolden2],
    inherited,
    layered,
    navigationTools,
    principles: [
      T.bondagePrinciple0,
      T.bondagePrinciple1,
      T.bondagePrinciple2,
      T.bondagePrinciple3,
      T.bondagePrinciple4,
      T.bondagePrinciple5,
      T.bondagePrinciple6,
    ],
    homework: T.bondageHomework,
  }
}

const ELEMENT_OF: Record<Rashi, 'fire' | 'earth' | 'air' | 'water'> = {
  1: 'fire', 2: 'earth', 3: 'air', 4: 'water',
  5: 'fire', 6: 'earth', 7: 'air', 8: 'water',
  9: 'fire', 10: 'earth', 11: 'air', 12: 'water',
}

function houseDistance(from: Rashi, to: Rashi): number {
  return ((to - from + 12) % 12) + 1
}

function buildLagnaSync(analysis: DashamsaAnalysis, chart: ChartOutput, lang: EngineLang = 'en'): LagnaSyncReading {
  const T = d10pText(lang)
  const d1 = chart.lagnas.ascRashi
  const d10 = analysis.d10Lagna
  const d1Name = rName(d1, lang)
  const d10Name = analysis.d10LagnaName
  const d1Sector = sectorMeta(d1, lang)
  const d10Sector = sectorMeta(d10, lang)
  const d1El = ELEMENT_OF[d1]
  const d10El = ELEMENT_OF[d10]
  const dist = houseDistance(d1, d10) // 1 = same
  const moon = chart.grahas.find((g) => g.id === 'Mo')
  const sun = chart.grahas.find((g) => g.id === 'Su')
  const softMoon = moon?.rashi === d10
  const softSun = sun?.rashi === d10
  const sameElement = d1El === d10El && d1 !== d10
  // 6–8 from each other (strain axis): houses 6 or 8 apart → distance 6 or 8
  const strainAxis = dist === 6 || dist === 8
  // Trine / 5–9 harmony from D1 to D10 sign
  const trineLink = dist === 5 || dist === 9

  let status: LagnaSyncStatus
  let statusLabel: string
  let headline: string
  let text: string
  let bridge: string
  let counsel: string

  const d1Role = fill(T.syncD1Role, { d1Name, d1Flavor: d1Sector.flavor })
  const d10Role = fill(T.syncD10Role, {
    d10Name,
    d10Headline: d10Sector.headline,
    doors: d10Sector.industries.slice(0, 3).join('; '),
  })

  if (d1 === d10) {
    status = 'synced'
    statusLabel = T.syncStatusSynced
    headline = fill(T.syncSyncedHeadline, { name: d1Name })
    text = fill(T.syncSyncedText, { name: d1Name })
    bridge = fill(T.syncSyncedBridge, { name: d1Name })
    counsel = T.syncSyncedCounsel
  } else if (sameElement) {
    status = 'element-bridge'
    const elWord = lang === 'hi'
      ? { fire: 'अग्नि', earth: 'पृथ्वी', air: 'वायु', water: 'जल' }[d1El]
      : d1El === 'fire' ? 'Fire' : d1El === 'earth' ? 'Earth' : d1El === 'air' ? 'Air' : 'Water'
    statusLabel = fill(T.syncStatusElementBridge, { element: elWord })
    headline = fill(T.syncElementHeadline, { d1Name, d10Name, element: lang === 'hi' ? elWord : elWord.toLowerCase() })
    text = fill(T.syncElementText, {
      d1Name,
      d10Name,
      elementLabel: elementLabelText(d1El, T),
    })
    bridge = fill(T.syncElementBridge, { d1Name, d10Name })
    counsel = d10Sector.caution
      ? fill(T.syncElementCounselCaution, { d10Name, caution: d10Sector.caution })
      : fill(T.syncElementCounselRhythm, { d1Name, d10Name })
  } else if (softMoon || softSun || trineLink) {
    status = 'soft-link'
    statusLabel = softMoon ? T.syncStatusMoonLink : softSun ? T.syncStatusSunLink : T.syncStatusTrineLink
    headline = fill(T.syncSoftHeadline, { d1Name, d10Name })
    const linkBit = softMoon
      ? T.syncSoftMoon
      : softSun
        ? T.syncSoftSun
        : fill(T.syncSoftTrine, { d10Name, d1Name })
    text = fill(T.syncSoftText, { linkBit, d1Name, d10Name })
    bridge = fill(T.syncSoftBridge, { d10Name, d1Name })
    counsel = T.syncSoftCounsel
  } else if (strainAxis) {
    status = 'strain'
    statusLabel = T.syncStatusStrain
    headline = fill(T.syncStrainHeadline, { d1Name, d10Name })
    text = T.syncStrainText
    bridge = fill(T.syncStrainBridge, {
      d1Name,
      d10Name,
      d1Craft: d1Sector.industries[0] ?? 'its own craft',
      d10Craft: d10Sector.industries[0] ?? 'its market',
    })
    counsel = fill(T.syncStrainCounsel, { d10Name, d1Name })
  } else {
    status = 'offset'
    statusLabel = T.syncStatusOffset
    headline = fill(T.syncOffsetHeadline, { d1Name, d10Name })
    text = T.syncOffsetText
    bridge = fill(T.syncOffsetBridge, { d1Name, d10Name })
    counsel = d10Sector.caution
      ? fill(T.syncOffsetCounselCaution, { d10Name, caution: d10Sector.caution })
      : fill(T.syncOffsetCounselDefault, { d10Name, d1Name })
  }

  const recharge = [
    fill(T.syncRechargeD1, { name: d1Name, text: lagnaRechargeText(d1, T) }),
    fill(T.syncRechargeD10, { name: d10Name, text: lagnaRechargeText(d10, T) }),
  ]
  if (sameElement) {
    recharge.push(fill(T.syncRechargeSharedElement, { elementLabel: elementLabelText(d1El, T) }))
  }

  return {
    synced: d1 === d10,
    status,
    statusLabel,
    d1Lagna: d1,
    d10Lagna: d10,
    d1LagnaName: d1Name,
    d10LagnaName: d10Name,
    headline,
    text,
    d1Role,
    d10Role,
    bridge,
    recharge,
    counsel,
  }
}

function dashaEventForHouse(
  house: number | null,
  T: D10PText,
): Omit<DashaHouseEvent, 'levelLabel' | 'lordName' | 'd10House'> {
  if (house == null) {
    return { event: T.dashaEventUnknown, tone: 'neutral', pathHint: null }
  }
  if (house === 8) {
    return { event: T.dashaEventH8, tone: 'challenging', pathHint: T.dashaPathH8Jnana }
  }
  if (house === 12) {
    return { event: T.dashaEventH12, tone: 'challenging', pathHint: T.dashaPathH12 }
  }
  if (house === 5) {
    return { event: T.dashaEventH5, tone: 'mixed', pathHint: T.dashaPathH5 }
  }
  if (house === 11) {
    return { event: T.dashaEventH11, tone: 'mixed', pathHint: null }
  }
  if (house === 6) {
    return { event: T.dashaEventH6, tone: 'mixed', pathHint: null }
  }
  if ([1, 10].includes(house)) {
    return {
      event: fill(T.dashaEventH110, { house: String(house) }),
      tone: 'supportive',
      pathHint: null,
    }
  }
  return {
    event: fill(T.dashaEventGeneric, { house: String(house) }),
    tone: 'neutral',
    pathHint: null,
  }
}

function buildKarmaYoga(analysis: DashamsaAnalysis, chart: ChartOutput, lang: EngineLang = 'en'): DashamsaKarmaYogaPractical {
  const T = d10pText(lang)
  const sync = buildLagnaSync(analysis, chart, lang)

  const dashaEvents: DashaHouseEvent[] = (analysis.dashaOverlay?.lords ?? []).map((l) => {
    const meta = dashaEventForHouse(l.d10House, T)
    return {
      levelLabel: l.levelLabel,
      lordName: l.lordName,
      d10House: l.d10House,
      ...meta,
    }
  })

  const housesHit = new Set(dashaEvents.map((e) => e.d10House).filter((h): h is number => h != null))
  const crisisActive = housesHit.has(8) || housesHit.has(12)
  const has5and8 = housesHit.has(5) && housesHit.has(8)
  const has5and12 = housesHit.has(5) && housesHit.has(12)

  let crisisHeadline: string = T.crisisHeadlineNone
  if (has5and8) crisisHeadline = T.crisisHeadline58
  else if (has5and12) crisisHeadline = T.crisisHeadline512
  else if (crisisActive) crisisHeadline = T.crisisHeadline812

  const crisisMode = {
    active: crisisActive || has5and8 || has5and12,
    headline: crisisHeadline,
    jnanaPath: T.crisisJnana,
    bhaktiPath: T.crisisBhakti,
    acceptanceRule: T.crisisAcceptance,
  }

  // Triad activity: planets in those house groups OR dasha lords hitting them
  const countIn = (houses: number[]) =>
    analysis.planets.filter((p) => houses.includes(p.d10House)).length
      + dashaEvents.filter((e) => e.d10House != null && houses.includes(e.d10House)).length

  const fireN = countIn([1, 5, 9])
  const earthN = countIn([2, 6, 10])
  const airN = countIn([3, 7, 11])
  const waterN = countIn([4, 8, 12])

  const triads: TriadRemedy[] = [
    {
      id: 'fire',
      houses: '1–5–9',
      element: lang === 'hi' ? 'अग्नि' : 'Fire (Agni)',
      signs: lang === 'hi' ? 'मेष, सिंह, धनु' : 'Aries, Leo, Sagittarius',
      remedy: T.triadFireRemedy,
      active: fireN >= 3,
      reason: fireN >= 3 ? fill(T.triadReasonFire, { n: String(fireN) }) : T.triadReasonQuiet,
    },
    {
      id: 'earth',
      houses: '2–6–10',
      element: lang === 'hi' ? 'पृथ्वी' : 'Earth (Pṛthivī)',
      signs: lang === 'hi' ? 'वृषभ, कन्या, मकर' : 'Taurus, Virgo, Capricorn',
      remedy: T.triadEarthRemedy,
      active: earthN >= 3,
      reason: earthN >= 3 ? fill(T.triadReasonEarth, { n: String(earthN) }) : T.triadReasonEarthQuiet,
    },
    {
      id: 'air',
      houses: '3–7–11',
      element: lang === 'hi' ? 'वायु' : 'Air (Vāyu)',
      signs: lang === 'hi' ? 'मिथुन, तुला, कुंभ' : 'Gemini, Libra, Aquarius',
      remedy: T.triadAirRemedy,
      active: airN >= 3,
      reason: airN >= 3 ? fill(T.triadReasonAir, { n: String(airN) }) : T.triadReasonAirQuiet,
    },
    {
      id: 'water',
      houses: '4–8–12',
      element: lang === 'hi' ? 'जल' : 'Water (Jala)',
      signs: lang === 'hi' ? 'कर्क, वृश्चिक, मीन' : 'Cancer, Scorpio, Pisces',
      remedy: T.triadWaterRemedy,
      active: waterN >= 3 || crisisActive,
      reason: crisisActive || waterN >= 3
        ? fill(T.triadReasonWater, {
          n: String(waterN),
          extra: crisisActive ? T.triadReasonWaterExtra : '',
        })
        : T.triadReasonWaterQuiet,
    },
  ]

  const d9 = chart.vargas?.D9
  const corruption: CorruptionNote[] = []
  if (d9?.length) {
    const STRONG = new Set(['exalted', 'moolatrikona', 'own'])
    const WEAK = new Set(['debilitated', 'great_enemy', 'enemy'])
    for (const p of analysis.planets) {
      const d1 = chart.grahas.find((g) => g.id === p.id)
      const d9p = d9.find((g) => g.id === p.id)
      if (!d1 || !d9p) continue
      const strongD1 = STRONG.has(d1.dignity)
      const weakD9 = WEAK.has(d9p.dignity)
      if (strongD1 && weakD9) {
        corruption.push({
          id: p.id,
          name: p.name,
          d1Dignity: d1.dignity,
          d9Dignity: d9p.dignity,
          d10House: p.d10House,
          d10Note: fill(T.corruptionNote, {
            d1Dignity: dignityText(d1.dignity, lang),
            d9Dignity: dignityText(d9p.dignity, lang),
            house: String(p.d10House),
            rashi: p.d10RashiName,
            digpala: p.digpala.name,
          }),
        })
      }
    }
  }

  return {
    framing: T.karmaYogaFraming,
    sync,
    dashaEvents,
    crisisMode,
    triads,
    corruption,
    oilField: T.oilField,
    multiChart: [
      T.karmaYogaMulti0,
      T.karmaYogaMulti1,
      T.karmaYogaMulti2,
      T.karmaYogaMulti3,
      T.karmaYogaMulti4,
      T.karmaYogaMulti5,
      T.karmaYogaMulti6,
    ],
    ethics: [T.ethics0, T.ethics1, T.ethics2, T.ethics3, T.ethics4, T.ethics5, T.ethics6],
  }
}

function vargaSlice(chart: ChartOutput, code: CircuitVargaCode): { asc: Rashi; grahas: GrahaData[] } | null {
  const asc = chart.vargaLagnas?.[code]
  const grahas = chart.vargas?.[code]
  if (asc == null || !grahas?.length) return null
  return { asc, grahas }
}

function occupantsAtHouse(grahas: GrahaData[], asc: Rashi, house: number): GrahaData[] {
  return grahas.filter((g) => houseFrom(asc, g.rashi) === house)
}

/** D7 / D9 / D2 circuit notes (English text kept verbatim; Hindi twin below). */
const CIRCUIT_VARGA_EN = {
  d7LagnaTitle: 'D7 lagna · {name}',
  d7LagnaText: 'Relationship / children karma activates — this lord’s dasha is pivotal for who enters life.',
  d7H7Title: 'D7 · {name} in 7th',
  d7H7Text: 'Partner axis lit — meeting, haunting old love, or bond renegotiation.',
  d7H10Title: 'D7 · {name} in 10th',
  d7H10Text: 'Partner likely met via workplace / status field.',
  d7HouseTitle: 'D7 · {name} in house {house}',
  d7DusText: 'Relationship strain, hidden bonds, or exit path active.',
  d7TrineText: 'Children / fortune / gains themes in relationship field — pregnancy timing needs D2+D9 confirm.',
  d7DefText: 'Who enters / leaves life colors this house.',
  d9FruitTitle: 'D9 fruit · {name} in house {house}',
  d9DusText: 'Destiny outcome under strain — confirm with D7 before naming cheating/break.',
  d9AxisTitle: 'D9 · {name} on axis',
  d9AxisText: 'Final partnership result crystallizes through this lord.',
  d9H11Title: 'D9 · {name} in 11th',
  d9H11Text: 'Gains / network fruit — can include fake promises if Venus sign is Aquarius-flavored.',
  d9H5Title: 'D9 · {name} in 5th',
  d9H5Text: 'Children / romance fruit confirms; conflict after childbirth needs Virgo/3rd checks.',
  d9HouseTitle: 'D9 · {name} in house {house}',
  d9DefText: 'Navāṁśa fruit of the running period.',
  d2HouseTitle: 'D2 · {name} in house {house}',
  d2DusText: 'Passive / maternity / hidden wealth flavor — not the same as D10 promotion.',
  d2H45Text: 'Home / children spending and inflow; stay-home money possible.',
  d2H11Title: 'D2 · {name} in 11th',
  d2H11Text: 'Social recognition through wealth eventually rises.',
  d2DefText: 'Wealth inflow/drain through this house.',
  d10H12Title: 'D10 · {name} in 12th',
  d10H3Title: 'D10 · {name} in 3rd',
  d10HouseTitle: 'D10 · {name} in house {house}',
}

const CIRCUIT_VARGA_HI: Record<keyof typeof CIRCUIT_VARGA_EN, string> = {
  d7LagnaTitle: 'D7 लग्न · {name}',
  d7LagnaText: 'संबंध / संतान का कर्म सक्रिय होता है: इस स्वामी की दशा तय करती है कि जीवन में कौन आता है।',
  d7H7Title: 'D7 · {name} सप्तम भाव में',
  d7H7Text: 'साथी की धुरी प्रकाशित: मिलना, पुराने प्रेम की याद, या बंधन पर फिर से बात।',
  d7H10Title: 'D7 · {name} दशम भाव में',
  d7H10Text: 'साथी संभवतः कार्यस्थल / प्रतिष्ठा के क्षेत्र से मिलता है।',
  d7HouseTitle: 'D7 · {name} भाव {house} में',
  d7DusText: 'संबंधों में तनाव, छिपे बंधन, या अलग होने का रास्ता सक्रिय।',
  d7TrineText: 'संबंध के क्षेत्र में संतान / भाग्य / लाभ के विषय: गर्भधारण के समय के लिए D2+D9 से पुष्टि चाहिए।',
  d7DefText: 'जीवन में कौन आता / जाता है, यह इस भाव को रंगता है।',
  d9FruitTitle: 'D9 फल · {name} भाव {house} में',
  d9DusText: 'भाग्य के परिणाम पर दबाव: धोखे / टूटन का नाम लेने से पहले D7 से पुष्टि करें।',
  d9AxisTitle: 'D9 · {name} धुरी पर',
  d9AxisText: 'साझेदारी का अंतिम परिणाम इसी स्वामी से ठोस होता है।',
  d9H11Title: 'D9 · {name} एकादश भाव में',
  d9H11Text: 'लाभ / नेटवर्क का फल: शुक्र की राशि पर कुंभ का स्वर हो तो झूठे वादे भी शामिल हो सकते हैं।',
  d9H5Title: 'D9 · {name} पंचम भाव में',
  d9H5Text: 'संतान / प्रेम का फल पुष्ट होता है; संतान के बाद के संघर्ष के लिए कन्या / तृतीय भाव की जाँच चाहिए।',
  d9HouseTitle: 'D9 · {name} भाव {house} में',
  d9DefText: 'चल रही अवधि का नवांश फल।',
  d2HouseTitle: 'D2 · {name} भाव {house} में',
  d2DusText: 'निष्क्रिय / मातृत्व / छिपे धन का स्वर: यह D10 की पदोन्नति जैसा नहीं।',
  d2H45Text: 'घर / संतान पर ख़र्च और आय; घर बैठे धन संभव।',
  d2H11Title: 'D2 · {name} एकादश भाव में',
  d2H11Text: 'धन के माध्यम से सामाजिक मान्यता अंततः बढ़ती है।',
  d2DefText: 'इस भाव से धन का आना / जाना।',
  d10H12Title: 'D10 · {name} द्वादश भाव में',
  d10H3Title: 'D10 · {name} तृतीय भाव में',
  d10HouseTitle: 'D10 · {name} भाव {house} में',
}

function dashaHouseNote(
  code: CircuitVargaCode,
  lord: GrahaId,
  house: number,
  lang: EngineLang,
  levelIndex = 0,
): CircuitNote {
  const T = d10pText(lang)
  const name = gName(lord, lang)
  const id = `${code.toLowerCase()}-dasha-${lord}-h${house}-L${levelIndex}`
  if (code === 'D3') {
    if ([6, 8, 12].includes(house)) {
      const titleKey = house === 8 ? T.circuitD3H8Title : house === 6 ? T.circuitD3H6Title : T.circuitD3H12Title
      const textKey = house === 8 ? T.circuitD3H8Text : house === 6 ? T.circuitD3H6Text : T.circuitD3H12Text
      return {
        id,
        title: fill(titleKey, { name, house: String(house) }),
        text: textKey,
        tone: 'challenging',
      }
    }
    if (house === 4) {
      return { id, title: fill(T.circuitD3H4Title, { name }), text: T.circuitD3H4Text, tone: 'mixed' }
    }
    if (house === 5 || house === 7) {
      return {
        id,
        title: fill(T.circuitD3H57Title, { name, house: String(house) }),
        text: T.circuitD3H57Text,
        tone: 'mixed',
      }
    }
    if (house === 3) {
      return { id, title: fill(T.circuitD3H3Title, { name }), text: T.circuitD3H3Text, tone: 'mixed' }
    }
    if (house === 1) {
      return { id, title: fill(T.circuitD3H1Title, { name }), text: T.circuitD3H1Text, tone: 'mixed' }
    }
    return {
      id,
      title: fill(T.circuitD3HDefTitle, { name, house: String(house) }),
      text: T.circuitD3HDefText,
      tone: 'neutral',
    }
  }
  const X = lang === 'hi' ? CIRCUIT_VARGA_HI : CIRCUIT_VARGA_EN
  const ttl = (key: keyof typeof CIRCUIT_VARGA_EN) => fill(X[key], { name, house: String(house) })
  if (code === 'D7') {
    if (house === 1) {
      return { id, title: ttl('d7LagnaTitle'), text: X.d7LagnaText, tone: 'mixed' }
    }
    if (house === 7) {
      return { id, title: ttl('d7H7Title'), text: X.d7H7Text, tone: 'mixed' }
    }
    if (house === 10) {
      return { id, title: ttl('d7H10Title'), text: X.d7H10Text, tone: 'mixed' }
    }
    if ([6, 8, 12].includes(house)) {
      return { id, title: ttl('d7HouseTitle'), text: X.d7DusText, tone: 'challenging' }
    }
    if (house === 5 || house === 9 || house === 11) {
      return { id, title: ttl('d7HouseTitle'), text: X.d7TrineText, tone: 'supportive' }
    }
    return { id, title: ttl('d7HouseTitle'), text: X.d7DefText, tone: 'neutral' }
  }
  if (code === 'D9') {
    if ([6, 8, 12].includes(house)) {
      return { id, title: ttl('d9FruitTitle'), text: X.d9DusText, tone: 'challenging' }
    }
    if (house === 7 || house === 1) {
      return { id, title: ttl('d9AxisTitle'), text: X.d9AxisText, tone: 'mixed' }
    }
    if (house === 11) {
      return { id, title: ttl('d9H11Title'), text: X.d9H11Text, tone: 'mixed' }
    }
    if (house === 5) {
      return { id, title: ttl('d9H5Title'), text: X.d9H5Text, tone: 'mixed' }
    }
    return { id, title: ttl('d9HouseTitle'), text: X.d9DefText, tone: 'neutral' }
  }
  if (code === 'D2') {
    if (house === 8 || house === 12) {
      return { id, title: ttl('d2HouseTitle'), text: X.d2DusText, tone: 'mixed' }
    }
    if (house === 4 || house === 5) {
      return { id, title: ttl('d2HouseTitle'), text: X.d2H45Text, tone: 'mixed' }
    }
    if (house === 11) {
      return { id, title: ttl('d2H11Title'), text: X.d2H11Text, tone: 'supportive' }
    }
    return { id, title: ttl('d2HouseTitle'), text: X.d2DefText, tone: 'neutral' }
  }
  // D10
  if (house === 8) {
    return {
      id,
      title: fill(T.circuitD10H8Title, { name }),
      text: T.circuitD10H8Text,
      tone: 'challenging',
    }
  }
  if (house === 12) {
    return { id, title: ttl('d10H12Title'), text: T.circuitD10H12Text, tone: 'challenging' }
  }
  if (house === 3) {
    return { id, title: ttl('d10H3Title'), text: T.circuitD10H3Text, tone: 'mixed' }
  }
  if (house === 5 || house === 11) {
    return { id, title: ttl('d10HouseTitle'), text: T.circuitD10H511Text, tone: 'supportive' }
  }
  if (house === 1 || house === 10) {
    return { id, title: ttl('d10HouseTitle'), text: T.circuitD10H110Text, tone: 'mixed' }
  }
  return { id, title: ttl('d10HouseTitle'), text: T.circuitD10HDefText, tone: 'neutral' }
}

function buildCircuit(analysis: DashamsaAnalysis, chart: ChartOutput, lang: EngineLang = 'en'): DashamsaCircuitPractical {
  const T = d10pText(lang)
  let relationshipFlagsOverride: CircuitNote[] | null = null
  const path = chart.dashas?.vimshottari ? getDashaPathAt(chart.dashas.vimshottari) : []
  const lords = path.map((n) => n.lord as GrahaId).slice(0, 4)

  const meta: { code: CircuitVargaCode; title: string; represents: string }[] = [
    { code: 'D3', title: T.circuitLayerD3Title, represents: T.circuitLayerD3Rep },
    { code: 'D7', title: T.circuitLayerD7Title, represents: T.circuitLayerD7Rep },
    { code: 'D10', title: T.circuitLayerD10Title, represents: T.circuitLayerD10Rep },
    { code: 'D9', title: T.circuitLayerD9Title, represents: T.circuitLayerD9Rep },
    { code: 'D2', title: T.circuitLayerD2Title, represents: T.circuitLayerD2Rep },
  ]

  const layers: CircuitLayer[] = meta.map(({ code, title, represents }) => {
    if (code === 'D10') {
      const lagnaOcc = occupantsInHouse(analysis.planets, 1).map((p) => p.name)
      const dashaNotes: CircuitNote[] = lords.map((lord, levelIndex) => {
        const row = analysis.planets.find((p) => p.id === lord)
        if (!row) {
          return {
            id: `d10-miss-${lord}-L${levelIndex}`,
            title: gName(lord, lang),
            text: T.circuitPlacementMissing,
            tone: 'neutral',
          }
        }
        return dashaHouseNote('D10', lord, row.d10House, lang, levelIndex)
      })
      const staticNotes: CircuitNote[] = []
      const ju = analysis.planets.find((p) => p.id === 'Ju')
      const ve = analysis.planets.find((p) => p.id === 'Ve')
      const su = analysis.planets.find((p) => p.id === 'Su')
      if (ju && ve && ju.d10House === ve.d10House) {
        staticNotes.push({
          id: 'd10-ju-ve',
          title: T.circuitD10JuVeTitle,
          text: fill(T.circuitD10JuVeText, { house: String(ju.d10House) }),
          tone: 'challenging',
        })
      }
      if (ju && su && ve && [ju, su, ve].every((p) => p.d10House === ju.d10House)) {
        staticNotes.push({
          id: 'd10-ju-su-ve',
          title: T.circuitD10JuSuVeTitle,
          text: T.circuitD10JuSuVeText,
          tone: 'challenging',
        })
      }
      const ketu = analysis.planets.find((p) => p.id === 'Ke')
      if (ketu && ketu.d10House === 1) {
        staticNotes.push({
          id: 'd10-ketu-lagna',
          title: T.comboKetuLagnaTitle,
          text: T.circuitD10KetuLagnaText,
          tone: 'mixed',
        })
      }
      return {
        code,
        title,
        represents,
        available: true,
        lagnaName: analysis.d10LagnaName,
        lagnaOccupants: lagnaOcc,
        dashaNotes,
        staticNotes,
      }
    }

    const slice = vargaSlice(chart, code)
    if (!slice) {
      return {
        code,
        title,
        represents,
        available: false,
        lagnaName: null,
        lagnaOccupants: [],
        dashaNotes: [],
        staticNotes: [{
          id: `${code}-missing`,
          title: fill(T.circuitVargaMissing, { code }),
          text: fill(T.circuitVargaMissingText, { code }),
          tone: 'neutral',
        }],
      }
    }

    const lagnaOcc = occupantsAtHouse(slice.grahas, slice.asc, 1)
    const dashaNotes = lords.map((lord, levelIndex) => {
      const g = slice.grahas.find((p) => p.id === lord)
      if (!g) {
        return {
          id: `${code}-miss-${lord}-L${levelIndex}`,
          title: gName(lord, lang),
          text: fill(T.circuitPlacementMissingCode, { code }),
          tone: 'neutral' as CareerTone,
        }
      }
      return dashaHouseNote(code, lord, houseFrom(slice.asc, g.rashi), lang, levelIndex)
    })

    const staticNotes: CircuitNote[] = []
    if (code === 'D7') {
      const ju = lagnaOcc.find((g) => g.id === 'Ju')
      const su = lagnaOcc.find((g) => g.id === 'Su')
      if (ju && su) {
        staticNotes.push({
          id: 'd7-ju-su-lagna',
          title: T.circuitD7JuSuLagna,
          text: fill(T.circuitD7JuSuText, { rashi: rName(slice.asc, lang) }),
          tone: 'challenging',
        })
      }
      const ra = slice.grahas.find((g) => g.id === 'Ra')
      const sa = slice.grahas.find((g) => g.id === 'Sa')
      if (ra && houseFrom(slice.asc, ra.rashi) === 7) {
        staticNotes.push({
          id: 'd7-rahu-7',
          title: T.circuitD7Rahu7Title,
          text: T.circuitD7Rahu7Text,
          tone: 'challenging',
        })
      }
      if (sa && houseFrom(slice.asc, sa.rashi) === 10) {
        staticNotes.push({
          id: 'd7-sa-10',
          title: T.circuitD7Sa10Title,
          text: T.circuitD7Sa10Text,
          tone: 'mixed',
        })
      }
      const ve = slice.grahas.find((g) => g.id === 'Ve')
      const juG = slice.grahas.find((g) => g.id === 'Ju')
      if (ve && juG) {
        const vh = houseFrom(slice.asc, ve.rashi)
        const jh = houseFrom(slice.asc, juG.rashi)
        const diff = Math.abs(vh - jh)
        if (diff === 5 || diff === 7) {
          // 6-8 from each other: houses differ by 5 or 7? 6th from A is +5, 8th is +7
          staticNotes.push({
            id: 'd7-ju-ve-68',
            title: T.circuitD7JuVe68Title,
            text: T.circuitD7JuVe68Text,
            tone: 'challenging',
          })
        }
      }
    }
    if (code === 'D9') {
      const ve = slice.grahas.find((g) => g.id === 'Ve')
      if (ve && (houseFrom(slice.asc, ve.rashi) === 1 || ve.rashi === 11)) {
        staticNotes.push({
          id: 'd9-ve-cheat',
          title: T.circuitD9VeCheatTitle,
          text: T.circuitD9VeCheatText,
          tone: 'challenging',
        })
      }
    }
    if (code === 'D3') {
      const sa = lagnaOcc.find((g) => g.id === 'Sa')
      if (sa) {
        staticNotes.push({
          id: 'd3-sa-lagna',
          title: T.circuitD3SaLagnaTitle,
          text: T.circuitD3SaLagnaText,
          tone: 'challenging',
        })
      }
    }

    return {
      code,
      title,
      represents,
      available: true,
      lagnaName: rName(slice.asc, lang),
      lagnaOccupants: lagnaOcc.map((g) => gName(g.id, lang)),
      dashaNotes,
      staticNotes,
    }
  })

  // Mind fears from D3 static afflictions
  const mindFears: CircuitNote[] = []
  const d3 = vargaSlice(chart, 'D3')
  if (d3) {
    const moon = d3.grahas.find((g) => g.id === 'Mo')
    if (moon && (WEAK.includes(moon.dignity) || [6, 8, 12].includes(houseFrom(d3.asc, moon.rashi)))) {
      mindFears.push({
        id: 'fear-moon',
        title: T.circuitFearMoonTitle,
        text: T.circuitFearMoonText,
        tone: 'challenging',
      })
    }
    const rahu = d3.grahas.find((g) => g.id === 'Ra')
    if (rahu && (WEAK.includes(rahu.dignity) || [6, 8, 12].includes(houseFrom(d3.asc, rahu.rashi)))) {
      mindFears.push({
        id: 'fear-rahu',
        title: T.circuitFearRahuTitle,
        text: T.circuitFearRahuText,
        tone: 'challenging',
      })
    }
    const ketu = d3.grahas.find((g) => g.id === 'Ke')
    if (ketu && [6, 8, 12, 1].includes(houseFrom(d3.asc, ketu.rashi))) {
      mindFears.push({
        id: 'fear-ketu',
        title: T.circuitFearKetuTitle,
        text: T.circuitFearKetuText,
        tone: 'challenging',
      })
    }
    if (occupantsAtHouse(d3.grahas, d3.asc, 12).length >= 2) {
      mindFears.push({
        id: 'fear-12',
        title: T.circuitFear12Title,
        text: T.circuitFear12Text,
        tone: 'challenging',
      })
    }
    if (occupantsAtHouse(d3.grahas, d3.asc, 8).length >= 2) {
      mindFears.push({
        id: 'fear-8',
        title: T.circuitFear8Title,
        text: T.circuitFear8Text,
        tone: 'challenging',
      })
    }
  }

  // Relationship flags across D7/D9/D10. The keyword test reads English
  // text, so Hindi takes the same note ids the English run selects.
  if (lang !== 'en') {
    const enAnalysis = analyzeDashamsa(chart)
    const enIds = enAnalysis ? buildCircuit(enAnalysis, chart, 'en').relationshipFlags.map((n) => n.id) : []
    const all = new Map(layers.flatMap((l) => [...l.staticNotes, ...l.dashaNotes]).map((n) => [`rel-${n.id}`, n]))
    relationshipFlagsOverride = enIds.map((id) => ({ ...all.get(id)!, id })).filter((n) => n.title !== undefined)
  }
  const relationshipFlags: CircuitNote[] = []
  for (const layer of layers) {
    for (const n of [...layer.staticNotes, ...layer.dashaNotes]) {
      if (
        /partner|relationship|cheat|Venus|extra person|children|pregnancy|bond|love|workplace partner/i.test(
          `${n.title} ${n.text}`,
        )
        && (n.tone === 'challenging' || n.tone === 'mixed')
      ) {
        relationshipFlags.push({ ...n, id: `rel-${n.id}` })
      }
    }
  }
  // Dedupe by title
  const seenRel = new Set<string>()
  const relUnique = relationshipFlagsOverride ?? relationshipFlags.filter((n) => {
    if (seenRel.has(n.title)) return false
    seenRel.add(n.title)
    return true
  }).slice(0, 8)

  // Job disruption
  const d10EighthLords = lords.filter((lord) => {
    const row = analysis.planets.find((p) => p.id === lord)
    return row?.d10House === 8
  })
  const inEighth = analysis.planets.filter((p) => p.d10House === 8).map((p) => p.id)
  const flavorDefs: Omit<JobLossFlavor, 'active'>[] = [
    { id: 'Ma', name: gName('Ma', lang), nature: T.jobLossMaNature },
    { id: 'Sa', name: gName('Sa', lang), nature: T.jobLossSaNature },
    { id: 'Me', name: gName('Me', lang), nature: T.jobLossMeNature },
    { id: 'Su', name: gName('Su', lang), nature: T.jobLossSuNature },
  ]
  const flavors: JobLossFlavor[] = flavorDefs.map((f) => ({
    ...f,
    active: d10EighthLords.includes(f.id) || (inEighth.includes(f.id) && lords.includes(f.id)),
  }))

  const jobActive = d10EighthLords.length > 0 || lords.some((l) => {
    const row = analysis.planets.find((p) => p.id === l)
    return row?.d10House === 12
  })

  // Sync: count challenging notes across available layers
  const available = layers.filter((l) => l.available)
  const challengeCounts = available.map((l) =>
    [...l.dashaNotes, ...l.staticNotes].filter((n) => n.tone === 'challenging').length,
  )
  const supportCounts = available.map((l) =>
    [...l.dashaNotes, ...l.staticNotes].filter((n) => n.tone === 'supportive').length,
  )
  const mostlyChallenge = challengeCounts.filter((c) => c > 0).length >= Math.min(3, available.length)
  const mostlySupport = supportCounts.filter((c) => c > 0).length >= Math.min(3, available.length) && !mostlyChallenge
  const synced = mostlyChallenge || mostlySupport
  const syncVerdict = {
    synced,
    theme: mostlyChallenge
      ? T.circuitSyncStrainTheme
      : mostlySupport
        ? T.circuitSyncOppTheme
        : T.circuitSyncMixedTheme,
    detail: synced ? T.circuitSyncStrainDetail : T.circuitSyncMixedDetail,
  }

  return {
    framing: T.circuitFraming,
    sequence: [T.circuitSeq0, T.circuitSeq1, T.circuitSeq2, T.circuitSeq3, T.circuitSeq4, T.circuitSeq5],
    layers,
    syncVerdict,
    relationshipFlags: relUnique,
    jobDisruption: {
      active: jobActive,
      headline: jobActive ? T.circuitJobHeadlineActive : T.circuitJobHeadlineQuiet,
      flavors,
      caveat: T.circuitJobCaveat,
    },
    mindFears,
    practiceAdvice: [
      T.circuitPractice0,
      T.circuitPractice1,
      T.circuitPractice2,
      T.circuitPractice3,
      T.circuitPractice4,
      T.circuitPractice5,
      T.circuitPractice6,
    ],
  }
}

function buildSurvival(analysis: DashamsaAnalysis, lang: EngineLang = 'en'): DashamsaSurvivalPractical {
  const T = d10pText(lang)
  const byId = new Map(analysis.planets.map((p) => [p.id, p]))
  const lagna = analysis.d10Lagna
  const moonOnLagna = analysis.planets.some((p) => p.id === 'Mo' && p.d10House === 1)
  const ketuOnLagna = analysis.planets.some((p) => p.id === 'Ke' && p.d10House === 1)
  const cancerRising = lagna === 4
  const eighthDasha = (analysis.dashaOverlay?.lords ?? []).some((l) => l.d10House === 8 || l.d10House === 12)
  const moonSa = (() => {
    const mo = byId.get('Mo')
    const sa = byId.get('Sa')
    return Boolean(mo && sa && mo.d10Rashi === sa.d10Rashi)
  })()
  const overconfident = analysis.planets.filter((p) => [1, 10].includes(p.d10House) && STRONG.includes(p.d10Dignity)).length >= 2
    && analysis.planets.some((p) => p.d10House === 8 || p.d10House === 12)

  const flags: SurvivalFlag[] = [
    {
      id: 'cancer-toxic',
      title: T.survFlagCancerTitle,
      matched: cancerRising,
      detail: cancerRising
        ? moonOnLagna
          ? T.survFlagCancerMoon
          : T.survFlagCancerNoMoon
        : T.survFlagCancerNo,
      tone: cancerRising ? 'challenging' : 'neutral',
    },
    {
      id: 'ketu-lost',
      title: T.survFlagKetuTitle,
      matched: ketuOnLagna,
      detail: ketuOnLagna ? T.survFlagKetuYes : T.survFlagKetuNo,
      tone: ketuOnLagna ? 'challenging' : 'neutral',
    },
    {
      id: 'vishad',
      title: T.survFlagVishadTitle,
      matched: moonSa,
      detail: moonSa ? T.survFlagVishadYes : T.survFlagVishadNo,
      tone: moonSa ? 'challenging' : 'neutral',
    },
    {
      id: 'cutter-dasha',
      title: T.survFlagCutterTitle,
      matched: eighthDasha,
      detail: eighthDasha ? T.survFlagCutterYes : T.survFlagCutterNo,
      tone: eighthDasha ? 'challenging' : 'neutral',
    },
    {
      id: 'overconfidence',
      title: T.survFlagOverconfTitle,
      matched: overconfident,
      detail: overconfident ? T.survFlagOverconfYes : T.survFlagOverconfNo,
      tone: overconfident ? 'challenging' : 'neutral',
    },
  ]

  const matchedDrain = flags.filter((f) => f.matched).length
  const risk: CareerTone = matchedDrain >= 3 ? 'challenging' : matchedDrain >= 1 ? 'mixed' : 'supportive'

  const geminiHit = lagna === 3 || analysis.planets.filter((p) => p.d10Rashi === 3).length >= 2
  const virgoHit = lagna === 6 || analysis.planets.filter((p) => p.d10Rashi === 6).length >= 2
  const leoHit = lagna === 5 || analysis.planets.filter((p) => p.d10Rashi === 5).length >= 2
  const aquHit = lagna === 11 || analysis.planets.filter((p) => p.d10Rashi === 11).length >= 2
  const sun = byId.get('Su')
  const rahu = byId.get('Ra')

  const distinctions: SignDistinction[] = [
    {
      id: 'ge-vi',
      left: T.survDistGeViLeft,
      right: T.survDistGeViRight,
      rule: T.survDistGeViRule,
      relevant: geminiHit || virgoHit,
    },
    {
      id: 'le-aq',
      left: T.survDistLeAqLeft,
      right: T.survDistLeAqRight,
      rule: T.survDistLeAqRule,
      relevant: leoHit || aquHit,
    },
    {
      id: 'su-ra',
      left: T.survDistSuRaLeft,
      right: T.survDistSuRaRight,
      rule: T.survDistSuRaRule,
      relevant: Boolean(sun || rahu),
    },
    {
      id: 'ra-ke-floor',
      left: T.survDistRaKeLeft,
      right: T.survDistRaKeRight,
      rule: T.survDistRaKeRule,
      relevant: analysis.planets.some((p) => (p.id === 'Ra' || p.id === 'Ke') && p.d10Rashi === 7),
    },
    {
      id: '6-12',
      left: T.survDist612Left,
      right: T.survDist612Right,
      rule: T.survDist612Rule,
      relevant: analysis.planets.some((p) => p.d10House === 6 || p.d10House === 12),
    },
  ]

  const allCombos = buildCombos(analysis, lang)
  const extraCombos = allCombos.filter((c) =>
    ['fluid', 'delivery-apps', 'multi-biz', 've-ke', 'ketu-lagna', 'libra-rahu-floor', 'wfhome', 'lagna-lord-7', 'influencer'].includes(c.id),
  )

  const lagnaOcc = occupantsInHouse(analysis.planets, 1)
  const hardHeaded = lagnaOcc.some((p) => p.id === 'Su' || p.id === 'Ma')
    && lagnaOcc.some((p) => p.id === 'Su' || p.id === 'Sa' || p.id === 'Ma')

  const partnership: DashamsaSurvivalPractical['partnership'] = {
    method: T.survPartnershipMethod,
    rules: [
      { id: 'su-sa', pair: T.survPartnerSuSa, effect: T.survPartnerSuSaFx, tone: 'challenging' },
      { id: 've-ma', pair: T.survPartnerVeMa, effect: T.survPartnerVeMaFx, tone: 'supportive' },
      { id: 'sa-ma', pair: T.survPartnerSaMa, effect: T.survPartnerSaMaFx, tone: 'challenging' },
      { id: 'su-ve', pair: T.survPartnerSuVe, effect: T.survPartnerSuVeFx, tone: 'challenging' },
      { id: 'su-me', pair: T.survPartnerSuMe, effect: T.survPartnerSuMeFx, tone: 'mixed' },
    ],
    hardHeaded,
    hardHeadedNote: hardHeaded ? T.survHardHeadYes : T.survHardHeadNo,
  }

  return {
    framing: T.survivalFraming,
    threeLayer: T.survivalThreeLayer,
    d10VsD9: T.survivalD10VsD9,
    distinctions,
    extraCombos,
    energyDrain: {
      risk,
      headline:
        risk === 'challenging'
          ? T.survDrainHeadlineHigh
          : risk === 'mixed'
            ? T.survDrainHeadlineMid
            : T.survDrainHeadlineLow,
      bulletRule: T.survBulletRule,
      recoveryNote: T.survRecoveryNote,
      flags,
    },
    helpability: {
      good: [T.survHelpGood0, T.survHelpGood1, T.survHelpGood2, T.survHelpGood3],
      bad: [T.survHelpBad0, T.survHelpBad1, T.survHelpBad2],
      text: T.survHelpText,
    },
    partnership,
    sunHouseGuide: [
      { house: 1, role: T.survSunH1 },
      { house: 3, role: T.survSunH3 },
      { house: 5, role: T.survSunH5 },
      { house: 6, role: T.survSunH6 },
      { house: 7, role: T.survSunH7 },
      { house: 10, role: T.survSunH10 },
    ],
    takeaways: [
      T.survTake0,
      T.survTake1,
      T.survTake2,
      T.survTake3,
      T.survTake4,
      T.survTake5,
      T.survTake6,
    ],
  }
}

/** Practical classroom layer on top of core Dashamsha analysis. */
export function buildDashamsaPractical(
  analysis: DashamsaAnalysis,
  chart: ChartOutput,
  lang: EngineLang = 'en',
): DashamsaPractical {
  return {
    karma: buildKarma(analysis, lang),
    sectors: buildSectors(analysis, lang),
    pending: buildPending(analysis, lang),
    bondage: buildBondage(analysis, lang),
    karmaYoga: buildKarmaYoga(analysis, chart, lang),
    circuit: buildCircuit(analysis, chart, lang),
    survival: buildSurvival(analysis, lang),
  }
}
