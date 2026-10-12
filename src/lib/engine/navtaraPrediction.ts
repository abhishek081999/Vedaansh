// ─────────────────────────────────────────────────────────────
//  src/lib/engine/navtaraPrediction.ts
//  Navtara prediction layer — decision window + dasha / natal /
//  transit tara nature (Varahamihira → Jaimini → modern use).
//  Events come from dasha + gochara; Navtara describes experience.
// ─────────────────────────────────────────────────────────────

import { NAKSHATRA_NAMES, NAKSHATRA_LORDS, GRAHA_NAMES } from '@/types/astrology'
import type { ChartOutput, DashaNode, GrahaData, GrahaId } from '@/types/astrology'
import { getDashaPathAt } from '@/lib/engine/dasha/current'
import {
  TARA_NAMES,
  type TaraName,
} from '@/lib/engine/nakshatraAdvanced'

/** Vimshottari lord order — same cycle used to map MD → tara from birth MD. */
export const VIMSHOTTARI_LORDS: GrahaId[] = [
  'Ke', 'Ve', 'Su', 'Mo', 'Ma', 'Ra', 'Ju', 'Sa', 'Me',
]

export type TaraTone = 'supportive' | 'challenging' | 'neutral' | 'transformative'

export interface TaraDecisionProfile {
  name: TaraName
  taraNumber: number
  hindi: string
  shortLabel: string
  meaning: string
  experience: string
  decisionWindow: string
  trap?: string
  tone: TaraTone
  /** Class teaching: 3rd, 5th, 7th need extra caution. */
  isHard: boolean
}

/**
 * Nine tara profiles as decision / experience windows
 * (class teaching — not event extractors).
 */
export const TARA_DECISION_PROFILES: Record<TaraName, TaraDecisionProfile> = {
  Janma: {
    name: 'Janma',
    taraNumber: 1,
    hindi: 'जन्म',
    shortLabel: 'Growth & nature',
    meaning: 'Birth star — first effect on body and soul growth; sets your baseline nature.',
    experience: 'Identity, ego, leadership style, and how you carry your birth-nakshatra psychology.',
    decisionWindow: 'Act in line with your nature; avoid forcing a new persona.',
    tone: 'neutral',
    isHard: false,
  },
  Sampat: {
    name: 'Sampat',
    taraNumber: 2,
    hindi: 'संपत्',
    shortLabel: 'Gains & opportunity',
    meaning: 'Wealth / opportunity tara — benefits, openings, and material or status gains.',
    experience: 'Doors open; resources and chances arrive more readily.',
    decisionWindow: 'Say yes to aligned opportunities; still verify with chart dignity.',
    tone: 'supportive',
    isHard: false,
  },
  Vipat: {
    name: 'Vipat',
    taraNumber: 3,
    hindi: 'विपत्',
    shortLabel: 'Crisis & struggle',
    meaning: 'Danger / crisis tara — problems, fear pressure, and stubborn push-through energy.',
    experience: 'Struggle, friction, and “I must do this” obstinacy; results often incomplete.',
    decisionWindow: 'Do not prove yourself; delay high-risk moves; expect friction even on good goals.',
    trap: 'Stubbornness can deepen the crisis.',
    tone: 'challenging',
    isHard: true,
  },
  Kshema: {
    name: 'Kshema',
    taraNumber: 4,
    hindi: 'क्षेम',
    shortLabel: 'Protection & solutions',
    meaning: 'Well-being tara — protection and solutions (often after or through difficulty).',
    experience: 'Problems may appear, but solutions and cover arrive with them.',
    decisionWindow: 'Lean into repair, healing, and consolidating what you already have.',
    tone: 'supportive',
    isHard: false,
  },
  Pratyari: {
    name: 'Pratyari',
    taraNumber: 5,
    hindi: 'प्रत्यरी',
    shortLabel: 'Opposition',
    meaning: 'Opposition tara — challenges, pushback, and pressure to prove yourself.',
    experience: 'Wherever you speak or push hard, resistance rises; karma of being tested.',
    decisionWindow: 'Speak less; listen more; avoid confrontational proving. Where you talk, you can get stuck.',
    trap: 'Over-explaining or arguing worsens outcomes.',
    tone: 'challenging',
    isHard: true,
  },
  Sadhaka: {
    name: 'Sadhaka',
    taraNumber: 6,
    hindi: 'साधक',
    shortLabel: 'Achievement & change',
    meaning: 'Achievement tara — success and transformation (not only spiritual).',
    experience: 'Skill, effort, and life-direction shifts crystallize into visible results.',
    decisionWindow: 'Commit to transformation work; accept that change can feel good or hard.',
    tone: 'transformative',
    isHard: false,
  },
  Vadha: {
    name: 'Vadha',
    taraNumber: 7,
    hindi: 'वध',
    shortLabel: 'Loss & release',
    meaning: 'Loss tara — not literal death; endings, damage to ego, and forced letting-go.',
    experience: 'Something held tightly loosens; ego or attachments take a hit.',
    decisionWindow: 'Release, complete, and stop clinging. Do not start ego-driven fights.',
    trap: 'Clinging turns loss into prolonged pain.',
    tone: 'challenging',
    isHard: true,
  },
  Mitra: {
    name: 'Mitra',
    taraNumber: 8,
    hindi: 'मित्र',
    shortLabel: 'Support',
    meaning: 'Friend tara — allies, support, and cooperative help.',
    experience: 'People and circumstances lean toward you; partnerships ease the load.',
    decisionWindow: 'Collaborate, ask for help, and build alliances.',
    tone: 'supportive',
    isHard: false,
  },
  'Ati-Mitra': {
    name: 'Ati-Mitra',
    taraNumber: 9,
    hindi: 'अति मित्र',
    shortLabel: 'Grace & protection',
    meaning: 'Best-friend tara — grace, cover, and strong protective results.',
    experience: 'Most outcomes tilt favorable; divine protection tone.',
    decisionWindow: 'Receive success without over-controlling; stay humble.',
    trap: 'Hidden trap: over-control and inflated ego after repeated wins (9/10 succeed, 1 fails hard).',
    tone: 'supportive',
    isHard: false,
  },
}

