// ─────────────────────────────────────────────────────────────
//  src/lib/engine/vedicPrashna.ts
//  Vedic praśna: Parashari significators (lagna lord, kārya-bhāva lord, kāraka,
//  Moon) plus Tajika links between them (ithasala, ishrafa, nakta, yamaya,
//  kamboola, as used in praśna works such as Nīlakaṇṭha's Praśna Tantra).
//  Pure, no React/DB/Redis.
// ─────────────────────────────────────────────────────────────

import type { BhavaBalaResult, GrahaData, GrahaId, Rashi } from '@/types/astrology'
import { hasParasharaAspect, wholeSignCount } from './aspects'
import { checkTajikaAspect } from './tajika'
import {
  KENDRAS, SEVEN_GRAHAS, SIGN_TABLE, TRIKONAS,
  buildChartFacts, grahaName, listNames, ordinal, signName,
  type ChartFacts, type SatpanchasikaChartInput,
} from './satpanchasikaFacts'
import { synthesiseVerdict, type SatpanchasikaVerdict } from './satpanchasikaEngine'
import type { EngineLang } from './lang'
import { VEDIC_HEADLINE_HI, VEDIC_NOTICE_HI, VEDIC_STUDY_HI, VEDIC_TOPIC_HI } from './locale/vedicPrashna.hi'

export type VedicTopic =
  | 'general' | 'career' | 'money' | 'marriage' | 'children'
  | 'health' | 'education' | 'property' | 'travel' | 'dispute'

export interface VedicTopicMeta {
  id: VedicTopic
  label: string
  hint: string
  house: number
  karaka: GrahaId
  notice?: string
}

export const VEDIC_TOPICS: VedicTopicMeta[] = [
  { id: 'general', label: 'General matter', hint: '1st house, Sun', house: 1, karaka: 'Su' },
  { id: 'career', label: 'Career or post', hint: '10th house, Saturn', house: 10, karaka: 'Sa' },
  { id: 'money', label: 'Money or gain', hint: '11th house, Jupiter', house: 11, karaka: 'Ju', notice: 'Traditional indication only, not financial advice.' },
  { id: 'marriage', label: 'Marriage or partner', hint: '7th house, Venus', house: 7, karaka: 'Ve' },
  { id: 'children', label: 'Children', hint: '5th house, Jupiter', house: 5, karaka: 'Ju', notice: 'Traditional indication only, not medical advice.' },
  { id: 'health', label: 'Illness and recovery', hint: '6th house, Sun', house: 6, karaka: 'Su', notice: 'Traditional indication only, not medical advice. Please rely on a qualified doctor.' },
  { id: 'education', label: 'Study or exam', hint: '5th house, Mercury', house: 5, karaka: 'Me' },
  { id: 'property', label: 'Home or property', hint: '4th house, Mars', house: 4, karaka: 'Ma' },
  { id: 'travel', label: 'Long journey', hint: '9th house, Jupiter', house: 9, karaka: 'Ju' },
  { id: 'dispute', label: 'Dispute or lawsuit', hint: '6th house, Mars', house: 6, karaka: 'Ma', notice: 'Traditional indication only, not legal advice.' },
]

/** Tajika deeptāṃśa (orb of light) in degrees. */
export const DEEPTAMSA: Partial<Record<GrahaId, number>> = { Su: 15, Mo: 12, Ma: 8, Me: 7, Ju: 9, Ve: 7, Sa: 9 }

export type TajikaLinkType = 'ithasala' | 'ishrafa' | 'none'

export interface TajikaLink {
  type: TajikaLinkType
  fast: GrahaId
  slow: GrahaId
  aspect: 'friendly' | 'hostile' | 'none'
  gap: number
  orb: number
  /** Days to exact at current speeds, for an ithasala. */
  daysAtCurrentSpeed: number | null
}

/** Reads actual signed speeds, so a retrograde planet applies or separates correctly. */
export function tajikaLink(a: GrahaData, b: GrahaData): TajikaLink {
  const [fast, slow] = Math.abs(a.speed) >= Math.abs(b.speed) ? [a, b] : [b, a]
  const nature = checkTajikaAspect(fast.rashi, slow.rashi)
  const orb = ((DEEPTAMSA[fast.id] ?? 0) + (DEEPTAMSA[slow.id] ?? 0)) / 2
  const gap = slow.degree - fast.degree
  const base = { fast: fast.id, slow: slow.id, gap: Math.round(Math.abs(gap) * 100) / 100, orb }
  if (nature === 'neutral' || Math.abs(gap) > orb) {
    return { ...base, type: 'none', aspect: nature === 'neutral' ? 'none' : nature, daysAtCurrentSpeed: null }
  }
  const relative = fast.speed - slow.speed
  // Within 1° still counts as perfecting.
  const applying = Math.abs(gap) <= 1 || gap * relative > 0
  return {
    ...base,
    type: applying ? 'ithasala' : 'ishrafa',
    aspect: nature,
    daysAtCurrentSpeed: applying && relative !== 0 ? Math.max(0, Math.ceil(Math.abs(gap / relative))) : null,
  }
}

