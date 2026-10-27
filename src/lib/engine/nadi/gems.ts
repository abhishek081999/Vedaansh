// ─────────────────────────────────────────────────────────────
//  src/lib/engine/nadi/gems.ts
//  Gemstones increase a planet. They do not repair a weak one.
//  A debilitated planet takes the stone of its sign lord, and
//  only when that lord is strong and unafflicted.
// ─────────────────────────────────────────────────────────────

import { GRAHA_NAMES, type Rashi } from '@/types/astrology'
import { getDignity, NATURAL_FRIENDS } from '@/lib/engine/dignity'
import {
  RASHI_LORDS,
  type ClassicalGrahaId,
  type HouseNumber,
} from '@/lib/engine/houseInterpretations'
import { rashiForHouseFromLagna } from '@/lib/engine/rashiInterpretations'
import { nadiAfflictedBy } from '@/lib/engine/nadi/grahas'

export const NADI_GEM_NOTE =
  'A gemstone increases a planet. It does not repair a weak one. Quality weighs more than size. Wear it as a ring that touches the skin. Begin it in that planet’s period, or while its transit is in its own, exalted, or friendly sign. An aspect does not change the stone. Combustion does not by itself take a stone off a planet that is otherwise strong.'

const GEMS: Record<ClassicalGrahaId, { stone: string; substitute: string; metal: string; finger: string; day: string }> = {
  Su: { stone: 'Ruby', substitute: '', metal: 'Yellow gold', finger: 'Ring finger', day: 'Sunday' },
  Mo: { stone: 'Pearl', substitute: '', metal: 'White gold, silver, or platinum', finger: 'Middle or little finger', day: 'Monday' },
  Ma: { stone: 'Red coral', substitute: '', metal: 'Yellow gold', finger: 'Middle or ring finger', day: 'Tuesday' },
  Me: { stone: 'Emerald', substitute: 'Peridot', metal: 'Yellow gold', finger: 'Little finger', day: 'Wednesday' },
  Ju: { stone: 'Yellow sapphire', substitute: 'Yellow topaz', metal: 'Yellow gold', finger: 'Index or ring finger', day: 'Thursday' },
  Ve: { stone: 'Diamond', substitute: 'White opal', metal: 'White gold, platinum, or silver', finger: 'Index or ring finger', day: 'Friday' },
  Sa: { stone: 'Blue sapphire', substitute: 'Amethyst', metal: 'White gold, platinum, or silver', finger: 'Middle or little finger', day: 'Saturday' },
  Ra: { stone: 'Hessonite', substitute: '', metal: 'White gold, platinum, or silver', finger: 'Middle finger', day: 'Saturday' },
  Ke: { stone: 'Cat’s eye', substitute: '', metal: 'Yellow gold', finger: 'Ring finger', day: 'Tuesday' },
}

const CLASSICAL: readonly ClassicalGrahaId[] = ['Su', 'Mo', 'Ma', 'Me', 'Ju', 'Ve', 'Sa']
const GOOD = new Set(['exalted', 'own', 'moolatrikona', 'great_friend', 'friend'])

export interface NadiGemRow {
  planet: string
  line: string
}

export function gemReference(): NadiGemRow[] {
  return (Object.keys(GEMS) as ClassicalGrahaId[]).map((id) => {
    const row = GEMS[id]
    const substitute = row.substitute ? `, or ${row.substitute.toLowerCase()},` : ''
    return {
      planet: GRAHA_NAMES[id],
      line: `${row.stone}${substitute} in ${row.metal.toLowerCase()}, ${row.finger.toLowerCase()}, ${row.day}.`,
    }
  })
}

export interface GemInput {
  ascRashi: Rashi
  grahas: readonly { id: ClassicalGrahaId; rashi: Rashi; degree?: number; dignity?: string }[]
  dashaLords?: readonly ClassicalGrahaId[]
}