export interface NavtaraSlot {
  nakshatraIndex: number
  nakshatraName: string
  tara: TaraName
  taraNumber: number
  lord: GrahaId
}

export interface NatalPlanetTara {
  grahaId: GrahaId
  grahaName: string
  nakshatraIndex: number
  nakshatraName: string
  tara: TaraName
  taraNumber: number
  profile: TaraDecisionProfile
  /** Planets in hard taras struggle to deliver full natal promise. */
  resultCapacity: 'full' | 'reduced' | 'mixed'
}

export interface DashaLordTara {
  lord: GrahaId
  lordName: string
  tara: TaraName
  taraNumber: number
  profile: TaraDecisionProfile
  level: 'maha' | 'antar' | 'pratyantar' | 'other'
}

export interface NavtaraPrediction {
  birthNakshatraIndex: number
  birthNakshatraName: string
  /** Three nakshatras per tara across the 27-cycle. */
  chakra: NavtaraSlot[]
  /** Natal grahas classified by the nakshatra they occupy. */
  natalPlanets: NatalPlanetTara[]
  /** Vimshottari MD sequence mapped Janma→…→Ati-Mitra from birth MD lord. */
  dashaSequence: DashaLordTara[]
  current: {
    asOf: Date
    path: DashaLordTara[]
    maha?: DashaLordTara
    antar?: DashaLordTara
    synthesis: string
    decisionAdvice: string
    experienceTone: TaraTone
  }
  /** Lords whose natal nakshatra falls in hard taras (3/5/7). */
  reducedResultLords: GrahaId[]
  /** Lords in Mitra / Ati-Mitra natal slots — tend to leave a benefit trail. */
  supportiveLords: GrahaId[]
}

function clampNak(index: number): number {
  return ((index % 27) + 27) % 27
}

/** 0-based tara index (0=Janma … 8=Ati-Mitra) from birth nak to target nak. */
export function getTaraIndexFromBirth(birthNakIndex: number, targetNakIndex: number): number {
  const diff = (clampNak(targetNakIndex) - clampNak(birthNakIndex) + 27) % 27
  return diff % 9
}

export function getTaraFromBirth(birthNakIndex: number, targetNakIndex: number): TaraDecisionProfile {
  const tara = TARA_NAMES[getTaraIndexFromBirth(birthNakIndex, targetNakIndex)]
  return TARA_DECISION_PROFILES[tara]
}

