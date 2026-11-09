// ─────────────────────────────────────────────────────────────
//  src/lib/engine/nadi/retrograde.ts
//  Retrograde planets on the birth chart. Rahu and Ketu are
//  always retrograde, and the Sun and Moon never are, so those
//  four are not given a retrograde reading.
//  An exchange reduces the trouble and does not remove it.
//  Saturn keeps the career trouble even in a strong sign.
// ─────────────────────────────────────────────────────────────

import type { Rashi } from '@/types/astrology'
import { getDignity } from '@/lib/engine/dignity'
import {
  RASHI_LORDS,
  wholeSignHouseFromLagna,
  type ClassicalGrahaId,
  type HouseNumber,
} from '@/lib/engine/houseInterpretations'
import { rashiForHouseFromLagna } from '@/lib/engine/rashiInterpretations'
import { nadiAfflictedBy } from '@/lib/engine/nadi/grahas'
import type { NadiGrahaPlacement } from '@/lib/engine/nadi/read'
import { nLang, nSay, type EngineLang } from '@/lib/engine/nadi/text'

const OWN: Partial<Record<ClassicalGrahaId, readonly Rashi[]>> = {
  Su: [5],
  Mo: [4],
  Ma: [1, 8],
  Me: [3, 6],
  Ju: [9, 12],
  Ve: [2, 7],
  Sa: [10, 11],
}

const EXALTED: Partial<Record<ClassicalGrahaId, Rashi>> = {
  Su: 1, Mo: 2, Ma: 10, Me: 6, Ju: 4, Ve: 12, Sa: 7,
}

const DEBILITATED: Partial<Record<ClassicalGrahaId, Rashi>> = {
  Su: 7, Mo: 8, Ma: 4, Me: 12, Ju: 10, Ve: 6, Sa: 1,
}

const STRONG = new Set(['exalted', 'own', 'moolatrikona'])
const DUSTHANA = new Set<HouseNumber>([6, 8, 12])
const READ: readonly ClassicalGrahaId[] = ['Ma', 'Me', 'Ju', 'Ve', 'Sa']

export interface RetrogradeInput {
  ascRashi: Rashi
  grahas: readonly NadiGrahaPlacement[]
  parivartana: readonly { a: HouseNumber; b: HouseNumber }[]
  lang?: EngineLang
}

export interface RetrogradeReading {
  saturn: string | null
  others: string[]
}

export function readRetrograde(input: RetrogradeInput): RetrogradeReading {
  return {
    saturn: saturnNote(input),
    others: otherNotes(input),
  }
}

function saturnNote(input: RetrogradeInput): string | null {
  const saturn = input.grahas.find((g) => g.id === 'Sa')
  if (!saturn?.isRetro) return null
  const L = nLang(input.lang)
  const house = wholeSignHouseFromLagna(input.ascRashi, saturn.rashi)
  let note = house === 5
    ? nSay(L, 'Saturn retrograde in the 5th: a break in education, more than one change of profession, and a direction that settles around the mid-thirties. A change of place is also checked.', 'पाँचवें भाव में वक्री शनि: शिक्षा में रुकावट, एक से अधिक बार पेशे में बदलाव, और ऐसी दिशा जो लगभग पैंतीस वर्ष की आयु के आसपास स्थिर होती है। स्थान परिवर्तन की भी जाँच की जाती है।')
    : nSay(L, 'Saturn retrograde: more than one change of profession, a change of place, and a direction that settles around the mid-thirties. An early success can still break.', 'वक्री शनि: एक से अधिक बार पेशे में बदलाव, स्थान परिवर्तन, और ऐसी दिशा जो लगभग पैंतीस वर्ष की आयु के आसपास स्थिर होती है। शुरुआती सफलता भी टूट सकती है।')
  if (inOwnOrExalted(saturn)) note += nSay(L, ' The sign is strong, and the career trouble is still read.', ' राशि बलवान है, फिर भी करियर की परेशानी पढ़ी जाती है।')
  if (lordStrong(input, 10) && lordStrong(input, 2)) {
    note += nSay(L, ' The 10th lord and the 2nd lord are both strong, so this is the rare case where the trouble is read more lightly. The changes of line still remain.', ' दशमेश और द्वितीयेश दोनों बलवान हैं, इसलिए यह वह दुर्लभ स्थिति है जहाँ परेशानी हल्की पढ़ी जाती है। क्षेत्र के बदलाव फिर भी बने रहते हैं।')
  } else if (exchanged(input, house)) {
    note += nSay(L, ' An exchange on Saturn’s house reduces the trouble, and the changes of line still remain.', ' शनि के भाव पर परिवर्तन योग परेशानी घटाता है, पर क्षेत्र के बदलाव बने रहते हैं।')
  }
  return note
}

