// ─────────────────────────────────────────────────────────────
//  src/lib/engine/nadi/patel.ts
//  C.S. Patel’s three natal points: the 22nd drekkana (Khara),
//  the 64th Navamsha, and the Bhrigu Bindu.
//  A hard period is checked. The form of it is not named.
// ─────────────────────────────────────────────────────────────

import type { Rashi } from '@/types/astrology'
import { GRAHA_NAMES, RASHI_NAMES } from '@/types/astrology'
import { D9 } from '@/lib/engine/vargas'
import {
  RASHI_LORDS,
  wholeSignHouseFromLagna,
  type ClassicalGrahaId,
  type HouseNumber,
} from '@/lib/engine/houseInterpretations'
import { rashiForHouseFromLagna } from '@/lib/engine/rashiInterpretations'
import { nG, nJoin, nLang, nR, nSay, type EngineLang } from '@/lib/engine/nadi/text'

export const NADI_PATEL_NOTE =
  'C.S. Patel reads the 22nd drekkana from the lagna and from the Moon, the 64th Navamsha from each of those, and the Bhrigu Bindu. The drekkana is a 10° band. The 64th Navamsha is the 4th of Navamsha. Jupiter on the Bhrigu Bindu is the fortune year. Jupiter on the 7th lord’s Navamsha, on Venus’s Navamsha, or on the Upapada is watched for marriage. Jupiter on Saturn’s Navamsha is watched for work. A period of the point’s lord times it. These lines check a hard period. They do not name its form.'

export const NADI_PATEL_NOTE_HI =
  'सी. एस. पटेल लग्न और चंद्र से 22वाँ द्रेष्काण, इन दोनों से 64वाँ नवांश, और भृगु बिंदु पढ़ते हैं। द्रेष्काण 10° की पट्टी है। 64वाँ नवांश नवांश का चौथा भाव है। भृगु बिंदु पर गुरु भाग्य का वर्ष है। सप्तमेश के नवांश, शुक्र के नवांश, या उपपद पर गुरु विवाह के लिए देखा जाता है। शनि के नवांश पर गुरु काम के लिए देखा जाता है। उस बिंदु के स्वामी की दशा इसका समय तय करती है। ये पंक्तियाँ कठिन अवधि की जाँच करती हैं। ये उसका रूप नहीं बतातीं।'

const PORTION = ['first', 'middle', 'last'] as const
const PORTION_HI: Record<string, string> = { first: 'पहले', middle: 'बीच के', last: 'अंतिम' }

export interface PatelPoint {
  id: string
  title: string
  sign: Rashi
  signName: string
  lordName: string
  house: HouseNumber
  running: boolean
  reading: string
}

export interface PatelReading {
  note: string
  points: PatelPoint[]
  lines: string[]
}

export interface PatelInput {
  ascRashi: Rashi
  ascDegree?: number
  grahas: readonly { id: ClassicalGrahaId; rashi: Rashi; degree?: number }[]
  navamsha?: Partial<Record<ClassicalGrahaId, Rashi>>
  navamshaLagna?: Rashi
  upapada?: Rashi
  bhriguBindu?: number
  dashaLords?: readonly ClassicalGrahaId[]
  lang?: EngineLang
}

function lordOfSign(sign: Rashi): ClassicalGrahaId {
  return RASHI_LORDS.find((row) => row.number === sign)?.lord ?? 'Su'
}

function longitude(rashi: Rashi, degree: number | undefined): number | null {
  if (degree == null || !Number.isFinite(degree) || degree < 0 || degree >= 30) return null
  return (rashi - 1) * 30 + degree
}

function signOf(lon: number): Rashi {
  const norm = ((lon % 360) + 360) % 360
  return (Math.floor(norm / 30) + 1) as Rashi
}

function inBand(lon: number, start: number): boolean {
  const n = ((lon % 360) + 360) % 360
  const s = ((start % 360) + 360) % 360
  const end = s + 10
  if (end <= 360) return n >= s && n < end
  return n >= s || n < end - 360
}

