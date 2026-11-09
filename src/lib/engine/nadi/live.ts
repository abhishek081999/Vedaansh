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
import { NADI_JUPITER_TRANSIT, NADI_JUPITER_TRANSIT_HI, houseCountedFrom, NADI_ROTATION_SUBJECTS } from '@/lib/engine/nadi/rotation'
import { NADI_NODE_TRANSIT, NADI_NODE_TRANSIT_HI, NADI_SATURN_TRANSIT, NADI_SATURN_TRANSIT_HI } from '@/lib/engine/nadi/transits'
import { NADI_RELATIVE_HI } from '@/lib/engine/locale/nadiRead.hi'
import { nG, nJoin, nLang, nR, nSay, type EngineLang } from '@/lib/engine/nadi/text'

type TransitRow = { planet: string; result: string }

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
  lang?: EngineLang
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

/** Rows are found by the English planet name; the shown text comes from the same row of `shown`. */
function resultOf(table: readonly TransitRow[], id: ClassicalGrahaId, shown: readonly TransitRow[] = table): string | undefined {
  const index = table.findIndex((row) => row.planet === GRAHA_NAMES[id])
  return index < 0 ? undefined : shown[index]?.result
}

function toneOf(map: Partial<Record<ClassicalGrahaId, NadiLiveTone>>, ids: ClassicalGrahaId[]): NadiLiveTone {
  if (ids.some((id) => map[id] === 'caution')) return 'caution'
  if (ids.some((id) => map[id] === 'support')) return 'support'
  return 'plain'
}

