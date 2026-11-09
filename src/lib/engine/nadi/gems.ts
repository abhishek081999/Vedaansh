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
import type { EngineLang } from '@/lib/engine/lang'
import { NADI_GEM_HI, NADI_GEM_NOTE_HI, NADI_GEM_STONE_HI } from '@/lib/engine/locale/nadiGems.hi'
import { nG, nJoin, nLang, nOrd, nSay } from '@/lib/engine/nadi/text'

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

export function gemReference(lang: EngineLang = 'en'): NadiGemRow[] {
  return (Object.keys(GEMS) as ClassicalGrahaId[]).map((id) => {
    const row = GEMS[id]
    const hi = NADI_GEM_STONE_HI[id]
    const substitute = row.substitute ? `, or ${row.substitute.toLowerCase()},` : ''
    const en = `${row.stone}${substitute} in ${row.metal.toLowerCase()}, ${row.finger.toLowerCase()}, ${row.day}.`
    const hiLine = hi.substitute
      ? `${hi.stone}, या ${hi.substitute}, ${hi.metal} में, ${hi.finger}, ${hi.day}।`
      : `${hi.stone}, ${hi.metal} में, ${hi.finger}, ${hi.day}।`
    return {
      planet: nG(id, lang),
      line: nSay(lang, en, hiLine),
    }
  })
}

export interface GemInput {
  ascRashi: Rashi
  grahas: readonly { id: ClassicalGrahaId; rashi: Rashi; degree?: number; dignity?: string }[]
  dashaLords?: readonly ClassicalGrahaId[]
  lang?: EngineLang
}