function kharaOf(lon: number): { sign: Rashi; start: number; portion: string } {
  const index = (Math.floor((((lon % 360) + 360) % 360) / 10) + 21) % 36
  return {
    sign: (Math.floor(index / 3) + 1) as Rashi,
    start: index * 10,
    portion: PORTION[index % 3] ?? 'first',
  }
}

function fourthFrom(sign: Rashi): Rashi {
  return rashiForHouseFromLagna(sign, 4)
}

function sixtyFourth(lon: number): Rashi {
  return D9(lon + 210) as Rashi
}

function joinNames(names: readonly string[]): string {
  if (names.length <= 1) return names[0] ?? ''
  if (names.length === 2) return `${names[0]} and ${names[1]}`
  return `${names.slice(0, -1).join(', ')}, and ${names[names.length - 1]}`
}

function point(input: PatelInput, row: {
  id: string
  title: string
  sign: Rashi
  reading: string
}): PatelPoint {
  const lord = lordOfSign(row.sign)
  const running = (input.dashaLords ?? []).includes(lord)
  const L = nLang(input.lang)
  const reading = running
    ? nSay(L,
      `${row.reading} The period of ${GRAHA_NAMES[lord]} is open, so this point is timed now.`,
      `${row.reading} ${nG(lord, 'hi')} की दशा खुली है, इसलिए यह बिंदु अभी समय में आता है।`)
    : row.reading
  return {
    id: row.id,
    title: row.title,
    sign: row.sign,
    signName: L === 'hi' ? nR(row.sign, L) : RASHI_NAMES[row.sign],
    lordName: L === 'hi' ? nG(lord, L) : GRAHA_NAMES[lord],
    house: wholeSignHouseFromLagna(input.ascRashi, row.sign),
    running,
    reading,
  }
}

function bandSentence(input: PatelInput, start: number): string {
  const ids = input.grahas.flatMap((planet) => {
    const lon = longitude(planet.rashi, planet.degree)
    if (lon == null || !inBand(lon, start)) return []
    return [planet.id]
  })
  const names = ids.map((id) => GRAHA_NAMES[id])
  const known = input.grahas.some((planet) => longitude(planet.rashi, planet.degree) != null)
  if (input.lang === 'hi') {
    if (ids.length >= 1) return `उस 10° की पट्टी में ${nJoin(ids.map((id) => nG(id, 'hi')), 'hi')} ${ids.length === 1 ? 'है' : 'हैं'}।`
    if (!known) return 'ग्रहों के अंश उपलब्ध नहीं हैं, इसलिए 10° की पट्टी की जाँच नहीं की जाती।'
    return 'उस 10° की पट्टी में कोई ग्रह नहीं है।'
  }
  if (names.length === 1) return `${names[0]} sits in that 10° band.`
  if (names.length > 1) return `${joinNames(names)} sit in that 10° band.`
  if (!known) return 'Planet degrees are missing, so the 10° band is not checked.'
  return 'No planet sits in that 10° band.'
}

function navamshaSentence(input: PatelInput, sign: Rashi): string {
  const ids = input.grahas.flatMap((planet) => (input.navamsha?.[planet.id] === sign ? [planet.id] : []))
  const names = ids.map((id) => GRAHA_NAMES[id])
  if (input.lang === 'hi') {
    if (!input.navamsha) return 'नवांश स्थितियाँ उपलब्ध नहीं हैं, इसलिए इस नवांश में बैठे ग्रहों की जाँच नहीं की जाती।'
    if (ids.length >= 1) return `इस नवांश में ${nJoin(ids.map((id) => nG(id, 'hi')), 'hi')} ${ids.length === 1 ? 'है' : 'हैं'}।`
    return 'इस नवांश में कोई ग्रह नहीं है।'
  }
  if (!input.navamsha) return 'Navamsha positions are missing, so occupants of this Navamsha are not checked.'
  if (names.length === 1) return `${names[0]} sits in this Navamsha.`
  if (names.length > 1) return `${joinNames(names)} sit in this Navamsha.`
  return 'No planet sits in this Navamsha.'
}

