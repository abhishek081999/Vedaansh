// ─────────────────────────────────────────────────────────────
//  src/lib/engine/nadi/transits.ts
//  Slow-planet transits in Nadi: Saturn, Rahu, and Ketu,
//  read by the natal planet they pass. Jupiter is listed
//  beside them. The house of the transit is not the reading.
// ─────────────────────────────────────────────────────────────

import { GRAHA_NAMES, RASHI_NAMES, type Rashi } from '@/types/astrology'
import { getDignity } from '@/lib/engine/dignity'
import {
  RASHI_LORDS,
  wholeSignHouseFromLagna,
  type ClassicalGrahaId,
  type HouseNumber,
} from '@/lib/engine/houseInterpretations'
import { rashiForHouseFromLagna } from '@/lib/engine/rashiInterpretations'
import { nadiConjunct, type NadiYogaPlacement } from '@/lib/engine/nadi/yogas'
import { nG, nJoin, nLang, nR, nSay, type EngineLang } from '@/lib/engine/nadi/text'

export const NADI_SLOW_TRANSIT_NOTE =
  'Nadi timing uses Jupiter, Saturn, Rahu, and Ketu, by the planet they pass. Saturn’s sign is the window and the natal degree is the peak. A planet within two or three degrees of a sign edge can still show in the neighbouring sign. The hard phase for the mother is Saturn on the natal Moon. The years on either side are not read the same way. Jupiter or Saturn on Rahu or Ketu, and Rahu on Saturn, are poor times to begin a venture.'

export const NADI_SLOW_TRANSIT_NOTE_HI =
  'नाड़ी में समय निर्धारण गुरु, शनि, राहु और केतु से होता है, उस ग्रह के आधार पर जिस पर से वे गुज़रते हैं। शनि की राशि अवधि है और जन्म का अंश उसका शिखर। राशि की सीमा से दो-तीन अंश के भीतर का ग्रह पड़ोसी राशि में भी फल दिखा सकता है। माता के लिए कठिन चरण जन्म के चंद्र पर शनि है। उसके आगे-पीछे के वर्ष एक जैसे नहीं पढ़े जाते। राहु या केतु पर गुरु या शनि, और शनि पर राहु, कोई नया उद्यम शुरू करने के लिए खराब समय हैं।'

export const NADI_SATURN_TRANSIT = [
  { planet: 'Venus', result: 'The most useful Saturn transit. Wealth, a marriage or a relationship, and growth in vehicles, land, or a house. The size of the gain is not read.' },
  { planet: 'Rahu', result: 'A hard period. Classical texts look here for a loss in the family, illness, a fall in work, or a move. It is not a fixed outcome.' },
  { planet: 'Mars', result: 'Disputes, surgery, an accident, a fracture, or a court case are checked. Building, land, and property are the useful form.' },
  { planet: 'Ketu', result: 'A change of work is read as likely. A supportive running period can make it a step up rather than a loss. Expenditure is also checked.' },
  { planet: 'Sun', result: 'A rise in work. Conflict, separation, or illness is checked for the father or grandfather. Government, a court matter, tax, or a visa is also checked.' },
  { planet: 'Jupiter', result: 'Professional growth and a promotion, the same family as Jupiter over Saturn.' },
  { planet: 'Moon', result: 'Illness is checked for the mother or a motherly figure. Separation from the family, or a change of place, can go with it.' },
  { planet: 'Mercury', result: 'A favorable period, including a start in one’s own work.' },
] as const

export const NADI_SATURN_TRANSIT_HI: readonly { planet: string; result: string }[] = [
  { planet: 'शुक्र', result: 'शनि का सबसे उपयोगी गोचर। धन, विवाह या संबंध, और वाहन, भूमि या घर में वृद्धि। लाभ का आकार नहीं पढ़ा जाता।' },
  { planet: 'राहु', result: 'कठिन अवधि। शास्त्रीय ग्रंथ यहाँ परिवार में हानि, रोग, काम में गिरावट या स्थान परिवर्तन देखते हैं। यह निश्चित परिणाम नहीं है।' },
  { planet: 'मंगल', result: 'विवाद, शल्य चिकित्सा, दुर्घटना, हड्डी टूटना या मुकदमे की जाँच की जाती है। निर्माण, भूमि और संपत्ति इसका उपयोगी रूप हैं।' },
  { planet: 'केतु', result: 'काम में बदलाव की संभावना पढ़ी जाती है। सहायक दशा इसे हानि के बजाय उन्नति बना सकती है। खर्च की भी जाँच की जाती है।' },
  { planet: 'सूर्य', result: 'काम में उन्नति। पिता या दादा के लिए टकराव, अलगाव या रोग की जाँच की जाती है। सरकार, न्यायालय का मामला, कर या वीज़ा की भी जाँच की जाती है।' },
  { planet: 'गुरु', result: 'व्यावसायिक वृद्धि और पदोन्नति, शनि पर गुरु वाले फल जैसी।' },
  { planet: 'चंद्र', result: 'माता या माँ जैसी किसी व्यक्ति के लिए रोग की जाँच की जाती है। परिवार से अलगाव, या स्थान परिवर्तन, साथ आ सकता है।' },
  { planet: 'बुध', result: 'अनुकूल अवधि, जिसमें अपने काम की शुरुआत भी है।' },
]

