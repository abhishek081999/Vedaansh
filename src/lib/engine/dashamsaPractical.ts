// ─────────────────────────────────────────────────────────────
//  src/lib/engine/dashamsaPractical.ts
//  Practical D10 — karma verticals, recognition, sign sectors
//  Classroom / survival-series techniques (modern counseling)
// ─────────────────────────────────────────────────────────────

import type { ChartOutput, Dignity, GrahaData, GrahaId, Rashi } from '@/types/astrology'
import { GRAHA_NAMES, RASHI_NAMES, RASHI_SHORT } from '@/types/astrology'
import type {
  CareerTone,
  DashamsaAnalysis,
  DashamsaPlanetRow,
} from '@/lib/engine/dashamsaAnalysis'
import { getDashaPathAt } from '@/lib/engine/dasha/current'

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
    headline: 'Do-or-die initiation — build from garage',
    flavor: 'Extremely competitive; start small, climb hard; impulsive launch energy; warriors vs those who choke.',
    industries: ['Mechanics / bare parts', 'Sales from scratch', 'Founders / own firm', 'Engineering grind without status'],
    caution: 'Ventures often die in 3–4 months from cash burn, poor strategy, or no resources — luxury offices are not this path.',
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

/** Planet charity hints for 2-6-10 pending karma. */
const PLANET_CHARITY: Record<GrahaId, string> = {
  Su: 'Wheat, copper, help to father-figures / government workers; Sunday dana',
  Mo: 'Milk, rice, white cloth, care for mothers/children; Monday emotional service',
  Ma: 'Red lentils, tools, blood-donation drives (medical context), help laborers',
  Me: 'Books, stationery, green items, support students / clerks',
  Ju: 'Turmeric, yellow cloth, education fees, cow/gaushala support',
  Ve: 'Sweets, clothes, shringar/adornment for Devi, support to women artisans',
  Sa: 'Black sesame, iron, shoes, wages/food for cleaners and elderly workers',
  Ra: 'Unusual/mixed dana at crossroads; help outsiders / displaced people',
  Ke: 'Blankets, temple seva, dogs/strays, quiet anonymous giving',
  Ur: 'Unusual tech/community dana',
  Ne: 'Quiet compassion dana',
  Pl: 'Crisis-fund support',
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
  label: string,
  labelSa: string,
  meaning: string,
  asc: Rashi,
  planets: DashamsaPlanetRow[],
): KarmaVerticalSlice {
  const themes: Record<number, string> = {
    1: 'Self / body of this vertical',
    4: 'Emotional base / Matri themes',
    5: 'Creativity / helping through voice or status',
    6: 'Service / conflict / orphans-of-resource themes',
    8: 'Hidden support / father–line emotion',
    10: 'Public karma of this vertical',
    11: 'Gains desired by this vertical',
  }
  const focusHouses = [1, 4, 5, 6, 8, 10]
  const houseNotes = focusHouses.map((house) => {
    const occ = planets.filter((p) => houseFrom(asc, p.d10Rashi) === house)
    const names = occ.map((p) => p.name).join(', ') || '—'
    let note = themes[house] ?? `House ${house}`
    if (house === 8 && id === 'soul') note = '8th from Sun — father’s emotional support / expression patterns'
    if (house === 8 && id === 'mind') note = '8th from Moon — father ↔ paternal grandmother support lore'
    if (house === 6 && id === 'mind') note = '6th from Moon — service to those who lost childhood/resources'
    return {
      house,
      theme: themes[house] ?? `H${house}`,
      occupants: names,
      note,
    }
  })
  const h1 = houseNotes[0]!
  const summary = `${label} vertical rises in ${RASHI_NAMES[asc]}. H1: ${h1.occupants}. Read 4/5/6/8 for rin and attachment patterns.`
  return { id, label, labelSa, ascRashi: asc, ascName: RASHI_NAMES[asc], meaning, houseNotes, summary }
}

function buildRecognition(analysis: DashamsaAnalysis): RecognitionReading {
  const sun = analysis.planets.find((p) => p.id === 'Su')
  const ju = analysis.planets.find((p) => p.id === 'Ju')
  const mo = analysis.planets.find((p) => p.id === 'Mo')
  const lagnaLord = analysis.keyLords[0]

  const factors = [
    {
      id: 'sun',
      label: 'Sun strong',
      ok: Boolean(sun && (STRONG.includes(sun.d10Dignity) || [1, 5, 9, 10].includes(sun.d10House))),
      detail: sun
        ? `Sun in ${sun.d10RashiName} H${sun.d10House} (${sun.d10Dignity.replace(/_/g, ' ')})`
        : 'Sun missing',
    },
    {
      id: 'jupiter',
      label: 'Jupiter strong',
      ok: Boolean(ju && (STRONG.includes(ju.d10Dignity) || [1, 5, 9, 11].includes(ju.d10House))),
      detail: ju
        ? `Jupiter in ${ju.d10RashiName} H${ju.d10House} (${ju.d10Dignity.replace(/_/g, ' ')})`
        : 'Jupiter missing',
    },
    {
      id: 'moon',
      label: 'Moon well-placed',
      ok: Boolean(mo && !WEAK.includes(mo.d10Dignity) && ![6, 8, 12].includes(mo.d10House)),
      detail: mo
        ? `Moon in ${mo.d10RashiName} H${mo.d10House} (${mo.d10Dignity.replace(/_/g, ' ')})`
        : 'Moon missing',
    },
    {
      id: 'lagna',
      label: 'Lagna / lagna lord strong',
      ok: Boolean(
        analysis.lagnaVargottama
        || (lagnaLord && (STRONG.includes(lagnaLord.d10Dignity) || [1, 4, 7, 10].includes(lagnaLord.d10House))),
      ),
      detail: lagnaLord
        ? `Lagna lord ${lagnaLord.name} H${lagnaLord.d10House}${analysis.lagnaVargottama ? ' · Vargottama lagna' : ''}`
        : 'Lagna lord missing',
    },
  ]

  const okCount = factors.filter((f) => f.ok).length
  const score = Math.round((okCount / 4) * 100)

  const thanklessNotes: string[] = []
  const capPlanets = analysis.planets.filter((p) => p.d10Rashi === 10)
  if (capPlanets.length >= 2) {
    thanklessNotes.push(
      `${capPlanets.length} planets in Capricorn (D10) — hard work with risk of “used then discarded” credit patterns.`,
    )
  }
  const sa = analysis.planets.find((p) => p.id === 'Sa')
  if (sa) {
    if (sa.d10House === 10) thanklessNotes.push('Saturn in D10 10th — career credit often delayed or taken by others.')
    if (sa.d10House === 4) thanklessNotes.push('Saturn in D10 4th — domestic / mother’s load under-appreciated.')
    if (sa.d10House === 7) thanklessNotes.push('Saturn in D10 7th — partners may take work for granted.')
    if (sa.d10Rashi === 10) thanklessNotes.push('Saturn in Capricorn — boundary-mark labor; status comes late if at all.')
  }
  if (analysis.d10Lagna === 10) {
    thanklessNotes.push('Capricorn D10 lagna — rise is real, but thankless chapters are common unless recognition factors fire.')
  }

  let tone: CareerTone = 'mixed'
  let headline = 'Recognition mixed — strengthen Sun–Jupiter–Moon–Lagna together'
  let text = 'Classroom rule: recognition is near-certain only when Sun, Jupiter, Moon, and Lagna are all supportive in D10.'
  if (okCount >= 4) {
    tone = 'supportive'
    headline = 'Recognition highly supported (all four factors)'
    text = 'Sun + Jupiter + Moon + Lagna align — due credit for karma is strongly indicated.'
  } else if (okCount === 3) {
    tone = 'supportive'
    headline = 'Recognition likely with one soft spot'
    text = 'Three of four recognition pillars are up — polish the weak factor and watch 11th-lord dasha.'
  } else if (okCount <= 1 && thanklessNotes.length) {
    tone = 'challenging'
    headline = 'Thankless-work pattern risk'
    text = 'Few recognition pillars with Capricorn/Saturn weight — expect effort without applause unless dasha lifts the four factors.'
  } else if (okCount <= 1) {
    tone = 'challenging'
    headline = 'Recognition not guaranteed yet'
    text = 'Strengthen pillars are soft — deliver excellence, but do not expect automatic credit.'
  }

  return { tone, score, headline, text, factors, thanklessNotes }
}

function buildSecondHouse(analysis: DashamsaAnalysis): SecondHouseKarma {
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
  if (speechBased) tips.push('Lagna lord tied to 2nd — profession leans on speech: teaching, law, politics, spokesperson roles.')
  if (lineage) tips.push('2nd–11th link — family/legacy business or lineage work often continues.')
  if (occ.some((o) => o.id === 'Mo')) tips.push('Moon in 2nd — philosophy, fiction, astrology, mass communication flavor.')
  if (occ.some((o) => o.id === 'Ra')) tips.push('Rahu in 2nd — family jealousy, possession fights, or weak emotional support at home.')
  if (occ.length === 0) tips.push('Empty 2nd — read 2nd lord carefully for speech and stored career wealth.')

  const text = [
    `D10 2nd in ${h2.rashiName}: speech in karma, lineage work, and stored career wealth — not bank balance alone.`,
    lord ? `2nd lord ${lord.name} in H${lord.d10House} (${lord.digpala.name}).` : '',
    occ.length ? `Occupants: ${occ.map((o) => o.name).join(', ')}.` : 'No planets in 2nd.',
  ].filter(Boolean).join(' ')

  return {
    occupants: occ.map((o) => o.name),
    lordNote: lord ? `${lord.name} in H${lord.d10House}` : '—',
    speechBased,
    lineageLink: lineage,
    text,
    tips,
  }
}

function buildDesireFear(analysis: DashamsaAnalysis): DesireFearAxis {
  const pack = <H extends 6 | 8 | 11>(house: H, label: string, base: string) => {
    const occ = occupantsInHouse(analysis.planets, house)
    const lord = lordOfHouse(analysis, house)
    return {
      house,
      occupants: occ.map((p) => `${p.name} (${p.d10RashiShort})`),
      lordNote: lord
        ? `${label} lord ${lord.name} in H${lord.d10House} · ${lord.digpala.name}`
        : `${label} lord unavailable`,
      text: base,
    }
  }
  return {
    desire: pack(11, '11th', 'Icchā pūrti — karma you WANT to do (personal desire, not only destiny assignment).'),
    fear: pack(8, '8th', 'Karma you fear or keep secret — few know; also hidden wealth / bribery when tied to money houses.'),
    prarabdha: pack(6, '6th', 'Prārabdha — must be endured from childhood patterns; rivalry, errands, obsessive completion, public criticism.'),
  }
}

