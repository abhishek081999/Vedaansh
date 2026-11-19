// ─────────────────────────────────────────────────────────────
//  src/lib/engine/lalKitab/read.ts
//  readLalKitab(chart) — the assembled Lal Kitab reading. Pure.
//  Display strings follow `lang`; ids, houses and codes stay English.
// ─────────────────────────────────────────────────────────────

import type { ChartOutput } from '@/types/astrology'
import { GRAHA_NAMES } from '@/types/astrology'
import { GRAHA_HI } from '@/i18n/jyotish'
import { fill, type EngineLang } from '@/lib/engine/lang'
import { LK_FOUNDATION_TEXT_HI } from '@/lib/engine/locale/lalKitabFoundation.hi'
import { buildTeva, type LkTeva } from './chart'
import { LK_FOUNDATION_RULES, LK_FOUNDATION_TEXT } from './catalogue/foundation'
import type { LkRule, LkRuleText } from './catalogue/types'
import type { LkTrailStep } from './conditions'
import { lkAspectsFromHouse, lkBunyadHouse, lkTakkarHouse, type LkPlanetAspect, type LkTakkar } from './drishti'
import { evaluateRules } from './evaluate'
import { lkFactsFromTeva, type LkFacts } from './facts'
import { lkGrahaKaraka, lkHouseMeaning, type LkGrahaKaraka, type LkHouseMeaning } from './karakas'
import { LK_HOUSE_KARAKA, lkDignity, type LkDignity } from './pakkaGhar'
import { LK_GRAHAS, LK_HOUSES, type LkArea, type LkAspectKind, type LkEffect, type LkGraha, type LkHouse } from './types'

export interface LkFinding {
  id: string
  effect: LkEffect
  weight: number
  areas: readonly LkArea[]
  planet?: LkGraha
  label: string
  text: string
  /** Plain-language reasons, one per fact that matched. */
  why: string[]
  trail: LkTrailStep[]
}

export interface LkPlanetView {
  id: LkGraha
  name: string
  house: LkHouse
  retro: boolean
  dignities: LkDignity[]
  karaka: LkGrahaKaraka
  aspectsGiven: LkPlanetAspect[]
  aspectsReceived: LkPlanetAspect[]
  takkarGiven: LkTakkar[]
  takkarReceived: LkTakkar[]
}

export interface LkHouseView {
  house: LkHouse
  meaning: LkHouseMeaning
  occupants: LkGraha[]
  karakas: readonly LkGraha[]
  empty: boolean
  /** Houses this house aspects, by rule. */
  aspectsTo: { house: LkHouse; kind: LkAspectKind }[]
  /** Houses that aspect this house, by rule. */
  aspectedFrom: { house: LkHouse; kind: LkAspectKind }[]
  takkarTo: LkHouse
  bunyad: LkHouse
}

export interface LalKitabReading {
  lang: EngineLang
  teva: LkTeva
  chandra: LkTeva
  planets: LkPlanetView[]
  houses: LkHouseView[]
  aspects: LkPlanetAspect[]
  takkars: LkTakkar[]
  findings: LkFinding[]
}

export interface ReadLalKitabOptions {
  lang?: EngineLang
  ageYears?: number
}

const RULES: readonly LkRule[] = LK_FOUNDATION_RULES

function ruleText(key: string, lang: EngineLang): LkRuleText {
  const en = LK_FOUNDATION_TEXT[key] ?? { label: key, text: key }
  return lang === 'hi' ? LK_FOUNDATION_TEXT_HI[key] ?? en : en
}

export function lkGrahaName(id: LkGraha, lang: EngineLang): string {
  return lang === 'hi' ? GRAHA_HI[id] : GRAHA_NAMES[id]
}

function names(ids: readonly LkGraha[] | undefined, lang: EngineLang): string {
  const list = (ids ?? []).map((id) => lkGrahaName(id, lang))
  return list.join(lang === 'hi' ? ', ' : ', ')
}

const KIND_EN: Record<LkAspectKind, string> = { full: 'full, 100%', half: 'half, 50%', quarter: 'quarter, 25%' }
const KIND_HI: Record<LkAspectKind, string> = { full: 'पूर्ण, 100%', half: 'आधी, 50%', quarter: 'चौथाई, 25%' }

const STEP_EN: Record<LkTrailStep['op'], string> = {
  inHouse: '{planet} is in house {house}',
  with: '{planet} sits with {others}',
  aspects: '{others} aspects {planet} ({kind})',
  aspectedByEnemy: '{planet} is aspected by its enemy {others}',
  aspectedByFriend: '{planet} is aspected by its friend {others}',
  takkarFromEnemy: '{others} strikes {planet} by takkar',
  houseEmpty: 'house {house} is empty',
  houseOccupied: 'house {house} holds {others}',
  inPakkaGhar: '{planet} is in its permanent house {house}',
  uchcha: '{planet} is exalted in house {house}',
  neech: '{planet} is debilitated in house {house}',
  enemyWith: '{planet} shares house {house} with its enemy {others}',
  friendWith: '{planet} shares house {house} with its friend {others}',
  ageAtLeast: 'age is {years} or more',
}

