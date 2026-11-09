// ─────────────────────────────────────────────────────────────
//  src/lib/engine/nadi/marriage.ts
//  Marriage combinations. Same-sign conjunction only.
//  Checked on the birth chart and on Navamsha as its own chart.
//  Teaching associations, not a verdict on a person’s marriage.
// ─────────────────────────────────────────────────────────────

import { RASHI_NAMES } from '@/types/astrology'
import {
  RASHI_LORDS,
  wholeSignHouseFromLagna,
  type ClassicalGrahaId,
  type HouseNumber,
} from '@/lib/engine/houseInterpretations'
import { rashiForHouseFromLagna } from '@/lib/engine/rashiInterpretations'
import { nadiAfflictedBy } from '@/lib/engine/nadi/grahas'
import {
  nadiClosenessClause,
  nadiConjunctionGrade,
  nadiConjunct,
  type NadiYogaChart,
  type NadiYogaChartInput,
  type NadiYogaPlacement,
} from '@/lib/engine/nadi/yogas'
import { nLang, nOrd, nR, nSay, type EngineLang } from '@/lib/engine/nadi/text'

export const NADI_MARRIAGE_SCOPE =
  'Read this on the person first, then on parents or siblings. It is not read on a maternal uncle or aunt. A result already present in the family is the combination that has shown. Otherwise it stays open for the person or the children.'

export const NADI_MARRIAGE_BOND =
  'A bond held for a full year in body, mind, and feeling is read from the 7th. A shorter bond is read from the 5th.'

export const NADI_MARRIAGE_HEALTH =
  'When a separation is not what shows, the same Venus is checked for the kidneys, uterus, and reproductive organs, for the person or an immediate relative.'

export const NADI_MARRIAGE_SCOPE_HI =
  'इसे पहले व्यक्ति पर पढ़ें, फिर माता-पिता या भाई-बहनों पर। इसे मामा या मौसी पर नहीं पढ़ा जाता। परिवार में पहले से मौजूद फल वही योग है जो प्रकट हो चुका है। अन्यथा यह व्यक्ति या संतान के लिए खुला रहता है।'

export const NADI_MARRIAGE_BOND_HI =
  'शरीर, मन और भावना से पूरे एक वर्ष टिका संबंध सातवें भाव से पढ़ा जाता है। इससे छोटा संबंध पाँचवें भाव से पढ़ा जाता है।'

export const NADI_MARRIAGE_HEALTH_HI =
  'जब अलगाव नहीं दिखता, तब उसी शुक्र से व्यक्ति या निकट संबंधी के गुर्दे, गर्भाशय और प्रजनन अंगों की जाँच की जाती है।'