function natalLon(p: DashamsaPlanetRow): number {
  return (p.d1Rashi - 1) * 30 + p.d1Degree
}

function angleDiff(a: number, b: number): number {
  const d = Math.abs(a - b) % 360
  return d > 180 ? 360 - d : d
}

function buildMoonMind(analysis: DashamsaAnalysis): MoonLagnaMind {
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

  let sukhNote =
    '4th from Moon-as-lagna = sukha the mind seeks through career entanglement.'
  if (sukh.some((p) => p.id === 'Ve' || p.id === 'Me')) {
    sukhNote +=
      ' Venus/Mercury here — happiness sought via relationships, money, desires.'
    if (sukh.some((p) => p.d10Rashi === 8)) {
      sukhNote +=
        ' Scorpio flavor — sought happiness may bring confusion, prolonged scars rather than true sukha.'
    }
  } else if (sukh.length === 0) {
    sukhNote += ' Empty 4th from Moon — read the 4th lord from Moon for comfort style.'
  }

  let twelfthNote =
    '12th from Moon = bulb’s own shadow — disturbances too close to see; hard to articulate why the mind is restless.'
  if (twelfth.some((p) => p.id === 'Ke')) {
    twelfthNote =
      'Ketu in 12th from Moon — mind chases desire fulfillment; poor sleep until wants are met; unrest feels “unsolvable.”'
  }

  const fireNote = fireInitiative
    ? 'Fire signs on Moon-lagna kendras/trines (1/5/9) — mind constantly initiates career moves; cannot stay passive.'
    : 'Fire initiative on Moon-lagna axis is quieter — less compulsive achievement drive.'

  return {
    moonAsc,
    moonAscName: RASHI_NAMES[moonAsc],
    sukhHouse,
    sukhOccupants: sukh.map((p) => `${p.name} (${p.d10RashiShort})`),
    sukhNote,
    twelfthOccupants: twelfth.map((p) => `${p.name} (${p.d10RashiShort})`),
    twelfthNote,
    fireInitiative,
    fireNote,
  }
}

