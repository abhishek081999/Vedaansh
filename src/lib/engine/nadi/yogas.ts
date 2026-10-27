// ─────────────────────────────────────────────────────────────
//  src/lib/engine/nadi/yogas.ts
//  Inauspicious conjunctions (khaarab yoga). Same-sign, within 15°.
//  D1 and D9 are each read as their own chart. A strong lagna
//  places the result on the family; a weak or afflicted lagna
//  places it on the native. Teaching associations, not a diagnosis.
// ─────────────────────────────────────────────────────────────

import { RASHI_NAMES } from '@/types/astrology'
import type { Rashi } from '@/types/astrology'
import { getDignity } from '@/lib/engine/dignity'
import {
  RASHI_LORDS,
  wholeSignHouseFromLagna,
  type ClassicalGrahaId,
  type HouseNumber,
} from '@/lib/engine/houseInterpretations'
import { NADI_CONJUNCTION_ORB } from '@/lib/engine/nadi/grahas'

export interface NadiYogaPlacement {
  id: ClassicalGrahaId
  rashi: Rashi
  dignity?: string
  degree?: number
}

export const NADI_KHAARAB_THEME =
  'One of these is checked: a long illness, a surgery or accident, a court case or trouble with an authority, a career break, or fraud. It falls on the native or on parents, siblings, or children. The dasha that times it is a later step.'

export const NADI_KHAARAB_CHANNEL =
  'A technical or medical career is read as the combination taking a working form. The health or family result is still checked.'

export type NadiYogaChart = 'D1' | 'D9'
export type NadiYogaBearer = 'native' | 'family' | 'open'

export interface NadiKhaarabYoga {
  id: string
  name: string
  kind: 'inauspicious' | 'supportive'
  chart: NadiYogaChart
  house: HouseNumber
  signName: string
  effect: string
  career: string | null
  bearer: NadiYogaBearer
  bearerNote: string
}

interface YogaDef {
  id: string
  name: string
  planets: readonly ClassicalGrahaId[]
  kind: 'inauspicious' | 'supportive'
  effect: string
  career: string | null
  /** Pair readings already covered by this tighter group. */
  suppresses: readonly string[]
}

