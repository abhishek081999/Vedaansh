// ─────────────────────────────────────────────────────────────
//  src/lib/engine/dashamsaClassical.ts
//  Dashamsha (D10) — BPHS mahatphala, Phaladeepika livelihood,
//  Saravali / Brihat Jataka 10th-sign nature, Jaimini AmK,
//  Uttara Kalamrita navamsha of the 10th lord,
//  plus natal rashi/bhava phala tables applied to D10 placements.
//  Pure: no React, DB, or network.
// ─────────────────────────────────────────────────────────────

import type { ChartOutput, Dignity, GrahaId, Rashi } from '@/types/astrology'
import { DEBILITATION_SIGN, EXALTATION_SIGN } from '@/lib/engine/dignity'
import { getDashaPathAt } from '@/lib/engine/dasha/current'
import {
  classicalNotesInLang,
  getDignityAwarePlanetInSign,
  getHouseClassical,
  getPlanetInHouseClassical,
  getRashiClassical,
  type ClassicalNote,
} from '@/lib/engine/classicalInterpretations'
import { getPlanetInHouse, getSignInHouse } from '@/lib/engine/houseInterpretations'
import { getRashiDeepGuide } from '@/lib/engine/rashiDeepGuide'
import {
  HOUSE_THEMES_D10,
  type CareerTone,
  type DashamsaAnalysis,
  type DashamsaPlanetRow,
} from '@/lib/engine/dashamsaAnalysis'
import { dignityText, fill, gName, pick, rName, type EngineLang } from '@/lib/engine/divisionalLang'
import {
  D10C_TEXT_EN,
  D10C_TEXT_HI,
  ELEMENT_COPY_HI,
  GRADE_COPY_HI,
  GRADE_LABEL_EN,
  GRADE_LABEL_HI,
  LIVELIHOOD_HI,
  MODALITY_COPY_HI,
  OCCUPANT_PHALA_HI,
  ROLE_LABEL_HI,
  TENTH_LORD_PHALA_HI,
} from '@/lib/engine/locale/dashamsaClassical.hi'

type D10Text = Record<keyof typeof D10C_TEXT_EN, string>

const CLASSICAL: GrahaId[] = ['Su', 'Mo', 'Ma', 'Me', 'Ju', 'Ve', 'Sa', 'Ra', 'Ke']
const SAPTA: GrahaId[] = ['Su', 'Mo', 'Ma', 'Me', 'Ju', 'Ve', 'Sa']

const SIGN_LORDS: Record<Rashi, GrahaId> = {
  1: 'Ma', 2: 'Ve', 3: 'Me', 4: 'Mo', 5: 'Su', 6: 'Me',
  7: 'Ve', 8: 'Ma', 9: 'Ju', 10: 'Sa', 11: 'Sa', 12: 'Ju',
}

/** BPHS digbala houses: Su/Ma 10, Sa 7, Ju/Me 1, Ve/Mo 4. */
const DIGBALA_HOUSE: Partial<Record<GrahaId, number>> = {
  Su: 10, Ma: 10, Sa: 7, Ju: 1, Me: 1, Ve: 4, Mo: 4,
}

export const LIVELIHOOD_WEIGHTS = {
  tenthLord: 42,
  occupant: 36,
  aspect: 16,
  navamshaLord: 28,
  conjunctLord: 12,
  tenthFromMoon: 12,
  tenthFromSun: 12,
  vargottama: 8,
  digbala: 6,
  combust: -10,
} as const

type RoleKey = keyof Pick<
  typeof LIVELIHOOD_WEIGHTS,
  'tenthLord' | 'occupant' | 'aspect' | 'navamshaLord' | 'conjunctLord' | 'tenthFromMoon' | 'tenthFromSun'
>

const ROLE_LABEL: Record<RoleKey, string> = {
  tenthLord: '10th lord',
  occupant: 'in the 10th',
  aspect: 'aspects the 10th',
  navamshaLord: 'Navamsha lord of the 10th lord',
  conjunctLord: 'conjunct the 10th lord',
  tenthFromMoon: '10th from Moon',
  tenthFromSun: '10th from Sun',
}

/** Phaladeepika livelihood chapter + Saravali / BPHS karakatva. */
export const LIVELIHOOD: Record<GrahaId, { nature: string; fields: string[] }> = {
  Su: {
    nature: 'Royal service, authority, gold, and state or father-linked karma',
    fields: ['Government and administration', 'Gold, treasury, and state supply', 'Medicine under authority', 'Wool, forest, and public works', 'Leadership of an institution'],
  },
  Mo: {
    nature: 'Public, watery, and nourishing trades',
    fields: ['Liquids, dairy, and agriculture', 'Pearls and water trades', 'Nursing and public care', 'Cloth, travel, and hospitality', 'Dealing with the public mood'],
  },
  Ma: {
    nature: 'Fire, metal, courage, and technical force',
    fields: ['Metals, fire, and weapons', 'Military, police, and surgery', 'Engineering and land', 'Chemistry, kitchens, and sport', 'Competitive or surgical skill'],
  },
  Me: {
    nature: 'Intellect, commerce, writing, and skilled speech',
    fields: ['Writing, accounts, and trade', 'Mathematics, astrology, and analysis', 'Poetry, crafts, and green goods', 'Brokerage and messaging', 'Teaching of a skill'],
  },
  Ju: {
    nature: 'Counsel, dharma, law, and protected expansion',
    fields: ['Counsel to authority', 'Law, banking, and treasury', 'Teaching and priesthood', 'Philosophy and publishing', 'Advisory and endowments'],
  },
  Ve: {
    nature: 'Art, comfort, gems, and refined commerce',
    fields: ['Gems, silver, and luxury', 'Music, dance, and poetry', 'Scents, cloth, and cattle', 'Vehicles and beauty trades', 'Diplomacy and the arts'],
  },
  Sa: {
    nature: 'Service, labor, oil, stone, and slow institutions',
    fields: ['Labor, oil, and minerals', 'Wood, stone, and iron', 'Service inside institutions', 'Structure that rewards endurance', 'Work with servants, land, or delay'],
  },
  Ra: {
    nature: 'Foreign, unconventional, and amplified ambition',
    fields: ['Foreign and border trades', 'Research, chemicals, and unusual goods', 'Technology and disruption', 'Paths outside the family profession'],
  },
  Ke: {
    nature: 'Specialist skill and work done without needing the throne',
    fields: ['Research and occult skill', 'Repair, tails, and specialist craft', 'Detached or moksha-leaning service', 'Mastery after a break in the path'],
  },
  Ur: { nature: 'Sudden reform', fields: [] },
  Ne: { nature: 'Idealism', fields: [] },
  Pl: { nature: 'Power', fields: [] },
}

