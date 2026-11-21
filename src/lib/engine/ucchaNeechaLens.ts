// ─────────────────────────────────────────────────────────────
//  src/lib/engine/ucchaNeechaLens.ts
//  Uccha–Neecha lens: where the Lagna lord's exaltation sign falls is
//  the native's life motivation; where its debilitation sign falls is a
//  hidden insecurity (possessiveness / over-effort, not plain fear).
//  The same lens runs for every house lord and every exalted or
//  debilitated planet, plus bhavat-bhavam (house-from-house) readings.
//
//  Teaching method (class notes on uccha/neecha by Lagna). Results are
//  possibilities that the karaka planets refine, never verdicts.
//  Pure: no React / DB / Redis / ephemeris.
// ─────────────────────────────────────────────────────────────

import type { ChartOutput, Dignity, GrahaData, GrahaId, Rashi } from '@/types/astrology'
import { GRAHA_NAMES, RASHI_NAMES } from '@/types/astrology'
import { GRAHA_HI, RASHI_HI } from '@/i18n/jyotish'
import { DEBILITATION_SIGN, EXALTATION_SIGN } from '@/lib/engine/dignity'
import { SIGN_LORD_BY_RASHI } from '@/lib/engine/lordshipInterpretations'
import { fill, type EngineLang } from '@/lib/engine/lang'
import { ordHi, ordHiDirect } from '@/lib/engine/locale/todayReading.hi'
import {
  UN_FACET_HI,
  UN_HOUSE_HI,
  UN_LABEL_HI,
  UN_SPECIAL_HI,
  UN_TEXT_HI as T_HI,
} from '@/lib/engine/locale/ucchaNeechaLens.hi'

export type UNKind = 'motivation' | 'insecurity'
export type FacetCondition = 'strong' | 'mixed' | 'weak'

export interface UNFacet {
  graha: GrahaId
  facet: string
  condition: FacetCondition
  score: number
}

export interface UNFocus {
  kind: UNKind
  lord: GrahaId
  sign: Rashi
  house: number
  themes: string
  /** House the lord actually sits in. */
  lordHouse: number
  /** Lord sits in this very house: the drive is conscious from early life. */
  lordInHouse: boolean
  /** Sign lord of the uccha/neecha sign is 6/8 or 2/12 from the lord, or debilitated: drive can turn negative. */
  strained: boolean
  /** Karaka facets of the house, strongest first. */
  facets: UNFacet[]
  summary: string
  points: string[]
}

export interface UNHouseLens {
  house: number
  lord: GrahaId
  motivationHouse: number
  insecurityHouse: number
  motivationText: string
  insecurityText: string
  /** House-from-house lines (12th, 11th, 9th, 6th, 4th from other houses). */
  bhavatBhavam: string[]
  /** Extra teaching note for this house, if any (3-5-9 career, 6th karma…). */
  special: string | null
}

export interface UNPlanetLens {
  graha: GrahaId
  dignity: 'exalted' | 'debilitated'
  house: number
  rules: number[]
  text: string
}

export interface UcchaNeechaLens {
  lagnaRashi: Rashi
  lagnaLord: GrahaId
  motivation: UNFocus
  insecurity: UNFocus
  /** 2nd, 7th and 12th are never anyone's motivation house: duties, not drives. */
  dutyNote: string
  method: string
  houses: UNHouseLens[]
  planets: UNPlanetLens[]
}

const SEVEN: GrahaId[] = ['Su', 'Mo', 'Ma', 'Me', 'Ju', 'Ve', 'Sa']

// ── House text (English) ─────────────────────────────────────