export type VedicPolarity = 'favourable' | 'unfavourable' | 'mixed' | 'descriptive'

export interface VedicFactor {
  id: string
  group: 'Significators' | 'Their connection' | 'Tajika' | 'The Moon' | 'The house'
  title: string
  detail: string
  polarity: VedicPolarity
  weight: number
}

export interface VedicTiming {
  name: string
  value: string
  /** Days from the question, when this method gives a countable span. */
  days?: number
  working: string
}

export interface VedicPrashnaReading {
  topic: VedicTopic
  topicLabel: string
  verdict: SatpanchasikaVerdict
  headline: string
  clarity: number
  weights: { favourable: number; unfavourable: number; mixed: number }
  significators: { lagnaLord: GrahaId; karyaHouse: number; karyaLord: GrahaId; karaka: GrahaId }
  factors: VedicFactor[]
  timing: VedicTiming[]
  strengthSource: 'shadbala' | 'dignity'
  notices: string[]
}

export type VedicChartInput = SatpanchasikaChartInput & { bhavaBala?: BhavaBalaResult }

const DUSTHANAS = [6, 8, 12]
const NODES: GrahaId[] = ['Ra', 'Ke']

const HEADLINES: Record<SatpanchasikaVerdict, string> = {
  favourable: 'Indications favour the matter being fulfilled',
  with_difficulty: 'Fulfilment is indicated, with difficulty',
  leans_unfavourable: 'Indications lean against the matter',
  unfavourable: 'Indications do not support the matter',
  no_change: 'No clear change is shown',
  indication_only: 'Indications only',
  insufficient: 'Too few signals to read',
}

const STUDY_NOTE = 'A study framework from classical praśna practice, not a forecast. Test it on past questions with known outcomes and keep a log of hits and misses.'

function significatorFactor(f: ChartFacts, id: GrahaId, role: string, factorId: string, weight: number): VedicFactor {
  const g = f.grahas[id]
  const h = f.house(id)
  const factor = f.strengthFactor(id)
  const notes = [
    `in ${signName(g.rashi)}, ${ordinal(h)} house`,
    g.dignity.replace('_', ' '),
    `strength ${factor.toFixed(2)}`,
    ...(g.isCombust ? ['combust'] : []),
    ...(g.isRetro ? ['retrograde'] : []),
  ]
  const weak = factor < 1 || g.isCombust || g.dignity === 'debilitated'
  const badHouse = DUSTHANAS.includes(h)
  const polarity: VedicPolarity = !weak && !badHouse ? 'favourable' : weak && badHouse ? 'unfavourable' : 'mixed'
  const weakness = g.dignity === 'debilitated' ? 'debilitated' : g.isCombust ? 'combust' : 'weak'
  const verdictText = polarity === 'favourable' ? 'is strong and well placed' : polarity === 'unfavourable' ? `is ${weakness} and in a difficult house` : weak ? `is ${weakness}, though not in a difficult house` : 'is strong but in a difficult house'
  return {
    id: factorId,
    group: 'Significators',
    title: `${role} ${grahaName(id)} ${verdictText}`,
    detail: notes.join(' · '),
    polarity,
    weight: Math.round(weight * Math.max(0.75, Math.min(1.25, factor)) * 100) / 100,
  }
}

