// ─────────────────────────────────────────────────────────────
//  src/lib/engine/lalKitab/catalogue/upay.ts
//  Lal Kitab remedies (upay) and prohibitions (parhez), as data.
//
//  Each remedy belongs to one planet and lists the houses it suits
//  ('all' or a set). The remedies for a planet in a house are the
//  pool entries that suit that house, which gives a set for each of
//  the 108 placements without repeating text.
//
//  `strengthens` / `releases` say how the remedy acts: keeping,
//  serving and worship strengthen a planet; giving, flowing away and
//  feeding release its hard side. The conflict check uses them.
//
//  Safety: no remedy harms people or animals, asks for large sums or
//  replaces medical, legal or financial help. Written in our own words
//  from commonly used Lal Kitab remedies. Edition: commentary.
//  Hindi: locale/lalKitabUpay.hi.ts (keyed by id).
// ─────────────────────────────────────────────────────────────

import type { LkEdition, LkGraha, LkHouse } from '../types'
import type { LkLifeArea } from '../phal'

export type LkUpayKind = 'worship' | 'serve' | 'keep' | 'habit' | 'donate' | 'flow' | 'feed'
export type LkUpayCost = 'none' | 'low' | 'medium'

export interface LkUpay {
  id: string
  planet: LkGraha
  kind: LkUpayKind
  houses: 'all' | readonly LkHouse[]
  /** Days in a row; 1 means once. */
  days: 1 | 40 | 43
  cost: LkUpayCost
  strengthens: readonly LkGraha[]
  releases: readonly LkGraha[]
  text: string
}

export const LK_UPAY_EDITION: LkEdition = 'commentary'

/** Weekday of each planet, 0 = Sunday. */
export const LK_PLANET_DAY: Record<LkGraha, number> = { Su: 0, Mo: 1, Ma: 2, Me: 3, Ju: 4, Ve: 5, Sa: 6, Ra: 6, Ke: 4 }

type Raw = Omit<LkUpay, 'strengthens' | 'releases' | 'planet'>
const STRENGTHEN: readonly LkUpayKind[] = ['worship', 'serve', 'keep', 'habit']

function pool(planet: LkGraha, list: readonly Raw[]): LkUpay[] {
  return list.map((r) => ({
    ...r,
    planet,
    strengthens: STRENGTHEN.includes(r.kind) ? [planet] : [],
    releases: STRENGTHEN.includes(r.kind) ? [] : [planet],
  }))
}

