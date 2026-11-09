// ─────────────────────────────────────────────────────────────
//  src/lib/engine/nadi/placements.ts
//  A planet is read from the house it occupies, the houses it
//  rules, and the sign it sits in. The sign brings its own
//  natural house. Whole sign. Teaching associations.
// ─────────────────────────────────────────────────────────────

import type { Rashi } from '@/types/astrology'
import { GRAHA_NAMES, RASHI_NAMES } from '@/types/astrology'
import { getDignity } from '@/lib/engine/dignity'
import {
  RASHI_LORDS,
  wholeSignHouseFromLagna,
  type ClassicalGrahaId,
  type HouseNumber,
} from '@/lib/engine/houseInterpretations'
import { rashiForHouseFromLagna } from '@/lib/engine/rashiInterpretations'
import {
  getPlanetInHouseClassicalSummary,
  getPlanetInSignClassicalSummary,
} from '@/lib/engine/classicalInterpretations'
import { NADI_GRAHAS, nadiGrahas } from '@/lib/engine/nadi/grahas'
import { NADI_HOUSES, nadiHouses } from '@/lib/engine/nadi/houses'
import {
  classicalNotesInLang,
  getPlanetInHouseClassical,
  getPlanetInSignClassical,
} from '@/lib/engine/classicalInterpretations'
import { nG, nJoin, nLang, nNom, nOrd, nR, nSay, type EngineLang } from '@/lib/engine/nadi/text'

export const NADI_PLACEMENT_NOTE =
  'A planet is read from the house it occupies, then from the houses it rules, then from its sign. The sign brings the nature of its own natural house. Rahu and Ketu rule no sign: they act like the lord of the sign they occupy.'

export const NADI_PLACEMENT_NOTE_HI =
  'ग्रह पहले उस भाव से पढ़ा जाता है जिसमें वह बैठा है, फिर उन भावों से जिनका वह स्वामी है, फिर अपनी राशि से। राशि अपने नैसर्गिक भाव का स्वभाव साथ लाती है। राहु और केतु किसी राशि के स्वामी नहीं हैं: वे जिस राशि में बैठे हैं उसके स्वामी की तरह फल देते हैं।'

const ORDER: readonly ClassicalGrahaId[] = ['Su', 'Mo', 'Ma', 'Me', 'Ju', 'Ve', 'Sa', 'Ra', 'Ke']
const HOUSES: readonly HouseNumber[] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
const PAPA = new Set<ClassicalGrahaId>(['Ma', 'Sa', 'Ra', 'Ke'])
const STRONG = new Set(['exalted', 'own', 'moolatrikona'])
const RETRO = new Set<ClassicalGrahaId>(['Ma', 'Me', 'Ju', 'Ve', 'Sa'])

/** Short theme, written so it can sit inside a sentence. */
const CARRY: Record<HouseNumber, string> = {
  1: 'the body',
  2: 'wealth',
  3: 'siblings',
  4: 'the home',
  5: 'children and study',
  6: 'service',
  7: 'marriage',
  8: 'hidden matters',
  9: 'luck',
  10: 'the career',
  11: 'gains',
  12: 'foreign lands',
}

const CARRY_HI: Record<HouseNumber, string> = {
  1: 'शरीर',
  2: 'धन',
  3: 'भाई-बहन',
  4: 'घर',
  5: 'संतान और पढ़ाई',
  6: 'सेवा',
  7: 'विवाह',
  8: 'छिपे विषय',
  9: 'भाग्य',
  10: 'करियर',
  11: 'लाभ',
  12: 'विदेश',
}

export interface NadiPlacementBody {
  id: ClassicalGrahaId
  rashi: Rashi
  dignity?: string
  isRetro?: boolean
  isCombust?: boolean
  degree?: number
}

export interface NadiPlacement {
  id: ClassicalGrahaId
  name: string
  house: HouseNumber
  houseName: string
  sign: Rashi
  signName: string
  naturalHouse: HouseNumber
  naturalHouseName: string
  /** Houses this graha rules from the lagna. Nodes rule none. */
  lordOf: HouseNumber[]
  dignity: string | null
  retro: boolean
  prediction: string
  /** First classical note for this planet in this house. */
  classicalHouse: string | null
  /** First classical note for this planet in this sign. */
  classicalSign: string | null
}