const YOGAS: readonly YogaDef[] = [
  {
    id: 'sa-ma-ra',
    name: 'Saturn + Mars + Rahu',
    planets: ['Sa', 'Ma', 'Ra'],
    kind: 'inauspicious',
    effect: 'Accidents, a long illness, blood disease, and a raid or a court case are checked together. Trust in a dealing is checked.',
    career: 'Engineering.',
    suppresses: ['ma-sa', 'ma-ra', 'sa-ra'],
  },
  {
    id: 'sa-ma-ke',
    name: 'Saturn + Mars + Ketu',
    planets: ['Sa', 'Ma', 'Ke'],
    kind: 'inauspicious',
    effect: 'Accidents, surgery, fractures, and a long illness are checked together. Trust in a dealing is checked.',
    career: 'Engineering, surgery, or IT.',
    suppresses: ['ma-sa', 'ma-ke', 'sa-ke'],
  },
  {
    id: 'sa-mo-ra',
    name: 'Saturn + Moon + Rahu',
    planets: ['Sa', 'Mo', 'Ra'],
    kind: 'inauspicious',
    effect: 'Migraine, a disturbed mind, insomnia, and epilepsy are the forms checked.',
    career: null,
    suppresses: ['mo-ra'],
  },
  {
    id: 'ma-ra',
    name: 'Mars + Rahu',
    planets: ['Ma', 'Ra'],
    kind: 'inauspicious',
    effect: 'Blood disease and cancer are the forms checked, along with a raid or a case from a tax or police authority. Marriage trouble is checked with those results. Trust in a dealing is checked.',
    career: 'Engineering first. Medicine is the rarer form.',
    suppresses: [],
  },
  {
    id: 'ma-ke',
    name: 'Mars + Ketu',
    planets: ['Ma', 'Ke'],
    kind: 'inauspicious',
    effect: 'Surgery, cuts, and fractures are the forms checked. Marriage trouble is checked. Trust in a dealing is checked.',
    career: 'Surgeon or a technical field.',
    suppresses: [],
  },
  {
    id: 'ma-sa',
    name: 'Mars + Saturn',
    planets: ['Ma', 'Sa'],
    kind: 'inauspicious',
    effect: 'Accidents and injuries are the forms checked. Conflict in marriage is checked. A court case and a dispute over property are checked.',
    career: 'Engineering, factories, or manufacturing. Surgery is the rare form.',
    suppresses: [],
  },
  {
    id: 'sa-ra',
    name: 'Saturn + Rahu',
    planets: ['Sa', 'Ra'],
    kind: 'inauspicious',
    effect: 'A long illness that can use up savings, with fraud or a court case. Fraud is read either as being cheated or as cheating. Divorce and separation are checked.',
    career: 'IT, computers, or other technology, and work abroad. Outside that field, breaks and obstacles are checked.',
    suppresses: [],
  },
  {
    id: 'sa-ke',
    name: 'Saturn + Ketu',
    planets: ['Sa', 'Ke'],
    kind: 'inauspicious',
    effect: 'Surgery and a long illness are the forms checked. Divorce and delay in marriage are checked. Trust in a dealing is checked.',
    career: 'IT or technology. Law is the other form when study supports it. Outside that field, breaks are checked.',
    suppresses: [],
  },
  {
    id: 'su-sa',
    name: 'Sun + Saturn',
    planets: ['Su', 'Sa'],
    kind: 'inauspicious',
    effect: 'Government income is read somewhere in the family. The father’s health is under pressure, distance from the father is checked, and the native’s heart is checked.',
    career: 'A government post in the family.',
    suppresses: [],
  },
  {
    id: 'ju-ra',
    name: 'Jupiter + Rahu',
    planets: ['Ju', 'Ra'],
    kind: 'inauspicious',
    effect: 'Guru Chandal. Cancer, liver disease, jaundice, miscarriage, and delayed childbirth are the forms checked.',
    career: null,
    suppresses: [],
  },
  {
    id: 'su-ra',
    name: 'Sun + Rahu',
    planets: ['Su', 'Ra'],
    kind: 'inauspicious',
    effect: 'A sharp rise, then a downfall: loss of position, a scandal, suspension, or a court case. Jail is checked only when other hard combinations are also present.',
    career: 'Politics or a government post.',
    suppresses: [],
  },
  {
    id: 'mo-ra',
    name: 'Moon + Rahu',
    planets: ['Mo', 'Ra'],
    kind: 'inauspicious',
    effect: 'Migraine, anxiety, low mood, and insomnia are the forms checked.',
    career: null,
    suppresses: [],
  },
  {
    id: 'mo-ke',
    name: 'Moon + Ketu',
    planets: ['Mo', 'Ke'],
    kind: 'inauspicious',
    effect: 'Migraine, anxiety, low mood, and insomnia are the forms checked. The marriage effect is slight.',
    career: null,
    suppresses: [],
  },
  {
    id: 'ju-ke',
    name: 'Jupiter + Ketu',
    planets: ['Ju', 'Ke'],
    kind: 'supportive',
    effect: 'Jupiter with Ketu is a good combination. The child is read as unusually able, and the native is read for astrology.',
    career: 'Astrology or spiritual work.',
    suppresses: [],
  },
]

const PAPA = new Set<ClassicalGrahaId>(['Ma', 'Sa', 'Ra', 'Ke'])
const STRONG = new Set(['exalted', 'own', 'moolatrikona'])
const DUSTHANA = new Set<HouseNumber>([6, 8, 12])

export interface NadiYogaChartInput {
  chart: NadiYogaChart
  ascRashi: Rashi
  grahas: readonly NadiYogaPlacement[]
}

/** Planets that share a sign. When every degree is known, the span must be within 15°. */
export function nadiConjunct(
  grahas: readonly NadiYogaPlacement[],
  planets: readonly ClassicalGrahaId[],
): NadiYogaPlacement[] | null {
  const found: NadiYogaPlacement[] = []
  for (const id of planets) {
    const placed = grahas.find((g) => g.id === id)
    if (!placed) return null
    found.push(placed)
  }
  const sign = found[0]?.rashi
  if (!sign || found.some((g) => g.rashi !== sign)) return null
  const degrees = found.map((g) => g.degree).filter((d): d is number => typeof d === 'number' && Number.isFinite(d))
  if (degrees.length === found.length) {
    const span = Math.max(...degrees) - Math.min(...degrees)
    if (span > NADI_CONJUNCTION_ORB.weak) return null
  }
  return found
}

