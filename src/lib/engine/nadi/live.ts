// ─────────────────────────────────────────────────────────────
//  src/lib/engine/nadi/live.ts
//  Nadi transit windows against a sky the caller supplies.
//  The house of the transit is not the reading. The sign is
//  the window, and the natal degree is the peak.
// ─────────────────────────────────────────────────────────────

import type { ChartOutput, Rashi } from '@/types/astrology'
import { GRAHA_NAMES, RASHI_NAMES } from '@/types/astrology'
import {
  RASHI_LORDS,
  isClassicalGraha,
  type ClassicalGrahaId,
  type HouseNumber,
} from '@/lib/engine/houseInterpretations'
import { rashiForHouseFromLagna } from '@/lib/engine/rashiInterpretations'
import { NADI_JUPITER_TRANSIT, houseCountedFrom, NADI_ROTATION_SUBJECTS } from '@/lib/engine/nadi/rotation'
import { NADI_NODE_TRANSIT, NADI_SATURN_TRANSIT } from '@/lib/engine/nadi/transits'

export type NadiLiveTone = 'support' | 'caution' | 'plain'

export interface NadiLiveBody {
  id: ClassicalGrahaId
  rashi: Rashi
  degree?: number
  isRetro?: boolean
}

export interface NadiLiveHit {
  id: string
  title: string
  answer: string
  reading: string
  tone: NadiLiveTone
}

export interface NadiLiveReading {
  places: string
  headline: string
  hits: NadiLiveHit[]
}

export interface NadiLiveInput {
  natal: readonly NadiLiveBody[]
  sky: readonly NadiLiveBody[]
  ascRashi?: Rashi
  navamshaLagna?: Rashi
  navamsha?: Partial<Record<ClassicalGrahaId, Rashi>>
  /** Sign of the Bhrigu Bindu. */
  binduSign?: Rashi
}

const SKY_ORDER: readonly ClassicalGrahaId[] = ['Ju', 'Sa', 'Ra', 'Ke', 'Ma', 'Ve']

const JUPITER_TONE: Partial<Record<ClassicalGrahaId, NadiLiveTone>> = {
  Sa: 'support', Ve: 'support', Ma: 'support', Su: 'support', Me: 'support', Mo: 'support',
  Ra: 'caution', Ke: 'caution',
}

const SATURN_TONE: Partial<Record<ClassicalGrahaId, NadiLiveTone>> = {
  Ve: 'support', Ju: 'support', Me: 'support',
  Ra: 'caution', Ma: 'caution', Ke: 'caution', Su: 'caution', Mo: 'caution',
}

const EDGE = 3
const PEAK = 1

function shift(sign: Rashi, by: number): Rashi {
  return ((((sign - 1 + by) % 12) + 12) % 12 + 1) as Rashi
}

function finite(degree: number | undefined): degree is number {
  return degree != null && Number.isFinite(degree) && degree >= 0 && degree < 30
}

function degrees(n: number): string {
  const rounded = Math.round(n * 10) / 10
  return Number.isInteger(rounded) ? `${rounded}°` : `${rounded.toFixed(1)}°`
}

function joinNames(names: string[]): string {
  if (names.length <= 1) return names[0] ?? ''
  if (names.length === 2) return `${names[0]} and ${names[1]}`
  return `${names.slice(0, -1).join(', ')}, and ${names[names.length - 1]}`
}

type Coverage = 'same' | 'edge'

/** Same sign is the window. Within 3° of a sign edge, the neighbouring sign still shows. */
function coverage(transit: NadiLiveBody, sign: Rashi, degree?: number): Coverage | null {
  if (transit.rashi === sign) return 'same'
  const transitEdge = finite(transit.degree)
    && (
      (transit.degree <= EDGE && shift(transit.rashi, -1) === sign)
      || (transit.degree >= 30 - EDGE && shift(transit.rashi, 1) === sign)
    )
  const natalEdge = finite(degree)
    && (
      (degree <= EDGE && shift(sign, -1) === transit.rashi)
      || (degree >= 30 - EDGE && shift(sign, 1) === transit.rashi)
    )
  if (transitEdge || natalEdge) return 'edge'
  return null
}