const HOUSE_EN: Record<number, { short: string; motivation: string; insecurity: string }> = {
  1: { short: 'self and body', motivation: 'self-understanding, self-development and serving one\'s own people', insecurity: 'self-image, health and how others judge you' },
  2: { short: 'wealth, family, food and speech', motivation: 'savings, family and speech', insecurity: 'money, family standing, food and public speaking' },
  3: { short: 'siblings, courage and communication', motivation: 'courage, adventure, communication, siblings and new ideas', insecurity: 'siblings, neighbours, rumours and having to prove courage' },
  4: { short: 'mother, home and comforts', motivation: 'mother, home, property, vehicles, comfort and learning', insecurity: 'mother, home, property, vehicles and inner peace' },
  5: { short: 'children, intellect and love', motivation: 'children, wisdom, devotion, planning and advising others', insecurity: 'being seen as knowledgeable, love relationships and children' },
  6: { short: 'service, competition, debt and disease', motivation: 'service, competition, winning, exams, litigation and sport', insecurity: 'enemies, debts, health and losing a contest' },
  7: { short: 'spouse and partnerships', motivation: 'the spouse and partnerships', insecurity: 'the spouse, partners and how the relationship looks' },
  8: { short: 'longevity, occult and in-laws', motivation: 'research, occult, astrology, spirituality and the philosophy of life and death', insecurity: 'sudden change, inheritance, in-laws and the hidden' },
  9: { short: 'father, guru, dharma and fortune', motivation: 'dharma, higher education, guru, father, blessings and long travel', insecurity: 'father, guru, beliefs and fortune' },
  10: { short: 'career, status and conduct', motivation: 'action, career, name, power and achievement', insecurity: 'reputation, position at work and public performance' },
  11: { short: 'gains, desires and networks', motivation: 'gains, desires, social circle, recognition and rewards', insecurity: 'income, friendships, social standing and elder siblings' },
  12: { short: 'expense, sleep and moksha', motivation: 'expense, sleep and letting go', insecurity: 'expenses, sleep, bed pleasures and losses (spending to hide or display a lack)' },
}

/** Karaka facets per house: which planet carries which slice of the house. */
const FACETS_EN: Record<number, Partial<Record<GrahaId, string>>> = {
  1: { Su: 'vitality and self-image', Mo: 'emotional self', Me: 'self-understanding', Ju: 'wisdom and character' },
  2: { Ju: 'family and savings', Mo: 'food', Me: 'speech', Ve: 'wealth and comforts' },
  3: { Ma: 'siblings and courage', Me: 'communication and writing', Sa: 'sustained effort' },
  4: { Mo: 'mother', Ve: 'vehicles and luxury', Me: 'learning and knowledge', Ju: 'contentment', Ma: 'land and property' },
  5: { Ju: 'children and wisdom', Me: 'intelligence and education', Mo: 'devotion and emotions', Ve: 'romance' },
  6: { Ma: 'competition and litigation', Sa: 'service and daily work', Me: 'loans and clauses' },
  7: { Ve: 'spouse and pleasure', Ju: 'marriage vows', Me: 'business partners' },
  8: { Sa: 'longevity and setbacks', Ju: 'occult wisdom and inheritance', Ma: 'sudden events', Ke: 'research and moksha' },
  9: { Su: 'father', Ju: 'guru, dharma and higher learning', Ra: 'foreign travel' },
  10: { Su: 'status and power', Sa: 'work and discipline', Me: 'professional skill', Ju: 'name and ethics' },
  11: { Ju: 'gains and fulfilled desires', Me: 'networks', Ve: 'rewards and recognition', Sa: 'steady income' },
  12: { Sa: 'loss and isolation', Ve: 'bed pleasures and luxury spending', Mo: 'sleep', Ra: 'foreign lands', Ke: 'moksha' },
}

const SPECIAL_EN: Record<number, string> = {
  1: 'From the 3rd the Lagna is the 11th (your strength is your siblings\' gain); from the 5th it is the 9th (your own steadiness becomes your children\'s fortune).',
  3: 'The 3rd is the 6th from the 10th: when a dasha activates it, a job change, promotion or demotion is common.',
  5: 'The 5th is the 8th from the 10th: dasha activation often brings a change in work or status.',
  6: 'The 6th is the 9th from the 10th (the fortune your conduct builds) and the 12th from the 7th (loss of married life): unethical work returns as disease, debt or enemies and strains the marriage.',
  9: 'The 9th is the 12th from the 10th: it can cost name and status in worldly terms while giving happiness late in life.',
  10: 'The 10th is the 4th from the 7th (conduct is the happiness of marriage) and the 9th from the 2nd (the fruit of your speech). Karma here means everything done from waking to sleep.',
  12: 'The 12th is the 9th from the 4th: hidden negative thoughts fruit here as loss. It holds both loss and the power to control loss; it is also exit and moksha.',
  8: 'From the 8th the Lagna is the 6th: trouble through in-laws. Links of the Lagna lord with the 8th are harder to control than with the 6th.',
}