/** BPHS bhava phala of the 10th lord. Used in Dashamsha and in the natal career desk. */
export const TENTH_LORD_PHALA: Record<number, { headline: string; prediction: string }> = {
  1: {
    headline: '10th lord in the 1st — self-made status',
    prediction: 'BPHS: karma-lord in the lagna ties the name to the work. The person is known for personal effort, learns the profession in the body, and rises when leading rather than hiding behind a post.',
  },
  2: {
    headline: '10th lord in the 2nd — wealth through the profession',
    prediction: 'BPHS: status feeds the family and the voice. Livelihood comes through speech, food, finance, or a household trade, and money follows the work more than titles do.',
  },
  3: {
    headline: '10th lord in the 3rd — courage, skill, and short ventures',
    prediction: 'BPHS: profession grows through courage, the hands, writing, siblings, or short travel. Initiative is the career. Resources can be held tightly while the skill is being proved.',
  },
  4: {
    headline: '10th lord in the 4th — property, vehicles, homeland work',
    prediction: 'BPHS: the profession builds conveyances, property, or a homeland institution, and emotional peace depends on whether the work feels like home. Teaching foundations and land sit naturally here.',
  },
  5: {
    headline: '10th lord in the 5th — intellect, authorship, counsel',
    prediction: 'BPHS: a ministerial and intelligent karma. Status comes through authorship, speculation, politics, students, or counsel — the work should create something that carries the name.',
  },
  6: {
    headline: '10th lord in the 6th — service and victory over rivals',
    prediction: 'BPHS: fame by overcoming opposition. Medicine, law, debt, labor, or competitive service. The body spends itself on the job; dignity returns when rivals are handled cleanly.',
  },
  7: {
    headline: '10th lord in the 7th — trade, partners, public dealing',
    prediction: 'BPHS: livelihood through partnership, spouse, clients, or trade, often with travel. Business fits better than a hidden desk. The public and the partner both shape the rise.',
  },
  8: {
    headline: '10th lord in the 8th — breaks, research, other people’s resources',
    prediction: 'BPHS: career longevity is uneven. Success comes through crisis, research, occult or insurance work, inheritance, or shared money — not through a straight ladder. Transformations are the job.',
  },
  9: {
    headline: '10th lord in the 9th — fortune and dharma in the work',
    prediction: 'BPHS: fortunate, teacher-backed profession. Authority, publishing, law, long travel, or a dharma-aligned post. When the work stays virtuous, status arrives with less force.',
  },
  10: {
    headline: '10th lord in the 10th — kingly karma',
    prediction: 'BPHS: the profession is the life. Self-made fame and visible actions. Strongest when the lord is dignified or has digbala; the person is identified with the post itself.',
  },
  11: {
    headline: '10th lord in the 11th — gains from the profession',
    prediction: 'BPHS: ambitions are fulfilled through work. Income, networks, and elder support are the visible fruit. Titles matter less than the gains that follow the karma.',
  },
  12: {
    headline: '10th lord in the 12th — foreign, secluded, or costly work',
    prediction: 'BPHS: expenses, foreign lands, hospitals, ashrams, or work behind the curtain. Comfort is thinner unless the lord is strong. Charity, export, research, or moksha-leaning service is the clean use of this placement.',
  },
}

/** BPHS phala of a planet occupying the 10th. */
export const OCCUPANT_PHALA: Record<GrahaId, string> = {
  Su: 'BPHS: Sun in the 10th has directional strength — government, administration, and a visible post. The state or the father is part of the karma. Give the ego a real seat of responsibility.',
  Mo: 'BPHS: Moon in the 10th makes reputation public and changeable. Care, liquids, travel, or the masses. A strong Moon settles the name; a weak Moon makes the post mood-dependent.',
  Ma: 'BPHS: Mars in the 10th has digbala — engineering, surgery, defense, land, or fire trades. Courage builds the career. Conflict at work is the tax when Mars is under pressure.',
  Me: 'BPHS / Phaladeepika: Mercury in the 10th is commerce, writing, accounts, and counsel. Skill is the livelihood. In a dual sign, expect two professional tracks.',
  Ju: 'BPHS: Jupiter in the 10th brings honor, counsel, teaching, law, or banking. Elders and teachers protect the rise. The profession should be one the person can defend as right.',
  Ve: 'BPHS: Venus in the 10th favors arts, luxury, diplomacy, vehicles, and pleasant public dealing. Status comes through refinement more than force.',
  Sa: 'BPHS: Saturn in the 10th delays, then hardens the post. Service, labor, minerals, oil, or institutions. The rise is slow and the durability is the result.',
  Ra: 'Rahu in the 10th amplifies ambition and foreign or unconventional karma. Reputation can spike; scandal is the risk when the method is impure.',
  Ke: 'Ketu in the 10th gives specialist mastery and a thin appetite for the throne. Breaks in the career path become the skill. Research and detached service fit.',
  Ur: '', Ne: '', Pl: '',
}

export type SignModality = 'movable' | 'fixed' | 'dual'
export type MahatGrade = 'ordinary' | 'notable' | 'distinguished' | 'mahat'

export function signModality(rashi: Rashi): SignModality {
  if (rashi === 1 || rashi === 4 || rashi === 7 || rashi === 10) return 'movable'
  if (rashi === 2 || rashi === 5 || rashi === 8 || rashi === 11) return 'fixed'
  return 'dual'
}

export function aspectHouses(id: GrahaId): number[] {
  if (id === 'Ma') return [4, 7, 8]
  if (id === 'Ju') return [5, 7, 9]
  if (id === 'Sa') return [3, 7, 10]
  return [7]
}

export function aspectsSign(from: Rashi, id: GrahaId, target: Rashi): boolean {
  const house = ((target - from + 12) % 12) + 1
  return aspectHouses(id).includes(house)
}

export function dignityPoints(dignity: Dignity): number {
  switch (dignity) {
    case 'exalted': return 18
    case 'moolatrikona': return 16
    case 'own': return 14
    case 'great_friend': return 8
    case 'friend': return 6
    case 'neutral': return 2
    case 'enemy': return -6
    case 'great_enemy': return -10
    case 'debilitated': return -14
    default: return 0
  }
}

export function housePoints(house: number): number {
  if (house === 1 || house === 4 || house === 7 || house === 10) return 8
  if (house === 5 || house === 9) return 6
  if (house === 11) return 7
  if (house === 6 || house === 8 || house === 12) return -6
  return 2
}

export function mahatGrade(score: number): MahatGrade {
  if (score >= 72) return 'mahat'
  if (score >= 52) return 'distinguished'
  if (score >= 34) return 'notable'
  return 'ordinary'
}

const GRADE_COPY: Record<MahatGrade, string> = {
  ordinary: 'Ordinary mahatphala — a workable profession; status grows by endurance more than by title.',
  notable: 'Notable mahatphala — the career can be named; effort still decides the height.',
  distinguished: 'Distinguished mahatphala — status and responsibility are a real promise, especially in the lords’ dashas.',
  mahat: 'Mahatphala proper — work of consequence, authority, or public karma when the chart is lived cleanly.',
}

const MODALITY_COPY: Record<SignModality, { label: string; prediction: string }> = {
  movable: {
    label: 'Chara · movable',
    prediction: 'Saravali and Brihat Jataka: a movable 10th changes profession, post, or city. Livelihood travels. Do not force one lifelong title — the karma is the through-line, the job is not.',
  },
  fixed: {
    label: 'Sthira · fixed',
    prediction: 'Saravali and Brihat Jataka: a fixed 10th is one steady profession. Persistence beats variety. Status accumulates in the same field.',
  },
  dual: {
    label: 'Dvisvabhāva · dual',
    prediction: 'Saravali and Brihat Jataka: a dual 10th runs two tracks — two professions, or one post plus a skill that also earns. Teach, write, or trade alongside the main karma.',
  },
}

const ELEMENT_COPY: Record<number, string> = {
  0: 'Fire 10th: the work leads, competes, or initiates.',
  1: 'Earth 10th: livelihood is material, structural, and counted in assets or institutions.',
  2: 'Air 10th: commerce, intellect, and networks are the medium of status.',
  3: 'Water 10th: the public, care, liquids, or research carry the profession.',
}

export interface ClassicalRole {
  key: RoleKey
  label: string
  points: number
}

export interface LivelihoodCandidate {
  id: GrahaId
  name: string
  score: number
  roles: ClassicalRole[]
  dignity: Dignity
  house: number
  why: string
  fields: string[]
}

export interface ClassicalPointer {
  id: string
  label: string
  detail: string
  source: string
}

export interface ClassicalYoga {
  id: string
  name: string
  source: string
  formed: boolean
  tone: CareerTone
  prediction: string
}

export interface ClassicalTiming {
  id: string
  title: string
  live: boolean
  window: string
  prediction: string
}

