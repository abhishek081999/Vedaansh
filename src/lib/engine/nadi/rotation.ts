// ─────────────────────────────────────────────────────────────
//  src/lib/engine/nadi/rotation.ts
//  Bhrigu Nadi house rotation. A relative’s house is their lagna.
//  Count anti-clockwise for career (10), marriage (7), education (5),
//  and death (8). Shloka 731 times death by Saturn on that 8th lord’s navamsha.
// ─────────────────────────────────────────────────────────────

import { GRAHA_NAMES, RASHI_NAMES } from '@/types/astrology'
import type { Rashi } from '@/types/astrology'
import type { ClassicalGrahaId, HouseNumber } from '@/lib/engine/houseInterpretations'
import { NADI_PAPA_GRAHAS } from '@/lib/engine/nadi/houses'

export const NADI_ROTATION_NOTE =
  'Each relative’s house is their lagna. Count anti-clockwise: the 10th is career, the 7th marriage, the 5th education, the 8th longevity. Bhrigu Nadi 731 times a relative’s death when Saturn transits the navamsha of the lord of that 8th house.'

export interface NadiRotationSubject {
  id: string
  label: string
  house: HouseNumber
}

export const NADI_ROTATION_SUBJECTS: readonly NadiRotationSubject[] = [
  { id: 'native', label: 'Native', house: 1 },
  { id: 'younger', label: 'Younger siblings', house: 3 },
  { id: 'mother', label: 'Mother', house: 4 },
  { id: 'children', label: 'Children', house: 5 },
  { id: 'maternal', label: 'Maternal uncle / aunt', house: 6 },
  { id: 'spouse', label: 'Spouse', house: 7 },
  { id: 'father', label: 'Father', house: 10 },
  { id: 'elder', label: 'Elder siblings', house: 11 },
]

function ordinalHouse(n: number): string {
  const mod = n % 10
  if (mod === 1 && n !== 11) return `${n}st`
  if (mod === 2 && n !== 12) return `${n}nd`
  if (mod === 3 && n !== 13) return `${n}rd`
  return `${n}th`
}

/** House `nth` counted anti-clockwise from `start`. 1 means `start` itself. */
export function houseCountedFrom(start: number, nth: number): HouseNumber {
  const s = ((start - 1) % 12 + 12) % 12
  const n = ((nth - 1) % 12 + 12) % 12
  return ((s + n) % 12 + 1) as HouseNumber
}

export const NADI_CAREER_WORK: Record<ClassicalGrahaId, string> = {
  Su: 'government, administration, or authority',
  Mo: 'nursing, hospitality, liquids, farming, or public dealing',
  Ma: 'engineering, defence, surgery, sport, or construction',
  Me: 'communication, accounts, trade, writing, or software',
  Ju: 'law, teaching, banking, or advice',
  Ve: 'art, fashion, hotels, beauty, or media',
  Sa: 'law, labour, mining, oil, or long service',
  Ra: 'technical work, electronics, IT, or a foreign company',
  Ke: 'software, research, an NGO, or spiritual work',
}

export const NADI_JUPITER_TRANSIT = [
  { planet: 'Saturn', result: 'Professional growth, a new post, or a promotion. Some work is read even if none is held.' },
  { planet: 'Venus', result: 'Wealth, a marriage or a meeting that may not last, jewelry, or a vehicle.' },
  { planet: 'Rahu', result: 'A hard period. A death in the family, illness, a loss of work, or a change of place is checked. This is the hardest of these transits.' },
  { planet: 'Ketu', result: 'A pilgrimage or a turn toward spiritual life, a change of place, surgery, a break in work, or childbirth.' },
  { planet: 'Mars', result: 'A property purchase, a building, or work on a house.' },
  { planet: 'Sun', result: 'A promotion, a government benefit, or a rise in work.' },
  { planet: 'Mercury', result: 'A course, a skill, or the end of a degree.' },
  { planet: 'Moon', result: 'A long journey, a change of place, or a change in cash. Defame is checked when Rahu sits with the Moon.' },
] as const

const JUPITER_OVER: Partial<Record<ClassicalGrahaId, string>> = {
  Sa: 'professional growth',
  Ve: 'wealth, a meeting, jewelry, or a vehicle',
  Ra: 'a hard period for the family, work, or a move',
  Ke: 'a pilgrimage, surgery, a break in work, or childbirth',
  Ma: 'property',
  Su: 'a promotion or a government benefit',
  Me: 'study or a new skill',
  Mo: 'travel or cash',
}

