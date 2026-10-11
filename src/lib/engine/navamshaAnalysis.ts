// ─────────────────────────────────────────────────────────────
//  src/lib/engine/navamshaAnalysis.ts
//  Navamsha (D9) mapping, vargottama, karakamsha & interpretations
//  Classical focus: BPHS / Jaimini — marriage, dharma, destiny
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
  RASHI_SANSKRIT,
  RASHI_SHORT,
} from '@/types/astrology'
import { D9, degInSign, VARGA_FUNCTIONS, VARGA_META, type VargaName } from '@/lib/engine/vargas'
import { getDashaPathAt } from '@/lib/engine/dasha/current'
import { DEBILITATION_SIGN, EXALTATION_SIGN, OWN_SIGNS } from '@/lib/engine/dignity'

export type DashaTone = 'supportive' | 'challenging' | 'mixed' | 'neutral'

/** Client-safe whole-sign helpers — do not import houses.ts (pulls sweph/fs). */
function wholeSignHouseSign(ascRashi: Rashi, house: number): Rashi {
  return (((ascRashi - 1 + house - 1) % 12) + 1) as Rashi
}

function houseSignLord(ascRashi: Rashi, house: number): GrahaId {
  return SIGN_LORDS[wholeSignHouseSign(ascRashi, house)]
}

/** Sign-count from A to B: 1 = same … 12 = 12th from A. */
export function signCount(fromRashi: number, toRashi: number): number {
  return ((toRashi - fromRashi + 12) % 12) + 1
}

export type D1D9RelationKind =
  | 'vargottama'
  | 'opposing'
  | 'shadashtaka'
  | 'dwirdwadasa'
  | 'trikona'
  | 'kendra'
  | 'upachaya'
  | 'unclassified'

export interface D1D9SignRelation {
  fromRashi: Rashi
  toRashi: Rashi
  fromName: string
  toName: string
  /** Count from D1 → D9 (1–12) */
  forward: number
  /** Count from D9 → D1 (1–12) */
  reverse: number
  /** Classical pair label e.g. "2/12", "5/9", "1/1" */
  pair: string
  kind: D1D9RelationKind
  label: string
  tone: DashaTone
  note: string
}

const RELATION_NOTES: Record<D1D9RelationKind, string> = {
  vargottama: 'Same sign in D1 and D9 — promise and fruition align (Vargottama).',
  opposing: '7th from natal sign — polarity between outer life and Navamsha expression.',
  shadashtaka: '6/8 link — friction or transformation between body-chart and destiny-chart.',
  dwirdwadasa: '2/12 link — support vs expenditure; results need adjustment and maturity.',
  trikona: '5/9 trine — harmonious bridge; dharma and creativity support the planet.',
  kendra: '4/10 angular link — functional power; results become publicly effective.',
  upachaya: '3/11 growth link — effort compounds; improves with time and initiative.',
  unclassified: 'Unclassified sign link — read dignity and houses for nuance.',
}

export function relationFromSignCount(forward: number): Omit<D1D9SignRelation, 'fromRashi' | 'toRashi' | 'fromName' | 'toName' | 'forward' | 'reverse' | 'pair'> {
  if (forward === 1) {
    return { kind: 'vargottama', label: 'Vargottama (1/1)', tone: 'supportive', note: RELATION_NOTES.vargottama }
  }
  if (forward === 7) {
    return { kind: 'opposing', label: 'Opposing (7/7)', tone: 'mixed', note: RELATION_NOTES.opposing }
  }
  if (forward === 6 || forward === 8) {
    return { kind: 'shadashtaka', label: 'Shadashtaka (6/8)', tone: 'challenging', note: RELATION_NOTES.shadashtaka }
  }
  if (forward === 2 || forward === 12) {
    return { kind: 'dwirdwadasa', label: 'Dwir-dwadasa (2/12)', tone: 'challenging', note: RELATION_NOTES.dwirdwadasa }
  }
  if (forward === 5 || forward === 9) {
    return { kind: 'trikona', label: 'Trikona (5/9)', tone: 'supportive', note: RELATION_NOTES.trikona }
  }
  if (forward === 4 || forward === 10) {
    return { kind: 'kendra', label: 'Kendra (4/10)', tone: 'supportive', note: RELATION_NOTES.kendra }
  }
  if (forward === 3 || forward === 11) {
    return { kind: 'upachaya', label: 'Upachaya (3/11)', tone: 'mixed', note: RELATION_NOTES.upachaya }
  }
  return { kind: 'unclassified', label: 'Unclassified', tone: 'neutral', note: RELATION_NOTES.unclassified }
}

export function buildD1D9Relation(d1Rashi: Rashi, d9Rashi: Rashi): D1D9SignRelation {
  const forward = signCount(d1Rashi, d9Rashi)
  const reverse = signCount(d9Rashi, d1Rashi)
  const meta = relationFromSignCount(forward)
  const pair =
    forward === 1 ? '1/1'
      : forward === 7 ? '7/7'
        : `${Math.min(forward, reverse)}/${Math.max(forward, reverse)}`
  return {
    fromRashi: d1Rashi,
    toRashi: d9Rashi,
    fromName: RASHI_NAMES[d1Rashi],
    toName: RASHI_NAMES[d9Rashi],
    forward,
    reverse,
    pair,
    ...meta,
  }
}

const CLASSICAL_ORDER: GrahaId[] = ['Su', 'Mo', 'Ma', 'Me', 'Ju', 'Ve', 'Sa', 'Ra', 'Ke']

const SIGN_LORDS: Record<Rashi, GrahaId> = {
  1: 'Ma', 2: 'Ve', 3: 'Me', 4: 'Mo', 5: 'Su', 6: 'Me',
  7: 'Ve', 8: 'Ma', 9: 'Ju', 10: 'Sa', 11: 'Sa', 12: 'Ju',
}

const STRONG_DIGNITY: Dignity[] = ['exalted', 'moolatrikona', 'own']
const WEAK_DIGNITY: Dignity[] = ['debilitated', 'great_enemy', 'enemy']

/** Navamsha lagna themes by rashi (destiny / spouse / dharma flavor). */
const NAVAMSHA_LAGNA_THEMES: Record<Rashi, string> = {
  1: 'Pioneer spirit in relationships and dharma; spouse may be assertive, athletic, or entrepreneurial. Courage colors life purpose.',
  2: 'Stability and values guide destiny; spouse may be artistic, resourceful, or from a comfortable background. Pleasure and speech matter.',
  3: 'Curiosity and communication shape partnerships; spouse may be witty, skilled with hands/words, or younger in spirit. Dual interests.',
  4: 'Emotional security and home define destiny; nurturing spouse or domestic focus. Inner peace is the path of dharma.',
  5: 'Dignity, creativity, and leadership in destiny; spouse may carry pride, warmth, or public visibility. Heart-centered purpose.',
  6: 'Service, skill, and discernment; spouse may be analytical, health-conscious, or detail-oriented. Duty refines character.',
  7: 'Partnership itself is the path; balance, aesthetics, and fairness. Spouse may be charming, diplomatic, or justice-minded.',
  8: 'Transformation through intimacy and occult depth; intense bonds, shared resources, research or healing themes.',
  9: 'Dharma, teaching, and higher ideals; spouse may be philosophical, foreign-connected, or ethically driven. Fortune through faith.',
  10: 'Karma and vocation intertwine with marriage; ambitious, structured, or status-aware partner. Duty before ease.',
  11: 'Gains through networks and ideals; unconventional or intellectually progressive spouse. Friendship within marriage.',
  12: 'Moksha, compassion, and foreign or spiritual leanings; sensitive, artistic, or sacrificial bonds. Surrender as strength.',
}