export function readNadiPlacements(input: {
  ascRashi: Rashi
  grahas: readonly NadiPlacementBody[]
  lang?: EngineLang
}): NadiPlacement[] {
  const L = nLang(input.lang)
  const H = nadiHouses(L)
  const placed = new Map(input.grahas.map((g) => [g.id, g]))
  return ORDER.flatMap((id) => {
    const g = placed.get(id)
    if (!g) return []
    const house = wholeSignHouseFromLagna(input.ascRashi, g.rashi)
    const natural = g.rashi as HouseNumber
    const lordOf = housesRuled(input.ascRashi, id)
    const dignity = dignityOf(g)
    const retro = !!g.isRetro && RETRO.has(id)
    const co = input.grahas.filter((other) => other.rashi === g.rashi).map((other) => other.id)
    return [{
      id,
      name: L === 'hi' ? nG(id, L) : GRAHA_NAMES[id],
      house,
      houseName: H[house].name,
      sign: g.rashi,
      signName: L === 'hi' ? nR(g.rashi, L) : RASHI_NAMES[g.rashi],
      naturalHouse: natural,
      naturalHouseName: H[natural].name,
      lordOf,
      dignity,
      retro,
      prediction: L === 'hi'
        ? planetPredictionHi(input, g, house, lordOf, dignity, retro, co)
        : planetPrediction(input, g, house, lordOf, dignity, retro, co),
      classicalHouse: L === 'hi'
        ? classicalNotesInLang(getPlanetInHouseClassical(id, house), 'hi')[0]?.text ?? null
        : getPlanetInHouseClassicalSummary(id, house),
      classicalSign: L === 'hi'
        ? classicalNotesInLang(getPlanetInSignClassical(id, g.rashi), 'hi')[0]?.text ?? null
        : getPlanetInSignClassicalSummary(id, g.rashi),
    }]
  })
}

export function nadiHouseLine(input: {
  ascRashi: Rashi
  house: HouseNumber
  lordHouse: HouseNumber | null
  placements: readonly NadiPlacement[]
  lang?: EngineLang
}): string {
  if (input.lang === 'hi') return nadiHouseLineHi(input)
  const sign = rashiForHouseFromLagna(input.ascRashi, input.house)
  const signName = RASHI_NAMES[sign]
  const natural = sign as HouseNumber
  const lord = RASHI_LORDS.find((row) => row.number === sign)?.lord ?? 'Su'
  const lordName = GRAHA_NAMES[lord]
  const there = input.placements.filter((row) => row.house === input.house)
  const lines: string[] = []

  if (natural === input.house) {
    const theme = CARRY[input.house]
    lines.push(`The ${ordinal(input.house)} is ${signName}, and ${signName} carries the ${ordinal(input.house)} as well, so ${theme} ${be(theme)} read twice.`)
  } else {
    lines.push(`The ${ordinal(input.house)} is ${signName}. ${signName} carries the nature of the ${ordinal(natural)} (${NADI_HOUSES[natural].name}), so ${CARRY[natural]} joins ${CARRY[input.house]}.`)
  }

  if (input.lordHouse == null) {
    lines.push(`Its lord, ${lordName}, is not placed on this chart.`)
  } else if (input.lordHouse === input.house) {
    lines.push(`Its lord, ${lordName}, sits in it, so the ${ordinal(input.house)} is read from itself.`)
  } else {
    lines.push(`Its lord, ${lordName}, sits in the ${ordinal(input.lordHouse)}, so the ${ordinal(input.house)} is read from the ${ordinal(input.lordHouse)}.`)
  }

  if (there.length === 0) {
    lines.push('No planet occupies it.')
  } else {
    const names = join(there.map((row) => row.name))
    const verb = there.length === 1 ? 'occupies' : 'occupy'
    const carried = there.flatMap((row) => {
      const bit = carryBit(row, input.house)
      return bit ? [bit] : []
    })
    lines.push(carried.length > 0 ? `${names} ${verb} it. ${carried.join('. ')}.` : `${names} ${verb} it.`)
  }

  const papas = there.filter((row) => PAPA.has(row.id))
  if (papas.length > 0) {
    const names = join(papas.map((row) => row.name))
    lines.push(`${names} ${papas.length === 1 ? 'is' : 'are'} here, so the living significances of the ${ordinal(input.house)} are under pressure.`)
  }

  return lines.join(' ')
}