/** Planets that share a sign are woken together when Jupiter reaches that sign. */
export function jupiterTransitGroups(grahas: readonly { id: ClassicalGrahaId; rashi: Rashi }[]): string[] {
  const bySign = new Map<Rashi, ClassicalGrahaId[]>()
  for (const g of grahas) {
    const list = bySign.get(g.rashi) ?? []
    list.push(g.id)
    bySign.set(g.rashi, list)
  }
  const lines: string[] = []
  for (const [sign, ids] of bySign) {
    const woken = ids.filter((id) => JUPITER_OVER[id])
    if (ids.length < 2 || woken.length === 0) continue
    const names = joinNames(ids.map((id) => GRAHA_NAMES[id]))
    const results = woken.map((id) => JUPITER_OVER[id]).join('; ')
    let line = `${names} share ${RASHI_NAMES[sign]}. Jupiter over that sign is read as ${results}.`
    if (woken.includes('Mo') && woken.includes('Ra')) line += ' Defame is also checked.'
    lines.push(line)
  }
  return lines
}

function joinNames(names: string[]): string {
  if (names.length <= 1) return names[0] ?? ''
  if (names.length === 2) return `${names[0]} and ${names[1]}`
  return `${names.slice(0, -1).join(', ')}, and ${names[names.length - 1]}`
}

const PAPA = NADI_PAPA_GRAHAS as readonly string[]

export function careerWork(ids: readonly ClassicalGrahaId[]): string {
  if (ids.length === 0) return 'Empty. Read the lord of this career house.'
  const lines = ids.map((id) => `${GRAHA_NAMES[id]}: ${NADI_CAREER_WORK[id]}`)
  const has = (id: ClassicalGrahaId) => ids.includes(id)
  if ((has('Ma') || has('Sa')) && has('Ke')) {
    lines.push('With Ketu: surgery or medicine is also checked.')
  }
  if (has('Sa')) lines.push('Saturn on a career house: a black coat, when law is the question.')
  if (has('Ma')) lines.push('Mars on a career house: a uniform, engineering, or surgery.')
  if (has('Ra')) lines.push('Rahu on a career house: foreign or technical work.')
  if (has('Su') && has('Me')) lines.push('Sun with Mercury: government teaching.')
  if (has('Su') && has('Ju')) lines.push('Sun with Jupiter: law with administration.')
  return lines.map((line) => (line.endsWith('.') ? line : `${line}.`)).join(' ')
}

export function educationNotes(ids: readonly ClassicalGrahaId[]): string[] {
  const has = (id: ClassicalGrahaId) => ids.includes(id)
  const notes: string[] = []
  if (has('Sa') && has('Ma') && !has('Ra') && !has('Ke')) {
    notes.push('Saturn with Mars in the 5th: mechanical or civil engineering.')
  }
  if (has('Ra')) notes.push('Rahu in the 5th: a break in study, a change of stream, or electronics and computers. Foreign study is likely. Adoption, or treating someone as one’s own child, is also checked.')
  if (has('Ke')) {
    notes.push('Ketu in the 5th: a break in formal study, then software. The degree often is not the final work.')
  }
  if (has('Sa') && has('Ke')) {
    notes.push('Saturn with Ketu in the 5th: a break, then routine computer work. Occult study is also checked, and so is strain around children when the dasha agrees.')
  }
  if (has('Ma') && has('Sa') && (has('Ra') || has('Ke'))) {
    notes.push('Mars, Saturn, and Rahu or Ketu in the 5th: engineering.')
  }
  if (has('Ve')) notes.push('Venus in the 5th: arts, design, or fashion.')
  if (has('Me')) notes.push('Mercury in the 5th: commerce, communication, or literature.')
  if (has('Mo')) notes.push('Moon in the 5th: humanities or fine arts.')
  if (has('Ju')) notes.push('Jupiter in the 5th: law, philosophy, or teaching.')
  if (has('Su')) notes.push('Sun in the 5th: administrative study.')
  if (has('Su') && has('Ju')) notes.push('Sun with Jupiter in the 5th: law together with administration.')
  const breakers = (['Sa', 'Ra', 'Ke'] as const).filter(has)
  if (breakers.length) {
    const how = breakers.map((id) => {
      if (id === 'Sa') return 'Saturn: a stop or a long delay'
      if (id === 'Ra') return 'Rahu: a change of stream'
      return 'Ketu: leaving the classroom for self-teaching'
    })
    notes.push(`Break in education: ${how.join('; ')}.`)
  }
  if (has('Sa') && ids.length === 1) {
    notes.push('Saturn alone in the 5th: the slowest education, and the subject studied may not become the career.')
  }
  return notes
}

