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
  nadiConjunct,
  type NadiYogaChart,
  type NadiYogaChartInput,
  type NadiYogaPlacement,
} from '@/lib/engine/nadi/yogas'

export const NADI_MARRIAGE_SCOPE =
  'Read this on the native first, then on parents or siblings. It is not read on a maternal uncle or aunt. A result already present in the family is the combination that has shown. Otherwise it stays open for the native or the children.'

export const NADI_MARRIAGE_BOND =
  'A bond held for a full year in body, mind, and feeling is read from the 7th. A shorter bond is read from the 5th.'

export const NADI_MARRIAGE_HEALTH =
  'When a separation is not what shows, the same Venus is checked for the kidneys, uterus, and reproductive organs, for the native or an immediate relative.'

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
    suppresses: ['ve-ra'],
  },
  {
    id: 've-ma-ke',
    name: 'Venus + Mars + Ketu',
    planets: ['Ve', 'Ma', 'Ke'],
    reading: 'A very strong marriage combination. Separation, affairs, and running away to marry are the forms checked.',
    organs: true,
    suppresses: ['ve-ke'],
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
  const hits: NadiMarriageYoga[] = []
  const signs = [...new Set(input.grahas.map((g) => g.rashi))]
  for (const sign of signs) {
    const inSign = input.grahas.filter((g) => g.rashi === sign)
    const matched = DEFS.filter((def) => nadiConjunct(inSign, def.planets))
    const dropped = new Set(matched.flatMap((def) => def.suppresses))
    for (const def of matched) {
      if (dropped.has(def.id)) continue
      let reading = def.reading
      if (def.id === 've-sa' && nadiConjunct(inSign, ['Ve', 'Sa', 'Ju'])) {
        reading += ' Jupiter sitting with them may soften the marriage result. Saturn and Venus stay the pair to read.'
      }
      const hit = toHit(input, def, sign, reading)
      if (def.id === 've-ra' && hit.house === 7) {
        hit.reading += ' In the 7th, the three forms are no marriage, a separation, or the death of the spouse. Do not reduce this to a separation alone.'
      }
      if (input.chart === 'D9' && def.id === 've-ke') {
        hit.reading += ' In Navamsha, a second marriage is the form checked.'
      }
      hits.push(hit)
    }
  }
  const ketu = input.grahas.find((g) => g.id === 'Ke')
  if (ketu && wholeSignHouseFromLagna(input.ascRashi, ketu.rashi) === 7) {
    hits.push({
      id: `${input.chart}-ke-7`,
      name: 'Ketu in the 7th',
      chart: input.chart,
      house: 7,
      signName: RASHI_NAMES[ketu.rashi],
      organs: false,
      reading: 'The early passing of the spouse is the form checked. This is not read as a separation.',
    })
  }
  if (input.chart === 'D9') {
    const marsRahu = input.grahas.find((g) => g.id === 'Ma')
    if (marsRahu && nadiConjunct(input.grahas, ['Ma', 'Ra'])) {
      hits.push({
        id: `${input.chart}-ma-ra-second`,
        name: 'Mars + Rahu',
        chart: input.chart,
        house: wholeSignHouseFromLagna(input.ascRashi, marsRahu.rashi),
        signName: RASHI_NAMES[marsRahu.rashi],
        organs: false,
        reading: 'In Navamsha, a second marriage is the form checked.',
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
          name: '7th lord of Navamsha',
          chart: input.chart,
          house: wholeSignHouseFromLagna(input.ascRashi, placed.rashi),
          signName: RASHI_NAMES[placed.rashi],
          organs: false,
          reading: 'The 7th lord of Navamsha is afflicted. A separation or a second marriage is the form checked.',
        })
      }
    }
    const axis = navamshaAxis(input.ascRashi, input.grahas)
    if (axis) hits.push(axis)
  }
  const repeated = mutableExchange(input)
  if (repeated) hits.push(repeated)
  return hits
}

export function marriageSummary(yoga: NadiMarriageYoga): string {
  if (yoga.id.endsWith('node-axis')) return yoga.reading
  const chart = yoga.chart === 'D9' ? 'Navamsha' : 'Birth chart'
  return `${yoga.name} (${chart}, ${yoga.signName}, ${ordinal(yoga.house)}). ${yoga.reading}`
}

export function marriageNote(yogas: readonly NadiMarriageYoga[]): string | null {
  if (yogas.length === 0) return null
  const parts = [NADI_MARRIAGE_SCOPE, NADI_MARRIAGE_BOND]
  if (yogas.length > 1) parts.push('More than one of these is present, so the marriage reading is stronger.')
  if (yogas.some((yoga) => yoga.organs)) parts.push(NADI_MARRIAGE_HEALTH)
  return parts.join(' ')
}

function toHit(input: NadiYogaChartInput, def: MarriageDef, sign: NadiYogaPlacement['rashi'], reading: string): NadiMarriageYoga {
  return {
    id: `${input.chart}-${def.id}`,
    name: def.name,
    chart: input.chart,
    house: wholeSignHouseFromLagna(input.ascRashi, sign),
    signName: RASHI_NAMES[sign],
    reading,
    organs: def.organs,
  }
}

function mutableExchange(input: NadiYogaChartInput): NadiMarriageYoga | null {
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
    name: 'Jupiter–Mercury exchange',
    chart: 'D1',
    house: wholeSignHouseFromLagna(input.ascRashi, mercury.rashi),
    signName: RASHI_NAMES[mercury.rashi],
    organs: false,
    reading: 'Jupiter and Mercury exchange in the angles. Two or three marriages are the form checked.',
  }
}

function navamshaAxis(asc: NadiYogaChartInput['ascRashi'], grahas: readonly NadiYogaPlacement[]): NadiMarriageYoga | null {
  const onAxis = grahas.some((g) => {
    if (g.id !== 'Ra' && g.id !== 'Ke') return false
    const house = wholeSignHouseFromLagna(asc, g.rashi)
    return house === 1 || house === 7
  })
  if (!onAxis) return null
  return {
    id: 'D9-node-axis',
    name: 'Rahu or Ketu on the Navamsha 1–7 axis',
    chart: 'D9',
    house: 1,
    signName: 'axis',
    organs: false,
    reading: 'Rahu or Ketu in the 1st or 7th of Navamsha is read as a separation, a very late marriage, or no marriage.',
  }
}

function ordinal(n: number): string {
  const mod = n % 10
  if (mod === 1 && n !== 11) return `${n}st`
  if (mod === 2 && n !== 12) return `${n}nd`
  if (mod === 3 && n !== 13) return `${n}rd`
  return `${n}th`
}