// ── Hindi ────────────────────────────────────────────────────
// Separate builders: Hindi word order does not map onto the English joins.

function ordHi(n: number): string {
  return `${nOrd(n, 'hi')} भाव`
}

function isAre(count: number): string {
  return count === 1 ? 'है' : 'हैं'
}

function nadiHouseLineHi(input: {
  ascRashi: Rashi
  house: HouseNumber
  lordHouse: HouseNumber | null
  placements: readonly NadiPlacement[]
}): string {
  const H = nadiHouses('hi')
  const sign = rashiForHouseFromLagna(input.ascRashi, input.house)
  const signName = nR(sign, 'hi')
  const natural = sign as HouseNumber
  const lord = RASHI_LORDS.find((row) => row.number === sign)?.lord ?? 'Su'
  const lordName = nG(lord, 'hi')
  const there = input.placements.filter((row) => row.house === input.house)
  const here = ordHi(input.house)
  const lines: string[] = []

  if (natural === input.house) {
    lines.push(`${here} में ${signName} राशि है, और ${signName} स्वयं भी ${here} का स्वभाव रखती है, इसलिए ${CARRY_HI[input.house]} का विषय दो बार पढ़ा जाता है।`)
  } else {
    lines.push(`${here} में ${signName} राशि है। ${signName} ${ordHi(natural)} (${H[natural].name}) का स्वभाव रखती है, इसलिए ${CARRY_HI[input.house]} में ${CARRY_HI[natural]} का विषय भी जुड़ता है।`)
  }

  if (input.lordHouse == null) {
    lines.push(`इसका स्वामी ${lordName} इस कुंडली में स्थित नहीं है।`)
  } else if (input.lordHouse === input.house) {
    lines.push(`इसका स्वामी ${lordName} इसी भाव में बैठा है, इसलिए ${nNom(input.house)} भाव अपने आप से पढ़ा जाता है।`)
  } else {
    lines.push(`इसका स्वामी ${lordName} ${ordHi(input.lordHouse)} में है, इसलिए ${nNom(input.house)} भाव ${ordHi(input.lordHouse)} से पढ़ा जाता है।`)
  }

  if (there.length === 0) {
    lines.push('इसमें कोई ग्रह नहीं है।')
  } else {
    const names = nJoin(there.map((row) => nG(row.id, 'hi')), 'hi')
    const carried = there.flatMap((row) => {
      const bit = carryBitHi(row, input.house)
      return bit ? [bit] : []
    })
    lines.push(carried.length > 0
      ? `इसमें ${names} ${isAre(there.length)}। ${carried.join('। ')}।`
      : `इसमें ${names} ${isAre(there.length)}।`)
  }

  const papas = there.filter((row) => PAPA.has(row.id))
  if (papas.length > 0) {
    const names = nJoin(papas.map((row) => nG(row.id, 'hi')), 'hi')
    lines.push(`${names} यहाँ ${isAre(papas.length)}, इसलिए ${here} के जीवित कारकत्वों पर दबाव है।`)
  }

  return lines.join(' ')
}

function carryBitHi(row: NadiPlacement, house: HouseNumber): string | null {
  if (row.id === 'Ra') return 'राहु अचानक मोड़ लाता है'
  if (row.id === 'Ke') return 'केतु काट लाता है'
  const extra = row.lordOf.filter((ruled) => ruled !== house)
  if (extra.length === 0) return null
  return `${nG(row.id, 'hi')} ${nJoin(extra.map((ruled) => nOrd(ruled, 'hi')), 'hi')} भाव का विषय साथ लाता है`
}