export interface LuminaryKarma {
  from: 'Moon' | 'Sun'
  signName: string
  houseFromLagna: number
  lordName: string
  occupants: string[]
  prediction: string
}

export interface MahatFactor {
  label: string
  points: number
  note: string
}

export interface DashamsaClassical {
  framing: string
  mahatphala: {
    grade: MahatGrade
    gradeLabel: string
    score: number
    headline: string
    text: string
    factors: MahatFactor[]
  }
  tenthLord: {
    id: GrahaId
    name: string
    house: number
    dignity: Dignity
    headline: string
    prediction: string
    source: string
  }
  tenthSign: {
    signName: string
    modality: SignModality
    modalityLabel: string
    element: string
    prediction: string
    d1Note: string
    source: string
  }
  livelihood: {
    method: string
    winner: LivelihoodCandidate
    candidates: LivelihoodCandidate[]
    prediction: string
  }
  mahatEmphasis: {
    winner: LivelihoodCandidate
    agrees: boolean
    agreement: string
  }
  pointers: ClassicalPointer[]
  yogas: ClassicalYoga[]
  tenthOccupants: { id: GrahaId; name: string; prediction: string }[]
  luminaries: LuminaryKarma[]
  amatyakaraka: {
    id: GrahaId
    name: string
    house: number
    rashiName: string
    dignity: Dignity
    headline: string
    prediction: string
    source: string
  } | null
  timing: ClassicalTiming[]
  /** Natal classical tables applied to D10 houses and signs. */
  phala: DashamsaPhala
  predictions: string[]
  readingOrder: string[]
  sources: string[]
}

export interface DashamsaPlanetPhala {
  id: GrahaId
  name: string
  d10House: number
  d10Rashi: Rashi
  d10RashiName: string
  priority: boolean
  role: string | null
  houseTeaching: string | null
  houseClassical: ClassicalNote[]
  signClassical: ClassicalNote[]
  careerLens: string
}

export interface DashamsaHousePhala {
  house: number
  rashi: Rashi
  rashiName: string
  d10Theme: string
  signInHouse: string | null
  houseClassical: ClassicalNote[]
  occupants: string[]
}

export interface DashamsaPhala {
  framing: string
  lagna: {
    rashi: Rashi
    rashiName: string
    keyword: string
    careers: string[]
    classical: ClassicalNote[]
    traits: string[]
  }
  keyHouses: DashamsaHousePhala[]
  priorityPlanets: DashamsaPlanetPhala[]
  otherPlanets: DashamsaPlanetPhala[]
}

function houseSign(asc: Rashi, house: number): Rashi {
  return (((asc - 1 + house - 1) % 12) + 1) as Rashi
}

const NOTE_REF_HI: Record<string, string> = {
  Vakri: 'वक्री', Asta: 'अस्त', 'Vakri+Asta': 'वक्री + अस्त', Dignity: 'गरिमा',
}

/** Hindi labels for the short `ref` tags of shared classical notes. */
function localizeRefs(notes: ClassicalNote[], lang: EngineLang): ClassicalNote[] {
  if (lang !== 'hi') return notes
  return notes.map((n) => (n.ref && NOTE_REF_HI[n.ref] ? { ...n, ref: NOTE_REF_HI[n.ref] } : n))
}

function houseFrom(planetRashi: Rashi, from: Rashi): number {
  return ((planetRashi - from + 12) % 12) + 1
}

function inKendraFrom(planetRashi: Rashi, from: Rashi): boolean {
  const h = houseFrom(planetRashi, from)
  return h === 1 || h === 4 || h === 7 || h === 10
}

function exaltationLord(sign: Rashi): GrahaId | null {
  for (const id of SAPTA) {
    if (EXALTATION_SIGN[id] === sign) return id
  }
  return null
}

function formatDay(value: Date | string | number): string {
  const d = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(d.getTime())) return String(value)
  return d.toISOString().slice(0, 10)
}

interface RoleAcc {
  id: GrahaId
  roles: ClassicalRole[]
}

function addRole(
  map: Map<GrahaId, RoleAcc>,
  id: GrahaId,
  key: RoleKey,
  labels: Record<RoleKey, string> = ROLE_LABEL,
) {
  if (!CLASSICAL.includes(id)) return
  let row = map.get(id)
  if (!row) {
    row = { id, roles: [] }
    map.set(id, row)
  }
  if (row.roles.some((r) => r.key === key)) return
  row.roles.push({ key, label: labels[key], points: LIVELIHOOD_WEIGHTS[key] })
}

function finishCandidate(
  acc: RoleAcc,
  row: DashamsaPlanetRow,
  dignity: Dignity,
  house: number,
  combust: boolean,
  useD1Digbala: boolean,
  livelihood: typeof LIVELIHOOD = LIVELIHOOD,
  lang: EngineLang = 'en',
  T: D10Text,
): LivelihoodCandidate {
  const digHouse = DIGBALA_HOUSE[acc.id]
  const digbala = digHouse != null && house === digHouse
  let score = acc.roles.reduce((s, r) => s + r.points, 0)
  score += dignityPoints(dignity)
  score += housePoints(house)
  const digPts = dignityPoints(dignity)
  const housePts = housePoints(house)
  const bits = [
    ...acc.roles.map((r) => `${r.label} +${r.points}`),
    fill(T.candDignity, {
      dignity: dignityText(dignity, lang),
      pts: `${digPts >= 0 ? '+' : ''}${digPts}`,
    }),
    fill(T.candHouse, {
      house,
      pts: `${housePts >= 0 ? '+' : ''}${housePts}`,
    }),
  ]
  if (row.isVargottama) {
    score += LIVELIHOOD_WEIGHTS.vargottama
    bits.push(fill(T.candVargottama, { pts: LIVELIHOOD_WEIGHTS.vargottama }))
  }
  if (digbala) {
    score += LIVELIHOOD_WEIGHTS.digbala
    bits.push(
      fill(useD1Digbala ? T.candDigbala : T.candD10Digbala, { pts: LIVELIHOOD_WEIGHTS.digbala }),
    )
  }
  if (combust) {
    score += LIVELIHOOD_WEIGHTS.combust
    bits.push(fill(T.candCombust, { pts: LIVELIHOOD_WEIGHTS.combust }))
  }
  const info = livelihood[acc.id]
  return {
    id: acc.id,
    name: gName(acc.id, lang),
    score,
    roles: acc.roles,
    dignity,
    house,
    why: bits.join(' · '),
    fields: info?.fields ?? [],
  }
}

function pickWinner(list: LivelihoodCandidate[]): LivelihoodCandidate | null {
  if (!list.length) return null
  const rank: RoleKey[] = [
    'tenthLord', 'occupant', 'navamshaLord', 'aspect', 'conjunctLord', 'tenthFromMoon', 'tenthFromSun',
  ]
  return [...list].sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score
    const ar = Math.min(...a.roles.map((r) => rank.indexOf(r.key)))
    const br = Math.min(...b.roles.map((r) => rank.indexOf(r.key)))
    if (ar !== br) return ar - br
    return CLASSICAL.indexOf(a.id) - CLASSICAL.indexOf(b.id)
  })[0]!
}

function beneficAspectsTenth(planets: DashamsaPlanetRow[], tenthSign: Rashi): boolean {
  return planets.some((p) =>
    (p.id === 'Ju' || p.id === 'Ve' || p.id === 'Mo')
    && aspectsSign(p.d10Rashi, p.id, tenthSign),
  )
}

/**
 * Classical Dashamsha reading.
 * D1 carries the Phaladeepika livelihood test.
 * D10 carries BPHS mahatphala (10th lord, yogas, digbala, AmK).
 */
