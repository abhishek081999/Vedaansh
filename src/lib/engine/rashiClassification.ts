// ─────────────────────────────────────────────────────────────
//  src/lib/engine/rashiClassification.ts
//  Classical rashi groupings as taught in foundation classes:
//  gati, tattva, sam/visham, diva/ratri bala, varna, dosha,
//  direction, guna, Narad Purana nature, creature (yoni) type,
//  colour, places and Kaal Purush body parts. Also the dual-sign
//  degree rule, the sign-edge (Mrityu Bhag) rule and graha dishas.
//  Pure — ids/enums stay English; only display text is swapped.
// ─────────────────────────────────────────────────────────────

import type { GrahaId, Rashi } from '@/types/astrology'
import type { EngineLang } from './lang'
import {
  CLASSIFICATION_FIELD_HI,
  CLASSIFICATION_VALUE_HI,
  RASHI_BODY_PARTS_HI,
  RASHI_COLOR_HI,
  RASHI_PLACES_HI,
  RASHI_CLASSIFICATION_NOTES_HI,
  DISHA_HI,
} from './locale/rashiClassification.hi'

export type RashiMotion = 'char' | 'sthir' | 'dwiswabhav'
export type RashiTattva = 'agni' | 'prithvi' | 'vayu' | 'jal'
export type RashiParity = 'visham' | 'sam'
export type RashiBala = 'diva' | 'ratri'
export type RashiVarna = 'kshatriya' | 'vaishya' | 'shudra' | 'brahmin'
export type RashiDosha = 'pitta' | 'tridosha' | 'vata' | 'kapha'
export type Disha = 'east' | 'south' | 'west' | 'north' | 'northEast' | 'southEast' | 'northWest' | 'southWest'
export type RashiGuna = 'sattvic' | 'rajasic' | 'tamasic'
export type RashiNature = 'nirankush' | 'darshnik' | 'ojasvi' | 'aalsi'
export type RashiCreature = 'manushya' | 'chatushpad' | 'keet' | 'jalchar'

export type ClassificationField =
  | 'motion' | 'effectiveMotion' | 'tattva' | 'parity' | 'bala' | 'varna' | 'dosha'
  | 'direction' | 'guna' | 'nature' | 'creature' | 'color' | 'places' | 'bodyParts' | 'edge'

export type ClassificationValue =
  | RashiMotion | RashiTattva | RashiParity | RashiBala | RashiVarna | RashiDosha
  | Disha | RashiGuna | RashiNature | RashiCreature

export interface RashiClassificationRow {
  field: ClassificationField
  /** Display label for the field in the requested language */
  label: string
  /** Enum id when the value is an enum (compare on this, never on `value`) */
  id?: ClassificationValue
  /** Display value */
  value: string
}

export interface RashiClassification {
  rashi: Rashi
  /** Degree inside the sign (0–30) when one was given */
  degree?: number
  motion: RashiMotion
  /** Dual signs only, with a degree: 0–15° acts Sthir, 15–30° acts Char */
  effectiveMotion?: Exclude<RashiMotion, 'dwiswabhav'>
  tattva: RashiTattva
  parity: RashiParity
  bala: RashiBala
  varna: RashiVarna
  dosha: RashiDosha
  direction: Disha
  guna: RashiGuna
  nature: RashiNature
  /** Creature type; split signs (Dhanu, Makara) need a degree, otherwise both halves are listed */
  creature: RashiCreature[]
  /** Sign-edge rule: odd sign 24–30°, even sign 0–6° — weak for natural significations */
  inEdgeDegrees?: boolean
  color: string
  places: string[]
  bodyParts: string[]
  rows: RashiClassificationRow[]
}

const R = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] as const

function bySet<T extends string>(groups: Record<T, readonly number[]>, rashi: number): T {
  for (const [k, v] of Object.entries(groups) as [T, readonly number[]][]) if (v.includes(rashi)) return k
  throw new Error(`rashi ${rashi} missing from group`)
}

