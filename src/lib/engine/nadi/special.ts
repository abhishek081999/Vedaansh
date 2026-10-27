// ─────────────────────────────────────────────────────────────
//  src/lib/engine/nadi/special.ts
//  Exact Mrityu Bhaga, Pushkar Navamsha, and Pushkar Bhaga.
//  A first sound is read from a planet that connects with the
//  lagna. The letter table is not in this lesson.
//  Associations are checked, not a diagnosis.
// ─────────────────────────────────────────────────────────────

import type { Rashi } from '@/types/astrology'
import { GRAHA_NAMES } from '@/types/astrology'
import { getDignity } from '@/lib/engine/dignity'
import {
  RASHI_LORDS,
  wholeSignHouseFromLagna,
  type ClassicalGrahaId,
  type HouseNumber,
} from '@/lib/engine/houseInterpretations'
import { rashiForHouseFromLagna } from '@/lib/engine/rashiInterpretations'
import { MRITYU_BHAGA_DEGREES } from '@/lib/engine/mrityuBhaga'
import { PUSHKARA_NAVAMSHA } from '@/lib/engine/pushkara'
import { nadiAfflictedBy } from '@/lib/engine/nadi/grahas'
import { nadiConjunct, type NadiYogaPlacement } from '@/lib/engine/nadi/yogas'
import { nadiAspectsSign } from '@/lib/engine/nadi/snapshots'

export const NADI_SPECIAL_NOTE =
  'A degree that matches Mrityu Bhaga is read as weak for that planet’s people, health, and period. Pushkar Navamsha and Pushkar Bhaga are read as strong periods, unless that Navamsha sign falls in the 6th, 8th, or 12th. The two cancel when they fall together. A first sound is read from a planet that connects with the lagna or the Navamsha lagna.'

/** Half a degree. The chart already calls this the exact degree, which is the distance read as zero. */
const EXACT = 0.5

/** C.S. Patel, Nadi and Navamsha: one degree in each sign, inside a Pushkar Navamsha. */
const PUSHKAR_BHAGA: Record<Rashi, number> = {
  1: 21, 2: 14, 3: 24, 4: 7, 5: 21, 6: 14,
  7: 24, 8: 7, 9: 21, 10: 14, 11: 24, 12: 7,
}

const ORDER: readonly ClassicalGrahaId[] = ['Su', 'Mo', 'Ma', 'Me', 'Ju', 'Ve', 'Sa', 'Ra', 'Ke']

const MRITYU_EFFECT: Record<ClassicalGrahaId, string> = {
  Su: 'The father is checked, and the heart is checked.',
  Mo: 'The mother is checked, and the mind is checked.',
  Ma: 'Siblings are checked, and so are a dispute over land or property, and the blood.',
  Me: 'Education is checked, and so are the skin, speech, the nerves, and the paternal aunt.',
  Ju: 'Children and childbirth are checked.',
  Ve: 'Marriage is checked for a delay, more than one marriage, or no marriage. The kidneys and the reproductive organs are checked.',
  Sa: 'The career is checked, and so are the bones, the knees, the hip, and the spine.',
  Ra: 'The period of Rahu is read as difficult, and so are the house and the planets Rahu sits with.',
  Ke: 'The period of Ketu is read as difficult, and so are the house and the planets Ketu sits with.',
}

const PAPA = new Set<ClassicalGrahaId>(['Ma', 'Sa', 'Ra', 'Ke'])

export interface SpecialDegreeInput {
  ascRashi: Rashi
  ascDegree?: number
  grahas: readonly NadiYogaPlacement[]
  navamsha?: Partial<Record<ClassicalGrahaId, Rashi>>
  navamshaLagna?: Rashi
  dashaLords?: readonly ClassicalGrahaId[]
  parivartana?: readonly { a: HouseNumber; b: HouseNumber }[]
}

function exact(degree: number | undefined, target: number): boolean {
  return degree != null && Number.isFinite(degree) && degree >= 0 && degree < 30 && Math.abs(degree - target) <= EXACT
}

function inPushkarNavamsha(rashi: Rashi, degree: number): boolean {
  const navamsha = Math.floor(degree / (30 / 9)) + 1
  return PUSHKARA_NAVAMSHA[rashi].includes(navamsha)
}

function name(id: ClassicalGrahaId): string {
  return GRAHA_NAMES[id]
}