export function buildDashamsaClassical(
  analysis: DashamsaAnalysis,
  chart: ChartOutput,
  lang: EngineLang = 'en',
): DashamsaClassical | null {
  const d1Asc = chart.lagnas?.ascRashi
  if (!d1Asc || !analysis.planets.length) return null

  const T = pick(D10C_TEXT_EN, D10C_TEXT_HI as D10Text, lang)
  const GRADE_LABEL = pick(GRADE_LABEL_EN, GRADE_LABEL_HI, lang)
  const dig = (d: Dignity) => dignityText(d, lang)
  const g = (id: GrahaId) => gName(id, lang)

  const ROLE = pick(ROLE_LABEL, ROLE_LABEL_HI, lang)
  const LIVE = pick(LIVELIHOOD, LIVELIHOOD_HI, lang)
  const GRADE = pick(GRADE_COPY, GRADE_COPY_HI, lang)
  const MOD = pick(MODALITY_COPY, MODALITY_COPY_HI, lang)
  const ELEM = pick(ELEMENT_COPY, ELEMENT_COPY_HI, lang)
  const TENTH = pick(TENTH_LORD_PHALA, TENTH_LORD_PHALA_HI, lang)
  const OCC = pick(OCCUPANT_PHALA, OCCUPANT_PHALA_HI, lang)

  const byId = new Map(analysis.planets.map((p) => [p.id, p]))
  const d1Graha = new Map(chart.grahas?.map((g) => [g.id, g]) ?? [])
  const d10Lagna = analysis.d10Lagna
  const d1TenthSign = houseSign(d1Asc, 10)
  const d10TenthSign = houseSign(d10Lagna, 10)
  const d1TenthLord = SIGN_LORDS[d1TenthSign]
  const d10TenthLord = SIGN_LORDS[d10TenthSign]
  const d10NinthLord = SIGN_LORDS[houseSign(d10Lagna, 9)]
  const d10EleventhLord = SIGN_LORDS[houseSign(d10Lagna, 11)]
  const d10LagnaLord = SIGN_LORDS[d10Lagna]
  const tenthLordRow = byId.get(d10TenthLord)
  const lagnaLordRow = byId.get(d10LagnaLord)
  if (!tenthLordRow) return null

  const d1LordRow = byId.get(d1TenthLord)

  const d9OfLord = chart.vargas?.D9?.find((g) => g.id === d1TenthLord)?.rashi ?? null
  const navamshaLord = d9OfLord ? SIGN_LORDS[d9OfLord] : null

  const moon = byId.get('Mo')
  const sun = byId.get('Su')
  const tenthFromMoon = moon ? houseSign(moon.d1Rashi, 10) : null
  const tenthFromSun = sun ? houseSign(sun.d1Rashi, 10) : null

  const d1Map = new Map<GrahaId, RoleAcc>()
  addRole(d1Map, d1TenthLord, 'tenthLord', ROLE)
  for (const p of analysis.planets) {
    if (p.d1Rashi === d1TenthSign) addRole(d1Map, p.id, 'occupant', ROLE)
    if (p.id !== d1TenthLord && aspectsSign(p.d1Rashi, p.id, d1TenthSign)) addRole(d1Map, p.id, 'aspect', ROLE)
    if (d1LordRow && p.id !== d1TenthLord && p.d1Rashi === d1LordRow.d1Rashi) {
      addRole(d1Map, p.id, 'conjunctLord', ROLE)
    }
    if (tenthFromMoon && (p.d1Rashi === tenthFromMoon || SIGN_LORDS[tenthFromMoon] === p.id)) {
      addRole(d1Map, p.id, 'tenthFromMoon', ROLE)
    }
    if (tenthFromSun && (p.d1Rashi === tenthFromSun || SIGN_LORDS[tenthFromSun] === p.id)) {
      addRole(d1Map, p.id, 'tenthFromSun', ROLE)
    }
  }
  if (navamshaLord) addRole(d1Map, navamshaLord, 'navamshaLord', ROLE)

  const d1Candidates = [...d1Map.values()]
    .map((acc) => {
      const row = byId.get(acc.id)
      if (!row) return null
      const combust = d1Graha.get(acc.id)?.isCombust ?? false
      return finishCandidate(acc, row, row.d1Dignity, row.d1House, combust, true, LIVE, lang, T)
    })
    .filter((c): c is LivelihoodCandidate => c != null)
    .sort((a, b) => b.score - a.score)

  const d10Map = new Map<GrahaId, RoleAcc>()
  addRole(d10Map, d10TenthLord, 'tenthLord', ROLE)
  for (const p of analysis.planets) {
    if (p.d10House === 10) addRole(d10Map, p.id, 'occupant', ROLE)
    if (p.id !== d10TenthLord && aspectsSign(p.d10Rashi, p.id, d10TenthSign)) {
      addRole(d10Map, p.id, 'aspect', ROLE)
    }
  }
  const d10Candidates = [...d10Map.values()]
    .map((acc) => {
      const row = byId.get(acc.id)
      if (!row) return null
      return finishCandidate(acc, row, row.d10Dignity, row.d10House, false, false, LIVE, lang, T)
    })
    .filter((c): c is LivelihoodCandidate => c != null)
    .sort((a, b) => b.score - a.score)

  const winner = pickWinner(d1Candidates)
  const mahatWinner = pickWinner(d10Candidates)
  if (!winner || !mahatWinner) return null

  const winnerRow = byId.get(winner.id)
  const combust = d1Graha.get(winner.id)?.isCombust ?? false
  const retro = d1Graha.get(winner.id)?.isRetro ?? false
  const livelihoodPrediction = [
    fill(T.livLead, { name: winner.name, roles: winner.roles.map((r) => r.label).join(', ') }),
    LIVE[winner.id]?.nature ?? '',
    winner.fields.length
      ? fill(T.livFields, { fields: winner.fields.slice(0, 3).join('; ') })
      : '',
    winnerRow
      ? fill(T.livInD10, {
          name: winner.name,
          rashi: winnerRow.d10RashiName,
          house: winnerRow.d10House,
          dignity: dig(winnerRow.d10Dignity),
        })
      : '',
    combust ? T.livCombust : '',
    retro ? T.livRetro : '',
  ].filter(Boolean).join(' ')

  const agrees = winner.id === mahatWinner.id
  const agreement = agrees
    ? fill(T.agreeYes, { name: winner.name })
    : fill(T.agreeNo, {
        winner: winner.name,
        mahat: mahatWinner.name,
        roles: mahatWinner.roles.map((r) => r.label).join(', '),
      })

  const pointers: ClassicalPointer[] = [
    {
      id: 'lord',
      label: T.ptrLord,
      detail: fill(T.ptrLordDetail, {
        planet: g(d1TenthLord),
        house: d1LordRow?.d1House ?? '—',
        dignity: d1LordRow ? dig(d1LordRow.d1Dignity) : '—',
      }),
      source: T.srcPhaladeepika,
    },
    {
      id: 'occupant',
      label: T.ptrOcc,
      detail:
        analysis.planets.filter((p) => p.d1Rashi === d1TenthSign).map((p) => p.name).join(', ')
        || T.ptrOccNone,
      source: T.srcPBJ,
    },
    {
      id: 'aspect',
      label: T.ptrAspect,
      detail:
        analysis.planets
          .filter((p) => aspectsSign(p.d1Rashi, p.id, d1TenthSign))
          .map((p) => p.name)
          .join(', ')
        || T.ptrAspectNone,
      source: T.srcDrishti,
    },
    {
      id: 'navamsha',
      label: T.ptrNav,
      detail: navamshaLord
        ? fill(T.ptrNavDetail, {
            navLord: g(navamshaLord),
            tenthLord: g(d1TenthLord),
            sign: rName(d9OfLord!, lang),
          })
        : T.ptrNavSkip,
      source: T.srcUK,
    },
  ]

  const lordPhala = TENTH[tenthLordRow.d10House] ?? TENTH[10]!
  const modality = signModality(d10TenthSign)
  const modalityCopy = MOD[modality]
  const element = ELEM[(d10TenthSign - 1) % 4] ?? ''
  const d1Modality = signModality(d1TenthSign)

  const occupants = analysis.planets
    .filter((p) => p.d10House === 10)
    .map((p) => ({
      id: p.id,
      name: p.name,
      prediction: OCC[p.id] || fill(T.occFallback, { name: p.name }),
    }))

  const yogas = buildYogas({
    planets: analysis.planets,
    d10Lagna,
    d10TenthLord,
    d10NinthLord,
    d10EleventhLord,
    d10LagnaLord,
    tenthLordRow,
    lagnaLordRow,
    moonRashi: moon?.d10Rashi ?? null,
    amk: (chart.karakas?.AmK ?? null) as GrahaId | null,
    byId,
    T,
    lang,
  })

  const amkId = (chart.karakas?.AmK ?? null) as GrahaId | null
  const amkRow = amkId ? byId.get(amkId) : undefined
  const amatyakaraka = amkRow && amkId
    ? {
        id: amkId,
        name: g(amkId),
        house: amkRow.d10House,
        rashiName: amkRow.d10RashiName,
        dignity: amkRow.d10Dignity,
        headline: fill(T.amkHeadline, { name: g(amkId), house: amkRow.d10House }),
        prediction: amkPrediction(amkRow, T, lang),
        source: T.amkSource,
      }
    : null

  const luminaries: LuminaryKarma[] = []
  if (moon) luminaries.push(luminary('Moon', moon.d10Rashi, d10Lagna, analysis.planets, T, lang))
  if (sun) luminaries.push(luminary('Sun', sun.d10Rashi, d10Lagna, analysis.planets, T, lang))

  const factors = mahatFactors({
    lagnaLordRow,
    tenthLordRow,
    yogas,
    amkRow,
    beneficAspect: beneficAspectsTenth(analysis.planets, d10TenthSign),
    occupants,
    T,
    lang,
  })
  const raw = factors.reduce((s, f) => s + f.points, 0)
  const score = Math.max(8, Math.min(96, raw))
  const grade = mahatGrade(score)

  const timing = buildTiming(
    chart,
  lang,
  T,
    [
      {
        id: 'tenth-lord',
        title: fill(T.timeTenthLord, { name: tenthLordRow.name }),
        planet: d10TenthLord,
        prediction: fill(T.timePredTenthLord, {
          name: tenthLordRow.name,
          house: tenthLordRow.d10House,
        }),
      },
      {
        id: 'livelihood',
        title: fill(T.timeLivelihood, { name: winner.name }),
        planet: winner.id,
        prediction: fill(T.timePredLivelihood, {
          name: winner.name,
          nature: LIVE[winner.id]?.nature ?? winner.name,
        }),
      },
      {
        id: 'mahat',
        title: fill(T.timeMahat, { name: mahatWinner.name }),
        planet: mahatWinner.id,
        prediction: fill(T.timePredMahat, { name: mahatWinner.name }),
      },
      ...(amkId
        ? [{
            id: 'amk',
            title: fill(T.timeAmk, { name: g(amkId) }),
            planet: amkId,
            prediction: fill(T.timePredAmk, { name: g(amkId) }),
          }]
        : []),
    ],
  )

  const formed = yogas.filter((y) => y.formed)
  const live = timing.find((t) => t.live)

  const predictions = [
    fill(T.predGrade, { grade: GRADE[grade], score }),
    fill(T.predLivelihood, {
      name: winner.name,
      detail: LIVE[winner.id]?.fields.slice(0, 2).join(lang === 'hi' ? ' और ' : ' and ') || LIVE[winner.id]?.nature || winner.name,
    }),
    agreement,
    fill(T.predTenthLord, {
      name: tenthLordRow.name,
      house: tenthLordRow.d10House,
      headline: lordPhala.headline,
    }),
    fill(T.predModality, {
      label: modalityCopy.label,
      sign: rName(d10TenthSign, lang),
      element,
    }),
    formed[0] ? formed[0].prediction : T.predNoYoga,
    live ? live.prediction : timing[0]?.prediction ?? T.predTimingFallback,
  ]

  const phala = buildPhala(analysis, chart, {
    lagnaLordId: d10LagnaLord,
    tenthLordId: d10TenthLord,
    eleventhLordId: d10EleventhLord,
    livelihoodId: winner.id,
    amkId,
  }, lang, T)
  if (phala.lagna.careers[0]) {
    predictions.push(
      fill(T.predLagnaCareers, {
        sign: phala.lagna.rashiName,
        keyword: phala.lagna.keyword,
        careers: phala.lagna.careers.slice(0, 3).join('; '),
      }),
    )
  }
  const priorityLens = phala.priorityPlanets[0]
  if (priorityLens) {
    predictions.push(fill(T.predPriorityLens, { name: priorityLens.name, lens: priorityLens.careerLens }))
  }

  return {
    framing: T.framing,
    mahatphala: {
      grade,
      gradeLabel: GRADE_LABEL[grade],
      score,
      headline: GRADE[grade],
      text: T.mahatText,
      factors,
    },
    tenthLord: {
      id: d10TenthLord,
      name: tenthLordRow.name,
      house: tenthLordRow.d10House,
      dignity: tenthLordRow.d10Dignity,
      headline: lordPhala.headline,
      prediction: fill(T.tenthLordPred, {
        name: tenthLordRow.name,
        house: tenthLordRow.d10House,
        rashi: tenthLordRow.d10RashiName,
        dignity: dig(tenthLordRow.d10Dignity),
        prediction: lordPhala.prediction,
      }),
      source: T.tenthLordSource,
    },
    tenthSign: {
      signName: rName(d10TenthSign, lang),
      modality,
      modalityLabel: modalityCopy.label,
      element,
      prediction: `${modalityCopy.prediction} ${element}`,
      d1Note: fill(T.d1TenthNote, {
        d1Sign: rName(d1TenthSign, lang),
        d1Mod: MOD[d1Modality].label,
        d10Sign: rName(d10TenthSign, lang),
      }),
      source: T.tenthSignSource,
    },
    livelihood: {
      method: T.livMethod,
      winner,
      candidates: d1Candidates,
      prediction: livelihoodPrediction,
    },
    mahatEmphasis: {
      winner: mahatWinner,
      agrees,
      agreement,
    },
    pointers,
    yogas,
    tenthOccupants: occupants,
    luminaries,
    amatyakaraka,
    timing,
    phala,
    predictions,
    readingOrder: [T.ro1, T.ro2, T.ro3, T.ro4, T.ro5, T.ro6, T.ro7, T.ro8, T.ro9],
    sources: [T.src1, T.src2, T.src3, T.src4, T.src5, T.src6],
  }
}

