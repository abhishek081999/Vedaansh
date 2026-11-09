// ─────────────────────────────────────────────────────────────
//  src/lib/engine/nadi/dusthana.ts
//  In the 6th, 8th, or 12th, exaltation is read as debilitation
//  and debilitation as exaltation. Rahu and Ketu take the
//  dispositor’s dignity. An exchange or a crowd of three still stands.
// ─────────────────────────────────────────────────────────────

import type { Rashi } from '@/types/astrology'
import { GRAHA_NAMES } from '@/types/astrology'
import { nG, nLang, nOrd, nSay, type EngineLang } from '@/lib/engine/nadi/text'
import { getDignity } from '@/lib/engine/dignity'
import {
  RASHI_LORDS,
  wholeSignHouseFromLagna,
  type ClassicalGrahaId,
  type HouseNumber,
} from '@/lib/engine/houseInterpretations'
import { rashiForHouseFromLagna } from '@/lib/engine/rashiInterpretations'
import type { NadiYogaPlacement } from '@/lib/engine/nadi/yogas'

export const NADI_DUSTHANA_NOTE =
  'A planet exalted in the 6th, 8th, or 12th is read as debilitated. A planet debilitated there is read as exalted. Rahu and Ketu take this from the dispositor (ruler of the sign it sits in). An exchange, or a conjunction of three or more, still stands.'

export const NADI_DUSTHANA_NOTE_HI =
  'छठे, आठवें या बारहवें भाव में उच्च का ग्रह नीच की तरह पढ़ा जाता है। वहाँ नीच का ग्रह उच्च की तरह पढ़ा जाता है। राहु और केतु यह फल अपने राशि-स्वामी (जिस राशि में बैठे हैं उसका स्वामी) से लेते हैं। परिवर्तन योग, या तीन या अधिक ग्रहों की युति, फिर भी टिकी रहती है।'

const DIG_HI = { exalted: 'उच्च', debilitated: 'नीच' } as const

const DUSTHANA = new Set<HouseNumber>([6, 8, 12])
const CLASSICAL: readonly ClassicalGrahaId[] = ['Su', 'Mo', 'Ma', 'Me', 'Ju', 'Ve', 'Sa']

export function dusthanaReversalNotes(input: {
  ascRashi: Rashi
  grahas: readonly NadiYogaPlacement[]
  parivartana?: readonly { a: HouseNumber; b: HouseNumber }[]
  lang?: EngineLang
}): string[] {
  const L = nLang(input.lang)
  const lines: string[] = []
  const exchanging = new Set<ClassicalGrahaId>()
  for (const pair of input.parivartana ?? []) {
    exchanging.add(signLord(rashiForHouseFromLagna(input.ascRashi, pair.a)))
    exchanging.add(signLord(rashiForHouseFromLagna(input.ascRashi, pair.b)))
  }

  for (const id of CLASSICAL) {
    const planet = input.grahas.find((g) => g.id === id)
    if (!planet) continue
    const house = wholeSignHouseFromLagna(input.ascRashi, planet.rashi)
    if (!DUSTHANA.has(house)) continue
    const dignity = pole(planet)
    if (!dignity) continue
    if (id === 'Ve' && house === 12 && dignity === 'debilitated') {
      lines.push(nSay(L, 'Venus is debilitated in the 12th. That debilitation stays. The 12th does not turn it into exaltation. The placement is still read as auspicious.', 'शुक्र बारहवें भाव में नीच है। यह नीचता बनी रहती है। बारहवाँ भाव इसे उच्च में नहीं बदलता। फिर भी यह स्थिति शुभ पढ़ी जाती है।'))
      continue
    }
    const reversed = dignity === 'exalted' ? 'debilitated' : 'exalted'
    let line = nSay(L,
      `${GRAHA_NAMES[id]} is ${dignity} in the ${ordinal(house)}. In the 6th, 8th, or 12th that is read as ${reversed}.`,
      `${nG(id, L)} ${nOrd(house, L)} भाव में ${DIG_HI[dignity]} है। छठे, आठवें या बारहवें भाव में यह ${DIG_HI[reversed]} पढ़ा जाता है।`)
    line += stillStands(id, planet.rashi, exchanging, input.grahas, L)
    lines.push(line)
  }

  for (const id of ['Ra', 'Ke'] as const) {
    const planet = input.grahas.find((g) => g.id === id)
    if (!planet) continue
    const house = wholeSignHouseFromLagna(input.ascRashi, planet.rashi)
    if (!DUSTHANA.has(house)) continue
    const lord = signLord(planet.rashi)
    const host = input.grahas.find((g) => g.id === lord)
    if (!host) continue
    const dignity = pole(host)
    if (!dignity) continue
    const reversed = dignity === 'exalted' ? 'debilitated' : 'exalted'
    let line = nSay(L,
      `${GRAHA_NAMES[id]}’s dispositor ${GRAHA_NAMES[lord]} is ${dignity}, and ${GRAHA_NAMES[id]} sits in the ${ordinal(house)}. ${GRAHA_NAMES[id]} is read as ${reversed}.`,
      `${nG(id, L)} का राशि-स्वामी ${nG(lord, L)} ${DIG_HI[dignity]} है, और ${nG(id, L)} ${nOrd(house, L)} भाव में है। ${nG(id, L)} ${DIG_HI[reversed]} पढ़ा जाता है।`)
    line += stillStands(id, planet.rashi, exchanging, input.grahas, L)
    lines.push(line)
  }
  return lines
}

function stillStands(
  id: ClassicalGrahaId,
  rashi: Rashi,
  exchanging: ReadonlySet<ClassicalGrahaId>,
  grahas: readonly NadiYogaPlacement[],
  L: EngineLang,
): string {
  const bits: string[] = []
  if (exchanging.has(id)) bits.push(nSay(L, 'The exchange still stands.', 'परिवर्तन योग फिर भी टिका रहता है।'))
  const crowd = grahas.filter((g) => g.rashi === rashi).length >= 3
  if (crowd) bits.push(nSay(L, 'The conjunction still stands.', 'युति फिर भी टिकी रहती है।'))
  return bits.length ? ` ${bits.join(' ')}` : ''
}

function pole(planet: NadiYogaPlacement): 'exalted' | 'debilitated' | null {
  if (planet.dignity === 'exalted' || planet.dignity === 'debilitated') return planet.dignity
  const dignity = getDignity(planet.id, planet.rashi, planet.degree ?? 15)
  return dignity === 'exalted' || dignity === 'debilitated' ? dignity : null
}

function signLord(sign: Rashi): ClassicalGrahaId {
  return RASHI_LORDS.find((row) => row.number === sign)?.lord ?? 'Su'
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
