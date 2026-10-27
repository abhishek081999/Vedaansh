// ─────────────────────────────────────────────────────────────
//  src/lib/engine/nadi/property.ts
//  Chaturthamsha (D4) property and Shodashamsha (D16) vehicles.
//  Each varga is its own chart. Exchange is read first.
//  A debilitated planet in the 6th, 8th, or 12th of that
//  varga is read as exalted. Nodes are not switched here.
// ─────────────────────────────────────────────────────────────

import type { NodeMode, Rashi } from '@/types/astrology'
import { GRAHA_NAMES } from '@/types/astrology'
import { getDignity } from '@/lib/engine/dignity'
import {
  RASHI_LORDS,
  wholeSignHouseFromLagna,
  type ClassicalGrahaId,
  type HouseNumber,
} from '@/lib/engine/houseInterpretations'
import { rashiForHouseFromLagna } from '@/lib/engine/rashiInterpretations'
import { nadiAspectsSign } from '@/lib/engine/nadi/snapshots'
import { nadiConjunct, type NadiYogaPlacement } from '@/lib/engine/nadi/yogas'

export const NADI_PROPERTY_NOTE =
  'Chaturthamsha is read as its own chart. The lagna and the 4th are the property houses, and Mars is the property significator. Parental property and self-acquired property are read together. A link with the 12th or with Rahu is property away from home. The Sun on the lagna, the 4th, or their lords is government quarters. An exchange is read ahead of the other lines.'

export const NADI_VEHICLE_NOTE =
  'Shodashamsha is read as its own chart. The lagna and the 4th are the vehicle houses, and Venus is the vehicle significator. The strongest of the Moon, Venus, Saturn, and Mars gives the color. Rahu or Ketu on the lagna, the 4th, the 4th lord, Mars, or Venus is an accident checked. The Sun is a government vehicle. Mars on the lagna or the 4th is a vehicle with a light or a flag. An exchange is read ahead of the other lines.'

const ORDER: readonly ClassicalGrahaId[] = ['Su', 'Mo', 'Ma', 'Me', 'Ju', 'Ve', 'Sa', 'Ra', 'Ke']
const COLOR_PLANETS = ['Mo', 'Ve', 'Sa', 'Ma'] as const
const COLOR: Record<(typeof COLOR_PLANETS)[number], string> = {
  Mo: 'White',
  Ve: 'White or silver',
  Sa: 'Black',
  Ma: 'Red',
}

type Varga = { ascRashi: Rashi; grahas: readonly NadiYogaPlacement[] }

