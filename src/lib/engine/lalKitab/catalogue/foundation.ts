// ─────────────────────────────────────────────────────────────
//  src/lib/engine/lalKitab/catalogue/foundation.ts
//  Foundation rules: permanent house, exaltation and debilitation,
//  company of friends and enemies, aspects and takkar.
//  Edition: 1952. Text written in our own words.
// ─────────────────────────────────────────────────────────────

import { LK_NEECH, LK_PAKKA_GHAR, LK_UCHCHA } from '../pakkaGhar'
import { LK_GRAHAS, type LkArea, type LkGraha } from '../types'
import type { LkRule, LkRuleText } from './types'

/** Main life areas each planet rules, used to tag its findings. */
export const LK_GRAHA_AREAS: Record<LkGraha, readonly LkArea[]> = {
  Su: ['self', 'father', 'career'],
  Mo: ['mother', 'wealth', 'health'],
  Ma: ['siblings', 'health'],
  Me: ['family', 'career'],
  Ju: ['fortune', 'children', 'family'],
  Ve: ['marriage', 'family'],
  Sa: ['career', 'longevity'],
  Ra: ['expenses', 'health'],
  Ke: ['children', 'expenses'],
}

function dignityRules(): LkRule[] {
  const out: LkRule[] = []
  for (const p of LK_GRAHAS) {
    for (const h of LK_PAKKA_GHAR[p]) {
      out.push({ id: `pakka.${p}.${h}`, text: `pakka.${p}.${h}`, when: { op: 'inHouse', planet: p, houses: [h] }, effect: p === 'Ma' && h === 8 ? 'mixed' : 'good', weight: 3, areas: LK_GRAHA_AREAS[p], planet: p, edition: '1952' })
    }
    for (const h of LK_UCHCHA[p]) {
      out.push({ id: `uchcha.${p}.${h}`, text: `uchcha.${p}`, when: { op: 'inHouse', planet: p, houses: [h] }, effect: 'good', weight: 4, areas: LK_GRAHA_AREAS[p], planet: p, edition: '1952' })
    }
    for (const h of LK_NEECH[p]) {
      out.push({ id: `neech.${p}.${h}`, text: `neech.${p}`, when: { op: 'inHouse', planet: p, houses: [h] }, effect: 'bad', weight: 4, areas: LK_GRAHA_AREAS[p], planet: p, edition: '1952' })
    }
  }
  return out
}

function relationRules(): LkRule[] {
  return LK_GRAHAS.flatMap((p): LkRule[] => [
    { id: `enemyCompany.${p}`, text: 'enemyCompany', when: { op: 'enemyWith', planet: p }, effect: 'bad', weight: 2, areas: LK_GRAHA_AREAS[p], planet: p, edition: '1952' },
    { id: `friendCompany.${p}`, text: 'friendCompany', when: { op: 'friendWith', planet: p }, effect: 'good', weight: 1, areas: LK_GRAHA_AREAS[p], planet: p, edition: '1952' },
    { id: `enemyAspect.${p}`, text: 'enemyAspect', when: { op: 'aspectedByEnemy', planet: p }, effect: 'bad', weight: 2, areas: LK_GRAHA_AREAS[p], planet: p, edition: '1952' },
    { id: `friendAspect.${p}`, text: 'friendAspect', when: { op: 'aspectedByFriend', planet: p }, effect: 'good', weight: 1, areas: LK_GRAHA_AREAS[p], planet: p, edition: '1952' },
    { id: `takkar.${p}`, text: 'takkar', when: { op: 'takkarFromEnemy', planet: p }, effect: 'bad', weight: 2, areas: LK_GRAHA_AREAS[p], planet: p, edition: '1952' },
  ])
}

export const LK_FOUNDATION_RULES: readonly LkRule[] = [...dignityRules(), ...relationRules()]