export const NADI_NODE_TRANSIT_HI: readonly { planet: string; result: string }[] = [
  { planet: 'शनि पर राहु', result: 'शास्त्रीय ग्रंथ यहाँ आर्थिक हानि, स्थान परिवर्तन, रोग या निकट परिवार में हानि देखते हैं। यह निश्चित परिणाम नहीं है।' },
  { planet: 'शनि पर केतु', result: 'काम में बदलाव, या काम छूटना।' },
  { planet: 'शुक्र पर राहु', result: 'धन, विलास, संबंध, और वाहन या उपकरण।' },
  { planet: 'शनि पर शुक्र', result: 'हर वर्ष लगभग एक महीने के लिए, व्यवसाय करने वाले व्यक्ति के लिए धन पढ़ा जाता है। निश्चित वेतन में यह नहीं दिखता।' },
  { planet: 'राहु पर मंगल', result: 'अचानक अशांति की जाँच की जाती है: विवाद, स्थान परिवर्तन, या आग का जोखिम। शिखर जन्म के राहु के अंश पर मंगल है।' },
]

export function nadiSaturnTransit(lang?: EngineLang): readonly { planet: string; result: string }[] {
  return lang === 'hi' ? NADI_SATURN_TRANSIT_HI : NADI_SATURN_TRANSIT
}

export function nadiNodeTransit(lang?: EngineLang): readonly { planet: string; result: string }[] {
  return lang === 'hi' ? NADI_NODE_TRANSIT_HI : NADI_NODE_TRANSIT
}

export const NADI_NODE_TRANSIT = [
  { planet: 'Rahu over Saturn', result: 'Classical texts look here for a financial loss, a move, illness, or a loss in the close family. It is not a fixed outcome.' },
  { planet: 'Ketu over Saturn', result: 'A change of work, or the loss of it.' },
  { planet: 'Rahu over Venus', result: 'Wealth, luxury, relationships, and a vehicle or gadgets.' },
  { planet: 'Venus over Saturn', result: 'For about a month each year, wealth is read for a person in business. A fixed salary does not show this.' },
  { planet: 'Mars over Rahu', result: 'A sudden disturbance is checked: a dispute, a change of place, or a fire risk. The peak is Mars on the natal degree of Rahu.' },
] as const

const SATURN_OVER: Partial<Record<ClassicalGrahaId, string>> = {
  Ve: 'wealth, a marriage or a relationship, and property',
  Ra: 'a hard period for the family, work, or a move',
  Ma: 'disputes, surgery, an accident, or property',
  Ke: 'a change of work',
  Su: 'a rise in work, and strain on the father or grandfather',
  Ju: 'professional growth',
  Mo: 'the mother’s health, or a motherly figure, and a change of place',
  Me: 'a favorable period, including one’s own work',
}

const SATURN_OVER_HI: Partial<Record<ClassicalGrahaId, string>> = {
  Ve: 'धन, विवाह या संबंध, और संपत्ति',
  Ra: 'परिवार, काम या स्थान परिवर्तन के लिए कठिन अवधि',
  Ma: 'विवाद, शल्य चिकित्सा, दुर्घटना, या संपत्ति',
  Ke: 'काम में बदलाव',
  Su: 'काम में उन्नति, और पिता या दादा पर दबाव',
  Ju: 'व्यावसायिक वृद्धि',
  Mo: 'माता या माँ जैसी व्यक्ति का स्वास्थ्य, और स्थान परिवर्तन',
  Me: 'अनुकूल अवधि, जिसमें अपना काम भी है',
}

