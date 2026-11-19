// ─────────────────────────────────────────────────────────────
//  src/lib/engine/lalKitab/catalogue/rin.ts
//  Rin (karmic debts): a debt carried from the family's past, shown by
//  set planets in set houses. It is cleared together: every blood
//  relative gives an equal share toward one remedy done on one day.
//  Trigger houses follow the commonly cited 1952 list; descriptions,
//  signs and remedies are in our own words. Remedies avoid harm to
//  people or animals and large sums.
//  Hindi: locale/lalKitabDoshaRin.hi.ts.
// ─────────────────────────────────────────────────────────────

import type { LkCondition } from '../conditions'
import type { LkArea, LkGraha, LkHouse } from '../types'
import type { LkRule, LkRuleText } from './types'

export const LK_RIN_IDS = ['pitri', 'matri', 'stri', 'bhai', 'behan', 'zalim', 'ajanma', 'daivik', 'swa'] as const
export type LkRinId = (typeof LK_RIN_IDS)[number]

export interface LkRinDef {
  id: LkRinId
  planets: readonly LkGraha[]
  houses: readonly LkHouse[]
  areas: readonly LkArea[]
}

export const LK_RIN: readonly LkRinDef[] = [
  { id: 'pitri', planets: ['Ve', 'Me', 'Ra'], houses: [2, 5, 9, 12], areas: ['father', 'fortune', 'family'] },
  { id: 'matri', planets: ['Ke'], houses: [4], areas: ['mother'] },
  { id: 'stri', planets: ['Su', 'Ra', 'Ke'], houses: [2, 7], areas: ['marriage', 'family'] },
  { id: 'bhai', planets: ['Me', 'Ke'], houses: [1, 8], areas: ['siblings', 'family'] },
  { id: 'behan', planets: ['Mo'], houses: [3, 6], areas: ['family', 'children'] },
  { id: 'zalim', planets: ['Su', 'Mo', 'Ma'], houses: [10, 11], areas: ['career', 'gains'] },
  { id: 'ajanma', planets: ['Su', 'Ve', 'Ma'], houses: [12], areas: ['expenses', 'children'] },
  { id: 'daivik', planets: ['Mo', 'Ma'], houses: [6], areas: ['health', 'family'] },
  { id: 'swa', planets: ['Ve', 'Sa', 'Ra', 'Ke'], houses: [5], areas: ['self', 'children'] },
]

function trigger(def: LkRinDef): LkCondition {
  return { op: 'any', of: def.planets.map((planet) => ({ op: 'inHouse', planet, houses: def.houses } as LkCondition)) }
}

export const LK_RIN_RULES: readonly LkRule[] = LK_RIN.map((def) => ({
  id: `rin.${def.id}`,
  text: `rin.${def.id}`,
  when: trigger(def),
  effect: 'bad',
  weight: 4,
  areas: def.areas,
  edition: '1952',
}))

export interface LkRinDetail {
  /** What the debt is said to come from. */
  origin: string
  /** Signs in life that the debt is active. */
  signs: readonly string[]
  /** Who takes part in clearing it. */
  who: string
  /** The shared family remedy. */
  remedy: string
}