export const LK_UPAY: readonly LkUpay[] = [
  ...pool('Su', [
    { id: 'Su.water', kind: 'worship', houses: 'all', days: 43, cost: 'none', text: 'Offer water to the rising Sun from a copper vessel each morning.' },
    { id: 'Su.father', kind: 'serve', houses: 'all', days: 43, cost: 'none', text: 'Serve your father and take his blessing before any new work.' },
    { id: 'Su.honest', kind: 'habit', houses: 'all', days: 43, cost: 'none', text: 'Keep every dealing with the government and officials fully honest.' },
    { id: 'Su.copperFlow', kind: 'flow', houses: [6, 7, 8, 10], days: 43, cost: 'low', text: 'Let a copper coin go in flowing water.' },
    { id: 'Su.jaggery', kind: 'donate', houses: [6, 7, 10, 11, 12], days: 43, cost: 'low', text: 'Give wheat and jaggery at a temple or to people in need on Sundays.' },
    { id: 'Su.feed', kind: 'feed', houses: [5, 7, 8, 12], days: 43, cost: 'low', text: 'Feed jaggery or wheat to cows or monkeys.' },
  ]),
  ...pool('Mo', [
    { id: 'Mo.mother', kind: 'serve', houses: 'all', days: 43, cost: 'none', text: 'Touch your mother\'s feet and take her blessing every day.' },
    { id: 'Mo.elders', kind: 'serve', houses: 'all', days: 43, cost: 'none', text: 'Serve elderly women of the family and take their blessings.' },
    { id: 'Mo.silver', kind: 'keep', houses: [2, 3, 4, 5, 9, 10, 11], days: 1, cost: 'low', text: 'Keep a small square piece of silver with you.' },
    { id: 'Mo.waterBed', kind: 'keep', houses: [6, 8, 12], days: 43, cost: 'none', text: 'Keep a glass of water by the bed at night and pour it on a plant in the morning.' },
    { id: 'Mo.riceFlow', kind: 'flow', houses: [6, 8, 12], days: 43, cost: 'low', text: 'Let a little rice or milk go in flowing water on Mondays.' },
    { id: 'Mo.water', kind: 'donate', houses: [1, 3, 6, 7, 8, 10], days: 43, cost: 'low', text: 'Offer drinking water to travellers or at a temple.' },
  ]),
  ...pool('Ma', [
    { id: 'Ma.brothers', kind: 'serve', houses: 'all', days: 43, cost: 'none', text: 'Keep good relations with your brothers and help them when they need it.' },
    { id: 'Ma.hanuman', kind: 'worship', houses: 'all', days: 43, cost: 'none', text: 'Visit a Hanuman temple or recite the Hanuman Chalisa on Tuesdays.' },
    { id: 'Ma.sweets', kind: 'donate', houses: [1, 4, 7, 8, 12], days: 43, cost: 'low', text: 'Give sweets, red lentils or honey at a temple on Tuesdays.' },
    { id: 'Ma.flow', kind: 'flow', houses: [4, 8], days: 43, cost: 'low', text: 'Let sugar sweets (batashe) go in flowing water on Tuesdays.' },
    { id: 'Ma.share', kind: 'feed', houses: [3, 5, 6, 10], days: 43, cost: 'low', text: 'Share sweet bread with others or feed it to dogs on Tuesdays.' },
    { id: 'Ma.temper', kind: 'habit', houses: 'all', days: 43, cost: 'none', text: 'Hold back anger and keep your word.' },
  ]),
  ...pool('Me', [
    { id: 'Me.sisters', kind: 'serve', houses: 'all', days: 43, cost: 'none', text: 'Respect sisters, daughters and aunts, and give them small gifts.' },
    { id: 'Me.words', kind: 'habit', houses: 'all', days: 43, cost: 'none', text: 'Keep your promises and stay away from gossip.' },
    { id: 'Me.teeth', kind: 'habit', houses: [1, 2, 3, 6, 7, 8, 12], days: 43, cost: 'none', text: 'Look after your teeth: clean them well every day.' },
    { id: 'Me.coinFlow', kind: 'flow', houses: [3, 8, 9, 12], days: 43, cost: 'low', text: 'Let a copper coin with a hole in it go in flowing water.' },
    { id: 'Me.green', kind: 'donate', houses: [3, 4, 8, 10, 12], days: 43, cost: 'low', text: 'Give green moong lentils or green cloth on Wednesdays.' },
    { id: 'Me.cows', kind: 'feed', houses: [4, 5, 6, 9, 11], days: 43, cost: 'low', text: 'Feed green fodder to cows on Wednesdays.' },
  ]),
  ...pool('Ju', [
    { id: 'Ju.tilak', kind: 'habit', houses: 'all', days: 43, cost: 'low', text: 'Put a saffron or turmeric tilak on the forehead each morning.' },
    { id: 'Ju.elders', kind: 'serve', houses: 'all', days: 43, cost: 'none', text: 'Serve teachers, elders and the family priest.' },
    { id: 'Ju.peepal', kind: 'worship', houses: [2, 4, 5, 9, 11, 12], days: 43, cost: 'none', text: 'Water a peepal tree on Thursdays.' },
    { id: 'Ju.gold', kind: 'keep', houses: [1, 2, 4, 5, 9, 11, 12], days: 1, cost: 'medium', text: 'Wear a little gold on the body.' },
    { id: 'Ju.temple', kind: 'donate', houses: [3, 6, 7, 8, 10], days: 43, cost: 'low', text: 'Give gram lentils or turmeric at a temple on Thursdays.' },
    { id: 'Ju.almonds', kind: 'flow', houses: [7, 10], days: 43, cost: 'low', text: 'Let a few almonds go in flowing water on Thursdays.' },
  ]),
  ...pool('Ve', [
    { id: 'Ve.spouse', kind: 'serve', houses: 'all', days: 43, cost: 'none', text: 'Treat your spouse with respect, and keep the bedroom clean and fragrant.' },
    { id: 'Ve.clean', kind: 'habit', houses: 'all', days: 43, cost: 'none', text: 'Bathe daily, wear clean clothes and use a light perfume.' },
    { id: 'Ve.cow', kind: 'feed', houses: [1, 4, 6, 7, 8, 9], days: 43, cost: 'low', text: 'Feed a cow a share of your own meal each day.' },
    { id: 'Ve.curd', kind: 'donate', houses: [1, 6, 8, 9, 10], days: 43, cost: 'low', text: 'Give curd, ghee or camphor at a temple on Fridays.' },
    { id: 'Ve.jowar', kind: 'donate', houses: [3, 5, 6, 8, 9], days: 43, cost: 'low', text: 'Give sorghum (jowar) or white clothes to people in need on Fridays.' },
    { id: 'Ve.camphor', kind: 'worship', houses: [2, 4, 7, 11, 12], days: 43, cost: 'low', text: 'Light camphor at home in the evening.' },
  ]),
  ...pool('Sa', [
    { id: 'Sa.workers', kind: 'serve', houses: 'all', days: 43, cost: 'low', text: 'Help workers, cleaners and the poor, and pay them on time.' },
    { id: 'Sa.sober', kind: 'habit', houses: 'all', days: 43, cost: 'none', text: 'Stay away from alcohol and meat.' },
    { id: 'Sa.oil', kind: 'donate', houses: [1, 2, 4, 5, 6, 7, 8], days: 43, cost: 'low', text: 'Look at your face in a bowl of mustard oil and give the oil away on Saturdays.' },
    { id: 'Sa.urad', kind: 'donate', houses: [1, 4, 5, 6, 7, 8, 12], days: 43, cost: 'low', text: 'Give black urad lentils or a small iron item on Saturdays.' },
    { id: 'Sa.crows', kind: 'feed', houses: [1, 3, 4, 6, 9, 10, 12], days: 43, cost: 'low', text: 'Feed crows a little of your meal.' },
    { id: 'Sa.shani', kind: 'worship', houses: [3, 9, 10, 11], days: 43, cost: 'none', text: 'Light a lamp of mustard oil under a peepal tree on Saturday evenings.' },
  ]),
  ...pool('Ra', [
    { id: 'Ra.inlaws', kind: 'serve', houses: 'all', days: 43, cost: 'none', text: 'Keep good, respectful relations with your in-laws.' },
    { id: 'Ra.clean', kind: 'habit', houses: 'all', days: 43, cost: 'none', text: 'Keep the toilet, the space under the stairs and any store room clean.' },
    { id: 'Ra.silver', kind: 'keep', houses: [3, 4, 6, 7, 12], days: 1, cost: 'medium', text: 'Keep a small solid silver ball with you.' },
    { id: 'Ra.coconut', kind: 'flow', houses: [1, 2, 5, 7, 8, 9, 10], days: 43, cost: 'low', text: 'Let a dry coconut go in flowing water.' },
    { id: 'Ra.coal', kind: 'flow', houses: [1, 2, 5, 8, 11, 12], days: 43, cost: 'low', text: 'Let a small piece of coal go in flowing water.' },
    { id: 'Ra.barley', kind: 'donate', houses: [4, 6, 9, 11, 12], days: 43, cost: 'low', text: 'Give barley or radish to people in need on Saturdays.' },
  ]),
  ...pool('Ke', [
    { id: 'Ke.sons', kind: 'serve', houses: 'all', days: 43, cost: 'none', text: 'Help your sons, nephews and maternal uncles.' },
    { id: 'Ke.dog', kind: 'feed', houses: 'all', days: 43, cost: 'low', text: 'Feed a dog, if possible a black-and-white one.' },
    { id: 'Ke.sesame', kind: 'donate', houses: [1, 2, 4, 6, 7, 8], days: 43, cost: 'low', text: 'Give black-and-white sesame or a blanket to someone in need.' },
    { id: 'Ke.flag', kind: 'worship', houses: [3, 5, 9, 11, 12], days: 1, cost: 'low', text: 'Offer a flag at a temple.' },
    { id: 'Ke.ganesh', kind: 'worship', houses: 'all', days: 43, cost: 'none', text: 'Pray to Ganesha before starting a journey or new work.' },
  ]),
]

