// ─────────────────────────────────────────────────────────────
//  src/lib/engine/nadi/navamsha.ts
//  Navamsha read as its own chart. Houses 1 and 7 judge the
//  marriage. The antardasha of either lord times it.
// ─────────────────────────────────────────────────────────────

import type { Rashi } from '@/types/astrology'
import { GRAHA_NAMES } from '@/types/astrology'
import { nG, nLang, nSay, type EngineLang } from '@/lib/engine/nadi/text'
import {
  RASHI_LORDS,
  wholeSignHouseFromLagna,
  type ClassicalGrahaId,
} from '@/lib/engine/houseInterpretations'
import { rashiForHouseFromLagna } from '@/lib/engine/rashiInterpretations'
import { nadiAspectsSign } from '@/lib/engine/nadi/snapshots'
import { nadiConjunct, type NadiYogaPlacement } from '@/lib/engine/nadi/yogas'

export const NADI_NAVAMSHA_NOTE =
  'Navamsha is read as its own chart. Its 1st and 7th are the marriage houses. The antardasha of either lord is read for marriage or for meeting the partner.'

export const NADI_NAVAMSHA_NOTE_HI =
  'नवांश को एक स्वतंत्र कुंडली की तरह पढ़ा जाता है। इसके पहले और सातवें भाव विवाह के भाव हैं। इन दोनों में से किसी भी भाव के स्वामी की अंतर्दशा विवाह या जीवनसाथी से मिलने के लिए देखी जाती है।'

const LOOKS = new Set<ClassicalGrahaId>(['Ju', 'Ve', 'Mo'])
const HAPPY = new Set<ClassicalGrahaId>(['Ju', 'Ve', 'Mo', 'Me'])

export interface NavamshaPredictionInput {
  ascRashi: Rashi
  grahas: readonly NadiYogaPlacement[]
  navamshaLagna?: Rashi
  navamshaGrahas?: readonly NadiYogaPlacement[]
  dashaLords?: readonly ClassicalGrahaId[]
  lang?: EngineLang
}

