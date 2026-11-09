// ─────────────────────────────────────────────────────────────
//  src/lib/engine/jaimini/karakamsha.ts
//  Karakamsha is the Atmakaraka's navamsha sign, read in the
//  birth chart. Swamsha uses that sign as lagna and places
//  navamsha planets by whole sign from it. It is a support chart.
// ─────────────────────────────────────────────────────────────

import type { GrahaId, Rashi } from '@/types/astrology'
import { GRAHA_NAMES, RASHI_NAMES } from '@/types/astrology'
import { getRashiDrishti } from './aspects'
import { karakamshaDirection, karakamshaSupport, swamshaUsage } from './judgment'
import { resolveSignLord } from './trinity'
import { jG, jLang, jR, say, type EngineLang } from '../locale/jaiminiLang'
import { KARAKAMSHA_THEME_HI } from '../locale/jaiminiKarakamsha.hi'

const CLASSICAL: GrahaId[] = ['Su', 'Mo', 'Ma', 'Me', 'Ju', 'Ve', 'Sa', 'Ra', 'Ke']

const HOUSE_THEME = [
  '',
  'Identity the soul is living through',
  'Family resources and speech',
  'Courage, siblings, and skills',
  'Home, property, and the emotional base',
  'Children, intelligence, and mantra',
  'Obstacles, disease, and competition',
  'Spouse and partners',
  'Transformation and what stays hidden',
  'Teachers, dharma, and fortune',
  'Career and public work',
  'Gains, networks, and income',
  'Release, foreign places, and moksha',
] as const

export interface KarakamshaHouseRow {
  house: number
  rashi: Rashi
  rashiName: string
  theme: string
  d1: GrahaId[]
  d9: GrahaId[]
}

export interface KarakamshaTheme {
  id: 'career' | 'creation' | 'home' | 'spouse' | 'business' | 'spiritual' | 'struggles'
  title: string
  text: string
}

export interface KarakamshaReading {
  ak: GrahaId
  karakamsha: Rashi
  swamsha: Rashi
  swamshaFallback: boolean
  alignment: string
  usage: string
  direction: string
  support: string
  houses: KarakamshaHouseRow[]
  themes: KarakamshaTheme[]
}

interface Placed {
  id: GrahaId
  rashi: Rashi
  degree?: number
}

function houseFrom(seed: Rashi, house: number): Rashi {
  return ((((seed - 1) + (house - 1)) % 12) + 1) as Rashi
}

function classical(grahas: Placed[]): Placed[] {
  return grahas.filter(g => CLASSICAL.includes(g.id))
}

function inSign(grahas: Placed[], sign: Rashi): GrahaId[] {
  return classical(grahas).filter(g => g.rashi === sign).map(g => g.id)
}

function names(ids: GrahaId[], lang: EngineLang = 'en'): string {
  const L = jLang(lang)
  if (!ids.length) return say(L, 'no planet', 'कोई ग्रह नहीं')
  return ids.map(id => (L === 'hi' ? jG(id, L) : GRAHA_NAMES[id])).join(', ')
}

function signOf(grahas: Placed[], id: GrahaId): Rashi | null {
  return grahas.find(g => g.id === id)?.rashi ?? null
}