export const LK_FOUNDATION_TEXT: Record<string, LkRuleText> = {
  'pakka.Su.1': { label: 'Sun on its own throne', text: 'The Sun sits in its permanent house 1: self-respect, sound health and good standing with the state.' },
  'pakka.Mo.4': { label: 'Moon at home', text: 'The Moon is in its permanent house 4: peace of mind, the mother\'s blessing and a home that does not run dry.' },
  'pakka.Ma.3': { label: 'Good Mars in its house', text: 'Mars is in house 3, its permanent house as good Mars: brothers and friends stand with you and courage pays.' },
  'pakka.Ma.8': { label: 'Mars in its hard house', text: 'Mars is in house 8, its permanent house as hard Mars: strength in a crisis, but watch temper, blood and accidents.' },
  'pakka.Me.7': { label: 'Mercury at home', text: 'Mercury is in its permanent house 7: sharp in trade and partnership; the daughters and sisters of the house do well.' },
  'pakka.Ju.2': { label: 'Jupiter at home', text: 'Jupiter is in its permanent house 2: family wealth, respect at the place of worship and the blessing of elders.' },
  'pakka.Ve.7': { label: 'Venus at home', text: 'Venus is in its permanent house 7: a loving spouse and a comfortable household.' },
  'pakka.Sa.8': { label: 'Saturn at home', text: 'Saturn is in its permanent house 8: long life and protection in hard times, kept so by staying away from drink and meat.' },
  'pakka.Ra.12': { label: 'Rahu at home', text: 'Rahu is in its permanent house 12: its restlessness goes into expenses and travel rather than into harm.' },
  'pakka.Ke.6': { label: 'Ketu at home', text: 'Ketu is in its permanent house 6: travel and the maternal family support you, and sons do well.' },
  'uchcha.Su': { label: 'Exalted Sun', text: 'The Sun is exalted in house 1: authority, government favour and a strong body.' },
  'uchcha.Mo': { label: 'Exalted Moon', text: 'The Moon is exalted in house 2: wealth from the mother\'s side and a calm, sweet way of speaking.' },
  'uchcha.Ma': { label: 'Exalted Mars', text: 'Mars is exalted in house 10: rise through courage, land and property, and respect at work.' },
  'uchcha.Me': { label: 'Exalted Mercury', text: 'Mercury is exalted in house 6: you beat opponents with your wits; good for trade and writing.' },
  'uchcha.Ju': { label: 'Exalted Jupiter', text: 'Jupiter is exalted in house 4: a happy home, a caring mother, learning and land.' },
  'uchcha.Ve': { label: 'Exalted Venus', text: 'Venus is exalted in house 12: comfort, a devoted spouse and restful nights.' },
  'uchcha.Sa': { label: 'Exalted Saturn', text: 'Saturn is exalted in house 7: a steady marriage and gains through business, machines and property.' },
  'neech.Su': { label: 'Debilitated Sun', text: 'The Sun is debilitated in house 7: friction with the spouse and with authority; pride hurts partnerships.' },
  'neech.Mo': { label: 'Debilitated Moon', text: 'The Moon is debilitated in house 8: worry, a restless mind and strain on the mother\'s side.' },
  'neech.Ma': { label: 'Debilitated Mars', text: 'Mars is debilitated in house 4: heat in the home, quarrels over property and care needed around fire and blood.' },
  'neech.Me': { label: 'Debilitated Mercury', text: 'Mercury is debilitated in house 12: careless words and poor money choices bring expenses.' },
  'neech.Ju': { label: 'Debilitated Jupiter', text: 'Jupiter is debilitated in house 10: learning does not easily turn into status, and ignoring elders costs you.' },
  'neech.Ve': { label: 'Debilitated Venus', text: 'Venus is debilitated in house 6: the spouse\'s health and married comfort need care.' },
  'neech.Sa': { label: 'Debilitated Saturn', text: 'Saturn is debilitated in house 1: a slow, hard start in life; laziness and drink make it worse.' },
  enemyCompany: { label: '{planet} with an enemy', text: '{planet} shares house {house} with {others}, a planet it counts as an enemy, so its own results are held back.' },
  friendCompany: { label: '{planet} with a friend', text: '{planet} shares house {house} with {others}, a friend, and the two support each other.' },
  enemyAspect: { label: '{planet} under an enemy\'s aspect', text: '{planet} is aspected by {others}, an enemy, which spoils part of what it gives.' },
  friendAspect: { label: '{planet} under a friend\'s aspect', text: '{planet} is aspected by {others}, a friend, which backs up what it gives.' },
  takkar: { label: 'Takkar on {planet}', text: '{others} strikes {planet} from the house eight places behind it (takkar): sudden setbacks in what {planet} rules.' },
}