export function findKhaarabYogas(input: NadiYogaChartInput): NadiKhaarabYoga[] {
  const signs = [...new Set(input.grahas.map((g) => g.rashi))]
  const hits: NadiKhaarabYoga[] = []
  for (const sign of signs) {
    const inSign = input.grahas.filter((g) => g.rashi === sign)
    const matched = YOGAS.filter((yoga) => nadiConjunct(inSign, yoga.planets))
    const dropped = new Set(matched.flatMap((yoga) => yoga.suppresses))
    for (const yoga of matched) {
      if (dropped.has(yoga.id)) continue
      const bearer = yoga.kind === 'supportive' ? 'open' : yogaBearer(input)
      const house = wholeSignHouseFromLagna(input.ascRashi, sign)
      let effect = yoga.effect
      if (yoga.id === 'ma-ra' && house === 8) {
        effect += ' In the 8th, a major accident and a short life are the forms checked.'
      }
      if (yoga.id === 'ma-sa' && house === 8) {
        effect += ' In the 8th, a violent end and major legal trouble are the forms checked.'
      }
      hits.push({
        id: `${input.chart}-${yoga.id}`,
        name: yoga.name,
        kind: yoga.kind,
        chart: input.chart,
        house,
        signName: RASHI_NAMES[sign],
        effect,
        career: yoga.career,
        bearer,
        bearerNote: bearerNote(bearer, yoga.kind),
      })
    }
  }
  return hits
}

function bearerNote(bearer: NadiYogaBearer, kind: NadiKhaarabYoga['kind']): string {
  if (kind === 'supportive') return 'This pair is the exception that is read as supportive.'
  if (bearer === 'native') return 'The lagna or its lord is weak or afflicted, so this is read on the native.'
  if (bearer === 'family') return 'The lagna and its lord are strong, so this is read on parents, siblings, or children.'
  return 'The lagna has not settled who carries it. It is read on the native or on parents, siblings, or children.'
}

function yogaBearer(input: NadiYogaChartInput): NadiYogaBearer {
  const lord = RASHI_LORDS.find((row) => row.number === input.ascRashi)?.lord
  if (!lord) return 'open'
  const placed = input.grahas.find((g) => g.id === lord)
  const house = placed ? wholeSignHouseFromLagna(input.ascRashi, placed.rashi) : null
  const dignity = placed ? placedDignity(placed) : null
  const papaInLagna = input.grahas.some((g) => (
    PAPA.has(g.id) && wholeSignHouseFromLagna(input.ascRashi, g.rashi) === 1
  ))
  const lordWithPapa = placed
    ? input.grahas.some((g) => g.id !== lord && PAPA.has(g.id) && nadiConjunct(input.grahas, [lord, g.id]))
    : false
  const afflicted = papaInLagna
    || lordWithPapa
    || dignity === 'debilitated'
    || (house != null && DUSTHANA.has(house))
  if (afflicted) return 'native'
  if (dignity && STRONG.has(dignity)) return 'family'
  return 'open'
}

function placedDignity(g: NadiYogaPlacement): string {
  if (g.dignity) return g.dignity
  return getDignity(g.id, g.rashi, g.degree ?? 15)
}

export function khaarabSummary(yoga: NadiKhaarabYoga): string {
  const where = `${yoga.chart === 'D9' ? 'Navamsha' : 'Birth chart'}, ${yoga.signName}, ${ordinalHouse(yoga.house)}`
  const career = yoga.career ? ` Working form: ${yoga.career}` : ''
  return `${yoga.name} (${where}). ${yoga.effect} ${yoga.bearerNote}${career}`
}

function ordinalHouse(n: number): string {
  const mod = n % 10
  if (mod === 1 && n !== 11) return `${n}st`
  if (mod === 2 && n !== 12) return `${n}nd`
  if (mod === 3 && n !== 13) return `${n}rd`
  return `${n}th`
}