export interface LkParhez {
  id: string
  planet: LkGraha
  houses: 'all' | readonly LkHouse[]
  text: string
}

export const LK_PARHEZ: readonly LkParhez[] = [
  { id: 'Su.p1', planet: 'Su', houses: 'all', text: 'Do not take bribes or cheat the state.' },
  { id: 'Su.p2', planet: 'Su', houses: 'all', text: 'Do not quarrel with or disrespect your father.' },
  { id: 'Su.p3', planet: 'Su', houses: [6, 7, 8, 11], text: 'Do not drink alcohol or eat meat.' },
  { id: 'Su.p4', planet: 'Su', houses: [5, 7, 10], text: 'Do not let pride decide for you.' },
  { id: 'Mo.p1', planet: 'Mo', houses: 'all', text: 'Do not hurt or neglect your mother.' },
  { id: 'Mo.p2', planet: 'Mo', houses: [4], text: 'Do not sell milk or water for profit.' },
  { id: 'Mo.p3', planet: 'Mo', houses: 'all', text: 'Do not leave stagnant or dirty water at home.' },
  { id: 'Mo.p4', planet: 'Mo', houses: [6, 8], text: 'Avoid drinking milk at night.' },
  { id: 'Ma.p1', planet: 'Ma', houses: 'all', text: 'Do not lose your temper or lie.' },
  { id: 'Ma.p2', planet: 'Ma', houses: [4, 8], text: 'Do not keep broken weapons, tools or electrical goods at home.' },
  { id: 'Ma.p3', planet: 'Ma', houses: 'all', text: 'Do not fight with your brothers over property.' },
  { id: 'Ma.p4', planet: 'Ma', houses: [1, 7, 8], text: 'Do not drive rashly or take needless physical risks.' },
  { id: 'Me.p1', planet: 'Me', houses: 'all', text: 'Do not make promises you cannot keep.' },
  { id: 'Me.p2', planet: 'Me', houses: [5, 8, 12], text: 'Do not gamble or speculate.' },
  { id: 'Me.p3', planet: 'Me', houses: 'all', text: 'Do not insult sisters, daughters or aunts.' },
  { id: 'Me.p4', planet: 'Me', houses: [3, 8, 12], text: 'Do not sign papers without reading them.' },
  { id: 'Ju.p1', planet: 'Ju', houses: 'all', text: 'Do not lie to or argue with elders and teachers.' },
  { id: 'Ju.p2', planet: 'Ju', houses: 'all', text: 'Do not cut or harm a peepal tree.' },
  { id: 'Ju.p3', planet: 'Ju', houses: [7, 10], text: 'Do not accept gold from others.' },
  { id: 'Ju.p4', planet: 'Ju', houses: [6, 8, 10], text: 'Do not show off your knowledge or wealth.' },
  { id: 'Ve.p1', planet: 'Ve', houses: 'all', text: 'Do not have relations outside marriage.' },
  { id: 'Ve.p2', planet: 'Ve', houses: 'all', text: 'Do not wear dirty clothes or neglect cleanliness.' },
  { id: 'Ve.p3', planet: 'Ve', houses: 'all', text: 'Do not mistreat the women of the house.' },
  { id: 'Ve.p4', planet: 'Ve', houses: [1, 6, 8], text: 'Do not overspend on luxuries.' },
  { id: 'Sa.p1', planet: 'Sa', houses: 'all', text: 'Do not drink alcohol or eat meat.' },
  { id: 'Sa.p2', planet: 'Sa', houses: 'all', text: 'Do not cheat or delay the pay of workers.' },
  { id: 'Sa.p3', planet: 'Sa', houses: [1, 4, 7, 8, 10], text: 'Do not buy iron goods or oil on Saturdays.' },
  { id: 'Sa.p4', planet: 'Sa', houses: [4, 8], text: 'Do not build or repair the house in a hurry without care.' },
  { id: 'Ra.p1', planet: 'Ra', houses: 'all', text: 'Do not quarrel with your in-laws.' },
  { id: 'Ra.p2', planet: 'Ra', houses: 'all', text: 'Do not keep rubbish or broken things under the stairs.' },
  { id: 'Ra.p3', planet: 'Ra', houses: [1, 5, 8, 12], text: 'Do not use intoxicants.' },
  { id: 'Ra.p4', planet: 'Ra', houses: [2, 7, 10], text: 'Do not take shortcuts that bend the rules.' },
  { id: 'Ke.p1', planet: 'Ke', houses: 'all', text: 'Do not mistreat dogs or other animals.' },
  { id: 'Ke.p2', planet: 'Ke', houses: 'all', text: 'Do not break promises to your sons.' },
  { id: 'Ke.p3', planet: 'Ke', houses: [1, 4, 8, 12], text: 'Do not travel carelessly; plan journeys well.' },
  { id: 'Ke.p4', planet: 'Ke', houses: [6, 7], text: 'Do not quarrel with maternal uncles.' },
]