function skyOf(sky: readonly NadiLiveBody[], id: ClassicalGrahaId): NadiLiveBody | undefined {
  return sky.find((planet) => planet.id === id)
}

function resultOf(table: readonly { planet: string; result: string }[], id: ClassicalGrahaId): string | undefined {
  return table.find((row) => row.planet === GRAHA_NAMES[id])?.result
}

function toneOf(map: Partial<Record<ClassicalGrahaId, NadiLiveTone>>, ids: ClassicalGrahaId[]): NadiLiveTone {
  if (ids.some((id) => map[id] === 'caution')) return 'caution'
  if (ids.some((id) => map[id] === 'support')) return 'support'
  return 'plain'
}

function places(sky: readonly NadiLiveBody[]): string {
  return SKY_ORDER.flatMap((id) => {
    const planet = skyOf(sky, id)
    if (!planet) return []
    const retro = planet.isRetro ? ', retrograde' : ''
    return [`${GRAHA_NAMES[id]} in ${RASHI_NAMES[planet.rashi]}${retro}`]
  }).join(' · ')
}

interface Pass {
  id: ClassicalGrahaId
  kind: Coverage
  degree?: number
}

function passes(transit: NadiLiveBody, natal: readonly NadiLiveBody[], allowed: Partial<Record<ClassicalGrahaId, NadiLiveTone>>): Pass[] {
  const hits: Pass[] = []
  for (const planet of natal) {
    if (!allowed[planet.id]) continue
    const kind = coverage(transit, planet.rashi, planet.degree)
    if (!kind) continue
    hits.push({ id: planet.id, kind, degree: planet.degree })
  }
  return hits
}

function overLine(
  transit: NadiLiveBody,
  matched: Pass[],
  table: readonly { planet: string; result: string }[],
): { answer: string; reading: string } {
  const names = joinNames(matched.map((planet) => GRAHA_NAMES[planet.id]))
  const where = matched.every((planet) => planet.kind === 'edge')
    ? `at the edge of ${RASHI_NAMES[transit.rashi]}`
    : `in ${RASHI_NAMES[transit.rashi]}`
  const answer = `${GRAHA_NAMES[transit.id]} is ${where}, over ${names}.`
  const results = matched
    .map((planet) => resultOf(table, planet.id))
    .filter((line): line is string => Boolean(line))
  const extra: string[] = []
  if (transit.id === 'Sa' && matched.some((planet) => planet.id === 'Mo' && planet.kind === 'same')) {
    extra.push('That is the time Saturn is on the Moon.')
  }
  if (transit.id === 'Ju' && matched.some((planet) => planet.id === 'Mo') && matched.some((planet) => planet.id === 'Ra')) {
    extra.push('Defame is also checked.')
  }
  if (transit.isRetro) extra.push(`${GRAHA_NAMES[transit.id]} is retrograde.`)
  if (matched.some((planet) => planet.kind === 'edge')) {
    extra.push('A planet within three degrees of a sign edge still shows in the neighbouring sign.')
  }
  for (const planet of matched) {
    if (planet.kind !== 'same' || !finite(transit.degree) || !finite(planet.degree)) continue
    if (Math.abs(transit.degree - planet.degree) > PEAK) continue
    extra.push(`${GRAHA_NAMES[transit.id]} is on the natal degree of ${GRAHA_NAMES[planet.id]}, so this is the peak.`)
  }
  return { answer, reading: [...results, ...extra].join(' ') }
}

