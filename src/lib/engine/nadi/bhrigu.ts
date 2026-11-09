// ─────────────────────────────────────────────────────────────
//  src/lib/engine/nadi/bhrigu.ts
//  Bhrigu Bhava on the birth chart only. The house number
//  matches the lagna sign. A hard result and a blessing can
//  both show. Affliction is a conjunction, and Jupiter with
//  Ketu is not one. This is not the Bhrigu Bindu.
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
import { nadiAspectsSign } from '@/lib/engine/nadi/snapshots'
import { nadiConjunct, type NadiYogaPlacement } from '@/lib/engine/nadi/yogas'
import type { EngineLang } from '@/lib/engine/lang'
import { nG, nJoin, nLang, nOrd, nR, nSay } from '@/lib/engine/nadi/text'

export const NADI_BHRIGU_NOTE =
  'The Bhrigu Bhava is the house with the same number as the lagna sign. It is read on the birth chart. Planets in that house, and the planets with its lord, are the past-life carry. A blessing and a hard result can both show. Affliction is a conjunction with a difficult planet. Jupiter with Ketu is not an affliction. Exaltation alone is not that test. This house is not the Bhrigu Bindu.'

const ORDER: readonly ClassicalGrahaId[] = ['Su', 'Mo', 'Ma', 'Me', 'Ju', 'Ve', 'Sa', 'Ra', 'Ke']
const PAPA = new Set<ClassicalGrahaId>(['Ma', 'Sa', 'Ra', 'Ke'])
const BENEFIC = new Set<ClassicalGrahaId>(['Ju', 'Ve', 'Me', 'Mo'])
const WEALTH = new Set<HouseNumber>([2, 5, 9, 11])
const DURGA: readonly (readonly [ClassicalGrahaId, ClassicalGrahaId])[] = [
  ['Ma', 'Ra'],
  ['Ma', 'Ke'],
  ['Sa', 'Ra'],
  ['Sa', 'Ke'],
  ['Su', 'Ra'],
  ['Su', 'Ke'],
  ['Mo', 'Ra'],
  ['Mo', 'Ke'],
]

type Placement = NadiYogaPlacement