function joinNames(ids: readonly ClassicalGrahaId[]): string {
  const names = ids.map(name)
  if (names.length <= 1) return names[0] ?? ''
  if (names.length === 2) return `${names[0]} and ${names[1]}`
  return `${names.slice(0, -1).join(', ')}, and ${names[names.length - 1]}`
}

function periodClause(id: ClassicalGrahaId, lords: readonly ClassicalGrahaId[], quality: string): string {
  const maha = lords[0] === id
  const antar = lords[1] === id
  if (maha && antar) return ` The mahadasha and antardasha of ${name(id)} are running, and the period is read as ${quality}.`
  if (maha) return ` The mahadasha of ${name(id)} is running, and the period is read as ${quality}.`
  if (antar) return ` The antardasha of ${name(id)} is running, and the period is read as ${quality}.`
  return ` The period of ${name(id)} is read as ${quality}.`
}

function dusthanaHouse(asc: Rashi, sign: Rashi | undefined): HouseNumber | null {
  if (sign == null) return null
  const house = wholeSignHouseFromLagna(asc, sign)
  return house === 6 || house === 8 || house === 12 ? house : null
}

function dignityOf(planet: NadiYogaPlacement): string {
  if (planet.dignity) return planet.dignity
  return getDignity(planet.id, planet.rashi, planet.degree ?? 15)
}

function lordOf(asc: Rashi, house: HouseNumber): ClassicalGrahaId {
  const sign = rashiForHouseFromLagna(asc, house)
  return RASHI_LORDS.find((row) => row.number === sign)?.lord ?? 'Su'
}

function afflicted(planet: NadiYogaPlacement, grahas: readonly NadiYogaPlacement[]): boolean {
  const withIt = grahas.filter((other) => other.rashi === planet.rashi).map((other) => other.id)
  if (nadiAfflictedBy(planet.id, withIt).length > 0) return true
  return grahas.some((other) => (
    other.id !== planet.id
    && PAPA.has(other.id)
    && other.rashi !== planet.rashi
    && nadiAspectsSign(other.rashi, other.id, planet.rashi)
  ))
}

export function specialDegreeNotes(input: SpecialDegreeInput): string[] {
  const lords = input.dashaLords ?? []
  const lines: string[] = []
  const pushkarIds = new Set<ClassicalGrahaId>()
  const avoided = new Set<ClassicalGrahaId>()

  if (exact(input.ascDegree, MRITYU_BHAGA_DEGREES[input.ascRashi])) {
    lines.push('The lagna degree is in Mrityu Bhaga. The native’s health is checked.')
  }

  for (const id of ORDER) {
    const planet = input.grahas.find((row) => row.id === id)
    if (!planet || planet.degree == null || !Number.isFinite(planet.degree)) continue
    const mrityu = exact(planet.degree, MRITYU_BHAGA_DEGREES[planet.rashi])
    const navamsha = inPushkarNavamsha(planet.rashi, planet.degree)
    const bhaga = exact(planet.degree, PUSHKAR_BHAGA[planet.rashi])
    const blocked = navamsha ? dusthanaHouse(input.ascRashi, input.navamsha?.[id]) : null
    const navamshaKnown = input.navamsha?.[id] != null
    if (mrityu) avoided.add(id)
    if (dignityOf(planet) === 'debilitated' || afflicted(planet, input.grahas)) avoided.add(id)

    if (mrityu && navamsha && blocked == null && navamshaKnown) {
      lines.push(`${name(id)} is in Mrityu Bhaga and in Pushkar Navamsha. The two are read as cancelling, so the result is mixed.${periodClause(id, lords, 'mixed')}`)
      continue
    }
    if (mrityu) {
      lines.push(`${name(id)} is in Mrityu Bhaga. ${MRITYU_EFFECT[id]}${periodClause(id, lords, 'difficult')}`)
    }
    if (navamsha && !navamshaKnown) {
      lines.push(`${name(id)} is in Pushkar Navamsha. The Navamsha sign is not on the chart, so the 6th, 8th, and 12th test is not read.`)
    } else if (navamsha && blocked != null) {
      lines.push(`${name(id)} is in Pushkar Navamsha, and that Navamsha sign falls in the ${blocked}th from the lagna. The benefit is read as cancelled.`)
    } else if (navamsha && bhaga) {
      pushkarIds.add(id)
      lines.push(`${name(id)} is in Pushkar Navamsha and at Pushkar Bhaga. That is the strongest form.${periodClause(id, lords, 'exceptionally strong')}`)
    } else if (navamsha) {
      pushkarIds.add(id)
      lines.push(`${name(id)} is in Pushkar Navamsha.${periodClause(id, lords, 'one of the best')}`)
    } else if (bhaga) {
      pushkarIds.add(id)
      lines.push(`${name(id)} is at Pushkar Bhaga.${periodClause(id, lords, 'one of the best')}`)
    }
  }

  lines.push(...nameNotes(input, avoided, pushkarIds))
  return lines
}