function nodeLine(label: string, sky: readonly NadiLiveBody[], natal: readonly NadiLiveBody[], mover: ClassicalGrahaId, target: ClassicalGrahaId): NadiLiveHit | null {
  const transit = skyOf(sky, mover)
  const planet = natal.find((row) => row.id === target)
  if (!transit || !planet) return null
  const kind = coverage(transit, planet.rashi, planet.degree)
  if (!kind) return null
  const text = NADI_NODE_TRANSIT.find((row) => row.planet === label)?.result ?? ''
  const edge = kind === 'edge' ? ' This is the sign edge, so the neighbouring sign still shows.' : ''
  const peak = kind === 'same' && finite(transit.degree) && finite(planet.degree) && Math.abs(transit.degree - planet.degree) <= PEAK
    ? ` ${GRAHA_NAMES[mover]} is on the natal degree, so this is the peak.`
    : ''
  return {
    id: `node-${mover}-${target}`,
    title: label,
    answer: `${GRAHA_NAMES[mover]} is in ${RASHI_NAMES[transit.rashi]}, over natal ${GRAHA_NAMES[target]}.`,
    reading: `${text}${edge}${peak}`,
    tone: label === 'Rahu over Venus' || label === 'Venus over Saturn' ? 'support' : 'caution',
  }
}

function onSign(transit: NadiLiveBody | undefined, sign: Rashi | undefined): Coverage | null {
  if (!transit || sign == null) return null
  return coverage(transit, sign)
}

function lordOf(asc: Rashi, house: HouseNumber): ClassicalGrahaId {
  const sign = rashiForHouseFromLagna(asc, house)
  return RASHI_LORDS.find((row) => row.number === sign)?.lord ?? 'Su'
}