export const MOTION_GROUPS: Record<RashiMotion, readonly Rashi[]> = { char: [1, 4, 7, 10], sthir: [2, 5, 8, 11], dwiswabhav: [3, 6, 9, 12] }
export const TATTVA_GROUPS: Record<RashiTattva, readonly Rashi[]> = { agni: [1, 5, 9], prithvi: [2, 6, 10], vayu: [3, 7, 11], jal: [4, 8, 12] }
export const BALA_GROUPS: Record<RashiBala, readonly Rashi[]> = { diva: [5, 6, 7, 8, 11, 12], ratri: [1, 2, 3, 4, 9, 10] }
export const VARNA_GROUPS: Record<RashiVarna, readonly Rashi[]> = { kshatriya: [1, 5, 9], vaishya: [2, 6, 10], shudra: [3, 7, 11], brahmin: [4, 8, 12] }
export const DOSHA_GROUPS: Record<RashiDosha, readonly Rashi[]> = { pitta: [1, 5, 9], tridosha: [2, 6, 10], vata: [3, 7, 11], kapha: [4, 8, 12] }
export const DIRECTION_GROUPS: Record<'east' | 'south' | 'west' | 'north', readonly Rashi[]> = { east: [1, 5, 9], south: [2, 6, 10], west: [3, 7, 11], north: [4, 8, 12] }
export const GUNA_GROUPS: Record<RashiGuna, readonly Rashi[]> = { sattvic: [4, 5, 9, 12], rajasic: [2, 3, 6, 7], tamasic: [1, 8, 10, 11] }
/** Narad Purana grouping */
export const NATURE_GROUPS: Record<RashiNature, readonly Rashi[]> = { nirankush: [1, 2, 3, 6, 7], darshnik: [4, 5, 9, 12], ojasvi: [8], aalsi: [10, 11] }

/** Creature type by sign; Dhanu and Makara change at 15°. */
function creatureOf(rashi: Rashi, degree?: number): RashiCreature[] {
  const firstHalf = degree === undefined ? undefined : degree < 15
  switch (rashi) {
    case 3: case 6: case 7: case 11: return ['manushya']
    case 1: case 2: case 5: return ['chatushpad']
    case 8: return ['keet']
    case 4: case 12: return ['jalchar']
    case 9: return firstHalf === undefined ? ['manushya', 'chatushpad'] : firstHalf ? ['manushya'] : ['chatushpad']
    case 10: return firstHalf === undefined ? ['chatushpad', 'jalchar'] : firstHalf ? ['chatushpad'] : ['jalchar']
  }
}

/** Planetary directions. Lagna always stands for the East. */
export const GRAHA_DISHA: Record<'Su' | 'Mo' | 'Ma' | 'Me' | 'Ju' | 'Ve' | 'Sa' | 'Ra' | 'Ke', Disha> = {
  Su: 'east', Sa: 'west', Me: 'north', Ma: 'south',
  Ju: 'northEast', Ve: 'southEast', Mo: 'northWest', Ra: 'southWest', Ke: 'southWest',
}

export const RASHI_COLOR_EN: Record<Rashi, string> = {
  1: 'Red', 2: 'White', 3: 'Green', 4: 'Pink', 5: 'Golden (sunrise)', 6: 'Variegated / multi-coloured',
  7: 'Black', 8: 'Saffron / orange', 9: 'Golden', 10: 'Variegated / multi-coloured', 11: 'Brown', 12: 'White',
}

export const RASHI_PLACES_EN: Record<Rashi, string[]> = {
  1: ['Green grasslands', 'Canals and lakes with flowing water', 'Centre of forests', 'Mineral-rich areas'],
  2: ['Agricultural land', 'Cow shelters (gaushala)', 'Big cities', 'Scenic places', 'Water-filled paddy fields'],
  3: ['Small towns', 'Gardens', 'Gambling houses', 'Prayer rooms', 'Bedrooms, beds and sofas', 'Dance studios'],
  4: ['Ponds and rivers', 'Land near water with cracked soil', 'Forests near water'],
  5: ['Mountains and caves', 'Hermitages and ashrams', 'Forests', 'Hunters’ machans'],
  6: ['Grazing grounds', 'Temples', 'Fields of daily food crops', 'Places of eating'],
  7: ['Business centres', 'Marketplaces and shops', 'Theatres'],
  8: ['Holes and burrows', 'Plateaus and rocky terrain', 'Stagnant dirty water', 'Caves near water'],
  9: ['Horse and elephant stables', 'Palaces and forts', 'War zones', 'Circuit houses', 'Cantonments and officers’ quarters'],
  10: ['Rivers and water places', 'Potter communities', 'Tribal areas', 'Water-logged forests (like the Sundarbans)'],
  11: ['Earthen / soil areas', 'Gambling houses', 'Stored clean water'],
  12: ['Deep caves', 'Pilgrimage sites (tirtha)', 'River confluences (sangam)'],
}

export const RASHI_BODY_PARTS_EN: Record<Rashi, string[]> = {
  1: ['Brain', 'Skull (cranium)', 'Blood vessels of the head'],
  2: ['Face', 'Throat', 'Food pipe', 'Facial bones', 'Ears and nose'],
  3: ['Shoulders and neck', 'Arms', 'Upper chest', 'Windpipe', 'Cervical spine and collar bone'],
  4: ['Chest and breasts', 'Lungs', 'Heart', 'Ribs'],
  5: ['Upper abdomen (heart to navel)', 'Small intestine', 'Backbone', 'Liver, spleen, gallbladder, pancreas'],
  6: ['Lower abdomen (below navel)', 'Large intestine', 'Base of spine (Mooladhara)'],
  7: ['Ovaries and testicles', 'Kidneys', 'Lower back bones joined to the hip'],
  8: ['Private parts / reproductive organs'],
  9: ['Hips', 'Thighs', 'Hip bone'],
  10: ['Knees', 'Joint bones (elbows, knees, ankles)'],
  11: ['Legs and calves', 'Blood circulation'],
  12: ['Feet and toes', 'Nerves and bones of the feet'],
}