export function bhriguBhavaNotes(input: {
  ascRashi: Rashi
  grahas: readonly Placement[]
  parivartana?: readonly { a: HouseNumber; b: HouseNumber }[]
  lang?: EngineLang
}): { house: HouseNumber; notes: string[] } {
  const lang = nLang(input.lang)
  const lagna = input.ascRashi
  const house = lagna as HouseNumber
  const sign = rashiForHouseFromLagna(lagna, house)
  const lordId = signLord(sign)
  const lord = placed(input.grahas, lordId)
  const notes: string[] = [
    nSay(
      lang,
      `The lagna is ${RASHI_NAMES[lagna]}, so the Bhrigu Bhava is the ${ordinal(house)}. It is the past-life house on the birth chart.`,
      `लग्न ${nR(lagna, 'hi')} है, इसलिए भृगु भाव ${nOrd(house, 'hi')} है। यह जन्म कुंडली पर पूर्वजन्म का भाव है।`,
    ),
  ]

  const occupants = ORDER.filter((id) => {
    const planet = placed(input.grahas, id)
    return planet != null && planet.rashi === sign
  })
  if (occupants.length) {
    const enNames = joinNames(occupants.map((id) => GRAHA_NAMES[id]))
    const hiNames = nJoin(occupants.map((id) => nG(id, 'hi')), 'hi')
    notes.push(occupants.length === 1
      ? nSay(lang, `${enNames} sits in the Bhrigu Bhava.`, `${hiNames} भृगु भाव में बैठा है।`)
      : nSay(lang, `${enNames} sit in the Bhrigu Bhava.`, `${hiNames} भृगु भाव में बैठे हैं।`))
  } else {
    notes.push(nSay(lang, 'No planet sits in the Bhrigu Bhava. The lord carries the reading.', 'भृगु भाव में कोई ग्रह नहीं बैठा। स्वामी पढ़ाई ले जाता है।'))
  }

  if (input.parivartana?.some((pair) => pair.a === house || pair.b === house)) {
    notes.push(nSay(lang, 'An exchange takes in the Bhrigu Bhava. That exchange is part of this reading.', 'भृगु भाव में परिवर्तन है। वह परिवर्तन इस पढ़ाई का अंग है।'))
  }

  if (lord) {
    const lordHouse = wholeSignHouseFromLagna(lagna, lord.rashi)
    const withLord = ORDER.filter((id) => id !== lordId && conjunct(input.grahas, lordId, id))
    const company = withLord.length
      ? nSay(lang, ` ${GRAHA_NAMES[lordId]} is with ${joinNames(withLord.map((id) => GRAHA_NAMES[id]))}.`, ` ${nG(lordId, 'hi')} ${nJoin(withLord.map((id) => nG(id, 'hi')), 'hi')} के साथ है।`)
      : ''
    notes.push(nSay(
      lang,
      `The lord, ${GRAHA_NAMES[lordId]}, sits in the ${ordinal(lordHouse)}.${withLord.length ? ` ${GRAHA_NAMES[lordId]} is with ${joinNames(withLord.map((id) => GRAHA_NAMES[id]))}.` : ''}`,
      `स्वामी ${nG(lordId, 'hi')} ${nOrd(lordHouse, 'hi')} भाव में बैठा है।${company}`,
    ))
    if (WEALTH.has(lordHouse)) {
      notes.push(nSay(
        lang,
        `The lord sits in the ${ordinal(lordHouse)}. Wealth is read from that, from the family or from the person's own work.`,
        `स्वामी ${nOrd(lordHouse, 'hi')} भाव में बैठा है। धन वहाँ से पढ़ा जाता है, परिवार से या व्यक्ति के अपने कार्य से।`,
      ))
    }
  }

  const exempt = conjunct(input.grahas, 'Ju', 'Ke')
  const housePapa = occupants.filter((id) => PAPA.has(id) && !(id === 'Ke' && exempt))
  const lordPapa = lord
    ? ORDER.filter((id) => PAPA.has(id) && id !== lordId && conjunct(input.grahas, lordId, id) && !(id === 'Ke' && exempt))
    : []
  const afflicting = unique([...housePapa, ...lordPapa])
  if (afflicting.length) {
    const extremeEn = afflicting.includes('Ra') ? ' With Rahu, the result is read as extreme.' : ''
    const extremeHi = afflicting.includes('Ra') ? ' राहु के साथ फल तीव्र पढ़ा जाता है।' : ''
    const enNames = joinNames(afflicting.map((id) => GRAHA_NAMES[id]))
    const hiNames = nJoin(afflicting.map((id) => nG(id, 'hi')), 'hi')
    notes.push(afflicting.length === 1
      ? nSay(lang, `${enNames} afflicts the Bhrigu Bhava. Struggle, health, or a fall is checked.${extremeEn}`, `${hiNames} भृगु भाव को पीड़ित करता है। संघर्ष, स्वास्थ्य या पतन जाँचा जाता है।${extremeHi}`)
      : nSay(lang, `${enNames} afflict the Bhrigu Bhava. Struggle, health, or a fall is checked.${extremeEn}`, `${hiNames} भृगु भाव को पीड़ित करते हैं। संघर्ष, स्वास्थ्य या पतन जाँचा जाता है।${extremeHi}`))
  }
  if (exempt && (occupants.includes('Ke') || (lord != null && conjunct(input.grahas, lordId, 'Ke')))) {
    notes.push(nSay(lang, 'Jupiter with Ketu is not read as an affliction of this house.', 'गुरु के साथ केतु इस भाव की पीड़ा नहीं पढ़ा जाता।'))
  }

  const exalted = unique([
    ...occupants.filter((id) => dignityOf(placed(input.grahas, id)!) === 'exalted'),
    ...(lord && dignityOf(lord) === 'exalted' ? [lordId] : []),
  ])
  if (exalted.length) {
    const enNames = joinNames(exalted.map((id) => GRAHA_NAMES[id]))
    const hiNames = nJoin(exalted.map((id) => nG(id, 'hi')), 'hi')
    notes.push(exalted.length === 1
      ? nSay(lang, `${enNames} is exalted. A blessing is read from the Bhrigu Bhava.`, `${hiNames} उच्च है। भृगु भाव से आशीर्वाद पढ़ा जाता है।`)
      : nSay(lang, `${enNames} are exalted. A blessing is read from the Bhrigu Bhava.`, `${hiNames} उच्च हैं। भृगु भाव से आशीर्वाद पढ़ा जाता है।`))
  }
  const plainBenefic = occupants.filter((id) => BENEFIC.has(id) && !exalted.includes(id))
  if (plainBenefic.length) {
    const enNames = joinNames(plainBenefic.map((id) => GRAHA_NAMES[id]))
    const hiNames = nJoin(plainBenefic.map((id) => nG(id, 'hi')), 'hi')
    notes.push(plainBenefic.length === 1
      ? nSay(lang, `${enNames} sits in the Bhrigu Bhava. A blessing is read.`, `${hiNames} भृगु भाव में बैठा है। आशीर्वाद पढ़ा जाता है।`)
      : nSay(lang, `${enNames} sit in the Bhrigu Bhava. A blessing is read.`, `${hiNames} भृगु भाव में बैठे हैं। आशीर्वाद पढ़ा जाता है।`))
  }
  if (lord && dignityOf(lord) === 'debilitated') {
    notes.push(nSay(lang, `The lord, ${GRAHA_NAMES[lordId]}, is debilitated. A struggle is checked.`, `स्वामी ${nG(lordId, 'hi')} नीच है। संघर्ष जाँचा जाता है।`))
  }

  if (pairOnReading(input.grahas, lagna, house, lordId, ['Me', 'Ve'])) {
    notes.push(nSay(lang, 'Mercury and Venus are together on this reading. Wealth is read from that pair.', 'बुध और शुक्र इस पढ़ाई पर साथ हैं। धन उस जोड़ी से पढ़ा जाता है।'))
  } else if (lord && aspectsLord(input.grahas, lord, 'Me') && aspectsLord(input.grahas, lord, 'Ve')) {
    notes.push(nSay(lang, 'Mercury and Venus aspect the Bhrigu Bhava lord. Wealth is read from that.', 'बुध और शुक्र भृगु भाव के स्वामी को देख रहे हैं। धन वहाँ से पढ़ा जाता है।'))
  }

  if (nadiConjunct(input.grahas, ['Ju', 'Ra']) && pairOnReading(input.grahas, lagna, house, lordId, ['Ju', 'Ra'])) {
    notes.push(nSay(lang, 'Jupiter with Rahu is read for fame, and a mark on that fame is checked.', 'गुरु के साथ राहु यश के लिए पढ़ा जाता है, और उस यश पर चिह्न जाँचा जाता है।'))
  }

  let durga = false
  for (const pair of DURGA) {
    if (!pairOnReading(input.grahas, lagna, house, lordId, pair)) continue
    durga = true
    notes.push(nSay(
      lang,
      `${GRAHA_NAMES[pair[0]]} and ${GRAHA_NAMES[pair[1]]} are a Durga combination on the Bhrigu Bhava. A chronic illness, a surgery, or a serious accident is checked.`,
      `${nG(pair[0], 'hi')} और ${nG(pair[1], 'hi')} भृगु भाव पर दुर्गा योग हैं। दीर्घ रोग, शल्य या गंभीर दुर्घटना जाँची जाती है।`,
    ))
  }
  if (durga && house === 3) {
    notes.push(nSay(lang, 'The 3rd includes the arms in that reading.', 'तीसरे भाव में भुजाएँ भी उस पढ़ाई में आती हैं।'))
  }

  if (pairOnReading(input.grahas, lagna, house, lordId, ['Sa', 'Ma', 'Ra'])) {
    notes.push(nSay(lang, 'Saturn, Mars, and Rahu are together on this reading. A uniformed profession is one option, and an injury is checked.', 'शनि, मंगल और राहु इस पढ़ाई पर साथ हैं। वर्दी वाला पेशा एक विकल्प है, और चोट जाँची जाती है।'))
  }

  if (venusConnects(input.grahas, lordId, lord)) {
    notes.push(nSay(lang, 'Venus connects with the Bhrigu Bhava lord. Healing work, including medicine, is one option.', 'शुक्र भृगु भाव के स्वामी से जुड़ा है। चिकित्सा सहित आरोग्य-कार्य एक विकल्प है।'))
  }

  const jupiter = placed(input.grahas, 'Ju')
  const rahuInFifth = placed(input.grahas, 'Ra')
  if (
    lagna === 5
    && rahuInFifth
    && wholeSignHouseFromLagna(lagna, rahuInFifth.rashi) === 5
    && jupiter
    && wholeSignHouseFromLagna(lagna, jupiter.rashi) === 12
    && dignityOf(jupiter) === 'exalted'
  ) {
    notes.push(nSay(lang, 'Rahu is in the 5th, and Jupiter, its lord, is exalted in the 12th. Delay in marriage and in childbirth is checked. Astrology, teaching, or consulting is also one option.', 'राहु पाँचवें में है, और उसका स्वामी गुरु बारहवें में उच्च है। विवाह और संतान में देरी जाँची जाती है। ज्योतिष, अध्यापन या परामर्श भी एक विकल्प है।'))
  }

  return { house, notes }
}

