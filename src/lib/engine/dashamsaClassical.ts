// ─────────────────────────────────────────────────────────────
//  src/lib/engine/dashamsaClassical.ts
//  Dashamsha (D10) — BPHS mahatphala, Phaladeepika livelihood,
//  Saravali / Brihat Jataka 10th-sign nature, Jaimini AmK,
//  Uttara Kalamrita navamsha of the 10th lord,
//  plus natal rashi/bhava phala tables applied to D10 placements.
//  Pure: no React, DB, or network.
// ─────────────────────────────────────────────────────────────

import type { ChartOutput, Dignity, GrahaId, Rashi } from '@/types/astrology'
import { GRAHA_NAMES, RASHI_NAMES } from '@/types/astrology'
import { DEBILITATION_SIGN, EXALTATION_SIGN } from '@/lib/engine/dignity'
import { getDashaPathAt } from '@/lib/engine/dasha/current'
import {
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
    prediction: 'BPHS: karma-lord in the lagna ties the name to the work. The native is known for personal effort, learns the profession in the body, and rises when leading rather than hiding behind a post.',
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
    prediction: 'BPHS: the profession is the life. Self-made fame and visible actions. Strongest when the lord is dignified or has digbala; the native is identified with the post itself.',
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
  Ma: 'BPHS: Mars in the 10th has digbala — engineering, surgery, defense, land, or fire trades. Courage builds the career. Conflict at work is the tax when Mars is afflicted.',
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

function addRole(map: Map<GrahaId, RoleAcc>, id: GrahaId, key: RoleKey) {
  if (!CLASSICAL.includes(id)) return
  let row = map.get(id)
  if (!row) {
    row = { id, roles: [] }
    map.set(id, row)
  }
  if (row.roles.some((r) => r.key === key)) return
  row.roles.push({ key, label: ROLE_LABEL[key], points: LIVELIHOOD_WEIGHTS[key] })
}

function finishCandidate(
  acc: RoleAcc,
  row: DashamsaPlanetRow,
  dignity: Dignity,
  house: number,
  combust: boolean,
  useD1Digbala: boolean,
): LivelihoodCandidate {
  const digHouse = DIGBALA_HOUSE[acc.id]
  const digbala = digHouse != null && house === digHouse
  let score = acc.roles.reduce((s, r) => s + r.points, 0)
  score += dignityPoints(dignity)
  score += housePoints(house)
  const bits = [
    ...acc.roles.map((r) => `${r.label} +${r.points}`),
    `dignity ${dignity.replace(/_/g, ' ')} ${dignityPoints(dignity) >= 0 ? '+' : ''}${dignityPoints(dignity)}`,
    `house ${house} ${housePoints(house) >= 0 ? '+' : ''}${housePoints(house)}`,
  ]
  if (row.isVargottama) {
    score += LIVELIHOOD_WEIGHTS.vargottama
    bits.push(`vargottama +${LIVELIHOOD_WEIGHTS.vargottama}`)
  }
  if (digbala) {
    score += LIVELIHOOD_WEIGHTS.digbala
    bits.push(`${useD1Digbala ? 'digbala' : 'D10 digbala'} +${LIVELIHOOD_WEIGHTS.digbala}`)
  }
  if (combust) {
    score += LIVELIHOOD_WEIGHTS.combust
    bits.push(`combust ${LIVELIHOOD_WEIGHTS.combust}`)
  }
  const info = LIVELIHOOD[acc.id]
  return {
    id: acc.id,
    name: GRAHA_NAMES[acc.id],
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
): DashamsaClassical | null {
  const d1Asc = chart.lagnas?.ascRashi
  if (!d1Asc || !analysis.planets.length) return null

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
  addRole(d1Map, d1TenthLord, 'tenthLord')
  for (const p of analysis.planets) {
    if (p.d1Rashi === d1TenthSign) addRole(d1Map, p.id, 'occupant')
    if (p.id !== d1TenthLord && aspectsSign(p.d1Rashi, p.id, d1TenthSign)) addRole(d1Map, p.id, 'aspect')
    if (d1LordRow && p.id !== d1TenthLord && p.d1Rashi === d1LordRow.d1Rashi) {
      addRole(d1Map, p.id, 'conjunctLord')
    }
    if (tenthFromMoon && (p.d1Rashi === tenthFromMoon || SIGN_LORDS[tenthFromMoon] === p.id)) {
      addRole(d1Map, p.id, 'tenthFromMoon')
    }
    if (tenthFromSun && (p.d1Rashi === tenthFromSun || SIGN_LORDS[tenthFromSun] === p.id)) {
      addRole(d1Map, p.id, 'tenthFromSun')
    }
  }
  if (navamshaLord) addRole(d1Map, navamshaLord, 'navamshaLord')

  const d1Candidates = [...d1Map.values()]
    .map((acc) => {
      const row = byId.get(acc.id)
      if (!row) return null
      const combust = d1Graha.get(acc.id)?.isCombust ?? false
      return finishCandidate(acc, row, row.d1Dignity, row.d1House, combust, true)
    })
    .filter((c): c is LivelihoodCandidate => c != null)
    .sort((a, b) => b.score - a.score)

  const d10Map = new Map<GrahaId, RoleAcc>()
  addRole(d10Map, d10TenthLord, 'tenthLord')
  for (const p of analysis.planets) {
    if (p.d10House === 10) addRole(d10Map, p.id, 'occupant')
    if (p.id !== d10TenthLord && aspectsSign(p.d10Rashi, p.id, d10TenthSign)) {
      addRole(d10Map, p.id, 'aspect')
    }
  }
  const d10Candidates = [...d10Map.values()]
    .map((acc) => {
      const row = byId.get(acc.id)
      if (!row) return null
      return finishCandidate(acc, row, row.d10Dignity, row.d10House, false, false)
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
    `${winner.name} leads the Phaladeepika test (${winner.roles.map((r) => r.label).join(', ')}).`,
    LIVELIHOOD[winner.id]?.nature ?? '',
    winner.fields.length ? `Fields: ${winner.fields.slice(0, 3).join('; ')}.` : '',
    winnerRow
      ? `In Dashamsha, ${winner.name} is in ${winnerRow.d10RashiName} H${winnerRow.d10House} (${winnerRow.d10Dignity.replace(/_/g, ' ')}).`
      : '',
    combust ? 'Combust in the birth chart: the skill works under another’s brilliance — credit may travel upward.' : '',
    retro ? 'Retrograde: this significator revisits unfinished work before it stabilizes.' : '',
  ].filter(Boolean).join(' ')

  const agrees = winner.id === mahatWinner.id
  const agreement = agrees
    ? `${winner.name} leads both the birth-chart livelihood test and the Dashamsha 10th complex. The kind of work and the way status is earned point the same way.`
    : `${winner.name} is the livelihood type in the birth chart. ${mahatWinner.name} carries mahatphala inside D10 (${mahatWinner.roles.map((r) => r.label).join(', ')}). Use ${winner.name} for the kind of work and ${mahatWinner.name} for how status is earned.`

  const pointers: ClassicalPointer[] = [
    {
      id: 'lord',
      label: '10th lord',
      detail: `${GRAHA_NAMES[d1TenthLord]} · D1 H${d1LordRow?.d1House ?? '—'} · ${d1LordRow?.d1Dignity.replace(/_/g, ' ') ?? '—'}`,
      source: 'Phaladeepika',
    },
    {
      id: 'occupant',
      label: 'Planets in the 10th',
      detail: analysis.planets.filter((p) => p.d1Rashi === d1TenthSign).map((p) => p.name).join(', ') || 'None',
      source: 'Phaladeepika · Brihat Jataka',
    },
    {
      id: 'aspect',
      label: 'Aspecting the 10th',
      detail: analysis.planets
        .filter((p) => aspectsSign(p.d1Rashi, p.id, d1TenthSign))
        .map((p) => p.name)
        .join(', ') || 'None by full graha drishti',
      source: 'Phaladeepika · BPHS drishti',
    },
    {
      id: 'navamsha',
      label: 'Navamsha lord of the 10th lord',
      detail: navamshaLord
        ? `${GRAHA_NAMES[navamshaLord]} (D9 of ${GRAHA_NAMES[d1TenthLord]} is ${RASHI_NAMES[d9OfLord!]})`
        : 'D9 is not on this chart — Uttara Kalamrita check skipped',
      source: 'Phaladeepika · Uttara Kalamrita',
    },
  ]

  const lordPhala = TENTH_LORD_PHALA[tenthLordRow.d10House] ?? TENTH_LORD_PHALA[10]!
  const modality = signModality(d10TenthSign)
  const modalityCopy = MODALITY_COPY[modality]
  const element = ELEMENT_COPY[(d10TenthSign - 1) % 4] ?? ''
  const d1Modality = signModality(d1TenthSign)

  const occupants = analysis.planets
    .filter((p) => p.d10House === 10)
    .map((p) => ({
      id: p.id,
      name: p.name,
      prediction: OCCUPANT_PHALA[p.id] || `${p.name} occupies the Dashamsha 10th.`,
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
  })

  const amkId = (chart.karakas?.AmK ?? null) as GrahaId | null
  const amkRow = amkId ? byId.get(amkId) : undefined
  const amatyakaraka = amkRow && amkId
    ? {
        id: amkId,
        name: GRAHA_NAMES[amkId],
        house: amkRow.d10House,
        rashiName: amkRow.d10RashiName,
        dignity: amkRow.d10Dignity,
        headline: `Amatyakaraka ${GRAHA_NAMES[amkId]} in D10 H${amkRow.d10House}`,
        prediction: amkPrediction(amkRow),
        source: 'Jaimini Sutras — AmK is the minister, the karma the native is known for',
      }
    : null

  const luminaries: LuminaryKarma[] = []
  if (moon) luminaries.push(luminary('Moon', moon.d10Rashi, d10Lagna, analysis.planets))
  if (sun) luminaries.push(luminary('Sun', sun.d10Rashi, d10Lagna, analysis.planets))

  const factors = mahatFactors({
    lagnaLordRow,
    tenthLordRow,
    yogas,
    amkRow,
    beneficAspect: beneficAspectsTenth(analysis.planets, d10TenthSign),
    occupants,
  })
  const raw = factors.reduce((s, f) => s + f.points, 0)
  const score = Math.max(8, Math.min(96, raw))
  const grade = mahatGrade(score)

  const timing = buildTiming(chart, [
    { id: 'tenth-lord', title: `D10 10th lord · ${tenthLordRow.name}`, planet: d10TenthLord, prediction: `${tenthLordRow.name} periods accelerate work karma and the house-${tenthLordRow.d10House} result above.` },
    { id: 'livelihood', title: `Livelihood lord · ${winner.name}`, planet: winner.id, prediction: `${winner.name} periods bring the Phaladeepika profession into the open — ${LIVELIHOOD[winner.id]?.nature ?? 'the livelihood significator'}.` },
    { id: 'mahat', title: `Mahatphala lord · ${mahatWinner.name}`, planet: mahatWinner.id, prediction: `${mahatWinner.name} periods show how status is actually earned in Dashamsha.` },
    ...(amkId
      ? [{ id: 'amk', title: `Amatyakaraka · ${GRAHA_NAMES[amkId]}`, planet: amkId, prediction: `${GRAHA_NAMES[amkId]} periods activate the Jaimini career significator.` }]
      : []),
  ])

  const formed = yogas.filter((y) => y.formed)
  const live = timing.find((t) => t.live)

  const predictions = [
    `${GRADE_COPY[grade]} (${score}).`,
    `${winner.name} is the livelihood planet. ${LIVELIHOOD[winner.id]?.fields.slice(0, 2).join(' and ') || LIVELIHOOD[winner.id]?.nature}.`,
    agreement,
    `${tenthLordRow.name}, D10 10th lord, in house ${tenthLordRow.d10House}: ${lordPhala.headline}.`,
    `${modalityCopy.label} D10 10th (${RASHI_NAMES[d10TenthSign]}). ${element}`,
    formed[0] ? formed[0].prediction : 'No major career yoga is formed in this Dashamsha — read the 10th lord’s house as the whole story.',
    live ? live.prediction : timing[0]?.prediction ?? 'Time the 10th lord, the livelihood planet, and the Amatyakaraka with Vimshottari.',
  ]

  const phala = buildPhala(analysis, chart, {
    lagnaLordId: d10LagnaLord,
    tenthLordId: d10TenthLord,
    eleventhLordId: d10EleventhLord,
    livelihoodId: winner.id,
    amkId,
  })
  if (phala.lagna.careers[0]) {
    predictions.push(
      `D10 lagna ${phala.lagna.rashiName} (${phala.lagna.keyword}) careers: ${phala.lagna.careers.slice(0, 3).join('; ')}.`,
    )
  }
  const priorityLens = phala.priorityPlanets[0]
  if (priorityLens) {
    predictions.push(`${priorityLens.name} in D10: ${priorityLens.careerLens}`)
  }

  return {
    framing:
      'BPHS gives Dashamsha for mahatphala — power, status, and deeds of consequence. Phaladeepika names the livelihood from the birth-chart 10th. This tab applies both, then the yogas and the Amatyakaraka, and times them. Natal rashi and bhava phala tables are also read on the D10 placements.',
    mahatphala: {
      grade,
      gradeLabel: grade === 'mahat' ? 'Mahat' : grade[0]!.toUpperCase() + grade.slice(1),
      score,
      headline: GRADE_COPY[grade],
      text: 'Counted factors: lagna-lord dignity, 10th-lord dignity, the 10th lord’s house, Digbala in the 10th, Dharma-Karmadhipati, Vargottama, Neecha Bhanga, a strong Amatyakaraka, and benefic drishti on the D10 10th. Other formed yogas are listed beside the grade. This is a mahatphala grade, not a job title.',
      factors,
    },
    tenthLord: {
      id: d10TenthLord,
      name: tenthLordRow.name,
      house: tenthLordRow.d10House,
      dignity: tenthLordRow.d10Dignity,
      headline: lordPhala.headline,
      prediction: `${tenthLordRow.name} in D10 H${tenthLordRow.d10House} (${tenthLordRow.d10RashiName}, ${tenthLordRow.d10Dignity.replace(/_/g, ' ')}). ${lordPhala.prediction}`,
      source: 'BPHS — effects of the lord of the 10th, read in Dashamsha',
    },
    tenthSign: {
      signName: RASHI_NAMES[d10TenthSign],
      modality,
      modalityLabel: modalityCopy.label,
      element,
      prediction: `${modalityCopy.prediction} ${element}`,
      d1Note: `Birth-chart 10th is ${RASHI_NAMES[d1TenthSign]} (${MODALITY_COPY[d1Modality].label}). D10 ${RASHI_NAMES[d10TenthSign]} is the mahatphala version of that promise.`,
      source: 'Saravali · Brihat Jataka',
    },
    livelihood: {
      method:
        'Phaladeepika takes the strongest among the 10th lord, planets in the 10th, planets aspecting the 10th, and the lord of the Navamsha occupied by the 10th lord. Uttara Kalamrita stresses that Navamsha lord. The 10th from Moon and from Sun are supporting checks (BPHS chandra and surya lagna).',
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
    readingOrder: [
      'Confirm D1 first. Dashamsha does not replace the birth chart — BPHS uses it for mahatphala on top of the rashi promise.',
      'Name the Phaladeepika livelihood planet from the four pointers, with the Navamsha lord included when D9 is present.',
      'Read that planet’s Dashamsha house as how the profession fruits.',
      'Read the D10 10th lord’s house (BPHS bhava phala) for the shape of status.',
      'Apply natal planet-in-house and planet-in-rashi phala to the D10 placements of the career lords.',
      'Note chara, sthira, or dvisvabhava of the D10 10th — changes, one profession, or two tracks.',
      'Keep only the yogas that are formed: Dharma-Karmadhipati, Digbala, Vargottama, Neecha Bhanga, Viparita, Budhaditya, shared 10th/11th lord.',
      'Place the Amatyakaraka in D10. That is the Jaimini minister’s post.',
      'Time the above with Vimshottari of the 10th lord, the livelihood planet, and the Amatyakaraka.',
    ],
    sources: [
      'BPHS — Dashamsha is mahatphala; 10th-lord results; Digbala; Dharma-Karmadhipati; Neecha Bhanga; Viparita; Budhaditya; Vargottama',
      'Phaladeepika — livelihood from the strongest of the 10th lord, occupants, aspectors, and the Navamsha lord of the 10th lord',
      'Uttara Kalamrita — Navamsha of the 10th lord for profession',
      'Saravali and Brihat Jataka — movable, fixed, or dual 10th',
      'Jaimini — Amatyakaraka as the career significator',
      'BPHS / Phaladeepika / Saravali — planet-in-rashi and planet-in-bhava phala applied inside Dashamsha',
    ],
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
): DashamsaPhala {
  const d1ById = new Map(chart.grahas?.map((g) => [g.id, g]) ?? [])
  const roleOf = (id: GrahaId): string | null => {
    const roles: string[] = []
    if (id === keys.lagnaLordId) roles.push('D10 lagna lord')
    if (id === keys.tenthLordId) roles.push('D10 10th lord')
    if (id === keys.eleventhLordId) roles.push('D10 11th lord')
    if (id === keys.livelihoodId) roles.push('livelihood planet')
    if (keys.amkId && id === keys.amkId) roles.push('Amatyakaraka')
    return roles.length ? roles.join(' · ') : null
  }
  const priorityIds = new Set<GrahaId>([
    keys.lagnaLordId,
    keys.tenthLordId,
    keys.eleventhLordId,
    keys.livelihoodId,
    ...(keys.amkId ? [keys.amkId] : []),
  ])

  const deep = getRashiDeepGuide(analysis.d10Lagna)
  const lagna = {
    rashi: analysis.d10Lagna,
    rashiName: analysis.d10LagnaName,
    keyword: deep?.keyword ?? 'livelihood',
    careers: deep?.careers.slice(0, 8) ?? [],
    classical: getRashiClassical(analysis.d10Lagna),
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
      d10Theme: HOUSE_THEMES_D10[house] ?? row.theme,
      signInHouse: getSignInHouse(house, row.rashi),
      houseClassical: getHouseClassical(house).slice(0, 2),
      occupants: row.occupants.map((o) => o.name),
    }
  })

  const planetPhalas: DashamsaPlanetPhala[] = analysis.planets
    .filter((p) => CLASSICAL.includes(p.id))
    .map((p) => {
      const natal = d1ById.get(p.id)
      const houseTeaching = getPlanetInHouse(p.id, p.d10House, 'summary')
      const houseClassical = getPlanetInHouseClassical(p.id, p.d10House)
      const signClassical = getDignityAwarePlanetInSign(
        p.id,
        p.d10Rashi,
        p.d10Dignity,
        natal?.isCombust,
        natal?.isRetro,
      )
      const d10Theme = HOUSE_THEMES_D10[p.d10House] ?? `D10 house ${p.d10House}`
      const careerLens = [
        houseTeaching
          ? `${p.name} in D10 H${p.d10House}: ${houseTeaching}`
          : `${p.name} in D10 H${p.d10House} (${d10Theme}).`,
        signClassical[0]
          ? `In ${p.d10RashiName}: ${signClassical[0].text}`
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
    framing:
      'The same BPHS / Phaladeepika / Saravali planet-in-house and planet-in-rashi tables used on the birth chart are read on Dashamsha placements. House meanings stay career-scoped by the D10 house themes.',
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
): LuminaryKarma {
  const sign = houseSign(grahaRashi, 10)
  const lord = SIGN_LORDS[sign]
  const occupants = planets.filter((p) => p.d10Rashi === sign).map((p) => p.name)
  const houseFromLagna = houseFrom(sign, d10Lagna)
  const face = from === 'Moon' ? 'public reputation' : 'authority and the state'
  return {
    from,
    signName: RASHI_NAMES[sign],
    houseFromLagna,
    lordName: GRAHA_NAMES[lord],
    occupants,
    prediction: `10th from ${from} in Dashamsha is ${RASHI_NAMES[sign]} (H${houseFromLagna}), lord ${GRAHA_NAMES[lord]}${occupants.length ? `, with ${occupants.join(', ')}` : ''}. This is the ${face} face of the same mahatphala.`,
  }
}

function amkPrediction(row: DashamsaPlanetRow): string {
  const place = [1, 4, 7, 10].includes(row.d10House)
    ? 'in a kendra — the career significator is visible'
    : [5, 9].includes(row.d10House)
      ? 'in a trikona — the career significator is tied to dharma, students, or fortune'
      : row.d10House === 11
        ? 'in the 11th — gains and networks are how the minister works'
        : row.d10House === 10
          ? 'in the 10th — the profession is the life'
          : [6, 8, 12].includes(row.d10House)
            ? 'in a dusthana — service under pressure, hidden work, or a career of fixing what is broken'
            : 'supporting the profession from effort, speech, or courage'
  return `Jaimini: Amatyakaraka ${row.name} in D10 ${row.d10RashiName} H${row.d10House} (${row.d10Dignity.replace(/_/g, ' ')}) is ${place}. Judge the post from this house, and the kind of work from the Phaladeepika planet.`
}

function mahatFactors(input: {
  lagnaLordRow: DashamsaPlanetRow | undefined
  tenthLordRow: DashamsaPlanetRow
  yogas: ClassicalYoga[]
  amkRow: DashamsaPlanetRow | undefined
  beneficAspect: boolean
  occupants: { id: GrahaId }[]
}): MahatFactor[] {
  const factors: MahatFactor[] = []
  const { lagnaLordRow, tenthLordRow, yogas } = input
  const formed = (id: string) => yogas.find((y) => y.id === id)?.formed ?? false

  if (lagnaLordRow) {
    const pts = dignityPoints(lagnaLordRow.d10Dignity)
    factors.push({
      label: 'D10 lagna lord',
      points: pts,
      note: `${lagnaLordRow.name} is ${lagnaLordRow.d10Dignity.replace(/_/g, ' ')} in H${lagnaLordRow.d10House}.`,
    })
  }
  factors.push({
    label: 'D10 10th lord dignity',
    points: dignityPoints(tenthLordRow.d10Dignity),
    note: `${tenthLordRow.name} is ${tenthLordRow.d10Dignity.replace(/_/g, ' ')}.`,
  })
  factors.push({
    label: 'D10 10th lord’s house',
    points: housePoints(tenthLordRow.d10House),
    note: `House ${tenthLordRow.d10House} of the karma lord.`,
  })
  if (input.occupants.some((o) => o.id === 'Su' || o.id === 'Ma')) {
    factors.push({
      label: 'Digbala in the D10 10th',
      points: 8,
      note: 'Sun or Mars in the Dashamsha 10th (BPHS directional strength).',
    })
  }
  if (formed('dharma-karmadhipati')) {
    factors.push({
      label: 'Dharma-Karmadhipati',
      points: 12,
      note: '9th and 10th lords are connected in D10.',
    })
  }
  if (tenthLordRow.isVargottama) {
    factors.push({
      label: 'Vargottama 10th lord',
      points: 8,
      note: `${tenthLordRow.name} repeats its natal sign in Dashamsha.`,
    })
  }
  if (lagnaLordRow?.isVargottama) {
    factors.push({
      label: 'Vargottama lagna lord',
      points: 6,
      note: `${lagnaLordRow.name} repeats its natal sign in Dashamsha.`,
    })
  }
  if (formed('neecha-bhanga')) {
    const yoga = yogasTone(yogas, 'neecha-bhanga')
    factors.push({
      label: 'Neecha Bhanga',
      points: yoga === 'supportive' ? 6 : yoga === 'challenging' ? -10 : 0,
      note: yoga === 'supportive'
        ? 'Debility of a career lord is cancelled.'
        : yoga === 'challenging'
          ? 'Debility stands without cancellation.'
          : 'Debility is only partly cancelled.',
    })
  }
  if (input.amkRow && [1, 4, 5, 7, 9, 10, 11].includes(input.amkRow.d10House)) {
    factors.push({
      label: 'Amatyakaraka well placed',
      points: 6,
      note: `${input.amkRow.name} in D10 H${input.amkRow.d10House}.`,
    })
  }
  if (input.beneficAspect) {
    factors.push({
      label: 'Benefic drishti on the D10 10th',
      points: 4,
      note: 'Jupiter, Venus, or the Moon aspects the karma sign.',
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
}): ClassicalYoga[] {
  const {
    planets, d10TenthLord, d10NinthLord, d10EleventhLord, d10LagnaLord,
    tenthLordRow, lagnaLordRow, byId,
  } = ctx
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
  let dkHow = '9th and 10th lords are not in sambandha.'
  if (sameLord910) dkHow = `${GRAHA_NAMES[d10TenthLord]} owns both the 9th and the 10th — the yoga is in the lordship itself.`
  else if (conjunct) dkHow = `${ninth!.name} and ${tenthLordRow.name} join in ${tenthLordRow.d10RashiName}.`
  else if (exchange9) dkHow = `${GRAHA_NAMES[d10NinthLord]} and ${tenthLordRow.name} exchange signs.`
  else if (aspect9) dkHow = `${GRAHA_NAMES[d10NinthLord]} and ${tenthLordRow.name} are in graha drishti.`

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
  ])

  const same1011 = d10TenthLord === d10EleventhLord
  const labha = Boolean(
    tenthLordRow.d10House === 11
    || (eleventh && eleventh.d10House === 10)
    || (eleventh && exchanges(d10TenthLord, d10EleventhLord, byId)),
  )
  const parivartana110 = exchanges(d10LagnaLord, d10TenthLord, byId)
  const parivartana1011 = eleventh ? exchanges(d10TenthLord, d10EleventhLord, byId) : false
  const parivartana910 = exchange9

  const vip = viparita(ctx.d10Lagna, byId)
  const vgNames = [lagnaLordRow, tenthLordRow].filter((p) => p?.isVargottama).map((p) => p!.name)
  const amkRow = ctx.amk ? byId.get(ctx.amk) : undefined
  const amkStrong = Boolean(amkRow && [1, 4, 5, 7, 9, 10, 11].includes(amkRow.d10House))

  const yogas: ClassicalYoga[] = [
    {
      id: 'dharma-karmadhipati',
      name: 'Dharma-Karmadhipati',
      source: 'BPHS raja yoga',
      formed: dk,
      tone: dk ? 'supportive' : 'neutral',
      prediction: dk
        ? `${dkHow} Dharma-Karmadhipati in the Dashamsha: fortune and profession move together. The rise is cleaner when the work can be defended as right.`
        : 'Dharma-Karmadhipati is not formed — 9th and 10th lords are neither the same planet nor joined by conjunction, aspect, or exchange.',
    },
    {
      id: 'digbala-d10',
      name: 'Digbala in the 10th',
      source: 'BPHS digbala, read in Dashamsha',
      formed: digbalaOccupants.length > 0,
      tone: digbalaOccupants.length ? 'supportive' : 'neutral',
      prediction: digbalaOccupants.length
        ? `${digbalaOccupants.map((p) => p.name).join(' and ')} in the Dashamsha 10th has directional strength. Authority or technical command is part of the post, not an accident.`
        : 'Neither Sun nor Mars occupies the Dashamsha 10th, so karma-digbala is not formed there.',
    },
    {
      id: 'swakshetra-tenth',
      name: 'Own or exalted planet in the 10th',
      source: 'BPHS — dignified graha in the karma house',
      formed: ownInTenth.length > 0,
      tone: ownInTenth.length ? 'supportive' : 'neutral',
      prediction: ownInTenth.length
        ? `${ownInTenth.map((p) => `${p.name} (${p.d10Dignity.replace(/_/g, ' ')})`).join(', ')} sits in the Dashamsha 10th. The profession has a seat of its own strength.`
        : 'No planet is in own sign, moolatrikona, or exaltation in the Dashamsha 10th.',
    },
    {
      id: 'budhaditya',
      name: 'Budha-Aditya',
      source: 'BPHS',
      formed: budha,
      tone: budha ? 'supportive' : 'neutral',
      prediction: budha
        ? `Sun and Mercury join in D10 ${sun!.d10RashiName}. Skill, counsel, writing, and commerce serve the career. If Mercury is combust in the birth chart, the skill is real and the credit is shared upward.`
        : 'Sun and Mercury are not conjunct in Dashamsha.',
    },
    {
      id: 'neecha-bhanga',
      name: neecha.cancelled ? 'Neecha Bhanga' : 'Debility in the career lords',
      source: 'BPHS neecha bhanga',
      formed: neecha.planets.length > 0,
      tone: !neecha.planets.length ? 'neutral' : neecha.cancelled ? 'supportive' : neecha.partial ? 'mixed' : 'challenging',
      prediction: neecha.planets.length
        ? neecha.text
        : 'No key career planet is debilitated in Dashamsha, so Neecha Bhanga is not in question.',
    },
    {
      id: 'karma-labha-lord',
      name: 'One lord for karma and gains',
      source: 'BPHS lordship of the 10th and 11th',
      formed: same1011,
      tone: same1011 ? 'mixed' : 'neutral',
      prediction: same1011
        ? `${GRAHA_NAMES[d10TenthLord]} owns both the Dashamsha 10th and 11th. Work and income are the same planet — gains follow the karma, and that planet’s delays or dignity hit both.`
        : 'The 10th and 11th have different lords.',
    },
    {
      id: 'labha-link',
      name: '10th–11th income link',
      source: 'BPHS — karma lord and labha',
      formed: labha && !same1011,
      tone: labha && !same1011 ? 'supportive' : 'neutral',
      prediction: labha && !same1011
        ? 'The 10th lord and 11th lord are linked by house or exchange. Income is a direct fruit of the profession.'
        : 'No separate 10th–11th exchange or mutual house placement.',
    },
    {
      id: 'parivartana-9-10',
      name: 'Parivartana of 9th and 10th',
      source: 'BPHS exchange',
      formed: parivartana910,
      tone: parivartana910 ? 'supportive' : 'neutral',
      prediction: parivartana910
        ? '9th and 10th lords exchange. Dharma-Karmadhipati by parivartana — fortune and work trade places.'
        : '9th and 10th lords do not exchange signs.',
    },
    {
      id: 'parivartana-1-10',
      name: 'Parivartana of lagna and 10th',
      source: 'BPHS exchange',
      formed: parivartana110,
      tone: parivartana110 ? 'supportive' : 'neutral',
      prediction: parivartana110
        ? 'Lagna lord and 10th lord exchange. The person and the profession are one story — self-made status.'
        : 'Lagna lord and 10th lord do not exchange.',
    },
    {
      id: 'parivartana-10-11',
      name: 'Parivartana of 10th and 11th',
      source: 'BPHS exchange',
      formed: parivartana1011,
      tone: parivartana1011 ? 'supportive' : 'neutral',
      prediction: parivartana1011
        ? '10th and 11th lords exchange. Gains and profession reinforce each other.'
        : '10th and 11th lords do not exchange.',
    },
    {
      id: 'viparita',
      name: 'Viparita in the career chart',
      source: 'BPHS Harsha, Sarala, Vimala',
      formed: vip.formed,
      tone: vip.formed ? 'mixed' : 'neutral',
      prediction: vip.formed
        ? vip.text
        : 'Dusthana lords are not placed in another dusthana, so Viparita is not lifting the career through crisis.',
    },
    {
      id: 'vargottama-karma',
      name: 'Vargottama career lords',
      source: 'BPHS vargottama',
      formed: vgNames.length > 0,
      tone: vgNames.length ? 'supportive' : 'neutral',
      prediction: vgNames.length
        ? `${vgNames.join(' and ')} ${vgNames.length > 1 ? 'keep' : 'keeps'} the same sign in D1 and D10. The career promise repeats instead of splitting. A vargottama debility repeats the fall-and-rise pattern; it does not erase it.`
        : 'Neither the Dashamsha lagna lord nor the 10th lord is vargottama.',
    },
    {
      id: 'amk-strength',
      name: 'Amatyakaraka in a strong D10 house',
      source: 'Jaimini',
      formed: amkStrong,
      tone: amkStrong ? 'supportive' : 'neutral',
      prediction: amkRow
        ? amkStrong
          ? `Amatyakaraka ${amkRow.name} in D10 H${amkRow.d10House} can act — kendra, trikona, or gains.`
          : `Amatyakaraka ${amkRow.name} is in D10 H${amkRow.d10House}, outside kendra, trikona, and the 11th. The minister works indirectly.`
        : 'Amatyakaraka is not on this chart.',
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
      bits.push(`${dispositor!.name}, lord of the fall sign, is in a kendra from ${fromLagnaDisp ? 'D10 lagna' : 'D10 Moon'}`)
    }
    if (fromLagnaEx || fromMoonEx) {
      bits.push(`${exaltRow!.name}, exalted in that sign, is in a kendra from ${fromLagnaEx ? 'D10 lagna' : 'D10 Moon'}`)
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
      ? `${h.name} is debilitated in Dashamsha and cancellation applies — ${h.reason}. BPHS: rise after the fall, especially in the dispositor’s dasha.`
      : `${h.name} is debilitated in Dashamsha without neecha bhanga. The career needs the dispositor’s support; do not expect the fall to cancel itself.`,
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
): { formed: boolean; text: string } {
  const checks: { name: string; lordHouse: number; houses: number[] }[] = [
    { name: 'Harsha (6th lord)', lordHouse: 6, houses: [8, 12] },
    { name: 'Sarala (8th lord)', lordHouse: 8, houses: [6, 12] },
    { name: 'Vimala (12th lord)', lordHouse: 12, houses: [6, 8] },
  ]
  const hits: string[] = []
  for (const c of checks) {
    const lord = SIGN_LORDS[houseSign(d10Lagna, c.lordHouse)]
    const row = byId.get(lord)
    if (row && c.houses.includes(row.d10House)) {
      hits.push(`${c.name} ${row.name} is in house ${row.d10House}`)
    }
  }
  if (!hits.length) return { formed: false, text: '' }
  return {
    formed: true,
    text: `${hits.join('; ')}. Viparita can lift status through crisis, rivalry, or loss — the fruit is real and the road is not comfortable.`,
  }
}

function buildTiming(
  chart: ChartOutput,
  items: { id: string; title: string; planet: GrahaId; prediction: string }[],
): ClassicalTiming[] {
  const path = getDashaPathAt(chart.dashas?.vimshottari ?? [])
  const seen = new Set<GrahaId>()
  const out: ClassicalTiming[] = []
  for (const item of items) {
    if (seen.has(item.planet)) continue
    seen.add(item.planet)
    const seg = path.find((p) => p.lord === item.planet)
    const level = ['', 'Maha', 'Antar', 'Pratyantar', 'Sukshma'][seg?.level ?? 0] ?? 'Dasha'
    out.push({
      id: item.id,
      title: item.title,
      live: Boolean(seg),
      window: seg
        ? `${level} ${GRAHA_NAMES[item.planet]} is running until ${formatDay(seg.end)}.`
        : `When ${GRAHA_NAMES[item.planet]}’s Vimshottari periods run.`,
      prediction: seg
        ? `${level} ${GRAHA_NAMES[item.planet]} is live until ${formatDay(seg.end)}. ${item.prediction}`
        : `${item.prediction} Watch ${GRAHA_NAMES[item.planet]} mahadasha and antardasha.`,
    })
  }
  return out
}