function connectionFactor(f: ChartFacts, a: GrahaId, b: GrahaId, karyaHouse: number): VedicFactor {
  const base = { id: 'connection', group: 'Their connection' as const, weight: 3 }
  if (a === b) {
    return { ...base, title: `One planet, ${grahaName(a)}, rules both the lagna and the matter`, detail: 'The querist and the matter share a lord.', polarity: 'favourable' }
  }
  const ga = f.grahas[a]
  const gb = f.grahas[b]
  const links: string[] = []
  const lordOf = (rashi: Rashi) => f.lordOf(wholeSignCount(f.lagna, rashi))
  if (ga.rashi === gb.rashi) links.push(`joined in ${signName(ga.rashi)}`)
  if (lordOf(ga.rashi) === b && lordOf(gb.rashi) === a) links.push('exchange of signs')
  const aToB = hasParasharaAspect(ga.rashi, a, gb.rashi)
  const bToA = hasParasharaAspect(gb.rashi, b, ga.rashi)
  if (aToB && bToA) links.push('mutual aspect')
  else if (aToB) links.push(`${grahaName(a)} aspects ${grahaName(b)}`)
  else if (bToA) links.push(`${grahaName(b)} aspects ${grahaName(a)}`)
  if (f.house(a) === karyaHouse) links.push(`lagna lord in the ${ordinal(karyaHouse)}`)
  if (f.house(b) === 1) links.push('matter\'s lord in the lagna')
  return links.length
    ? { ...base, title: 'The querist and the matter are connected', detail: `${grahaName(a)} and ${grahaName(b)}: ${links.join(', ')}.`, polarity: 'favourable' }
    : { ...base, weight: 2, title: 'No Parashari link between the querist and the matter', detail: `${grahaName(a)} and ${grahaName(b)} are not joined, in exchange or in aspect.`, polarity: 'unfavourable' }
}

function tajikaFactors(f: ChartFacts, a: GrahaId, b: GrahaId): VedicFactor[] {
  const group = 'Tajika' as const
  if (a === b) return []
  const link = tajikaLink(f.grahas[a], f.grahas[b])
  const pair = `${grahaName(link.fast)} and ${grahaName(link.slow)}`
  const out: VedicFactor[] = []
  if (link.type === 'ithasala') {
    out.push({
      id: 'ithasala', group, weight: 4,
      title: `Ithasala between ${pair}: the matter is applying`,
      detail: `${link.gap}° apart, inside the ${link.orb}° orb, in ${link.aspect === 'friendly' ? 'a friendly' : 'a hostile'} aspect${link.aspect === 'hostile' ? ', so it comes with friction' : ''}.`,
      polarity: link.aspect === 'friendly' ? 'favourable' : 'mixed',
    })
    const moon = f.grahas.Mo
    if (a !== 'Mo' && b !== 'Mo') {
      const toMoon = [a, b].filter(id => tajikaLink(moon, f.grahas[id]).type === 'ithasala')
      if (toMoon.length) {
        out.push({ id: 'kamboola', group, weight: 2, title: 'Kamboola: the Moon supports the ithasala', detail: `The Moon applies to ${listNames(toMoon)}.`, polarity: 'favourable' })
      }
    }
    return out
  }
  if (link.type === 'ishrafa') {
    out.push({ id: 'ishrafa', group, weight: 3, title: `Ishrafa between ${pair}: the moment has passed`, detail: `${link.gap}° apart and separating. The contact is over, so the matter tends to slip away.`, polarity: 'unfavourable' })
  }
  // A third planet can carry the light between two that do not perfect.
  for (const id of SEVEN_GRAHAS) {
    if (id === a || id === b) continue
    const c = f.grahas[id]
    const la = tajikaLink(c, f.grahas[a])
    const lb = tajikaLink(c, f.grahas[b])
    if (la.type !== 'ithasala' || lb.type !== 'ithasala') continue
    if (la.fast === id && lb.fast === id) {
      out.push({ id: `nakta-${id}`, group, weight: 2.5, title: `Nakta: ${grahaName(id)} carries the matter between them`, detail: `Faster than both, it applies to ${grahaName(a)} and ${grahaName(b)}: fulfilment through a go-between.`, polarity: 'favourable' })
    } else if (la.slow === id && lb.slow === id) {
      out.push({ id: `yamaya-${id}`, group, weight: 2.5, title: `Yamaya: ${grahaName(id)} gathers the matter`, detail: `Slower than both, ${grahaName(a)} and ${grahaName(b)} apply to it: fulfilment through a third party.`, polarity: 'favourable' })
    }
  }
  if (!out.length) {
    out.push({ id: 'no-tajika', group, weight: 2, title: 'No Tajika link between the significators', detail: `${pair} are ${link.aspect === 'none' ? 'in signs without Tajika aspect' : `${link.gap}° apart, outside the ${link.orb}° orb`}, and no third planet carries the light.`, polarity: 'unfavourable' })
  }
  return out
}