const STEP_HI: Record<LkTrailStep['op'], string> = {
  inHouse: '{planet} भाव {house} में है',
  with: '{planet} {others} के साथ बैठा है',
  aspects: '{others} की {planet} पर दृष्टि है ({kind})',
  aspectedByEnemy: '{planet} पर शत्रु {others} की दृष्टि है',
  aspectedByFriend: '{planet} पर मित्र {others} की दृष्टि है',
  takkarFromEnemy: '{others} {planet} पर टक्कर मारता है',
  houseEmpty: 'भाव {house} ख़ाली है',
  houseOccupied: 'भाव {house} में {others} हैं',
  inPakkaGhar: '{planet} अपने पक्के घर {house} में है',
  uchcha: '{planet} भाव {house} में उच्च का है',
  neech: '{planet} भाव {house} में नीच का है',
  enemyWith: '{planet} भाव {house} में शत्रु {others} के साथ है',
  friendWith: '{planet} भाव {house} में मित्र {others} के साथ है',
  ageAtLeast: 'आयु {years} वर्ष या अधिक है',
}

export function describeLkStep(step: LkTrailStep, lang: EngineLang = 'en'): string {
  const hi = lang === 'hi'
  const line = fill((hi ? STEP_HI : STEP_EN)[step.op], {
    planet: step.planet ? lkGrahaName(step.planet, lang) : '',
    others: names(step.others, lang),
    house: step.house ?? '',
    kind: step.kind ? (hi ? KIND_HI : KIND_EN)[step.kind] : '',
    years: step.years ?? '',
  })
  return step.negated ? (hi ? `ऐसा नहीं: ${line}` : `Not so: ${line}`) : line
}

function toFinding(rule: LkRule, trail: LkTrailStep[], facts: LkFacts, lang: EngineLang): LkFinding {
  const t = ruleText(rule.text, lang)
  const others = trail.flatMap((s) => s.others ?? [])
  const slots = {
    planet: rule.planet ? lkGrahaName(rule.planet, lang) : '',
    house: rule.planet ? facts.teva.house[rule.planet] ?? '' : '',
    others: names([...new Set(others)], lang),
  }
  return {
    id: rule.id,
    effect: rule.effect,
    weight: rule.weight,
    areas: rule.areas,
    planet: rule.planet,
    label: fill(t.label, slots),
    text: fill(t.text, slots),
    why: trail.map((s) => describeLkStep(s, lang)),
    trail,
  }
}

function planetViews(facts: LkFacts, lang: EngineLang): LkPlanetView[] {
  const { teva, aspects, takkars } = facts
  return LK_GRAHAS.filter((id) => teva.house[id]).map((id) => ({
    id,
    name: lkGrahaName(id, lang),
    house: teva.house[id],
    retro: !!teva.retro[id],
    dignities: lkDignity(id, teva.house[id]),
    karaka: lkGrahaKaraka(id, lang),
    aspectsGiven: aspects.filter((a) => a.from === id),
    aspectsReceived: aspects.filter((a) => a.to === id),
    takkarGiven: takkars.filter((t) => t.from === id),
    takkarReceived: takkars.filter((t) => t.to === id),
  }))
}

function houseViews(teva: LkTeva, lang: EngineLang): LkHouseView[] {
  return LK_HOUSES.map((h) => ({
    house: h,
    meaning: lkHouseMeaning(h, lang),
    occupants: [...teva.occupants[h]],
    karakas: LK_HOUSE_KARAKA[h],
    empty: teva.occupants[h].length === 0,
    aspectsTo: lkAspectsFromHouse(h).map((a) => ({ house: a.to, kind: a.kind })),
    aspectedFrom: LK_HOUSES.flatMap((from) => lkAspectsFromHouse(from).filter((a) => a.to === h).map((a) => ({ house: from, kind: a.kind }))),
    takkarTo: lkTakkarHouse(h),
    bunyad: lkBunyadHouse(h),
  }))
}

export function readLalKitab(chart: ChartOutput, opts: ReadLalKitabOptions = {}): LalKitabReading {
  const lang = opts.lang ?? 'en'
  const teva = buildTeva(chart, 'lagna')
  const chandra = buildTeva(chart, 'chandra')
  const facts = lkFactsFromTeva(teva, opts.ageYears)
  const findings = evaluateRules(RULES, facts).map((m) => toFinding(m.rule, m.trail, facts, lang))
  return {
    lang,
    teva,
    chandra,
    planets: planetViews(facts, lang),
    houses: houseViews(teva, lang),
    aspects: facts.aspects,
    takkars: facts.takkars,
    findings,
  }
}