export function readPatel(input: PatelInput): PatelReading {
  const L = nLang(input.lang)
  const R = (sign: Rashi) => nR(sign, 'hi')
  const G = (sign: Rashi) => nG(lordOfSign(sign), 'hi')
  const points: PatelPoint[] = []
  const lines: string[] = []
  const lords = input.dashaLords ?? []

  const lagnaLon = longitude(input.ascRashi, input.ascDegree)
  if (lagnaLon != null) {
    const khara = kharaOf(lagnaLon)
    points.push(point(input, {
      id: 'khara-lagna',
      title: nSay(L, '22nd drekkana · lagna', '22वाँ द्रेष्काण · लग्न'),
      sign: khara.sign,
      reading: nSay(L,
        `The 22nd drekkana from the lagna is the ${khara.portion} 10° of ${RASHI_NAMES[khara.sign]}. Its lord is ${GRAHA_NAMES[lordOfSign(khara.sign)]}. ${bandSentence(input, khara.start)} Health, an accident, or a hard turn is checked when this lord’s period runs.`,
        `लग्न से 22वाँ द्रेष्काण ${R(khara.sign)} के ${PORTION_HI[khara.portion]} 10° हैं। इसका स्वामी ${G(khara.sign)} है। ${bandSentence(input, khara.start)} इस स्वामी की दशा चलने पर स्वास्थ्य, दुर्घटना, या कठिन मोड़ की जाँच की जाती है।`),
    }))
  }

  const moon = input.grahas.find((planet) => planet.id === 'Mo')
  const moonLon = moon ? longitude(moon.rashi, moon.degree) : null
  if (moonLon != null) {
    const khara = kharaOf(moonLon)
    points.push(point(input, {
      id: 'khara-moon',
      title: nSay(L, '22nd drekkana · Moon', '22वाँ द्रेष्काण · चंद्र'),
      sign: khara.sign,
      reading: nSay(L,
        `The 22nd drekkana from the Moon is the ${khara.portion} 10° of ${RASHI_NAMES[khara.sign]}. Its lord is ${GRAHA_NAMES[lordOfSign(khara.sign)]}. ${bandSentence(input, khara.start)} The mind and the mother are checked when this lord’s period runs.`,
        `चंद्र से 22वाँ द्रेष्काण ${R(khara.sign)} के ${PORTION_HI[khara.portion]} 10° हैं। इसका स्वामी ${G(khara.sign)} है। ${bandSentence(input, khara.start)} इस स्वामी की दशा चलने पर मन और माता की जाँच की जाती है।`),
    }))
  } else if (moon) {
    lines.push(nSay(L, 'The Moon’s degree is missing, so its 22nd drekkana is not read.', 'चंद्र का अंश उपलब्ध नहीं है, इसलिए उसका 22वाँ द्रेष्काण नहीं पढ़ा जाता।'))
  }

  const lagnaSixth = input.navamshaLagna != null
    ? fourthFrom(input.navamshaLagna)
    : lagnaLon != null
      ? sixtyFourth(lagnaLon)
      : null
  if (lagnaSixth != null) {
    points.push(point(input, {
      id: 'navamsha-64-lagna',
      title: nSay(L, '64th Navamsha · lagna', '64वाँ नवांश · लग्न'),
      sign: lagnaSixth,
      reading: nSay(L,
        `The 64th Navamsha from the lagna is ${RASHI_NAMES[lagnaSixth]}, the 4th of Navamsha. Its lord is ${GRAHA_NAMES[lordOfSign(lagnaSixth)]}. ${navamshaSentence(input, lagnaSixth)} A hard period for health is checked when this lord’s period runs.`,
        `लग्न से 64वाँ नवांश ${R(lagnaSixth)} है, जो नवांश का चौथा भाव है। इसका स्वामी ${G(lagnaSixth)} है। ${navamshaSentence(input, lagnaSixth)} इस स्वामी की दशा चलने पर स्वास्थ्य के लिए कठिन अवधि की जाँच की जाती है।`),
    }))
  }

  const moonNav = input.navamsha?.Mo ?? (moonLon != null ? (D9(moonLon) as Rashi) : null)
  if (moonNav != null) {
    const sign = fourthFrom(moonNav)
    points.push(point(input, {
      id: 'navamsha-64-moon',
      title: nSay(L, '64th Navamsha · Moon', '64वाँ नवांश · चंद्र'),
      sign,
      reading: nSay(L,
        `The 64th Navamsha from the Moon is ${RASHI_NAMES[sign]}. Its lord is ${GRAHA_NAMES[lordOfSign(sign)]}. ${navamshaSentence(input, sign)} The mind and the mother are checked when this lord’s period runs.`,
        `चंद्र से 64वाँ नवांश ${R(sign)} है। इसका स्वामी ${G(sign)} है। ${navamshaSentence(input, sign)} इस स्वामी की दशा चलने पर मन और माता की जाँच की जाती है।`),
    }))
  }

  if (input.bhriguBindu != null && Number.isFinite(input.bhriguBindu)) {
    const sign = signOf(input.bhriguBindu)
    lines.push(nSay(L,
      `The Bhrigu Bindu falls in ${RASHI_NAMES[sign]}. Jupiter in that sign is read as fortune. A trine of that sign is the lighter year.`,
      `भृगु बिंदु ${R(sign)} में पड़ता है। उस राशि में गुरु भाग्य के रूप में पढ़ा जाता है। उस राशि का त्रिकोण हल्का वर्ष है।`))
  }

  const watch: string[] = []
  const watchHi: string[] = []
  const seventh = lordOfSign(rashiForHouseFromLagna(input.ascRashi, 7))
  const seventhSign = input.navamsha?.[seventh]
  if (seventhSign != null) {
    watch.push(`${RASHI_NAMES[seventhSign]} (Navamsha of the 7th lord)`)
    watchHi.push(`${R(seventhSign)} (सप्तमेश का नवांश)`)
  }
  if (input.navamsha?.Ve != null) {
    watch.push(`${RASHI_NAMES[input.navamsha.Ve]} (Venus’s Navamsha)`)
    watchHi.push(`${R(input.navamsha.Ve)} (शुक्र का नवांश)`)
  }
  if (input.upapada != null) {
    watch.push(`${RASHI_NAMES[input.upapada]} (Upapada)`)
    watchHi.push(`${R(input.upapada)} (उपपद)`)
  }
  const unique = [...new Set(watch)]
  const uniqueHi = [...new Set(watchHi)]
  if (unique.length > 0) {
    lines.push(nSay(L,
      `Marriage is watched when Jupiter reaches ${joinNames(unique)}.`,
      `जब गुरु ${nJoin(uniqueHi, 'hi')} पर पहुँचे, तब विवाह के लिए देखा जाता है।`))
  }
  if (input.navamsha?.Sa != null) {
    lines.push(nSay(L,
      `Work is watched when Jupiter reaches ${RASHI_NAMES[input.navamsha.Sa]}, Saturn’s Navamsha.`,
      `जब गुरु शनि के नवांश ${R(input.navamsha.Sa)} पर पहुँचे, तब काम के लिए देखा जाता है।`))
  }

  if (lords.length === 0) {
    lines.push(nSay(L, 'No Vimshottari period is open, so these points are not timed.', 'कोई विंशोत्तरी दशा खुली नहीं है, इसलिए इन बिंदुओं का समय तय नहीं होता।'))
  }

  return { note: nSay(L, NADI_PATEL_NOTE, NADI_PATEL_NOTE_HI), points, lines }
}
