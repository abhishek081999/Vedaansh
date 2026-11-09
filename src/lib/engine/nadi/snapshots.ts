// ─────────────────────────────────────────────────────────────
//  src/lib/engine/nadi/snapshots.ts
//  D1 snapshot rules. Conjunction is same-sign only.
//  Aspect is used where a rule names it, and it is not yuti.
//  Teaching associations, not a diagnosis.
// ─────────────────────────────────────────────────────────────

import { GRAHA_NAMES, RASHI_NAMES } from '@/types/astrology'
import type { Rashi } from '@/types/astrology'
import { getDignity } from '@/lib/engine/dignity'
import {
  RASHI_LORDS,
  wholeSignHouseFromLagna,
  type ClassicalGrahaId,
  type HouseNumber,
} from '@/lib/engine/houseInterpretations'
import { rashiForHouseFromLagna } from '@/lib/engine/rashiInterpretations'
import { NADI_PAPA_GRAHAS, nadiHouses } from '@/lib/engine/nadi/houses'
import { nG, nLang, nOrd, nR, nSay, type EngineLang } from '@/lib/engine/nadi/text'
import { nadiConjunct, type NadiYogaPlacement } from '@/lib/engine/nadi/yogas'
import { houseCountedFrom } from '@/lib/engine/nadi/rotation'

const WATER: readonly Rashi[] = [4, 8, 12]
const PAPA = new Set<string>(NADI_PAPA_GRAHAS)

/** Special aspects counted from the planet’s sign. Every other graha aspects the 7th. */
const ASPECT_STEPS: Partial<Record<ClassicalGrahaId, readonly number[]>> = {
  Ma: [4, 7, 8],
  Ju: [5, 7, 9],
  Sa: [3, 7, 10],
}

export interface NadiSnapshot {
  id: string
  house: HouseNumber | null
  reading: string
}

export interface NadiWealthWindow {
  id: string
  lordName: string
  reason: string
}

export interface NadiSnapshotInput {
  ascRashi: Rashi
  grahas: readonly NadiYogaPlacement[]
  parivartana: readonly { a: HouseNumber; b: HouseNumber }[]
  dashaLords?: readonly ClassicalGrahaId[]
  lang?: EngineLang
}

export function nadiAspectsSign(from: Rashi, id: ClassicalGrahaId, target: Rashi): boolean {
  const steps = ASPECT_STEPS[id] ?? [7]
  return steps.some((step) => houseCountedFrom(from, step) === target)
}