/** Planet-specific Navamsha themes (what the graha expresses through D9). */
const PLANET_NAVAMSHA_THEMES: Record<GrahaId, string> = {
  Su: 'Soul purpose, father, authority, and vitality ripen through this Navamsha — how the self shines in destiny and marriage.',
  Mo: 'Mind, mother, and emotional needs find their mature expression here — comfort style in partnership and inner life.',
  Ma: 'Drive, siblings, and courage; how conflict and initiative show in married life and purposeful action.',
  Me: 'Intellect, speech, and commerce; negotiation and wit in relationships and dharma work.',
  Ju: 'Wisdom, children, and grace; blessings in marriage, guidance, and moral compass.',
  Ve: 'Love, beauty, and harmony; the quality of romance, arts, and pleasure in destiny.',
  Sa: 'Duty, delays, and endurance; longevity of bonds and lessons through responsibility.',
  Ra: 'Desire, foreign influence, and unconventional paths; sudden twists in destiny and attraction.',
  Ke: 'Detachment, past-life skill, and spiritual liberation; mystical or separatist themes in intimacy.',
  Ur: 'Sudden reform and originality in destiny patterns.',
  Ne: 'Idealism, illusion, and compassion in partnership themes.',
  Pl: 'Deep power and rebirth through intimate bonds.',
}

/** Rashi themes when a planet occupies that Navamsha. */
const RASHI_NAVAMSHA_FLAVOR: Record<Rashi, string> = {
  1: 'fiery, initiating, competitive energy',
  2: 'steady, sensual, value-oriented energy',
  3: 'curious, communicative, adaptable energy',
  4: 'nurturing, protective, mood-sensitive energy',
  5: 'proud, creative, heart-centered energy',
  6: 'precise, service-minded, analytical energy',
  7: 'relational, aesthetic, balancing energy',
  8: 'intense, investigative, transformative energy',
  9: 'expansive, ethical, wisdom-seeking energy',
  10: 'ambitious, structured, status-aware energy',
  11: 'networked, idealistic, gain-oriented energy',
  12: 'dissolving, compassionate, spiritual energy',
}

const HOUSE_THEMES_D9: Record<number, string> = {
  1: 'Self, body of destiny, and how you appear in mature life / marriage',
  2: 'Family values, speech, and shared resources after marriage',
  3: 'Courage, siblings, short journeys, and effort in partnership',
  4: 'Home happiness, emotional roots, and maternal blessings',
  5: 'Romance, creativity, children, and past-life merit',
  6: 'Service, health friction, debts, and rivals in married life',
  7: 'Spouse, contracts, and the quality of the primary partnership',
  8: 'Longevity of bond, intimacy, crises, and occult depth',
  9: 'Dharma, fortune, mentors, and higher purpose through marriage',
  10: 'Public karma, career support from spouse, and reputation',
  11: 'Gains, friendships, and fulfillment of desires together',
  12: 'Bed pleasures, losses, foreign lands, and spiritual surrender',
}

export interface NavamshaPlanetRow {
  id: GrahaId
  name: string
  d1Rashi: Rashi
  d1RashiName: string
  d1RashiShort: string
  d1Degree: number
  d9Rashi: Rashi
  d9RashiName: string
  d9RashiShort: string
  d9Degree: number
  /** Pada 1–9 within the natal sign */
  padaInSign: number
  d1House: number
  d9House: number
  d1Dignity: Dignity
  d9Dignity: Dignity
  isVargottama: boolean
  isPushkara: boolean
  pushkaraNote: string | null
  charaKaraka: string | null
  /** D1 rashi → D9 rashi house-count relation (e.g. Aries→Taurus = 2/12) */
  d1d9Relation: D1D9SignRelation
  /** Lord of the D9 sign (Navamsha dispositor) */
  d9Dispositor: GrahaId
  d9DispositorName: string
  /** Relative strength score 0–100 from D9 factors */
  strengthScore: number
  theme: string
  interpretation: string
}

export interface NavamshaDispositorLink {
  planetId: GrahaId
  planetName: string
  d9Rashi: Rashi
  d9RashiName: string
  dispositorId: GrahaId
  dispositorName: string
  dispositorD9Rashi: Rashi
  dispositorD9RashiName: string
  dispositorD9House: number
  note: string
}

export interface NavamshaExchange {
  aId: GrahaId
  aName: string
  aRashi: Rashi
  bId: GrahaId
  bName: string
  bRashi: Rashi
  note: string
}

export interface NavamshaConjunction {
  rashi: Rashi
  rashiName: string
  house: number
  planets: { id: GrahaId; name: string }[]
  note: string
}

export interface NavamshaDignityCrossover {
  id: GrahaId
  name: string
  kind: 'improvement' | 'decline' | 'uccha_navamsha' | 'neecha_navamsha' | 'own_navamsha'
  title: string
  text: string
}

export interface NavamshaRelationBucket {
  kind: D1D9RelationKind
  label: string
  pairHint: string
  tone: DashaTone
  count: number
  planets: { id: GrahaId; name: string; pair: string; from: string; to: string }[]
}

export interface NavamshaAdvanced {
  lagnaRelation: D1D9SignRelation
  relationBuckets: NavamshaRelationBucket[]
  supportiveCount: number
  challengingCount: number
  mixedCount: number
  dispositors: NavamshaDispositorLink[]
  exchanges: NavamshaExchange[]
  conjunctions: NavamshaConjunction[]
  dignityCrossovers: NavamshaDignityCrossover[]
  averageStrength: number
  strongest: { id: GrahaId; name: string; score: number } | null
  weakest: { id: GrahaId; name: string; score: number } | null
  notes: string[]
}

export interface NavamshaInsight {
  kind: 'strength' | 'caution' | 'highlight' | 'info'
  title: string
  text: string
}

export interface NavamshaHouseOccupant {
  id: GrahaId
  name: string
  rashi: Rashi
  rashiShort: string
  dignity: Dignity
  isVargottama: boolean
}

export interface NavamshaHouseRow {
  house: number
  rashi: Rashi
  rashiName: string
  rashiShort: string
  lord: GrahaId
  lordName: string
  theme: string
  occupants: NavamshaHouseOccupant[]
}

export interface NavamshaDashaLordOverlay {
  level: number
  levelLabel: string
  lord: GrahaId
  lordName: string
  start: string
  end: string
  d9Rashi: Rashi | null
  d9RashiName: string | null
  d9House: number | null
  d9Dignity: Dignity | null
  isVargottama: boolean
  isPushkara: boolean
  tone: DashaTone
  note: string
}

export interface NavamshaDashaOverlay {
  pathLabel: string
  lords: NavamshaDashaLordOverlay[]
  marriageWindow: string
  destinyWindow: string
  highlightHouses: number[]
}

export interface SpouseSketch {
  headline: string
  physique: string
  temperament: string
  values: string
  vocationHint: string
  relationshipStyle: string
  strengths: string[]
  cautions: string[]
  traits: string[]
  sources: string[]
}

export type NavamshaVariantId = 'D9' | 'D9_Pada' | 'D9_Nadi' | 'D9_Somanatha'

export interface NavamshaVariantPlanetCell {
  id: GrahaId
  name: string
  d1Rashi: Rashi
  d1RashiShort: string
  parashara: Rashi
  parasharaShort: string
  variants: Record<Exclude<NavamshaVariantId, 'D9'>, Rashi>
  agreementCount: number
}