const DEF_HI: Record<string, { name: string; reading: string }> = {
  've-ma-ra': { name: 'शुक्र + मंगल + राहु', reading: 'इन विवाह योगों में सबसे प्रबल। अलगाव, विवाहेतर संबंध, और भागकर विवाह, इन रूपों की जाँच की जाती है। संबंध में भरोसे की भी जाँच की जाती है।' },
  've-ma-ke': { name: 'शुक्र + मंगल + केतु', reading: 'बहुत प्रबल विवाह योग। अलगाव, विवाहेतर संबंध, और भागकर विवाह, इन रूपों की जाँच की जाती है।' },
  've-mo-ra': { name: 'शुक्र + चंद्र + राहु', reading: 'विवाहेतर संबंध, भागकर विवाह, और सास-बहू (माता और पत्नी) के बीच टकराव। विवाह के बाद जन्मस्थान से दूर रहने की जाँच की जाती है।' },
  've-mo-ke': { name: 'शुक्र + चंद्र + केतु', reading: 'विवाहेतर संबंध, भागकर विवाह, और सास-बहू (माता और पत्नी) के बीच टकराव। विवाह के बाद जन्मस्थान से दूर रहने की जाँच की जाती है।' },
  've-me-ra': { name: 'शुक्र + बुध + राहु', reading: 'विवाहेतर संबंध और लगातार वैवाहिक परेशानी, इन रूपों की जाँच की जाती है।' },
  've-me-ke': { name: 'शुक्र + बुध + केतु', reading: 'विवाहेतर संबंध और लगातार वैवाहिक परेशानी, इन रूपों की जाँच की जाती है।' },
  've-sa-ra': { name: 'शुक्र + शनि + राहु', reading: 'अलगाव, दो विवाह, और देरी, इन रूपों की जाँच की जाती है। इसके भीतर का शनि-शुक्र जोड़ा, विवाह के फल से अलग, धन के रूप में भी पढ़ा जाता है।' },
  've-sa-ke': { name: 'शुक्र + शनि + केतु', reading: 'अलगाव, दो विवाह, और देरी, इन रूपों की जाँच की जाती है। इसके भीतर का शनि-शुक्र जोड़ा, विवाह के फल से अलग, धन के रूप में भी पढ़ा जाता है।' },
  've-ma': { name: 'शुक्र + मंगल', reading: 'आवेग, जल्दबाज़ी में विवाह, और विवाह में टकराव, इन रूपों की जाँच की जाती है। संपत्ति और वाहन की भी जाँच की जाती है।' },
  've-sa': { name: 'शनि + शुक्र', reading: 'अलगाव, देर से विवाह या विवाह न होना, उम्र में बड़ा साथी, या लगातार बीमार रहने वाला जीवनसाथी। शनि की गरिमा इसे नहीं बदलती। यही जोड़ा, विवाह से अलग पढ़ा जाने वाला, एक प्रबल धन योग है।' },
  've-mo': { name: 'शुक्र + चंद्र', reading: 'विवाहेतर संबंध, भागकर विवाह, सास-बहू (माता और पत्नी) के बीच टकराव, और विवाह के बाद जन्मस्थान से दूर रहना।' },
  've-ra': { name: 'शुक्र + राहु', reading: 'विवाह का मध्यम जोखिम। यह कभी-कभी शांत रहता है, और मंगल या चंद्र के जुड़ने पर अधिक प्रबल होता है।' },
  've-ke': { name: 'शुक्र + केतु', reading: 'विवाह का मध्यम जोखिम, शुक्र-राहु से थोड़ा हल्का। यह कभी-कभी शांत रहता है।' },
  've-su': { name: 'सूर्य + शुक्र', reading: 'संतान जन्म और प्रजनन अंग, इन रूपों की जाँच की जाती है। शुक्र इन अंगों का स्वामी है।' },
}

export interface NadiMarriageYoga {
  id: string
  name: string
  chart: NadiYogaChart
  house: HouseNumber
  signName: string
  reading: string
  organs: boolean
}

interface MarriageDef {
  id: string
  name: string
  planets: readonly ClassicalGrahaId[]
  reading: string
  organs: boolean
  suppresses: readonly string[]
}