export function findNadiSnapshots(input: NadiSnapshotInput): NadiSnapshot[] {
  const L = nLang(input.lang)
  const t = (en: string, hi: string) => nSay(L, en, hi)
  const { ascRashi: asc, grahas } = input
  const hits: NadiSnapshot[] = []
  const houseOfSign = (sign: Rashi) => wholeSignHouseFromLagna(asc, sign)

  const saturn = grahas.find((g) => g.id === 'Sa')
  const mars = grahas.find((g) => g.id === 'Ma')
  const maleficOn = (sign: Rashi) => (
    (!!saturn && (saturn.rashi === sign || nadiAspectsSign(saturn.rashi, 'Sa', sign)))
    || (!!mars && (mars.rashi === sign || nadiAspectsSign(mars.rashi, 'Ma', sign)))
  )
  const saturnOn = (sign: Rashi) => (
    !!saturn && (saturn.rashi === sign || nadiAspectsSign(saturn.rashi, 'Sa', sign))
  )

  const sunMercury = nadiConjunct(grahas, ['Su', 'Me'])
  if (sunMercury && WATER.includes(sunMercury[0].rashi) && maleficOn(sunMercury[0].rashi)) {
    const parental = sunMercury[0].rashi === 8 && (
      nadiConjunct(grahas, ['Ma', 'Su']) || nadiConjunct(grahas, ['Ma', 'Me'])
    ) && saturnOn(8)
    if (!parental) {
      hits.push({
        id: 'su-me-water',
        house: houseOfSign(sunMercury[0].rashi),
        reading: t('Sun and Mercury are together in a water sign, and Saturn or Mars sits with them or aspects them. Cancer is the form checked for the person or an immediate relative.', 'सूर्य और बुध जल राशि में साथ हैं, और शनि या मंगल उनके साथ बैठा है या उन पर दृष्टि डालता है। व्यक्ति या निकट संबंधी के लिए कैंसर रोग के रूप की जाँच की जाती है।'),
      })
    }
  }

  const marsSun = nadiConjunct(grahas, ['Ma', 'Su'])
  const marsMercury = nadiConjunct(grahas, ['Ma', 'Me'])
  const marsPairInScorpio = (marsSun?.[0].rashi === 8) || (marsMercury?.[0].rashi === 8)
  if (marsPairInScorpio && saturnOn(8)) {
    hits.push({
      id: 'scorpio-parents',
      house: houseOfSign(8),
      reading: t('Mars is with the Sun or Mercury in Scorpio, and Saturn sits with them or aspects them. Cancer is the form checked for both parents.', 'वृश्चिक में मंगल सूर्य या बुध के साथ है, और शनि उनके साथ बैठा है या उन पर दृष्टि डालता है। माता-पिता दोनों के लिए कैंसर रोग के रूप की जाँच की जाती है।'),
    })
  }

  const jupiterSaturn = nadiConjunct(grahas, ['Ju', 'Sa'])
  if (jupiterSaturn) {
    hits.push(destroyed(input, 'ju-sa', t('Jupiter and Saturn are together. The house they occupy is read as destroyed.', 'गुरु और शनि साथ हैं। जिस भाव में वे बैठे हैं, वह नष्ट पढ़ा जाता है।'), jupiterSaturn[0].rashi, L))
  }

  if (saturn && WATER.includes(saturn.rashi)) {
    const hit = destroyed(
      input,
      'sa-water-capricorn',
      t('Saturn is in a water sign, so the houses it rules do not deliver their good results. The house of Capricorn is read as destroyed.', 'शनि जल राशि में है, इसलिए जिन भावों का वह स्वामी है वे अपने शुभ फल नहीं देते। मकर राशि वाला भाव नष्ट पढ़ा जाता है।'),
      10,
      L,
    )
    hits.push(hit)
  }

  if (sunMercury && (sunMercury[0].rashi === 12 || sunMercury[0].rashi === 6)) {
    hits.push(destroyed(
      input,
      'su-me-pisces',
      t('Sun and Mercury are together in Pisces or Virgo. The house of Pisces is read as destroyed.', 'सूर्य और बुध मीन या कन्या में साथ हैं। मीन राशि वाला भाव नष्ट पढ़ा जाता है।'),
      12,
      L,
    ))
  }

  const ninth = spineReading(input, L)
  if (ninth) hits.push(ninth)

  if ((asc === 2 || asc === 7) && nadiConjunct(grahas, ['Ma', 'Ju'])?.[0].rashi === 10) {
    hits.push({
      id: 'separation-capricorn',
      house: houseOfSign(10),
      reading: t('Taurus or Libra lagna with Mars and Jupiter together in Capricorn. This combination is read as a separation.', 'वृषभ या तुला लग्न, और मकर में मंगल और गुरु साथ। यह योग अलगाव के रूप में पढ़ा जाता है।'),
    })
  }

  const jupiter = grahas.find((g) => g.id === 'Ju')
  if (jupiter && (asc === 4 || asc === 8 || asc === 12)) {
    const jupiterHouse = houseOfSign(jupiter.rashi)
    if (jupiterHouse === 3 || jupiterHouse === 6 || jupiterHouse === 8 || jupiterHouse === 11) {
      hits.push({
        id: 'separation-water-jupiter',
        house: jupiterHouse,
        reading: t(
          `A water-sign lagna with Jupiter in the ${ordinal(jupiterHouse)}. Married life is read as under strain, with a separation and a possible later marriage. Jupiter aspecting the 7th does not cancel this.`,
          `जल राशि का लग्न और ${nOrd(jupiterHouse, 'hi')} भाव में गुरु। वैवाहिक जीवन दबाव में पढ़ा जाता है, अलगाव और बाद में संभावित दूसरे विवाह के साथ। गुरु की सातवें भाव पर दृष्टि इसे रद्द नहीं करती।`,
        ),
      })
    }
  }

  const ketu = grahas.find((g) => g.id === 'Ke')
  if (ketu) {
    const house = houseOfSign(ketu.rashi)
    const parts = nadiHouses(L)[house].bodyParts.slice(0, 3).join(', ')
    hits.push({
      id: 'ketu-mark',
      house,
      reading: t(`Ketu in the ${ordinal(house)}: a mark, cut, or scar is checked on ${parts}.`, `${nOrd(house, 'hi')} भाव में केतु: ${parts} पर निशान, कट या घाव की जाँच की जाती है।`),
    })
  }

  return hits
}