export interface NavamshaVariantCompare {
  available: NavamshaVariantId[]
  lagna: Record<NavamshaVariantId, Rashi | null>
  lagnaNames: Record<NavamshaVariantId, string | null>
  planets: NavamshaVariantPlanetCell[]
  notes: string[]
  /** How many planet placements match Parashara D9 for each variant */
  matchRates: Record<Exclude<NavamshaVariantId, 'D9'>, { matches: number; total: number }>
}

export interface NavamshaAnalysis {
  d9Lagna: Rashi
  d9LagnaName: string
  d9LagnaSanskrit: string
  d9LagnaTheme: string
  lagnaVargottama: boolean
  karakamsha: Rashi
  karakamshaName: string
  karakamshaTheme: string
  atmakaraka: GrahaId
  atmakarakaName: string
  darakaraka: GrahaId
  darakarakaName: string
  planets: NavamshaPlanetRow[]
  vargottama: NavamshaPlanetRow[]
  pushkaraPlanets: NavamshaPlanetRow[]
  strongInD9: NavamshaPlanetRow[]
  weakInD9: NavamshaPlanetRow[]
  houses: NavamshaHouseRow[]
  seventhHouse: NavamshaHouseRow
  seventhLord: {
    id: GrahaId
    name: string
    d9Rashi: Rashi
    d9RashiName: string
    d9House: number
    d9Dignity: Dignity
    isVargottama: boolean
    interpretation: string
  }
  venusInD9: NavamshaPlanetRow | null
  jupiterInD9: NavamshaPlanetRow | null
  insights: NavamshaInsight[]
  summary: string
  marriageNotes: string[]
  destinyNotes: string[]
  spouseSketch: SpouseSketch
  dashaOverlay: NavamshaDashaOverlay | null
  variants: NavamshaVariantCompare
  advanced: NavamshaAdvanced
}

const DASHA_LEVEL_LABELS = ['', 'Maha', 'Antar', 'Pratyantar', 'Sukshma', 'Prana', 'Deha'] as const

const SPOUSE_PHYSIQUE: Record<Rashi, string> = {
  1: 'Lean-athletic build, alert gait, warm complexion; decisive facial features',
  2: 'Attractive, well-proportioned; pleasant voice; soft yet sturdy presence',
  3: 'Youthful look, expressive hands/face; quick movements; dual charm',
  4: 'Rounder, nurturing features; soothing eyes; comfort-oriented bearing',
  5: 'Dignified posture, bright face; magnetic or regal presence',
  6: 'Fine-boned or meticulous appearance; neat style; observant eyes',
  7: 'Balanced features, stylish presentation; socially graceful demeanor',
  8: 'Intense gaze, magnetic or mysterious aura; strong bone structure',
  9: 'Open countenance, optimistic carriage; possibly taller or expansive frame',
  10: 'Structured, mature look; composed posture; professional polish',
  11: 'Distinctive or unconventional style; intellectual facial energy',
  12: 'Soft, dreamy features; fluid presence; artistic or spiritual aura',
}

const SPOUSE_TEMPERAMENT: Record<Rashi, string> = {
  1: 'Direct, courageous, competitive; prefers action over long debate',
  2: 'Steady, pleasure-loving, value-conscious; loyal when trusted',
  3: 'Curious, talkative, versatile; needs mental stimulation',
  4: 'Emotionally sensitive, protective, home-centered',
  5: 'Warm, proud, creative; thrives on appreciation and play',
  6: 'Analytical, service-minded, detail-focused; can be critical',
  7: 'Diplomatic, partnership-oriented, fairness-seeking',
  8: 'Private, transformative, deeply loyal once bonded',
  9: 'Philosophical, ethical, adventure- or faith-inclined',
  10: 'Ambitious, duty-bound, status-aware; reliable under pressure',
  11: 'Friendly, progressive, network-oriented; idealistic streaks',
  12: 'Compassionate, imaginative, sometimes elusive or sacrificial',
}

const VOCATION_BY_SIGN: Record<Rashi, string> = {
  1: 'Leadership, sports, engineering, entrepreneurship, military/police',
  2: 'Finance, food, arts, banking, luxury goods, speech-related work',
  3: 'Media, writing, sales, design, short travel, skilled trades',
  4: 'Real estate, care professions, vehicles, hospitality, psychology',
  5: 'Entertainment, teaching children, politics, speculative creativity',
  6: 'Medicine, law, analytics, service industries, quality control',
  7: 'Law, diplomacy, design, counseling, public-facing partnerships',
  8: 'Research, occult/healing arts, insurance, surgery, investigation',
  9: 'Teaching, publishing, law, travel, spiritual or advisory roles',
  10: 'Management, government, corporate leadership, structured careers',
  11: 'Technology, networks, NGOs, large organizations, innovation',
  12: 'Healing, arts, foreign work, charities, solitude-based crafts',
}

export const NAVAMSHA_VARIANT_IDS: NavamshaVariantId[] = ['D9', 'D9_Pada', 'D9_Nadi', 'D9_Somanatha']
export const NAVAMSHA_VARIANT_LABELS: Record<NavamshaVariantId, string> = {
  D9: 'Parashara',
  D9_Pada: 'Pada',
  D9_Nadi: 'Nadi',
  D9_Somanatha: 'Somanatha',
}

function houseOf(planetRashi: Rashi, ascRashi: Rashi): number {
  return ((planetRashi - ascRashi + 12) % 12) + 1
}

function padaFromDegree(degreeInSign: number): number {
  const p = Math.floor(degreeInSign / (30 / 9)) + 1
  return Math.min(9, Math.max(1, p))
}

function dignityLabel(d: Dignity): string {
  return d.replace(/_/g, ' ')
}

function planetStrengthScore(row: {
  isVargottama: boolean
  isPushkara: boolean
  d9Dignity: Dignity
  d9House: number
  d1d9Relation: D1D9SignRelation
}): number {
  let score = 50
  if (row.isVargottama) score += 18
  if (row.isPushkara) score += 10
  if (row.d9Dignity === 'exalted') score += 16
  else if (row.d9Dignity === 'moolatrikona') score += 14
  else if (row.d9Dignity === 'own') score += 12
  else if (row.d9Dignity === 'great_friend' || row.d9Dignity === 'friend') score += 6
  else if (row.d9Dignity === 'enemy' || row.d9Dignity === 'great_enemy') score -= 8
  else if (row.d9Dignity === 'debilitated') score -= 14
  if ([1, 4, 5, 7, 9, 10].includes(row.d9House)) score += 8
  if ([6, 8, 12].includes(row.d9House)) score -= 8
  if (row.d1d9Relation.tone === 'supportive') score += 6
  if (row.d1d9Relation.tone === 'challenging') score -= 6
  return Math.max(0, Math.min(100, score))
}