export function propertyNotes(input: {
  chaturthamsha?: Varga
  dashaLords?: readonly ClassicalGrahaId[]
}): string[] {
  const chart = input.chaturthamsha
  if (!chart) return []
  const { ascRashi: lagna, grahas } = chart
  const lines: string[] = []
  const exchanges = parivartana(lagna, grahas)
  const lagnaLord = signLord(lagna)
  const fourthLord = signLord(rashiForHouseFromLagna(lagna, 4))
  const twelfthLord = signLord(rashiForHouseFromLagna(lagna, 12))

  for (const pair of exchanges) {
    lines.push(`An exchange of the ${houseLabel(pair.a)} and the ${houseLabel(pair.b)} is present in Chaturthamsha. Property is read from that.`)
  }

  const eleventh = ORDER.flatMap((id) => {
    const planet = placed(grahas, id)
    return planet && wholeSignHouseFromLagna(lagna, planet.rashi) === 11 ? [GRAHA_NAMES[id]] : []
  })
  if (eleventh.length >= 3) {
    lines.push(`${joinNames(eleventh)} sit in the 11th of Chaturthamsha. Property and income are read from that crowd.`)
  }

  const lordInEleventh = [lagnaLord, fourthLord].filter((id, index, list) => list.indexOf(id) === index && houseOf(grahas, lagna, id) === 11)
  if (lordInEleventh.length === 2) {
    lines.push('The Chaturthamsha lagna lord and the 4th lord sit in the 11th. Property and gains are read from that.')
  } else if (lordInEleventh[0] === lagnaLord) {
    lines.push('The Chaturthamsha lagna lord sits in the 11th. Property and gains are read from that.')
  } else if (lordInEleventh[0] === fourthLord) {
    lines.push('The 4th lord of Chaturthamsha sits in the 11th. Property and gains are read from that.')
  }

  const lagnaStrength = strengthPhrase(placed(grahas, lagnaLord), lagna)
  if (lagnaStrength) lines.push(`The Chaturthamsha lagna lord ${lagnaStrength}. The lagna is read as strong for property.`)
  const fourthStrength = strengthPhrase(placed(grahas, fourthLord), lagna)
  if (fourthStrength) lines.push(`The 4th lord of Chaturthamsha ${fourthStrength}. The 4th is read as strong for property.`)

  const mars = placed(grahas, 'Ma')
  if (mars && wholeSignHouseFromLagna(lagna, mars.rashi) === 9 && pole(mars) !== 'debilitated') {
    lines.push('Mars sits in the 9th of Chaturthamsha. Property is read as supported.')
  }
  const marsStrength = strengthPhrase(mars, lagna)
  if (marsStrength) lines.push(`Mars ${marsStrength} in Chaturthamsha. Property is read from Mars.`)

  const jupiter = placed(grahas, 'Ju')
  if (jupiter && wholeSignHouseFromLagna(lagna, jupiter.rashi) === 9 && pole(jupiter) === 'exalted') {
    lines.push('Jupiter is exalted in the 9th of Chaturthamsha. Property is read as supported.')
  }
  if (jupiter && wholeSignHouseFromLagna(lagna, jupiter.rashi) === 6) {
    const reversed = dusthanaHouse(jupiter, lagna)
    lines.push(`Jupiter in the 6th of Chaturthamsha is read as strong for property.${reversed ? ' The debilitation is read as exalted.' : ''}`)
  }

  for (const id of unique([lagnaLord, fourthLord, 'Ma'])) {
    if (id === 'Ju' && houseOf(grahas, lagna, id) === 6) continue
    const planet = placed(grahas, id)
    const house = planet ? dusthanaHouse(planet, lagna) : null
    if (!planet || !house) continue
    lines.push(`${GRAHA_NAMES[id]} is debilitated in the ${ordinal(house)} of Chaturthamsha. That is read as exalted for property.`)
  }

  for (const id of unique([lagnaLord, fourthLord])) {
    const planet = placed(grahas, id)
    if (!planet) continue
    const links = foreignLinks(planet, lagna, grahas, twelfthLord)
    if (!links.length) continue
    const role = id === lagnaLord && id === fourthLord
      ? 'the lagna lord and the 4th lord'
      : id === lagnaLord
        ? 'the lagna lord'
        : 'the 4th lord'
    lines.push(`${GRAHA_NAMES[id]}, ${role} of Chaturthamsha, ${joinParts(links)}. Property away from home is checked.`)
  }

  const sun = placed(grahas, 'Su')
  if (sun) {
    const links = [
      housePhrase(sun, lagna, 1),
      housePhrase(sun, lagna, 4),
      lordPhrase(sun, placed(grahas, lagnaLord), grahas, 'the lagna lord'),
      lordPhrase(sun, placed(grahas, fourthLord), grahas, 'the 4th lord'),
    ].filter((part): part is string => part !== null)
    if (links.length) lines.push(`The Sun ${joinParts(links)} of Chaturthamsha. Government quarters are checked.`)
  }

  lines.push(...periodLines(input.dashaLords ?? [], (lord) => {
    const roles: string[] = []
    if (lord === lagnaLord) roles.push('rules the lagna')
    if (lord === fourthLord) roles.push('rules the 4th')
    if (lord === 'Ma') roles.push('is the property significator')
    if (exchangeLord(exchanges, lagna, lord)) roles.push('is in the exchange')
    if (!roles.length) return null
    const effect = roles.length === 1 && roles[0] === 'is in the exchange'
      ? 'so this period is read as supported for property'
      : 'so property is checked'
    return `${GRAHA_NAMES[lord]} ${joinParts(roles)}, ${effect}`
  }))

  return lines
}