/** Planets that share a sign are read together when Saturn reaches that sign. */
export function saturnTransitGroups(grahas: readonly { id: ClassicalGrahaId; rashi: Rashi }[], lang?: EngineLang): string[] {
  const L = nLang(lang)
  const bySign = new Map<Rashi, ClassicalGrahaId[]>()
  for (const g of grahas) {
    const list = bySign.get(g.rashi) ?? []
    list.push(g.id)
    bySign.set(g.rashi, list)
  }
  const lines: string[] = []
  for (const [sign, ids] of bySign) {
    const woken = ids.filter((id) => SATURN_OVER[id])
    if (ids.length < 2 || woken.length === 0) continue
    let line: string
    if (L === 'hi') {
      const names = nJoin(ids.map((id) => nG(id, L)), L)
      const results = woken.map((id) => SATURN_OVER_HI[id]).join('; ')
      line = `${names} एक ही राशि ${nR(sign, L)} में हैं। उस राशि पर शनि को ${results} के रूप में पढ़ा जाता है।`
      if (woken.includes('Mo')) line += ' यही वह समय है जब शनि चंद्र पर होता है।'
    } else {
      const names = joinNames(ids.map((id) => GRAHA_NAMES[id]))
      const results = woken.map((id) => SATURN_OVER[id]).join('; ')
      line = `${names} share ${RASHI_NAMES[sign]}. Saturn over that sign is read as ${results}.`
      if (woken.includes('Mo')) line += ' That is the time Saturn is on the Moon.'
    }
    lines.push(line)
  }
  return lines
}

function joinNames(names: string[]): string {
  if (names.length <= 1) return names[0] ?? ''
  if (names.length === 2) return `${names[0]} and ${names[1]}`
  return `${names.slice(0, -1).join(', ')}, and ${names[names.length - 1]}`
}

export interface SlowTransitInput {
  ascRashi: Rashi
  grahas: readonly NadiYogaPlacement[]
  arudhaLagna?: Rashi
  gender?: 'male' | 'female' | 'other'
  lang?: EngineLang
}

export function slowTransitNotes(input: SlowTransitInput): string[] {
  const L = nLang(input.lang)
  const notes: string[] = []
  const lord = lordOf(input.ascRashi, 1)
  const lordPlanet = input.grahas.find((g) => g.id === lord)
  const lordHouse = lordPlanet ? wholeSignHouseFromLagna(input.ascRashi, lordPlanet.rashi) : null
  const lordExalted = lordPlanet ? isExalted(lordPlanet) : false
  if (lordExalted && lordHouse === 9) {
    notes.push(nSay(L, 'The lagna lord is exalted in the 9th. Wealth is read as present from birth, with little need to earn it.', 'लग्नेश नौवें भाव में उच्च का है। धन जन्म से ही मौजूद पढ़ा जाता है, उसे कमाने की ज़रूरत कम रहती है।'))
  }
  const exaltedCount = input.grahas.filter((g) => isExalted(g)).length
  if (lordExalted || exaltedCount >= 3) {
    notes.push(nSay(L, 'Exalted strength is read as comfort that can reduce the push to work.', 'उच्च का बल ऐसे सुख के रूप में पढ़ा जाता है जो काम करने की प्रेरणा घटा सकता है।'))
  }
  if (nadiConjunct(input.grahas, ['Ve', 'Me'])) {
    const trading = nSay(L, 'Venus with Mercury is read as stock trading.', 'शुक्र के साथ बुध को शेयर ट्रेडिंग के रूप में पढ़ा जाता है।')
    notes.push(input.gender === 'male'
      ? nSay(L, `${trading} In this chart the wife is read as the higher earner.`, `${trading} इस कुंडली में पत्नी को अधिक कमाने वाली पढ़ा जाता है।`)
      : trading)
  }
  const mercury = input.grahas.find((g) => g.id === 'Me')
  const jupiter = input.grahas.find((g) => g.id === 'Ju')
  if (mercury?.rashi === 12 && (jupiter?.rashi === 3 || jupiter?.rashi === 6)) {
    notes.push(nSay(L, 'Mercury is debilitated and exchanges with Jupiter, so the debilitation is read as cancelled.', 'बुध नीच का है और गुरु से परिवर्तन योग बनाता है, इसलिए नीचता भंग पढ़ी जाती है।'))
  }
  if (jupiter && input.arudhaLagna != null && jupiter.rashi === input.arudhaLagna) {
    notes.push(nSay(L, 'Jupiter in the arudha lagna: a strong rise is read, with prosperity and protection. Misfortunes are read as reduced, and longevity is supported.', 'आरूढ़ लग्न में गुरु: समृद्धि और रक्षा के साथ प्रबल उन्नति पढ़ी जाती है। दुर्भाग्य कम पढ़ा जाता है, और आयु को सहारा मिलता है।'))
  }
  return notes
}

function isExalted(g: NadiYogaPlacement): boolean {
  if (g.dignity === 'exalted') return true
  if (g.dignity && g.dignity !== 'exalted') return false
  return getDignity(g.id, g.rashi, g.degree ?? 15) === 'exalted'
}