export interface NadiRotatedRelative {
  id: string
  label: string
  house: HouseNumber
  careerHouse: HouseNumber
  marriageHouse: HouseNumber
  educationHouse: HouseNumber
  deathHouse: HouseNumber
  careerOccupantIds: ClassicalGrahaId[]
  careerOccupants: string[]
  careerWork: string
}

export function rotateRelatives(
  occupantsOf: (house: HouseNumber) => readonly { id: ClassicalGrahaId }[],
): NadiRotatedRelative[] {
  return NADI_ROTATION_SUBJECTS.map((subject) => {
    const careerHouse = houseCountedFrom(subject.house, 10)
    const ids = occupantsOf(careerHouse).map((g) => g.id)
    return {
      id: subject.id,
      label: subject.label,
      house: subject.house,
      careerHouse,
      marriageHouse: houseCountedFrom(subject.house, 7),
      educationHouse: houseCountedFrom(subject.house, 5),
      deathHouse: houseCountedFrom(subject.house, 8),
      careerOccupantIds: ids,
      careerOccupants: ids.map((id) => GRAHA_NAMES[id]),
      careerWork: careerWork(ids),
    }
  })
}

export interface NadiDeathIndicator {
  id: string
  label: string
  house: HouseNumber
  lordName: string
  navamshaName: string | null
}

export function deathIndicators(
  relatives: readonly NadiRotatedRelative[],
  lordName: (house: HouseNumber) => string,
  navamshaName: (house: HouseNumber) => string | null,
): NadiDeathIndicator[] {
  return relatives.map((rel) => ({
    id: rel.id,
    label: rel.label,
    house: rel.deathHouse,
    lordName: lordName(rel.deathHouse),
    navamshaName: navamshaName(rel.deathHouse),
  }))
}

export function healthFlags(
  occupantsOf: (house: HouseNumber) => readonly { id: ClassicalGrahaId }[],
): string[] {
  const papa = (house: HouseNumber) => occupantsOf(house).some((g) => PAPA.includes(g.id))
  const flags: string[] = []
  if (papa(1)) flags.push('Lagna holds a malefic: the native’s overall health and the head are under pressure.')
  if (papa(10)) {
    flags.push('The 10th holds a malefic. That house is the 7th from the mother, so her kidneys, blood sugar, and uterus are checked.')
  }
  if (papa(9)) flags.push('The 9th holds a malefic. That house is the 6th from the mother, so her digestion is checked.')
  if (papa(8)) flags.push('The 8th holds a malefic. That house is the 5th from the mother, so her heart is checked.')
  if (papa(11)) flags.push('The 11th holds a malefic. That house is the 7th from the children, so their kidneys are checked.')
  if (papa(9) && papa(5)) flags.push('The 9th is also the 5th from the children: their heart and stomach are checked when it is afflicted.')
  return flags
}

/** A parivartana house that is the 2nd from a relative strengthens that relative’s wealth. */
export function parivartanaWealth(
  pairs: readonly { a: HouseNumber; b: HouseNumber }[],
): string[] {
  const notes: string[] = []
  for (const pair of pairs) {
    for (const house of [pair.a, pair.b]) {
      for (const subject of NADI_ROTATION_SUBJECTS) {
        if (subject.id === 'native') continue
        if (houseCountedFrom(subject.house, 2) !== house) continue
        notes.push(`Exchange touching the ${ordinalHouse(house)} strengthens the wealth of ${subject.label.toLowerCase()}. That house is the 2nd from theirs.`)
      }
    }
  }
  return [...new Set(notes)]
}

export function uniformNotes(
  tenthLord: ClassicalGrahaId | null,
  tenthOccupants: readonly ClassicalGrahaId[],
): string[] {
  const notes: string[] = []
  const saturn = tenthLord === 'Sa' || tenthOccupants.includes('Sa')
  const mars = tenthLord === 'Ma' || tenthOccupants.includes('Ma')
  if (saturn) notes.push('Saturn is tied to the 10th: a black coat, read as law, when the career holds.')
  if (mars) notes.push('Mars is tied to the 10th: a uniform, read as police, military, or surgery, when the career holds.')
  return notes
}

export function navamshaLabel(rashi: Rashi | null | undefined): string | null {
  if (!rashi) return null
  return RASHI_NAMES[rashi] ?? null
}