export function buildNavtaraSlots(birthNakIndex: number): NavtaraSlot[] {
  const birth = clampNak(birthNakIndex)
  return NAKSHATRA_NAMES.map((name, i) => {
    const taraNumber = getTaraIndexFromBirth(birth, i) + 1
    const tara = TARA_NAMES[taraNumber - 1]
    return {
      nakshatraIndex: i,
      nakshatraName: name,
      tara,
      taraNumber,
      lord: NAKSHATRA_LORDS[i],
    }
  })
}

function resultCapacityFor(tone: TaraTone, isHard: boolean): NatalPlanetTara['resultCapacity'] {
  if (isHard) return 'reduced'
  if (tone === 'neutral') return 'mixed'
  return 'full'
}

export function classifyNatalPlanets(
  birthNakIndex: number,
  grahas: GrahaData[],
): NatalPlanetTara[] {
  const birth = clampNak(birthNakIndex)
  const core = grahas.filter(g => !['Ur', 'Ne', 'Pl'].includes(g.id))
  return core.map(g => {
    const profile = getTaraFromBirth(birth, g.nakshatraIndex)
    return {
      grahaId: g.id,
      grahaName: GRAHA_NAMES[g.id] ?? g.name,
      nakshatraIndex: g.nakshatraIndex,
      nakshatraName: g.nakshatraName || NAKSHATRA_NAMES[g.nakshatraIndex],
      tara: profile.name,
      taraNumber: profile.taraNumber,
      profile,
      resultCapacity: resultCapacityFor(profile.tone, profile.isHard),
    }
  })
}

/**
 * Map Vimshottari lords to taras: birth mahadasha lord = Janma,
 * next = Sampat, … wrapping the 9-lord cycle (class teaching).
 */
export function mapDashaLordsToTara(birthMahaLord: GrahaId): DashaLordTara[] {
  const start = VIMSHOTTARI_LORDS.indexOf(birthMahaLord)
  if (start < 0) return []
  return VIMSHOTTARI_LORDS.map((_, i) => {
    const lord = VIMSHOTTARI_LORDS[(start + i) % 9]
    const tara = TARA_NAMES[i]
    const profile = TARA_DECISION_PROFILES[tara]
    return {
      lord,
      lordName: GRAHA_NAMES[lord] ?? lord,
      tara,
      taraNumber: i + 1,
      profile,
      level: 'maha' as const,
    }
  })
}

function levelForDashaDepth(depth: number): DashaLordTara['level'] {
  if (depth === 0) return 'maha'
  if (depth === 1) return 'antar'
  if (depth === 2) return 'pratyantar'
  return 'other'
}

export function dashaPathToTara(
  birthMahaLord: GrahaId,
  path: DashaNode[],
): DashaLordTara[] {
  const table = mapDashaLordsToTara(birthMahaLord)
  const byLord = new Map(table.map(t => [t.lord, t]))
  return path.map((node, depth) => {
    const base = byLord.get(node.lord as GrahaId)
    const profile = base?.profile ?? TARA_DECISION_PROFILES.Janma
    return {
      lord: node.lord as GrahaId,
      lordName: GRAHA_NAMES[node.lord as GrahaId] ?? String(node.lord),
      tara: base?.tara ?? 'Janma',
      taraNumber: base?.taraNumber ?? 1,
      profile,
      level: levelForDashaDepth(depth),
    }
  })
}