function themesHi(houses: readonly HouseNumber[]): string {
  return nJoin(houses.map((house) => CARRY_HI[house]), 'hi')
}

function grahaThemesHi(id: ClassicalGrahaId, count: number): string {
  return nJoin(nadiGrahas('hi')[id].significances.slice(0, count), 'hi')
}

function planetPredictionHi(
  input: { ascRashi: Rashi; grahas: readonly NadiPlacementBody[] },
  g: NadiPlacementBody,
  house: HouseNumber,
  lordOf: HouseNumber[],
  dignity: string | null,
  retro: boolean,
  co: ClassicalGrahaId[],
): string {
  const H = nadiHouses('hi')
  const name = nG(g.id, 'hi')
  const signName = nR(g.rashi, 'hi')
  const natural = g.rashi as HouseNumber
  const here = ordHi(house)
  const lines: string[] = [`${name} ${signName} राशि में ${here} (${H[house].name}) में है।`]

  if (g.id === 'Ra' || g.id === 'Ke') {
    const lord = RASHI_LORDS.find((row) => row.number === g.rashi)?.lord
    if (!lord) {
      lines.push(`${name} किसी राशि का स्वामी नहीं है।`)
    } else {
      const manner = g.id === 'Ke' ? 'काट के साथ' : 'अचानक मोड़ के साथ'
      let line = `${name} किसी राशि का स्वामी नहीं है। यह ${signName} के स्वामी ${nG(lord, 'hi')} की तरह फल देता है, इसलिए ${themesHi(housesRuled(input.ascRashi, lord))} का विषय ${manner} पढ़ा जाता है।`
      if (input.grahas.some((other) => other.id === lord && other.rashi === g.rashi)) {
        line += ` ${nG(lord, 'hi')} भी इसके साथ बैठा है, इसलिए यह फल और प्रबल है।`
      }
      lines.push(line)
    }
  } else {
    const extra = lordOf.filter((ruled) => ruled !== house)
    const ownsHere = lordOf.includes(house)
    if (ownsHere && extra.length === 0) {
      lines.push(`यह इसी भाव का स्वामी है, इसलिए ${nNom(house)} भाव अपने आप से पढ़ा जाता है।`)
    } else {
      const ruled = nJoin(lordOf.map((h) => nOrd(h, 'hi')), 'hi')
      const also = ownsHere ? ` यह ${here} का भी स्वामी है।` : ''
      lines.push(`यह ${ruled} भाव का स्वामी है। ${themesHi(extra)} का विषय ${here} से पढ़ा जाता है।${also}`)
    }
  }

  if (natural === house) {
    lines.push(`${signName} भी ${here} का स्वभाव रखती है, इसलिए ${CARRY_HI[house]} का विषय दो बार पढ़ा जाता है।`)
  } else {
    lines.push(`${signName} ${ordHi(natural)} (${H[natural].name}) का स्वभाव रखती है, इसलिए ${CARRY_HI[house]} में ${CARRY_HI[natural]} का विषय भी जुड़ता है।`)
  }

  const note = H[house].occupants[g.id]
  if (note) lines.push(/[।.!?]$/.test(note) ? note : `${note}।`)

  if (g.id !== 'Ra' && g.id !== 'Ke' && dignity) {
    if (STRONG.has(dignity)) {
      const word = dignity === 'own' ? 'अपनी राशि में' : dignity === 'moolatrikona' ? 'मूलत्रिकोण में' : 'उच्च का'
      lines.push(`${name} ${word} है, इसलिए ${grahaThemesHi(g.id, 2)} के फल साफ़ मिलते हैं।`)
    } else if (dignity === 'debilitated') {
      lines.push(`${name} नीच का है, इसलिए ${grahaThemesHi(g.id, 1)} पर दबाव रहता है।`)
    }
  }
  if (retro) lines.push(`${name} वक्री है, इसलिए यह फल देर से मिलता है।`)
  if (g.isCombust) lines.push('अस्त होना दर्ज है। यह करियर या धन के फल को रद्द नहीं करता।')

  const others = ORDER.filter((id) => id !== g.id && co.includes(id))
  const papa = others.filter((id) => PAPA.has(id))
  const rest = others.filter((id) => !PAPA.has(id)).slice(0, 2)
  if (papa.length > 0) {
    lines.push(`${nJoin(papa.map((id) => nG(id, 'hi')), 'hi')} इसके साथ ${isAre(papa.length)}, इसलिए ${here} के जीवित विषयों पर दबाव है।`)
  }
  for (const id of rest) {
    lines.push(`${nG(id, 'hi')} इसके साथ है, इसलिए ${here} में ${grahaThemesHi(id, 1)} का विषय भी जुड़ता है।`)
  }
  return lines.join(' ')
}