export function gemstoneNotes(input: GemInput): string[] {
  const lines: string[] = []
  const usable = new Set<ClassicalGrahaId>()
  for (const id of CLASSICAL) {
    const planet = input.grahas.find((g) => g.id === id)
    if (!planet) continue
    const name = GRAHA_NAMES[id]
    const stone = GEMS[id].stone
    const place = standing(planet)
    if (place === 'debilitated') {
      const lord = signLord(planet.rashi)
      const host = input.grahas.find((g) => g.id === lord)
      const hostName = GRAHA_NAMES[lord]
      let line = `${name} is debilitated. ${stone} is not the stone.`
      if (ruled(input.ascRashi, id).includes(1)) line += ' The lagna lord’s own stone stays off.'
      if (host && standing(host) === 'strong' && !isAfflicted(host, input.grahas) && !pureDusthana(input.ascRashi, lord)) {
        line += ` ${GEMS[lord].stone}, the stone of ${hostName}, is the one read here, worn lifelong.`
        if (input.dashaLords?.includes(lord)) line += ` ${hostName}’s period is running, which supports beginning it.`
        usable.add(lord)
      } else if (host && isAfflicted(host, input.grahas)) {
        line += ` ${hostName} is afflicted, so its stone is not read as the substitute.`
      } else {
        line += ` ${hostName} is not strong enough to carry a substitute.`
      }
      lines.push(line)
      continue
    }
    if (place !== 'strong') continue
    if (pureDusthana(input.ascRashi, id)) {
      lines.push(`${name} is strong, and it rules ${houseList(dusthanaHouses(input.ascRashi, id))}. ${stone} is not the stone to wear.`)
      continue
    }
    const rules = ruled(input.ascRashi, id)
    let line = rules.includes(1)
      ? `${name} rules the lagna and the sign is strong. ${stone} is read as usable, worn lifelong.`
      : `${name} is strong. ${stone} is read as usable, worn lifelong.`
    const stirred = rules.filter((house) => house === 6 || house === 8 || house === 12)
    if (stirred.length > 0) line += ` It also rules ${houseList(stirred)}, so that house is stirred with it.`
    if (input.dashaLords?.includes(id)) line += ` ${name}’s period is running, which supports beginning it.`
    usable.add(id)
    lines.push(line)
  }
  for (const id of ['Ra', 'Ke'] as const) {
    const planet = input.grahas.find((g) => g.id === id)
    if (!planet) continue
    const lord = signLord(planet.rashi)
    const host = input.grahas.find((g) => g.id === lord)
    const name = GRAHA_NAMES[id]
    const hostName = GRAHA_NAMES[lord]
    const stone = GEMS[id].stone
    if (!host || standing(host) !== 'strong') {
      lines.push(`${name}’s dispositor ${hostName} is not strong enough. ${stone} is not the stone.`)
    } else if (isAfflicted(host, input.grahas)) {
      lines.push(`${name}’s dispositor ${hostName} is afflicted. ${stone} is not the stone.`)
    } else {
      let line = `${name}’s dispositor ${hostName} is strong. ${stone} is read as usable.`
      line += input.dashaLords?.includes(id)
        ? ` ${name}’s period is running, which is the time this stone is read.`
        : ` It is read more clearly while ${name}’s period is running.`
      lines.push(line)
    }
  }
  const maha = input.dashaLords?.[0]
  if (maha && pureDusthana(input.ascRashi, maha) && !usable.has(maha)) {
    lines.push(`${GRAHA_NAMES[maha]}’s period is running, and it rules ${houseList(dusthanaHouses(input.ascRashi, maha))}. This is not the time to begin a stone.`)
  }
  return lines
}

type Standing = 'strong' | 'debilitated' | 'plain'

function standing(
  planet: { id: ClassicalGrahaId; rashi: Rashi; degree?: number; dignity?: string },
): Standing {
  const stated = planet.dignity
  if (stated === 'debilitated') return 'debilitated'
  if (stated && GOOD.has(stated)) return 'strong'
  if (stated === 'enemy') return 'plain'
  const computed = getDignity(planet.id, planet.rashi, planet.degree ?? 15)
  if (computed === 'debilitated') return 'debilitated'
  if (GOOD.has(computed)) return 'strong'
  const lord = signLord(planet.rashi)
  if ((NATURAL_FRIENDS[planet.id] ?? []).includes(lord)) return 'strong'
  return 'plain'
}

function isAfflicted(planet: { id: ClassicalGrahaId; rashi: Rashi }, grahas: GemInput['grahas']): boolean {
  const co = grahas.filter((g) => g.rashi === planet.rashi).map((g) => g.id)
  return nadiAfflictedBy(planet.id, co).length > 0
}

function ruled(asc: Rashi, id: ClassicalGrahaId): HouseNumber[] {
  const houses: HouseNumber[] = []
  for (let house = 1; house <= 12; house += 1) {
    if (signLord(rashiForHouseFromLagna(asc, house as HouseNumber)) === id) houses.push(house as HouseNumber)
  }
  return houses
}

function dusthanaHouses(asc: Rashi, id: ClassicalGrahaId): HouseNumber[] {
  return ruled(asc, id).filter((house) => house === 6 || house === 8 || house === 12)
}

function pureDusthana(asc: Rashi, id: ClassicalGrahaId): boolean {
  const houses = ruled(asc, id)
  const bad = houses.some((house) => house === 6 || house === 8 || house === 12)
  const lift = houses.some((house) => house === 1 || house === 5 || house === 9)
  return bad && !lift
}

function signLord(sign: Rashi): ClassicalGrahaId {
  return RASHI_LORDS.find((row) => row.number === sign)?.lord ?? 'Su'
}

function houseList(houses: readonly HouseNumber[]): string {
  const names = houses.map((house) => `the ${ordinal(house)}`)
  if (names.length <= 1) return names[0] ?? ''
  if (names.length === 2) return `${names[0]} and ${names[1]}`
  return `${names.slice(0, -1).join(', ')}, and ${names[names.length - 1]}`
}

function ordinal(n: number): string {
  const mod = n % 10
  if (mod === 1 && n !== 11) return `${n}st`
  if (mod === 2 && n !== 12) return `${n}nd`
  if (mod === 3 && n !== 13) return `${n}rd`
  return `${n}th`
}
