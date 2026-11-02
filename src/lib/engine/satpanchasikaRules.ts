// ─────────────────────────────────────────────────────────────
//  src/lib/engine/satpanchasikaRules.ts
//  Ṣaṭpañcāśikā rule table. Every rule reads chart facts and returns what
//  triggered it; nothing here is a hard-coded outcome. Pure, no React/DB/Redis.
// ─────────────────────────────────────────────────────────────

import type { GrahaId, Rashi } from '@/types/astrology'
import { naturalRelationship } from './dignity'
import {
  HUMAN_SIGNS, KENDRAS, QUADRUPED_SIGNS, SIGN_TABLE, TRIKONAS, WATERY_SIGNS,
  grahaName, listNames, ordinal, signName,
  type ChartFacts,
} from './satpanchasikaFacts'

export type SatpanchasikaQuestion =
  | 'work' | 'position' | 'money' | 'patient' | 'traveller_return' | 'traveller_safe'
  | 'go_abroad' | 'opponent' | 'contest' | 'settlement' | 'lost_item' | 'marriage'
  | 'child_pregnancy' | 'rain'
  // Narrower questions the ślokas answer on their own
  | 'keep_position' | 'growth' | 'honour' | 'woman_benefit' | 'friendship' | 'set_out'
  | 'traveller_health' | 'traveller_whereabouts' | 'traveller_when' | 'father_abroad'
  | 'mission_return' | 'opponent_when' | 'lost_who' | 'lost_where'
  | 'whom' | 'object_class' | 'person_age' | 'any_house'

export type RulePolarity = 'favourable' | 'unfavourable' | 'mixed' | 'no_change' | 'descriptive'
export type ContestRole = 'defender' | 'challenger'

export interface RuleContext {
  question: SatpanchasikaQuestion
  /** The house 1.3 judges for this question. */
  judgedHouse: number
  /** Set only when the querist confirms the rainy season (7.3). */
  season?: 'rainy'
}

export interface RuleOutcome {
  statement: string
  facts: string[]
  polarity: RulePolarity
  planets?: GrahaId[]
}

export interface RuleDef {
  id: string
  sloka: string
  /** Method step: 3 lagna type, 4 benefics and malefics, 5 the Moon, 6 chapter rule. */
  step: 3 | 4 | 5 | 6
  label: string
  questions: SatpanchasikaQuestion[]
  baseWeight: number
  /** Stated twice in the text (1.5 with 6.3; 1.2 with 7.9). */
  repeated?: boolean
  /** Polarity is written for the defender and flips for a challenger. */
  sideRelative?: boolean
  /** Returns the reason a chart alone cannot judge this rule right now. */
  notEvaluated?: (ctx: RuleContext) => string | null
  evaluate: (f: ChartFacts, ctx: RuleContext) => RuleOutcome | null
}

const BROAD: SatpanchasikaQuestion[] = [
  'work', 'position', 'money', 'patient', 'traveller_return', 'traveller_safe', 'go_abroad',
  'opponent', 'contest', 'settlement', 'lost_item', 'marriage', 'child_pregnancy', 'rain',
]
const FOCUSED: SatpanchasikaQuestion[] = [
  'keep_position', 'growth', 'honour', 'woman_benefit', 'friendship', 'set_out',
  'traveller_health', 'traveller_whereabouts', 'traveller_when', 'father_abroad',
  'mission_return', 'opponent_when', 'lost_who', 'lost_where',
  'whom', 'object_class', 'person_age', 'any_house',
]
const ALL: SatpanchasikaQuestion[] = [...BROAD, ...FOCUSED]
const GENERAL = BROAD.filter(q => q !== 'rain' && q !== 'child_pregnancy')
const TRAVELLER: SatpanchasikaQuestion[] = ['traveller_return', 'traveller_safe']
const LOST: SatpanchasikaQuestion[] = ['lost_item']
const OPP: SatpanchasikaQuestion[] = ['opponent']
const CONTEST: SatpanchasikaQuestion[] = ['contest']
const PEACE: SatpanchasikaQuestion[] = ['settlement']

const lagnaFact = (f: ChartFacts) => `${signName(f.lagna)} rising (${f.lagnaInfo.mobility})`
const moonFact = (f: ChartFacts) => `Moon in ${signName(f.grahas.Mo.rashi)} (${SIGN_TABLE[f.grahas.Mo.rashi].mobility}), ${ordinal(f.house('Mo'))} house`
const placed = (f: ChartFacts, ids: GrahaId[]) => ids.map(id => `${grahaName(id)} in ${ordinal(f.house(id))} (${signName(f.grahas[id].rashi)})`)
const only = (ids: GrahaId[], f: ChartFacts, kind: 'b' | 'm') => ids.filter(id => (kind === 'b' ? f.isBenefic(id) : !f.isBenefic(id)))
const moonSign = (f: ChartFacts) => SIGN_TABLE[f.grahas.Mo.rashi].mobility
const noBeneficOn = (f: ChartFacts, id: GrahaId) => f.beneficAspectsOn(f.grahas[id].rashi, id).length === 0
  && !f.benefics.some(b => b !== id && f.grahas[b].rashi === f.grahas[id].rashi)

/** Benefics or malefics in a house set; returns a fired rule when any are there. */
function placement(
  f: ChartFacts, houses: number[], kind: 'b' | 'm', statement: string, polarity: RulePolarity,
): RuleOutcome | null {
  const ids = only(f.inHouses(houses), f, kind)
  if (!ids.length) return null
  return { statement, polarity, planets: ids, facts: placed(f, ids) }
}

/** Polarity of a sign-type effect, which depends on what the question wants. */
const FIXED_EFFECT: Partial<Record<SatpanchasikaQuestion, { polarity: RulePolarity; statement: string }>> = {
  position: { polarity: 'favourable', statement: 'A position is gained and held.' },
  keep_position: { polarity: 'favourable', statement: 'The position is held.' },
  lost_item: { polarity: 'favourable', statement: 'No loss: the thing stays where it is.' },
  patient: { polarity: 'no_change', statement: 'No cure and no worsening: the condition tends to stay as it is.' },
  traveller_return: { polarity: 'no_change', statement: 'Neither going nor coming: things stay as they are.' },
  traveller_safe: { polarity: 'no_change', statement: 'No change in the traveller\'s situation.' },
  go_abroad: { polarity: 'no_change', statement: 'No going: the plan tends to stay as it is.' },
  opponent: { polarity: 'no_change', statement: 'The opponent neither comes nor goes.' },
  contest: { polarity: 'no_change', statement: 'No defeat, and no decisive change either.' },
}

const MOVABLE_EFFECT: Partial<Record<SatpanchasikaQuestion, { polarity: RulePolarity; statement: string }>> = {
  position: { polarity: 'unfavourable', statement: 'Reverse of 2.1: a position is not secure and may change.' },
  keep_position: { polarity: 'unfavourable', statement: 'Reverse of 2.1: the position is not secure and may change.' },
  lost_item: { polarity: 'unfavourable', statement: 'Reverse of 2.1: the thing can move on or be lost.' },
  patient: { polarity: 'mixed', statement: 'Reverse of 2.1: the condition is open to change, in either direction.' },
  traveller_return: { polarity: 'favourable', statement: 'Reverse of 2.1: movement is possible, so a return can happen.' },
  traveller_safe: { polarity: 'mixed', statement: 'Reverse of 2.1: the traveller\'s situation is in flux.' },
  go_abroad: { polarity: 'favourable', statement: 'Reverse of 2.1: going is possible.' },
  opponent: { polarity: 'unfavourable', statement: 'Reverse of 2.1: the opponent is free to move.' },
  contest: { polarity: 'mixed', statement: 'Reverse of 2.1: the position can change, so defeat is possible.' },
}