function synthesizeExperience(maha?: DashaLordTara, antar?: DashaLordTara): {
  synthesis: string
  decisionAdvice: string
  experienceTone: TaraTone
} {
  if (!maha) {
    return {
      synthesis: 'Load a chart with Vimshottari dasha to read the current Navtara window.',
      decisionAdvice: 'Practice on natal planets first: note which grahas sit in Vipat, Pratyari, and Vadha.',
      experienceTone: 'neutral',
    }
  }

  const m = maha.profile
  const a = antar?.profile
  const hardCount = [m, a].filter(p => p?.isHard).length

  let experienceTone: TaraTone = m.tone
  if (a) {
    if (m.isHard && a.isHard) experienceTone = 'challenging'
    else if (m.isHard && !a.isHard) experienceTone = 'neutral'
    else if (!m.isHard && a.isHard) experienceTone = 'challenging'
    else if (m.tone === 'transformative' || a.tone === 'transformative') experienceTone = 'transformative'
    else if (m.tone === 'supportive' || a.tone === 'supportive') experienceTone = 'supportive'
  }

  const mahaLine = `Mahadasha ${maha.lordName} falls in ${m.name} (${m.hindi}) — ${m.shortLabel.toLowerCase()}.`
  const antarLine = a
    ? ` Antardasha ${antar!.lordName} is ${a.name} — ${a.experience}`
    : ''

  let blend = ''
  if (a) {
    if (m.isHard && !a.isHard) {
      blend = ` Hard MD softens under supportive AD: expect ${a.shortLabel.toLowerCase()} inside a ${m.shortLabel.toLowerCase()} era.`
    } else if (!m.isHard && a.isHard) {
      blend = ` Supportive MD with a hard AD: overall promise stays, but this sub-period can deliver a jolt (${a.shortLabel.toLowerCase()}).`
    } else if (hardCount === 2) {
      blend = ' Both periods are hard taras — keep decisions defensive and low-ego.'
    } else {
      blend = ` Combined window: ${m.shortLabel.toLowerCase()} shaped by ${a.shortLabel.toLowerCase()}.`
    }
  }

  const synthesis = `${mahaLine}${antarLine}${blend} Navtara shows experience nature — confirm events with dasha + gochara and natal placement.`

  const adviceParts = [m.decisionWindow]
  if (a?.isHard && a.decisionWindow !== m.decisionWindow) adviceParts.push(a.decisionWindow)
  if (m.trap) adviceParts.push(`Watch: ${m.trap}`)
  if (a?.trap) adviceParts.push(`AD watch: ${a.trap}`)

  return {
    synthesis,
    decisionAdvice: adviceParts.join(' '),
    experienceTone,
  }
}

/**
 * Classify a transit nakshatra (e.g. Moon or a graha’s current star)
 * into the native’s Navtara — for gochara experience checks.
 */
export function classifyTransitNakshatra(
  birthNakIndex: number,
  transitNakIndex: number,
): TaraDecisionProfile & { nakshatraName: string } {
  const profile = getTaraFromBirth(birthNakIndex, transitNakIndex)
  return {
    ...profile,
    nakshatraName: NAKSHATRA_NAMES[clampNak(transitNakIndex)],
  }
}

// ── Gochara (transit) Navtara ─────────────────────────────────

export interface TransitNakInput {
  id: GrahaId
  name?: string
  nakshatraIndex: number
  nakshatraName?: string
  isRetro?: boolean
}

export interface GocharaPlanetTara {
  grahaId: GrahaId
  grahaName: string
  nakshatraIndex: number
  nakshatraName: string
  tara: TaraName
  taraNumber: number
  profile: TaraDecisionProfile
  isRetro: boolean
  /** Planet lord appears in current Vimshottari path (MD/AD/PD…). */
  dashaActive: boolean
  /**
   * Class rule: gochara alone = energy;
   * gochara + matching dasha = event can materialize.
   */
  eventLikelihood: 'active' | 'energy-only'
}

export interface GocharaNavtaraReport {
  asOfDate: string
  moonTara?: GocharaPlanetTara
  planets: GocharaPlanetTara[]
  hardTransits: GocharaPlanetTara[]
  activeEventCandidates: GocharaPlanetTara[]
  summary: string
}

export function classifyGocharaPlanets(
  birthNakIndex: number,
  transitGrahas: TransitNakInput[],
  activeDashaLords: GrahaId[] = [],
): GocharaPlanetTara[] {
  const active = new Set(activeDashaLords)
  return transitGrahas
    .filter(g => !['Ur', 'Ne', 'Pl'].includes(g.id))
    .map(g => {
      const profile = getTaraFromBirth(birthNakIndex, g.nakshatraIndex)
      const dashaActive = active.has(g.id)
      return {
        grahaId: g.id,
        grahaName: g.name ?? GRAHA_NAMES[g.id] ?? g.id,
        nakshatraIndex: g.nakshatraIndex,
        nakshatraName: g.nakshatraName ?? NAKSHATRA_NAMES[clampNak(g.nakshatraIndex)],
        tara: profile.name,
        taraNumber: profile.taraNumber,
        profile,
        isRetro: Boolean(g.isRetro),
        dashaActive,
        eventLikelihood: dashaActive ? 'active' : 'energy-only',
      }
    })
}

