// ─────────────────────────────────────────────────────────────
//  src/lib/engine/nadi/shashtiamsa.ts
//  D60 is read with the same rules as the birth chart.
//  A result that has several forms is kept as the set.
//  No birth-time rectification is done here.
// ─────────────────────────────────────────────────────────────

import type { Rashi } from '@/types/astrology'
import { GRAHA_NAMES } from '@/types/astrology'
import { nG, nJoin, nLang, nOrd, nSay, type EngineLang } from '@/lib/engine/nadi/text'
import {
  RASHI_LORDS,
  wholeSignHouseFromLagna,
  type ClassicalGrahaId,
  type HouseNumber,
} from '@/lib/engine/houseInterpretations'
import { rashiForHouseFromLagna } from '@/lib/engine/rashiInterpretations'
import { nadiConjunct, type NadiYogaPlacement } from '@/lib/engine/nadi/yogas'

export const NADI_SHASHTIAMSA_NOTE =
  'Shashtiamsa is read with the same rules as the birth chart. A combination with more than one result is read as the set. The 2nd and the 11th are read for wealth. These lines are only as fine as the birth time.'

export const NADI_SHASHTIAMSA_NOTE_HI =
  'षष्ट्यंश को जन्म कुंडली के ही नियमों से पढ़ा जाता है। एक से अधिक फल वाले योग को पूरे समूह के रूप में पढ़ा जाता है। धन के लिए दूसरा और ग्यारहवाँ भाव देखे जाते हैं। ये पंक्तियाँ उतनी ही सटीक हैं जितना जन्म समय।'

const ORDER: readonly ClassicalGrahaId[] = ['Su', 'Mo', 'Ma', 'Me', 'Ju', 'Ve', 'Sa', 'Ra', 'Ke']
const RETROGRADE: readonly ClassicalGrahaId[] = ['Ma', 'Me', 'Ju', 'Ve', 'Sa']

type Placement = NadiYogaPlacement & { isRetro?: boolean }