export function gemstoneNotes(input: GemInput): string[] {
  const lang = nLang(input.lang)
  const H = NADI_GEM_HI
  const lines: string[] = []
  const usable = new Set<ClassicalGrahaId>()
  const stoneOf = (id: ClassicalGrahaId) => nSay(lang, GEMS[id].stone, NADI_GEM_STONE_HI[id].stone)
  for (const id of CLASSICAL) {
    const planet = input.grahas.find((g) => g.id === id)
    if (!planet) continue
    const name = nG(id, lang)
    const stone = stoneOf(id)
    const place = standing(planet)
    if (place === 'debilitated') {
      const lord = signLord(planet.rashi)
      const host = input.grahas.find((g) => g.id === lord)
      const hostName = nG(lord, lang)
      const hostStone = stoneOf(lord)
      let line = nSay(lang, `${GRAHA_NAMES[id]} is debilitated. ${GEMS[id].stone} is not the stone.`, `${name} नीच है। ${stone} रत्न नहीं है।`)
      if (ruled(input.ascRashi, id).includes(1)) line += nSay(lang, ' The lagna lord’s own stone stays off.', H.lagnaOff)
      if (host && standing(host) === 'strong' && !isAfflicted(host, input.grahas) && !pureDusthana(input.ascRashi, lord)) {
        line += nSay(lang, ` ${GEMS[lord].stone}, the stone of ${GRAHA_NAMES[lord]}, is the one read here, worn lifelong.`, ` ${hostStone}, ${hostName} का रत्न, यहाँ पढ़ा जाता है, आजीवन पहना जाए।`)
        if (input.dashaLords?.includes(lord)) line += nSay(lang, ` ${GRAHA_NAMES[lord]}’s period is running, which supports beginning it.`, ` ${hostName} की दशा चल रही है, जो इसे आरंभ करने में साथ देती है।`)
        usable.add(lord)
      } else if (host && isAfflicted(host, input.grahas)) {
        line += nSay(lang, ` ${GRAHA_NAMES[lord]} is afflicted, so its stone is not read as the substitute.`, ` ${hostName} पीड़ित है, इसलिए उसका रत्न विकल्प नहीं पढ़ा जाता।`)
      } else {
        line += nSay(lang, ` ${GRAHA_NAMES[lord]} is not strong enough to carry a substitute.`, ` ${hostName} विकल्प ढोने जितना बलवान नहीं है।`)
      }
      lines.push(line)
      continue
    }
    if (place !== 'strong') continue
    if (pureDusthana(input.ascRashi, id)) {
      const houses = houseList(dusthanaHouses(input.ascRashi, id), lang)
      lines.push(nSay(
        lang,
        `${GRAHA_NAMES[id]} is strong, and it rules ${houseList(dusthanaHouses(input.ascRashi, id), 'en')}. ${GEMS[id].stone} is not the stone to wear.`,
        `${name} बलवान है, और ${houses} का स्वामी है। ${stone} पहनने का रत्न नहीं है।`,
      ))
      continue
    }
    const rules = ruled(input.ascRashi, id)
    let line = rules.includes(1)
      ? nSay(lang, `${GRAHA_NAMES[id]} rules the lagna and the sign is strong. ${GEMS[id].stone} is read as usable, worn lifelong.`, `${name} लग्न का स्वामी है और राशि बलवान है। ${stone} उपयोगी पढ़ा जाता है, आजीवन पहना जाए।`)
      : nSay(lang, `${GRAHA_NAMES[id]} is strong. ${GEMS[id].stone} is read as usable, worn lifelong.`, `${name} बलवान है। ${stone} उपयोगी पढ़ा जाता है, आजीवन पहना जाए।`)
    const stirred = rules.filter((house) => house === 6 || house === 8 || house === 12)
    if (stirred.length > 0) {
      line += nSay(
        lang,
        ` It also rules ${houseList(stirred, 'en')}, so that house is stirred with it.`,
        ` यह ${houseList(stirred, 'hi')} का भी स्वामी है, इसलिए वह भाव भी साथ हिलता है।`,
      )
    }
    if (input.dashaLords?.includes(id)) line += nSay(lang, ` ${GRAHA_NAMES[id]}’s period is running, which supports beginning it.`, ` ${name} की दशा चल रही है, जो इसे आरंभ करने में साथ देती है।`)
    usable.add(id)
    lines.push(line)
  }
  for (const id of ['Ra', 'Ke'] as const) {
    const planet = input.grahas.find((g) => g.id === id)
    if (!planet) continue
    const lord = signLord(planet.rashi)
    const host = input.grahas.find((g) => g.id === lord)
    const name = nG(id, lang)
    const hostName = nG(lord, lang)
    const stone = stoneOf(id)
    if (!host || standing(host) !== 'strong') {
      lines.push(nSay(lang, `${GRAHA_NAMES[id]}’s dispositor ${GRAHA_NAMES[lord]} is not strong enough. ${GEMS[id].stone} is not the stone.`, `${name} का राशिस्वामी ${hostName} पर्याप्त बलवान नहीं है। ${stone} रत्न नहीं है।`))
    } else if (isAfflicted(host, input.grahas)) {
      lines.push(nSay(lang, `${GRAHA_NAMES[id]}’s dispositor ${GRAHA_NAMES[lord]} is afflicted. ${GEMS[id].stone} is not the stone.`, `${name} का राशिस्वामी ${hostName} पीड़ित है। ${stone} रत्न नहीं है।`))
    } else {
      let line = nSay(lang, `${GRAHA_NAMES[id]}’s dispositor ${GRAHA_NAMES[lord]} is strong. ${GEMS[id].stone} is read as usable.`, `${name} का राशिस्वामी ${hostName} बलवान है। ${stone} उपयोगी पढ़ा जाता है।`)
      line += input.dashaLords?.includes(id)
        ? nSay(lang, ` ${GRAHA_NAMES[id]}’s period is running, which is the time this stone is read.`, ` ${name} की दशा चल रही है, यही समय इस रत्न का है।`)
        : nSay(lang, ` It is read more clearly while ${GRAHA_NAMES[id]}’s period is running.`, ` ${name} की दशा चलते यह अधिक स्पष्ट पढ़ा जाता है।`)
      lines.push(line)
    }
  }
  const maha = input.dashaLords?.[0]
  if (maha && pureDusthana(input.ascRashi, maha) && !usable.has(maha)) {
    lines.push(nSay(
      lang,
      `${GRAHA_NAMES[maha]}’s period is running, and it rules ${houseList(dusthanaHouses(input.ascRashi, maha), 'en')}. This is not the time to begin a stone.`,
      `${nG(maha, lang)} की दशा चल रही है, और यह ${houseList(dusthanaHouses(input.ascRashi, maha), lang)} का स्वामी है। रत्न आरंभ करने का समय नहीं है।`,
    ))
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

function houseList(houses: readonly HouseNumber[], lang: EngineLang): string {
  const names = houses.map((house) => (lang === 'hi' ? `${nOrd(house, 'hi')} भाव` : `the ${nOrd(house, 'en')}`))
  return nJoin(names, lang)
}