const EN = {
  motivationSummary: 'Your Lagna lord {lord} is exalted in {sign}, which falls in your {nth} house. Life feels fulfilled when you chase {themes}.',
  insecuritySummary: 'Your Lagna lord {lord} is debilitated in {sign}, your {nth} house. Insecurity around {themes} shows as possessiveness or over-effort, not plain fear.',
  conscious: '{lord} sits in this house itself, so the drive is clear from early life.',
  unconscious: '{lord} sits in the {nth} house, so this drive is often realised later, when a dasha or antardasha activates the {target} house.',
  consciousNeecha: '{lord} sits here, so this insecurity is visible to people close to you.',
  strainedMotivation: '{signLord}, lord of {sign}, is badly placed from {lord}: the drive can turn destructive. Channel it consciously.',
  strainedInsecurity: '{signLord}, lord of {sign}, is badly placed from {lord}: this area can turn into friction or a lasting sense of lack.',
  softInsecurity: '{signLord}, lord of {sign}, is well related to {lord}: expect over-giving and over-protection here rather than conflict.',
  facetLead: 'Strongest karaka here: {graha} ({facet}). That slice of the house is what you chase most.',
  facetWeak: 'Weakest karaka here: {graha} ({facet}). The insecurity most likely shows through this.',
  facetAllStrong: 'All karakas of this house are well placed, so the insecurity is mild and may surface through a different slice of the house.',
  duty: 'No Lagna has its motivation in the 2nd, 7th or 12th. Family, food, savings, spouse and spending are duties to fulfil, not purposes to live for.',
  method: 'Lagna lord\'s exaltation sign → house = life motivation. Debilitation sign → house = hidden insecurity. The sign creates it; the lord need not sit there. The karaka planets decide which slice of the house it shows through.',
  houseMotivation: '{lord} rules this house and is exalted in the {nth} ({themes}): matters of this house gain drive through those of the {nth}.',
  houseInsecurity: '{lord} is debilitated in the {nth} ({themes}): insecurity about this house plays out there.',
  ownHouseMotivation: '{lord} rules this house and is exalted in it: this house is self-driven.',
  bb12: '12th from the {nth}: loss, expense or control of {themes}',
  bb11: '11th from the {nth}: gains for {themes}',
  bb9: '9th from the {nth}: fortune of {themes}',
  bb6: '6th from the {nth}: trouble, illness or competition for {themes}',
  bb4: '4th from the {nth}: happiness of {themes}',
  planetExalted: '{graha} is exalted in your {nth} house and rules the {rules}: those matters are achieved through {themes}, with less effort.',
  planetDebilitated: '{graha} is debilitated in your {nth} house and rules the {rules}: insecurity about those matters plays out through {themes}.',
  planetExaltedNoRule: '{graha} is exalted in your {nth} house: a strong push towards {themes}.',
  planetDebilitatedNoRule: '{graha} is debilitated in your {nth} house: over-effort around {themes}.',
}

// ── Helpers ──────────────────────────────────────────────────

function houseFrom(asc: Rashi, r: Rashi): number {
  return ((r - asc + 12) % 12) + 1
}

function ord(n: number): string {
  const s = ['th', 'st', 'nd', 'rd']
  const v = n % 100
  return `${n}${s[(v - 20) % 10] || s[v] || s[0]}`
}

const DIGNITY_SCORE: Record<Dignity, number> = {
  exalted: 3, moolatrikona: 2, own: 2, great_friend: 1, friend: 1,
  neutral: 0, enemy: -1, great_enemy: -2, debilitated: -3,
}

function grahaScore(g: GrahaData, all: GrahaData[], asc: Rashi): number {
  let s = DIGNITY_SCORE[g.dignity] ?? 0
  if (g.isCombust) s -= 1
  if (all.some((o) => (o.id === 'Ra' || o.id === 'Ke') && o.id !== g.id && o.rashi === g.rashi)) s -= 1
  const h = houseFrom(asc, g.rashi)
  if (h === 6 || h === 8 || h === 12) s -= 1
  if (h === 1 || h === 4 || h === 7 || h === 10 || h === 5 || h === 9) s += 1
  return s
}

function condition(score: number): FacetCondition {
  return score >= 2 ? 'strong' : score <= -1 ? 'weak' : 'mixed'
}

/** 6/8 or 2/12 relation between two signs. */
function badRelation(a: Rashi, b: Rashi): boolean {
  const d = houseFrom(a, b)
  return d === 6 || d === 8 || d === 2 || d === 12
}

function texts(lang: EngineLang) {
  return lang === 'hi' ? T_HI : EN
}

function gname(id: GrahaId, lang: EngineLang): string {
  return (lang === 'hi' ? GRAHA_HI[id] : GRAHA_NAMES[id]) ?? id
}

function sname(r: Rashi, lang: EngineLang): string {
  return lang === 'hi' ? RASHI_HI[r] : RASHI_NAMES[r]
}

function nth(n: number, lang: EngineLang): string {
  return lang === 'hi' ? ordHi(n) : ord(n)
}

function houseText(h: number, key: 'short' | 'motivation' | 'insecurity', lang: EngineLang): string {
  return (lang === 'hi' ? UN_HOUSE_HI[h]?.[key] : undefined) ?? HOUSE_EN[h]![key]
}