export function findWealthWindows(input: NadiSnapshotInput): NadiWealthWindow[] {
  const L = nLang(input.lang)
  const secondSign = rashiForHouseFromLagna(input.ascRashi, 2)
  const secondLord = RASHI_LORDS.find((row) => row.number === secondSign)?.lord
  const seen = new Set<ClassicalGrahaId>()
  const windows: NadiWealthWindow[] = []
  for (const id of input.dashaLords ?? []) {
    if (seen.has(id)) continue
    seen.add(id)
    const placed = input.grahas.find((g) => g.id === id)
    const reasons: string[] = []
    if (id === secondLord) reasons.push(nSay(L, 'the lord of the 2nd', 'द्वितीयेश'))
    if (placed && wholeSignHouseFromLagna(input.ascRashi, placed.rashi) === 2 && placedDignity(placed) === 'exalted') {
      reasons.push(nSay(L, 'exalted in the 2nd', 'दूसरे भाव में उच्च का'))
    }
    if (reasons.length === 0) continue
    windows.push({
      id: `wealth-${id}`,
      lordName: L === 'hi' ? nG(id, L) : GRAHA_NAMES[id],
      reason: reasons.join(nSay(L, ', and ', ', और ')),
    })
  }
  return windows
}

function destroyed(
  input: NadiSnapshotInput,
  id: string,
  lead: string,
  sign: Rashi,
  L: EngineLang = 'en',
): NadiSnapshot {
  const house = wholeSignHouseFromLagna(input.ascRashi, sign)
  const profile = nadiHouses(L)[house]
  const living = [profile.relatives.slice(0, 3).join(', '), profile.bodyParts.slice(0, 2).join(', ')]
    .filter((part) => part.length > 0)
    .join('; ')
  let reading = nSay(L,
    `${lead} That is the ${ordinal(house)} (${RASHI_NAMES[sign]}). Living significations under pressure: ${living}.`,
    `${lead} यह ${nOrd(house, 'hi')} भाव (${nR(sign, 'hi')}) है। दबाव में आने वाले जीवित कारकत्व: ${living}।`)
  if (house === 9 || house === 10) {
    reading += nSay(L, ' Father is read from both the 9th and the 10th.', ' पिता नौवें और दसवें दोनों भावों से पढ़े जाते हैं।')
  }
  if (input.parivartana.some((pair) => pair.a === house || pair.b === house)) {
    reading += nSay(L, ' An exchange of the lord of this house may hold the result back.', ' इस भाव के स्वामी का परिवर्तन योग फल को रोक सकता है।')
  }
  return { id, house, reading }
}

function spineReading(input: NadiSnapshotInput, L: EngineLang): NadiSnapshot | null {
  const sign = rashiForHouseFromLagna(input.ascRashi, 9)
  const lord = RASHI_LORDS.find((row) => row.number === sign)?.lord
  if (!lord) return null
  const placed = input.grahas.find((g) => g.id === lord)
  if (!placed || placedDignity(placed) !== 'debilitated') return null
  const housePapa = input.grahas.some((g) => PAPA.has(g.id) && wholeSignHouseFromLagna(input.ascRashi, g.rashi) === 9)
  const lordPapa = input.grahas.some((g) => g.id !== lord && PAPA.has(g.id) && nadiConjunct(input.grahas, [lord, g.id]))
  if (!housePapa || !lordPapa) return null
  return {
    id: 'spine-9',
    house: 9,
    reading: nSay(L, 'The 9th is afflicted and its lord is debilitated and afflicted. Back and spine trouble is checked, and it rises with the affliction.', 'नौवाँ भाव पीड़ित है और उसका स्वामी नीच का और पीड़ित है। पीठ और रीढ़ की तकलीफ़ की जाँच की जाती है, और पीड़ा के साथ यह बढ़ती है।'),
  }
}

function placedDignity(g: NadiYogaPlacement): string {
  if (g.dignity) return g.dignity
  return getDignity(g.id, g.rashi, g.degree ?? 15)
}

function ordinal(n: number): string {
  const mod = n % 10
  if (mod === 1 && n !== 11) return `${n}st`
  if (mod === 2 && n !== 12) return `${n}nd`
  if (mod === 3 && n !== 13) return `${n}rd`
  return `${n}th`
}