export const LK_RIN_TEXT: Record<string, LkRuleText> = {
  'rin.pitri': { label: 'Pitri Rin (ancestral debt)', text: '{others} in house {house} marks a debt to the ancestors: what the family owes its forefathers comes back as delays in fortune and money.' },
  'rin.matri': { label: 'Matri Rin (debt to the mother)', text: 'Ketu in house 4 marks a debt to the mother: neglect of a mother in the family\'s past shows up as worry, debts and loss of peace at home.' },
  'rin.stri': { label: 'Stri Rin (debt to a wife)', text: '{others} in house {house} marks a debt to a woman of the family: harm done to a wife or daughter-in-law in the past weighs on married and family life.' },
  'rin.bhai': { label: 'Bhai Rin (debt to a brother or friend)', text: '{others} in house {house} marks a debt to a brother or friend: a betrayal in the family\'s past brings loss through relatives and broken trust.' },
  'rin.behan': { label: 'Behan Rin (debt to a sister or daughter)', text: 'The Moon in house {house} marks a debt to a sister or daughter: harm done to a girl of the family comes back as trouble in business and with children.' },
  'rin.zalim': { label: 'Zalim Rin (debt of the oppressor)', text: '{others} in house {house} marks a debt for cruelty or cheating: what was taken unfairly from workers or the weak comes back as losses at work and home.' },
  'rin.ajanma': { label: 'Ajanma Rin (debt to the unborn)', text: '{others} in house {house} marks a debt to a relative wronged by the family: setbacks come suddenly, often through accidents or in-laws.' },
  'rin.daivik': { label: 'Daivik Rin (divine debt)', text: '{others} in house {house} marks a debt for harm to living beings: cruelty to animals in the family\'s past brings trouble with children and health.' },
  'rin.swa': { label: 'Swa Rin (debt to oneself)', text: '{others} in house {house} marks a debt from going against the family\'s faith or customs: troubles come without clear cause, often with health or government.' },
}

export const LK_RIN_DETAIL: Record<LkRinId, LkRinDetail> = {
  pitri: {
    origin: 'The family neglected its forefathers, a family priest, or a temple or tree near the ancestral home.',
    signs: ['Hair turns grey early', 'Debts build up in later life', 'Work rises well and then falls back', 'Trouble around the ancestral house'],
    who: 'Every blood relative on the father\'s side gives an equal share.',
    remedy: 'Collect the shares on one day and give them together at a place of worship or to feed people in need.',
  },
  matri: {
    origin: 'A mother in the family was neglected or hurt.',
    signs: ['Money comes and goes without staying', 'Worry and poor sleep', 'Debts keep returning', 'The mother\'s health is weak'],
    who: 'Every blood relative gives an equal share of silver.',
    remedy: 'Collect the silver on one day and let it go together in flowing water.',
  },
  stri: {
    origin: 'A wife or daughter-in-law of the family was wronged or sent away.',
    signs: ['Trouble at weddings and in married life', 'Illness among the women of the house', 'Loss at times of celebration'],
    who: 'Every member of the family gives an equal share.',
    remedy: 'On one day, use the shares to feed cows together.',
  },
  bhai: {
    origin: 'A brother, relative or friend was cheated by the family.',
    signs: ['Loss through relatives', 'Friends turn into rivals', 'Money lent is not returned'],
    who: 'Every member of the family gives an equal share.',
    remedy: 'Give the shares together on one day toward medicine or care for the sick.',
  },
  behan: {
    origin: 'A sister or daughter of the family was hurt or denied her share.',
    signs: ['Business falls back after a good start', 'Worry about sisters or daughters', 'Children face early obstacles'],
    who: 'Every member of the family gives an equal share.',
    remedy: 'On one day, give the shares together for the welfare of girls, such as books or schooling.',
  },
  zalim: {
    origin: 'The family took what was not its own, or cheated workers or the weak.',
    signs: ['Losses at work for no clear reason', 'Disputes over property', 'Workers or tenants turn against you'],
    who: 'Every member of the family gives an equal share.',
    remedy: 'On one day, use the shares together to feed workers or labourers.',
  },
  ajanma: {
    origin: 'A relative or in-law was wronged, or someone was harmed through the family.',
    signs: ['Sudden setbacks and accidents', 'Trouble from in-laws', 'Plans break just before they finish'],
    who: 'Every member of the family gives one coconut.',
    remedy: 'Collect the coconuts on one day and let them go together in flowing water.',
  },
  daivik: {
    origin: 'Animals were harmed or their homes destroyed by the family.',
    signs: ['Trouble around children', 'Repeated illness without clear cause', 'Pets do not thrive'],
    who: 'Every member of the family gives an equal share.',
    remedy: 'On one day, use the shares together to feed dogs or other animals.',
  },
  swa: {
    origin: 'The family turned away from its own faith or customs.',
    signs: ['Trouble with the government or the law', 'Health dips without clear cause', 'Efforts lose their result'],
    who: 'Every member of the family gives an equal share.',
    remedy: 'Perform a prayer or havan together on one day with the shares.',
  },
}