function otherNotes(input: RetrogradeInput): string[] {
  const L = nLang(input.lang)
  const notes: string[] = []
  const venus = placed(input, 'Ve')
  if (venus?.isRetro) {
    notes.push(finish(
      input,
      venus,
      nSay(L, 'Venus retrograde: classical texts mention difficulty in marriage, more than one relationship, or a chance that marriage does not happen. They also link it to kidney and reproductive health. See a doctor for real concerns.', 'वक्री शुक्र: शास्त्रीय ग्रंथ विवाह में कठिनाई, एक से अधिक संबंध, या विवाह न होने की संभावना बताते हैं। वे इसे गुर्दे और प्रजनन स्वास्थ्य से भी जोड़ते हैं। वास्तविक चिंता हो तो डॉक्टर से मिलें।'),
      nSay(L, 'the marriage trouble still remains', 'विवाह की परेशानी फिर भी बनी रहती है'),
    ))
  }
  const mercury = placed(input, 'Me')
  if (mercury?.isRetro) {
    notes.push(finish(
      input,
      mercury,
      nSay(L, 'Mercury retrograde: speech is read as very sharp and not to be taken at face value. A change of study is also checked.', 'वक्री बुध: वाणी बहुत तीखी पढ़ी जाती है और उसे शब्दशः नहीं लेना चाहिए। पढ़ाई के विषय में बदलाव की भी जाँच की जाती है।'),
      nSay(L, 'the change of study still remains', 'पढ़ाई का बदलाव फिर भी बना रहता है'),
    ))
  }
  const jupiter = placed(input, 'Ju')
  if (jupiter?.isRetro) {
    notes.push(finish(
      input,
      jupiter,
      nSay(L, 'Jupiter retrograde: childbirth is checked as delayed, lost, or limited to daughters. A break in education is also checked.', 'वक्री गुरु: संतान जन्म में देरी, हानि, या केवल पुत्रियाँ होने की जाँच की जाती है। शिक्षा में रुकावट की भी जाँच की जाती है।'),
      nSay(L, 'the childbirth reading still remains', 'संतान वाला फल फिर भी बना रहता है'),
    ))
  }
  const mars = placed(input, 'Ma')
  if (mars?.isRetro) {
    notes.push(finish(
      input,
      mars,
      nSay(L, 'Mars retrograde: a long dispute over property, and a dispute with siblings, are checked.', 'वक्री मंगल: संपत्ति को लेकर लंबे विवाद, और भाई-बहनों से विवाद, की जाँच की जाती है।'),
      nSay(L, 'the dispute still remains', 'विवाद फिर भी बना रहता है'),
    ))
  }

  const fifthLord = lordOf(input.ascRashi, 5)
  const fifthLordPlanet = input.grahas.find((g) => g.id === fifthLord)
  const saturnInFifth = fifthLordPlanet?.id === 'Sa'
    && fifthLordPlanet.isRetro
    && wholeSignHouseFromLagna(input.ascRashi, fifthLordPlanet.rashi) === 5
  const retroFifth = input.grahas.some((g) => (
    g.isRetro && READ.includes(g.id) && g.id !== 'Sa' && wholeSignHouseFromLagna(input.ascRashi, g.rashi) === 5
  ))
  if (fifthLordPlanet?.isRetro && READ.includes(fifthLordPlanet.id) && !saturnInFifth) {
    notes.push(nSay(L, 'The 5th lord is retrograde, so the course of study is left.', 'पंचमेश वक्री है, इसलिए पढ़ाई का पाठ्यक्रम छूट जाता है।'))
  } else if (retroFifth) {
    notes.push(nSay(L, 'A retrograde planet in the 5th: a break or a change of study.', 'पाँचवें भाव में वक्री ग्रह: पढ़ाई में रुकावट या विषय में बदलाव।'))
  }

  const seventhLord = lordOf(input.ascRashi, 7)
  const seventh = input.grahas.find((g) => g.id === seventhLord)
  if (seventh?.isRetro && READ.includes(seventh.id)) {
    notes.push(nSay(L, 'The 7th lord is retrograde. Late marriage and a separation are read together. One of them is not picked out on its own.', 'सप्तमेश वक्री है। देर से विवाह और अलगाव साथ पढ़े जाते हैं। इनमें से किसी एक को अलग से नहीं चुना जाता।'))
  }
  return notes
}

