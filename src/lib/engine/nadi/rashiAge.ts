// ─────────────────────────────────────────────────────────────
//  src/lib/engine/nadi/rashiAge.ts
//  Sign pairs open at fixed ages. A planet in the sign is read.
//  An empty sign is read from the house it falls in.
//  The year-count is a separate reading.
// ─────────────────────────────────────────────────────────────

import type { Rashi } from '@/types/astrology'
import { GRAHA_NAMES, RASHI_NAMES } from '@/types/astrology'
import { nG, nJoin, nLang, nNom, nOrd, nR, nSay, type EngineLang } from '@/lib/engine/nadi/text'
import { getDignity } from '@/lib/engine/dignity'
import {
  RASHI_LORDS,
  wholeSignHouseFromLagna,
  type ClassicalGrahaId,
  type HouseNumber,
} from '@/lib/engine/houseInterpretations'
import { bcpHouse } from '@/lib/engine/nadi/bcp'
import { nadiGrahas } from '@/lib/engine/nadi/grahas'
import { nadiHouses } from '@/lib/engine/nadi/houses'
import type { NadiYogaPlacement } from '@/lib/engine/nadi/yogas'

export const NADI_RASHI_AGE_NOTE =
  'Each pair of signs opens in its year: 20, 24, 28, 32, 36, and 40. A planet in the sign is read. An empty sign is read from the house it falls in. The year-count is a separate reading. When the same year is open on both, it is read more strongly.'

export const NADI_RASHI_AGE_NOTE_HI =
  'राशियों का हर जोड़ा अपने वर्ष में खुलता है: 20, 24, 28, 32, 36 और 40। राशि में बैठा ग्रह पढ़ा जाता है। खाली राशि उस भाव से पढ़ी जाती है जिसमें वह पड़ती है। वर्ष-गणना अलग फल है। जब एक ही वर्ष दोनों में खुला हो, तो उसे अधिक बल से पढ़ा जाता है।'

const PAIRS: readonly { age: number; signs: readonly [Rashi, Rashi] }[] = [
  { age: 20, signs: [1, 12] },
  { age: 24, signs: [2, 11] },
  { age: 28, signs: [3, 10] },
  { age: 32, signs: [4, 9] },
  { age: 36, signs: [5, 8] },
  { age: 40, signs: [6, 7] },
]

const ORDER: readonly ClassicalGrahaId[] = ['Su', 'Mo', 'Ma', 'Me', 'Ju', 'Ve', 'Sa', 'Ra', 'Ke']

export function rashiAgeNotes(input: {
  ascRashi: Rashi
  grahas: readonly NadiYogaPlacement[]
  runningYear?: number
  lang?: EngineLang
}): string[] {
  const L = nLang(input.lang)
  return PAIRS.map((pair) => {
    const houses = pair.signs.map((sign) => wholeSignHouseFromLagna(input.ascRashi, sign))
    const clauses = pair.signs.map((sign) => signClause(input, sign, L)).join(' ')
    let line = nSay(L,
      `In the ${ordinal(pair.age)} year, ${RASHI_NAMES[pair.signs[0]]} and ${RASHI_NAMES[pair.signs[1]]} are active. ${clauses}`,
      `${pair.age}वें वर्ष में ${nR(pair.signs[0], L)} और ${nR(pair.signs[1], L)} सक्रिय होती हैं। ${clauses}`)
    if (input.runningYear === pair.age) line += nSay(L, ' That year is the one now running.', ' यही वर्ष अभी चल रहा है।')
    const sameHouse = houses.includes(bcpHouse(pair.age))
    const marsYear = pair.age === 32 && input.grahas.some((g) => g.id === 'Ma')
    if (sameHouse && marsYear) {
      line += nSay(L, ' The year-count house is the same one, and Mars\'s year is also open, so this year is read more strongly.', ' वर्ष-गणना का भाव भी यही है, और मंगल का वर्ष भी खुला है, इसलिए इस वर्ष को अधिक बल से पढ़ा जाता है।')
    } else if (sameHouse) {
      line += nSay(L, ' The year-count house is the same one, so this year is read more strongly.', ' वर्ष-गणना का भाव भी यही है, इसलिए इस वर्ष को अधिक बल से पढ़ा जाता है।')
    } else if (marsYear) {
      line += nSay(L, ' Mars\'s year is also open, so the two readings are taken together.', ' मंगल का वर्ष भी खुला है, इसलिए दोनों फल साथ लिए जाते हैं।')
    }
    return line
  })
}