function buildPlanetInterpretation(row: Omit<NavamshaPlanetRow, 'theme' | 'interpretation'>): {
  theme: string
  interpretation: string
} {
  const theme = PLANET_NAVAMSHA_THEMES[row.id] ?? 'Navamsha expression of this graha.'
  const flavor = RASHI_NAVAMSHA_FLAVOR[row.d9Rashi]
  const parts: string[] = []

  parts.push(
    `${row.name} moves from ${row.d1RashiName} (D1 H${row.d1House}) into ${row.d9RashiName} Navamsha (D9 H${row.d9House}), carrying ${flavor}.`,
  )
  parts.push(
    `D1→D9 relation ${row.d1d9Relation.pair} (${row.d1d9Relation.label}): ${row.d1d9Relation.note}`,
  )

  if (row.isVargottama) {
    parts.push(
      `Vargottama — same sign in D1 and D9 — greatly strengthens ${row.name}'s promise and makes its results more consistent.`,
    )
  }

  if (STRONG_DIGNITY.includes(row.d9Dignity)) {
    parts.push(`Dignified in Navamsha (${dignityLabel(row.d9Dignity)}) — mature results tend to support destiny and relationships.`)
  } else if (WEAK_DIGNITY.includes(row.d9Dignity)) {
    parts.push(`Challenged in Navamsha (${dignityLabel(row.d9Dignity)}) — refine this area through awareness, remedies, and patience.`)
  } else if (row.d1Dignity !== row.d9Dignity) {
    parts.push(`Dignity shifts from ${dignityLabel(row.d1Dignity)} in D1 to ${dignityLabel(row.d9Dignity)} in D9 — look at both charts together.`)
  }

  if (row.isPushkara) {
    parts.push(row.pushkaraNote ?? 'Pushkara Navamsha — highly auspicious for remedies and spiritual practice.')
  }

  parts.push(
    `Pada ${row.padaInSign} of ${row.d1RashiName} feeds this Navamsha; dispositor ${row.d9DispositorName} steers results.`,
  )

  return { theme, interpretation: parts.join(' ') }
}

function buildAdvanced(
  d1Asc: Rashi,
  d9Lagna: Rashi,
  planets: NavamshaPlanetRow[],
): NavamshaAdvanced {
  const lagnaRelation = buildD1D9Relation(d1Asc, d9Lagna)
  const kindOrder: D1D9RelationKind[] = [
    'vargottama', 'trikona', 'kendra', 'upachaya', 'opposing', 'dwirdwadasa', 'shadashtaka', 'unclassified',
  ]
  const buckets = new Map<D1D9RelationKind, NavamshaRelationBucket>()
  for (const kind of kindOrder) {
    const sample = relationFromSignCount(
      kind === 'vargottama' ? 1
        : kind === 'opposing' ? 7
          : kind === 'shadashtaka' ? 6
            : kind === 'dwirdwadasa' ? 2
              : kind === 'trikona' ? 5
                : kind === 'kendra' ? 4
                  : kind === 'upachaya' ? 3
                    : 0,
    )
    buckets.set(kind, {
      kind,
      label: sample.label,
      pairHint: kind === 'vargottama' ? '1/1'
        : kind === 'opposing' ? '7/7'
          : kind === 'shadashtaka' ? '6/8'
            : kind === 'dwirdwadasa' ? '2/12'
              : kind === 'trikona' ? '5/9'
                : kind === 'kendra' ? '4/10'
                  : kind === 'upachaya' ? '3/11'
                    : '—',
      tone: sample.tone,
      count: 0,
      planets: [],
    })
  }
  for (const p of planets) {
    const b = buckets.get(p.d1d9Relation.kind)
    if (!b) continue
    b.count++
    b.planets.push({
      id: p.id,
      name: p.name,
      pair: p.d1d9Relation.pair,
      from: p.d1RashiShort,
      to: p.d9RashiShort,
    })
  }
  const relationBuckets = kindOrder.map((k) => buckets.get(k)!).filter((b) => b.count > 0)

  let supportiveCount = 0
  let challengingCount = 0
  let mixedCount = 0
  for (const p of planets) {
    if (p.d1d9Relation.tone === 'supportive') supportiveCount++
    else if (p.d1d9Relation.tone === 'challenging') challengingCount++
    else if (p.d1d9Relation.tone === 'mixed') mixedCount++
  }

  const byId = new Map(planets.map((p) => [p.id, p]))
  const dispositors: NavamshaDispositorLink[] = planets.map((p) => {
    const disp = byId.get(p.d9Dispositor)
    return {
      planetId: p.id,
      planetName: p.name,
      d9Rashi: p.d9Rashi,
      d9RashiName: p.d9RashiName,
      dispositorId: p.d9Dispositor,
      dispositorName: p.d9DispositorName,
      dispositorD9Rashi: disp?.d9Rashi ?? p.d9Rashi,
      dispositorD9RashiName: disp?.d9RashiName ?? p.d9RashiName,
      dispositorD9House: disp?.d9House ?? p.d9House,
      note: disp
        ? `${p.name}'s Navamsha in ${p.d9RashiName} is steered by ${p.d9DispositorName} placed in ${disp.d9RashiName} (D9 H${disp.d9House}).`
        : `${p.name}'s Navamsha dispositor is ${p.d9DispositorName}.`,
    }
  })

  const exchanges: NavamshaExchange[] = []
  for (let i = 0; i < planets.length; i++) {
    for (let j = i + 1; j < planets.length; j++) {
      const a = planets[i]!
      const b = planets[j]!
      if (a.id === 'Ra' || a.id === 'Ke' || b.id === 'Ra' || b.id === 'Ke') continue
      const aOwns = OWN_SIGNS[a.id] ?? []
      const bOwns = OWN_SIGNS[b.id] ?? []
      if (aOwns.includes(b.d9Rashi) && bOwns.includes(a.d9Rashi) && a.d9Rashi !== b.d9Rashi) {
        exchanges.push({
          aId: a.id,
          aName: a.name,
          aRashi: a.d9Rashi,
          bId: b.id,
          bName: b.name,
          bRashi: b.d9Rashi,
          note: `D9 Parivartana: ${a.name} in ${a.d9RashiName} ↔ ${b.name} in ${b.d9RashiName} — mutual exchange strengthens both significations.`,
        })
      }
    }
  }

  const byRashi = new Map<Rashi, NavamshaPlanetRow[]>()
  for (const p of planets) {
    const list = byRashi.get(p.d9Rashi) ?? []
    list.push(p)
    byRashi.set(p.d9Rashi, list)
  }
  const conjunctions: NavamshaConjunction[] = []
  for (const [rashi, group] of byRashi) {
    if (group.length < 2) continue
    conjunctions.push({
      rashi,
      rashiName: RASHI_NAMES[rashi],
      house: group[0]!.d9House,
      planets: group.map((g) => ({ id: g.id, name: g.name })),
      note: `${group.map((g) => g.name).join(' + ')} share ${RASHI_NAMES[rashi]} Navamsha (D9 H${group[0]!.d9House}) — blended destiny themes.`,
    })
  }

  const dignityCrossovers: NavamshaDignityCrossover[] = []
  for (const p of planets) {
    if (p.id === 'Ra' || p.id === 'Ke') continue
    const exalt = EXALTATION_SIGN[p.id]
    const debil = DEBILITATION_SIGN[p.id]
    const owns = OWN_SIGNS[p.id] ?? []
    if (exalt && p.d9Rashi === exalt) {
      dignityCrossovers.push({
        id: p.id, name: p.name, kind: 'uccha_navamsha',
        title: 'Uccha Navamsha',
        text: `${p.name} is exalted in Navamsha (${p.d9RashiName}) — fruition potential is high even if D1 is mixed.`,
      })
    }
    if (debil && p.d9Rashi === debil) {
      dignityCrossovers.push({
        id: p.id, name: p.name, kind: 'neecha_navamsha',
        title: 'Neecha Navamsha',
        text: `${p.name} is debilitated in Navamsha (${p.d9RashiName}) — refine delivery of this planet's mature results.`,
      })
    }
    if (owns.includes(p.d9Rashi) && !p.isVargottama) {
      dignityCrossovers.push({
        id: p.id, name: p.name, kind: 'own_navamsha',
        title: 'Own Navamsha',
        text: `${p.name} occupies own sign in D9 (${p.d9RashiName}) — solid self-expression in destiny matters.`,
      })
    }
    if (WEAK_DIGNITY.includes(p.d1Dignity) && STRONG_DIGNITY.includes(p.d9Dignity)) {
      dignityCrossovers.push({
        id: p.id, name: p.name, kind: 'improvement',
        title: 'D1→D9 Improvement',
        text: `${p.name} is ${dignityLabel(p.d1Dignity)} in D1 but ${dignityLabel(p.d9Dignity)} in D9 — hardship can ripen into strength.`,
      })
    }
    if (STRONG_DIGNITY.includes(p.d1Dignity) && WEAK_DIGNITY.includes(p.d9Dignity)) {
      dignityCrossovers.push({
        id: p.id, name: p.name, kind: 'decline',
        title: 'D1→D9 Caution',
        text: `${p.name} looks strong in D1 (${dignityLabel(p.d1Dignity)}) but weakens in D9 (${dignityLabel(p.d9Dignity)}) — guard overconfidence.`,
      })
    }
  }

  const avg = planets.length
    ? planets.reduce((s, p) => s + p.strengthScore, 0) / planets.length
    : 0
  const sorted = [...planets].sort((a, b) => b.strengthScore - a.strengthScore)
  const strongest = sorted[0]
    ? { id: sorted[0].id, name: sorted[0].name, score: sorted[0].strengthScore }
    : null
  const weakest = sorted[sorted.length - 1]
    ? { id: sorted[sorted.length - 1]!.id, name: sorted[sorted.length - 1]!.name, score: sorted[sorted.length - 1]!.strengthScore }
    : null

  const notes: string[] = [
    `Lagna D1 ${RASHI_NAMES[d1Asc]} → D9 ${RASHI_NAMES[d9Lagna]} is ${lagnaRelation.pair} (${lagnaRelation.label}). ${lagnaRelation.note}`,
    `${supportiveCount} supportive · ${mixedCount} mixed · ${challengingCount} challenging D1↔D9 planet links.`,
  ]
  if (exchanges.length) notes.push(`${exchanges.length} D9 Parivartana yoga${exchanges.length > 1 ? 's' : ''} detected.`)
  if (conjunctions.length) notes.push(`${conjunctions.length} Navamsha conjunction cluster${conjunctions.length > 1 ? 's' : ''}.`)
  if (strongest) notes.push(`Strongest D9 signature: ${strongest.name} (${strongest.score}).`)

  return {
    lagnaRelation,
    relationBuckets,
    supportiveCount,
    challengingCount,
    mixedCount,
    dispositors,
    exchanges,
    conjunctions,
    dignityCrossovers,
    averageStrength: Math.round(avg * 10) / 10,
    strongest,
    weakest,
    notes,
  }
}