export function navamshaPredictionNotes(input: NavamshaPredictionInput): string[] {
  const L = nLang(input.lang)
  const lagna = input.navamshaLagna
  const grahas = input.navamshaGrahas
  if (lagna == null || !grahas?.length) return []

  const lines: string[] = []
  const houses: ('good' | 'bad' | null)[] = []
  for (const house of [1, 7] as const) {
    const ids = grahas
      .filter((g) => wholeSignHouseFromLagna(lagna, g.rashi) === house)
      .map((g) => g.id)
    const label = house === 1 ? '1st' : '7th'
    const hl = house === 1 ? 'पहले' : 'सातवें'
    for (const id of ids) {
      const name = GRAHA_NAMES[id]
      const hn = nG(id, 'hi')
      if (id === 'Ra' || id === 'Ke') {
        lines.push(nSay(L, `The ${label} of Navamsha holds ${name}. Divorce or a separation is checked.`, `नवांश के ${hl} भाव में ${hn} है। तलाक या अलगाव की जाँच की जाती है।`))
      } else if (id === 'Sa') {
        lines.push(nSay(L, `The ${label} of Navamsha holds Saturn. Marriage is read as delayed.`, `नवांश के ${hl} भाव में शनि है। विवाह में देरी पढ़ी जाती है।`))
      } else if (id === 'Su') {
        lines.push(nSay(L, `The ${label} of Navamsha holds the Sun. The spouse is read as influential, and proud.`, `नवांश के ${hl} भाव में सूर्य है। जीवनसाथी प्रभावशाली और स्वाभिमानी पढ़ा जाता है।`))
      } else if (LOOKS.has(id)) {
        lines.push(nSay(L, `The ${label} of Navamsha holds ${name}. The marriage is read as happy and stable, and the spouse as good-looking.`, `नवांश के ${hl} भाव में ${hn} है। विवाह सुखी और स्थिर, और जीवनसाथी सुंदर पढ़ा जाता है।`))
      } else if (id === 'Me') {
        lines.push(nSay(L, `The ${label} of Navamsha holds Mercury. The marriage is read as happy and stable.`, `नवांश के ${hl} भाव में बुध है। विवाह सुखी और स्थिर पढ़ा जाता है।`))
      }
    }
    houses.push(ids.some((id) => id === 'Ra' || id === 'Ke') ? 'bad' : ids.some((id) => HAPPY.has(id)) ? 'good' : null)
  }

  const jupiter = grahas.find((g) => g.id === 'Ju')
  if (jupiter && jupiter.rashi !== lagna && nadiAspectsSign(jupiter.rashi, 'Ju', lagna)) {
    lines.push(nSay(L, 'Jupiter aspects the Navamsha lagna. That supports the marriage.', 'गुरु की नवांश लग्न पर दृष्टि है। यह विवाह को सहारा देती है।'))
  }

  const antar = input.dashaLords?.[1]
  if (antar) {
    const first = signLord(lagna)
    const seventh = signLord(rashiForHouseFromLagna(lagna, 7))
    const which = antar === first ? '1st' : antar === seventh ? '7th' : null
    if (which) {
      const name = GRAHA_NAMES[antar]
      const hn = nG(antar, 'hi')
      const hw = which === '1st' ? 'पहले' : 'सातवें'
      lines.push(nSay(L, `The antardasha of ${name} is running. ${name} rules the ${which} of Navamsha, so this period is read for marriage or for meeting the partner. The two can fall in different periods of these lords.`, `${hn} की अंतर्दशा चल रही है। ${hn} नवांश के ${hw} भाव का स्वामी है, इसलिए यह अवधि विवाह या जीवनसाथी से मिलने के लिए पढ़ी जाती है। ये दोनों घटनाएँ इन स्वामियों की अलग-अलग अवधियों में भी हो सकती हैं।`))
    }
  }

  const d1Seventh = input.grahas
    .filter((g) => wholeSignHouseFromLagna(input.ascRashi, g.rashi) === 7)
    .map((g) => g.id)
  const d1 = d1Seventh.some((id) => id === 'Ra' || id === 'Ke') ? 'bad' : d1Seventh.some((id) => HAPPY.has(id)) ? 'good' : null
  const d9 = houses.includes('bad') ? 'bad' : houses.includes('good') ? 'good' : null
  if (d1 && d9) lines.push(compare(d1, d9, L))

  const fourth = signLord(rashiForHouseFromLagna(lagna, 4))
  const eleventh = signLord(rashiForHouseFromLagna(lagna, 11))
  if (fourth !== eleventh && nadiConjunct(grahas, [fourth, eleventh])) {
    lines.push(nSay(L, 'The 4th lord and the 11th lord of Navamsha are together. Property and gains are read from that combination.', 'नवांश के चतुर्थेश और एकादशेश साथ हैं। संपत्ति और लाभ इसी योग से पढ़े जाते हैं।'))
  }

  return lines
}

function compare(d1: 'good' | 'bad', d9: 'good' | 'bad', L: EngineLang): string {
  if (d1 === 'good' && d9 === 'good') return nSay(L, 'The 7th of the birth chart and Navamsha both support the marriage. The result is read as excellent.', 'जन्म कुंडली का सातवाँ भाव और नवांश दोनों विवाह को सहारा देते हैं। परिणाम उत्तम पढ़ा जाता है।')
  if (d1 === 'bad' && d9 === 'good') return nSay(L, 'The 7th of the birth chart is hard for marriage. Navamsha still supports it.', 'जन्म कुंडली का सातवाँ भाव विवाह के लिए कठिन है। फिर भी नवांश उसे सहारा देता है।')
  if (d1 === 'good' && d9 === 'bad') return nSay(L, 'The 7th of the birth chart supports the marriage. Navamsha reduces it.', 'जन्म कुंडली का सातवाँ भाव विवाह को सहारा देता है। नवांश उसे घटाता है।')
  return nSay(L, 'The 7th of the birth chart and Navamsha are both hard for marriage.', 'जन्म कुंडली का सातवाँ भाव और नवांश दोनों विवाह के लिए कठिन हैं।')
}

function signLord(sign: Rashi): ClassicalGrahaId {
  return RASHI_LORDS.find((row) => row.number === sign)?.lord ?? 'Su'
}