function buildPhala(
  analysis: DashamsaAnalysis,
  chart: ChartOutput,
  keys: {
    lagnaLordId: GrahaId
    tenthLordId: GrahaId
    eleventhLordId: GrahaId
    livelihoodId: GrahaId
    amkId: GrahaId | null
  },
  lang: EngineLang,
  T: D10Text,
): DashamsaPhala {
  const d1ById = new Map(chart.grahas?.map((g) => [g.id, g]) ?? [])
  const roleOf = (id: GrahaId): string | null => {
    const roles: string[] = []
    if (id === keys.lagnaLordId) roles.push(T.roleLagna)
    if (id === keys.tenthLordId) roles.push(T.roleTenth)
    if (id === keys.eleventhLordId) roles.push(T.role11)
    if (id === keys.livelihoodId) roles.push(T.roleLivelihood)
    if (keys.amkId && id === keys.amkId) roles.push(T.roleAmk)
    return roles.length ? roles.join(' · ') : null
  }
  const priorityIds = new Set<GrahaId>([
    keys.lagnaLordId,
    keys.tenthLordId,
    keys.eleventhLordId,
    keys.livelihoodId,
    ...(keys.amkId ? [keys.amkId] : []),
  ])

  const deep = getRashiDeepGuide(analysis.d10Lagna, lang)
  const lagna = {
    rashi: analysis.d10Lagna,
    rashiName: analysis.d10LagnaName,
    keyword: deep?.keyword ?? T.keywordFallback,
    careers: deep?.careers.slice(0, 8) ?? [],
    classical: classicalNotesInLang(getRashiClassical(analysis.d10Lagna), lang),
    traits: [
      ...(deep?.positiveTraits.slice(0, 2) ?? []),
      ...(deep?.behavioralNotes.slice(0, 1) ?? []),
    ],
  }

  const keyHouseNums = [1, 10, 11, 6, 7]
  const keyHouses: DashamsaHousePhala[] = keyHouseNums.map((house) => {
    const row = analysis.houses[house - 1]!
    return {
      house,
      rashi: row.rashi,
      rashiName: row.rashiName,
      d10Theme: row.theme || HOUSE_THEMES_D10[house] || fill(T.d10HouseTheme, { house }),
      signInHouse: getSignInHouse(house, row.rashi, lang),
      houseClassical: classicalNotesInLang(getHouseClassical(house).slice(0, 2), lang),
      occupants: row.occupants.map((o) => o.name),
    }
  })

  const planetPhalas: DashamsaPlanetPhala[] = analysis.planets
    .filter((p) => CLASSICAL.includes(p.id))
    .map((p) => {
      const natal = d1ById.get(p.id)
      const houseTeaching = getPlanetInHouse(p.id, p.d10House, 'summary', lang)
      const houseClassical = classicalNotesInLang(getPlanetInHouseClassical(p.id, p.d10House), lang)
      const signClassical = localizeRefs(classicalNotesInLang(
        getDignityAwarePlanetInSign(
          p.id,
          p.d10Rashi,
          p.d10Dignity,
          natal?.isCombust,
          natal?.isRetro,
        ),
        lang,
      ), lang)
      const houseRow = analysis.houses[p.d10House - 1]
      const d10Theme = houseRow?.theme || HOUSE_THEMES_D10[p.d10House] || fill(T.d10HouseTheme, { house: p.d10House })
      const careerLens = [
        houseTeaching
          ? fill(T.careerLensHouse, { name: p.name, house: p.d10House, teaching: houseTeaching })
          : fill(T.careerLensFallback, { name: p.name, house: p.d10House, theme: d10Theme }),
        signClassical[0]
          ? fill(T.careerLensSign, { rashi: p.d10RashiName, text: signClassical[0].text })
          : null,
      ].filter(Boolean).join(' ')

      return {
        id: p.id,
        name: p.name,
        d10House: p.d10House,
        d10Rashi: p.d10Rashi,
        d10RashiName: p.d10RashiName,
        priority: priorityIds.has(p.id),
        role: roleOf(p.id),
        houseTeaching,
        houseClassical,
        signClassical,
        careerLens,
      }
    })

  const priorityPlanets = planetPhalas
    .filter((p) => p.priority)
    .sort((a, b) => {
      const rank = (id: GrahaId) =>
        [keys.tenthLordId, keys.livelihoodId, keys.lagnaLordId, keys.eleventhLordId, keys.amkId]
          .indexOf(id)
      const ar = rank(a.id)
      const br = rank(b.id)
      return (ar < 0 ? 99 : ar) - (br < 0 ? 99 : br)
    })
  const otherPlanets = planetPhalas.filter((p) => !p.priority)

  return {
    framing: T.phalaFraming,
    lagna,
    keyHouses,
    priorityPlanets,
    otherPlanets,
  }
}