function seventhLordInterpretation(
  lord: GrahaId,
  d9Rashi: Rashi,
  d9House: number,
  dignity: Dignity,
  isVargottama: boolean,
): string {
  const name = GRAHA_NAMES[lord]
  const parts = [
    `7th lord of Navamsha (${name}) occupies ${RASHI_NAMES[d9Rashi]} in D9 house ${d9House} — a key to spouse nature and partnership karma.`,
  ]
  if (isVargottama) parts.push(`${name} is vargottama, stabilizing marriage indicators.`)
  if (STRONG_DIGNITY.includes(dignity)) parts.push(`Strong dignity (${dignityLabel(dignity)}) favors supportive partnership outcomes.`)
  if (WEAK_DIGNITY.includes(dignity)) parts.push(`Weak dignity (${dignityLabel(dignity)}) suggests extra care, counseling, or remedial focus in relationships.`)
  if ([6, 8, 12].includes(d9House)) {
    parts.push(`Placement in dusthana house ${d9House} of D9 can bring tests that ultimately deepen the bond if handled wisely.`)
  }
  if ([1, 4, 5, 7, 9, 10, 11].includes(d9House)) {
    parts.push(`Benefic house ${d9House} support for partnership themes is encouraging.`)
  }
  return parts.join(' ')
}

function toneFromPlanet(row: NavamshaPlanetRow | undefined): DashaTone {
  if (!row) return 'neutral'
  const strong = STRONG_DIGNITY.includes(row.d9Dignity) || row.isVargottama || row.isPushkara
  const weak = WEAK_DIGNITY.includes(row.d9Dignity) || [6, 8, 12].includes(row.d9House)
  if (strong && weak) return 'mixed'
  if (strong) return 'supportive'
  if (weak) return 'challenging'
  if ([1, 4, 5, 7, 9, 10, 11].includes(row.d9House)) return 'supportive'
  return 'neutral'
}

function formatDashaDate(value: Date | string | number): string {
  const d = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })
}

function buildSpouseSketch(input: {
  d9Lagna: Rashi
  seventhHouse: NavamshaHouseRow
  seventhLord: NavamshaAnalysis['seventhLord']
  venusInD9: NavamshaPlanetRow | null
  jupiterInD9: NavamshaPlanetRow | null
  dkRow: NavamshaPlanetRow | undefined
  gender: ChartOutput['meta']['gender']
}): SpouseSketch {
  const { d9Lagna, seventhHouse, seventhLord, venusInD9, jupiterInD9, dkRow, gender } = input
  const spouseSign = seventhHouse.rashi
  const sources: string[] = [
    `D9 7th in ${seventhHouse.rashiName}`,
    `7th lord ${seventhLord.name} in ${seventhLord.d9RashiName} (H${seventhLord.d9House})`,
  ]

  const traits: string[] = [
    SPOUSE_TEMPERAMENT[spouseSign].split(';')[0]!.trim(),
    RASHI_NAVAMSHA_FLAVOR[seventhLord.d9Rashi].replace(' energy', ''),
  ]

  if (seventhHouse.occupants.length) {
    traits.push(...seventhHouse.occupants.map((o) => `${o.name}-tinged presence`))
    sources.push(`Occupants of D9 7th: ${seventhHouse.occupants.map((o) => o.name).join(', ')}`)
  }
  if (venusInD9) {
    traits.push(`romance flavored by ${venusInD9.d9RashiName}`)
    sources.push(`Venus in D9 ${venusInD9.d9RashiName} H${venusInD9.d9House}`)
  }
  if (dkRow) {
    traits.push(`DK ${dkRow.name} signature`)
    sources.push(`Darakaraka ${dkRow.name} in ${dkRow.d9RashiName}`)
  }

  const strengths: string[] = []
  const cautions: string[] = []
  if (seventhLord.isVargottama) strengths.push('Vargottama 7th lord — steadier partnering karma')
  if (STRONG_DIGNITY.includes(seventhLord.d9Dignity)) strengths.push('7th lord dignified in Navamsha')
  if (WEAK_DIGNITY.includes(seventhLord.d9Dignity)) cautions.push('7th lord challenged in Navamsha — patience and clear communication matter')
  if ([6, 8, 12].includes(seventhLord.d9House)) cautions.push(`7th lord in D9 dusthana H${seventhLord.d9House} — growth through tests`)
  if (venusInD9?.isVargottama) strengths.push('Vargottama Venus supports lasting affection')
  if (venusInD9 && WEAK_DIGNITY.includes(venusInD9.d9Dignity)) cautions.push('Venus challenged in D9 — nurture aesthetic and emotional harmony')
  if (jupiterInD9 && STRONG_DIGNITY.includes(jupiterInD9.d9Dignity)) {
    strengths.push(gender === 'female' ? 'Strong Jupiter in D9 blesses husband/partner themes' : 'Strong Jupiter in D9 blesses wisdom within the union')
  }

  const gracePlanet = gender === 'female' ? 'Jupiter' : 'Venus'
  const relationshipStyle = [
    SPOUSE_TEMPERAMENT[spouseSign],
    venusInD9
      ? `Affection style leans ${RASHI_NAVAMSHA_FLAVOR[venusInD9.d9Rashi]} (Venus D9 H${venusInD9.d9House}).`
      : `Watch ${gracePlanet} carefully for finer romance tones.`,
  ].join(' ')

  return {
    headline: `Partner sketch from ${seventhHouse.rashiName} Navamsha 7th · lord ${seventhLord.name}`,
    physique: SPOUSE_PHYSIQUE[spouseSign],
    temperament: SPOUSE_TEMPERAMENT[spouseSign],
    values: NAVAMSHA_LAGNA_THEMES[d9Lagna].split(';')[0]!.trim(),
    vocationHint: VOCATION_BY_SIGN[seventhLord.d9Rashi] ?? VOCATION_BY_SIGN[spouseSign],
    relationshipStyle,
    strengths: strengths.length ? strengths : ['Classical indicators are mixed — synthesize D1 7th with D9 carefully'],
    cautions: cautions.length ? cautions : ['No major D9 caution flags — still confirm with dashas and D1'],
    traits: Array.from(new Set(traits)).slice(0, 8),
    sources,
  }
}