const DEFS: readonly MarriageDef[] = [
  {
    id: 've-ma-ra',
    name: 'Venus + Mars + Rahu',
    planets: ['Ve', 'Ma', 'Ra'],
    reading: 'The strongest of these marriage combinations. Separation, affairs, and running away to marry are the forms checked. Trust in the relationship is also checked.',
    organs: true,
    suppresses: ['ve-ra', 've-ma'],
  },
  {
    id: 've-ma-ke',
    name: 'Venus + Mars + Ketu',
    planets: ['Ve', 'Ma', 'Ke'],
    reading: 'A very strong marriage combination. Separation, affairs, and running away to marry are the forms checked.',
    organs: true,
    suppresses: ['ve-ke', 've-ma'],
  },
  {
    id: 've-mo-ra',
    name: 'Venus + Moon + Rahu',
    planets: ['Ve', 'Mo', 'Ra'],
    reading: 'Affairs, running away to marry, and conflict between mother and wife. Living away from the birthplace after marriage is checked.',
    organs: true,
    suppresses: ['ve-mo', 've-ra'],
  },
  {
    id: 've-mo-ke',
    name: 'Venus + Moon + Ketu',
    planets: ['Ve', 'Mo', 'Ke'],
    reading: 'Affairs, running away to marry, and conflict between mother and wife. Living away from the birthplace after marriage is checked.',
    organs: true,
    suppresses: ['ve-mo', 've-ke'],
  },
  {
    id: 've-me-ra',
    name: 'Venus + Mercury + Rahu',
    planets: ['Ve', 'Me', 'Ra'],
    reading: 'Affairs and ongoing marital trouble are the forms checked.',
    organs: true,
    suppresses: ['ve-ra'],
  },
  {
    id: 've-me-ke',
    name: 'Venus + Mercury + Ketu',
    planets: ['Ve', 'Me', 'Ke'],
    reading: 'Affairs and ongoing marital trouble are the forms checked.',
    organs: true,
    suppresses: ['ve-ke'],
  },
  {
    id: 've-sa-ra',
    name: 'Venus + Saturn + Rahu',
    planets: ['Ve', 'Sa', 'Ra'],
    reading: 'Separation, two marriages, and delay are the forms checked. The Saturn and Venus pair inside it is also read as wealth, apart from the marriage result.',
    organs: true,
    suppresses: ['ve-sa', 've-ra'],
  },
  {
    id: 've-sa-ke',
    name: 'Venus + Saturn + Ketu',
    planets: ['Ve', 'Sa', 'Ke'],
    reading: 'Separation, two marriages, and delay are the forms checked. The Saturn and Venus pair inside it is also read as wealth, apart from the marriage result.',
    organs: true,
    suppresses: ['ve-sa', 've-ke'],
  },
  {
    id: 've-ma',
    name: 'Venus + Mars',
    planets: ['Ve', 'Ma'],
    reading: 'Passion, a hurried marriage, and conflict in the marriage are the forms checked. Property and a vehicle are also checked.',
    organs: true,
    suppresses: [],
  },
  {
    id: 've-sa',
    name: 'Saturn + Venus',
    planets: ['Sa', 'Ve'],
    reading: 'Separation, a late marriage or none, an older partner, or a spouse who stays ill. Saturn’s dignity does not change this. The same pair is a strong wealth combination, read apart from the marriage.',
    organs: true,
    suppresses: [],
  },
  {
    id: 've-mo',
    name: 'Venus + Moon',
    planets: ['Ve', 'Mo'],
    reading: 'Affairs, running away to marry, conflict between mother and wife, and living away from the birthplace after marriage.',
    organs: false,
    suppresses: [],
  },
  {
    id: 've-ra',
    name: 'Venus + Rahu',
    planets: ['Ve', 'Ra'],
    reading: 'A moderate marriage risk. It is sometimes quiet, and it is stronger when Mars or the Moon joins.',
    organs: true,
    suppresses: [],
  },
  {
    id: 've-ke',
    name: 'Venus + Ketu',
    planets: ['Ve', 'Ke'],
    reading: 'A moderate marriage risk, a little softer than Venus with Rahu. It is sometimes quiet.',
    organs: true,
    suppresses: [],
  },
  {
    id: 've-su',
    name: 'Sun + Venus',
    planets: ['Su', 'Ve'],
    reading: 'Childbirth and the reproductive organs are the forms checked. Venus rules those organs.',
    organs: false,
    suppresses: [],
  },
]

