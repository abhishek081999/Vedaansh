// ─────────────────────────────────────────────────────────────
//  src/lib/engine/jaimini/karakamsha.ts
//  Karakamsha is the Atmakaraka's navamsha sign, read in the
//  birth chart. Swamsha uses that sign as lagna and places
//  navamsha planets by whole sign from it. It is a support chart.
// ─────────────────────────────────────────────────────────────

import type { GrahaId, Rashi } from '@/types/astrology'
import { GRAHA_NAMES, RASHI_NAMES } from '@/types/astrology'
import { getRashiDrishti } from './aspects'
import { karakamshaDirection, karakamshaSupport, SWAMSHA_USAGE } from './judgment'
import { resolveSignLord } from './trinity'

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

function names(ids: GrahaId[]): string {
  if (!ids.length) return 'no planet'
  return ids.map(id => GRAHA_NAMES[id]).join(', ')
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
}): KarakamshaReading {
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
      rashiName: RASHI_NAMES[rashi],
      theme: HOUSE_THEME[house],
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
  const careerExtra = [
    `The lord of that 10th is ${GRAHA_NAMES[tenthLord]}${tenthLordSign ? ` in ${RASHI_NAMES[tenthLordSign]}` : ''}.`,
    aspectingTenth.length
      ? `Planets aspecting the 10th: ${names(aspectingTenth.map(g => g.id))}.`
      : 'No classical planet aspects the 10th.',
    `The 11th, the 2nd from this career house, is ${h11.rashiName} with ${names(h11.d1)}. It shows the gains that follow the work.`,
    akInKarakamsha
      ? 'In the birth chart the Atmakaraka occupies the Karakamsha sign. Purpose is defined in the open. The person is rarely idle, and difficulties arrive with the work.'
      : '',
    withAkInD9.length
      ? `In navamsha, ${names(withAkInD9.map(g => g.id))} ${withAkInD9.length === 1 ? 'sits' : 'sit'} with the Atmakaraka in the Karakamsha sign.`
      : '',
  ].filter(Boolean).join(' ')

  const themes: KarakamshaTheme[] = [
    {
      id: 'career',
      title: 'Career',
      text: `The 10th from Karakamsha is ${h10.rashiName} with ${names(h10.d1)}. This is the real profession. Amatyakaraka ${GRAHA_NAMES[input.amk]} sits in ${amkSign ? RASHI_NAMES[amkSign] : 'an unknown sign'}. ${careerExtra}`,
    },
    {
      id: 'creation',
      title: 'Intelligence and creation',
      text: `The 5th from Karakamsha is ${h5.rashiName} with ${names(h5.d1)}. It shows intelligence, creativity, children, and education. In Swamsha that sign holds ${names(h5.d9)}.`,
    },
    {
      id: 'home',
      title: 'Home and property',
      text: `The 4th from Karakamsha is ${h4.rashiName} with ${names(h4.d1)}. In Swamsha the same sign holds ${names(h4.d9)}.`,
    },
    {
      id: 'spouse',
      title: 'Spouse',
      text: `The 7th from Karakamsha is ${h7.rashiName} with ${names(h7.d1)}. It describes the partner's karmas. Darakaraka ${GRAHA_NAMES[input.dk]} is in ${dkSign ? RASHI_NAMES[dkSign] : 'an unknown sign'} in the birth chart${dkD9 ? ` and ${RASHI_NAMES[dkD9]} in navamsha` : ''}.`,
    },
    {
      id: 'business',
      title: 'Business',
      text: `Partnership is the 7th (${h7.rashiName}, ${names(h7.d1)}) and income is the 11th (${h11.rashiName}, ${names(h11.d1)}) from Karakamsha.`,
    },
    {
      id: 'spiritual',
      title: 'Spiritual inclination',
      text: `Dharma is the 9th (${h9.rashiName}, ${names(h9.d1)}) and release is the 12th (${h12.rashiName}, ${names(h12.d1)}) from Karakamsha. The 12th is the path toward moksha. In Swamsha those signs hold ${names(h9.d9)} and ${names(h12.d9)}.`,
    },
    {
      id: 'struggles',
      title: 'Struggles',
      text: `The 6th from Karakamsha is ${row(6).rashiName} with ${names(row(6).d1)}. It shows enemies, debts, and the health tests on this path. In Swamsha that sign holds ${names(row(6).d9)}.`,
    },
  ]

  const lagnaName = RASHI_NAMES[input.lagna]
  const kkName = RASHI_NAMES[karakamsha]
  const alName = RASHI_NAMES[input.arudhaLagna]
  let alignment: string
  if (input.lagna === karakamsha && karakamsha === input.arudhaLagna) {
    alignment = `Lagna, Karakamsha, and Arudha Lagna all fall in ${kkName}. Desire, soul aim, and public image use one sign.`
  } else if (input.lagna === karakamsha) {
    alignment = `Lagna and Karakamsha share ${kkName}. Arudha Lagna is ${alName}, so the public image uses a different sign.`
  } else if (karakamsha === input.arudhaLagna) {
    alignment = `Karakamsha and Arudha Lagna share ${kkName}. Lagna is ${lagnaName}, so personal desire uses a different sign.`
  } else if (input.lagna === input.arudhaLagna) {
    alignment = `Lagna and Arudha Lagna share ${lagnaName}. Karakamsha is ${kkName}, so the soul aim is not the same sign as the public image.`
  } else {
    alignment = `Lagna is ${lagnaName}, Karakamsha is ${kkName}, and Arudha Lagna is ${alName}. Desire, soul aim, and public image occupy three different signs.`
  }

  return {
    ak: input.ak,
    karakamsha,
    swamsha,
    swamshaFallback,
    alignment,
    usage: SWAMSHA_USAGE,
    direction: karakamshaDirection(input.ak),
    support: karakamshaSupport(input.lagna, karakamsha, d1),
    houses,
    themes,
  }
}