function buildDashaOverlay(
  chart: ChartOutput,
  planets: NavamshaPlanetRow[],
): NavamshaDashaOverlay | null {
  const nodes = chart.dashas?.vimshottari
  if (!nodes?.length) return null

  const path = getDashaPathAt(nodes)
  if (!path.length) return null

  const byId = new Map(planets.map((p) => [p.id, p]))
  const lords: NavamshaDashaLordOverlay[] = path.slice(0, 4).map((node) => {
    const lord = node.lord as GrahaId
    const row = byId.get(lord)
    const tone = toneFromPlanet(row)
    const levelLabel = DASHA_LEVEL_LABELS[node.level] ?? `L${node.level}`
    const noteParts: string[] = []
    if (!row) {
      noteParts.push(`${GRAHA_NAMES[lord] ?? lord} not found in D9 graha set.`)
    } else {
      noteParts.push(
        `${row.name} operates from ${row.d9RashiName} Navamsha (H${row.d9House}, ${dignityLabel(row.d9Dignity)}).`,
      )
      if (row.isVargottama) noteParts.push('Vargottama — period results tend to stick.')
      if (row.isPushkara) noteParts.push('Pushkara — auspicious for remedies during this stretch.')
      if ([7, 2, 8, 12].includes(row.d9House)) {
        noteParts.push(`D9 house ${row.d9House} links this period to partnership / intimacy themes.`)
      }
      if ([1, 5, 9].includes(row.d9House)) {
        noteParts.push(`D9 house ${row.d9House} links this period to self-expression and dharma.`)
      }
    }
    return {
      level: node.level,
      levelLabel,
      lord,
      lordName: GRAHA_NAMES[lord] ?? String(lord),
      start: formatDashaDate(node.start),
      end: formatDashaDate(node.end),
      d9Rashi: row?.d9Rashi ?? null,
      d9RashiName: row?.d9RashiName ?? null,
      d9House: row?.d9House ?? null,
      d9Dignity: row?.d9Dignity ?? null,
      isVargottama: row?.isVargottama ?? false,
      isPushkara: row?.isPushkara ?? false,
      tone,
      note: noteParts.join(' '),
    }
  })

  const maha = lords[0]
  const antar = lords[1]
  const marriageRelevant = lords.filter((l) => l.d9House != null && [2, 7, 8, 11, 12].includes(l.d9House))
  const destinyRelevant = lords.filter((l) => l.d9House != null && [1, 5, 9, 10].includes(l.d9House))

  const marriageWindow = marriageRelevant.length
    ? `Current ${lords.map((l) => l.lordName).join(' / ')} touches partnership houses in D9 (${marriageRelevant.map((l) => `${l.lordName} H${l.d9House}`).join(', ')}).`
    : `Current path ${lords.map((l) => l.lordName).join(' / ')} is less directly on D9 marriage houses — watch Venus/7th lord transits for timing color.`

  const destinyWindow = maha
    ? `Mahadasha lord ${maha.lordName}${maha.d9RashiName ? ` in ${maha.d9RashiName}` : ''}${maha.d9House != null ? ` (D9 H${maha.d9House})` : ''} sets the destiny climate${antar ? `; Antar ${antar.lordName} refines the chapter` : ''}.`
    : 'No active Vimshottari path available.'

  const highlightHouses = Array.from(
    new Set(lords.map((l) => l.d9House).filter((h): h is number => h != null)),
  )

  return {
    pathLabel: lords.map((l) => l.lordName).join(' / '),
    lords,
    marriageWindow,
    destinyWindow: destinyRelevant.length
      ? `${destinyWindow} Destiny-leaning lords: ${destinyRelevant.map((l) => `${l.lordName} H${l.d9House}`).join(', ')}.`
      : destinyWindow,
    highlightHouses,
  }
}

function resolveVariantRashi(
  chart: ChartOutput,
  variant: NavamshaVariantId,
  grahaId: GrahaId | 'As',
): Rashi | null {
  if (grahaId === 'As') {
    const fromChart = chart.vargaLagnas?.[variant]
    if (fromChart) return fromChart as Rashi
    const lon = chart.lagnas.ascDegree
    const fn = VARGA_FUNCTIONS[variant as VargaName]
    return fn ? (fn(lon) as Rashi) : null
  }
  const fromVargas = chart.vargas?.[variant]?.find((g) => g.id === grahaId)
  if (fromVargas) return fromVargas.rashi
  const natal = chart.grahas.find((g) => g.id === grahaId)
  if (!natal) return null
  const fn = VARGA_FUNCTIONS[variant as VargaName]
  return fn ? (fn(natal.lonSidereal) as Rashi) : null
}