/** Display note for the placement method. */
export function nadiPlacementNote(lang?: EngineLang): string {
  return nSay(nLang(lang), NADI_PLACEMENT_NOTE, NADI_PLACEMENT_NOTE_HI)
}

function planetPrediction(
  input: { ascRashi: Rashi; grahas: readonly NadiPlacementBody[] },
  g: NadiPlacementBody,
  house: HouseNumber,
  lordOf: HouseNumber[],
  dignity: string | null,
  retro: boolean,
  co: ClassicalGrahaId[],
): string {
  const name = GRAHA_NAMES[g.id]
  const signName = RASHI_NAMES[g.rashi]
  const natural = g.rashi as HouseNumber
  const lines = [
    `${name} sits in ${signName} in the ${ordinal(house)} (${NADI_HOUSES[house].name}).`,
    g.id === 'Ra' || g.id === 'Ke'
      ? nodeSentence(input, g)
      : lordSentence(house, lordOf),
    signSentence(signName, natural, house),
  ]
  const note = NADI_HOUSES[house].occupants[g.id]
  if (note) lines.push(finish(note))
  const dignityLine = dignitySentence(g.id, name, dignity)
  if (dignityLine) lines.push(dignityLine)
  if (retro) lines.push(`${name} is retrograde, so this result is late.`)
  if (g.isCombust) lines.push('Combustion is recorded. It does not cancel the career or wealth result.')
  lines.push(...companionSentences(g.id, house, co))
  return lines.join(' ')
}

function nodeSentence(
  input: { ascRashi: Rashi; grahas: readonly NadiPlacementBody[] },
  g: NadiPlacementBody,
): string {
  const lord = RASHI_LORDS.find((row) => row.number === g.rashi)?.lord
  if (!lord) return `${GRAHA_NAMES[g.id]} rules no sign.`
  const themes = joinThemes(housesRuled(input.ascRashi, lord))
  const manner = g.id === 'Ke' ? 'with a cut' : 'with a sudden turn'
  let line = `${GRAHA_NAMES[g.id]} rules no sign. It acts like ${GRAHA_NAMES[lord]}, lord of ${RASHI_NAMES[g.rashi]}, so ${themes} ${be(themes)} read ${manner}.`
  if (input.grahas.some((other) => other.id === lord && other.rashi === g.rashi)) {
    line += ` ${GRAHA_NAMES[lord]} sits with it, so that reading is stronger.`
  }
  return line
}

function lordSentence(house: HouseNumber, lordOf: HouseNumber[]): string {
  const extra = lordOf.filter((ruled) => ruled !== house)
  const ownsHere = lordOf.includes(house)
  const ruled = join(lordOf.map((h) => `the ${ordinal(h)}`))
  if (ownsHere && extra.length === 0) {
    return `It rules this house, so the ${ordinal(house)} is read from itself.`
  }
  const themes = joinThemes(extra)
  const here = ownsHere ? ` It is also the lord of the ${ordinal(house)}.` : ''
  return `It rules ${ruled}. ${cap(themes)} ${be(themes)} read from the ${ordinal(house)}.${here}`
}

function signSentence(signName: string, natural: HouseNumber, house: HouseNumber): string {
  if (natural === house) {
    const theme = CARRY[house]
    return `${signName} carries the ${ordinal(house)} as well, so ${theme} ${be(theme)} read twice.`
  }
  const brought = CARRY[natural]
  return `${signName} carries the nature of the ${ordinal(natural)} (${NADI_HOUSES[natural].name}), so ${brought} ${plural(brought) ? 'join' : 'joins'} ${CARRY[house]}.`
}

