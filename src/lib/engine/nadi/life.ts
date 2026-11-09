// ─────────────────────────────────────────────────────────────
//  src/lib/engine/nadi/life.ts
//  Study, the family counted from each relative, and settlement
//  away from the birthplace. Whole sign. Teaching associations.
// ─────────────────────────────────────────────────────────────

import { GRAHA_NAMES } from '@/types/astrology'
import type { Rashi } from '@/types/astrology'
import { getDignity } from '@/lib/engine/dignity'
import {
  RASHI_LORDS,
  wholeSignHouseFromLagna,
  type ClassicalGrahaId,
  type HouseNumber,
} from '@/lib/engine/houseInterpretations'
import { rashiForHouseFromLagna } from '@/lib/engine/rashiInterpretations'
import { educationNotes, houseCountedFrom } from '@/lib/engine/nadi/rotation'
import { nG, nJoin, nLang, nOrd, nSay, type EngineLang } from '@/lib/engine/nadi/text'
import type { NadiYogaPlacement } from '@/lib/engine/nadi/yogas'

export const NADI_LIFE_NOTE =
  'Study is read from the 5th and from Jupiter. A relative’s marriage is the 7th from their house, and their study is the 5th. Settlement away from the birthplace needs the 3rd, the 9th, and the 12th linked.'

export const NADI_LIFE_NOTE_HI =
  'पढ़ाई पाँचवें भाव और गुरु से पढ़ी जाती है। किसी संबंधी का विवाह उसके भाव से सातवाँ है, और उसकी पढ़ाई पाँचवाँ। जन्मस्थान से दूर बसने के लिए तीसरे, नौवें और बारहवें भाव का जुड़ना ज़रूरी है।'

const STRONG = new Set(['exalted', 'own', 'moolatrikona'])
const PRESSURE = new Set<ClassicalGrahaId>(['Sa', 'Ra', 'Ke'])
const FAMILY: readonly { id: string; label: string; labelHi: string; house: HouseNumber }[] = [
  { id: 'mother', label: 'Mother', labelHi: 'माता', house: 4 },
  { id: 'father', label: 'Father', labelHi: 'पिता', house: 10 },
  { id: 'children', label: 'Children', labelHi: 'संतान', house: 5 },
  { id: 'spouse', label: 'Spouse', labelHi: 'जीवनसाथी', house: 7 },
  { id: 'younger', label: 'Younger siblings', labelHi: 'छोटे भाई-बहन', house: 3 },
  { id: 'elder', label: 'Elder siblings', labelHi: 'बड़े भाई-बहन', house: 11 },
]

export interface NadiLifeReading {
  note: string
  education: string[]
  family: string[]
  settlement: string[]
}

interface LifeInput {
  ascRashi: Rashi
  grahas: readonly NadiYogaPlacement[]
}

/** One clause in both languages, so English joins stay exactly as before. */
interface Bi {
  en: string
  hi: string
}

export function readNadiLife(input: LifeInput & { lang?: EngineLang }): NadiLifeReading {
  const L = nLang(input.lang)
  return {
    note: nSay(L, NADI_LIFE_NOTE, NADI_LIFE_NOTE_HI),
    education: educationLines(input, L),
    family: familyLines(input, L),
    settlement: settlementLines(input, L),
  }
}