function buildVariantCompare(chart: ChartOutput): NavamshaVariantCompare {
  const available = NAVAMSHA_VARIANT_IDS.filter((id) => {
    if (id === 'D9') return Boolean(chart.vargas?.D9?.length)
    return Boolean(chart.vargas?.[id]?.length) || Boolean(VARGA_FUNCTIONS[id as VargaName])
  })

  const lagna = {} as Record<NavamshaVariantId, Rashi | null>
  const lagnaNames = {} as Record<NavamshaVariantId, string | null>
  for (const id of NAVAMSHA_VARIANT_IDS) {
    const r = resolveVariantRashi(chart, id, 'As')
    lagna[id] = r
    lagnaNames[id] = r ? RASHI_NAMES[r] : null
  }

  const planets: NavamshaVariantPlanetCell[] = []
  for (const gid of CLASSICAL_ORDER) {
    const d1 = chart.grahas.find((g) => g.id === gid)
    const para = resolveVariantRashi(chart, 'D9', gid)
    if (!d1 || !para) continue
    const pada = resolveVariantRashi(chart, 'D9_Pada', gid) ?? para
    const nadi = resolveVariantRashi(chart, 'D9_Nadi', gid) ?? para
    const soma = resolveVariantRashi(chart, 'D9_Somanatha', gid) ?? para
    const variants = { D9_Pada: pada, D9_Nadi: nadi, D9_Somanatha: soma }
    const agreementCount = [pada, nadi, soma].filter((r) => r === para).length
    planets.push({
      id: gid,
      name: GRAHA_NAMES[gid],
      d1Rashi: d1.rashi,
      d1RashiShort: RASHI_SHORT[d1.rashi],
      parashara: para,
      parasharaShort: RASHI_SHORT[para],
      variants,
      agreementCount,
    })
  }

  const matchRates = {
    D9_Pada: { matches: 0, total: planets.length },
    D9_Nadi: { matches: 0, total: planets.length },
    D9_Somanatha: { matches: 0, total: planets.length },
  }
  for (const p of planets) {
    if (p.variants.D9_Pada === p.parashara) matchRates.D9_Pada.matches++
    if (p.variants.D9_Nadi === p.parashara) matchRates.D9_Nadi.matches++
    if (p.variants.D9_Somanatha === p.parashara) matchRates.D9_Somanatha.matches++
  }

  const notes = [
    `${VARGA_META.D9.full}: ${VARGA_META.D9.topic}.`,
    `${VARGA_META.D9_Pada.full}: ${VARGA_META.D9_Pada.topic}.`,
    `${VARGA_META.D9_Nadi.full}: ${VARGA_META.D9_Nadi.topic}.`,
    `${VARGA_META.D9_Somanatha.full}: ${VARGA_META.D9_Somanatha.topic}.`,
    'Use Parashara D9 as the primary predictive chart; variants refine research and Nadi-style comparisons.',
  ]

  return { available, lagna, lagnaNames, planets, notes, matchRates }
}

/**
 * Full Navamsha analysis from a calculated chart.
 * Requires chart.vargas.D9 and chart.vargaLagnas.D9.
 */