export function vehicleNotes(input: {
  shodashamsha?: Varga
  dashaLords?: readonly ClassicalGrahaId[]
}): string[] {
  const chart = input.shodashamsha
  if (!chart) return []
  const { ascRashi: lagna, grahas } = chart
  const lines: string[] = []
  const exchanges = parivartana(lagna, grahas)
  const lagnaLord = signLord(lagna)
  const fourthLord = signLord(rashiForHouseFromLagna(lagna, 4))

  for (const pair of exchanges) {
    lines.push(`An exchange of the ${houseLabel(pair.a)} and the ${houseLabel(pair.b)} is present in Shodashamsha. A vehicle is read from that.`)
  }

  const lagnaStrength = strengthPhrase(placed(grahas, lagnaLord), lagna)
  if (lagnaStrength) lines.push(`The Shodashamsha lagna lord ${lagnaStrength}. The lagna is read as strong for a vehicle.`)
  const fourthStrength = strengthPhrase(placed(grahas, fourthLord), lagna)
  if (fourthStrength) lines.push(`The 4th lord of Shodashamsha ${fourthStrength}. The 4th is read as strong for a vehicle.`)
  const venusStrength = strengthPhrase(placed(grahas, 'Ve'), lagna)
  if (venusStrength) lines.push(`Venus ${venusStrength} in Shodashamsha. A vehicle is read from Venus.`)

  const ranked = COLOR_PLANETS.flatMap((id) => {
    const planet = placed(grahas, id)
    const value = planet ? colorScore(planet, lagna) : 0
    return value >= 3 ? [{ id, value }] : []
  })
  const top = ranked.reduce((best, row) => Math.max(best, row.value), 0)
  const winners = ranked.filter((row) => row.value === top)
  if (winners.length === 1) {
    const id = winners[0]!.id
    lines.push(`${GRAHA_NAMES[id]} is the strongest of the Moon, Venus, Saturn, and Mars in Shodashamsha. ${COLOR[id]} is the color read for a vehicle.`)
  } else if (winners.length > 1) {
    const colors = winners.map((row) => `${COLOR[row.id]} is read from ${GRAHA_NAMES[row.id]}`)
    lines.push(`${joinNames(winners.map((row) => GRAHA_NAMES[row.id]))} are the strongest of these in Shodashamsha. ${colors.join('. ')}.`)
  }

  for (const id of unique([lagnaLord, fourthLord, 'Ve', 'Mo', 'Sa', 'Ma'])) {
    const planet = placed(grahas, id)
    const house = planet ? dusthanaHouse(planet, lagna) : null
    if (!planet || !house) continue
    lines.push(`${GRAHA_NAMES[id]} is debilitated in the ${ordinal(house)} of Shodashamsha. That is read as exalted for a vehicle.`)
  }

  const hits = (['Ra', 'Ke'] as const).flatMap((id) => {
    const node = placed(grahas, id)
    if (!node) return []
    const found: string[] = []
    if (reachesHouse(node, lagna, 1)) found.push('the lagna')
    if (reachesHouse(node, lagna, 4)) found.push('the 4th')
    const fourth = placed(grahas, fourthLord)
    if (fourth && fourth.id !== id && meets(node, fourth, grahas)) {
      found.push(fourthLord === 'Ma' || fourthLord === 'Ve' ? `${GRAHA_NAMES[fourthLord]}, the 4th lord` : 'the 4th lord')
    }
    for (const otherId of ['Ma', 'Ve'] as const) {
      if (otherId === fourthLord) continue
      const other = placed(grahas, otherId)
      if (other && meets(node, other, grahas)) found.push(GRAHA_NAMES[otherId])
    }
    return found.length ? [`${GRAHA_NAMES[id]} connects with ${joinParts(found)} in Shodashamsha`] : []
  })
  if (hits.length) {
    lines.push(`${hits.join('. ')}. An accident with a vehicle is checked.`)
  }

  const sun = placed(grahas, 'Su')
  const mars = placed(grahas, 'Ma')
  const sunBits = sun ? [housePhrase(sun, lagna, 1), housePhrase(sun, lagna, 4)].filter((part): part is string => part !== null) : []
  const marsBits = mars ? [housePhrase(mars, lagna, 1), housePhrase(mars, lagna, 4)].filter((part): part is string => part !== null) : []
  if (sunBits.length && marsBits.length) {
    lines.push(`The Sun ${joinParts(sunBits)} of Shodashamsha, and Mars ${joinParts(marsBits)}. A government vehicle with a light or a flag is checked.`)
  } else if (sunBits.length) {
    lines.push(`The Sun ${joinParts(sunBits)} of Shodashamsha. A government vehicle is checked.`)
  } else if (marsBits.length) {
    lines.push(`Mars ${joinParts(marsBits)} of Shodashamsha. A vehicle with a light or a flag is checked.`)
  }

  lines.push(...periodLines(input.dashaLords ?? [], (lord) => {
    const roles: string[] = []
    if (lord === lagnaLord) roles.push('rules the lagna')
    if (lord === fourthLord) roles.push('rules the 4th')
    if (lord === 'Ve') roles.push('is the vehicle significator')
    if (exchangeLord(exchanges, lagna, lord)) roles.push('is in the exchange')
    if (!roles.length) return null
    const effect = roles.length === 1 && roles[0] === 'is in the exchange'
      ? 'so this period is read as supported for a vehicle'
      : 'so a vehicle is checked, including through the parents when the person is not earning'
    return `${GRAHA_NAMES[lord]} ${joinParts(roles)}, ${effect}`
  }))

  return lines
}