export function buildGocharaNavtaraReport(
  birthNakIndex: number,
  transitGrahas: TransitNakInput[],
  activeDashaLords: GrahaId[] = [],
  asOfDate: string = new Date().toISOString().slice(0, 10),
): GocharaNavtaraReport {
  const planets = classifyGocharaPlanets(birthNakIndex, transitGrahas, activeDashaLords)
  const moonTara = planets.find(p => p.grahaId === 'Mo')
  const hardTransits = planets.filter(p => p.profile.isHard)
  const activeEventCandidates = planets.filter(p => p.eventLikelihood === 'active')

  const parts: string[] = []
  if (moonTara) {
    parts.push(`Transit Moon in ${moonTara.nakshatraName} → ${moonTara.tara} (${moonTara.profile.shortLabel}).`)
  }
  if (activeEventCandidates.length) {
    parts.push(
      `Dasha-matched gochara (event candidates): ${activeEventCandidates.map(p => `${p.grahaName}/${p.tara}`).join(', ')}.`,
    )
  } else {
    parts.push('No dasha-matched transit lords today — gochara gives tone/energy, not a full event trigger.')
  }
  if (hardTransits.length) {
    parts.push(
      `Hard tara transits: ${hardTransits.map(p => p.grahaName).join(', ')} — keep decisions low-ego.`,
    )
  }

  return {
    asOfDate,
    moonTara,
    planets,
    hardTransits,
    activeEventCandidates,
    summary: parts.join(' '),
  }
}

// ── Muhurta booking check (Vipat / Pratyari / Vadha caution) ──

export type MuhurtaBookingVerdict = 'favourable' | 'caution' | 'avoid'

export interface MuhurtaNavtaraCheck {
  dayNakshatraIndex: number
  dayNakshatraName: string
  tara: TaraName
  taraNumber: number
  profile: TaraDecisionProfile
  verdict: MuhurtaBookingVerdict
  score: number
  advice: string
  /** True when day Moon falls in 3rd / 5th / 7th tara. */
  isHardTara: boolean
}

const MUHURTA_SCORE: Record<TaraName, number> = {
  Janma: 45,
  Sampat: 95,
  Vipat: 5,
  Kshema: 85,
  Pratyari: 15,
  Sadhaka: 90,
  Vadha: 0,
  Mitra: 80,
  'Ati-Mitra': 92,
}

/**
 * Personal muhurta gate from birth Moon → day's Moon nakshatra.
 * Use before booking renovation, vehicle, travel, marriage, etc.
 */
export function checkMuhurtaNavtara(
  birthNakIndex: number,
  dayMoonNakIndex: number,
  activityLabel?: string,
): MuhurtaNavtaraCheck {
  const profile = getTaraFromBirth(birthNakIndex, dayMoonNakIndex)
  const isHardTara = profile.isHard
  const verdict: MuhurtaBookingVerdict = isHardTara
    ? 'avoid'
    : profile.tone === 'neutral'
      ? 'caution'
      : 'favourable'

  const activityBit = activityLabel ? ` for ${activityLabel}` : ''
  let advice: string
  if (verdict === 'avoid') {
    advice = `Day Moon is in ${profile.name} — postpone booking${activityBit}. ${profile.decisionWindow}`
  } else if (verdict === 'caution') {
    advice = `Janma tara day${activityBit}: workable if unavoidable, but keep the act gentle and identity-aligned.`
  } else {
    advice = `${profile.name} day supports booking${activityBit}. ${profile.decisionWindow}`
  }

  return {
    dayNakshatraIndex: clampNak(dayMoonNakIndex),
    dayNakshatraName: NAKSHATRA_NAMES[clampNak(dayMoonNakIndex)],
    tara: profile.name,
    taraNumber: profile.taraNumber,
    profile,
    verdict,
    score: MUHURTA_SCORE[profile.name],
    advice,
    isHardTara,
  }
}

// ── Relationship Navtara (two birth stars) ────────────────────

export interface RelationshipNavtaraSide {
  fromLabel: string
  fromNakIndex: number
  fromNakName: string
  toNakIndex: number
  toNakName: string
  tara: TaraName
  taraNumber: number
  profile: TaraDecisionProfile
}

export interface RelationshipNavtara {
  aToB: RelationshipNavtaraSide
  bToA: RelationshipNavtaraSide
  /** Mutual hard = both land in Vipat/Pratyari/Vadha toward each other. */
  mutualHard: boolean
  /** Either direction is Mitra / Ati-Mitra. */
  hasSupport: boolean
  summary: string
  advice: string
}