function lordOf(asc: Rashi, house: HouseNumber): ClassicalGrahaId {
  const sign = rashiForHouseFromLagna(asc, house)
  return RASHI_LORDS.find((row) => row.number === sign)?.lord ?? 'Su'
}

export interface HardTransitInput {
  ascRashi: Rashi
  grahas: readonly { id: ClassicalGrahaId; rashi: Rashi; degree?: number }[]
  navamsha?: Partial<Record<ClassicalGrahaId, Rashi>>
  navamshaLagna?: Rashi
  lang?: EngineLang
}

/** Signs to watch. Today’s Saturn and Rahu are not calculated. */
export function hardTransitNotes(input: HardTransitInput): string[] {
  const L = nLang(input.lang)
  const lines: string[] = []
  for (const id of ['Su', 'Mo'] as const) {
    const planet = input.grahas.find((g) => g.id === id)
    if (!planet) continue
    const who = id === 'Su' ? 'the father and grandfather, and for government or a court matter' : 'the mother or a motherly figure'
    const whoHi = id === 'Su' ? 'पिता और दादा, और सरकार या न्यायालय के मामले' : 'माता या माँ जैसी व्यक्ति'
    const deg = planet.degree != null && Number.isFinite(planet.degree) ? Math.floor(planet.degree) : null
    const peak = deg == null ? '' : nSay(L, ` The peak is ${deg}°.`, ` शिखर ${deg}° पर है।`)
    lines.push(nSay(L,
      `Saturn in ${RASHI_NAMES[planet.rashi]} is the window for ${who}.${peak}`,
      `${nR(planet.rashi, L)} में शनि ${whoHi} के लिए अवधि है।${peak}`))
  }
  if (input.navamshaLagna != null) {
    const sign = rashiForHouseFromLagna(input.navamshaLagna, 4)
    lines.push(nSay(L,
      `The 4th of Navamsha is ${RASHI_NAMES[sign]}. Classical texts read Rahu or Saturn in that sign as a possible loss among close relations. It is not a fixed outcome.`,
      `नवांश का चौथा भाव ${nR(sign, L)} है। शास्त्रीय ग्रंथ उस राशि में राहु या शनि को निकट संबंधियों में संभावित हानि के रूप में पढ़ते हैं। यह निश्चित परिणाम नहीं है।`))
  }
  if (input.navamsha) {
    const eighth = lordOf(input.ascRashi, 8)
    const sign = input.navamsha[eighth]
    if (sign != null) {
      lines.push(nSay(L,
        `Saturn in ${RASHI_NAMES[sign]}, the Navamsha of the 8th lord ${GRAHA_NAMES[eighth]}, is read as a possible loss in the family, a mishap, or a hard year for you. It is not a fixed outcome.`,
        `${nR(sign, L)} में शनि, जो अष्टमेश ${nG(eighth, L)} का नवांश है, परिवार में संभावित हानि, दुर्घटना, या आपके लिए कठिन वर्ष के रूप में पढ़ा जाता है। यह निश्चित परिणाम नहीं है।`))
    }
    const fifth = lordOf(input.ascRashi, 5)
    const birth = input.navamsha[fifth]
    if (birth != null) {
      const trineSigns = [shiftSign(birth, 4), shiftSign(birth, 8)]
      const trines = trineSigns.map((sign) => RASHI_NAMES[sign])
      lines.push(nSay(L,
        `Jupiter in ${RASHI_NAMES[birth]}, ${trines[0]}, or ${trines[1]}, the Navamsha of the 5th lord, is read as a year of childbirth.`,
        `पंचमेश के नवांश ${nR(birth, L)} में, या ${nR(trineSigns[0]!, L)} या ${nR(trineSigns[1]!, L)} में गुरु संतान जन्म का वर्ष पढ़ा जाता है।`))
    }
  }
  for (const house of [1, 7] as const) {
    const malefic = input.grahas.some((g) => (
      wholeSignHouseFromLagna(input.ascRashi, g.rashi) === house
      && (g.id === 'Ma' || g.id === 'Sa' || g.id === 'Ra' || g.id === 'Ke')
    ))
    if (!malefic) continue
    lines.push(house === 1
      ? nSay(L, 'The lagna holds a difficult planet. Reputation and temper are checked.', 'लग्न में कठिन ग्रह है। प्रतिष्ठा और क्रोध की जाँच की जाती है।')
      : nSay(L, 'The 7th holds a difficult planet. Reputation through a partnership is checked.', 'सातवें भाव में कठिन ग्रह है। साझेदारी के माध्यम से प्रतिष्ठा की जाँच की जाती है।'))
  }
  return lines
}

function shiftSign(sign: Rashi, by: number): Rashi {
  return ((((sign - 1 + by) % 12) + 12) % 12 + 1) as Rashi
}