function nameNotes(
  input: SpecialDegreeInput,
  avoided: ReadonlySet<ClassicalGrahaId>,
  pushkarIds: ReadonlySet<ClassicalGrahaId>,
): string[] {
  const lagnaLord = lordOf(input.ascRashi, 1)
  const d9Lord = input.navamshaLagna != null ? lordOf(input.navamshaLagna, 1) : null
  const placed = (id: ClassicalGrahaId) => input.grahas.find((planet) => planet.id === id)
  const lines: string[] = []

  const linked = (planet: NadiYogaPlacement): boolean => {
    if (planet.id === lagnaLord || planet.id === d9Lord) return true
    if (wholeSignHouseFromLagna(input.ascRashi, planet.rashi) === 1) return true
    if (input.navamsha?.[planet.id] != null && input.navamsha[planet.id] === input.navamshaLagna) return true
    if (nadiConjunct(input.grahas, [planet.id, lagnaLord])) return true
    if (d9Lord && nadiConjunct(input.grahas, [planet.id, d9Lord])) return true
    if (nadiAspectsSign(planet.rashi, planet.id, input.ascRashi)) return true
    if (input.navamshaLagna != null && nadiAspectsSign(planet.rashi, planet.id, input.navamshaLagna)) return true
    const lagnaHost = placed(lagnaLord)
    if (lagnaHost && planet.id !== lagnaLord && nadiAspectsSign(planet.rashi, planet.id, lagnaHost.rashi)) return true
    const d9Host = d9Lord ? placed(d9Lord) : undefined
    if (d9Host && d9Lord && planet.id !== d9Lord && nadiAspectsSign(planet.rashi, planet.id, d9Host.rashi)) return true
    return false
  }

  const suitable = ORDER.filter((id) => {
    const planet = placed(id)
    return planet != null && linked(planet) && !avoided.has(id)
  })
  const leftOut = ORDER.filter((id) => avoided.has(id) && placed(id) && linked(placed(id)!))

  if (suitable.length > 0) {
    lines.push(`A first sound is read from ${joinNames(suitable)}. ${suitable.length === 1 ? `${name(suitable[0]!)} connects` : 'Each connects'} with the lagna or the Navamsha lagna.`)
  }
  if (leftOut.length > 0) {
    lines.push(`Not used for a first sound: ${joinNames(leftOut)}. A planet in Mrityu Bhaga, a debilitated planet, or a planet with a malefic on it is left out.`)
  }

  const lordsWeak = avoided.has(lagnaLord) && (d9Lord == null || avoided.has(d9Lord))
  if (lordsWeak) {
    const fallback = ORDER.find((id) => {
      if (avoided.has(id) || suitable.includes(id)) return false
      const planet = placed(id)
      if (!planet) return false
      const vargottama = input.navamsha?.[id] === planet.rashi
      const exchanged = (input.parivartana ?? []).some((pair) => lordOf(input.ascRashi, pair.a) === id || lordOf(input.ascRashi, pair.b) === id)
      return dignityOf(planet) === 'exalted' || vargottama || exchanged || pushkarIds.has(id)
    })
    if (fallback) {
      lines.push(`The lagna lord is not the choice. ${name(fallback)} is the strong planet used instead.`)
    }
  }

  const lord = placed(lagnaLord)
  if (lord && input.navamsha?.[lagnaLord] === lord.rashi) {
    const house = wholeSignHouseFromLagna(input.ascRashi, lord.rashi)
    if (house === 6 || house === 8 || house === 12) {
      lines.push(`The lagna lord is vargottama in the ${house}th. Its sound can still be read, and the Navamsha lagna lord is the other choice.`)
    }
  }
  return lines
}