function facetText(h: number, g: GrahaId, lang: EngineLang): string {
  return (lang === 'hi' ? UN_FACET_HI[h]?.[g] : undefined) ?? FACETS_EN[h]?.[g] ?? ''
}

function facetsFor(chart: ChartOutput, house: number, lang: EngineLang): UNFacet[] {
  const asc = chart.lagnas.ascRashi
  return (Object.keys(FACETS_EN[house] ?? {}) as GrahaId[])
    .map((id) => {
      const g = chart.grahas.find((p) => p.id === id)
      if (!g) return null
      const score = grahaScore(g, chart.grahas, asc)
      return { graha: id, facet: facetText(house, id, lang), condition: condition(score), score }
    })
    .filter((f): f is UNFacet => !!f)
    .sort((a, b) => b.score - a.score)
}

function focus(chart: ChartOutput, kind: UNKind, lang: EngineLang): UNFocus {
  const T = texts(lang)
  const asc = chart.lagnas.ascRashi
  const lord = SIGN_LORD_BY_RASHI[asc]
  const sign = (kind === 'motivation' ? EXALTATION_SIGN[lord] : DEBILITATION_SIGN[lord]) as Rashi
  const house = houseFrom(asc, sign)
  const lordG = chart.grahas.find((g) => g.id === lord)
  const lordHouse = lordG ? houseFrom(asc, lordG.rashi) : 0
  const lordInHouse = lordG?.rashi === sign
  const signLord = SIGN_LORD_BY_RASHI[sign]
  const signLordG = chart.grahas.find((g) => g.id === signLord)
  const strained = signLord !== lord && !!lordG && !!signLordG
    && (badRelation(lordG.rashi, signLordG.rashi) || signLordG.dignity === 'debilitated')
  const facets = facetsFor(chart, house, lang)
  const themes = houseText(house, kind, lang)
  const v = { lord: gname(lord, lang), sign: sname(sign, lang), nth: nth(house, lang), themes, signLord: gname(signLord, lang), target: nth(house, lang) }

  const points: string[] = []
  if (kind === 'motivation') {
    points.push(lordInHouse ? fill(T.conscious, v) : fill(T.unconscious, { ...v, nth: nth(lordHouse, lang) }))
    if (strained) points.push(fill(T.strainedMotivation, v))
    const top = facets[0]
    if (top) points.push(fill(T.facetLead, { graha: gname(top.graha, lang), facet: top.facet }))
  } else {
    if (lordInHouse) points.push(fill(T.consciousNeecha, v))
    if (signLord !== lord) points.push(fill(strained ? T.strainedInsecurity : T.softInsecurity, v))
    const weak = [...facets].reverse().find((f) => f.condition !== 'strong')
    points.push(weak ? fill(T.facetWeak, { graha: gname(weak.graha, lang), facet: weak.facet }) : T.facetAllStrong)
  }

  return {
    kind, lord, sign, house, themes, lordHouse, lordInHouse, strained, facets,
    summary: fill(kind === 'motivation' ? T.motivationSummary : T.insecuritySummary, v),
    points,
  }
}

function bhavatBhavam(h: number, lang: EngineLang): string[] {
  const T = texts(lang)
  const rows: [keyof typeof EN, number][] = [['bb12', 12], ['bb11', 11], ['bb9', 9], ['bb6', 6], ['bb4', 4]]
  return rows.map(([key, n]) => {
    // h is the n-th from base → base = h - (n - 1)
    const base = ((h - n + 12) % 12) + 1
    return fill(T[key], { nth: nth(base, lang), themes: houseText(base, 'short', lang) })
  })
}

function rulesOf(g: GrahaId, asc: Rashi): number[] {
  return (Object.keys(SIGN_LORD_BY_RASHI).map(Number) as Rashi[])
    .filter((r) => SIGN_LORD_BY_RASHI[r] === g)
    .map((r) => houseFrom(asc, r))
    .sort((a, b) => a - b)
}

// ── Public API ───────────────────────────────────────────────