function pairOnReading(
  grahas: readonly Placement[],
  lagna: Rashi,
  house: HouseNumber,
  lordId: ClassicalGrahaId,
  planets: readonly ClassicalGrahaId[],
): boolean {
  const group = nadiConjunct(grahas, planets)
  if (!group) return false
  const groupHouse = wholeSignHouseFromLagna(lagna, group[0]!.rashi)
  return groupHouse === house || planets.includes(lordId) || groupHouse === houseOf(grahas, lagna, lordId)
}

function venusConnects(grahas: readonly Placement[], lordId: ClassicalGrahaId, lord: Placement | null): boolean {
  if (lordId === 'Ve') return true
  if (!lord) return false
  if (conjunct(grahas, lordId, 'Ve')) return true
  return aspectsLord(grahas, lord, 'Ve')
}

function aspectsLord(grahas: readonly Placement[], lord: Placement, id: ClassicalGrahaId): boolean {
  const planet = placed(grahas, id)
  return planet != null && planet.rashi !== lord.rashi && nadiAspectsSign(planet.rashi, id, lord.rashi)
}

function conjunct(grahas: readonly Placement[], a: ClassicalGrahaId, b: ClassicalGrahaId): boolean {
  return nadiConjunct(grahas, [a, b]) != null
}

function houseOf(grahas: readonly Placement[], lagna: Rashi, id: ClassicalGrahaId): HouseNumber | null {
  const planet = placed(grahas, id)
  return planet ? wholeSignHouseFromLagna(lagna, planet.rashi) : null
}

function dignityOf(planet: Placement): string {
  if (planet.dignity) return planet.dignity
  if (planet.id === 'Ra' || planet.id === 'Ke') return 'neutral'
  return getDignity(planet.id, planet.rashi, planet.degree ?? 15)
}

function placed(grahas: readonly Placement[], id: ClassicalGrahaId): Placement | null {
  return grahas.find((g) => g.id === id) ?? null
}

function signLord(sign: Rashi): ClassicalGrahaId {
  return RASHI_LORDS.find((row) => row.number === sign)?.lord ?? 'Su'
}

function unique(ids: ClassicalGrahaId[]): ClassicalGrahaId[] {
  return ids.filter((id, index) => ids.indexOf(id) === index)
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