export function shashtiamsaNotes(input: {
  shashtiamsa?: { ascRashi: Rashi; grahas: readonly Placement[] }
  lang?: EngineLang
}): string[] {
  const L = nLang(input.lang)
  const chart = input.shashtiamsa
  if (!chart) return []
  const { ascRashi: lagna, grahas } = chart
  const lines: string[] = []
  const lagnaLord = signLord(lagna)
  const tenthLord = signLord(rashiForHouseFromLagna(lagna, 10))

  if (houseOf(grahas, lagna, tenthLord) === 5) {
    lines.push(nSay(L, 'The 10th lord of Shashtiamsa sits in the 5th. Teaching is read as prominent.', 'षष्ट्यंश का दशमेश पाँचवें भाव में है। अध्यापन प्रमुख पढ़ा जाता है।'))
  }

  for (const id of ['Ju', 'Ve'] as const) {
    const house = houseOf(grahas, lagna, id)
    if (house !== 1 && house !== 10) continue
    const where = house === 1 ? 'the Shashtiamsa lagna' : 'the 10th of Shashtiamsa'
    const whereHi = house === 1 ? 'षष्ट्यंश लग्न' : 'षष्ट्यंश के दसवें भाव'
    lines.push(nSay(L, `${GRAHA_NAMES[id]} sits in ${where}. Teaching, or astrology, is one option.`, `${nG(id, L)} ${whereHi} में है। अध्यापन या ज्योतिष एक विकल्प है।`))
  }

  const thirdIds = ORDER.filter((id) => houseOf(grahas, lagna, id) === 3)
  const third = thirdIds.map((id) => GRAHA_NAMES[id])
  if (third.length) {
    lines.push(nSay(L,
      `${joinNames(third)} ${third.length === 1 ? 'sits' : 'sit'} in the 3rd of Shashtiamsa. Writing is one option.`,
      `${nJoin(thirdIds.map((id) => nG(id, L)), L)} षष्ट्यंश के तीसरे भाव में ${third.length === 1 ? 'है' : 'हैं'}। लेखन एक विकल्प है।`))
  }

  if (housesConnect(lagna, grahas, 5, 6)) {
    lines.push(nSay(L, 'The 5th and the 6th of Shashtiamsa connect. Medicine or law, through education, is one option.', 'षष्ट्यंश के पाँचवें और छठे भाव जुड़े हैं। शिक्षा के माध्यम से चिकित्सा या कानून एक विकल्प है।'))
  }

  if (nadiConjunct(grahas, ['Ma', 'Ke'])) {
    lines.push(nSay(L, 'Mars and Ketu together in Shashtiamsa. Surgery, or a uniformed profession, is one option.', 'षष्ट्यंश में मंगल और केतु साथ हैं। शल्य चिकित्सा या वर्दी वाला पेशा एक विकल्प है।'))
  }

  if (housesConnect(lagna, grahas, 2, 11)) {
    lines.push(nSay(L, 'The 2nd and the 11th of Shashtiamsa connect. Wealth is read from that.', 'षष्ट्यंश के दूसरे और ग्यारहवें भाव जुड़े हैं। धन इसी से पढ़ा जाता है।'))
  }

  const dusthana = ([6, 8] as const).filter((house) => lagnaLordReaches(lagna, grahas, lagnaLord, house))
  if (dusthana.length === 2) {
    lines.push(nSay(L, 'The lagna lord connects with the 6th and the 8th of Shashtiamsa. A chronic illness is checked.', 'लग्नेश षष्ट्यंश के छठे और आठवें भाव से जुड़ा है। पुराने रोग की जाँच की जाती है।'))
  } else if (dusthana.length === 1) {
    lines.push(nSay(L, `The lagna lord connects with the ${ordinal(dusthana[0]!)} of Shashtiamsa. A chronic illness is checked.`, `लग्नेश षष्ट्यंश के ${nOrd(dusthana[0]!, L)} भाव से जुड़ा है। पुराने रोग की जाँच की जाती है।`))
  }

  const seventh = placed(grahas, signLord(rashiForHouseFromLagna(lagna, 7)))
  if (seventh?.isRetro && RETROGRADE.includes(seventh.id)) {
    lines.push(nSay(L, 'The 7th lord of Shashtiamsa is retrograde. Late marriage and a separation are read together. One of them is not picked out on its own.', 'षष्ट्यंश का सप्तमेश वक्री है। देर से विवाह और अलगाव साथ पढ़े जाते हैं। इनमें से किसी एक को अलग से नहीं चुना जाता।'))
  }

  return lines
}

function housesConnect(
  lagna: Rashi,
  grahas: readonly Placement[],
  a: HouseNumber,
  b: HouseNumber,
): boolean {
  const lordA = signLord(rashiForHouseFromLagna(lagna, a))
  const lordB = signLord(rashiForHouseFromLagna(lagna, b))
  if (houseOf(grahas, lagna, lordA) === b || houseOf(grahas, lagna, lordB) === a) return true
  return lordA !== lordB && nadiConjunct(grahas, [lordA, lordB]) != null
}

function lagnaLordReaches(
  lagna: Rashi,
  grahas: readonly Placement[],
  lagnaLord: ClassicalGrahaId,
  house: HouseNumber,
): boolean {
  if (houseOf(grahas, lagna, lagnaLord) === house) return true
  const other = signLord(rashiForHouseFromLagna(lagna, house))
  return other !== lagnaLord && nadiConjunct(grahas, [lagnaLord, other]) != null
}

function houseOf(
  grahas: readonly Placement[],
  lagna: Rashi,
  id: ClassicalGrahaId,
): HouseNumber | null {
  const planet = placed(grahas, id)
  return planet ? wholeSignHouseFromLagna(lagna, planet.rashi) : null
}

function placed(grahas: readonly Placement[], id: ClassicalGrahaId): Placement | null {
  return grahas.find((g) => g.id === id) ?? null
}

function signLord(sign: Rashi): ClassicalGrahaId {
  return RASHI_LORDS.find((row) => row.number === sign)?.lord ?? 'Su'
}

function joinNames(names: string[]): string {
  if (names.length <= 1) return names[0] ?? ''
  if (names.length === 2) return `${names[0]} and ${names[1]}`
  return `${names.slice(0, -1).join(', ')}, and ${names[names.length - 1]}`
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