function signClause(input: { ascRashi: Rashi; grahas: readonly NadiYogaPlacement[] }, sign: Rashi, L: EngineLang): string {
  const house = wholeSignHouseFromLagna(input.ascRashi, sign)
  const there = ORDER.filter((id) => input.grahas.some((g) => g.id === id && g.rashi === sign))
  const bits: string[] = []
  if (there.length === 0) {
    const themes = houseThemes(house, L)
    bits.push(nSay(L,
      `${RASHI_NAMES[sign]} falls in the ${ordinal(house)}. No planet sits there, so the ${ordinal(house)} is read for ${themes}.`,
      `${nR(sign, L)} ${nOrd(house, L)} भाव में पड़ती है। वहाँ कोई ग्रह नहीं है, इसलिए ${nNom(house)} भाव ${themes} के लिए पढ़ा जाता है।`))
  } else {
    const named = there.filter((id) => id !== 'Ra' && id !== 'Ke').slice(0, 2)
    const shownIds = named.length > 0 ? named : there.slice(0, 2)
    if (L === 'hi') {
      const shown = shownIds.map((id) => nG(id, L)).join(' और ')
      const theme = nJoin(named.map((id) => nadiGrahas('hi')[id].significances[0]!), 'hi')
      bits.push(`${nR(sign, L)} ${nOrd(house, L)} भाव में पड़ती है, जहाँ ${shown} ${shownIds.length > 1 ? 'हैं' : 'है'}${theme ? `, जो ${theme} के लिए पढ़ा जाता है` : ''}।`)
    } else {
      const shown = shownIds.map((id) => GRAHA_NAMES[id]).join(' and ')
      const theme = named.map((id) => nadiGrahas('en')[id].significances[0].toLowerCase()).join(' and ')
      bits.push(`${RASHI_NAMES[sign]} falls in the ${ordinal(house)}, with ${shown}${theme ? `, read for ${theme}` : ''}.`)
    }
  }
  if (there.includes('Ra') || there.includes('Ke')) {
    const moonNode = there.includes('Mo') && (there.includes('Ra') || there.includes('Ke'))
    bits.push(moonNode
      ? nSay(L, 'An unexpected event is checked, and it is read more strongly.', 'किसी अप्रत्याशित घटना की जाँच की जाती है, और उसे अधिक बल से पढ़ा जाता है।')
      : nSay(L, 'An unexpected event is checked.', 'किसी अप्रत्याशित घटना की जाँच की जाती है।'))
  }
  if (exchanged(sign, input.grahas)) bits.push(nSay(L, 'An exchange includes this sign.', 'इस राशि का परिवर्तन योग है।'))
  const lord = RASHI_LORDS.find((row) => row.number === sign)?.lord
  const lordPlanet = lord ? input.grahas.find((g) => g.id === lord) : undefined
  if (lordPlanet) {
    const dignity = lordPlanet.dignity ?? getDignity(lordPlanet.id, lordPlanet.rashi, lordPlanet.degree ?? 15)
    if (dignity === 'exalted') bits.push(nSay(L, 'The lord is exalted.', 'स्वामी उच्च का है।'))
    if (dignity === 'debilitated') bits.push(nSay(L, 'The lord is debilitated, so a struggle is checked.', 'स्वामी नीच का है, इसलिए संघर्ष की जाँच की जाती है।'))
    const lordHouse = wholeSignHouseFromLagna(input.ascRashi, lordPlanet.rashi)
    if (lordHouse === 5) bits.push(nSay(L, 'The lord sits in the 5th. A rise in rank is checked.', 'स्वामी पाँचवें भाव में है। पद में उन्नति की जाँच की जाती है।'))
    if (lordHouse === 12) bits.push(nSay(L, 'The lord sits in the 12th. A move away from home is checked.', 'स्वामी बारहवें भाव में है। घर से दूर जाने की जाँच की जाती है।'))
  }
  if (house === 2 || house === 11) bits.push(nSay(L, 'A gain or a large expense is checked.', 'लाभ या बड़े खर्च की जाँच की जाती है।'))
  else if ((house === 9 || house === 10) && there.length > 0 && wholeSignHouseFromLagna(input.ascRashi, lordPlanet?.rashi ?? sign) !== 5) {
    bits.push(nSay(L, 'A rise in work is checked.', 'काम में उन्नति की जाँच की जाती है।'))
  }
  return bits.join(' ')
}

function houseThemes(house: HouseNumber, L: EngineLang = 'en'): string {
  const en = nadiHouses('en')[house].significances
  const shown = nadiHouses(L)[house].significances
  const safe = en.map((line, i) => ({ line, i })).filter(({ line }) => !/death|die|passed/i.test(line))
  const source = safe.length > 0 ? safe : en.map((line, i) => ({ line, i }))
  const picked = source.slice(0, 2).map(({ i }) => shown[i]!)
  return L === 'hi' ? nJoin(picked, 'hi') : picked.join(' and ').toLowerCase()
}

function exchanged(sign: Rashi, grahas: readonly NadiYogaPlacement[]): boolean {
  const lord = RASHI_LORDS.find((row) => row.number === sign)?.lord
  const placed = lord ? grahas.find((g) => g.id === lord) : undefined
  if (!placed || placed.rashi === sign) return false
  const otherLord = RASHI_LORDS.find((row) => row.number === placed.rashi)?.lord
  const other = otherLord ? grahas.find((g) => g.id === otherLord) : undefined
  return other?.rashi === sign
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