export const CLASSIFICATION_FIELD_EN: Record<ClassificationField, string> = {
  motion: 'Gati (nature)',
  effectiveMotion: 'Acts as (by degree)',
  tattva: 'Tattva (element)',
  parity: 'Sam / Visham',
  bala: 'Strong by',
  varna: 'Varna',
  dosha: 'Dosha (prakriti)',
  direction: 'Direction',
  guna: 'Guna',
  nature: 'Nature (Narad Purana)',
  creature: 'Creature type',
  color: 'Colour (for remedies)',
  places: 'Places',
  bodyParts: 'Body (Kaal Purush)',
  edge: 'Sign-edge degrees',
}

export const CLASSIFICATION_VALUE_EN: Record<ClassificationValue, string> = {
  char: 'Char (movable)', sthir: 'Sthir (fixed)', dwiswabhav: 'Dwiswabhav (dual)',
  agni: 'Agni (fire)', prithvi: 'Prithvi (earth)', vayu: 'Vayu (air)', jal: 'Jal (water)',
  visham: 'Visham (odd) — more speed breakers', sam: 'Sam (even) — smoother journey',
  diva: 'Day (Diva bali)', ratri: 'Night (Ratri bali)',
  kshatriya: 'Kshatriya', vaishya: 'Vaishya', shudra: 'Shudra', brahmin: 'Brahmin',
  pitta: 'Pitta', tridosha: 'Tridosha (all three)', vata: 'Vata', kapha: 'Kapha',
  east: 'East', south: 'South', west: 'West', north: 'North',
  northEast: 'North-east (Ishan)', southEast: 'South-east (Agneya)', northWest: 'North-west (Vayavya)', southWest: 'South-west (Nairitya)',
  sattvic: 'Sattvic', rajasic: 'Rajasic', tamasic: 'Tamasic',
  nirankush: 'Nirankush — authoritative, listens to no one',
  darshnik: 'Darshnik — philosophical and charitable',
  ojasvi: 'Ojasvi — powerful and determined',
  aalsi: 'Aalsi — slow to act, postpones work',
  manushya: 'Manushya (human)', chatushpad: 'Chatushpad (four-legged)', keet: 'Keet (insect)', jalchar: 'Jalchar (aquatic)',
}

const EDGE_TEXT_EN = {
  inside: 'Inside the edge degrees — natural significations weaken',
  outside: 'Clear of the edge degrees',
}

/** Odd sign: last 6° (24–30). Even sign: first 6° (0–6). */
export function isInSignEdgeDegrees(rashi: number, degree: number): boolean {
  const d = ((degree % 30) + 30) % 30
  return rashi % 2 === 1 ? d >= 24 : d < 6
}

/** Dual sign by degree: 0–15° acts Sthir, 15–30° acts Char. Non-dual signs keep their own nature. */
export function effectiveMotion(rashi: number, degree: number): Exclude<RashiMotion, 'dwiswabhav'> {
  const m = bySet(MOTION_GROUPS, rashi)
  if (m !== 'dwiswabhav') return m
  return ((degree % 30) + 30) % 30 < 15 ? 'sthir' : 'char'
}

export function grahaDisha(id: GrahaId): Disha | null {
  return (GRAHA_DISHA as Record<string, Disha>)[id] ?? null
}

export function classificationFieldLabel(f: ClassificationField, lang: EngineLang = 'en'): string {
  return lang === 'hi' ? CLASSIFICATION_FIELD_HI[f] : CLASSIFICATION_FIELD_EN[f]
}

export function dishaLabel(d: Disha, lang: EngineLang = 'en'): string {
  return lang === 'hi' ? DISHA_HI[d] : CLASSIFICATION_VALUE_EN[d]
}