function moonFactors(f: ChartFacts, karyaHouse: number): VedicFactor[] {
  const group = 'The Moon' as const
  const h = f.house('Mo')
  const moon = f.grahas.Mo
  const out: VedicFactor[] = [{
    id: 'moon-phase', group, weight: 1.5,
    title: f.moonWaxing ? 'Waxing Moon supports the mind of the question' : 'Waning Moon weakens the support',
    detail: `${f.elongation.toFixed(0)}° from the Sun, ${moon.dignity.replace('_', ' ')}.`,
    polarity: f.moonWaxing ? 'favourable' : 'unfavourable',
  }]
  if (DUSTHANAS.includes(h)) {
    out.push({ id: 'moon-house', group, weight: 2, title: `Moon in the ${ordinal(h)}, a difficult house`, detail: `In ${signName(moon.rashi)}.`, polarity: 'unfavourable' })
  } else if (KENDRAS.includes(h) || TRIKONAS.includes(h)) {
    out.push({ id: 'moon-house', group, weight: 2, title: `Moon in the ${ordinal(h)}, a strong house`, detail: `In ${signName(moon.rashi)}.`, polarity: 'favourable' })
  }
  const sign = f.signAt(karyaHouse)
  if (h === karyaHouse || f.aspects('Mo', sign)) {
    out.push({ id: 'moon-link', group, weight: 1.5, title: `Moon touches the ${ordinal(karyaHouse)}`, detail: 'The mind of the querist is on the matter, and the matter is active.', polarity: 'favourable' })
  }
  return out
}

function houseFactors(f: ChartFacts, chart: VedicChartInput, karyaHouse: number): VedicFactor[] {
  const group = 'The house' as const
  const out: VedicFactor[] = []
  const sign = f.signAt(karyaHouse)
  const lord = f.lordOf(karyaHouse)
  const touching = (ids: GrahaId[]) => ids.filter(id => id !== lord && (f.house(id) === karyaHouse || f.aspects(id, sign)))
  const good = touching(f.benefics)
  const bad = touching(f.malefics)
  const nodes = chart.grahas.filter(g => NODES.includes(g.id) && g.rashi === sign).map(g => g.id)
  if (good.length) out.push({ id: 'house-good', group, weight: 2, title: `Benefics on the ${ordinal(karyaHouse)}`, detail: `On ${signName(sign)}, by placement or aspect: ${listNames(good)}.`, polarity: 'favourable' })
  if (bad.length || nodes.length) out.push({ id: 'house-bad', group, weight: 2, title: `Malefics on the ${ordinal(karyaHouse)}`, detail: `On ${signName(sign)}, by placement or aspect: ${listNames([...bad, ...nodes])}.`, polarity: 'unfavourable' })

  // Kartari: the same kind of planet on both sides of the house.
  const before = f.inHouse(((karyaHouse + 10) % 12) + 1)
  const after = f.inHouse((karyaHouse % 12) + 1)
  if (before.length && after.length) {
    if (before.every(id => !f.isBenefic(id)) && after.every(id => !f.isBenefic(id))) {
      out.push({ id: 'papakartari', group, weight: 2.5, title: `Pāpakartari: the ${ordinal(karyaHouse)} is hemmed in by malefics`, detail: `${listNames(before)} before it and ${listNames(after)} after it.`, polarity: 'unfavourable' })
    } else if (before.every(f.isBenefic) && after.every(f.isBenefic)) {
      out.push({ id: 'shubhakartari', group, weight: 2.5, title: `Śubhakartari: the ${ordinal(karyaHouse)} is protected by benefics`, detail: `${listNames(before)} before it and ${listNames(after)} after it.`, polarity: 'favourable' })
    }
  }
  const bala = chart.bhavaBala?.houses?.[karyaHouse]
  if (bala) {
    out.push({
      id: 'bhava-bala', group, weight: 1.5,
      title: `Bhāva bala of the ${ordinal(karyaHouse)} is ${bala.isStrong ? 'strong' : 'weak'}`,
      detail: `${bala.totalRupa.toFixed(2)} rūpas.`,
      polarity: bala.isStrong ? 'favourable' : 'unfavourable',
    })
  }
  const eighth = f.inHouse(8).filter(id => !f.isBenefic(id))
  if (eighth.length) {
    out.push({ id: 'eighth', group, weight: 1, title: 'Malefics in the 8th add obstacles', detail: `${listNames(eighth)} in ${signName(f.signAt(8))}.`, polarity: 'unfavourable' })
  }
  return out
}