function carryBit(row: NadiPlacement, house: HouseNumber): string | null {
  if (row.id === 'Ra') return 'Rahu brings a sudden turn'
  if (row.id === 'Ke') return 'Ketu brings a cut'
  const extra = row.lordOf.filter((ruled) => ruled !== house)
  if (extra.length === 0) return null
  return `${row.name} carries ${join(extra.map((ruled) => `the ${ordinal(ruled)}`))}`
}

function dignitySentence(id: ClassicalGrahaId, name: string, dignity: string | null): string | null {
  if (id === 'Ra' || id === 'Ke' || !dignity) return null
  if (STRONG.has(dignity)) {
    const word = dignity === 'own' ? 'in its own sign' : dignity === 'moolatrikona' ? 'in moolatrikona' : 'exalted'
    return `${name} is ${word}, so ${themesOf(id, 2)} arrive cleanly.`
  }
  if (dignity === 'debilitated') {
    const text = themesOf(id, 1)
    return `${name} is debilitated, so ${text} ${be(text)} strained.`
  }
  return null
}

function companionSentences(self: ClassicalGrahaId, house: HouseNumber, co: readonly ClassicalGrahaId[]): string[] {
  const others = ORDER.filter((id) => id !== self && co.includes(id))
  const papa = others.filter((id) => PAPA.has(id))
  const rest = others.filter((id) => !PAPA.has(id)).slice(0, 2)
  const lines: string[] = []
  if (papa.length > 0) {
    const names = join(papa.map((id) => GRAHA_NAMES[id]))
    lines.push(`${names} ${papa.length === 1 ? 'sits' : 'sit'} with it, so the living themes of the ${ordinal(house)} are under pressure.`)
  }
  for (const id of rest) {
    const text = themesOf(id, 1)
    lines.push(`${GRAHA_NAMES[id]} sits with it, so ${text} ${plural(text) ? 'join' : 'joins'} the ${ordinal(house)}.`)
  }
  return lines
}

function housesRuled(asc: Rashi, id: ClassicalGrahaId): HouseNumber[] {
  if (id === 'Ra' || id === 'Ke') return []
  return HOUSES.filter((house) => {
    const sign = rashiForHouseFromLagna(asc, house)
    return RASHI_LORDS.find((row) => row.number === sign)?.lord === id
  })
}

function dignityOf(g: NadiPlacementBody): string | null {
  if (g.dignity) return g.dignity
  if (g.id === 'Ra' || g.id === 'Ke') return null
  return getDignity(g.id, g.rashi, g.degree ?? 15)
}

function themesOf(id: ClassicalGrahaId, count: number): string {
  return join(NADI_GRAHAS[id].significances.slice(0, count).map((item) => item.charAt(0).toLowerCase() + item.slice(1)))
}

function joinThemes(houses: readonly HouseNumber[]): string {
  return join(houses.map((house) => CARRY[house]))
}

function plural(theme: string): boolean {
  return /\band\b|\b(gains|siblings|matters|lands)\b/.test(theme)
}

function be(theme: string): 'is' | 'are' {
  return plural(theme) ? 'are' : 'is'
}

function join(parts: readonly string[]): string {
  if (parts.length <= 1) return parts[0] ?? ''
  if (parts.length === 2) {
    const glue = parts.some((part) => part.includes(' and ')) ? ', and ' : ' and '
    return `${parts[0]}${glue}${parts[1]}`
  }
  return `${parts.slice(0, -1).join(', ')}, and ${parts[parts.length - 1]}`
}

function cap(text: string): string {
  return text ? text.charAt(0).toUpperCase() + text.slice(1) : text
}

function finish(text: string): string {
  return /[.!?]$/.test(text) ? text : `${text}.`
}

function ordinal(n: number): string {
  const mod = n % 10
  if (mod === 1 && n !== 11) return `${n}st`
  if (mod === 2 && n !== 12) return `${n}nd`
  if (mod === 3 && n !== 13) return `${n}rd`
  return `${n}th`
}