export function nadiNodeNote(nodeMode?: NodeMode): string | null {
  if (nodeMode !== 'mean') return null
  return 'This chart uses mean nodes. Nadi reads Rahu and Ketu as true nodes.'
}

function foreignLinks(
  planet: NadiYogaPlacement,
  lagna: Rashi,
  grahas: readonly NadiYogaPlacement[],
  twelfthLord: ClassicalGrahaId,
): string[] {
  const links: string[] = []
  const inTwelfth = wholeSignHouseFromLagna(lagna, planet.rashi) === 12
  if (inTwelfth) links.push('sits in the 12th')
  else if (nadiAspectsSign(planet.rashi, planet.id, rashiForHouseFromLagna(lagna, 12))) links.push('aspects the 12th')
  if (planet.id === twelfthLord && !inTwelfth) links.push('is the 12th lord')
  const twelfth = placed(grahas, twelfthLord)
  if (!inTwelfth && twelfth && twelfth.id !== planet.id && meets(planet, twelfth, grahas)) links.push('connects with the 12th lord')
  const rahu = placed(grahas, 'Ra')
  if (rahu && meets(planet, rahu, grahas)) links.push(nadiConjunct(grahas, [planet.id, 'Ra']) ? 'is with Rahu' : 'connects with Rahu')
  return links
}

function lordPhrase(
  planet: NadiYogaPlacement,
  lord: NadiYogaPlacement | null,
  grahas: readonly NadiYogaPlacement[],
  label: string,
): string | null {
  if (!lord) return null
  if (planet.id === lord.id) return `is ${label}`
  if (!meets(planet, lord, grahas)) return null
  return nadiConjunct(grahas, [planet.id, lord.id]) ? `is with ${label}` : `connects with ${label}`
}

function housePhrase(planet: NadiYogaPlacement, lagna: Rashi, house: HouseNumber): string | null {
  const label = house === 1 ? 'the lagna' : `the ${ordinal(house)}`
  if (wholeSignHouseFromLagna(lagna, planet.rashi) === house) return `sits in ${label}`
  if (nadiAspectsSign(planet.rashi, planet.id, rashiForHouseFromLagna(lagna, house))) return `aspects ${label}`
  return null
}

function reachesHouse(planet: NadiYogaPlacement, lagna: Rashi, house: HouseNumber): boolean {
  return housePhrase(planet, lagna, house) !== null
}

function meets(a: NadiYogaPlacement, b: NadiYogaPlacement, grahas: readonly NadiYogaPlacement[]): boolean {
  if (a.id === b.id) return false
  if (nadiConjunct(grahas, [a.id, b.id])) return true
  return nadiAspectsSign(a.rashi, a.id, b.rashi) || nadiAspectsSign(b.rashi, b.id, a.rashi)
}

function periodLines(
  lords: readonly ClassicalGrahaId[],
  because: (lord: ClassicalGrahaId) => string | null,
): string[] {
  const periods: { lord: ClassicalGrahaId; which: string }[] = []
  if (lords[0] && lords[1] && lords[0] === lords[1]) periods.push({ lord: lords[0], which: 'mahadasha and antardasha' })
  else {
    if (lords[0]) periods.push({ lord: lords[0], which: 'mahadasha' })
    if (lords[1]) periods.push({ lord: lords[1], which: 'antardasha' })
  }
  return periods.flatMap((period) => {
    const reason = because(period.lord)
    if (!reason) return []
    const verb = period.which.includes(' and ') ? 'are' : 'is'
    return [`The ${period.which} of ${GRAHA_NAMES[period.lord]} ${verb} running. ${reason}.`]
  })
}