/**
 * How person A's birth star experiences person B's star, and vice versa.
 * Consultant-style: nature of support/harm — not a marriage score alone.
 */
export function getRelationshipNavtara(
  nakA: number,
  nakB: number,
  labelA = 'You',
  labelB = 'Other',
): RelationshipNavtara {
  const a = clampNak(nakA)
  const b = clampNak(nakB)
  const aProf = getTaraFromBirth(a, b)
  const bProf = getTaraFromBirth(b, a)

  const aToB: RelationshipNavtaraSide = {
    fromLabel: labelA,
    fromNakIndex: a,
    fromNakName: NAKSHATRA_NAMES[a],
    toNakIndex: b,
    toNakName: NAKSHATRA_NAMES[b],
    tara: aProf.name,
    taraNumber: aProf.taraNumber,
    profile: aProf,
  }
  const bToA: RelationshipNavtaraSide = {
    fromLabel: labelB,
    fromNakIndex: b,
    fromNakName: NAKSHATRA_NAMES[b],
    toNakIndex: a,
    toNakName: NAKSHATRA_NAMES[a],
    tara: bProf.name,
    taraNumber: bProf.taraNumber,
    profile: bProf,
  }

  const mutualHard = aProf.isHard && bProf.isHard
  const hasSupport =
    aProf.name === 'Mitra' || aProf.name === 'Ati-Mitra' ||
    bProf.name === 'Mitra' || bProf.name === 'Ati-Mitra' ||
    aProf.name === 'Sampat' || bProf.name === 'Sampat' ||
    aProf.name === 'Sadhaka' || bProf.name === 'Sadhaka'

  const summary =
    `${labelA}'s star sees ${labelB} as ${aProf.name} (${aProf.shortLabel}); ` +
    `${labelB}'s star sees ${labelA} as ${bProf.name} (${bProf.shortLabel}).`

  let advice: string
  if (mutualHard) {
    advice = 'Mutual hard tara — expect friction both ways; keep contracts clear and egos low.'
  } else if (aProf.isHard || bProf.isHard) {
    const hardSide = aProf.isHard ? labelA : labelB
    advice = `${hardSide} experiences the other through a hard tara window — support without forcing proof or control.`
  } else if (hasSupport) {
    advice = 'Supportive tara link — good for alliance, learning, and shared ventures; still confirm with full matching.'
  } else {
    advice = 'Neutral growth link — relationship tone follows chart dignity and dasha more than tara alone.'
  }

  return { aToB, bToA, mutualHard, hasSupport, summary, advice }
}

/**
 * Full Navtara prediction pack for a chart (natal + current Vimshottari path).
 */
export function getNavtaraPrediction(
  chart: Pick<ChartOutput, 'grahas' | 'dashas' | 'panchang'>,
  asOf: Date = new Date(),
): NavtaraPrediction {
  const moon = chart.grahas.find(g => g.id === 'Mo')
  const birthNak =
    moon?.nakshatraIndex ??
    chart.panchang?.nakshatra?.index ??
    0

  const chakra = buildNavtaraSlots(birthNak)
  const natalPlanets = classifyNatalPlanets(birthNak, chart.grahas)

  const vim = chart.dashas?.vimshottari ?? []
  const birthMahaLord = (vim[0]?.lord as GrahaId) || NAKSHATRA_LORDS[birthNak]
  const dashaSequence = mapDashaLordsToTara(birthMahaLord)

  const pathNodes = getDashaPathAt(vim, asOf.getTime())
  const path = dashaPathToTara(birthMahaLord, pathNodes)
  const maha = path[0]
  const antar = path[1]
  const { synthesis, decisionAdvice, experienceTone } = synthesizeExperience(maha, antar)

  const reducedResultLords = natalPlanets
    .filter(p => p.resultCapacity === 'reduced')
    .map(p => p.grahaId)
  const supportiveLords = natalPlanets
    .filter(p => p.tara === 'Mitra' || p.tara === 'Ati-Mitra')
    .map(p => p.grahaId)

  return {
    birthNakshatraIndex: birthNak,
    birthNakshatraName: NAKSHATRA_NAMES[birthNak],
    chakra,
    natalPlanets,
    dashaSequence,
    current: {
      asOf,
      path,
      maha,
      antar,
      synthesis,
      decisionAdvice,
      experienceTone,
    },
    reducedResultLords,
    supportiveLords,
  }
}