function buildPending(analysis: DashamsaAnalysis): DashamsaPendingPractical {
  const items: PendingKarmaItem[] = []
  for (const house of [2, 6, 10] as const) {
    for (const p of occupantsInHouse(analysis.planets, house)) {
      let pendingTheme = `Pending karma through ${GRAHA_NAMES[p.id]} significations in D10 H${house}.`
      if (p.id === 'Ke' && house === 2 && p.d10Rashi === 2) {
        pendingTheme =
          'Ketu in D10 2nd Taurus — pending dana of food/resources; distribute food to clear this karma.'
      } else if (house === 2) {
        pendingTheme = `Pending resource/speech karma via ${p.name} in 2nd (${p.d10RashiName}).`
      } else if (house === 6) {
        pendingTheme = `Pending service/rivalry karma via ${p.name} in 6th — must be worked through, not escaped.`
      } else {
        pendingTheme = `Pending career-status karma via ${p.name} in 10th — hard work / dana related to ${p.name}.`
      }
      items.push({
        planetId: p.id,
        planetName: p.name,
        house,
        rashiName: p.d10RashiName,
        pendingTheme,
        charity: PLANET_CHARITY[p.id] ?? 'Dana matching the planet’s nature to the needy.',
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

  if (capLagna) capNotes.push('Capricorn D10 lagna — no ritual shortcut; pure hard work is the remedy.')
  if (saIn10) {
    capNotes.push(
      'Saturn in D10 10th — grinds thoroughly; spiritual credit from 9th does not cancel this pressure.',
    )
  }
  if (saIn11) {
    capNotes.push(
      'Saturn in D10 11th — “whatever you buried will be found”; past effort returns as hard-earned fruit.',
    )
  }
  if (juIn10) {
    capNotes.push(
      'Jupiter in D10 10th — kapha stuck in status swamp; needs Mars heat; toughest projects build lasting strength; workplace may feel toxic yet formative.',
    )
  }

  const capricornHardWork = {
    active: capActive,
    headline: capActive
      ? 'Capricorn / 10–11 grind active — hard work only'
      : 'Capricorn 10–11 grind not dominant',
    text: capActive
      ? 'Classroom rule: Capricorn in D10 (esp. 10th/11th) consumes ritual remedies — do sādhanā through the 9th, then accept 10–11 as grind. Only consistent effort works.'
      : 'No strong Capricorn-on-10/11 signature — ritual + effort both have room.',
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
      title: 'Parashurām yoga (Mars–Saturn in 9th)',
      matched: parashuram,
      severity: parashuram ? 'challenging' : 'neutral',
      detail: parashuram
        ? 'Mars–Saturn on D10 9th — must literally fight for position and dharma path.'
        : 'No Mars–Saturn 9th signature.',
    },
    {
      id: 'moon-saturn',
      title: 'Moon–Saturn within 3°20′',
      matched: moSaOrb <= 3.333,
      severity: moSaOrb <= 3.333 ? 'challenging' : 'neutral',
      detail: moSaOrb <= 3.333
        ? `Orb ${moSaOrb.toFixed(2)}° — depressive / career-anxiety tendency; parental calls may spike upset.`
        : `Moon–Saturn orb ${moSaOrb === 999 ? 'n/a' : `${moSaOrb.toFixed(1)}°`} — outside tight mutual impact.`,
    },
    {
      id: 'venus-rahu',
      title: 'Venus–Rahu healing / medical pull',
      matched: veRaLink,
      severity: 'mixed',
      detail: veRaLink
        ? 'Venus–Rahu link — Śukrācārya recovery guru; strong doctor/healer pull (check Bharani / incision tools).'
        : 'No clear Venus–Rahu medical link in D10.',
    },
    {
      id: 'surgical',
      title: 'Mars–Rahu in 5th · surgical',
      matched: surgical,
      severity: 'mixed',
      detail: surgical
        ? 'Mars–Rahu on 5th — cutting/operating tendency; surgery practice indicator.'
        : 'No Mars–Rahu 5th surgical signature.',
    },
    {
      id: 'doctor-612',
      title: '6–12 / Jupiter service-medicine',
      matched: doc612,
      severity: 'mixed',
      detail: doc612
        ? '6–12 disease/hospital axis or Jupiter on service/status — classic healer / treatment livelihood flavor.'
        : '6–12 medical axis not strongly lit.',
    },
    {
      id: 'ketu-lagna',
      title: 'Ketu in D10 lagna',
      matched: ketuLagna,
      severity: ketuLagna ? 'challenging' : 'neutral',
      detail: ketuLagna
        ? 'Ketu on D10 lagna — success not easy; check dispositor; if dispositor in 6/8/12 or Saturn-aspected, long struggle before rise.'
        : 'Ketu not on D10 lagna.',
    },
    {
      id: 'chhaya',
      title: 'Chhāyāgrasta (Ketu overshadows Sa/Mo)',
      matched: chhaya,
      severity: chhaya ? 'challenging' : 'neutral',
      detail: chhaya
        ? 'Ketu at higher degree than Saturn/Moon nearby — Saturn results weaken even in good dignity.'
        : 'No clear Ketu-over-Saturn/Moon chhāyā pattern.',
    },
    {
      id: 'me-ju',
      title: 'Mercury–Jupiter conjunction',
      matched: meJuConj,
      severity: meJuConj ? 'mixed' : 'neutral',
      detail: meJuConj
        ? 'Me–Ju conjunct — “gold mixed with mercury”; aspect between them is cleaner than conjunction.'
        : 'No Mercury–Jupiter conjunction in D10.',
    },
    {
      id: 've-su',
      title: 'Venus–Sun · fame hunger',
      matched: Boolean(veSuConj),
      severity: 'mixed',
      detail: veSuConj
        ? 'Venus–Sun — desire for prominence/quick achievement; transitions between career points feel sticky.'
        : 'No Venus–Sun conjunction in D10.',
    },
  ]

  const remedies: RemedyCard[] = [
    {
      id: '260',
      title: '2–6–10 pending-karma dana',
      when: 'Any planet in D10 2nd, 6th, or 10th',
      action:
        'Charity matching that planet’s significations — temples, footpaths, traffic signals, office cleaners/plate-takers. Described as a protective “bribe” so the planet stops grinding you.',
    },
    {
      id: 'moon-ketu',
      title: 'Moon–Ketu lagna / emotional backlog',
      when: 'Moon–Ketu on D10 lagna or heavy Moon distress',
      action:
        'Vrindavan / Mathura / Govardhan for Krishna-peace; or Maa Satī Śakti-pīṭha — break coconut, offer water; lifelong when Moon problems flare.',
    },
    {
      id: 'capricorn',
      title: 'Capricorn 10–11',
      when: 'Capricorn lagna or Saturn on D10 10th/11th',
      action:
        'No ritual bypass — consistent hard work + humility (Dakṣa / Śiva story). Puja through 9th; accept 10–11 grind.',
    },
    {
      id: 'food',
      title: 'Annadāna (food)',
      when: 'Ketu/planets in 2nd with Taurus or food-sign flavor',
      action: 'Distribute food at temples / to the needy; Venus–Sun links may add Devī śṛṅgāra offerings.',
    },
  ]

  const methodSteps = [
    'Exact birth details → D10 lagna + occupants first',
    'Trace lord-to-lord circuit from lagna through key houses',
    'Cross-check D1 degrees for tight conjunctions / combustion',
    'Bhāva chalit for cusp shifts; D9 for confirmation',
    'Ashtakavarga / house bala for wealth magnitude (not hype scores alone)',
    'Dasha timing last; confirm with client’s lived feedback loop',
  ]

  return {
    axisRule:
      'CRITICAL: Planets in D10 2nd, 6th, or 10th show PENDING KARMA of that planet — clear via matching charity/dana, not denial.',
    items,
    capricornHardWork,
    flags,
    remedies,
    methodSteps,
  }
}

function buildBonds(analysis: DashamsaAnalysis): KarmicBondNote {
  const h1 = analysis.houses[0]!
  const lagnaLord = analysis.keyLords[0]!
  return {
    d10LagnaSign: analysis.d10Lagna,
    d10LagnaName: analysis.d10LagnaName,
    lagnaLordName: lagnaLord.name,
    lagnaLordHouse: lagnaLord.d10House,
    occupants: h1.occupants.map((o) => o.name),
    text: `People whose D1 (birth) Lagna matches your D10 Lagna sign ${analysis.d10LagnaName} — or who carry the same planetary color as your D10 1st — tend to share food, travel, and heavy life-time with you (friends, boss, spouse, even rivals).`,
    mutualTip: 'Best-friend bond: mutual interchange — your D10 lagna matches their D1 lagna AND their D10 lagna matches your D1 lagna. Also useful for birth-time rectification checks.',
  }
}

function buildKarma(analysis: DashamsaAnalysis): DashamsaKarmaPractical {
  const sun = analysis.planets.find((p) => p.id === 'Su')
  const mo = analysis.planets.find((p) => p.id === 'Mo')
  const sunAsc = (sun?.d10Rashi ?? analysis.d10Lagna) as Rashi
  const moonAsc = (mo?.d10Rashi ?? analysis.d10Lagna) as Rashi

  const verticals: KarmaVerticalSlice[] = [
    buildVertical(
      'body',
      'Body (Śarīra)',
      'शरीर',
      'Lagna-based D10 — karma of the body; whom you physically work and travel with.',
      analysis.d10Lagna,
      analysis.planets,
    ),
    buildVertical(
      'mind',
      'Mind (Manas)',
      'मन',
      'Moon-as-lagna D10 — vṛtti from past life; Matṛ-ṛṇa / motherland debt; mental livelihood style.',
      moonAsc,
      analysis.planets,
    ),
    buildVertical(
      'soul',
      'Soul (Ātman)',
      'आत्मन्',
      'Sun-as-lagna D10 — what binds the soul to material work; power, boundaries, attachment.',
      sunAsc,
      analysis.planets,
    ),
  ]

  return {
    whyToday:
      'Today ~90% of life questions are karma/profession (settled job, fame, assigned work). With no fixed varṇāśrama mold, D10 often outweighs D9 for immediate counseling — D9 still rules fate/marriage fruit.',
    bonds: buildBonds(analysis),
    secondHouse: buildSecondHouse(analysis),
    moonMind: buildMoonMind(analysis),
    verticals,
    desireFear: buildDesireFear(analysis),
    recognition: buildRecognition(analysis),
    takeaways: [
      'Match D10 lagna combinations to others’ D1 lagna for karmic people.',
      '2nd house = speech + lineage karma + stored career wealth.',
      'Moon-as-lagna: 4th = sukha sought; 12th = unsolvable restlessness.',
      'Three verticals: Lagna / Moon-as-lagna / Sun-as-lagna = body, mind, soul rin.',
      '11th = desired karma; 8th = feared/hidden; 6th = unavoidable prārabdha.',
      '2–6–10 planets = pending karma → matching dana; Capricorn 10–11 = hard work only.',
      'Saturn/Capricorn weight = thankless patterns; Sun+Jupiter+Moon+Lagna = recognition.',
    ],
  }
}

function buildCombos(analysis: DashamsaAnalysis): CareerComboHit[] {
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

  return [
    {
      id: 'civil',
      title: 'Sun–Saturn · civil / class infrastructure',
      matched: sameSign('Su', 'Sa'),
      detail: sameSign('Su', 'Sa')
        ? 'Sun–Saturn together in D10 — civil engineering / Grade-A infrastructure flavor.'
        : 'No Sun–Saturn conjunction in D10.',
    },
    {
      id: 'electrical',
      title: 'Mars–Rahu · electrical / defense build',
      matched: sameSign('Ma', 'Ra'),
      detail: sameSign('Ma', 'Ra')
        ? 'Mars–Rahu — electrical, construction heat, injury-prone physical tech.'
        : 'No Mars–Rahu conjunction in D10.',
    },
    {
      id: 'aviation',
      title: 'Mars in Pisces · aviation',
      matched: inSign('Ma', [12]),
      detail: inSign('Ma', [12])
        ? 'Mars in Pisces (D10) — strong aviation / airport / air-crew indicator.'
        : 'Mars not in Pisces in D10.',
    },
    {
      id: 'fashion',
      title: 'Venus prominent · fashion / polish',
      matched: Boolean(byId.get('Ve') && (STRONG.includes(byId.get('Ve')!.d10Dignity) || [1, 7, 10].includes(byId.get('Ve')!.d10House))),
      detail: 'Venus strong or angular in D10 supports fashion, brand, and aesthetic industries.',
    },
    {
      id: 'influencer',
      title: 'Venus–Jupiter + 3/7/11 · reach',
      matched: axis371.length >= 2 && (sameSign('Ve', 'Ju') || (inHouse('Ve', [3, 7, 11]) && inHouse('Ju', [3, 7, 11]))),
      detail: axis371.length
        ? `${axis371.length} planets on 3–7–11 axis — baseline for influencer / wide-reach narratives (Venus–Jupiter preferred over raw Rahu).`
        : 'Weak 3–7–11 occupancy — reach may stay niche.',
    },
    {
      id: 'telecom',
      title: 'Saturn–Rahu · telecom / signals',
      matched: sameSign('Sa', 'Ra'),
      detail: sameSign('Sa', 'Ra')
        ? 'Saturn–Rahu — telecom, SIM, networking-signal work flavor.'
        : 'No Saturn–Rahu conjunction in D10.',
    },
    {
      id: 'bondage',
      title: '6th emphasis · corporate bondage',
      matched: occupantsInHouse(analysis.planets, 6).length >= 2 || inHouse('Sa', [6]),
      detail: 'Heavy 6th = rules, third-party management, emergency analysis — work under systems.',
    },
    {
      id: 'independent',
      title: '12th emphasis · independent / freelance',
      matched: occupantsInHouse(analysis.planets, 12).length >= 1,
      detail: occupantsInHouse(analysis.planets, 12).length
        ? '12th occupancy supports independent / night / foreign freelancing opposite 6th bondage.'
        : 'No 12th emphasis — independence themes are quieter.',
    },
    {
      id: 'medical-ve-ra',
      title: 'Venus–Rahu · healer / doctor pull',
      matched: Boolean(
        byId.get('Ve')
        && byId.get('Ra')
        && (
          byId.get('Ve')!.d10Rashi === byId.get('Ra')!.d10Rashi
          || [1, 5, 9].includes(((byId.get('Ra')!.d10House - byId.get('Ve')!.d10House + 12) % 12) + 1)
        ),
      ),
      detail: 'Venus–Rahu (conjunct or 1/5/9) — recovery-guru flavor; medical / surgical career pull.',
    },
    {
      id: 'jupiter-10',
      title: 'Jupiter in 10th · hard path, lasting strength',
      matched: inHouse('Ju', [10]),
      detail: inHouse('Ju', [10])
        ? 'Jupiter in D10 10th — stuck in status swamp until Mars heat; toughest projects, toxic-but-formative bosses.'
        : 'Jupiter not in D10 10th.',
    },
    {
      id: 'fluid',
      title: 'Mars in Cancer · fluid / marine mechanics',
      matched: inSign('Ma', [4]),
      detail: inSign('Ma', [4])
        ? 'Mars in Cancer — fluid mechanics, boats/submarines, water–fire engineering strain.'
        : 'Mars not in Cancer in D10.',
    },
    {
      id: 'delivery-apps',
      title: 'Mars strong · delivery / transport apps',
      matched: Boolean(byId.get('Ma') && (STRONG.includes(byId.get('Ma')!.d10Dignity) || [1, 3, 6, 10].includes(byId.get('Ma')!.d10House))),
      detail: 'Strong/angular Mars in D10 often lands in Zomato/Swiggy/Uber-style delivery transport stacks.',
    },
    {
      id: 'multi-biz',
      title: 'Mercury in 7th · multiple business attempts',
      matched: inHouse('Me', [7]),
      detail: inHouse('Me', [7])
        ? inSign('Me', [1])
          ? 'Mercury in Aries in 7th — packet energy, no resources; ventures start/stop repeatedly.'
          : 'Mercury in D10 7th — multiple business / partnership attempts; energy comes in packets.'
        : 'Mercury not in D10 7th.',
    },
    {
      id: 've-ke',
      title: 'Venus–Ketu · fuse drain (avoid mix)',
      matched: sameSign('Ve', 'Ke'),
      detail: sameSign('Ve', 'Ke')
        ? 'Venus–Ketu together — monk and relationship energy cancel; drains position and/or married life.'
        : 'Venus and Ketu not conjunct in D10.',
    },
    {
      id: 'ketu-lagna',
      title: 'Ketu on D10 lagna · directionless',
      matched: inHouse('Ke', [1]),
      detail: inHouse('Ke', [1])
        ? 'Ketu on D10 lagna — does not know what to do; skill institutes + placement help often better than solo hunt.'
        : 'Ketu not on D10 lagna.',
    },
    {
      id: 'libra-rahu-floor',
      title: 'Rahu in Libra · high-floor brand aura',
      matched: inSign('Ra', [7]),
      detail: inSign('Ra', [7])
        ? 'Rahu in Libra — upper floors, big-brand aura; won’t leave brand identity for a startup easily.'
        : 'Rahu not in Libra in D10.',
    },
    {
      id: 'libra-ketu-ground',
      title: 'Ketu in Libra · ground-floor work',
      matched: inSign('Ke', [7]) && !sameSign('Ke', 'Mo'),
      detail: inSign('Ke', [7])
        ? 'Ketu in Libra without Moon support — tends to stay ground-floor; Ketu+Moon can still rise.'
        : 'Ketu not in Libra in D10.',
    },
    {
      id: 'wfhome',
      title: 'Saturn in 4th · work from home',
      matched: inHouse('Sa', [4]),
      detail: inHouse('Sa', [4])
        ? 'Saturn in D10 4th — home office / clinic / cloud kitchen; hard to sustain a daily office commute.'
        : 'Saturn not in D10 4th.',
    },
    {
      id: 'lagna-lord-7',
      title: 'Lagna lord in 7th · partner-dependent',
      matched: Boolean(analysis.planets.find((p) => p.id === analysis.keyLords[0]?.id && p.d10House === 7)),
      detail: 'Lagna lord in 7th — livelihood depends on partner; solo platforms safer than random human partners (esp. Aquarius).',
    },
  ]
}

function buildSectors(analysis: DashamsaAnalysis): DashamsaSectorsPractical {
  const lagnaMeta = D10_SIGN_SECTORS[analysis.d10Lagna]
  const lagnaSector: D10SignSector = {
    rashi: analysis.d10Lagna,
    name: analysis.d10LagnaName,
    short: RASHI_SHORT[analysis.d10Lagna],
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
    role: 'D10 Lagna — primary sector flavor',
    sector: lagnaSector,
    planetNames: analysis.houses[0]?.occupants.map((o) => o.name) ?? [],
  })

  for (const [rashi, plist] of byRashi) {
    if (rashi === analysis.d10Lagna && plist.length === 0) continue
    if (plist.length < 2 && rashi !== analysis.d10Lagna) continue
    if (rashi === analysis.d10Lagna) continue
    const meta = D10_SIGN_SECTORS[rashi]
    hits.push({
      rashi,
      name: RASHI_NAMES[rashi],
      role: `${plist.length} planets — secondary sector`,
      sector: { rashi, name: RASHI_NAMES[rashi], short: RASHI_SHORT[rashi], ...meta },
      planetNames: plist.map((p) => p.name),
    })
  }

  // Always include 10th house sign flavor
  const h10 = analysis.houses[9]!
  if (h10.rashi !== analysis.d10Lagna) {
    const meta = D10_SIGN_SECTORS[h10.rashi]
    hits.push({
      rashi: h10.rashi,
      name: h10.rashiName,
      role: 'D10 10th house sign — status sector',
      sector: { rashi: h10.rashi, name: h10.rashiName, short: h10.rashiShort, ...meta },
      planetNames: h10.occupants.map((o) => o.name),
    })
  }

  const houseFlavorNotes = [
    'Always read House (base) + Rashi (flavor) + Planet (delivery) together.',
    'D10 gives SECTOR / industry; Navamsha often shows whether the fruit ripens — learn D10 for interviews, D9 for results.',
    '4th = work-from-home / clinic / cloud kitchen; 5th = social front-end; 6th = bondage under rules; 7th = partnership business; 12th = independent.',
  ]

  const energyNotes = [
    'Check Sthāna bala & Kāla bala — if weak, tell the client their time has not come yet.',
    'Energy drain after layoff is like a bullet left in: better exit near 40% drain than wait for 100%.',
    'Helpable clients ask “which sector / where am I wrong?” — not only “when will the job come?”',
    'Mercury is the most exploited planet in corporate D10 — protect speech and boundaries.',
  ]

  return {
    method: 'Three-layer method: House = base significance · Sign = industry flavor · Planet = delivery agent.',
    lagnaSector,
    hits,
    combos: buildCombos(analysis),
    houseFlavorNotes,
    energyNotes,
  }
}

const INHERITED_META: {
  id: GrahaId
  source: string
  detail: string
  toolHow: string
}[] = [
  {
    id: 'Ma',
    source: 'Ancestral karma (pitṛ)',
    detail:
      'Heat/passion of conception; Mars is never fully “yours” — bloodshed, land, family fights pull the whole lineage.',
    toolHow: 'Navigates bondage with physical strength, courage, and fight.',
  },
  {
    id: 'Ve',
    source: 'DNA / seed (śukra)',
    detail:
      'Nature of the father’s seed in the womb; Venus problems involve kutumb / extended family.',
    toolHow: 'Uses body, family ties, beauty, or finances to move through karma.',
  },
  {
    id: 'Sa',
    source: 'Own individual karma',
    detail:
      'Self-created ṛṇa — when Saturn punishes, it does so alone/in isolation.',
    toolHow: 'Endurance, delay, solitary grind; owns the consequence personally.',
  },
  {
    id: 'Mo',
    source: 'Mother’s manobhāva',
    detail:
      'Mother’s emotional/mental state in conception and pregnancy — what she felt binds the mind.',
    toolHow: 'Feels, nurtures, seeks comfort; mind is the binder to the world.',
  },
  {
    id: 'Su',
    source: 'Father’s condition & life-force',
    detail:
      'Father’s morals, stability, sacrifice, survival force. In D10, Sun is the MOST important for authority and position.',
    toolHow: 'Uses authority, visibility, and responsibility to navigate.',
  },
  {
    id: 'Me',
    source: 'Maternal family (māmā–māmī)',
    detail:
      'Comes through maternal relatives; also speech, intelligence, paperwork.',
    toolHow: 'Talks, analyzes, uses intellect and documents as tools.',
  },
  {
    id: 'Ra',
    source: 'Disturbance / karmic knot',
    detail:
      'Shows which energy is disturbed and what actually pushes the native to act in this life.',
    toolHow: 'Obsession, shortcut, unconventional drive — the itch that forces karma.',
  },
  {
    id: 'Ke',
    source: 'Disturbance / karmic knot',
    detail:
      'Cuts and liberates; pairs with Rahu as the knot that motivates action and detachment.',
    toolHow: 'Detachment, sudden exits, specialist skill without craving spotlight.',
  },
  {
    id: 'Ju',
    source: 'Bhāgya / guru grace (9th)',
    detail:
      'How much nature/divine support and guru-relationships across lives will hold the native.',
    toolHow: 'Counsel, teaching, grace, expansion — walks with mentors when strong.',
  },
]

function strengthHint(p: DashamsaPlanetRow | undefined): InheritedKarmaPlanet['strengthHint'] {
  if (!p) return 'absent'
  const strong = ['exalted', 'moolatrikona', 'own'].includes(p.d10Dignity)
  const weak = ['debilitated', 'great_enemy', 'enemy'].includes(p.d10Dignity)
  const angular = [1, 4, 7, 10].includes(p.d10House)
  if (strong || (angular && !weak)) return 'strong'
  if (weak || [6, 8, 12].includes(p.d10House)) return 'soft'
  return 'mixed'
}

function buildBondage(analysis: DashamsaAnalysis): DashamsaBondagePractical {
  const byId = new Map(analysis.planets.map((p) => [p.id, p]))
  const sector = D10_SIGN_SECTORS[analysis.d10Lagna]
  const h1 = analysis.houses[0]!
  const lagnaLord = analysis.keyLords[0]
  const mo = byId.get('Mo')
  const moonHouseTheme = mo
    ? (analysis.houses[mo.d10House - 1]?.theme ?? `House ${mo.d10House}`)
    : 'Moon placement unavailable'
  const moonSector = mo ? D10_SIGN_SECTORS[mo.d10Rashi] : null

  const inherited: InheritedKarmaPlanet[] = INHERITED_META.map((meta) => {
    const p = byId.get(meta.id)
    const hint = strengthHint(p)
    return {
      id: meta.id,
      name: GRAHA_NAMES[meta.id],
      source: meta.source,
      detail: meta.detail,
      d10House: p?.d10House ?? null,
      d10RashiName: p?.d10RashiName ?? null,
      strengthHint: hint,
      toolNote:
        hint === 'strong'
          ? `Active tool: ${meta.toolHow}`
          : hint === 'soft'
            ? `Soft/pressed: ${meta.toolHow} (expect friction).`
            : hint === 'mixed'
              ? `Available: ${meta.toolHow}`
              : meta.toolHow,
    }
  })

  const moonConj = mo
    ? analysis.planets
      .filter((p) => p.id !== 'Mo' && p.d10Rashi === mo.d10Rashi)
      .map((p) => p.name)
    : []

  const layered: LayeredReading[] = [
    {
      id: 'lagna',
      title: 'D10 Lagna — health of karma',
      priority: 'Most fundamental — if lagna energy is unsatisfied, work never feels happy',
      house: {
        label: 'House 1',
        text: `${h1.theme} Occupants: ${h1.occupants.map((o) => o.name).join(', ') || 'empty'}.`,
      },
      rashi: {
        label: analysis.d10LagnaName,
        text: `${sector.headline}. ${sector.flavor}`,
      },
      planet: {
        label: 'Lagna color',
        text: h1.occupants.length
          ? `Planets on lagna tint the core work: ${h1.occupants.map((o) => o.name).join(', ')}.`
          : 'Empty lagna — core karma speaks through lagna lord and sign flavor more than occupants.',
      },
      synthesis: `Align effort with ${analysis.d10LagnaName} lagna flavor (${sector.industries.slice(0, 3).join(', ')}) — that is the pathway to fulfillment, not a random job title.`,
    },
    {
      id: 'moon',
      title: 'D10 Moon — why the mind took rebirth',
      priority: 'Unfulfilled desire that binds the jīva to the world',
      house: {
        label: mo ? `House ${mo.d10House}` : 'Moon',
        text: mo
          ? `${moonHouseTheme} — desire/entanglement zone of the mind.`
          : 'Moon data missing.',
      },
      rashi: {
        label: mo?.d10RashiName ?? '—',
        text: moonSector
          ? `${moonSector.headline}. ${moonSector.flavor}`
          : 'Sign flavor unavailable.',
      },
      planet: {
        label: 'Conjunctions',
        text: moonConj.length
          ? `Moon joins ${moonConj.join(', ')} — past-life desire flavored by these forces (e.g. Rahu = incomplete obsession).`
          : 'Moon stands relatively alone — desire is clearer, less knotted by companions.',
      },
      synthesis: mo
        ? `Past-life itch sits in D10 H${mo.d10House} ${mo.d10RashiName}${moonConj.length ? ` with ${moonConj.join(', ')}` : ''} — career is a tool to work that desire, not the desire itself.`
        : 'Cannot synthesize Moon desire without placement.',
    },
    {
      id: 'lagna-lord',
      title: 'Lagna lord — how karma is executed',
      priority: 'Expression path of the core work',
      house: {
        label: lagnaLord ? `House ${lagnaLord.d10House}` : '—',
        text: lagnaLord
          ? `${analysis.houses[lagnaLord.d10House - 1]?.theme ?? ''} — stage where lagna energy acts.`
          : 'Lagna lord unavailable.',
      },
      rashi: {
        label: lagnaLord?.d10RashiName ?? '—',
        text: lagnaLord
          ? `${D10_SIGN_SECTORS[lagnaLord.d10Rashi].headline}`
          : '—',
      },
      planet: {
        label: lagnaLord?.name ?? '—',
        text: lagnaLord
          ? `${lagnaLord.name} (${lagnaLord.d10Dignity.replace(/_/g, ' ')}) Digpala ${lagnaLord.digpalaName} — the delivery agent of lagna karma.`
          : '—',
      },
      synthesis: lagnaLord
        ? `Core work (${analysis.d10LagnaName}) executes via ${lagnaLord.name} in H${lagnaLord.d10House} ${lagnaLord.d10RashiName} — read House→Sign→Planet in that order before naming a profession.`
        : 'Lagna lord synthesis pending.',
    },
  ]

  const navigationTools = [
    { planet: 'Mercury', how: 'Talks, intellect, paperwork', active: strengthHint(byId.get('Me')) === 'strong' },
    { planet: 'Mars', how: 'Physical strength / fight', active: strengthHint(byId.get('Ma')) === 'strong' },
    { planet: 'Sun', how: 'Authority / position', active: strengthHint(byId.get('Su')) === 'strong' },
    { planet: 'Venus', how: 'Body, family, finances', active: strengthHint(byId.get('Ve')) === 'strong' },
    { planet: 'Jupiter', how: 'Grace, teaching, counsel', active: strengthHint(byId.get('Ju')) === 'strong' },
    { planet: 'Saturn', how: 'Solo endurance', active: strengthHint(byId.get('Sa')) === 'strong' },
  ]

  return {
    framing:
      'Do not jump to “career title.” First ask: why did this soul take a body? Every embodiment is bondage. Once the core ṛṇa is clear, purpose and livelihood path clarify themselves. People use whatever planetary tools they were given to navigate that bondage.',
    goldenOrder: [
      'HOUSE first — base significance of the field of action',
      'RASHI (sign) second — flavor / industry / style',
      'PLANET third — delivery agent (never start here)',
    ],
    inherited,
    layered,
    navigationTools,
    principles: [
      'Give the chart time — 15–25 minutes of darśan before concluding.',
      'Fewer words, more observation; guessing (“maybe…”) means you are not reading.',
      'Avoid jargon labels (exalted/debilitated as insults) — paint a living picture.',
      'D10 is karma/choice — describe tendencies, avoid hard determinism (unlike some D9 statements).',
      'Whatever drama we enact — violence, power, relationships — all of that is Dashamsha.',
      'Fulfillment comes from aligning effort with D10 lagna energy, not with a random job label.',
      'Do not become mechanical — sync with the chart; synthesis over ChatGPT-style lists.',
    ],
    homework:
      'Take 5–6 known charts. Read D10 lagna first (House→Sign→Planet). Predict core karma/work nature. Verify with them. That practice builds real D10 lagna skill.',
  }
}

const ELEMENT_OF: Record<Rashi, 'fire' | 'earth' | 'air' | 'water'> = {
  1: 'fire', 2: 'earth', 3: 'air', 4: 'water',
  5: 'fire', 6: 'earth', 7: 'air', 8: 'water',
  9: 'fire', 10: 'earth', 11: 'air', 12: 'water',
}

const ELEMENT_LABEL: Record<'fire' | 'earth' | 'air' | 'water', string> = {
  fire: 'Fire (drive / initiation)',
  earth: 'Earth (resources / endurance)',
  air: 'Air (ideas / networks)',
  water: 'Water (care / depth)',
}

/** Short recharge practices keyed by D10 (and D1) lagna sign. */
const LAGNA_RECHARGE: Record<Rashi, string> = {
  1: 'Keep starting real projects in small arenas — sparring, builds, sales from zero. Idle Aries stagnates.',
  2: 'Stay close to capital, budgets, and tangible assets. Starve Taurus of resources and the field dies.',
  3: 'Stay a lifelong student of tools — write, automate, ship paperwork cleanly every week.',
  4: 'Serve people or healing causes regularly; rigid SOP desks without public contact poison Cancer.',
  5: 'Lead visibly — present, manage, hold a stage. Leo recharges through rightful authority, not hiding.',
  6: 'Keep SOPs, health routines, and skill drills sharp. Virgo drains when work has no measurable improvement.',
  7: 'Protect polish and standards — dress, environment, client quality. Libra collapses in crude grind.',
  8: 'Do deep work on crisis, research, or recovery themes; shallow busywork underfeeds Scorpio.',
  9: 'Keep client-facing counsel or teaching loops alive; alone-lab Sagittarius loses the third-party current.',
  10: 'Honour long hours on one serious craft. Capricorn recharges through committed structure, not scatter.',
  11: 'Ship experiments and side channels; Aquarius dies in pure hierarchy without room to break norms.',
  12: 'Protect solitude, night craft, or foreign/freelance modes. Forced 9–5 bondage empties Pisces.',
}

function houseDistance(from: Rashi, to: Rashi): number {
  return ((to - from + 12) % 12) + 1
}

function buildLagnaSync(analysis: DashamsaAnalysis, chart: ChartOutput): LagnaSyncReading {
  const d1 = chart.lagnas.ascRashi
  const d10 = analysis.d10Lagna
  const d1Name = RASHI_NAMES[d1]
  const d10Name = analysis.d10LagnaName
  const d1Sector = D10_SIGN_SECTORS[d1]
  const d10Sector = D10_SIGN_SECTORS[d10]
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

  const d1Role = `Birth lagna (${d1Name}): who you are under pressure — ${d1Sector.flavor}`
  const d10Role = `Career lagna (${d10Name}): where livelihood actually runs — ${d10Sector.headline}. Typical doors: ${d10Sector.industries.slice(0, 3).join('; ')}.`

  if (d1 === d10) {
    status = 'synced'
    statusLabel = 'Synced'
    headline = `${d1Name} on both D1 and D10 — identity and livelihood share one engine`
    text = `When the rising signs match, career can ride the same energy you already are. Dasha weather still moves, but you are not borrowing a foreign field — ${d1Name} work feels native.`
    bridge = `Lean fully into ${d1Name} strengths at work. The more the job uses this sign’s craft, the more stable the chart feels through ups and downs.`
    counsel = 'Prefer roles that look like this lagna’s sector list. Forcing a mismatched industry wastes a rare sync advantage.'
  } else if (sameElement) {
    status = 'element-bridge'
    const elWord = d1El === 'fire' ? 'Fire' : d1El === 'earth' ? 'Earth' : d1El === 'air' ? 'Air' : 'Water'
    statusLabel = `${elWord} bridge`
    headline = `${d1Name} (D1) ↔ ${d10Name} (D10) — same ${elWord.toLowerCase()} element, different dialect`
    text = `The signs differ, but they speak the same elemental language (${ELEMENT_LABEL[d1El]}). Livelihood will not feel alien so much as “translated”: your ${d1Name} nature must learn the work habits of ${d10Name}.`
    bridge = `Use ${d1Name} as the personal operating system and ${d10Name} as the professional market. Example pattern: keep ${d1Name} skills sharp while accepting ${d10Name}’s industry rules, hours, and barriers.`
    counsel = d10Sector.caution
      ? `Watch the ${d10Name} caution: ${d10Sector.caution}`
      : `Build a weekly rhythm that feeds both signs — identity practice (${d1Name}) plus career practice (${d10Name}).`
  } else if (softMoon || softSun || trineLink) {
    status = 'soft-link'
    statusLabel = softMoon ? 'Moon link' : softSun ? 'Sun link' : 'Trine link'
    headline = `${d1Name} life-path linked softly to ${d10Name} career`
    const linkBit = softMoon
      ? `D10 lagna matches the Moon sign — the mind already recognises this career field.`
      : softSun
        ? `D10 lagna matches the Sun sign — purpose/ego can endorse this livelihood.`
        : `${d10Name} sits in a 5/9 harmony from ${d1Name} — supportive angle, not identity twin.`
    text = `${linkBit} Still an offset of rising signs, so expect a learning curve: personal style (${d1Name}) and job theatre (${d10Name}) need conscious bridging.`
    bridge = `Treat ${d10Name} as the stage and ${d1Name} as the actor’s training. Interview and role choice should favour ${d10Name} sectors; daily self-care should recharge ${d1Name}.`
    counsel = 'Do not force exact-sign “sync” remedies. Soft links work when you honour both layers without pretending they are identical.'
  } else if (strainAxis) {
    status = 'strain'
    statusLabel = 'Strain axis'
    headline = `${d1Name} ↔ ${d10Name} sits on a 6/8-style tension`
    text = `Birth rising and career rising pull in competing directions. Work can feel like duty against temperament — productive under discipline, exhausting if you deny either side.`
    bridge = `Name the conflict openly: ${d1Name} wants ${d1Sector.industries[0] ?? 'its own craft'}; ${d10Name} demands ${d10Sector.industries[0] ?? 'its market'}. Schedule recovery for the D1 sign after D10 grind days.`
    counsel = 'Prefer roles that let ${d10Name} pay the bills while ${d1Name} gets a protected side channel (study, craft, service) — full denial of either side drains energy fastest.'
  } else {
    status = 'offset'
    statusLabel = 'Offset'
    headline = `${d1Name} self · ${d10Name} livelihood — two engines, one life`
    text = `D1 and D10 do not share the same rising sign. That is common — it means livelihood runs on a different “fuel” than your default personality. Skill can be high while the job still feels borrowed until you recharge both fields on purpose.`
    bridge = `Map two columns: (1) ${d1Name} — how you think and recover; (2) ${d10Name} — which industry doors to knock. Career advice should start from D10; counselling and burnout care should start from D1.`
    counsel = d10Sector.caution
      ? `While working the ${d10Name} field, remember: ${d10Sector.caution}`
      : `Align applications with ${d10Name} sectors; keep ${d1Name} habits as the private battery.`
  }

  const recharge = [
    `Recharge D1 (${d1Name}): ${LAGNA_RECHARGE[d1]}`,
    `Recharge D10 (${d10Name}): ${LAGNA_RECHARGE[d10]}`,
  ]
  if (sameElement) {
    recharge.push(`Shared ${ELEMENT_LABEL[d1El]} — practices that build endurance, craft, and tangible output feed both signs.`)
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

function dashaEventForHouse(house: number | null): Omit<DashaHouseEvent, 'levelLabel' | 'lordName' | 'd10House'> {
  if (house == null) {
    return { event: 'D10 house unknown for this lord.', tone: 'neutral', pathHint: null }
  }
  if (house === 8) {
    return {
      event: '8th-house dasha in D10 — current work chapter tends to end; face change, do not hide.',
      tone: 'challenging',
      pathHint: 'Jnana path: occult/research/healing pivot. Bhakti path: endure as witness; often re-settle in a new field after dasha.',
    }
  }
  if (house === 12) {
    return {
      event: '12th-house dasha in D10 — release, foreign, or faith-mode work; logic alone fails.',
      tone: 'challenging',
      pathHint: 'Operate on faith/Prakṛti support; Pisces-like surrender of analysis.',
    }
  }
  if (house === 5) {
    return {
      event: '5th-house dasha — status/creativity/education themes; watch 5+8 demotion or 5+12 transfer patterns.',
      tone: 'mixed',
      pathHint: 'With 8th: fire/demotion risk. With 9th: favor higher studies. With 12th: transfer flavor.',
    }
  }
  if (house === 11) {
    return {
      event: '11th-house dasha — team/gains shift inside the organization more than total exit.',
      tone: 'mixed',
      pathHint: null,
    }
  }
  if (house === 6) {
    return {
      event: '6th-house dasha — service, rivalry, and bondage under systems intensify.',
      tone: 'mixed',
      pathHint: null,
    }
  }
  if ([1, 10].includes(house)) {
    return {
      event: `H${house} dasha — core livelihood / status pressure; keep prescribed duty without attachment.`,
      tone: 'supportive',
      pathHint: null,
    }
  }
  return {
    event: `D10 H${house} dasha — work karma colors this house’s field.`,
    tone: 'neutral',
    pathHint: null,
  }
}

function buildKarmaYoga(analysis: DashamsaAnalysis, chart: ChartOutput): DashamsaKarmaYogaPractical {
  const sync = buildLagnaSync(analysis, chart)

  const dashaEvents: DashaHouseEvent[] = (analysis.dashaOverlay?.lords ?? []).map((l) => {
    const meta = dashaEventForHouse(l.d10House)
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

  let crisisHeadline = 'No 8th/12th dasha crisis signature right now'
  if (has5and8) crisisHeadline = '5th + 8th dasha link — fire / demotion / role-elimination risk'
  else if (has5and12) crisisHeadline = '5th + 12th dasha link — transfer / relocation flavor'
  else if (crisisActive) crisisHeadline = '8th or 12th dasha active — chapter ending; remedies build acceptance, not escape'

  const crisisMode = {
    active: crisisActive || has5and8 || has5and12,
    headline: crisisHeadline,
    jnanaPath:
      'During 8th dasha many turn to occult, healing, research, consultations — discover true nature but may leave the old career.',
    bhaktiPath:
      'Others treat God as witness, keep steady service without attachment; after dasha, work often re-forms in another field.',
    acceptanceRule:
      'Gītā 3.2–3.4: remedies align energy and acceptance — they do not cancel fated chapter-ends. Escaping duty as “sannyāsa” while the mind flees looks like fear, not freedom.',
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
      element: 'Fire (Agni)',
      signs: 'Aries, Leo, Sagittarius',
      remedy: 'Agnihotra / fire yajña — fire starts the native’s work.',
      active: fireN >= 3,
      reason: fireN >= 3 ? `${fireN} hits on fire triad (planets + dasha).` : 'Fire triad quieter.',
    },
    {
      id: 'earth',
      houses: '2–6–10',
      element: 'Earth (Pṛthivī)',
      signs: 'Taurus, Virgo, Capricorn',
      remedy: 'Dāna / charity matching the troubling planet — pending-karma axis.',
      active: earthN >= 3,
      reason: earthN >= 3 ? `${earthN} hits on earth triad.` : 'Earth triad quieter.',
    },
    {
      id: 'air',
      houses: '3–7–11',
      element: 'Air (Vāyu)',
      signs: 'Gemini, Libra, Aquarius',
      remedy: 'Bhajan, kīrtan, saṅkīrtan, home programs, abhiṣeka / śṛṅgāra of the deity.',
      active: airN >= 3,
      reason: airN >= 3 ? `${airN} hits on air triad.` : 'Air triad quieter.',
    },
    {
      id: 'water',
      houses: '4–8–12',
      element: 'Water (Jala)',
      signs: 'Cancer, Scorpio, Pisces',
      remedy: 'Dhām darśan / pilgrimage and mokṣa-oriented practice.',
      active: waterN >= 3 || crisisActive,
      reason: crisisActive || waterN >= 3
        ? `${waterN} hits${crisisActive ? ' + 8/12 dasha' : ''} on water triad.`
        : 'Water triad quieter.',
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
          d10Note: `Strong in D1 (${d1.dignity}) but soft in D9 (${d9p.dignity}) — check D10 H${p.d10House} ${p.d10RashiName} (${p.digpala.name}) for the karma that “spoiled” this graha’s fruit.`,
        })
      }
    }
  }

  return {
    framing:
      'Bhagavad Gītā ch.3 (Karma Yoga) on D10: Prakṛti forces action; 8th/12th dashas end chapters; remedies build acceptance and energy alignment — the astrologer serves the grahas, not client wish-fulfillment.',
    sync,
    dashaEvents,
    crisisMode,
    triads,
    corruption,
    oilField:
      'A livelihood sign is a finite well: when that planet’s dasha ends, the job can end even if skill remains. Exact D1=D10 sync reuses one well; offset charts must recharge both identity (D1) and career (D10) on purpose — lagna responds to aligned action, study, and duty; other houses empty faster.',
    multiChart: [
      'D1 — battlefield / life context',
      'D3 — mind, courage, inclination',
      'D9 — fruit / destiny outcome',
      'D10 — karma actually being done',
      'D27 — whether the heart/stamina supports the work',
      'D2 — wealth inflow and drain',
      'Golden rule: planet strong in D1 but damaged in D9 → always open D10 for the corrupting action.',
    ],
    ethics: [
      'Remedies ≠ changing destiny; they align acceptance (Arjuna receives ātma-jñāna to face battle, not cancel it).',
      'Transactional “save my job” rituals alone do not stop Prakṛti.',
      'Warn early (save money, EMI risk) — speak hard truth; false hope drains puṇya.',
      'If client refuses tapasyā, return fees — do not carry ineffective consultation karma.',
      'Offer a portion back (Viṣṇu / guru / deity); ungrateful “I did it myself” fades blessings.',
      'Keep prescribed duty even when income pauses (Gītā 3.8) — research and craft without attachment.',
      'You are a servant of the planets, not of the client.',
    ],
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

function dashaHouseNote(code: CircuitVargaCode, lord: GrahaId, house: number, levelIndex = 0): CircuitNote {
  const name = GRAHA_NAMES[lord]
  // Level index keeps IDs unique when the same lord repeats (e.g. Me–Me antardasha).
  const id = `${code.toLowerCase()}-dasha-${lord}-h${house}-L${levelIndex}`
  if (code === 'D3') {
    if ([6, 8, 12].includes(house)) {
      return {
        id,
        title: `D3 mind · ${name} in H${house}`,
        text: house === 8
          ? 'Mind stuck in a pit — fear, grief, inability to move on.'
          : house === 6
            ? 'Mind on conflict, court, karma friction, family tension.'
            : 'Mind cannot forget; endings and regret loop.',
        tone: 'challenging',
      }
    }
    if (house === 4) {
      return { id, title: `D3 · ${name} in 4th`, text: 'Thoughts on comfort, home, mother, emotional security — often links to conflict axis.', tone: 'mixed' }
    }
    if (house === 5 || house === 7) {
      return { id, title: `D3 · ${name} in H${house}`, text: 'Mind stays on romance / bond themes.', tone: 'mixed' }
    }
    if (house === 3) {
      return { id, title: `D3 · ${name} in 3rd`, text: 'Mind tracks who is entering via communication.', tone: 'mixed' }
    }
    if (house === 1) {
      return { id, title: `D3 · ${name} on lagna`, text: 'Subconscious identity under training/correction this period.', tone: 'mixed' }
    }
    return { id, title: `D3 · ${name} in H${house}`, text: 'Period colors mental inclination through this house.', tone: 'neutral' }
  }
  if (code === 'D7') {
    if (house === 1) {
      return { id, title: `D7 lagna · ${name}`, text: 'Relationship / children karma activates — this lord’s dasha is pivotal for who enters life.', tone: 'mixed' }
    }
    if (house === 7) {
      return { id, title: `D7 · ${name} in 7th`, text: 'Partner axis lit — meeting, haunting old love, or bond renegotiation.', tone: 'mixed' }
    }
    if (house === 10) {
      return { id, title: `D7 · ${name} in 10th`, text: 'Partner likely met via workplace / status field.', tone: 'mixed' }
    }
    if ([6, 8, 12].includes(house)) {
      return { id, title: `D7 · ${name} in H${house}`, text: 'Relationship strain, hidden bonds, or exit path active.', tone: 'challenging' }
    }
    if (house === 5 || house === 9 || house === 11) {
      return { id, title: `D7 · ${name} in H${house}`, text: 'Children / fortune / gains themes in relationship field — pregnancy timing needs D2+D9 confirm.', tone: 'supportive' }
    }
    return { id, title: `D7 · ${name} in H${house}`, text: 'Who enters / leaves life colors this house.', tone: 'neutral' }
  }
  if (code === 'D9') {
    if ([6, 8, 12].includes(house)) {
      return { id, title: `D9 fruit · ${name} in H${house}`, text: 'Destiny outcome under strain — confirm with D7 before naming cheating/break.', tone: 'challenging' }
    }
    if (house === 7 || house === 1) {
      return { id, title: `D9 · ${name} on axis`, text: 'Final partnership result crystallizes through this lord.', tone: 'mixed' }
    }
    if (house === 11) {
      return { id, title: `D9 · ${name} in 11th`, text: 'Gains / network fruit — can include fake promises if Venus sign is Aquarius-flavored.', tone: 'mixed' }
    }
    if (house === 5) {
      return { id, title: `D9 · ${name} in 5th`, text: 'Children / romance fruit confirms; conflict after childbirth needs Virgo/3rd checks.', tone: 'mixed' }
    }
    return { id, title: `D9 · ${name} in H${house}`, text: 'Navāṁśa fruit of the running period.', tone: 'neutral' }
  }
  if (code === 'D2') {
    if (house === 8 || house === 12) {
      return { id, title: `D2 · ${name} in H${house}`, text: 'Passive / maternity / hidden wealth flavor — not the same as D10 promotion.', tone: 'mixed' }
    }
    if (house === 4 || house === 5) {
      return { id, title: `D2 · ${name} in H${house}`, text: 'Home / children spending and inflow; stay-home money possible.', tone: 'mixed' }
    }
    if (house === 11) {
      return { id, title: `D2 · ${name} in 11th`, text: 'Social recognition through wealth eventually rises.', tone: 'supportive' }
    }
    return { id, title: `D2 · ${name} in H${house}`, text: 'Wealth inflow/drain through this house.', tone: 'neutral' }
  }
  // D10
  if (house === 8) {
    return { id, title: `D10 karma · ${name} in 8th`, text: 'Hidden / transformative karma — cutter dasha; verify research vs job loss vs new venture via D3/D7.', tone: 'challenging' }
  }
  if (house === 12) {
    return { id, title: `D10 · ${name} in 12th`, text: 'Independent work, foreign, or release of livelihood chapter.', tone: 'challenging' }
  }
  if (house === 3) {
    return { id, title: `D10 · ${name} in 3rd`, text: 'Karma via communication / phone — extra person or status talk can enter here.', tone: 'mixed' }
  }
  if (house === 5 || house === 11) {
    return { id, title: `D10 · ${name} in H${house}`, text: 'Training, opportunity, income, position — can look like “promotion” alone.', tone: 'supportive' }
  }
  if (house === 1 || house === 10) {
    return { id, title: `D10 · ${name} in H${house}`, text: 'Core livelihood / status karma under pressure.', tone: 'mixed' }
  }
  return { id, title: `D10 · ${name} in H${house}`, text: 'Action karma of the period in this house.', tone: 'neutral' }
}

function buildCircuit(analysis: DashamsaAnalysis, chart: ChartOutput): DashamsaCircuitPractical {
  const path = chart.dashas?.vimshottari ? getDashaPathAt(chart.dashas.vimshottari) : []
  const lords = path.map((n) => n.lord as GrahaId).slice(0, 4)

  const meta: { code: CircuitVargaCode; title: string; represents: string }[] = [
    { code: 'D3', title: 'Drekkana (D3)', represents: 'What you think — subconscious mind' },
    { code: 'D7', title: 'Saptāṁśa (D7)', represents: 'Who enters life — relationships & children' },
    { code: 'D10', title: 'Daśāṁśa (D10)', represents: 'What karma / actions you perform' },
    { code: 'D9', title: 'Navāṁśa (D9)', represents: 'What you choose — destiny / final fruit' },
    { code: 'D2', title: 'Horā (D2)', represents: 'Wealth inflow & drain (maternity vs promotion check)' },
  ]

  const layers: CircuitLayer[] = meta.map(({ code, title, represents }) => {
    if (code === 'D10') {
      const lagnaOcc = occupantsInHouse(analysis.planets, 1).map((p) => p.name)
      const dashaNotes: CircuitNote[] = lords.map((lord, levelIndex) => {
        const row = analysis.planets.find((p) => p.id === lord)
        if (!row) {
          return { id: `d10-miss-${lord}-L${levelIndex}`, title: GRAHA_NAMES[lord], text: 'D10 placement missing.', tone: 'neutral' }
        }
        return dashaHouseNote('D10', lord, row.d10House, levelIndex)
      })
      const staticNotes: CircuitNote[] = []
      const ju = analysis.planets.find((p) => p.id === 'Ju')
      const ve = analysis.planets.find((p) => p.id === 'Ve')
      const su = analysis.planets.find((p) => p.id === 'Su')
      if (ju && ve && ju.d10House === ve.d10House) {
        staticNotes.push({
          id: 'd10-ju-ve',
          title: 'Jupiter–Venus together in D10',
          text: `In H${ju.d10House} — allegations / “spoil” of that house; secret communication can hit reputation when in 3rd.`,
          tone: 'challenging',
        })
      }
      if (ju && su && ve && [ju, su, ve].every((p) => p.d10House === ju.d10House)) {
        staticNotes.push({
          id: 'd10-ju-su-ve',
          title: 'Jupiter–Sun–Venus cluster',
          text: 'Extra person / relationship karma often enters the livelihood field.',
          tone: 'challenging',
        })
      }
      const ketu = analysis.planets.find((p) => p.id === 'Ke')
      if (ketu && ketu.d10House === 1) {
        staticNotes.push({
          id: 'd10-ketu-lagna',
          title: 'Ketu on D10 lagna',
          text: 'Detachment from work — kāmacor / avoidance pattern possible.',
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
        staticNotes: [{ id: `${code}-missing`, title: `${code} unavailable`, text: `Recalculate chart to generate ${code}.`, tone: 'neutral' }],
      }
    }

    const lagnaOcc = occupantsAtHouse(slice.grahas, slice.asc, 1)
    const dashaNotes = lords.map((lord, levelIndex) => {
      const g = slice.grahas.find((p) => p.id === lord)
      if (!g) {
        return { id: `${code}-miss-${lord}-L${levelIndex}`, title: GRAHA_NAMES[lord], text: `Missing in ${code}.`, tone: 'neutral' as CareerTone }
      }
      return dashaHouseNote(code, lord, houseFrom(slice.asc, g.rashi), levelIndex)
    })

    const staticNotes: CircuitNote[] = []
    if (code === 'D7') {
      const ju = lagnaOcc.find((g) => g.id === 'Ju')
      const su = lagnaOcc.find((g) => g.id === 'Su')
      if (ju && su) {
        staticNotes.push({
          id: 'd7-ju-su-lagna',
          title: 'Jupiter–Sun on D7 lagna',
          text: `In ${RASHI_NAMES[slice.asc]} — conflict signature; their dasha is critical for relationship events.`,
          tone: 'challenging',
        })
      }
      const ra = slice.grahas.find((g) => g.id === 'Ra')
      const sa = slice.grahas.find((g) => g.id === 'Sa')
      if (ra && houseFrom(slice.asc, ra.rashi) === 7) {
        staticNotes.push({
          id: 'd7-rahu-7',
          title: 'Rahu in D7 7th',
          text: 'Partner field haunted by obsession / old love; Scorpio flavor intensifies unfinished bonds.',
          tone: 'challenging',
        })
      }
      if (sa && houseFrom(slice.asc, sa.rashi) === 10) {
        staticNotes.push({
          id: 'd7-sa-10',
          title: 'Saturn in D7 10th',
          text: '10th axis — partner often met at workplace; isolation/insult themes with Rahu dasha.',
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
            title: 'Jupiter–Venus on 6–8 axis in D7',
            text: 'Only one agenda survives — relationship tends to end; Aries–Virgo flavor = fight/cry.',
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
          title: 'Venus cheat / fake-promise check',
          text: 'Venus on lagna or Aquarius-sign fruit can show chalāwā — confirm with D7 before naming infidelity.',
          tone: 'challenging',
        })
      }
    }
    if (code === 'D3') {
      const sa = lagnaOcc.find((g) => g.id === 'Sa')
      if (sa) {
        staticNotes.push({
          id: 'd3-sa-lagna',
          title: 'Saturn on D3 lagna',
          text: 'Regular insult, demotivation, alone-feeling — period trains the subconscious.',
          tone: 'challenging',
        })
      }
    }

    return {
      code,
      title,
      represents,
      available: true,
      lagnaName: RASHI_NAMES[slice.asc],
      lagnaOccupants: lagnaOcc.map((g) => GRAHA_NAMES[g.id]),
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
        title: 'Moon afflicted in D3',
        text: 'Fear of communicating with mother; won’t express inner feelings; wary of public/masses.',
        tone: 'challenging',
      })
    }
    const rahu = d3.grahas.find((g) => g.id === 'Ra')
    if (rahu && (WEAK.includes(rahu.dignity) || [6, 8, 12].includes(houseFrom(d3.asc, rahu.rashi)))) {
      mindFears.push({
        id: 'fear-rahu',
        title: 'Rahu afflicted in D3',
        text: 'Fear of being alone, pitṛu themes, device malfunction, and things out of control.',
        tone: 'challenging',
      })
    }
    const ketu = d3.grahas.find((g) => g.id === 'Ke')
    if (ketu && [6, 8, 12, 1].includes(houseFrom(d3.asc, ketu.rashi))) {
      mindFears.push({
        id: 'fear-ketu',
        title: 'Ketu unbalanced in D3',
        text: 'Unable to sort emotions — remains stuck holding onto things.',
        tone: 'challenging',
      })
    }
    if (occupantsAtHouse(d3.grahas, d3.asc, 12).length >= 2) {
      mindFears.push({
        id: 'fear-12',
        title: '12th house crowded in D3',
        text: 'Cannot forget — endings replay in the mind.',
        tone: 'challenging',
      })
    }
    if (occupantsAtHouse(d3.grahas, d3.asc, 8).length >= 2) {
      mindFears.push({
        id: 'fear-8',
        title: '8th house crowded in D3',
        text: 'Subconsciously stuck in a pit — unable to move on.',
        tone: 'challenging',
      })
    }
  }

  // Relationship flags across D7/D9/D10
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
  const relUnique = relationshipFlags.filter((n) => {
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
    { id: 'Ma', name: 'Mars', nature: 'Sudden / abrupt layoff or aggressive quit toward independence' },
    { id: 'Sa', name: 'Saturn', nature: 'Slow grind — insults, overtime, weekend pressure until exit' },
    { id: 'Me', name: 'Mercury', nature: 'Office politics played against the native' },
    { id: 'Su', name: 'Sun', nature: 'Ego clash with authority' },
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
      ? 'Synced strain across divisions'
      : mostlySupport
        ? 'Synced opportunity theme'
        : 'Mixed — divisions disagree',
    detail: synced
      ? 'Same dasha delivers a consistent result across layers — trust the shared theme over a single chart.'
      : 'D1 romance or D10 promotion alone is not enough — wait for D3/D7/D9 (and D2 for money/maternity) to agree.',
  }

  return {
    framing:
      'Advanced circuit: D1 context → D3 mind → D7 who enters → D10 karma done → D9 fruit. Relationship and “why” questions need the full stack — D10 alone misreads pregnancy as promotion.',
    sequence: [
      'D1 (Rāśi) — battlefield / overall context',
      'D3 (Drekkana) — subconscious thoughts',
      'D7 (Saptāṁśa) — who enters; always check for relationships',
      'D10 (Daśāṁśa) — karma performed (why the partner entered)',
      'D9 (Navāṁśa) — final destiny / outcome',
      'D2 (Horā) — wealth vs maternity / passive money (when needed)',
    ],
    layers,
    syncVerdict,
    relationshipFlags: relUnique,
    jobDisruption: {
      active: jobActive,
      headline: jobActive
        ? '8th/12th D10 dasha — energy drained; cross-check D3/D7 for research vs exit vs new venture'
        : 'No 8th/12th D10 dasha cutter active on current path',
      flavors,
      caveat:
        '8th house dasha ≠ always job loss — research, direction change, childbirth, marriage, or relocation possible. D10 lagna Rahu can look like promotion while D2/D3/D7 show maternity.',
    },
    mindFears,
    practiceAdvice: [
      'Spend ~70–80% of a normal consult on D1; only 20–30% on D9/D10 combined.',
      'Save full D3/D7/D9/D10 circuits for emergency / difficult cases — overusing Navāṁśa drains energy.',
      'Do not over-rely on D9 for client predictions for the first 6 months of practice — use it as back-end validation.',
      'Good astrologers extract karma + relationship patterns via D7; average ones stop at D1/D9.',
      'You were never able to judge cheating from D1+D9 alone — D7 reveals it, D9 confirms.',
      'Verify exalted planets through the full circuit before promising delivery.',
      'Avoid Chara Kārakas routinely — high energy cost.',
    ],
  }
}

function buildSurvival(analysis: DashamsaAnalysis): DashamsaSurvivalPractical {
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
      title: 'Cancer rising fragility',
      matched: cancerRising,
      detail: cancerRising
        ? moonOnLagna
          ? 'Cancer rising with Moon on lagna — high risk of toxic mood / politics stuckness; prefer public-care or CSR-style roles.'
          : 'Cancer rising in D10 — moody, politics-intolerant; lethal if forced into rigid SOP desks.'
        : 'Not Cancer rising.',
      tone: cancerRising ? 'challenging' : 'neutral',
    },
    {
      id: 'ketu-lost',
      title: 'Ketu lagna directionless',
      matched: ketuOnLagna,
      detail: ketuOnLagna
        ? 'Ketu on D10 lagna — join institutes with placement; pray/progress faster through the fog rather than solo CEO hunting.'
        : 'Ketu not on lagna.',
      tone: ketuOnLagna ? 'challenging' : 'neutral',
    },
    {
      id: 'vishad',
      title: 'Viṣāda (Moon–Saturn) drain',
      matched: moonSa,
      detail: moonSa
        ? 'Moon–Saturn in D10 — grief/regret loop drains energy; the “bullet” stays until routine and sector reset.'
        : 'No Moon–Saturn conjunction in D10.',
      tone: moonSa ? 'challenging' : 'neutral',
    },
    {
      id: 'cutter-dasha',
      title: '8th/12th dasha cutter',
      matched: eighthDasha,
      detail: eighthDasha
        ? 'Current path hits D10 8th/12th — chapter end or independence push; exit near 40% drain, do not wait for 100%.'
        : 'No 8th/12th on current dasha path.',
      tone: eighthDasha ? 'challenging' : 'neutral',
    },
    {
      id: 'overconfidence',
      title: 'Overconfidence + dusthāna',
      matched: overconfident,
      detail: overconfident
        ? 'Strong angles plus 8/12 — hard-headed risk taking can end in isolation/crisis; check D2 for money bleed.'
        : 'No strong overconfidence + dusthāna stack.',
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
      left: 'Gemini — pure analytics / automation',
      right: 'Virgo — driving analytics / DEX efficiency',
      rule: 'Gemini codes and automates; Virgo checks market share, accuracy, 2-day→1-day delivery experience.',
      relevant: geminiHit || virgoHit,
    },
    {
      id: 'le-aq',
      left: 'Leo — selected players / long power',
      right: 'Aquarius — anyone can join / side hustle',
      rule: 'Leo = Jio/Starlink-style dominance & PSU tenure; Aquarius = YouTube/MLM layering, rule-breaking channels.',
      relevant: leoHit || aquHit,
    },
    {
      id: 'su-ra',
      left: 'Sun — what I can give (legitimate / self)',
      right: 'Rahu — what I will get (opportunist)',
      rule: 'Sun works government/process for itself; Rahu takes any unclear channel that pays.',
      relevant: Boolean(sun || rahu),
    },
    {
      id: 'ra-ke-floor',
      left: 'Rahu in Libra — C-level high floors / aura',
      right: 'Ketu in Libra — ground floor (unless Moon lifts)',
      rule: 'Brand identity vs cliff detachment; Rahu won’t leave big brand easily.',
      relevant: analysis.planets.some((p) => (p.id === 'Ra' || p.id === 'Ke') && p.d10Rashi === 7),
    },
    {
      id: '6-12',
      left: '6th — bondage under company rules',
      right: '12th — independent / foreign / freelance',
      rule: 'Same skill flips by house: under someone vs solo. Dasha decides which mode is live.',
      relevant: analysis.planets.some((p) => p.d10House === 6 || p.d10House === 12),
    },
  ]

  // Extra combos not already the primary list focus — reuse full buildCombos matched subset for survival emphasis
  const allCombos = buildCombos(analysis)
  const extraCombos = allCombos.filter((c) =>
    ['fluid', 'delivery-apps', 'multi-biz', 've-ke', 'ketu-lagna', 'libra-rahu-floor', 'wfhome', 'lagna-lord-7', 'influencer'].includes(c.id),
  )

  const lagnaOcc = occupantsInHouse(analysis.planets, 1)
  const hardHeaded = lagnaOcc.some((p) => p.id === 'Su' || p.id === 'Ma')
    && lagnaOcc.some((p) => p.id === 'Su' || p.id === 'Sa' || p.id === 'Ma')

  const partnership: DashamsaSurvivalPractical['partnership'] = {
    method:
      'Match business partners on D10 the way you match marriage on D9 — overlay both D10 charts for conjunction/aspect pairs.',
    rules: [
      { id: 'su-sa', pair: 'Sun over Saturn', effect: 'Sun person’s status/resources decline; Saturn side rises.', tone: 'challenging' },
      { id: 've-ma', pair: 'Venus over Mars', effect: 'Smooth, attractive, heavy-working partnership.', tone: 'supportive' },
      { id: 'sa-ma', pair: 'Saturn over Mars', effect: 'Violence / conflict potential — do not ignore.', tone: 'challenging' },
      { id: 'su-ve', pair: 'Sun over Venus', effect: 'Burns fragrance, happiness, partner communication.', tone: 'challenging' },
      { id: 'su-me', pair: 'Sun over Mercury', effect: 'One dominates; other handles paperwork/comms.', tone: 'mixed' },
    ],
    hardHeaded,
    hardHeadedNote: hardHeaded
      ? 'This D10 lagna carries Sun/Mars hard-head energy — two such charts rarely partner well (lion with own pride only).'
      : 'Lagna is not a classic Sun–Mars hard stack; soft partnerships may still work if overlay is clean.',
  }

  return {
    framing:
      'Survival-series D10: sectors, EMI-level practicality, energy drain, and partnership overlays — not Gītā philosophy. House + Sign + Planet, then dasha.',
    threeLayer: 'House = base significance · Rashi = industry flavor · Planet = delivery agent. Never read one alone.',
    d10VsD9:
      'D10 = which sector / interview door to knock. D9 = whether the fruit ripens. Learn D10 before over-trusting Navāṁśa results.',
    distinctions,
    extraCombos,
    energyDrain: {
      risk,
      headline:
        risk === 'challenging'
          ? 'High drain risk — treat layoff like a bullet still bleeding'
          : risk === 'mixed'
            ? 'Moderate drain signals — exit early if toxicity rises'
            : 'Drain flags quiet — still check Sthāna & Kāla bala before promising timing',
      bulletRule:
        'Better quit near 40% energy drain than wait for 100%. At full drain, recovery can take 6+ months of sleep/eat fog before focus returns.',
      recoveryNote:
        'After long isolation, do not jump back to peak title (CEO→CEO). Step to senior/middle manager until energy rebuilds. Negative drain (−10/−20) means stop promising timelines.',
      flags,
    },
    helpability: {
      good: [
        'Which sector should I try?',
        'Where am I making mistakes?',
        'Where should I focus / apply?',
        'How can I improve this skill?',
      ],
      bad: [
        'When will my job come? (only)',
        'Make me an IAS through consultation',
        'Give date without my effort',
      ],
      text:
        'If the client only demands dates and refuses sector/skill work, the chart may be readable but the person is not helpable yet — refuse endless UPSC-fixed mindset sessions.',
    },
    partnership,
    sunHouseGuide: [
      { house: 1, role: 'Manager / self-authority' },
      { house: 3, role: 'School principal / courage desk' },
      { house: 5, role: 'Status, lineage, professor' },
      { house: 6, role: 'Crisis solver under pressure' },
      { house: 7, role: 'Needs external direction — weak Digbala risk' },
      { house: 10, role: 'High official / public status' },
    ],
    takeaways: [
      'Always: House + Sign + Planet; D10 after D1; dasha times the mode (6th bondage vs 12th solo).',
      'Energy drain is central — recovery timelines beat “when job” fantasies.',
      'Partnership: overlay D10s; soft energies work, two hard-heads usually do not.',
      'Protect Mercury from corporate exploitation; Venus–Ketu should not fuse.',
      'Use natural strength — do not force Aries founders energy if the chart is Gemini analytics.',
      'Prediction lands only when client energy matches; donkey≠horse.',
      'If Sthāna/Kāla bala weak: say clearly “your time has not come yet.”',
    ],
  }
}

/** Practical classroom layer on top of core Dashamsha analysis. */
export function buildDashamsaPractical(analysis: DashamsaAnalysis, chart: ChartOutput): DashamsaPractical {
  return {
    karma: buildKarma(analysis),
    sectors: buildSectors(analysis),
    pending: buildPending(analysis),
    bondage: buildBondage(analysis),
    karmaYoga: buildKarmaYoga(analysis, chart),
    circuit: buildCircuit(analysis, chart),
    survival: buildSurvival(analysis),
  }
}