/** The general rules every Lal Kitab remedy follows. Ids only; text in messages. */
export const LK_UPAY_RULES = ['daylight', 'days', 'restart', 'onePerPlanet', 'onlyHard', 'self', 'eclipse', 'quiet', 'noHarm'] as const

export type LkProblemId =
  | 'marriageDelay' | 'children' | 'job' | 'business' | 'debt' | 'health'
  | 'court' | 'abroad' | 'study' | 'family' | 'property' | 'sleep'

/** Everyday problems, mapped to life areas and the planets that rule them. */
export const LK_PROBLEMS: Record<LkProblemId, { areas: readonly LkLifeArea[]; planets: readonly LkGraha[] }> = {
  marriageDelay: { areas: ['marriage'], planets: ['Ve', 'Ju'] },
  children: { areas: ['children'], planets: ['Ju', 'Ke'] },
  job: { areas: ['career'], planets: ['Sa', 'Su'] },
  business: { areas: ['career', 'wealth'], planets: ['Me'] },
  debt: { areas: ['wealth', 'enemies'], planets: ['Ma', 'Sa'] },
  health: { areas: ['health'], planets: ['Su', 'Ma'] },
  court: { areas: ['enemies'], planets: ['Ma', 'Ra'] },
  abroad: { areas: ['travel'], planets: ['Ra', 'Ke'] },
  study: { areas: ['education'], planets: ['Me', 'Ju'] },
  family: { areas: ['parents', 'siblings'], planets: ['Mo', 'Ma'] },
  property: { areas: ['property'], planets: ['Mo', 'Sa'] },
  sleep: { areas: ['travel'], planets: ['Mo', 'Ra'] },
}