function luminary(
  from: 'Moon' | 'Sun',
  grahaRashi: Rashi,
  d10Lagna: Rashi,
  planets: DashamsaPlanetRow[],
  T: D10Text,
  lang: EngineLang,
): LuminaryKarma {
  const sign = houseSign(grahaRashi, 10)
  const lord = SIGN_LORDS[sign]
  const occupants = planets.filter((p) => p.d10Rashi === sign).map((p) => p.name)
  const houseFromLagna = houseFrom(sign, d10Lagna)
  const face = from === 'Moon' ? T.lumMoonFace : T.lumSunFace
  const fromLabel = gName(from === 'Moon' ? 'Mo' : 'Su', lang)
  const occPart = occupants.length ? fill(T.lumWithOcc, { names: occupants.join(', ') }) : ''
  return {
    from,
    signName: rName(sign, lang),
    houseFromLagna,
    lordName: gName(lord, lang),
    occupants,
    prediction: fill(T.lumPred, {
      from: fromLabel,
      sign: rName(sign, lang),
      house: houseFromLagna,
      lord: gName(lord, lang),
      occupants: occPart,
      face,
    }),
  }
}

function amkPrediction(row: DashamsaPlanetRow, T: D10Text, lang: EngineLang): string {
  const place = [1, 4, 7, 10].includes(row.d10House)
    ? T.amkPlaceKendra
    : [5, 9].includes(row.d10House)
      ? T.amkPlaceTrikona
      : row.d10House === 11
        ? T.amkPlace11
        : row.d10House === 10
          ? T.amkPlace10
          : [6, 8, 12].includes(row.d10House)
            ? T.amkPlaceDusthana
            : T.amkPlaceOther
  return fill(T.amkPred, {
    name: row.name,
    rashi: row.d10RashiName,
    house: row.d10House,
    dignity: dignityText(row.d10Dignity, lang),
    place,
  })
}

function mahatFactors(input: {
  lagnaLordRow: DashamsaPlanetRow | undefined
  tenthLordRow: DashamsaPlanetRow
  yogas: ClassicalYoga[]
  amkRow: DashamsaPlanetRow | undefined
  beneficAspect: boolean
  occupants: { id: GrahaId }[]
  T: D10Text
  lang: EngineLang
}): MahatFactor[] {
  const factors: MahatFactor[] = []
  const { lagnaLordRow, tenthLordRow, yogas, T, lang } = input
  const dig = (d: Dignity) => dignityText(d, lang)
  const formed = (id: string) => yogas.find((y) => y.id === id)?.formed ?? false

  if (lagnaLordRow) {
    const pts = dignityPoints(lagnaLordRow.d10Dignity)
    factors.push({
      label: T.mfLagnaLord,
      points: pts,
      note: fill(T.mfLagnaNote, {
        name: lagnaLordRow.name,
        dignity: dig(lagnaLordRow.d10Dignity),
        house: lagnaLordRow.d10House,
      }),
    })
  }
  factors.push({
    label: T.mfTenthDig,
    points: dignityPoints(tenthLordRow.d10Dignity),
    note: fill(T.mfTenthDigNote, {
      name: tenthLordRow.name,
      dignity: dig(tenthLordRow.d10Dignity),
    }),
  })
  factors.push({
    label: T.mfTenthHouse,
    points: housePoints(tenthLordRow.d10House),
    note: fill(T.mfTenthHouseNote, { house: tenthLordRow.d10House }),
  })
  if (input.occupants.some((o) => o.id === 'Su' || o.id === 'Ma')) {
    factors.push({
      label: T.mfDigbala,
      points: 8,
      note: T.mfDigbalaNote,
    })
  }
  if (formed('dharma-karmadhipati')) {
    factors.push({
      label: T.mfDk,
      points: 12,
      note: T.mfDkNote,
    })
  }
  if (tenthLordRow.isVargottama) {
    factors.push({
      label: T.mfVgTenth,
      points: 8,
      note: fill(T.mfVgTenthNote, { name: tenthLordRow.name }),
    })
  }
  if (lagnaLordRow?.isVargottama) {
    factors.push({
      label: T.mfVgLagna,
      points: 6,
      note: fill(T.mfVgLagnaNote, { name: lagnaLordRow.name }),
    })
  }
  if (formed('neecha-bhanga')) {
    const yoga = yogasTone(yogas, 'neecha-bhanga')
    factors.push({
      label: T.mfNeecha,
      points: yoga === 'supportive' ? 6 : yoga === 'challenging' ? -10 : 0,
      note: yoga === 'supportive'
        ? T.mfNeechaCancel
        : yoga === 'challenging'
          ? T.mfNeechaStand
          : T.mfNeechaPartial,
    })
  }
  if (input.amkRow && [1, 4, 5, 7, 9, 10, 11].includes(input.amkRow.d10House)) {
    factors.push({
      label: T.mfAmk,
      points: 6,
      note: fill(T.mfAmkNote, { name: input.amkRow.name, house: input.amkRow.d10House }),
    })
  }
  if (input.beneficAspect) {
    factors.push({
      label: T.mfDrishti,
      points: 4,
      note: T.mfDrishtiNote,
    })
  }
  return factors
}