function buildTiming(f: ChartFacts, a: GrahaId, b: GrahaId): VedicTiming[] {
  const out: VedicTiming[] = []
  const h = f.house(b)
  const pace = KENDRAS.includes(h) ? 'Sooner' : [2, 5, 8, 11].includes(h) ? 'Moderate' : 'Later'
  const angle = KENDRAS.includes(h) ? 'a kendra' : [2, 5, 8, 11].includes(h) ? 'a paṇaphara' : 'an āpoklima'
  out.push({ name: 'Pace from the matter\'s lord', value: pace, working: `${grahaName(b)} is in the ${ordinal(h)}, ${angle} house. This gives pace only, not a date.` })
  if (a !== b) {
    const link = tajikaLink(f.grahas[a], f.grahas[b])
    if (link.type === 'ithasala') {
      const mobility = SIGN_TABLE[f.grahas[link.fast].rashi].mobility
      const unit = mobility === 'movable' ? 'days' : mobility === 'dual' ? 'months' : 'years'
      out.push({ name: 'Ithasala degrees', days: Math.max(1, Math.round(link.gap)) * (unit === 'days' ? 1 : unit === 'months' ? 30 : 365), value: `About ${Math.max(1, Math.round(link.gap))} ${unit}`, working: `${link.gap}° to perfect, with ${grahaName(link.fast)} in a ${mobility} sign. This unit convention is common but varies between authors.` })
      if (link.daysAtCurrentSpeed !== null) {
        out.push({ name: 'Astronomical perfection', days: link.daysAtCurrentSpeed, value: `About ${link.daysAtCurrentSpeed} days`, working: 'When the aspect becomes exact at current speeds. This is a transit date, not a promise of the event.' })
      }
    }
  }
  return out
}

export function runVedicPrashna(chart: VedicChartInput, topicId: VedicTopic, lang: EngineLang = 'en'): VedicPrashnaReading {
  const f = buildChartFacts(chart)
  const topic = VEDIC_TOPICS.find(t => t.id === topicId)
  if (!topic) throw new Error(`Unknown Vedic prashna topic: ${topicId}`)
  const lagnaLord = f.lagnaLord
  const karyaLord = f.lordOf(topic.house)

  const factors: VedicFactor[] = [
    significatorFactor(f, lagnaLord, 'Lagna lord', 'lagna-lord', 3),
    ...(karyaLord !== lagnaLord ? [significatorFactor(f, karyaLord, `${ordinal(topic.house)} lord`, 'karya-lord', 3)] : []),
    ...(topic.karaka !== lagnaLord && topic.karaka !== karyaLord ? [significatorFactor(f, topic.karaka, 'Kāraka', 'karaka', 1.5)] : []),
    connectionFactor(f, lagnaLord, karyaLord, topic.house),
    ...tajikaFactors(f, lagnaLord, karyaLord),
    ...moonFactors(f, topic.house),
    ...houseFactors(f, chart, topic.house),
  ]
  if (f.lagnaDegree < 1 || f.lagnaDegree > 29) {
    factors.push({ id: 'sandhi', group: 'The house', title: 'Lagna at a sign junction', detail: `${f.lagnaDegree.toFixed(2)}° of ${signName(f.lagna)}. The rising sign itself is uncertain, so treat this reading with care.`, polarity: 'descriptive', weight: 0 })
  }

  const scored = factors.filter(x => x.polarity !== 'descriptive') as Array<VedicFactor & { polarity: 'favourable' | 'unfavourable' | 'mixed' }>
  const synthesis = synthesiseVerdict(scored)
  factors.sort((x, y) => y.weight - x.weight)

  return {
    topic: topic.id,
    topicLabel: lang === 'hi' ? (VEDIC_TOPIC_HI[topic.id] ?? topic.label) : topic.label,
    verdict: synthesis.verdict,
    headline: lang === 'hi' ? VEDIC_HEADLINE_HI[synthesis.verdict] : HEADLINES[synthesis.verdict],
    clarity: synthesis.clarity,
    weights: { favourable: synthesis.weights.favourable, unfavourable: synthesis.weights.unfavourable, mixed: synthesis.weights.mixed },
    significators: { lagnaLord, karyaHouse: topic.house, karyaLord, karaka: topic.karaka },
    factors,
    timing: buildTiming(f, lagnaLord, karyaLord),
    strengthSource: f.strengthSource,
    notices: [
      lang === 'hi' ? VEDIC_STUDY_HI : STUDY_NOTE,
      ...(topic.notice ? [lang === 'hi' ? (VEDIC_NOTICE_HI[topic.id] ?? topic.notice) : topic.notice] : []),
    ],
  }
}