export function getRashiClassification(rashi: number, degree?: number, lang: EngineLang = 'en'): RashiClassification | null {
  if (!Number.isInteger(rashi) || rashi < 1 || rashi > 12) return null
  const r = rashi as Rashi
  const deg = degree === undefined || !Number.isFinite(degree) ? undefined : ((degree % 30) + 30) % 30
  const hi = lang === 'hi'
  const field = (f: ClassificationField) => (hi ? CLASSIFICATION_FIELD_HI[f] : CLASSIFICATION_FIELD_EN[f])
  const val = (v: ClassificationValue) => (hi ? CLASSIFICATION_VALUE_HI[v] : CLASSIFICATION_VALUE_EN[v])

  const motion = bySet(MOTION_GROUPS, r)
  const eff = deg !== undefined && motion === 'dwiswabhav' ? effectiveMotion(r, deg) : undefined
  const creature = creatureOf(r, deg)
  const out: Omit<RashiClassification, 'rows'> = {
    rashi: r,
    ...(deg !== undefined ? { degree: deg } : {}),
    motion,
    ...(eff ? { effectiveMotion: eff } : {}),
    tattva: bySet(TATTVA_GROUPS, r),
    parity: r % 2 === 1 ? 'visham' : 'sam',
    bala: bySet(BALA_GROUPS, r),
    varna: bySet(VARNA_GROUPS, r),
    dosha: bySet(DOSHA_GROUPS, r),
    direction: bySet(DIRECTION_GROUPS, r),
    guna: bySet(GUNA_GROUPS, r),
    nature: bySet(NATURE_GROUPS, r),
    creature,
    ...(deg !== undefined ? { inEdgeDegrees: isInSignEdgeDegrees(r, deg) } : {}),
    color: hi ? RASHI_COLOR_HI[r] : RASHI_COLOR_EN[r],
    places: hi ? RASHI_PLACES_HI[r] : RASHI_PLACES_EN[r],
    bodyParts: hi ? RASHI_BODY_PARTS_HI[r] : RASHI_BODY_PARTS_EN[r],
  }

  const rows: RashiClassificationRow[] = [
    { field: 'motion', label: field('motion'), id: out.motion, value: val(out.motion) },
  ]
  if (out.effectiveMotion) rows.push({ field: 'effectiveMotion', label: field('effectiveMotion'), id: out.effectiveMotion, value: val(out.effectiveMotion) })
  const enumRow = (f: ClassificationField, v: ClassificationValue) => rows.push({ field: f, label: field(f), id: v, value: val(v) })
  enumRow('tattva', out.tattva)
  enumRow('parity', out.parity)
  enumRow('bala', out.bala)
  enumRow('varna', out.varna)
  enumRow('dosha', out.dosha)
  enumRow('direction', out.direction)
  enumRow('guna', out.guna)
  enumRow('nature', out.nature)
  rows.push({ field: 'creature', label: field('creature'), id: creature.length === 1 ? creature[0] : undefined, value: creatureText(creature, hi) })
  rows.push({ field: 'color', label: field('color'), value: out.color })
  if (out.inEdgeDegrees !== undefined) {
    const t = hi ? RASHI_CLASSIFICATION_NOTES_HI.edge : EDGE_TEXT_EN
    rows.push({ field: 'edge', label: field('edge'), value: out.inEdgeDegrees ? t.inside : t.outside })
  }
  return { ...out, rows }
}

/** Split sign without a degree shows both halves. */
function creatureText(c: RashiCreature[], hi: boolean): string {
  const v = (x: RashiCreature) => (hi ? CLASSIFICATION_VALUE_HI[x] : CLASSIFICATION_VALUE_EN[x])
  return c.length === 1 ? v(c[0]) : `0–15°: ${v(c[0])} · 15–30°: ${v(c[1])}`
}

export function listRashiClassifications(lang: EngineLang = 'en'): RashiClassification[] {
  return R.map((r) => getRashiClassification(r, undefined, lang)!)
}

/** Teaching points for the shared "how to read" block (same order in Hindi). */
export const RASHI_CLASSIFICATION_NOTES_EN = {
  title: 'Classical sign groups',
  points: [
    'Number patterns repeat in fours: 1-5-9 fire / Kshatriya / Pitta / East; 2-6-10 earth / Vaishya / Tridosha / South; 3-7-11 air / Shudra / Vata / West; 4-8-12 water / Brahmin / Kapha / North.',
    'Char 1-4-7-10 move and change; Sthir 2-5-8-11 stay and delay; Dwiswabhav 3-6-9-12 act Sthir from 0–15° and Char from 15–30°. Read the degree of a planet in the sign, or of the sign lord if the house is empty.',
    'Day-strong signs: 5, 6, 7, 8, 11, 12. Night-strong signs: 1, 2, 3, 4, 9, 10.',
    'Sign-edge rule: a planet in the last 6° of an odd sign or the first 6° of an even sign loses its natural significations.',
    'Lagna always stands for the East. Planet directions: Sun east, Saturn west, Mercury north, Mars south, Jupiter north-east, Venus south-east, Moon north-west, Rahu–Ketu south-west.',
    'Sign colours are used when choosing remedies; places and creature types help in praśna for lost objects, travel and descriptions.',
  ],
}