export function findMarriageYogas(input: NadiYogaChartInput): NadiMarriageYoga[] {
  const L = nLang(input.lang)
  const t = (en: string, hi: string) => nSay(L, en, hi)
  const hits: NadiMarriageYoga[] = []
  const signs = [...new Set(input.grahas.map((g) => g.rashi))]
  for (const sign of signs) {
    const inSign = input.grahas.filter((g) => g.rashi === sign)
    const matched = DEFS.filter((def) => nadiConjunct(inSign, def.planets))
    const dropped = new Set(matched.flatMap((def) => def.suppresses))
    for (const def of matched) {
      if (dropped.has(def.id)) continue
      let reading = t(def.reading, DEF_HI[def.id]?.reading ?? def.reading)
      const closeness = nadiClosenessClause(nadiConjunctionGrade(inSign, def.planets), L)
      if (closeness) reading += ` ${closeness}`
      if (def.id === 've-sa' && nadiConjunct(inSign, ['Ve', 'Sa', 'Ju'])) {
        reading += t(' Jupiter sitting with them may soften the marriage result. Saturn and Venus stay the pair to read.', ' उनके साथ बैठा गुरु विवाह के फल को नरम कर सकता है। फिर भी पढ़ने वाला जोड़ा शनि और शुक्र ही है।')
      }
      const hit = toHit(input, def, sign, reading, L)
      if (def.id === 've-ra' && hit.house === 7) {
        hit.reading += t(' In the 7th house, classical Nadi texts describe this as a delay in marriage, a separation, or a loss in the marriage. The texts give the possibilities and do not fix an outcome.', ' सातवें भाव में, शास्त्रीय नाड़ी ग्रंथ इसे विवाह में देरी, अलगाव, या विवाह में हानि बताते हैं। ग्रंथ संभावनाएँ बताते हैं, कोई निश्चित परिणाम तय नहीं करते।')
      }
      if (input.chart === 'D9' && def.id === 've-ke') {
        hit.reading += t(' In Navamsha, a second marriage is the form checked.', ' नवांश में दूसरे विवाह के रूप की जाँच की जाती है।')
      }
      hits.push(hit)
    }
  }
  const ketu = input.grahas.find((g) => g.id === 'Ke')
  if (ketu && wholeSignHouseFromLagna(input.ascRashi, ketu.rashi) === 7) {
    hits.push({
      id: `${input.chart}-ke-7`,
      name: t('Ketu in the 7th', 'सातवें भाव में केतु'),
      chart: input.chart,
      house: 7,
      signName: L === 'hi' ? nR(ketu.rashi, L) : RASHI_NAMES[ketu.rashi],
      organs: false,
      reading: t('The early passing of the spouse is the form checked. This is not read as a separation.', 'जीवनसाथी के जल्दी निधन के रूप की जाँच की जाती है। इसे अलगाव के रूप में नहीं पढ़ा जाता।'),
    })
  }
  if (input.chart === 'D9') {
    const marsRahu = input.grahas.find((g) => g.id === 'Ma')
    if (marsRahu && nadiConjunct(input.grahas, ['Ma', 'Ra'])) {
      const closeness = nadiClosenessClause(nadiConjunctionGrade(input.grahas, ['Ma', 'Ra']), L)
      hits.push({
        id: `${input.chart}-ma-ra-second`,
        name: t('Mars + Rahu', 'मंगल + राहु'),
        chart: input.chart,
        house: wholeSignHouseFromLagna(input.ascRashi, marsRahu.rashi),
        signName: L === 'hi' ? nR(marsRahu.rashi, L) : RASHI_NAMES[marsRahu.rashi],
        organs: false,
        reading: `${t('In Navamsha, a second marriage is the form checked.', 'नवांश में दूसरे विवाह के रूप की जाँच की जाती है।')}${closeness ? ` ${closeness}` : ''}`,
      })
    }
    const seventhSign = rashiForHouseFromLagna(input.ascRashi, 7)
    const seventhLord = RASHI_LORDS.find((row) => row.number === seventhSign)?.lord
    const placed = seventhLord ? input.grahas.find((g) => g.id === seventhLord) : undefined
    if (seventhLord && placed) {
      const co = input.grahas.filter((g) => g.rashi === placed.rashi).map((g) => g.id)
      if (nadiAfflictedBy(seventhLord, co).length > 0) {
        hits.push({
          id: `${input.chart}-7th-lord`,
          name: t('7th lord of Navamsha', 'नवांश का सप्तमेश'),
          chart: input.chart,
          house: wholeSignHouseFromLagna(input.ascRashi, placed.rashi),
          signName: L === 'hi' ? nR(placed.rashi, L) : RASHI_NAMES[placed.rashi],
          organs: false,
          reading: t('The 7th lord of Navamsha is afflicted. A separation or a second marriage is the form checked.', 'नवांश का सप्तमेश पीड़ित है। अलगाव या दूसरे विवाह के रूप की जाँच की जाती है।'),
        })
      }
    }
    const axis = navamshaAxis(input.ascRashi, input.grahas, L)
    if (axis) hits.push(axis)
  }
  const repeated = mutableExchange(input, L)
  if (repeated) hits.push(repeated)
  return hits
}

export function marriageSummary(yoga: NadiMarriageYoga, lang?: EngineLang): string {
  if (yoga.id.endsWith('node-axis')) return yoga.reading
  if (lang === 'hi') {
    const chart = yoga.chart === 'D9' ? 'नवांश' : 'जन्म कुंडली'
    return `${yoga.name} (${chart}, ${yoga.signName}, ${nOrd(yoga.house, 'hi')} भाव)। ${yoga.reading}`
  }
  const chart = yoga.chart === 'D9' ? 'Navamsha' : 'Birth chart'
  return `${yoga.name} (${chart}, ${yoga.signName}, ${ordinal(yoga.house)}). ${yoga.reading}`
}