function yogasTone(yogas: ClassicalYoga[], id: string): CareerTone | null {
  return yogas.find((y) => y.id === id)?.tone ?? null
}

function buildYogas(ctx: {
  planets: DashamsaPlanetRow[]
  d10Lagna: Rashi
  d10TenthLord: GrahaId
  d10NinthLord: GrahaId
  d10EleventhLord: GrahaId
  d10LagnaLord: GrahaId
  tenthLordRow: DashamsaPlanetRow
  lagnaLordRow: DashamsaPlanetRow | undefined
  moonRashi: Rashi | null
  amk: GrahaId | null
  byId: Map<GrahaId, DashamsaPlanetRow>
  T: D10Text
  lang: EngineLang
}): ClassicalYoga[] {
  const {
    planets, d10TenthLord, d10NinthLord, d10EleventhLord, d10LagnaLord,
    tenthLordRow, lagnaLordRow, byId, T, lang,
  } = ctx
  const g = (id: GrahaId) => gName(id, lang)
  const dig = (d: Dignity) => dignityText(d, lang)
  const ninth = byId.get(d10NinthLord)
  const eleventh = byId.get(d10EleventhLord)

  const conjunct = ninth && ninth.d10Rashi === tenthLordRow.d10Rashi && d10NinthLord !== d10TenthLord
  const exchange9 = ninth
    ? exchanges(d10NinthLord, d10TenthLord, byId)
    : false
  const aspect9 = ninth
    ? aspectsSign(ninth.d10Rashi, d10NinthLord, tenthLordRow.d10Rashi)
      || aspectsSign(tenthLordRow.d10Rashi, d10TenthLord, ninth.d10Rashi)
    : false
  const sameLord910 = d10NinthLord === d10TenthLord
  const dk = Boolean(sameLord910 || conjunct || exchange9 || aspect9)
  let dkHow = T.dkNotSambandha
  if (sameLord910) dkHow = fill(T.dkSameLord, { planet: g(d10TenthLord) })
  else if (conjunct) {
    dkHow = fill(T.dkConjunct, {
      ninth: ninth!.name,
      tenth: tenthLordRow.name,
      sign: tenthLordRow.d10RashiName,
    })
  } else if (exchange9) {
    dkHow = fill(T.dkExchange, { ninth: g(d10NinthLord), tenth: tenthLordRow.name })
  } else if (aspect9) {
    dkHow = fill(T.dkAspect, { ninth: g(d10NinthLord), tenth: tenthLordRow.name })
  }

  const digbalaOccupants = planets.filter((p) => p.d10House === 10 && (p.id === 'Su' || p.id === 'Ma'))
  const ownInTenth = planets.filter((p) =>
    p.d10House === 10 && (p.d10Dignity === 'own' || p.d10Dignity === 'exalted' || p.d10Dignity === 'moolatrikona'),
  )
  const sun = byId.get('Su')
  const merc = byId.get('Me')
  const budha = Boolean(sun && merc && sun.d10Rashi === merc.d10Rashi)

  const neecha = neechaReport(ctx.moonRashi, byId, [
    d10TenthLord, d10LagnaLord, 'Su', 'Sa', 'Me', 'Ju', 'Ma', 'Ve', 'Mo',
    ...(ctx.amk ? [ctx.amk] : []),
  ], T)

  const same1011 = d10TenthLord === d10EleventhLord
  const labha = Boolean(
    tenthLordRow.d10House === 11
    || (eleventh && eleventh.d10House === 10)
    || (eleventh && exchanges(d10TenthLord, d10EleventhLord, byId)),
  )
  const parivartana110 = exchanges(d10LagnaLord, d10TenthLord, byId)
  const parivartana1011 = eleventh ? exchanges(d10TenthLord, d10EleventhLord, byId) : false
  const parivartana910 = exchange9

  const vip = viparita(ctx.d10Lagna, byId, T)
  const vgNames = [lagnaLordRow, tenthLordRow].filter((p) => p?.isVargottama).map((p) => p!.name)
  const amkRow = ctx.amk ? byId.get(ctx.amk) : undefined
  const amkStrong = Boolean(amkRow && [1, 4, 5, 7, 9, 10, 11].includes(amkRow.d10House))

  const ownDetail = ownInTenth
    .map((p) => fill(T.ySwPlanet, { name: p.name, dignity: dig(p.d10Dignity) }))
    .join(', ')

  const yogas: ClassicalYoga[] = [
    {
      id: 'dharma-karmadhipati',
      name: T.yDkName,
      source: T.yDkSrc,
      formed: dk,
      tone: dk ? 'supportive' : 'neutral',
      prediction: dk ? fill(T.yDkYes, { how: dkHow }) : T.yDkNo,
    },
    {
      id: 'digbala-d10',
      name: T.yDigName,
      source: T.yDigSrc,
      formed: digbalaOccupants.length > 0,
      tone: digbalaOccupants.length ? 'supportive' : 'neutral',
      prediction: digbalaOccupants.length
        ? fill(T.yDigYes, { names: digbalaOccupants.map((p) => p.name).join(lang === 'hi' ? ' और ' : ' and ') })
        : T.yDigNo,
    },
    {
      id: 'swakshetra-tenth',
      name: T.ySwName,
      source: T.ySwSrc,
      formed: ownInTenth.length > 0,
      tone: ownInTenth.length ? 'supportive' : 'neutral',
      prediction: ownInTenth.length ? fill(T.ySwYes, { detail: ownDetail }) : T.ySwNo,
    },
    {
      id: 'budhaditya',
      name: T.yBudhaName,
      source: T.yBudhaSrc,
      formed: budha,
      tone: budha ? 'supportive' : 'neutral',
      prediction: budha ? fill(T.yBudhaYes, { sign: sun!.d10RashiName }) : T.yBudhaNo,
    },
    {
      id: 'neecha-bhanga',
      name: neecha.cancelled ? T.yNeechaBhanga : T.yNeechaDebil,
      source: T.yNeechaSrc,
      formed: neecha.planets.length > 0,
      tone: !neecha.planets.length ? 'neutral' : neecha.cancelled ? 'supportive' : neecha.partial ? 'mixed' : 'challenging',
      prediction: neecha.planets.length ? neecha.text : T.yNeechaNone,
    },
    {
      id: 'karma-labha-lord',
      name: T.yKarmaLabhaName,
      source: T.yKarmaLabhaSrc,
      formed: same1011,
      tone: same1011 ? 'mixed' : 'neutral',
      prediction: same1011
        ? fill(T.yKarmaLabhaYes, { planet: g(d10TenthLord) })
        : T.yKarmaLabhaNo,
    },
    {
      id: 'labha-link',
      name: T.yLabhaName,
      source: T.yLabhaSrc,
      formed: labha && !same1011,
      tone: labha && !same1011 ? 'supportive' : 'neutral',
      prediction: labha && !same1011 ? T.yLabhaYes : T.yLabhaNo,
    },
    {
      id: 'parivartana-9-10',
      name: T.yPar910Name,
      source: T.yPar910Src,
      formed: parivartana910,
      tone: parivartana910 ? 'supportive' : 'neutral',
      prediction: parivartana910 ? T.yPar910Yes : T.yPar910No,
    },
    {
      id: 'parivartana-1-10',
      name: T.yPar110Name,
      source: T.yPar110Src,
      formed: parivartana110,
      tone: parivartana110 ? 'supportive' : 'neutral',
      prediction: parivartana110 ? T.yPar110Yes : T.yPar110No,
    },
    {
      id: 'parivartana-10-11',
      name: T.yPar1011Name,
      source: T.yPar1011Src,
      formed: parivartana1011,
      tone: parivartana1011 ? 'supportive' : 'neutral',
      prediction: parivartana1011 ? T.yPar1011Yes : T.yPar1011No,
    },
    {
      id: 'viparita',
      name: T.yVipName,
      source: T.yVipSrc,
      formed: vip.formed,
      tone: vip.formed ? 'mixed' : 'neutral',
      prediction: vip.formed ? vip.text : T.yVipNo,
    },
    {
      id: 'vargottama-karma',
      name: T.yVgName,
      source: T.yVgSrc,
      formed: vgNames.length > 0,
      tone: vgNames.length ? 'supportive' : 'neutral',
      prediction: vgNames.length
        ? fill(T.yVgYes, {
            names: vgNames.join(lang === 'hi' ? ' और ' : ' and '),
            keep: vgNames.length > 1 ? T.yVgKeep : T.yVgKeeps,
          })
        : T.yVgNo,
    },
    {
      id: 'amk-strength',
      name: T.yAmkName,
      source: T.yAmkSrc,
      formed: amkStrong,
      tone: amkStrong ? 'supportive' : 'neutral',
      prediction: amkRow
        ? amkStrong
          ? fill(T.yAmkYesStrong, { name: amkRow.name, house: amkRow.d10House })
          : fill(T.yAmkYesWeak, { name: amkRow.name, house: amkRow.d10House })
        : T.yAmkNoChart,
    },
  ]

  return yogas
}