export function analyzeNavamsha(chart: ChartOutput): NavamshaAnalysis | null {
  const d9Grahas = chart.vargas?.D9
  const d9Lagna = chart.vargaLagnas?.D9
  if (!d9Grahas?.length || !d9Lagna) return null

  const d1Asc = chart.lagnas.ascRashi
  const d9ById = new Map<GrahaId, GrahaData>()
  for (const g of d9Grahas) d9ById.set(g.id, g)

  const planets: NavamshaPlanetRow[] = []

  for (const id of CLASSICAL_ORDER) {
    const d1 = chart.grahas.find((g) => g.id === id)
    const d9 = d9ById.get(id)
    if (!d1 || !d9) continue

    const padaInSign = d1.pushkara?.navamsha ?? padaFromDegree(d1.degree)
    const d1d9Relation = buildD1D9Relation(d1.rashi, d9.rashi)
    const d9Dispositor = SIGN_LORDS[d9.rashi]
    const base = {
      id,
      name: GRAHA_NAMES[id],
      d1Rashi: d1.rashi,
      d1RashiName: RASHI_NAMES[d1.rashi],
      d1RashiShort: RASHI_SHORT[d1.rashi],
      d1Degree: d1.degree,
      d9Rashi: d9.rashi,
      d9RashiName: RASHI_NAMES[d9.rashi],
      d9RashiShort: RASHI_SHORT[d9.rashi],
      d9Degree: d9.degree,
      padaInSign,
      d1House: houseOf(d1.rashi, d1Asc),
      d9House: houseOf(d9.rashi, d9Lagna),
      d1Dignity: d1.dignity,
      d9Dignity: d9.dignity,
      isVargottama: d1.rashi === d9.rashi,
      isPushkara: Boolean(d1.pushkara?.isPushkara),
      pushkaraNote: d1.pushkara?.remedy ?? null,
      charaKaraka: d1.charaKaraka,
      d1d9Relation,
      d9Dispositor,
      d9DispositorName: GRAHA_NAMES[d9Dispositor],
      strengthScore: 0,
    }
    base.strengthScore = planetStrengthScore(base)
    const { theme, interpretation } = buildPlanetInterpretation(base)
    planets.push({ ...base, theme, interpretation })
  }

  const vargottama = planets.filter((p) => p.isVargottama)
  const pushkaraPlanets = planets.filter((p) => p.isPushkara)
  const strongInD9 = planets.filter((p) => STRONG_DIGNITY.includes(p.d9Dignity))
  const weakInD9 = planets.filter((p) => WEAK_DIGNITY.includes(p.d9Dignity))

  const houses: NavamshaHouseRow[] = []
  for (let h = 1; h <= 12; h++) {
    const rashi = wholeSignHouseSign(d9Lagna, h)
    const lord = SIGN_LORDS[rashi]
    const occupants = planets
      .filter((p) => p.d9House === h)
      .map((p) => ({
        id: p.id,
        name: p.name,
        rashi: p.d9Rashi,
        rashiShort: p.d9RashiShort,
        dignity: p.d9Dignity,
        isVargottama: p.isVargottama,
      }))
    houses.push({
      house: h,
      rashi,
      rashiName: RASHI_NAMES[rashi],
      rashiShort: RASHI_SHORT[rashi],
      lord,
      lordName: GRAHA_NAMES[lord],
      theme: HOUSE_THEMES_D9[h],
      occupants,
    })
  }

  const seventhHouse = houses[6]!
  const seventhLordId = houseSignLord(d9Lagna, 7)
  const seventhLordRow = planets.find((p) => p.id === seventhLordId)
  const seventhLord = {
    id: seventhLordId,
    name: GRAHA_NAMES[seventhLordId],
    d9Rashi: seventhLordRow?.d9Rashi ?? d9Lagna,
    d9RashiName: seventhLordRow?.d9RashiName ?? RASHI_NAMES[d9Lagna],
    d9House: seventhLordRow?.d9House ?? 1,
    d9Dignity: seventhLordRow?.d9Dignity ?? ('neutral' as Dignity),
    isVargottama: seventhLordRow?.isVargottama ?? false,
    interpretation: seventhLordInterpretation(
      seventhLordId,
      seventhLordRow?.d9Rashi ?? d9Lagna,
      seventhLordRow?.d9House ?? 1,
      seventhLordRow?.d9Dignity ?? 'neutral',
      seventhLordRow?.isVargottama ?? false,
    ),
  }

  const ak = chart.karakas.AK
  const dk = chart.karakas.DK
  const akRow = planets.find((p) => p.id === ak)
  const karakamsha = akRow?.d9Rashi ?? (d9ById.get(ak)?.rashi as Rashi) ?? d9Lagna

  const lagnaVargottama = d1Asc === d9Lagna
  const venusInD9 = planets.find((p) => p.id === 'Ve') ?? null
  const jupiterInD9 = planets.find((p) => p.id === 'Ju') ?? null

  const insights: NavamshaInsight[] = []

  insights.push({
    kind: 'highlight',
    title: 'Navamsha Lagna',
    text: `${RASHI_NAMES[d9Lagna]} (${RASHI_SANSKRIT[d9Lagna]}) — ${NAVAMSHA_LAGNA_THEMES[d9Lagna]}`,
  })

  if (lagnaVargottama) {
    insights.push({
      kind: 'strength',
      title: 'Vargottama Lagna',
      text: 'Ascendant sign is the same in D1 and D9 — a powerful marker of consistent identity, purpose, and life direction.',
    })
  }

  if (vargottama.length) {
    insights.push({
      kind: 'strength',
      title: `${vargottama.length} Vargottama Planet${vargottama.length > 1 ? 's' : ''}`,
      text: vargottama.length === 1
        ? `${vargottama[0]!.name} occupies the same sign in Rashi and Navamsha — its significations gain lasting strength.`
        : `${vargottama.map((p) => p.name).join(', ')} occupy the same sign in Rashi and Navamsha — their significations gain lasting strength.`,
    })
  }

  if (pushkaraPlanets.length) {
    insights.push({
      kind: 'highlight',
      title: 'Pushkara Navamsha',
      text: pushkaraPlanets.length === 1
        ? `${pushkaraPlanets[0]!.name} sits in Pushkara Navamsha — excellent for remedies, mantra, and auspicious beginnings.`
        : `${pushkaraPlanets.map((p) => p.name).join(', ')} sit in Pushkara Navamsha — excellent for remedies, mantra, and auspicious beginnings.`,
    })
  }

  if (strongInD9.length) {
    insights.push({
      kind: 'strength',
      title: 'Dignified in D9',
      text: `${strongInD9.map((p) => `${p.name} (${dignityLabel(p.d9Dignity)})`).join(', ')} support mature destiny outcomes.`,
    })
  }

  if (weakInD9.length) {
    insights.push({
      kind: 'caution',
      title: 'Challenged in D9',
      text: `${weakInD9.map((p) => `${p.name} (${dignityLabel(p.d9Dignity)})`).join(', ')} ask for conscious refinement in those life areas.`,
    })
  }

  insights.push({
    kind: 'info',
    title: 'Karakamsha',
    text: `Atmakaraka ${GRAHA_NAMES[ak]} falls in ${RASHI_NAMES[karakamsha]} Navamsha (Karakamsha) — a Jaimini key to soul purpose and spiritual leaning.`,
  })

  const marriageNotes: string[] = [
    seventhLord.interpretation,
    `D9 7th house is ${seventhHouse.rashiName} ruled by ${seventhHouse.lordName}. ${HOUSE_THEMES_D9[7]}.`,
  ]
  if (seventhHouse.occupants.length) {
    marriageNotes.push(
      `Planets in D9 7th: ${seventhHouse.occupants.map((o) => o.name).join(', ')} — they color spouse traits and partnership dynamics.`,
    )
  } else {
    marriageNotes.push('D9 7th is unoccupied — read the 7th lord carefully along with Venus (and Jupiter for feminine charts).')
  }
  if (venusInD9) {
    marriageNotes.push(
      `Venus in ${venusInD9.d9RashiName} (D9 H${venusInD9.d9House}${venusInD9.isVargottama ? ', vargottama' : ''}) shapes romance, harmony, and aesthetic taste in marriage.`,
    )
  }
  if (jupiterInD9) {
    marriageNotes.push(
      `Jupiter in ${jupiterInD9.d9RashiName} (D9 H${jupiterInD9.d9House}${jupiterInD9.isVargottama ? ', vargottama' : ''}) blesses wisdom, children themes, and ethical tone in the union.`,
    )
  }
  const dkRow = planets.find((p) => p.id === dk)
  if (dkRow) {
    marriageNotes.push(
      `Darakaraka ${dkRow.name} in ${dkRow.d9RashiName} Navamsha (H${dkRow.d9House}) is a Jaimini spouse significator — study this placement closely.`,
    )
  }

  const destinyNotes: string[] = [
    NAVAMSHA_LAGNA_THEMES[d9Lagna],
    `Karakamsha in ${RASHI_NAMES[karakamsha]}: ${RASHI_NAVAMSHA_FLAVOR[karakamsha]} guides the soul's mature expression.`,
  ]
  if (akRow) {
    destinyNotes.push(
      `Atmakaraka ${akRow.name} in D9 house ${akRow.d9House} (${akRow.d9RashiName}) shows where the soul's lessons crystallize.`,
    )
  }
  const d9Ninth = houses[8]!
  destinyNotes.push(
    `D9 9th house ${d9Ninth.rashiName} (lord ${d9Ninth.lordName}) highlights fortune, mentors, and dharma after maturity.`,
  )

  const summaryParts = [
    `Navamsha lagna ${RASHI_NAMES[d9Lagna]}`,
    lagnaVargottama ? 'vargottama lagna' : null,
    vargottama.length ? `${vargottama.length} vargottama graha${vargottama.length > 1 ? 's' : ''}` : null,
    `Karakamsha ${RASHI_NAMES[karakamsha]}`,
    `7th lord ${seventhLord.name} in D9 H${seventhLord.d9House}`,
  ].filter(Boolean)

  const spouseSketch = buildSpouseSketch({
    d9Lagna,
    seventhHouse,
    seventhLord,
    venusInD9,
    jupiterInD9,
    dkRow,
    gender: chart.meta?.gender ?? 'other',
  })
  const dashaOverlay = buildDashaOverlay(chart, planets)
  const variants = buildVariantCompare(chart)
  const advanced = buildAdvanced(d1Asc, d9Lagna, planets)

  if (dashaOverlay) {
    insights.push({
      kind: 'info',
      title: 'Current Dasha × D9',
      text: `${dashaOverlay.pathLabel} — ${dashaOverlay.destinyWindow}`,
    })
  }

  insights.push({
    kind: advanced.lagnaRelation.tone === 'challenging' ? 'caution' : 'highlight',
    title: `Lagna D1↔D9 ${advanced.lagnaRelation.pair}`,
    text: `${advanced.lagnaRelation.fromName} → ${advanced.lagnaRelation.toName}: ${advanced.lagnaRelation.label}. ${advanced.lagnaRelation.note}`,
  })

  if (advanced.supportiveCount || advanced.challengingCount) {
    insights.push({
      kind: 'info',
      title: 'D1↔D9 Relation Mix',
      text: `${advanced.supportiveCount} supportive · ${advanced.mixedCount} mixed · ${advanced.challengingCount} challenging planet links (2/12, 5/9, 6/8, etc.).`,
    })
  }

  return {
    d9Lagna,
    d9LagnaName: RASHI_NAMES[d9Lagna],
    d9LagnaSanskrit: RASHI_SANSKRIT[d9Lagna],
    d9LagnaTheme: NAVAMSHA_LAGNA_THEMES[d9Lagna],
    lagnaVargottama,
    karakamsha,
    karakamshaName: RASHI_NAMES[karakamsha],
    karakamshaTheme: `Atmakaraka ${GRAHA_NAMES[ak]} in ${RASHI_NAMES[karakamsha]} — ${RASHI_NAVAMSHA_FLAVOR[karakamsha]}.`,
    atmakaraka: ak,
    atmakarakaName: GRAHA_NAMES[ak],
    darakaraka: dk,
    darakarakaName: GRAHA_NAMES[dk],
    planets,
    vargottama,
    pushkaraPlanets,
    strongInD9,
    weakInD9,
    houses,
    seventhHouse,
    seventhLord,
    venusInD9,
    jupiterInD9,
    insights,
    summary: summaryParts.join(' · '),
    marriageNotes,
    destinyNotes,
    spouseSketch,
    dashaOverlay,
    variants,
    advanced,
  }
}

/** Pada (1–9) of a longitude within its sign — useful for mapping UI. */
export function navamshaPada(lonSidereal: number): number {
  return padaFromDegree(degInSign(lonSidereal))
}

/** Engine D9 rashi for a sidereal longitude. */
export function navamshaRashi(lonSidereal: number): Rashi {
  return D9(lonSidereal) as Rashi
}

/** True when natal and Navamsha signs match. */
export function isVargottama(d1Rashi: Rashi, d9Rashi: Rashi): boolean {
  return d1Rashi === d9Rashi
}