export function analyzeUcchaNeechaLens(chart: ChartOutput, lang: EngineLang = 'en'): UcchaNeechaLens {
  const T = texts(lang)
  const asc = chart.lagnas.ascRashi
  const lagnaLord = SIGN_LORD_BY_RASHI[asc]

  const houses: UNHouseLens[] = []
  for (let h = 1; h <= 12; h++) {
    const r = (((asc - 1 + h - 1) % 12) + 1) as Rashi
    const lord = SIGN_LORD_BY_RASHI[r]
    const mh = houseFrom(asc, EXALTATION_SIGN[lord] as Rashi)
    const nh = houseFrom(asc, DEBILITATION_SIGN[lord] as Rashi)
    const v = { lord: gname(lord, lang) }
    houses.push({
      house: h,
      lord,
      motivationHouse: mh,
      insecurityHouse: nh,
      motivationText: mh === h
        ? fill(T.ownHouseMotivation, v)
        : fill(T.houseMotivation, { ...v, nth: nth(mh, lang), themes: houseText(mh, 'motivation', lang) }),
      insecurityText: fill(T.houseInsecurity, { ...v, nth: nth(nh, lang), themes: houseText(nh, 'insecurity', lang) }),
      bhavatBhavam: bhavatBhavam(h, lang),
      special: (lang === 'hi' ? UN_SPECIAL_HI[h] : undefined) ?? SPECIAL_EN[h] ?? null,
    })
  }

  const planets: UNPlanetLens[] = []
  for (const id of SEVEN) {
    const g = chart.grahas.find((p) => p.id === id)
    if (!g || (g.dignity !== 'exalted' && g.dignity !== 'debilitated')) continue
    const house = houseFrom(asc, g.rashi)
    const rules = rulesOf(id, asc).filter((x) => x !== house)
    const exalted = g.dignity === 'exalted'
    const themes = houseText(house, exalted ? 'motivation' : 'insecurity', lang)
    const v = {
      graha: gname(id, lang),
      nth: nth(house, lang),
      themes,
      rules: rules.map((x) => nth(x, lang)).join(lang === 'hi' ? ' व ' : ' and '),
    }
    const tpl = rules.length
      ? (exalted ? T.planetExalted : T.planetDebilitated)
      : (exalted ? T.planetExaltedNoRule : T.planetDebilitatedNoRule)
    planets.push({ graha: id, dignity: g.dignity, house, rules, text: fill(tpl, v) })
  }

  return {
    lagnaRashi: asc,
    lagnaLord,
    motivation: focus(chart, 'motivation', lang),
    insecurity: focus(chart, 'insecurity', lang),
    dutyNote: T.duty,
    method: T.method,
    houses,
    planets,
  }
}

/** Motivation / insecurity house per Lagna (1–12), for teaching tables. */
export function lagnaUcchaNeechaHouses(asc: Rashi): { motivation: number; insecurity: number } {
  const lord = SIGN_LORD_BY_RASHI[asc]
  return {
    motivation: houseFrom(asc, EXALTATION_SIGN[lord] as Rashi),
    insecurity: houseFrom(asc, DEBILITATION_SIGN[lord] as Rashi),
  }
}

const LABEL_EN = {
  motivationTitle: 'Life motivation — {nth} house',
  insecurityTitle: 'Hidden insecurity — {nth} house',
  subtitle: 'Lagna lord {lord} · {sign}',
  duty: 'Duty houses',
  method: 'Method',
  motivation: 'Motivation (uccha lens)',
  insecurity: 'Insecurity (neecha lens)',
  bhavatBhavam: 'Bhavat bhavam',
  houseNote: 'House link',
  planetLens: 'Uccha–neecha lens',
  tabTitle: 'Uccha–Neecha lens',
  tabIntro: 'Where your Lagna lord is exalted is what you are here to chase; where it is debilitated is what you over-guard. The same lens runs for every house lord. Read these as possibilities the karakas refine, not verdicts.',
  colHouse: 'House',
  colLord: 'Lord',
  colDrive: 'Drive via',
  colFear: 'Insecurity in',
  house: 'House {n}',
  rules: 'Rules {list}',
  exalted: 'Exalted',
  debilitated: 'Debilitated',
  karakas: 'Karaka slices',
  planetsTitle: 'Each planet as a house lord',
  planetsIntro: 'A planet carries the houses it rules to the house of its exaltation sign (drive) and its debilitation sign (insecurity).',
  housesTitle: 'House by house',
  noRule: 'Rules no sign',
}

export function ucchaNeechaLabels(lang: EngineLang = 'en'): typeof LABEL_EN {
  return lang === 'hi' ? UN_LABEL_HI : LABEL_EN
}

/** Ordinal for a focus title ("10th" / "दसवाँ"). */
export function ucchaNeechaTitle(kind: UNKind, house: number, lang: EngineLang = 'en'): string {
  const L = ucchaNeechaLabels(lang)
  return fill(kind === 'motivation' ? L.motivationTitle : L.insecurityTitle, { nth: lang === 'hi' ? ordHiDirect(house) : ord(house) })
}