function exchanges(
  a: GrahaId,
  b: GrahaId,
  byId: Map<GrahaId, DashamsaPlanetRow>,
): boolean {
  if (a === b) return false
  const ra = byId.get(a)
  const rb = byId.get(b)
  if (!ra || !rb) return false
  return SIGN_LORDS[ra.d10Rashi] === b && SIGN_LORDS[rb.d10Rashi] === a
}

function neechaReport(
  moonRashi: Rashi | null,
  byId: Map<GrahaId, DashamsaPlanetRow>,
  relevant: GrahaId[],
  T: D10Text,
): { planets: string[]; cancelled: boolean; partial: boolean; text: string } {
  const hits: { name: string; cancelled: boolean; reason: string }[] = []
  const seen = new Set<GrahaId>()
  for (const id of relevant) {
    if (seen.has(id) || !SAPTA.includes(id)) continue
    seen.add(id)
    const row = byId.get(id)
    if (!row) continue
    const fallen = row.d10Dignity === 'debilitated' || DEBILITATION_SIGN[id] === row.d10Rashi
    if (!fallen) continue
    const dispositorId = SIGN_LORDS[row.d10Rashi]
    const dispositor = byId.get(dispositorId)
    const exaltLord = exaltationLord(row.d10Rashi)
    const exaltRow = exaltLord ? byId.get(exaltLord) : undefined
    const fromLagnaDisp = dispositor
      ? [1, 4, 7, 10].includes(dispositor.d10House)
      : false
    const fromMoonDisp = Boolean(
      moonRashi && dispositor && inKendraFrom(dispositor.d10Rashi, moonRashi),
    )
    const fromLagnaEx = exaltRow ? [1, 4, 7, 10].includes(exaltRow.d10House) : false
    const fromMoonEx = Boolean(
      moonRashi && exaltRow && inKendraFrom(exaltRow.d10Rashi, moonRashi),
    )
    const bits: string[] = []
    if (fromLagnaDisp || fromMoonDisp) {
      bits.push(fill(T.neechaDisp, {
        name: dispositor!.name,
        from: fromLagnaDisp ? T.neechaFromLagna : T.neechaFromMoon,
      }))
    }
    if (fromLagnaEx || fromMoonEx) {
      bits.push(fill(T.neechaExalt, {
        name: exaltRow!.name,
        from: fromLagnaEx ? T.neechaFromLagna : T.neechaFromMoon,
      }))
    }
    hits.push({
      name: row.name,
      cancelled: bits.length > 0,
      reason: bits.join('; '),
    })
  }
  if (!hits.length) return { planets: [], cancelled: false, partial: false, text: '' }
  const cancelledCount = hits.filter((h) => h.cancelled).length
  const text = hits.map((h) =>
    h.cancelled
      ? fill(T.neechaCancelled, { name: h.name, reason: h.reason })
      : fill(T.neechaUncancelled, { name: h.name }),
  ).join(' ')
  return {
    planets: hits.map((h) => h.name),
    cancelled: cancelledCount === hits.length,
    partial: cancelledCount > 0 && cancelledCount < hits.length,
    text,
  }
}

function viparita(
  d10Lagna: Rashi,
  byId: Map<GrahaId, DashamsaPlanetRow>,
  T: D10Text,
): { formed: boolean; text: string } {
  const checks: { label: string; lordHouse: number; houses: number[] }[] = [
    { label: T.vipHarsha, lordHouse: 6, houses: [8, 12] },
    { label: T.vipSarala, lordHouse: 8, houses: [6, 12] },
    { label: T.vipVimala, lordHouse: 12, houses: [6, 8] },
  ]
  const hits: string[] = []
  for (const c of checks) {
    const lord = SIGN_LORDS[houseSign(d10Lagna, c.lordHouse)]
    const row = byId.get(lord)
    if (row && c.houses.includes(row.d10House)) {
      hits.push(fill(T.vipHit, { label: c.label, name: row.name, house: row.d10House }))
    }
  }
  if (!hits.length) return { formed: false, text: '' }
  return {
    formed: true,
    text: fill(T.vipSummary, { hits: hits.join('; ') }),
  }
}

const DASHA_LEVEL_KEYS = [
  'dashaLevel0',
  'dashaLevel1',
  'dashaLevel2',
  'dashaLevel3',
  'dashaLevel4',
] as const satisfies readonly (keyof typeof D10C_TEXT_EN)[]

function buildTiming(
  chart: ChartOutput,
  lang: EngineLang,
  T: D10Text,
  items: { id: string; title: string; planet: GrahaId; prediction: string }[],
): ClassicalTiming[] {
  const path = getDashaPathAt(chart.dashas?.vimshottari ?? [])
  const seen = new Set<GrahaId>()
  const out: ClassicalTiming[] = []
  for (const item of items) {
    if (seen.has(item.planet)) continue
    seen.add(item.planet)
    const seg = path.find((p) => p.lord === item.planet)
    const levelKey = DASHA_LEVEL_KEYS[seg?.level ?? 0] ?? 'dashaLevel0'
    const level = T[levelKey]
    const planet = gName(item.planet, lang)
    out.push({
      id: item.id,
      title: item.title,
      live: Boolean(seg),
      window: seg
        ? fill(T.timingWindowLive, { level, planet, end: formatDay(seg.end) })
        : fill(T.timingWindowFuture, { planet }),
      prediction: seg
        ? fill(T.timingPredLive, {
            level,
            planet,
            end: formatDay(seg.end),
            prediction: item.prediction,
          })
        : fill(T.timingPredFuture, { prediction: item.prediction, planet }),
    })
  }
  return out
}