function dualNote(f: ChartFacts): string[] {
  return f.lagnaInfo.mobility === 'dual'
    ? [`Dual lagna at ${f.lagnaDegree.toFixed(1)}°: ${f.lagnaDegree < 15 ? 'first half, like fixed' : 'second half, like movable'} (2.2)`]
    : []
}

function movementPolarity(q: SatpanchasikaQuestion): RulePolarity {
  return q === 'opponent' ? 'unfavourable' : 'favourable'
}

export const SATPANCHASIKA_RULES: RuleDef[] = [
  // ── Chapter 1 ──
  {
    id: '1.2-fall', sloka: '1.2', step: 3, label: 'Fall from position is judged from the lagna', questions: ['position'], baseWeight: 1.5, repeated: true,
    evaluate: f => placement(f, [1], 'm', 'A malefic in the lagna points to a fall from position.', 'unfavourable'),
  },
  {
    id: '1.2-growth', sloka: '1.2', step: 3, label: 'Growth is judged from the 4th', questions: ['money', 'work'], baseWeight: 1.5, repeated: true,
    evaluate: f => placement(f, [4], 'b', 'A benefic in the 4th supports growth and prosperity.', 'favourable'),
  },
  {
    id: '1.2-going', sloka: '1.2', step: 3, label: 'Going away is judged from the 10th', questions: ['go_abroad'], baseWeight: 1.5, repeated: true,
    evaluate: f => {
      const ids = f.inHouse(10)
      return ids.length ? { statement: 'A planet in the 10th points to going away.', polarity: 'favourable', planets: ids, facts: placed(f, ids) } : null
    },
  },
  {
    id: '1.2-return', sloka: '1.2', step: 3, label: 'Return is judged from the 7th', questions: ['traveller_return'], baseWeight: 1.5, repeated: true,
    evaluate: f => {
      const ids = f.inHouse(7)
      return ids.length ? { statement: 'A planet in the 7th points to return.', polarity: 'favourable', planets: ids, facts: placed(f, ids) } : null
    },
  },
  {
    id: '1.3-good', sloka: '1.3', step: 4, label: 'Master rule: lord or benefics on the judged house', questions: GENERAL, baseWeight: 1.5,
    evaluate: (f, ctx) => {
      const h = ctx.judgedHouse
      const sign = f.signAt(h)
      const lord = f.lordOf(h)
      const onHouse = (id: GrahaId) => f.house(id) === h || f.aspects(id, sign)
      const ids = [...new Set<GrahaId>([...(onHouse(lord) ? [lord] : []), ...f.benefics.filter(onHouse)])]
      if (!ids.length) return null
      return {
        statement: `The ${ordinal(h)} house flourishes.`,
        polarity: 'favourable',
        planets: ids,
        facts: ids.map(id => `${grahaName(id)}${id === lord ? ` (${ordinal(h)} lord)` : ''} ${f.house(id) === h ? 'in' : 'aspects'} the ${ordinal(h)} (${signName(sign)})`),
      }
    },
  },
  {
    id: '1.3-bad', sloka: '1.3', step: 4, label: 'Master rule: malefics on the judged house', questions: GENERAL, baseWeight: 1.5,
    evaluate: (f, ctx) => {
      const h = ctx.judgedHouse
      const sign = f.signAt(h)
      const lord = f.lordOf(h)
      const ids = f.malefics.filter(id => id !== lord && (f.house(id) === h || f.aspects(id, sign)))
      if (!ids.length) return null
      return {
        statement: `The ${ordinal(h)} house suffers.`,
        polarity: 'unfavourable',
        planets: ids,
        facts: ids.map(id => `${grahaName(id)} ${f.house(id) === h ? 'in' : 'aspects'} the ${ordinal(h)} (${signName(sign)})`),
      }
    },
  },
  {
    id: '1.4', sloka: '1.4', step: 3, label: 'Benefic in the lagna or its varga, with a head-rising sign', questions: GENERAL, baseWeight: 2,
    evaluate: f => {
      const lagnaPlanets = f.inHouse(1)
      const beneficIn = only(lagnaPlanets, f, 'b')
      const maleficIn = only(lagnaPlanets, f, 'm')
      const vargaBenefic = f.isBenefic(f.navamsaLord)
      const leansGood = beneficIn.length > 0 || (maleficIn.length === 0 && vargaBenefic)
      const leansBad = maleficIn.length > 0 ? beneficIn.length === 0 : !vargaBenefic && beneficIn.length === 0
      const rising = f.lagnaInfo.rising
      const facts = [
        `${signName(f.lagna)} is ${rising === 'head' ? 'śīrṣodaya (head-rising)' : rising === 'back' ? 'pṛṣṭhodaya (back-rising)' : 'both-rising (Pisces)'}`,
        lagnaPlanets.length ? `In the lagna: ${listNames(lagnaPlanets)}` : 'Lagna empty',
        `Rising navāṃśa ${signName(f.navamsaSign)}, lord ${grahaName(f.navamsaLord)} (${vargaBenefic ? 'benefic' : 'malefic'})`,
      ]
      const planets = lagnaPlanets.length ? lagnaPlanets : [f.navamsaLord]
      if (rising === 'head' && leansGood) return { statement: 'The matter reaches success.', polarity: 'favourable', facts, planets }
      if (rising === 'back' && leansBad) return { statement: 'The reverse of 1.4: the matter tends to fail.', polarity: 'unfavourable', facts, planets }
      return { statement: 'Mixed signals: success only with difficulty.', polarity: 'mixed', facts, planets }
    },
  },
  {
    id: '1.5-moon', sloka: '1.5', step: 5, label: 'Full Moon in the lagna aspected by Jupiter or Venus', questions: [...LOST, 'traveller_return'], baseWeight: 3, repeated: true,
    evaluate: f => {
      if (f.house('Mo') !== 1 || !f.moonFull) return null
      const by = (['Ju', 'Ve'] as GrahaId[]).filter(id => f.aspects(id, f.lagna))
      if (!by.length) return null
      return { statement: 'Quick recovery of what is lost.', polarity: 'favourable', planets: ['Mo', ...by], facts: [`Full Moon in the lagna (${f.elongation.toFixed(0)}° from the Sun)`, `Aspected by ${listNames(by)}`] }
    },
  },
  {
    id: '1.5-eleventh', sloka: '1.5', step: 6, label: 'Strong benefic in the 11th', questions: [...LOST, 'traveller_return'], baseWeight: 3, repeated: true,
    evaluate: f => {
      const ids = only(f.inHouse(11), f, 'b').filter(f.isStrong)
      return ids.length ? { statement: 'Quick recovery of what is lost.', polarity: 'favourable', planets: ids, facts: placed(f, ids).map(s => `Strong benefic: ${s}`) } : null
    },
  },

  // ── Chapter 2: lagna type ──
  {
    id: '2.1', sloka: '2.1', step: 3, label: 'Fixed lagna: things stay as they are', questions: Object.keys(FIXED_EFFECT) as SatpanchasikaQuestion[], baseWeight: 2.5,
    evaluate: (f, ctx) => {
      if (f.lagnaBehaves !== 'fixed') return null
      const e = FIXED_EFFECT[ctx.question]
      return e ? { ...e, facts: [lagnaFact(f), ...dualNote(f)] } : null
    },
  },
  {
    id: '2.2-movable', sloka: '2.2', step: 3, label: 'Movable lagna: the reverse of 2.1', questions: Object.keys(MOVABLE_EFFECT) as SatpanchasikaQuestion[], baseWeight: 2.5,
    evaluate: (f, ctx) => {
      if (f.lagnaBehaves !== 'movable') return null
      const e = MOVABLE_EFFECT[ctx.question]
      return e ? { ...e, facts: [lagnaFact(f), ...dualNote(f)] } : null
    },
  },
  {
    id: '2.2-aspect', sloka: '2.2', step: 5, label: 'Aspects on the lagna and the Moon', questions: GENERAL, baseWeight: 1.5,
    evaluate: f => {
      const moon = f.grahas.Mo.rashi
      const good = [...new Set([...f.beneficAspectsOn(f.lagna), ...f.beneficAspectsOn(moon, 'Mo')])]
      const bad = [...new Set([...f.maleficAspectsOn(f.lagna), ...f.maleficAspectsOn(moon, 'Mo')])]
      if (!good.length && !bad.length) return null
      const facts = [
        good.length ? `Benefic aspect: ${listNames(good)}` : 'No benefic aspect',
        bad.length ? `Malefic aspect: ${listNames(bad)}` : 'No malefic aspect',
      ]
      if (good.length && !bad.length) return { statement: 'Benefic aspect on the lagna and Moon is good.', polarity: 'favourable', facts, planets: good }
      if (bad.length && !good.length) return { statement: 'Malefic aspect on the lagna and Moon is bad.', polarity: 'unfavourable', facts, planets: bad }
      return { statement: 'Both kinds of aspect reach the lagna and Moon.', polarity: 'mixed', facts, planets: [...good, ...bad] }
    },
  },

  // ── Chapter 2: opponent ──
  {
    id: '2.3-turn', sloka: '2.3', step: 6, label: 'Malefics in the 5th or 6th', questions: OPP, baseWeight: 2,
    evaluate: f => placement(f, [5, 6], 'm', 'The opponent turns back midway.', 'favourable'),
  },
  {
    id: '2.3-beaten', sloka: '2.3', step: 6, label: 'Malefics in the 4th', questions: OPP, baseWeight: 2,
    evaluate: f => placement(f, [4], 'm', 'The opponent arrives but is beaten back and retreats.', 'favourable'),
  },
  {
    id: '2.4-defeat', sloka: '2.4', step: 6, label: 'Pisces, Scorpio, Aquarius or Cancer as the 4th', questions: OPP, baseWeight: 2,
    evaluate: f => ([12, 8, 11, 4] as Rashi[]).includes(f.signAt(4))
      ? { statement: 'The opponent is defeated.', polarity: 'favourable', facts: [`4th house is ${signName(f.signAt(4))}`] } : null,
  },
  {
    id: '2.4-flee', sloka: '2.4', step: 6, label: 'Quadruped sign as the 4th', questions: OPP, baseWeight: 2,
    evaluate: f => QUADRUPED_SIGNS.includes(f.signAt(4))
      ? { statement: 'The opponent flees.', polarity: 'favourable', facts: [`4th house is ${signName(f.signAt(4))}, a quadruped sign${f.signAt(4) === 9 ? ' (Sagittarius is "human, then quadruped" in the table)' : ''}`] } : null,
  },
  {
    id: '2.5-benefic', sloka: '2.5', step: 6, label: 'Benefic in a rising movable sign', questions: ['go_abroad', 'traveller_safe'], baseWeight: 2,
    evaluate: f => f.lagnaInfo.mobility === 'movable' ? placement(f, [1], 'b', 'Good for the one setting out.', 'favourable') : null,
  },
  {
    id: '2.5-malefic', sloka: '2.5', step: 6, label: 'Malefic in a rising movable sign', questions: ['go_abroad', 'traveller_safe'], baseWeight: 2,
    evaluate: f => f.lagnaInfo.mobility === 'movable' ? placement(f, [1], 'm', 'Harm to the one setting out.', 'unfavourable') : null,
  },
  {
    id: '2.5-fixed', sloka: '2.5', step: 6, label: 'Malefic in a rising fixed sign, well placed (Utpala)', questions: ['go_abroad', 'traveller_safe'], baseWeight: 1,
    evaluate: f => {
      if (f.lagnaInfo.mobility !== 'fixed') return null
      const ids = only(f.inHouse(1), f, 'm').filter(id => ['own', 'moolatrikona', 'exalted', 'friend', 'great_friend'].includes(f.grahas[id].dignity))
      return ids.length ? { statement: 'Can still be good, because the planet is in its own, exaltation or friendly sign.', polarity: 'favourable', planets: ids, facts: ids.map(id => `${grahaName(id)} in ${signName(f.grahas[id].rashi)} (${f.grahas[id].dignity})`) } : null
    },
  },
  {
    id: '2.6-no', sloka: '2.6', step: 5, label: 'Movable lagna, Moon in a fixed sign', questions: OPP, baseWeight: 2.5,
    evaluate: f => f.lagnaInfo.mobility === 'movable' && moonSign(f) === 'fixed'
      ? { statement: 'The opponent will not come.', polarity: 'favourable', facts: [lagnaFact(f), moonFact(f)] } : null,
  },
  {
    id: '2.6-yes', sloka: '2.6', step: 5, label: 'Fixed lagna, Moon in a movable sign', questions: OPP, baseWeight: 2.5,
    evaluate: f => f.lagnaInfo.mobility === 'fixed' && moonSign(f) === 'movable'
      ? { statement: 'The opponent will come.', polarity: 'unfavourable', facts: [lagnaFact(f), moonFact(f)] } : null,
  },
  {
    id: '2.7', sloka: '2.7', step: 5, label: 'Fixed lagna, Moon in a dual sign', questions: OPP, baseWeight: 2.5,
    evaluate: f => f.lagnaInfo.mobility === 'fixed' && moonSign(f) === 'dual'
      ? { statement: 'The opponent turns back, even after coming a long way.', polarity: 'favourable', facts: [lagnaFact(f), moonFact(f)] } : null,
  },
  {
    id: '2.8-half', sloka: '2.8', step: 5, label: 'Dual lagna, Moon in a movable sign', questions: OPP, baseWeight: 2.5,
    evaluate: f => f.lagnaInfo.mobility === 'dual' && moonSign(f) === 'movable'
      ? { statement: 'The opponent comes halfway and returns.', polarity: 'favourable', facts: [lagnaFact(f), moonFact(f)] } : null,
  },
  {
    id: '2.8-comes', sloka: '2.8', step: 5, label: 'Movable lagna, Moon in a dual sign', questions: OPP, baseWeight: 2.5,
    evaluate: f => {
      if (f.lagnaInfo.mobility !== 'movable' || moonSign(f) !== 'dual') return null
      const onLagna = f.maleficAspectsOn(f.lagna)
      const onMoon = f.maleficAspectsOn(f.grahas.Mo.rashi, 'Mo')
      const clash = onLagna.length > 0 && onMoon.length > 0
      return clash
        ? { statement: 'The opponent comes, and with malefic aspect on both there is a clash ending in a defeat.', polarity: 'mixed', facts: [lagnaFact(f), moonFact(f), `Malefic aspect on lagna: ${listNames(onLagna)}; on Moon: ${listNames(onMoon)}`] }
        : { statement: 'The opponent comes.', polarity: 'unfavourable', facts: [lagnaFact(f), moonFact(f)] }
    },
  },
  {
    id: '2.9', sloka: '2.9', step: 6, label: 'Sun, Saturn, Mercury or Venus in a rising movable sign', questions: [...OPP, 'go_abroad'], baseWeight: 2,
    evaluate: (f, ctx) => {
      if (f.lagnaInfo.mobility !== 'movable') return null
      const ids = (['Su', 'Sa', 'Me', 'Ve'] as GrahaId[]).filter(id => f.house(id) === 1)
      if (!ids.length) return null
      const direct = ids.filter(id => !f.grahas[id].isRetro)
      const moving = movementPolarity(ctx.question)
      if (direct.length) return { statement: 'A quick move.', polarity: moving, planets: direct, facts: placed(f, direct).map(s => `${s}, direct`) }
      return { statement: 'The planet is retrograde: no movement.', polarity: moving === 'favourable' ? 'unfavourable' : 'favourable', planets: ids, facts: placed(f, ids).map(s => `${s}, retrograde`) }
    },
  },
  {
    id: '2.10-still', sloka: '2.10', step: 6, label: 'Fixed lagna aspected by Jupiter and Saturn', questions: [...OPP, ...TRAVELLER, 'go_abroad'], baseWeight: 2,
    evaluate: f => f.lagnaInfo.mobility === 'fixed' && f.aspects('Ju', f.lagna) && f.aspects('Sa', f.lagna)
      ? { statement: 'Predict neither going nor coming.', polarity: 'no_change', planets: ['Ju', 'Sa'], facts: [lagnaFact(f), 'Jupiter and Saturn both aspect the lagna'] } : null,
  },
  {
    id: '2.10-clash', sloka: '2.10', step: 6, label: 'Malefics in the 3rd, 5th or 6th', questions: OPP, baseWeight: 2,
    evaluate: f => placement(f, [3, 5, 6], 'm', 'A clash with the opponent.', 'mixed'),
  },
  {
    id: '2.10-retreat', sloka: '2.10', step: 6, label: 'Malefics in the 4th', questions: OPP, baseWeight: 2,
    evaluate: f => placement(f, [4], 'm', 'The opponent retreats.', 'favourable'),
  },
  {
    id: '2.11-no', sloka: '2.11', step: 6, label: 'Sun and Moon in the 4th', questions: OPP, baseWeight: 2,
    evaluate: f => f.house('Su') === 4 && f.house('Mo') === 4
      ? { statement: 'The opposing force does not come.', polarity: 'favourable', planets: ['Su', 'Mo'], facts: placed(f, ['Su', 'Mo']) } : null,
  },
  {
    id: '2.11-yes', sloka: '2.11', step: 6, label: 'Mercury, Jupiter and Venus in the 4th', questions: OPP, baseWeight: 2,
    evaluate: f => f.house('Me') === 4 && f.house('Ju') === 4 && f.house('Ve') === 4
      ? { statement: 'The opposing force comes quickly.', polarity: 'unfavourable', planets: ['Me', 'Ju', 'Ve'], facts: placed(f, ['Me', 'Ju', 'Ve']) } : null,
  },
  {
    id: '2.12', sloka: '2.12', step: 6, label: 'Aries, Sagittarius, Leo or Taurus rising or in the 4th', questions: OPP, baseWeight: 2,
    evaluate: f => {
      const set: Rashi[] = [1, 9, 5, 2]
      const hits = [...(set.includes(f.lagna) ? [`${signName(f.lagna)} rising`] : []), ...(set.includes(f.signAt(4)) ? [`${signName(f.signAt(4))} as the 4th`] : [])]
      return hits.length ? { statement: 'The opponent retreats, whether or not planets occupy it.', polarity: 'favourable', facts: hits } : null
    },
  },
  {
    id: '2.13-halt', sloka: '2.13', step: 6, label: 'Saturn or Jupiter in a rising fixed sign', questions: OPP, baseWeight: 2,
    evaluate: f => {
      if (f.lagnaInfo.mobility !== 'fixed') return null
      const ids = (['Sa', 'Ju'] as GrahaId[]).filter(id => f.house(id) === 1)
      return ids.length ? { statement: 'The opponent halts where they are.', polarity: 'no_change', planets: ids, facts: placed(f, ids) } : null
    },
  },
  {
    id: '2.13-arrive', sloka: '2.13', step: 6, label: 'Sun or Jupiter in a rising movable sign', questions: OPP, baseWeight: 2,
    evaluate: f => {
      if (f.lagnaInfo.mobility !== 'movable') return null
      const ids = (['Su', 'Ju'] as GrahaId[]).filter(id => f.house(id) === 1)
      return ids.length ? { statement: 'The opponent arrives.', polarity: 'unfavourable', planets: ids, facts: placed(f, ids) } : null
    },
  },

  // ── Chapter 3: contests. Polarity is for the defender; flips for a challenger. ──
  {
    id: '3.1-benefics', sloka: '3.1', step: 6, label: 'Benefics in the 10th, 1st or 7th', questions: CONTEST, baseWeight: 3, sideRelative: true,
    evaluate: f => placement(f, [10, 1, 7], 'b', 'Victory for the defender.', 'favourable'),
  },
  {
    id: '3.1-rout', sloka: '3.1', step: 6, label: 'Mars or Saturn in the 9th', questions: CONTEST, baseWeight: 2.5, sideRelative: true,
    evaluate: f => {
      const ids = (['Ma', 'Sa'] as GrahaId[]).filter(id => f.house(id) === 9)
      return ids.length ? { statement: 'A rout for the defender.', polarity: 'unfavourable', planets: ids, facts: placed(f, ids) } : null
    },
  },
  {
    id: '3.1-ninth', sloka: '3.1', step: 6, label: 'Mercury, Jupiter or Venus in the 9th', questions: CONTEST, baseWeight: 2.5, sideRelative: true,
    evaluate: f => {
      const ids = (['Me', 'Ju', 'Ve'] as GrahaId[]).filter(id => f.house(id) === 9)
      return ids.length ? { statement: 'Victory for the defender.', polarity: 'favourable', planets: ids, facts: placed(f, ids) } : null
    },
  },
  {
    id: '3.2-defender', sloka: '3.2', step: 6, label: 'Benefics in the defender\'s houses (3rd to 8th)', questions: CONTEST, baseWeight: 2, sideRelative: true,
    evaluate: f => placement(f, [3, 4, 5, 6, 7, 8], 'b', 'Favours the defender.', 'favourable'),
  },
  {
    id: '3.2-attacker', sloka: '3.2', step: 6, label: 'Benefics in the challenger\'s houses (9th to 2nd)', questions: CONTEST, baseWeight: 2, sideRelative: true,
    evaluate: f => placement(f, [9, 10, 11, 12, 1, 2], 'b', 'Favours the challenger.', 'unfavourable'),
  },
  {
    id: '3.2-malefics', sloka: '3.2', step: 6, label: 'Malefics in the 12th, 10th or 11th', questions: CONTEST, baseWeight: 2, sideRelative: true,
    evaluate: f => placement(f, [12, 10, 11], 'm', 'Harms the defender and helps the challenger.', 'unfavourable'),
  },
  {
    id: '3.3-peace', sloka: '3.3', step: 6, label: 'Benefics in human signs in the 1st, 12th or 11th', questions: PEACE, baseWeight: 3,
    evaluate: f => {
      const ids = only(f.inHouses([1, 12, 11]), f, 'b').filter(id => HUMAN_SIGNS.includes(f.grahas[id].rashi))
      return ids.length ? { statement: 'A quick settlement.', polarity: 'favourable', planets: ids, facts: placed(f, ids) } : null
    },
  },
  {
    id: '3.3-hostile', sloka: '3.3', step: 6, label: 'Malefics in dual signs', questions: PEACE, baseWeight: 2,
    evaluate: f => {
      const ids = f.malefics.filter(id => SIGN_TABLE[f.grahas[id].rashi].mobility === 'dual')
      return ids.length ? { statement: 'The hostility continues.', polarity: 'unfavourable', planets: ids, facts: placed(f, ids) } : null
    },
  },
  {
    id: '3.4-friend', sloka: '3.4', step: 6, label: 'Benefics in kendras in human signs, aspected by benefics', questions: PEACE, baseWeight: 3,
    evaluate: f => {
      const ids = only(f.inHouses(KENDRAS), f, 'b').filter(id => HUMAN_SIGNS.includes(f.grahas[id].rashi) && f.beneficAspectsOn(f.grahas[id].rashi, id).length > 0)
      return ids.length ? { statement: 'Friendship between the parties.', polarity: 'favourable', planets: ids, facts: placed(f, ids) } : null
    },
  },
  {
    id: '3.4-war', sloka: '3.4', step: 6, label: 'Malefics in kendras in human signs, aspected by malefics', questions: PEACE, baseWeight: 3,
    evaluate: f => {
      const ids = only(f.inHouses(KENDRAS), f, 'm').filter(id => HUMAN_SIGNS.includes(f.grahas[id].rashi) && f.maleficAspectsOn(f.grahas[id].rashi, id).length > 0)
      return ids.length ? { statement: 'The conflict continues.', polarity: 'unfavourable', planets: ids, facts: placed(f, ids) } : null
    },
  },
  {
    id: '3.5', sloka: '3.5', step: 6, label: 'Jupiter or Venus in the 2nd or 3rd', questions: [...CONTEST, 'traveller_return'], baseWeight: 2,
    evaluate: f => {
      const ids = (['Ju', 'Ve'] as GrahaId[]).filter(id => [2, 3].includes(f.house(id)))
      return ids.length ? { statement: 'The one who went out returns soon.', polarity: 'favourable', planets: ids, facts: placed(f, ids) } : null
    },
  },

  // ── Chapter 4 ──
  {
    id: '4.1', sloka: '4.1', step: 4, label: 'Benefics in kendras and trikonas, malefics away from kendras and the 8th', questions: GENERAL, baseWeight: 2,
    evaluate: f => {
      const good = only(f.inHouses([...KENDRAS, ...TRIKONAS]), f, 'b')
      const bad = only(f.inHouses([...KENDRAS, 8]), f, 'm')
      if (!good.length && !bad.length) return null
      const facts = [
        good.length ? `Benefics in kendra/trikona: ${placed(f, good).join(', ')}` : 'No benefic in a kendra or trikona',
        bad.length ? `Malefics in kendra/8th: ${placed(f, bad).join(', ')}` : 'Malefics clear of the kendras and the 8th',
      ]
      if (good.length && !bad.length) return { statement: 'Every aim fulfilled.', polarity: 'favourable', facts, planets: good }
      if (bad.length && !good.length) return { statement: 'The reverse placement gives the reverse result.', polarity: 'unfavourable', facts, planets: bad }
      return { statement: 'Both kinds are present: yes only with difficulty.', polarity: 'mixed', facts, planets: [...good, ...bad] }
    },
  },
  {
    id: '4.2-gain', sloka: '4.2', step: 6, label: 'Benefics in the 3rd, 5th, 11th or 7th', questions: ['money'], baseWeight: 3,
    evaluate: f => placement(f, [3, 5, 11, 7], 'b', 'Gain.', 'favourable'),
  },
  {
    id: '4.2-loss', sloka: '4.2', step: 6, label: 'Malefics in the 3rd, 5th, 11th or 7th', questions: ['money'], baseWeight: 3,
    evaluate: f => placement(f, [3, 5, 11, 7], 'm', 'Loss.', 'unfavourable'),
  },
  {
    id: '4.2-human', sloka: '4.2', step: 6, label: 'Benefics in human signs', questions: ['money', 'work'], baseWeight: 1,
    evaluate: f => {
      const ids = f.benefics.filter(id => HUMAN_SIGNS.includes(f.grahas[id].rashi))
      if (!ids.length) return null
      return { statement: 'Benefics in human signs are good.', polarity: 'favourable', planets: ids, facts: placed(f, ids) }
    },
  },
  {
    id: '4.3-position', sloka: '4.3', step: 6, label: 'Benefics in the 10th or 7th', questions: ['position'], baseWeight: 3,
    evaluate: f => placement(f, [10, 7], 'b', 'A position is given.', 'favourable'),
  },
  {
    id: '4.3-honour', sloka: '4.3', step: 6, label: 'Benefics in the 2nd, 5th or 1st', questions: ['position', 'money'], baseWeight: 2,
    evaluate: f => placement(f, [2, 5, 1], 'b', 'Honour and wealth.', 'favourable'),
  },
  {
    id: '4.3-malefics', sloka: '4.3', step: 6, label: 'Malefics in the 12th or 11th', questions: ['position', 'money'], baseWeight: 2,
    evaluate: f => placement(f, [12, 11], 'm', 'They give no good.', 'unfavourable'),
  },
  {
    id: '4.3-moon', sloka: '4.3', step: 5, label: 'Moon in the lagna or the 10th', questions: ['position', 'money', 'work'], baseWeight: 2,
    evaluate: f => {
      const h = f.house('Mo')
      if (h === 1) return { statement: 'The Moon in the lagna is not good here.', polarity: 'unfavourable', planets: ['Mo'], facts: [moonFact(f)] }
      if (h === 10) return { statement: 'The Moon in the 10th is good.', polarity: 'favourable', planets: ['Mo'], facts: [moonFact(f)] }
      return null
    },
  },
  {
    id: '4.4-moon', sloka: '4.4', step: 5, label: 'Moon in the 2nd, 7th, 10th, 11th, 6th or 3rd aspected by Jupiter', questions: ['money', 'work', 'marriage'], baseWeight: 2,
    evaluate: f => [2, 7, 10, 11, 6, 3].includes(f.house('Mo')) && f.aspects('Ju', f.grahas.Mo.rashi)
      ? { statement: 'Good fortune through a woman.', polarity: 'favourable', planets: ['Mo', 'Ju'], facts: [moonFact(f), 'Jupiter aspects the Moon'] } : null,
  },
  {
    id: '4.4-malefics', sloka: '4.4', step: 6, label: 'Malefics in the 1st, 3rd, 9th, 5th or 8th', questions: ['money', 'work'], baseWeight: 2.5,
    evaluate: f => placement(f, [1, 3, 9, 5, 8], 'm', 'Failure, loss and fear.', 'unfavourable'),
  },
  {
    id: '4.4-benefics', sloka: '4.4', step: 6, label: 'Benefics in the 1st, 3rd, 9th, 5th or 8th', questions: ['money', 'work'], baseWeight: 2.5,
    evaluate: f => placement(f, [1, 3, 9, 5, 8], 'b', 'Good results.', 'favourable'),
  },
  {
    id: '4.5-full', sloka: '4.5', step: 6, label: 'Benefics in the 1st, 7th, 8th or 5th aspected by benefics, Moon in the 3rd, 6th, 10th or 11th', questions: ['patient'], baseWeight: 4,
    evaluate: f => {
      const ids = only(f.inHouses([1, 7, 8, 5]), f, 'b').filter(id => f.beneficAspectsOn(f.grahas[id].rashi, id).length > 0)
      if (!ids.length || ![3, 6, 10, 11].includes(f.house('Mo'))) return null
      return { statement: 'Traditional indication of recovery: both conditions are met.', polarity: 'favourable', planets: [...ids, 'Mo'], facts: [...placed(f, ids).map(s => `${s}, benefic-aspected`), moonFact(f)] }
    },
  },
  {
    id: '4.5-benefics', sloka: '4.5', step: 6, label: 'Only the benefic condition of 4.5', questions: ['patient'], baseWeight: 2,
    evaluate: f => {
      const ids = only(f.inHouses([1, 7, 8, 5]), f, 'b').filter(id => f.beneficAspectsOn(f.grahas[id].rashi, id).length > 0)
      if (!ids.length || [3, 6, 10, 11].includes(f.house('Mo'))) return null
      return { statement: 'Partial traditional indication of recovery: the Moon condition is not met.', polarity: 'favourable', planets: ids, facts: placed(f, ids).map(s => `${s}, benefic-aspected`) }
    },
  },
  {
    id: '4.5-moon', sloka: '4.5', step: 6, label: 'Only the Moon condition of 4.5', questions: ['patient'], baseWeight: 1.5,
    evaluate: f => {
      const ids = only(f.inHouses([1, 7, 8, 5]), f, 'b').filter(id => f.beneficAspectsOn(f.grahas[id].rashi, id).length > 0)
      if (ids.length || ![3, 6, 10, 11].includes(f.house('Mo'))) return null
      return { statement: 'Partial traditional indication of recovery: the benefic condition is not met.', polarity: 'favourable', planets: ['Mo'], facts: [moonFact(f)] }
    },
  },

  // ── Chapter 5 ──
  {
    id: '5.1-planets', sloka: '5.1', step: 6, label: 'Planets in the 5th, 2nd or 3rd', questions: ['traveller_return'], baseWeight: 2.5,
    evaluate: f => {
      const ids = f.inHouses([5, 2, 3])
      return ids.length ? { statement: 'Return of one gone far away.', polarity: 'favourable', planets: ids, facts: placed(f, ids) } : null
    },
  },
  {
    id: '5.1-benefics', sloka: '5.1', step: 6, label: 'Benefics in the 5th, 2nd or 3rd', questions: ['traveller_return', 'lost_item'], baseWeight: 2,
    evaluate: f => placement(f, [5, 2, 3], 'b', 'The lost thing or missing person is found.', 'favourable'),
  },
  {
    id: '5.1-quick', sloka: '5.1', step: 6, label: 'Jupiter or Venus in the 5th, 2nd or 3rd', questions: ['traveller_return'], baseWeight: 2,
    evaluate: f => {
      const ids = (['Ju', 'Ve'] as GrahaId[]).filter(id => [5, 2, 3].includes(f.house(id)))
      return ids.length ? { statement: 'A very quick return.', polarity: 'favourable', planets: ids, facts: placed(f, ids) } : null
    },
  },
  {
    id: '5.2-kendra', sloka: '5.2', step: 6, label: 'A planet in the 7th or 6th, with Jupiter in a kendra', questions: ['traveller_return'], baseWeight: 2.5,
    evaluate: f => {
      const ids = f.inHouses([7, 6])
      return ids.length && KENDRAS.includes(f.house('Ju'))
        ? { statement: 'The absent person returns.', polarity: 'favourable', planets: [...ids, 'Ju'], facts: [...placed(f, ids), `Jupiter in ${ordinal(f.house('Ju'))} (kendra)`] } : null
    },
  },
  {
    id: '5.2-trikona', sloka: '5.2', step: 6, label: 'Mercury or Venus in the 5th or 9th', questions: ['traveller_return'], baseWeight: 2,
    evaluate: f => {
      const ids = (['Me', 'Ve'] as GrahaId[]).filter(id => TRIKONAS.includes(f.house(id)))
      return ids.length ? { statement: 'The absent person returns.', polarity: 'favourable', planets: ids, facts: placed(f, ids) } : null
    },
  },
  {
    id: '5.3-safe', sloka: '5.3', step: 6, label: 'Moon in the 8th, kendras free of malefics', questions: TRAVELLER, baseWeight: 2.5,
    evaluate: f => f.house('Mo') === 8 && only(f.inHouses(KENDRAS), f, 'm').length === 0
      ? { statement: 'The traveller returns safely.', polarity: 'favourable', planets: ['Mo'], facts: [moonFact(f), 'No malefic in a kendra'] } : null,
  },
  {
    id: '5.3-gain', sloka: '5.3', step: 6, label: 'Moon in the 8th, benefics in kendras', questions: TRAVELLER, baseWeight: 1.5,
    evaluate: f => {
      if (f.house('Mo') !== 8 || only(f.inHouses(KENDRAS), f, 'm').length) return null
      const ids = only(f.inHouses(KENDRAS), f, 'b')
      return ids.length ? { statement: 'The traveller returns with gain.', polarity: 'favourable', planets: ids, facts: placed(f, ids) } : null
    },
  },
  {
    id: '5.4-confine', sloka: '5.4', step: 6, label: 'Back-rising lagna aspected by malefics', questions: TRAVELLER, baseWeight: 2.5,
    evaluate: f => {
      if (f.lagnaInfo.rising !== 'back') return null
      const ids = f.maleficAspectsOn(f.lagna)
      return ids.length ? { statement: 'Traditional warning of harm or confinement.', polarity: 'unfavourable', planets: ids, facts: [lagnaFact(f), `Malefic aspect: ${listNames(ids)}`] } : null
    },
  },
  {
    id: '5.4-moved', sloka: '5.4', step: 6, label: 'Malefic in the 3rd, no benefic influence', questions: TRAVELLER, baseWeight: 1.5,
    evaluate: f => {
      const ids = only(f.inHouse(3), f, 'm').filter(id => noBeneficOn(f, id))
      return ids.length ? { statement: 'The traveller has moved on elsewhere.', polarity: 'unfavourable', planets: ids, facts: placed(f, ids) } : null
    },
  },
  {
    id: '5.4-sixth', sloka: '5.4', step: 6, label: 'Malefic in the 6th, no benefic influence', questions: TRAVELLER, baseWeight: 2.5,
    evaluate: f => {
      const ids = only(f.inHouse(6), f, 'm').filter(id => noBeneficOn(f, id))
      return ids.length ? { statement: 'Traditional warning of serious trouble or loss of contact. This is not a statement about anyone\'s life.', polarity: 'unfavourable', planets: ids, facts: placed(f, ids) } : null
    },
  },
  {
    id: '5.4-robbed', sloka: '5.4', step: 6, label: 'Malefic in a kendra, no benefic influence', questions: TRAVELLER, baseWeight: 2,
    evaluate: f => {
      const ids = only(f.inHouses(KENDRAS), f, 'm').filter(id => noBeneficOn(f, id))
      return ids.length ? { statement: 'Traditional warning of robbery or loss of belongings.', polarity: 'unfavourable', planets: ids, facts: placed(f, ids) } : null
    },
  },

  // ── Chapter 6 ──
  {
    id: '6.1', sloka: '6.1', step: 6, label: 'Fixed sign, fixed navāṃśa or vargottama rising', questions: LOST, baseWeight: 2,
    evaluate: f => {
      const facts = [
        ...(f.lagnaInfo.mobility === 'fixed' ? [lagnaFact(f)] : []),
        ...(SIGN_TABLE[f.navamsaSign].mobility === 'fixed' ? [`Fixed navāṃśa rising (${signName(f.navamsaSign)})`] : []),
        ...(f.vargottama ? ['Vargottama navāṃśa rising'] : []),
      ]
      return facts.length ? { statement: 'Taken by someone close to the owner, and still in that place.', polarity: 'favourable', facts } : null
    },
  },
  {
    id: '6.3-moon', sloka: '6.3', step: 5, label: 'Full Moon in the lagna', questions: LOST, baseWeight: 3, repeated: true,
    evaluate: f => f.house('Mo') === 1 && f.moonFull
      ? { statement: 'Quick recovery.', polarity: 'favourable', planets: ['Mo'], facts: [`Full Moon in the lagna (${f.elongation.toFixed(0)}° from the Sun)`] } : null,
  },
  {
    id: '6.3-rising', sloka: '6.3', step: 6, label: 'Benefic in a rising head-rising sign, aspected by benefics', questions: LOST, baseWeight: 3, repeated: true,
    evaluate: f => {
      if (f.lagnaInfo.rising !== 'head') return null
      const ids = only(f.inHouse(1), f, 'b')
      const by = f.beneficAspectsOn(f.lagna)
      return ids.length && by.length ? { statement: 'Quick recovery.', polarity: 'favourable', planets: ids, facts: [...placed(f, ids), `${signName(f.lagna)} is śīrṣodaya`, `Aspected by ${listNames(by)}`] } : null
    },
  },
  {
    id: '6.3-eleventh', sloka: '6.3', step: 6, label: 'Strong benefic in the 11th', questions: LOST, baseWeight: 3, repeated: true,
    evaluate: f => {
      const ids = only(f.inHouse(11), f, 'b').filter(f.isStrong)
      return ids.length ? { statement: 'Quick recovery.', polarity: 'favourable', planets: ids, facts: placed(f, ids).map(s => `Strong benefic: ${s}`) } : null
    },
  },

  // ── Chapter 7 ──
  {
    id: '7.1-child', sloka: '7.1', step: 6, label: 'Saturn\'s house, odd or even', questions: ['child_pregnancy'], baseWeight: 1,
    evaluate: f => {
      const h = f.house('Sa')
      return { statement: h % 2 === 1 ? 'Traditional indication: a boy.' : 'Traditional indication: a girl.', polarity: 'descriptive', planets: ['Sa'], facts: [`Saturn in the ${ordinal(h)} (${h % 2 === 1 ? 'odd' : 'even'} house)`] }
    },
  },
  {
    id: '7.1-marriage', sloka: '7.1', step: 6, label: 'Saturn\'s house, odd or even', questions: ['marriage'], baseWeight: 3,
    evaluate: f => {
      const h = f.house('Sa')
      return h % 2 === 0
        ? { statement: 'The match is obtained.', polarity: 'favourable', planets: ['Sa'], facts: [`Saturn in the ${ordinal(h)} (even house)`] }
        : { statement: 'The match is not obtained.', polarity: 'unfavourable', planets: ['Sa'], facts: [`Saturn in the ${ordinal(h)} (odd house)`] }
    },
  },
  {
    id: '7.2-moon', sloka: '7.2', step: 5, label: 'Moon in the 3rd, 5th, 7th, 11th or 6th aspected by Jupiter, Sun and Mercury', questions: ['marriage'], baseWeight: 3,
    evaluate: f => {
      const moon = f.grahas.Mo.rashi
      return [3, 5, 7, 11, 6].includes(f.house('Mo')) && f.aspects('Ju', moon) && f.aspects('Su', moon) && f.aspects('Me', moon)
        ? { statement: 'The marriage takes place.', polarity: 'favourable', planets: ['Mo', 'Ju', 'Su', 'Me'], facts: [moonFact(f), 'Jupiter, the Sun and Mercury all aspect the Moon'] } : null
    },
  },
  {
    id: '7.2-benefics', sloka: '7.2', step: 6, label: 'Benefics in trikonas and kendras', questions: ['marriage'], baseWeight: 3,
    evaluate: f => placement(f, [...TRIKONAS, ...KENDRAS], 'b', 'The marriage takes place.', 'favourable'),
  },
  {
    id: '7.3', sloka: '7.3', step: 6, label: 'Venus and Saturn placements in the rainy season', questions: ['rain'], baseWeight: 3,
    notEvaluated: ctx => (ctx.season === 'rainy' ? null : 'The śloka applies only in the rainy season, and a chart cannot tell the season at your location. Confirm the season to evaluate it.'),
    evaluate: f => {
      const opp = (a: Rashi, b: Rashi) => ((a - b + 12) % 12) === 6
      if (opp(f.grahas.Ve.rashi, f.grahas.Mo.rashi) && opp(f.grahas.Sa.rashi, f.grahas.Su.rashi)) {
        return { statement: 'Rain.', polarity: 'favourable', planets: ['Ve', 'Sa'], facts: ['Venus 7th from the Moon', 'Saturn 7th from the Sun'] }
      }
      const pair = [f.house('Ve'), f.house('Sa')].sort((a, b) => a - b).join('-')
      if (pair === '4-8' || pair === '2-3') {
        return { statement: 'Rain.', polarity: 'favourable', planets: ['Ve', 'Sa'], facts: placed(f, ['Ve', 'Sa']) }
      }
      return null
    },
  },
  {
    id: '7.4-benefics', sloka: '7.4', step: 6, label: 'Bright fortnight, benefics in watery signs in the 3rd, 2nd or kendras', questions: ['rain'], baseWeight: 3,
    evaluate: f => {
      if (!f.moonWaxing) return null
      const ids = only(f.inHouses([3, 2, ...KENDRAS]), f, 'b').filter(id => WATERY_SIGNS.includes(f.grahas[id].rashi))
      return ids.length ? { statement: 'Rain.', polarity: 'favourable', planets: ids, facts: ['Bright fortnight', ...placed(f, ids)] } : null
    },
  },
  {
    id: '7.4-moon', sloka: '7.4', step: 5, label: 'Moon rising in a watery sign', questions: ['rain'], baseWeight: 3,
    evaluate: f => f.house('Mo') === 1 && WATERY_SIGNS.includes(f.grahas.Mo.rashi)
      ? { statement: 'Rain.', polarity: 'favourable', planets: ['Mo'], facts: [moonFact(f)] } : null,
  },
  {
    id: '7.5-male', sloka: '7.5', step: 6, label: 'Strong male varga rising, aspected by male planets', questions: ['child_pregnancy'], baseWeight: 1,
    evaluate: f => {
      if (f.navamsaSign % 2 !== 1 || !f.isStrong(f.navamsaLord)) return null
      const by = (['Su', 'Ma', 'Ju'] as GrahaId[]).filter(id => f.aspects(id, f.lagna))
      return by.length ? { statement: 'Traditional indication: a boy.', polarity: 'descriptive', planets: by, facts: [`Odd navāṃśa ${signName(f.navamsaSign)} rising, lord ${grahaName(f.navamsaLord)} strong`, `Aspected by ${listNames(by)}`] } : null
    },
  },
  {
    id: '7.5-female', sloka: '7.5', step: 6, label: 'Female varga rising, aspected by female planets', questions: ['child_pregnancy'], baseWeight: 1,
    evaluate: f => {
      if (f.navamsaSign % 2 !== 0) return null
      const by = (['Mo', 'Ve'] as GrahaId[]).filter(id => f.aspects(id, f.lagna))
      return by.length ? { statement: 'Traditional indication: a girl.', polarity: 'descriptive', planets: by, facts: [`Even navāṃśa ${signName(f.navamsaSign)} rising`, `Aspected by ${listNames(by)}`] } : null
    },
  },
  {
    id: '7.5-pregnant', sloka: '7.5', step: 6, label: 'Mercury in the lagna', questions: ['child_pregnancy'], baseWeight: 1,
    evaluate: f => f.house('Me') === 1
      ? { statement: 'Traditional indication of pregnancy. Only a medical test can confirm this.', polarity: 'descriptive', planets: ['Me'], facts: placed(f, ['Me']) } : null,
  },
  {
    id: '7.9-query', sloka: '7.9', step: 6, label: 'Movable lagna, movable navāṃśa past the middle', questions: ['go_abroad'], baseWeight: 3, repeated: true,
    evaluate: f => f.lagnaInfo.mobility === 'movable' && SIGN_TABLE[f.navamsaSign].mobility === 'movable' && f.navamsaIndex > 5
      ? { statement: 'The chart matches a query about going abroad.', polarity: 'favourable', facts: [lagnaFact(f), `Navāṃśa ${f.navamsaIndex} (${signName(f.navamsaSign)}), past the middle`] } : null,
  },
  {
    id: '7.9-left', sloka: '7.9', step: 6, label: 'A planet just left the 7th', questions: ['go_abroad', 'traveller_return'], baseWeight: 3, repeated: true,
    evaluate: (f, ctx) => {
      const ids = f.inHouse(8).filter(id => f.grahas[id].degree < 30 / 9)
      if (!ids.length) return null
      const direct = ids.filter(id => !f.grahas[id].isRetro)
      const facts = placed(f, ids).map((s, i) => `${s} at ${f.grahas[ids[i]].degree.toFixed(1)}°${f.grahas[ids[i]].isRetro ? ', retrograde' : ', direct'}`)
      if (direct.length) {
        return ctx.question === 'go_abroad'
          ? { statement: 'The idea of going is dropped.', polarity: 'unfavourable', planets: direct, facts }
          : { statement: 'The person returns.', polarity: 'favourable', planets: direct, facts }
      }
      return ctx.question === 'go_abroad'
        ? { statement: 'The planet is retrograde, so the idea is not dropped.', polarity: 'favourable', planets: ids, facts }
        : { statement: 'The planet is retrograde, so this does not bring the person back.', polarity: 'unfavourable', planets: ids, facts }
    },
  },
  {
    id: '7.10', sloka: '7.10', step: 6, label: 'The 7th as the querist\'s private conduct', questions: ALL, baseWeight: 0,
    notEvaluated: () => 'Needs context from the querist that a chart cannot supply. Its social categories stay in the śloka reference and are not turned into statements about anyone.',
    evaluate: () => null,
  },
  {
    id: '7.11-ill', sloka: '7.11', step: 6, label: 'Saturn with a malefic in the 9th, no benefic influence', questions: TRAVELLER, baseWeight: 3,
    evaluate: f => {
      if (f.house('Sa') !== 9 || only(f.inHouse(9), f, 'm').length < 2 || !noBeneficOn(f, 'Sa')) return null
      return { statement: 'Traditional indication of illness while abroad.', polarity: 'unfavourable', planets: only(f.inHouse(9), f, 'm'), facts: placed(f, only(f.inHouse(9), f, 'm')) }
    },
  },
  {
    id: '7.11-danger', sloka: '7.11', step: 6, label: 'Saturn with a malefic in the 8th, no benefic influence', questions: TRAVELLER, baseWeight: 3.5,
    evaluate: f => {
      if (f.house('Sa') !== 8 || only(f.inHouse(8), f, 'm').length < 2 || !noBeneficOn(f, 'Sa')) return null
      return { statement: 'Traditional warning of serious danger for the traveller. This is not a prediction about anyone\'s life: please check on the person directly.', polarity: 'unfavourable', planets: only(f.inHouse(8), f, 'm'), facts: placed(f, only(f.inHouse(8), f, 'm')) }
    },
  },
  {
    id: '7.12', sloka: '7.12', step: 6, label: 'Sun in the 8th, joined and aspected by benefics', questions: TRAVELLER, baseWeight: 0,
    evaluate: f => {
      if (f.house('Su') !== 8) return null
      const joined = only(f.inHouse(8), f, 'b')
      const by = f.beneficAspectsOn(f.grahas.Su.rashi, 'Su')
      return joined.length && by.length
        ? { statement: 'The querist\'s father, if abroad, has moved on to another country.', polarity: 'descriptive', planets: ['Su'], facts: [`Sun in the 8th, joined by ${listNames(joined)}, aspected by ${listNames(by)}`] } : null
    },
  },
]