export function readKarakamsha(input: {
  d1: Placed[]
  d9: Placed[]
  lagna: Rashi
  arudhaLagna: Rashi
  ak: GrahaId
  amk: GrahaId
  dk: GrahaId
  lang?: EngineLang
}): KarakamshaReading {
  const L = jLang(input.lang)
  const d1 = classical(input.d1)
  const d9 = classical(input.d9)
  const akD9 = signOf(d9, input.ak)
  const akD1 = signOf(d1, input.ak)
  const swamshaFallback = akD9 == null
  const karakamsha = (akD9 ?? akD1 ?? 1) as Rashi
  const swamsha = karakamsha

  const houses: KarakamshaHouseRow[] = []
  for (let house = 1; house <= 12; house++) {
    const rashi = houseFrom(karakamsha, house)
    houses.push({
      house,
      rashi,
      rashiName: L === 'hi' ? jR(rashi, L) : RASHI_NAMES[rashi],
      theme: L === 'hi' ? KARAKAMSHA_THEME_HI[house] : HOUSE_THEME[house],
      d1: inSign(d1, rashi),
      d9: inSign(d9, rashi),
    })
  }

  const row = (house: number) => houses[house - 1]
  const amkSign = signOf(d1, input.amk)
  const dkSign = signOf(d1, input.dk)
  const dkD9 = signOf(d9, input.dk)

  const h4 = row(4)
  const h5 = row(5)
  const h7 = row(7)
  const h9 = row(9)
  const h10 = row(10)
  const h11 = row(11)
  const h12 = row(12)
  const placed = d1.map(g => ({ id: g.id, rashi: g.rashi, degree: g.degree ?? 0 }))
  const tenthLord = resolveSignLord(h10.rashi, placed)
  const tenthLordSign = signOf(d1, tenthLord)
  const aspectingTenth = d1.filter(g => g.rashi !== h10.rashi && getRashiDrishti(g.rashi).includes(h10.rashi))
  const withAkInD9 = d9.filter(g => g.rashi === karakamsha && g.id !== input.ak)
  const akInKarakamsha = signOf(d1, input.ak) === karakamsha
  const who = (ids: GrahaId[]) => names(ids, L)
  const planet = (id: GrahaId) => (L === 'hi' ? jG(id, L) : GRAHA_NAMES[id])
  const signName = (sign: Rashi | null) => (sign == null ? say(L, 'an unknown sign', 'अज्ञात राशि') : (L === 'hi' ? jR(sign, L) : RASHI_NAMES[sign]))
  const careerExtra = [
    say(L, `The lord of that 10th is ${planet(tenthLord)}${tenthLordSign ? ` in ${signName(tenthLordSign)}` : ''}.`, `उस दसवें का स्वामी ${planet(tenthLord)} है${tenthLordSign ? `, ${signName(tenthLordSign)} में` : ''}।`),
    aspectingTenth.length
      ? say(L, `Planets aspecting the 10th: ${who(aspectingTenth.map(g => g.id))}.`, `दसवें को देखने वाले ग्रह: ${who(aspectingTenth.map(g => g.id))}।`)
      : say(L, 'No classical planet aspects the 10th.', 'कोई पारंपरिक ग्रह दसवें को नहीं देखता।'),
    say(L, `The 11th, the 2nd from this career house, is ${h11.rashiName} with ${who(h11.d1)}. It shows the gains that follow the work.`, `ग्यारहवाँ, इस करियर भाव से दूसरा, ${h11.rashiName} है, साथ ${who(h11.d1)}। यह कर्म के बाद के लाभ दिखाता है।`),
    akInKarakamsha
      ? say(L, 'In the birth chart the Atmakaraka occupies the Karakamsha sign. Purpose is defined in the open. The person is rarely idle, and difficulties arrive with the work.', 'जन्म कुंडली में आत्मकारक कारकांश राशि में है। उद्देश्य खुले में तय है। व्यक्ति शायद ही निष्क्रिय रहता है, और कठिनाइयाँ कर्म के साथ आती हैं।')
      : '',
    withAkInD9.length
      ? say(L, `In navamsha, ${who(withAkInD9.map(g => g.id))} ${withAkInD9.length === 1 ? 'sits' : 'sit'} with the Atmakaraka in the Karakamsha sign.`, `नवमांश में ${who(withAkInD9.map(g => g.id))} कारकांश राशि में आत्मकारक के साथ ${withAkInD9.length === 1 ? 'है' : 'हैं'}।`)
      : '',
  ].filter(Boolean).join(' ')

  const themes: KarakamshaTheme[] = [
    {
      id: 'career',
      title: say(L, 'Career', 'करियर'),
      text: say(L, `The 10th from Karakamsha is ${h10.rashiName} with ${who(h10.d1)}. This is the real profession. Amatyakaraka ${planet(input.amk)} sits in ${signName(amkSign)}. ${careerExtra}`, `कारकांश से दसवाँ ${h10.rashiName} है, साथ ${who(h10.d1)}। यही वास्तविक वृत्ति है। अमात्यकारक ${planet(input.amk)} ${signName(amkSign)} में है। ${careerExtra}`),
    },
    {
      id: 'creation',
      title: say(L, 'Intelligence and creation', 'बुद्धि और सृजन'),
      text: say(L, `The 5th from Karakamsha is ${h5.rashiName} with ${who(h5.d1)}. It shows intelligence, creativity, children, and education. In Swamsha that sign holds ${who(h5.d9)}.`, `कारकांश से पाँचवाँ ${h5.rashiName} है, साथ ${who(h5.d1)}। यह बुद्धि, रचना, संतान और शिक्षा दिखाता है। स्वांश में उस राशि में ${who(h5.d9)} है।`),
    },
    {
      id: 'home',
      title: say(L, 'Home and property', 'घर और संपत्ति'),
      text: say(L, `The 4th from Karakamsha is ${h4.rashiName} with ${who(h4.d1)}. In Swamsha the same sign holds ${who(h4.d9)}.`, `कारकांश से चौथा ${h4.rashiName} है, साथ ${who(h4.d1)}। स्वांश में उसी राशि में ${who(h4.d9)} है।`),
    },
    {
      id: 'spouse',
      title: say(L, 'Spouse', 'पति / पत्नी'),
      text: say(L, `The 7th from Karakamsha is ${h7.rashiName} with ${who(h7.d1)}. It describes the partner's karmas. Darakaraka ${planet(input.dk)} is in ${signName(dkSign)} in the birth chart${dkD9 ? ` and ${signName(dkD9)} in navamsha` : ''}.`, `कारकांश से सातवाँ ${h7.rashiName} है, साथ ${who(h7.d1)}। यह साथी के कर्म बताता है। दारकारक ${planet(input.dk)} जन्म कुंडली में ${signName(dkSign)} में है${dkD9 ? ` और नवमांश में ${signName(dkD9)} में` : ''}।`),
    },
    {
      id: 'business',
      title: say(L, 'Business', 'व्यापार'),
      text: say(L, `Partnership is the 7th (${h7.rashiName}, ${who(h7.d1)}) and income is the 11th (${h11.rashiName}, ${who(h11.d1)}) from Karakamsha.`, `साझेदारी सातवाँ भाव है (${h7.rashiName}, ${who(h7.d1)}) और आय ग्यारहवाँ (${h11.rashiName}, ${who(h11.d1)}), कारकांश से।`),
    },
    {
      id: 'spiritual',
      title: say(L, 'Spiritual inclination', 'आध्यात्मिक झुकाव'),
      text: say(L, `Dharma is the 9th (${h9.rashiName}, ${who(h9.d1)}) and release is the 12th (${h12.rashiName}, ${who(h12.d1)}) from Karakamsha. The 12th is the path toward moksha. In Swamsha those signs hold ${who(h9.d9)} and ${who(h12.d9)}.`, `धर्म नौवाँ भाव है (${h9.rashiName}, ${who(h9.d1)}) और मुक्ति बारहवाँ (${h12.rashiName}, ${who(h12.d1)}), कारकांश से। बारहवाँ मोक्ष का मार्ग है। स्वांश में उन राशियों में ${who(h9.d9)} और ${who(h12.d9)} हैं।`),
    },
    {
      id: 'struggles',
      title: say(L, 'Struggles', 'संघर्ष'),
      text: say(L, `The 6th from Karakamsha is ${row(6).rashiName} with ${who(row(6).d1)}. It shows enemies, debts, and the health tests on this path. In Swamsha that sign holds ${who(row(6).d9)}.`, `कारकांश से छठा ${row(6).rashiName} है, साथ ${who(row(6).d1)}। यह शत्रु, ऋण और इस मार्ग की स्वास्थ्य-परीक्षा दिखाता है। स्वांश में उस राशि में ${who(row(6).d9)} है।`),
    },
  ]

  const lagnaName = L === 'hi' ? jR(input.lagna, L) : RASHI_NAMES[input.lagna]
  const kkName = L === 'hi' ? jR(karakamsha, L) : RASHI_NAMES[karakamsha]
  const alName = L === 'hi' ? jR(input.arudhaLagna, L) : RASHI_NAMES[input.arudhaLagna]
  let alignment: string
  if (input.lagna === karakamsha && karakamsha === input.arudhaLagna) {
    alignment = say(L, `Lagna, Karakamsha, and Arudha Lagna all fall in ${kkName}. Desire, soul aim, and public image use one sign.`, `लग्न, कारकांश और आरूढ़ लग्न तीनों ${kkName} में हैं। इच्छा, आत्मा का लक्ष्य और सार्वजनिक छवि एक राशि का उपयोग करते हैं।`)
  } else if (input.lagna === karakamsha) {
    alignment = say(L, `Lagna and Karakamsha share ${kkName}. Arudha Lagna is ${alName}, so the public image uses a different sign.`, `लग्न और कारकांश ${kkName} साझा करते हैं। आरूढ़ लग्न ${alName} है, इसलिए सार्वजनिक छवि दूसरी राशि का उपयोग करती है।`)
  } else if (karakamsha === input.arudhaLagna) {
    alignment = say(L, `Karakamsha and Arudha Lagna share ${kkName}. Lagna is ${lagnaName}, so personal desire uses a different sign.`, `कारकांश और आरूढ़ लग्न ${kkName} साझा करते हैं। लग्न ${lagnaName} है, इसलिए व्यक्तिगत इच्छा दूसरी राशि का उपयोग करती है।`)
  } else if (input.lagna === input.arudhaLagna) {
    alignment = say(L, `Lagna and Arudha Lagna share ${lagnaName}. Karakamsha is ${kkName}, so the soul aim is not the same sign as the public image.`, `लग्न और आरूढ़ लग्न ${lagnaName} साझा करते हैं। कारकांश ${kkName} है, इसलिए आत्मा का लक्ष्य सार्वजनिक छवि वाली राशि नहीं है।`)
  } else {
    alignment = say(L, `Lagna is ${lagnaName}, Karakamsha is ${kkName}, and Arudha Lagna is ${alName}. Desire, soul aim, and public image occupy three different signs.`, `लग्न ${lagnaName} है, कारकांश ${kkName} है, और आरूढ़ लग्न ${alName} है। इच्छा, आत्मा का लक्ष्य और सार्वजनिक छवि तीन अलग राशियों में हैं।`)
  }

  return {
    ak: input.ak,
    karakamsha,
    swamsha,
    swamshaFallback,
    alignment,
    usage: swamshaUsage(L),
    direction: karakamshaDirection(input.ak, L),
    support: karakamshaSupport(input.lagna, karakamsha, d1, L),
    houses,
    themes,
  }
}