function educationLines(input: LifeInput, L: EngineLang): string[] {
  const lord = lordOf(input.ascRashi, 5)
  const lordPlanet = input.grahas.find((g) => g.id === lord)
  const jupiter = input.grahas.find((g) => g.id === 'Ju')
  const inFifth = input.grahas.filter((g) => houseOf(input.ascRashi, g.rashi) === 5).map((g) => g.id)
  const pressure: Bi[] = []
  const support: Bi[] = []

  if (inFifth.includes('Ra')) pressure.push({ en: 'Rahu sits in the 5th', hi: 'राहु पाँचवें भाव में है' })
  if (inFifth.includes('Ke')) pressure.push({ en: 'Ketu sits in the 5th', hi: 'केतु पाँचवें भाव में है' })
  if (inFifth.includes('Sa') && !inFifth.includes('Ra') && !inFifth.includes('Ke')) pressure.push({ en: 'Saturn sits in the 5th', hi: 'शनि पाँचवें भाव में है' })
  const withLord = joinedWith(input, lord, ['Sa', 'Ra', 'Ke'])
  if (lordPlanet && withLord.ids.length) {
    pressure.push({ en: `${withLord.en} sits with the 5th lord`, hi: `${withLord.hi} पंचमेश के साथ ${withLord.ids.length > 1 ? 'हैं' : 'है'}` })
  }
  if (lordPlanet && dignityOf(lordPlanet) === 'debilitated') pressure.push({ en: 'the 5th lord is debilitated', hi: 'पंचमेश नीच का है' })
  if (jupiter && dignityOf(jupiter) === 'debilitated') pressure.push({ en: 'Jupiter is debilitated', hi: 'गुरु नीच का है' })
  const withJupiter = joinedWith(input, 'Ju', ['Sa', 'Ra', 'Ke'])
  if (jupiter && withJupiter.ids.length) {
    pressure.push({ en: `${withJupiter.en} sits with Jupiter`, hi: `${withJupiter.hi} गुरु के साथ ${withJupiter.ids.length > 1 ? 'हैं' : 'है'}` })
  }

  if (lordPlanet && STRONG.has(dignityOf(lordPlanet))) {
    const d = dignityOf(lordPlanet)
    support.push({ en: `the 5th lord, ${GRAHA_NAMES[lord]}, is ${dignityWord(d)}`, hi: `पंचमेश ${nG(lord, 'hi')} ${dignityWordHi(d)} है` })
  }
  if (jupiter && STRONG.has(dignityOf(jupiter))) {
    const d = dignityOf(jupiter)
    support.push({ en: `Jupiter is ${dignityWord(d)}`, hi: `गुरु ${dignityWordHi(d)} है` })
  }

  const en = (list: Bi[]) => join(list.map((b) => b.en))
  const hi = (list: Bi[]) => nJoin(list.map((b) => b.hi), 'hi')
  const lines: string[] = []
  if (support.length > 0 && pressure.length > 0) {
    lines.push(nSay(L,
      `${cap(en(support))}, and ${en(pressure)}. A degree can still be completed. The work may leave the subject of that degree.`,
      `${hi(support)}, और ${hi(pressure)}। डिग्री फिर भी पूरी हो सकती है। काम उस डिग्री के विषय से हट सकता है।`))
  } else if (pressure.length > 0) {
    lines.push(nSay(L,
      `${cap(en(pressure))}. Study is the part under pressure, so the practical form of the career is the one to read.`,
      `${hi(pressure)}। दबाव पढ़ाई पर है, इसलिए करियर का व्यावहारिक रूप पढ़ना चाहिए।`))
  } else if (support.length > 0) {
    lines.push(nSay(L,
      `${cap(en(support))}. Study is supported, so the trained form of the career is the one to read.`,
      `${hi(support)}। पढ़ाई को सहारा मिलता है, इसलिए करियर का प्रशिक्षित रूप पढ़ना चाहिए।`))
  } else if (lordPlanet && houseOf(input.ascRashi, lordPlanet.rashi) !== 12) {
    const house = houseOf(input.ascRashi, lordPlanet.rashi)
    lines.push(nSay(L,
      `The 5th lord, ${GRAHA_NAMES[lord]}, sits in the ${ordinal(house)}. Children and study are read from that house.`,
      `पंचमेश ${nG(lord, 'hi')} ${nOrd(house, 'hi')} भाव में है। संतान और पढ़ाई उसी भाव से पढ़ी जाती हैं।`))
  }

  if (lordPlanet && houseOf(input.ascRashi, lordPlanet.rashi) === 12) {
    lines.push(nSay(L,
      'The 5th lord is in the 12th. Study abroad, a foreign partner, or children born abroad is the form checked.',
      'पंचमेश बारहवें भाव में है। विदेश में पढ़ाई, विदेशी साथी, या विदेश में जन्मी संतान, इस रूप की जाँच की जाती है।'))
  }

  lines.push(...educationNotes(inFifth, L))
  return lines
}

function familyLines(input: LifeInput, L: EngineLang): string[] {
  const lines: string[] = []
  for (const person of FAMILY) {
    const marriage = houseCountedFrom(person.house, 7)
    const study = houseCountedFrom(person.house, 5)
    const married = idsIn(input, marriage)
    const studied = idsIn(input, study)
    if (married.length > 0) {
      lines.push(nSay(L,
        `${person.label}: the marriage house, the ${ordinal(marriage)}, holds ${join(married.map((id) => GRAHA_NAMES[id]))}. Their marriage is read from that contact.`,
        `${person.labelHi}: उनके विवाह के भाव, ${nOrd(marriage, 'hi')} भाव, में ${nJoin(married.map((id) => nG(id, 'hi')), 'hi')} ${married.length > 1 ? 'हैं' : 'है'}। उनका विवाह इसी संपर्क से पढ़ा जाता है।`))
    }
    if (studied.length > 0 && study !== 5) {
      lines.push(nSay(L,
        `${person.label}: the education house, the ${ordinal(study)}, holds ${join(studied.map((id) => GRAHA_NAMES[id]))}. Their study is read from that contact.`,
        `${person.labelHi}: उनकी शिक्षा के भाव, ${nOrd(study, 'hi')} भाव, में ${nJoin(studied.map((id) => nG(id, 'hi')), 'hi')} ${studied.length > 1 ? 'हैं' : 'है'}। उनकी पढ़ाई इसी संपर्क से पढ़ी जाती है।`))
    }
  }
  return lines
}