function places(sky: readonly NadiLiveBody[], L: EngineLang): string {
  return SKY_ORDER.flatMap((id) => {
    const planet = skyOf(sky, id)
    if (!planet) return []
    if (L === 'hi') return [`${nG(id, L)} ${nR(planet.rashi, L)} में${planet.isRetro ? ', वक्री' : ''}`]
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
  table: readonly TransitRow[],
  shown: readonly TransitRow[],
  L: EngineLang,
): { answer: string; reading: string } {
  const t = (en: string, hi: string) => nSay(L, en, hi)
  const names = joinNames(matched.map((planet) => GRAHA_NAMES[planet.id]))
  const namesHi = nJoin(matched.map((planet) => nG(planet.id, 'hi')), 'hi')
  const edgeOnly = matched.every((planet) => planet.kind === 'edge')
  const where = edgeOnly
    ? `at the edge of ${RASHI_NAMES[transit.rashi]}`
    : `in ${RASHI_NAMES[transit.rashi]}`
  const whereHi = edgeOnly ? `${nR(transit.rashi, 'hi')} की सीमा पर` : `${nR(transit.rashi, 'hi')} में`
  const answer = t(`${GRAHA_NAMES[transit.id]} is ${where}, over ${names}.`, `${nG(transit.id, 'hi')} ${whereHi} है, ${namesHi} के ऊपर।`)
  const results = matched
    .map((planet) => resultOf(table, planet.id, L === 'hi' ? shown : table))
    .filter((line): line is string => Boolean(line))
  const extra: string[] = []
  if (transit.id === 'Sa' && matched.some((planet) => planet.id === 'Mo' && planet.kind === 'same')) {
    extra.push(t('That is the time Saturn is on the Moon.', 'यही वह समय है जब शनि चंद्र पर है।'))
  }
  if (transit.id === 'Ju' && matched.some((planet) => planet.id === 'Mo') && matched.some((planet) => planet.id === 'Ra')) {
    extra.push(t('Defame is also checked.', 'अपयश की भी जाँच की जाती है।'))
  }
  if (transit.isRetro) extra.push(t(`${GRAHA_NAMES[transit.id]} is retrograde.`, `${nG(transit.id, 'hi')} वक्री है।`))
  if (matched.some((planet) => planet.kind === 'edge')) {
    extra.push(t('A planet within three degrees of a sign edge still shows in the neighbouring sign.', 'राशि की सीमा से तीन अंश के भीतर का ग्रह पड़ोसी राशि में भी फल दिखाता है।'))
  }
  for (const planet of matched) {
    if (planet.kind !== 'same' || !finite(transit.degree) || !finite(planet.degree)) continue
    if (Math.abs(transit.degree - planet.degree) > PEAK) continue
    extra.push(t(
      `${GRAHA_NAMES[transit.id]} is on the natal degree of ${GRAHA_NAMES[planet.id]}, so this is the peak.`,
      `${nG(transit.id, 'hi')} जन्म के ${nG(planet.id, 'hi')} के अंश पर है, इसलिए यह शिखर है।`,
    ))
  }
  return { answer, reading: [...results, ...extra].join(' ') }
}

function nodeLine(label: string, sky: readonly NadiLiveBody[], natal: readonly NadiLiveBody[], mover: ClassicalGrahaId, target: ClassicalGrahaId, L: EngineLang = 'en'): NadiLiveHit | null {
  const transit = skyOf(sky, mover)
  const planet = natal.find((row) => row.id === target)
  if (!transit || !planet) return null
  const kind = coverage(transit, planet.rashi, planet.degree)
  if (!kind) return null
  const index = NADI_NODE_TRANSIT.findIndex((row) => row.planet === label)
  const row = L === 'hi' ? NADI_NODE_TRANSIT_HI[index] : NADI_NODE_TRANSIT[index]
  const text = row?.result ?? ''
  const edge = kind === 'edge'
    ? nSay(L, ' This is the sign edge, so the neighbouring sign still shows.', ' यह राशि की सीमा है, इसलिए पड़ोसी राशि में भी फल दिखता है।')
    : ''
  const peak = kind === 'same' && finite(transit.degree) && finite(planet.degree) && Math.abs(transit.degree - planet.degree) <= PEAK
    ? nSay(L, ` ${GRAHA_NAMES[mover]} is on the natal degree, so this is the peak.`, ` ${nG(mover, 'hi')} जन्म के अंश पर है, इसलिए यह शिखर है।`)
    : ''
  return {
    id: `node-${mover}-${target}`,
    title: L === 'hi' ? row?.planet ?? label : label,
    answer: nSay(L,
      `${GRAHA_NAMES[mover]} is in ${RASHI_NAMES[transit.rashi]}, over natal ${GRAHA_NAMES[target]}.`,
      `${nG(mover, 'hi')} ${nR(transit.rashi, 'hi')} में है, जन्म के ${nG(target, 'hi')} के ऊपर।`),
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
  const L = nLang(input.lang)
  const t = (en: string, hi: string) => nSay(L, en, hi)
  const hits: NadiLiveHit[] = []
  const saturn = skyOf(input.sky, 'Sa')
  const jupiter = skyOf(input.sky, 'Ju')
  let saturnOn: ClassicalGrahaId[] = []
  let jupiterOn: ClassicalGrahaId[] = []

  if (saturn) {
    const matched = passes(saturn, input.natal, SATURN_TONE)
    saturnOn = matched.map((planet) => planet.id)
    if (matched.length) {
      const line = overLine(saturn, matched, NADI_SATURN_TRANSIT, NADI_SATURN_TRANSIT_HI, L)
      hits.push({ id: 'saturn', title: t('Saturn', 'शनि'), ...line, tone: toneOf(SATURN_TONE, matched.map((planet) => planet.id)) })
    }
  }
  if (jupiter) {
    const matched = passes(jupiter, input.natal, JUPITER_TONE)
    jupiterOn = matched.map((planet) => planet.id)
    if (matched.length) {
      const line = overLine(jupiter, matched, NADI_JUPITER_TRANSIT, NADI_JUPITER_TRANSIT_HI, L)
      hits.push({ id: 'jupiter', title: t('Jupiter', 'गुरु'), ...line, tone: toneOf(JUPITER_TONE, matched.map((planet) => planet.id)) })
    }
  }

  const shared = saturnOn.filter((id) => jupiterOn.includes(id))
  if (shared.length > 0) {
    const names = joinNames(shared.map((id) => GRAHA_NAMES[id]))
    const namesHi = nJoin(shared.map((id) => nG(id, 'hi')), 'hi')
    hits.push({
      id: 'jupiter-saturn',
      title: t('Jupiter and Saturn', 'गुरु और शनि'),
      answer: t(`Jupiter and Saturn are both on ${names}.`, `गुरु और शनि दोनों ${namesHi} पर हैं।`),
      reading: t(`The result of ${names} is read while both are there.`, `जब तक दोनों वहाँ हैं, ${namesHi} का फल पढ़ा जाता है।`),
      tone: 'plain',
    })
  }

  const nodes: Array<[string, ClassicalGrahaId, ClassicalGrahaId]> = [
    ['Rahu over Saturn', 'Ra', 'Sa'],
    ['Ketu over Saturn', 'Ke', 'Sa'],
    ['Rahu over Venus', 'Ra', 'Ve'],
    ['Venus over Saturn', 'Ve', 'Sa'],
    ['Mars over Rahu', 'Ma', 'Ra'],
  ]
  for (const [label, mover, target] of nodes) {
    const hit = nodeLine(label, input.sky, input.natal, mover, target, L)
    if (hit) hits.push(hit)
  }

  const rahu = skyOf(input.sky, 'Ra')
  if (input.navamshaLagna != null) {
    const sign = rashiForHouseFromLagna(input.navamshaLagna, 4)
    const there = [saturn, rahu].filter((planet) => onSign(planet, sign))
    if (there.length) {
      const names = joinNames(there.map((planet) => GRAHA_NAMES[planet!.id]))
      const namesHi = nJoin(there.map((planet) => nG(planet!.id, 'hi')), 'hi')
      hits.push({
        id: 'navamsha-4',
        title: t('64th Navamsha', '64वाँ नवांश'),
        answer: t(
          `${names} ${there.length === 1 ? 'is' : 'are'} in ${RASHI_NAMES[sign]}, the 4th of Navamsha.`,
          `${namesHi} नवांश के चौथे भाव ${nR(sign, 'hi')} में ${there.length === 1 ? 'है' : 'हैं'}।`,
        ),
        reading: t('Classical Nadi texts use this transit to look for a loss among close relations. It is a point to read with care, not a prediction.', 'शास्त्रीय नाड़ी ग्रंथ इस गोचर से निकट संबंधियों में हानि देखते हैं। इसे सावधानी से पढ़ने का बिंदु मानें, भविष्यवाणी नहीं।'),
        tone: 'caution',
      })
    }
  }

  if (input.ascRashi != null && input.navamsha) {
    const eighth = input.navamsha[lordOf(input.ascRashi, 8)]
    if (eighth != null && onSign(saturn, eighth)) {
      hits.push({
        id: 'eighth',
        title: t('8th lord', 'अष्टमेश'),
        answer: t(`Saturn is in ${RASHI_NAMES[eighth]}, the Navamsha of the 8th lord.`, `शनि अष्टमेश के नवांश ${nR(eighth, 'hi')} में है।`),
        reading: t('Classical Nadi texts use this transit to look for a loss in the family, a mishap, or a hard year. It is a point to read with care, not a prediction.', 'शास्त्रीय नाड़ी ग्रंथ इस गोचर से परिवार में हानि, दुर्घटना, या कठिन वर्ष देखते हैं। इसे सावधानी से पढ़ने का बिंदु मानें, भविष्यवाणी नहीं।'),
        tone: 'caution',
      })
    }
    const birth = input.navamsha[lordOf(input.ascRashi, 5)]
    if (birth != null && jupiter) {
      const trine = [birth, shift(birth, 4), shift(birth, 8)]
      if (trine.some((sign) => onSign(jupiter, sign))) {
        hits.push({
          id: 'childbirth',
          title: t('Childbirth', 'संतान जन्म'),
          answer: t(`Jupiter is in ${RASHI_NAMES[jupiter.rashi]}, a trine of the 5th lord’s Navamsha.`, `गुरु ${nR(jupiter.rashi, 'hi')} में है, जो पंचमेश के नवांश का त्रिकोण है।`),
          reading: t('This year is read for childbirth.', 'यह वर्ष संतान जन्म के लिए पढ़ा जाता है।'),
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
        title: L === 'hi' ? NADI_RELATIVE_HI[subject.id] ?? subject.label : subject.label,
        answer: t(
          `Saturn is in ${RASHI_NAMES[sign]}, the Navamsha of the 8th lord from ${subject.label.toLowerCase()}.`,
          `शनि ${nR(sign, 'hi')} में है, जो ${NADI_RELATIVE_HI[subject.id] ?? subject.label} के भाव से अष्टमेश का नवांश है।`,
        ),
        reading: t('Classical Nadi texts use this transit to look for a loss in that side of the family. It is a point to read with care, not a prediction.', 'शास्त्रीय नाड़ी ग्रंथ इस गोचर से परिवार के उस पक्ष में हानि देखते हैं। इसे सावधानी से पढ़ने का बिंदु मानें, भविष्यवाणी नहीं।'),
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
        title: t('Bhrigu Bindu', 'भृगु बिंदु'),
        answer: t(`Jupiter is in ${RASHI_NAMES[jupiter.rashi]}.`, `गुरु ${nR(jupiter.rashi, 'hi')} में है।`),
        reading: exact
          ? t('Jupiter is on the Bhrigu Bindu. This year is read as fortune.', 'गुरु भृगु बिंदु पर है। यह वर्ष भाग्य के रूप में पढ़ा जाता है।')
          : t('Jupiter is in a trine of the Bhrigu Bindu. This is the lighter form of that year.', 'गुरु भृगु बिंदु के त्रिकोण में है। यह उस वर्ष का हल्का रूप है।'),
        tone: exact ? 'support' : 'plain',
      })
    }
  }

  const titles = [...new Set(hits.map((hit) => hit.title))]
  const headline = hits.length === 0
    ? t('None of these windows is open in the sky right now.', 'अभी आकाश में इनमें से कोई भी अवधि खुली नहीं है।')
    : titles.length === 1
      ? hits[0]!.answer
      : t(`${joinNames(titles)} each have a window open.`, `${nJoin(titles, 'hi')}, हर एक की अवधि खुली है।`)

  return { places: places(input.sky, L), headline, hits }
}

export function readNadiLiveFromChart(chart: ChartOutput, sky: readonly NadiLiveBody[], lang?: EngineLang): NadiLiveReading {
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
    lang,
  })
}