export function marriageNote(yogas: readonly NadiMarriageYoga[], lang?: EngineLang): string | null {
  if (yogas.length === 0) return null
  const L = nLang(lang)
  const parts = [nSay(L, NADI_MARRIAGE_SCOPE, NADI_MARRIAGE_SCOPE_HI), nSay(L, NADI_MARRIAGE_BOND, NADI_MARRIAGE_BOND_HI)]
  if (yogas.length > 1) parts.push(nSay(L, 'More than one of these is present, so the marriage reading is stronger.', 'इनमें से एक से अधिक योग मौजूद हैं, इसलिए विवाह का फल अधिक प्रबल है।'))
  if (yogas.some((yoga) => yoga.organs)) parts.push(nSay(L, NADI_MARRIAGE_HEALTH, NADI_MARRIAGE_HEALTH_HI))
  return parts.join(' ')
}

function toHit(input: NadiYogaChartInput, def: MarriageDef, sign: NadiYogaPlacement['rashi'], reading: string, L: EngineLang = 'en'): NadiMarriageYoga {
  return {
    id: `${input.chart}-${def.id}`,
    name: L === 'hi' ? DEF_HI[def.id]?.name ?? def.name : def.name,
    chart: input.chart,
    house: wholeSignHouseFromLagna(input.ascRashi, sign),
    signName: L === 'hi' ? nR(sign, L) : RASHI_NAMES[sign],
    reading,
    organs: def.organs,
  }
}

function mutableExchange(input: NadiYogaChartInput, L: EngineLang): NadiMarriageYoga | null {
  const mutable = input.ascRashi === 3 || input.ascRashi === 6 || input.ascRashi === 9 || input.ascRashi === 12
  if (input.chart !== 'D1' || !mutable) return null
  const mercury = input.grahas.find((g) => g.id === 'Me')
  const jupiter = input.grahas.find((g) => g.id === 'Ju')
  if (!mercury || !jupiter) return null
  const mercuryInJupiter = mercury.rashi === 9 || mercury.rashi === 12
  const jupiterInMercury = jupiter.rashi === 3 || jupiter.rashi === 6
  if (!mercuryInJupiter || !jupiterInMercury) return null
  const kendra = (rashi: NadiYogaPlacement['rashi']) => {
    const house = wholeSignHouseFromLagna(input.ascRashi, rashi)
    return house === 1 || house === 4 || house === 7 || house === 10
  }
  if (!kendra(mercury.rashi) || !kendra(jupiter.rashi)) return null
  return {
    id: 'D1-me-ju-kendra',
    name: nSay(L, 'Jupiter–Mercury exchange', 'गुरु–बुध परिवर्तन योग'),
    chart: 'D1',
    house: wholeSignHouseFromLagna(input.ascRashi, mercury.rashi),
    signName: L === 'hi' ? nR(mercury.rashi, L) : RASHI_NAMES[mercury.rashi],
    organs: false,
    reading: nSay(L, 'Jupiter and Mercury exchange in the angles. Two or three marriages are the form checked.', 'गुरु और बुध केंद्रों में परिवर्तन योग बनाते हैं। दो या तीन विवाह, इस रूप की जाँच की जाती है।'),
  }
}

function navamshaAxis(asc: NadiYogaChartInput['ascRashi'], grahas: readonly NadiYogaPlacement[], L: EngineLang): NadiMarriageYoga | null {
  const onAxis = grahas.some((g) => {
    if (g.id !== 'Ra' && g.id !== 'Ke') return false
    const house = wholeSignHouseFromLagna(asc, g.rashi)
    return house === 1 || house === 7
  })
  if (!onAxis) return null
  return {
    id: 'D9-node-axis',
    name: nSay(L, 'Rahu or Ketu on the Navamsha 1–7 axis', 'नवांश की 1–7 धुरी पर राहु या केतु'),
    chart: 'D9',
    house: 1,
    signName: nSay(L, 'axis', 'धुरी'),
    organs: false,
    reading: nSay(L, 'Rahu or Ketu in the 1st or 7th of Navamsha is read as a separation, a very late marriage, or no marriage.', 'नवांश के पहले या सातवें भाव में राहु या केतु अलगाव, बहुत देर से विवाह, या विवाह न होने के रूप में पढ़ा जाता है।'),
  }
}

function ordinal(n: number): string {
  const mod = n % 10
  if (mod === 1 && n !== 11) return `${n}st`
  if (mod === 2 && n !== 12) return `${n}nd`
  if (mod === 3 && n !== 13) return `${n}rd`
  return `${n}th`
}