export function readNadiLiveTransits(input: NadiLiveInput): NadiLiveReading {
  const hits: NadiLiveHit[] = []
  const saturn = skyOf(input.sky, 'Sa')
  const jupiter = skyOf(input.sky, 'Ju')

  if (saturn) {
    const matched = passes(saturn, input.natal, SATURN_TONE)
    if (matched.length) {
      const line = overLine(saturn, matched, NADI_SATURN_TRANSIT)
      hits.push({ id: 'saturn', title: 'Saturn', ...line, tone: toneOf(SATURN_TONE, matched.map((planet) => planet.id)) })
    }
  }
  if (jupiter) {
    const matched = passes(jupiter, input.natal, JUPITER_TONE)
    if (matched.length) {
      const line = overLine(jupiter, matched, NADI_JUPITER_TRANSIT)
      hits.push({ id: 'jupiter', title: 'Jupiter', ...line, tone: toneOf(JUPITER_TONE, matched.map((planet) => planet.id)) })
    }
  }

  const nodes: Array<[string, ClassicalGrahaId, ClassicalGrahaId]> = [
    ['Rahu over Saturn', 'Ra', 'Sa'],
    ['Ketu over Saturn', 'Ke', 'Sa'],
    ['Rahu over Venus', 'Ra', 'Ve'],
    ['Venus over Saturn', 'Ve', 'Sa'],
    ['Mars over Rahu', 'Ma', 'Ra'],
  ]
  for (const [label, mover, target] of nodes) {
    const hit = nodeLine(label, input.sky, input.natal, mover, target)
    if (hit) hits.push(hit)
  }

  const rahu = skyOf(input.sky, 'Ra')
  if (input.navamshaLagna != null) {
    const sign = rashiForHouseFromLagna(input.navamshaLagna, 4)
    const there = [saturn, rahu].filter((planet) => onSign(planet, sign))
    if (there.length) {
      const names = joinNames(there.map((planet) => GRAHA_NAMES[planet!.id]))
      hits.push({
        id: 'navamsha-4',
        title: '64th Navamsha',
        answer: `${names} ${there.length === 1 ? 'is' : 'are'} in ${RASHI_NAMES[sign]}, the 4th of Navamsha.`,
        reading: 'A death in the family or among close relations is checked.',
        tone: 'caution',
      })
    }
  }

  if (input.ascRashi != null && input.navamsha) {
    const eighth = input.navamsha[lordOf(input.ascRashi, 8)]
    if (eighth != null && onSign(saturn, eighth)) {
      hits.push({
        id: 'eighth',
        title: '8th lord',
        answer: `Saturn is in ${RASHI_NAMES[eighth]}, the Navamsha of the 8th lord.`,
        reading: 'A death in the family, a major mishap, or a hard year is checked.',
        tone: 'caution',
      })
    }
    const birth = input.navamsha[lordOf(input.ascRashi, 5)]
    if (birth != null && jupiter) {
      const trine = [birth, shift(birth, 4), shift(birth, 8)]
      if (trine.some((sign) => onSign(jupiter, sign))) {
        hits.push({
          id: 'childbirth',
          title: 'Childbirth',
          answer: `Jupiter is in ${RASHI_NAMES[jupiter.rashi]}, a trine of the 5th lord’s Navamsha.`,
          reading: 'This year is read for childbirth.',
          tone: 'plain',
        })
      }
    }
    for (const subject of NADI_ROTATION_SUBJECTS) {
      if (subject.id === 'native') continue
      const eighthHouse = houseCountedFrom(subject.house, 8)
      const sign = input.navamsha[lordOf(input.ascRashi, eighthHouse)]
      if (sign == null || !onSign(saturn, sign)) continue
      hits.push({
        id: `death-${subject.id}`,
        title: subject.label,
        answer: `Saturn is in ${RASHI_NAMES[sign]}, the Navamsha of the 8th lord from ${subject.label.toLowerCase()}.`,
        reading: 'A death in that line of the family is checked.',
        tone: 'caution',
      })
    }
  }

  if (jupiter && input.binduSign != null) {
    const exact = jupiter.rashi === input.binduSign
    const trine = exact || jupiter.rashi === shift(input.binduSign, 4) || jupiter.rashi === shift(input.binduSign, 8)
    if (trine) {
      hits.push({
        id: 'bindu',
        title: 'Bhrigu Bindu',
        answer: `Jupiter is in ${RASHI_NAMES[jupiter.rashi]}.`,
        reading: exact
          ? 'Jupiter is on the Bhrigu Bindu. This year is read as fortune.'
          : 'Jupiter is in a trine of the Bhrigu Bindu. This is the lighter form of that year.',
        tone: exact ? 'support' : 'plain',
      })
    }
  }

  const titles = [...new Set(hits.map((hit) => hit.title))]
  const headline = hits.length === 0
    ? 'None of these windows is open in the sky right now.'
    : titles.length === 1
      ? hits[0]!.answer
      : `${joinNames(titles)} each have a window open.`

  return { places: places(input.sky), headline, hits }
}

export function readNadiLiveFromChart(chart: ChartOutput, sky: readonly NadiLiveBody[]): NadiLiveReading {
  const natal = chart.grahas.flatMap((planet) => {
    if (!isClassicalGraha(planet.id)) return []
    return [{ id: planet.id, rashi: planet.rashi, degree: planet.degree, isRetro: planet.isRetro }]
  })
  const navamsha: Partial<Record<ClassicalGrahaId, Rashi>> = {}
  for (const planet of chart.vargas?.D9 ?? []) {
    if (isClassicalGraha(planet.id)) navamsha[planet.id] = planet.rashi
  }
  const asc = chart.lagnas?.ascRashi
  const bindu = chart.lagnas?.bhriguBindu
  const binduSign = bindu == null || !Number.isFinite(bindu)
    ? undefined
    : (Math.floor((((bindu % 360) + 360) % 360) / 30) + 1) as Rashi
  return readNadiLiveTransits({
    natal,
    sky,
    ascRashi: asc,
    navamshaLagna: chart.vargaLagnas?.D9,
    navamsha: asc ? navamsha : undefined,
    binduSign,
  })
}