function finish(input: RetrogradeInput, planet: NadiGrahaPlacement, base: string, remains: string): string {
  const L = nLang(input.lang)
  let note = base
  const kind = signKind(planet, input.grahas)
  if (kind === 'strong') note += nSay(L, ' The sign is strong, so the result is read as powerful.', ' राशि बलवान है, इसलिए फल प्रबल पढ़ा जाता है।')
  if (kind === 'weak') note += nSay(L, ' The planet is weak, so the result is read as heavy.', ' ग्रह कमज़ोर है, इसलिए फल भारी पढ़ा जाता है।')
  const house = wholeSignHouseFromLagna(input.ascRashi, planet.rashi)
  if (exchanged(input, house)) note += nSay(L, ` An exchange on this house reduces the trouble, and ${remains}.`, ` इस भाव पर परिवर्तन योग परेशानी घटाता है, पर ${remains}।`)
  return note
}

function signKind(planet: NadiGrahaPlacement, grahas: readonly NadiGrahaPlacement[]): 'strong' | 'weak' | 'open' {
  if (inOwnOrExalted(planet)) return 'strong'
  const co = grahas.filter((g) => g.rashi === planet.rashi).map((g) => g.id)
  if (planet.rashi === DEBILITATED[planet.id] || nadiAfflictedBy(planet.id, co).length > 0) return 'weak'
  return 'open'
}

function inOwnOrExalted(planet: NadiGrahaPlacement): boolean {
  return planet.rashi === EXALTED[planet.id] || (OWN[planet.id]?.includes(planet.rashi) ?? false)
}

function lordStrong(input: RetrogradeInput, house: HouseNumber): boolean {
  const lord = lordOf(input.ascRashi, house)
  const planet = input.grahas.find((g) => g.id === lord)
  if (!planet) return false
  const dignity = planet.dignity || getDignity(planet.id, planet.rashi, planet.degree ?? 15)
  const houseOfLord = wholeSignHouseFromLagna(input.ascRashi, planet.rashi)
  const co = input.grahas.filter((g) => g.rashi === planet.rashi).map((g) => g.id)
  return STRONG.has(dignity) && !DUSTHANA.has(houseOfLord) && nadiAfflictedBy(lord, co).length === 0
}

function exchanged(input: RetrogradeInput, house: HouseNumber): boolean {
  return input.parivartana.some((pair) => pair.a === house || pair.b === house)
}

function placed(input: RetrogradeInput, id: ClassicalGrahaId): NadiGrahaPlacement | undefined {
  return input.grahas.find((g) => g.id === id)
}

function lordOf(asc: Rashi, house: HouseNumber): ClassicalGrahaId {
  const sign = rashiForHouseFromLagna(asc, house)
  return RASHI_LORDS.find((row) => row.number === sign)?.lord ?? 'Su'
}