/** Which rules answer each narrower question. Only what those ślokas themselves say. */
const FOCUSED_RULES: Partial<Record<SatpanchasikaQuestion, string[]>> = {
  keep_position: ['1.2-fall', '1.3-good', '1.3-bad', '2.1', '2.2-movable', '4.3-malefics'],
  growth: ['1.2-growth', '1.3-good', '1.3-bad'],
  honour: ['4.3-honour', '4.3-malefics', '4.3-moon'],
  woman_benefit: ['4.4-moon'],
  friendship: ['3.4-friend', '3.4-war'],
  set_out: ['2.5-benefic', '2.5-malefic', '2.5-fixed', '2.9'],
  traveller_health: ['7.11-ill', '7.11-danger'],
  traveller_whereabouts: ['5.3-safe', '5.3-gain', '5.4-confine', '5.4-moved', '5.4-sixth', '5.4-robbed'],
  father_abroad: ['7.12'],
  mission_return: ['3.5'],
  lost_who: ['6.1'],
  any_house: ['1.3-good', '1.3-bad'],
}

export function ruleAppliesTo(rule: RuleDef, question: SatpanchasikaQuestion): boolean {
  return rule.questions.includes(question) || (FOCUSED_RULES[question]?.includes(rule.id) ?? false)
}

/** Friend or enemy of the rising-navāṃśa lord, for 7.8. */
export function navamsaLordRelation(f: ChartFacts, occupant: GrahaId): 'self' | 'friend' | 'neutral' | 'enemy' {
  if (occupant === f.navamsaLord) return 'self'
  return naturalRelationship(f.navamsaLord, occupant)
}