function settlementLines(input: LifeInput, L: EngineLang): string[] {
  const lines: string[] = []
  const lordHouse = (house: HouseNumber) => {
    const planet = input.grahas.find((g) => g.id === lordOf(input.ascRashi, house))
    return planet ? houseOf(input.ascRashi, planet.rashi) : null
  }
  const linked = (a: HouseNumber, b: HouseNumber) => {
    const ha = lordHouse(a)
    const hb = lordHouse(b)
    if (ha == null || hb == null) return false
    return ha === b || hb === a || ha === hb
  }
  const travel = linked(3, 12)
  const fortune = linked(3, 9) || linked(9, 12)
  if (travel && fortune) {
    lines.push(nSay(L,
      'The 3rd, 9th, and 12th are linked. Settlement away from the birthplace is read, not only a trip.',
      'तीसरा, नौवाँ और बारहवाँ भाव जुड़े हैं। जन्मस्थान से दूर बसना पढ़ा जाता है, केवल यात्रा नहीं।'))
  }
  const fifth = idsIn(input, 5)
  const ninth = idsIn(input, 9)
  if (fifth.includes('Ra')) {
    lines.push(nSay(L, 'Rahu is in the 5th. Foreign education is the form checked.', 'राहु पाँचवें भाव में है। विदेश में शिक्षा, इस रूप की जाँच की जाती है।'))
  } else if (ninth.includes('Ra')) {
    lines.push(nSay(L, 'Rahu is in the 9th. Foreign education is the form checked.', 'राहु नौवें भाव में है। विदेश में शिक्षा, इस रूप की जाँच की जाती है।'))
  }
  if (idsIn(input, 12).includes('Ra')) {
    lines.push(nSay(L, 'Rahu in the 12th. Addiction is checked before a foreign-travel reading.', 'बारहवें भाव में राहु। विदेश यात्रा का फल पढ़ने से पहले व्यसन की जाँच की जाती है।'))
  }
  return lines
}

function idsIn(input: LifeInput, house: HouseNumber): ClassicalGrahaId[] {
  return input.grahas
    .filter((g) => houseOf(input.ascRashi, g.rashi) === house)
    .map((g) => g.id)
}

function joinedWith(
  input: { grahas: readonly NadiYogaPlacement[] },
  target: ClassicalGrahaId,
  others: readonly ClassicalGrahaId[],
): { ids: ClassicalGrahaId[]; en: string; hi: string } {
  const ids = others.filter((id) => sameSign(input, target, id))
  return {
    ids,
    en: join(ids.map((id) => GRAHA_NAMES[id])),
    hi: nJoin(ids.map((id) => nG(id, 'hi')), 'hi'),
  }
}

function sameSign(
  input: { grahas: readonly NadiYogaPlacement[] },
  a: ClassicalGrahaId,
  b: ClassicalGrahaId,
): boolean {
  const left = input.grahas.find((g) => g.id === a)
  const right = input.grahas.find((g) => g.id === b)
  return !!left && !!right && left.rashi === right.rashi && a !== b
}

function dignityOf(g: NadiYogaPlacement): string {
  if (g.dignity) return g.dignity
  if (PRESSURE.has(g.id) && g.id !== 'Sa') return ''
  return getDignity(g.id, g.rashi, g.degree ?? 15)
}

function dignityWord(dignity: string): string {
  if (dignity === 'own') return 'in its own sign'
  if (dignity === 'moolatrikona') return 'in moolatrikona'
  return dignity
}

function dignityWordHi(dignity: string): string {
  if (dignity === 'own') return 'अपनी राशि में'
  if (dignity === 'moolatrikona') return 'मूलत्रिकोण में'
  if (dignity === 'exalted') return 'उच्च का'
  return dignity
}

function lordOf(asc: Rashi, house: HouseNumber): ClassicalGrahaId {
  const sign = rashiForHouseFromLagna(asc, house)
  return RASHI_LORDS.find((row) => row.number === sign)?.lord ?? 'Su'
}

function houseOf(asc: Rashi, sign: Rashi): HouseNumber {
  return wholeSignHouseFromLagna(asc, sign)
}

function join(parts: readonly string[]): string {
  if (parts.length <= 1) return parts[0] ?? ''
  if (parts.length === 2) return `${parts[0]} and ${parts[1]}`
  return `${parts.slice(0, -1).join(', ')}, and ${parts[parts.length - 1]}`
}

function cap(text: string): string {
  return text ? text.charAt(0).toUpperCase() + text.slice(1) : text
}

function ordinal(n: number): string {
  const mod = n % 10
  if (mod === 1 && n !== 11) return `${n}st`
  if (mod === 2 && n !== 12) return `${n}nd`
  if (mod === 3 && n !== 13) return `${n}rd`
  return `${n}th`
}