function exchangeLord(
  pairs: readonly { a: HouseNumber; b: HouseNumber }[],
  lagna: Rashi,
  lord: ClassicalGrahaId,
): boolean {
  return pairs.some((pair) => signLord(rashiForHouseFromLagna(lagna, pair.a)) === lord || signLord(rashiForHouseFromLagna(lagna, pair.b)) === lord)
}

function strengthPhrase(planet: NadiYogaPlacement | null, lagna: Rashi): string | null {
  if (!planet || dusthanaHouse(planet, lagna)) return null
  const dignity = dignityOf(planet)
  if (dignity === 'exalted') return 'is exalted'
  if (dignity === 'own') return 'is in its own sign'
  if (dignity === 'moolatrikona') return 'is in moolatrikona'
  return null
}

function colorScore(planet: NadiYogaPlacement, lagna: Rashi): number {
  if (dusthanaHouse(planet, lagna)) return 4
  const dignity = dignityOf(planet)
  if (dignity === 'exalted') return 4
  if (dignity === 'own' || dignity === 'moolatrikona') return 3
  return 0
}

function dusthanaHouse(planet: NadiYogaPlacement, lagna: Rashi): HouseNumber | null {
  if (pole(planet) !== 'debilitated') return null
  const house = wholeSignHouseFromLagna(lagna, planet.rashi)
  return house === 6 || house === 8 || house === 12 ? house : null
}

function pole(planet: NadiYogaPlacement): 'exalted' | 'debilitated' | null {
  const dignity = dignityOf(planet)
  return dignity === 'exalted' || dignity === 'debilitated' ? dignity : null
}

function dignityOf(planet: NadiYogaPlacement): string {
  if (planet.dignity) return planet.dignity
  if (planet.id === 'Ra' || planet.id === 'Ke') return 'neutral'
  return getDignity(planet.id, planet.rashi, planet.degree ?? 15)
}

function houseOf(
  grahas: readonly NadiYogaPlacement[],
  lagna: Rashi,
  id: ClassicalGrahaId,
): HouseNumber | null {
  const planet = placed(grahas, id)
  return planet ? wholeSignHouseFromLagna(lagna, planet.rashi) : null
}

function placed(grahas: readonly NadiYogaPlacement[], id: ClassicalGrahaId): NadiYogaPlacement | null {
  return grahas.find((g) => g.id === id) ?? null
}

function parivartana(asc: Rashi, grahas: readonly NadiYogaPlacement[]): { a: HouseNumber; b: HouseNumber }[] {
  const lordHouse = (house: HouseNumber): HouseNumber | null => {
    const lord = signLord(rashiForHouseFromLagna(asc, house))
    const planet = placed(grahas, lord)
    return planet ? wholeSignHouseFromLagna(asc, planet.rashi) : null
  }
  const pairs: { a: HouseNumber; b: HouseNumber }[] = []
  for (let house = 1; house <= 12; house++) {
    const other = lordHouse(house as HouseNumber)
    if (other == null || other === house || house > other) continue
    if (lordHouse(other) === house) pairs.push({ a: house as HouseNumber, b: other })
  }
  return pairs
}

function signLord(sign: Rashi): ClassicalGrahaId {
  return RASHI_LORDS.find((row) => row.number === sign)?.lord ?? 'Su'
}

function unique(ids: readonly ClassicalGrahaId[]): ClassicalGrahaId[] {
  return ids.filter((id, index) => ids.indexOf(id) === index)
}

function houseLabel(house: HouseNumber): string {
  return house === 1 ? 'lagna' : ordinal(house)
}

function joinNames(names: string[]): string {
  if (names.length <= 1) return names[0] ?? ''
  if (names.length === 2) return `${names[0]} and ${names[1]}`
  return `${names.slice(0, -1).join(', ')}, and ${names[names.length - 1]}`
}

function joinParts(parts: string[]): string {
  if (parts.length <= 1) return parts[0] ?? ''
  if (parts.length === 2) return `${parts[0]} and ${parts[1]}`
  return `${parts.slice(0, -1).join(', ')}, and ${parts[parts.length - 1]}`
}

function ordinal(n: number): string {
  const teen = n % 100
  if (teen >= 11 && teen <= 13) return `${n}th`
  const last = n % 10
  if (last === 1) return `${n}st`
  if (last === 2) return `${n}nd`
  if (last === 3) return `${n}rd`
  return `${n}th`
}
