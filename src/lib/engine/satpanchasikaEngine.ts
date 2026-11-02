// ─────────────────────────────────────────────────────────────
//  src/lib/engine/satpanchasikaEngine.ts
//  Ṣaṭpañcāśikā (Pṛthuyaśas) praśna pipeline: the 8-step method over a cast
//  chart. Verdict weighs strength over the count of rules (1.4, Utpala).
//  Runs in the browser on /api/chart/calculate output. Pure, no React/DB/Redis.
// ─────────────────────────────────────────────────────────────

import type { GrahaId } from '@/types/astrology'
import {
  KENDRAS, PLANET_AGE, PLANET_DIRECTION, SEVEN_GRAHAS, SIGN_TABLE,
  buildChartFacts, grahaName, listNames, ordinal, signName,
  type ChartFacts, type SatpanchasikaChartInput,
} from './satpanchasikaFacts'
import {
  SATPANCHASIKA_RULES, navamsaLordRelation, ruleAppliesTo,
  type ContestRole, type RuleContext, type RuleDef, type RulePolarity, type SatpanchasikaQuestion,
} from './satpanchasikaRules'
import { SATPANCHASIKA_SLOKAS } from './satpanchasikaSlokas'
import { SIGN_LORDS } from './krishneeyam'
import { D9 } from './vargas'

export type { ContestRole, RulePolarity, SatpanchasikaQuestion } from './satpanchasikaRules'
export { SATPANCHASIKA_INTERPRETIVE_NOTES } from './satpanchasikaFacts'
export type { SatpanchasikaChartInput } from './satpanchasikaFacts'

export type SatpanchasikaVerdict =
  | 'favourable' | 'with_difficulty' | 'leans_unfavourable' | 'unfavourable'
  | 'no_change' | 'indication_only' | 'insufficient'

export const SATPANCHASIKA_QUESTION_GROUPS = [
  'Success and standing', 'Travel and the absent', 'Rivals and disputes', 'Lost items',
  'Family and health', 'About the question itself', 'Other',
] as const
export type SatpanchasikaQuestionGroup = typeof SATPANCHASIKA_QUESTION_GROUPS[number]

export interface QuestionMeta {
  id: SatpanchasikaQuestion
  label: string
  hint: string
  judgedHouse: number
  slokas: string
  group: SatpanchasikaQuestionGroup
  answers: Record<'yes' | 'hard' | 'lean' | 'no' | 'still', string>
  /** Reports what the ślokas describe, with no yes-or-no verdict. */
  indicationOnly?: boolean
  /** Headline when no rule for this narrow question matches. */
  noSignal?: string
}

const answers = (yes: string, hard: string, lean: string, no: string, still: string) => ({ yes, hard, lean, no, still })
const NONE = answers('', '', '', '', '')

export const SATPANCHASIKA_QUESTIONS: QuestionMeta[] = [
  { id: 'work', group: 'Success and standing', label: 'Will the work succeed', hint: 'A task, project or plan', judgedHouse: 1, slokas: '1.4, 4.1', answers: answers('The work tends to succeed', 'Success, but only with difficulty', 'The work leans towards failure', 'The work tends to fail', 'No clear change either way') },
  { id: 'position', group: 'Success and standing', label: 'Job or position', hint: 'Getting or keeping a post', judgedHouse: 10, slokas: '2.1, 4.3', answers: answers('A position tends to be gained or held', 'A position comes, with difficulty', 'The position looks insecure', 'The position tends to be lost or denied', 'The present position tends to stay as it is') },
  { id: 'money', group: 'Success and standing', label: 'Gain or loss of money', hint: 'Income, deal, investment outcome', judgedHouse: 11, slokas: '4.2, 4.4', answers: answers('Points to gain', 'Gain, with difficulty', 'Leans towards loss', 'Points to loss', 'No clear change either way') },
  { id: 'patient', group: 'Family and health', label: 'Will the patient recover', hint: 'Traditional indications only', judgedHouse: 1, slokas: '4.5', answers: answers('Traditional indications favour recovery', 'Indications favour recovery, with difficulty', 'Indications lean against easy recovery', 'Indications do not support easy recovery', 'Indications show the condition staying as it is') },
  { id: 'traveller_return', group: 'Travel and the absent', label: 'Will the traveller return', hint: 'Someone away or missing', judgedHouse: 7, slokas: '5.1 to 5.3', answers: answers('A return is indicated', 'A return is indicated, with difficulty', 'A return looks doubtful', 'A return is not indicated', 'No going or coming: things stay as they are') },
  { id: 'traveller_safe', group: 'Travel and the absent', label: 'Is the traveller safe', hint: 'Traditional indications only', judgedHouse: 1, slokas: '5.4, 7.11', answers: answers('Indications favour safety', 'Indications are mixed, some difficulty shown', 'Indications lean towards trouble', 'Indications show trouble: check on the person directly', 'No change in the traveller\'s situation is shown') },
  { id: 'go_abroad', group: 'Travel and the absent', label: 'Will I go abroad', hint: 'A planned move or trip', judgedHouse: 10, slokas: '7.9, 1.2', answers: answers('Going is indicated', 'Going is indicated, with difficulty', 'Going looks doubtful', 'Going is not indicated', 'No going: the plan tends to stay as it is') },
  { id: 'opponent', group: 'Rivals and disputes', label: 'Will the opponent act', hint: 'Rival, litigant, enemy advance', judgedHouse: 4, slokas: '2.3 to 2.13', answers: answers('The opponent tends to stay away or turn back', 'The opponent comes, but is held off with effort', 'The opponent is likely to press on', 'The opponent is likely to come', 'The opponent tends to stay where they are') },
  { id: 'contest', group: 'Rivals and disputes', label: 'Who wins the contest', hint: 'Lawsuit, rival bid, negotiation, election', judgedHouse: 1, slokas: '3.1, 3.2', answers: answers('Indications favour your side', 'Indications favour your side, with difficulty', 'Indications lean to the other side', 'Indications favour the other side', 'No decisive change: neither side is defeated') },
  { id: 'settlement', group: 'Rivals and disputes', label: 'Will it settle peacefully', hint: 'Dispute, deal, reconciliation', judgedHouse: 7, slokas: '3.3, 3.4', answers: answers('Settlement is indicated', 'Settlement, with difficulty', 'Settlement looks doubtful', 'The dispute tends to continue', 'No clear change either way') },
  { id: 'lost_item', group: 'Lost items', label: 'Lost item', hint: 'Recovery, place, direction', judgedHouse: 11, slokas: '1.5, 6.1 to 6.5', answers: answers('Recovery is indicated', 'Recovery, with difficulty', 'Recovery looks doubtful', 'Recovery is not indicated', 'The item tends to stay where it is') },
  { id: 'marriage', group: 'Family and health', label: 'Will the marriage happen', hint: 'A specific proposal or match', judgedHouse: 7, slokas: '7.1, 7.2', answers: answers('The marriage is indicated', 'The marriage is indicated, with difficulty', 'The marriage looks doubtful', 'The marriage is not indicated', 'No clear change either way') },
  { id: 'child_pregnancy', group: 'Family and health', label: 'Child or pregnancy', hint: 'Classical indications only', judgedHouse: 5, slokas: '7.1, 7.5', answers: NONE, indicationOnly: true, noSignal: 'No classical indication fired' },
  { id: 'rain', group: 'Other', label: 'Will it rain', hint: 'Rainfall at this place', judgedHouse: 4, slokas: '7.3, 7.4', answers: answers('Rain is indicated', 'Rain is indicated', 'Rain is not clearly shown', 'Rain is not shown', 'Rain is not shown'), noSignal: 'Rain is not shown' },
  // Narrower questions
  { id: 'keep_position', group: 'Success and standing', label: 'Will I lose my position', hint: 'Fall from a post you hold', judgedHouse: 1, slokas: '1.2, 2.1', answers: answers('The position tends to be held', 'The position holds, with difficulty', 'The position looks insecure', 'A fall from position is indicated', 'The position tends to stay as it is') },
  { id: 'growth', group: 'Success and standing', label: 'Will things grow', hint: 'Prosperity, judged from the 4th', judgedHouse: 4, slokas: '1.2, 1.3', answers: answers('Growth is indicated', 'Growth, with difficulty', 'Growth looks doubtful', 'The 4th suffers: growth is not indicated', 'No clear change either way') },
  { id: 'honour', group: 'Success and standing', label: 'Honour and standing', hint: 'Respect and wealth together', judgedHouse: 1, slokas: '4.3', answers: answers('Honour and wealth are indicated', 'Honour comes, with difficulty', 'Honour looks doubtful', 'Honour is not indicated', 'No clear change either way'), noSignal: 'No 4.3 combination for honour is present' },
  { id: 'woman_benefit', group: 'Success and standing', label: 'Good fortune through a woman', hint: 'Moon aspected by Jupiter', judgedHouse: 7, slokas: '4.4', answers: answers('Good fortune through a woman is indicated', 'Good fortune through a woman is indicated', '', '', ''), noSignal: 'The 4.4 combination is not present' },
  { id: 'set_out', group: 'Travel and the absent', label: 'Is it good to set out', hint: 'Starting a journey or move now', judgedHouse: 1, slokas: '2.5, 2.9', answers: answers('Setting out is favoured', 'Setting out is mixed', 'Setting out leans against you', 'Setting out shows harm', 'No clear change either way'), noSignal: 'These rules need a movable or fixed sign rising, with a planet in it: not present' },
  { id: 'traveller_when', group: 'Travel and the absent', label: 'When will the traveller return', hint: 'Timing methods only', judgedHouse: 7, slokas: '1.2, 2.14 to 2.16, 5.5', answers: NONE, indicationOnly: true },
  { id: 'traveller_whereabouts', group: 'Travel and the absent', label: 'What has happened to the traveller', hint: 'Safe, moved on or in trouble', judgedHouse: 1, slokas: '5.3, 5.4', answers: NONE, indicationOnly: true, noSignal: 'Neither 5.3 nor 5.4 is shown in this chart' },
  { id: 'traveller_health', group: 'Travel and the absent', label: 'Is the traveller ill abroad', hint: 'Traditional indications only', judgedHouse: 9, slokas: '7.11', answers: answers('', '', '', 'A traditional warning is shown: check on the person directly', ''), noSignal: 'The 7.11 combination is not present' },
  { id: 'mission_return', group: 'Travel and the absent', label: 'Will the team or mission return', hint: 'People sent out on a task', judgedHouse: 7, slokas: '2.14, 2.15, 3.5', answers: answers('A return soon is indicated', 'A return soon is indicated', '', '', ''), noSignal: 'The 3.5 combination is not present; see the timing below' },
  { id: 'father_abroad', group: 'Travel and the absent', label: 'Has my father moved abroad', hint: 'Father already away', judgedHouse: 9, slokas: '7.12', answers: NONE, indicationOnly: true, noSignal: 'The 7.12 combination is not present' },
  { id: 'opponent_when', group: 'Rivals and disputes', label: 'When will the opponent act', hint: 'Timing method only', judgedHouse: 4, slokas: '2.17', answers: NONE, indicationOnly: true },
  { id: 'friendship', group: 'Rivals and disputes', label: 'Will the parties become friends', hint: 'More than a settlement', judgedHouse: 7, slokas: '3.4', answers: answers('Friendship between the parties is indicated', 'Mixed: some friendship, some conflict', 'The conflict leans towards continuing', 'The conflict continues', ''), noSignal: 'No 3.4 combination is present' },
  { id: 'lost_who', group: 'Lost items', label: 'Who took it', hint: 'Own people, age of the person', judgedHouse: 11, slokas: '6.1, 6.5', answers: NONE, indicationOnly: true },
  { id: 'lost_where', group: 'Lost items', label: 'Where is it', hint: 'Place, direction, distance', judgedHouse: 11, slokas: '6.2, 6.4', answers: NONE, indicationOnly: true },
  { id: 'whom', group: 'About the question itself', label: 'Whom is this about', hint: 'Whom the querist has in mind', judgedHouse: 1, slokas: '7.7, 7.8', answers: NONE, indicationOnly: true },
  { id: 'object_class', group: 'About the question itself', label: 'What kind of thing is it', hint: 'Mineral, plant or living being', judgedHouse: 1, slokas: '1.6, 1.7', answers: NONE, indicationOnly: true },
  { id: 'person_age', group: 'About the question itself', label: 'How old is the person meant', hint: 'Young, adult or elder', judgedHouse: 1, slokas: '7.6', answers: NONE, indicationOnly: true },
  { id: 'any_house', group: 'Other', label: 'Any area of life', hint: 'Choose a house: 1.3 judges any bhāva', judgedHouse: 1, slokas: '1.3', answers: answers('This house flourishes', 'This house flourishes and suffers together', 'This house leans towards suffering', 'This house suffers', ''), noSignal: 'Neither its lord, a benefic nor a malefic touches this house' },
]

export const SATPANCHASIKA_STUDY_NOTE =
  'A study framework from a classical text, not a forecast. Test it on past questions with known outcomes and keep a log of hits and misses.'

const TRAVELLER_NOTICE = 'Traditional indication only. If you are worried about someone, contact them or the authorities directly. It never establishes that a person has come to harm.'

const QUESTION_NOTICE: Partial<Record<SatpanchasikaQuestion, string>> = {
  patient: 'Traditional indication only, not medical advice. Please rely on a qualified doctor for diagnosis and treatment.',
  traveller_safe: TRAVELLER_NOTICE,
  traveller_health: TRAVELLER_NOTICE,
  traveller_whereabouts: TRAVELLER_NOTICE,
  child_pregnancy: 'Classical text, not medical advice and not a way to learn a baby\'s sex or confirm a pregnancy. Prenatal sex determination is prohibited by law in India and elsewhere.',
  contest: 'Traditional indication only, not legal or financial advice. Please take a qualified professional\'s view on your case.',
  opponent: 'Traditional indication only, not legal or safety advice. The text\'s war language is read here as any contest or rival.',
  money: 'Traditional indication only, not financial advice.',
}

export interface FiredRule {
  ruleId: string
  slokaId: string
  label: string
  statement: string
  facts: string[]
  polarity: RulePolarity
  step: number
  baseWeight: number
  strengthFactor: number
  repeated: boolean
  weight: number
}

export interface NotEvaluatedRule {
  ruleId: string
  slokaId: string
  label: string
  reason: string
}

export type SlokaStatus =
  | 'fired' | 'not_fired' | 'not_evaluated' | 'timing' | 'detail' | 'subject'
  | 'other_question' | 'invocation'

export interface TimingResult {
  id: 'strongest_planet' | 'seventh_lord_retro' | 'lagna_to_moon' | 'first_occupied' | 'planet_to_fourth'
  slokas: string
  name: string
  purpose: string
  unit: 'months' | 'days' | 'event'
  value: number | null
  status: 'computed' | 'void' | 'event'
  working: string
  /** 'text': the śloka gives this method for this question. 'adapted': borrowed by analogy. */
  basis: 'text' | 'adapted'
}

export interface LostItemDetails {
  object: { kind: 'Dhātu (mineral or metal)' | 'Mūla (plant or root)' | 'Jīva (living being)'; working: string }
  objectBy16: string | null
  whoHolds: { value: string; working: string }
  where: { place: string; working: string }
  direction: { value: string; working: string }
  distance: { steps: number; working: string }
  whenLost: { value: 'Daytime' | 'Night'; working: string }
  personAge: { value: string; working: string }
}

export interface SubjectResult {
  strongest: GrahaId
  strongestHouse: number
  concerns: string
  concernsWorking: string
  classBy17: string
  classBy16: string | null
  navamsaRelation: string | null
  personAge: string | null
}

export interface PlanetRow {
  id: GrahaId
  name: string
  house: number
  sign: string
  navamsa: string
  nature: 'Benefic' | 'Malefic'
  natureReason: string
  strength: number
  isStrong: boolean
  retrograde: boolean
  isStrongest: boolean
}

export interface MethodStep {
  step: number
  title: string
  summary: string
  slokas: string
}

export interface SatpanchasikaReading {
  question: SatpanchasikaQuestion
  questionLabel: string
  verdict: SatpanchasikaVerdict
  headline: string
  /** How one-sided the weighted signals are, 0 to 100. Not a probability. */
  clarity: number
  weights: { favourable: number; unfavourable: number; mixed: number; noChange: number }
  fired: FiredRule[]
  notEvaluated: NotEvaluatedRule[]
  notFiredCount: number
  slokaStatus: Record<string, SlokaStatus>
  timing: TimingResult[]
  timingNote: string | null
  /** Caution when the reading does not favour the event, or the timing is adapted. */
  timingCaveat: string | null
  /** Where a fired śloka itself says the result comes quickly. */
  paceNotes: string[]
  lostItem: LostItemDetails | null
  subject: SubjectResult
  steps: MethodStep[]
  /** How the engine itself sees each planet, so every rule can be checked by hand. */
  planets: PlanetRow[]
  strengthSource: 'shadbala' | 'dignity'
  notices: string[]
}

export interface SatpanchasikaOptions {
  question: SatpanchasikaQuestion
  /** Only for contests. Defaults to defender. */
  contestRole?: ContestRole
  /** Only for 'any_house': the bhāva to judge, 1 to 12. */
  house?: number
  /** Set when the querist confirms the rainy season (7.3). */
  season?: 'rainy'
}

const REPEATED_MULTIPLIER = 1.25

// ─── Timing: five methods, kept apart by question and unit ──────────────────

const TIMING_BY_QUESTION: Partial<Record<SatpanchasikaQuestion, TimingResult['id'][]>> = {
  traveller_return: ['strongest_planet', 'seventh_lord_retro', 'first_occupied', 'planet_to_fourth'],
  traveller_safe: ['first_occupied'],
  opponent: ['lagna_to_moon'],
  contest: ['strongest_planet', 'seventh_lord_retro'],
  traveller_when: ['strongest_planet', 'seventh_lord_retro', 'first_occupied', 'planet_to_fourth'],
  traveller_whereabouts: ['first_occupied'],
  mission_return: ['strongest_planet', 'seventh_lord_retro'],
  opponent_when: ['lagna_to_moon'],
}

/**
 * The text times only returns and arrivals. Other event questions borrow a method by
 * analogy so the user still gets a "when", always labelled as adapted: months for
 * slower life matters, days for quick ones.
 */
const ADAPTED_TIMING: Partial<Record<SatpanchasikaQuestion, TimingResult['id'][]>> = {
  work: ['strongest_planet'], position: ['strongest_planet'], keep_position: ['strongest_planet'],
  money: ['strongest_planet'], growth: ['strongest_planet'], honour: ['strongest_planet'],
  woman_benefit: ['strongest_planet'], patient: ['strongest_planet'], go_abroad: ['strongest_planet'],
  settlement: ['strongest_planet'], friendship: ['strongest_planet'], marriage: ['strongest_planet'],
  any_house: ['strongest_planet'],
  lost_item: ['first_occupied'], lost_who: ['first_occupied'], lost_where: ['first_occupied'],
  set_out: ['lagna_to_moon'], rain: ['lagna_to_moon'],
}

const QUICK_RULES: Record<string, string> = {
  '1.5-moon': '1.5 says recovery comes quickly.',
  '1.5-eleventh': '1.5 says recovery comes quickly.',
  '6.3-moon': '6.3 says recovery comes quickly.',
  '6.3-rising': '6.3 says recovery comes quickly.',
  '6.3-eleventh': '6.3 says recovery comes quickly.',
  '5.1-quick': '5.1 says the return is very quick.',
  '3.5': '3.5 says the return comes soon.',
  '3.3-peace': '3.3 says the settlement comes quickly.',
  '2.11-yes': '2.11 says the opposing force comes quickly.',
  '2.9': '2.9 says the move is quick.',
}

function timingStrongestPlanet(f: ChartFacts): TimingResult {
  const base = f.house(f.strongest)
  const nav = f.navamsaOf(f.strongest)
  const mobility = SIGN_TABLE[nav].mobility
  const mult = mobility === 'movable' ? 1 : mobility === 'fixed' ? 2 : 3
  return {
    id: 'strongest_planet', slokas: '2.14, 2.15', name: 'Strongest planet',
    purpose: 'Return of one who went to fight or on a mission', unit: 'months', status: 'computed', basis: 'text',
    value: base * mult,
    working: `${grahaName(f.strongest)} is strongest, in the ${ordinal(base)} from the lagna; ${mobility} navāṃśa (${signName(nav)}) gives ×${mult}, so ${base} × ${mult} months.`,
  }
}

function timingSeventhLord(f: ChartFacts): TimingResult {
  const lord = f.lordOf(7)
  const base = { basis: 'text' as const, id: 'seventh_lord_retro' as const, slokas: '2.16', name: '7th lord retrograde', purpose: 'Return, in the view of other teachers', unit: 'event' as const, value: null }
  if (lord === 'Su' || lord === 'Mo') {
    return { ...base, status: 'void', working: `The 7th lord is ${grahaName(lord)}, which never turns retrograde, so this method gives no date.` }
  }
  return {
    ...base, status: 'event',
    working: f.grahas[lord].isRetro
      ? `The 7th lord ${grahaName(lord)} is retrograde at the moment of the question.`
      : `Watch for the 7th lord ${grahaName(lord)} turning retrograde. The event is not dated here.`,
  }
}

function timingLagnaToMoon(f: ChartFacts): TimingResult {
  const count = f.house('Mo')
  const between = SEVEN_GRAHAS.filter(id => id !== 'Mo' && f.house(id) > 1 && f.house(id) < count)
  const base = { basis: 'text' as const, id: 'lagna_to_moon' as const, slokas: '2.17', name: 'Lagna to Moon', purpose: 'Opponent\'s arrival', unit: 'days' as const }
  return between.length
    ? { ...base, status: 'void', value: null, working: `${listNames(between)} lie between the lagna and the Moon, so the count is void.` }
    : { ...base, status: 'computed', value: count, working: `${signName(f.lagna)} to ${signName(f.grahas.Mo.rashi)} is ${count} signs, with no planet between.` }
}

function timingFirstOccupied(f: ChartFacts): TimingResult {
  const base = { basis: 'text' as const, id: 'first_occupied' as const, slokas: '5.5', name: 'First occupied sign', purpose: 'Traveller\'s return', unit: 'days' as const, status: 'computed' as const }
  for (let h = 1; h <= 12; h++) {
    const ids = f.inHouse(h)
    if (!ids.length) continue
    const planet = ids.reduce((best, id) => (f.strengthFactor(id) > f.strengthFactor(best) ? id : best), ids[0])
    const retro = f.grahas[planet].isRetro
    return {
      ...base,
      value: retro ? h : h * 12,
      working: `${signName(f.lagna)} to ${signName(f.signAt(h))} (${grahaName(planet)}) counts ${h}; ${retro ? 'retrograde, so the count itself' : `direct, so ${h} × 12`}.`,
    }
  }
  return { ...base, status: 'void', value: null, working: 'No occupied sign found.' }
}

function timingPlanetToFourth(f: ChartFacts): TimingResult {
  const base = { basis: 'text' as const, id: 'planet_to_fourth' as const, slokas: '1.2 (commentary)', name: 'Planet entering the 4th', purpose: 'Traveller reaching home', unit: 'days' as const }
  const here = f.inHouse(4)
  if (here.length) {
    return { ...base, status: 'computed', value: 0, working: `${listNames(here)} already in the 4th (${signName(f.signAt(4))}).` }
  }
  const start = (f.signAt(4) - 1) * 30
  const arc = (id: GrahaId) => (start - f.grahas[id].totalDegree + 360) % 360
  const direct = SEVEN_GRAHAS.filter(id => !f.grahas[id].isRetro)
  if (!direct.length) return { ...base, status: 'void', value: null, working: 'No direct planet is moving towards the 4th.' }
  const nearest = direct.reduce((best, id) => (arc(id) < arc(best) ? id : best), direct[0])
  const degrees = Math.ceil(arc(nearest))
  const speed = Math.abs(f.grahas[nearest].speed ?? 0)
  const actual = speed > 0 ? ` At its current speed that takes about ${Math.ceil(arc(nearest) / speed)} days.` : ''
  return {
    ...base, status: 'computed', value: degrees,
    working: `${grahaName(nearest)} is the nearest direct planet, ${degrees}° before ${signName(f.signAt(4))}; the commentary reads degrees as days.${actual}`,
  }
}

const TIMING_FNS: Record<TimingResult['id'], (f: ChartFacts) => TimingResult> = {
  strongest_planet: timingStrongestPlanet,
  seventh_lord_retro: timingSeventhLord,
  lagna_to_moon: timingLagnaToMoon,
  first_occupied: timingFirstOccupied,
  planet_to_fourth: timingPlanetToFourth,
}

/** All five methods, for tests and reference. Readings use only those fit for the question. */
export function computeAllTiming(chart: SatpanchasikaChartInput): Record<TimingResult['id'], TimingResult> {
  const f = buildChartFacts(chart)
  return {
    strongest_planet: timingStrongestPlanet(f),
    seventh_lord_retro: timingSeventhLord(f),
    lagna_to_moon: timingLagnaToMoon(f),
    first_occupied: timingFirstOccupied(f),
    planet_to_fourth: timingPlanetToFourth(f),
  }
}

// ─── Subject: step 2 ────────────────────────────────────────────────────────

const HOUSE_PERSON: Record<number, string> = {
  1: 'the querist', 3: 'a brother or sibling', 4: 'a mother or sister', 5: 'a child',
  6: 'an enemy or rival', 7: 'a spouse', 9: 'a religious person', 10: 'a teacher or guru',
}

function classBy17(f: ChartFacts): { kind: LostItemDetails['object']['kind']; working: string } {
  const group = ((f.navamsaIndex - 1) % 3) + 1
  const odd = f.lagna % 2 === 1
  const order: LostItemDetails['object']['kind'][] = odd
    ? ['Dhātu (mineral or metal)', 'Mūla (plant or root)', 'Jīva (living being)']
    : ['Jīva (living being)', 'Mūla (plant or root)', 'Dhātu (mineral or metal)']
  return {
    kind: order[group - 1],
    working: `Navāṃśa ${f.navamsaIndex} of ${odd ? 'odd' : 'even'} sign ${signName(f.lagna)} (1.7).`,
  }
}

function classBy16(f: ChartFacts): string | null {
  const ordered = [...SEVEN_GRAHAS].sort((a, b) => f.strengthFactor(b) - f.strengthFactor(a))
  for (const id of ordered) {
    const ownPosition = SIGN_LORDS[f.navamsaOf(id)] === id
    for (const h of [1, 5, 9]) {
      const sign = f.signAt(h)
      if (!(f.aspects(id, sign))) continue
      // The house point sits at the lagna's degree in the house's sign.
      const ownTarget = SIGN_LORDS[D9((sign - 1) * 30 + f.lagnaDegree)] === id
      const where = `${grahaName(id)} aspects the ${ordinal(h)}`
      if (ownPosition && ownTarget) return `Dhātu: ${where}, own navāṃśa to own navāṃśa (1.6).`
      if (!ownPosition && ownTarget) return `Jīva: ${where}, another's navāṃśa to its own (1.6).`
      if (!ownPosition && !ownTarget) return `Mūla: ${where}, another's navāṃśa to another's (1.6).`
    }
  }
  return null
}

function personAge(f: ChartFacts): string | null {
  const touching = SEVEN_GRAHAS.filter(id => f.house(id) === 1 || f.aspects(id, f.lagna))
  const ranked = touching.sort((a, b) => f.strengthFactor(b) - f.strengthFactor(a))
  for (const id of ranked) {
    if ((id === 'Mo' && f.moonYoung) || id === 'Me') return `A young person: ${grahaName(id)} on the lagna (7.6).`
    if (id === 'Sa') return 'An elder: Saturn on the lagna (7.6).'
    if (id === 'Su' || id === 'Ju') return `An adult of parental age: ${grahaName(id)} on the lagna (7.6).`
    if (id === 'Ma' || id === 'Ve') return `A vigorous adult: ${grahaName(id)} on the lagna (7.6).`
  }
  return null
}

function buildSubject(f: ChartFacts): SubjectResult {
  const h = f.house(f.strongest)
  const person = HOUSE_PERSON[h]
  const occupant = f.inHouse(1).filter(f.isStrong)[0]
  let navamsaRelation: string | null = null
  if (occupant) {
    const rel = navamsaLordRelation(f, occupant)
    navamsaRelation = rel === 'self'
      ? `The rising-navāṃśa lord ${grahaName(occupant)} is strong in the lagna: the querist themselves (7.8).`
      : rel === 'friend'
        ? `${grahaName(occupant)} in the lagna is a friend of the navāṃśa lord ${grahaName(f.navamsaLord)}: a friend (7.8).`
        : rel === 'enemy'
          ? `${grahaName(occupant)} in the lagna is an enemy of the navāṃśa lord ${grahaName(f.navamsaLord)}: an adversary (7.8).`
          : null
  }
  return {
    strongest: f.strongest,
    strongestHouse: h,
    concerns: person ?? 'not named by the text',
    concernsWorking: person
      ? `${grahaName(f.strongest)} is strongest, in the ${ordinal(h)} (7.7, 7.8).`
      : `${grahaName(f.strongest)} is strongest, in the ${ordinal(h)}, a house 7.7 and 7.8 do not name.`,
    classBy17: classBy17(f).kind,
    classBy16: classBy16(f),
    navamsaRelation,
    personAge: personAge(f),
  }
}

// ─── Lost item: step 8 ──────────────────────────────────────────────────────

function buildLostItem(f: ChartFacts): LostItemDetails {
  const object = classBy17(f)
  const places = ['Near the door', 'The middle of the house', 'The back or far end of the house']
  const kendra = f.inHouses(KENDRAS)
  const ruler = kendra.length ? kendra.reduce((best, id) => (f.strengthFactor(id) > f.strengthFactor(best) ? id : best), kendra[0]) : null
  const direction = ruler
    ? { value: PLANET_DIRECTION[ruler] ?? '', working: `${grahaName(ruler)} in a kendra (the ${ordinal(f.house(ruler))})${kendra.length > 1 ? ', strongest of those there' : ''} (6.4).` }
    : { value: f.lagnaInfo.direction, working: `No planet in a kendra, so from the lagna sign ${signName(f.lagna)} (6.4).` }
  const steps = Math.abs(f.navamsaIndex - 5)
  const stayed = f.lagnaInfo.mobility === 'fixed' || SIGN_TABLE[f.navamsaSign].mobility === 'fixed' || f.vargottama
  const age = PLANET_AGE[f.lagnaLord]
  return {
    object: { kind: object.kind, working: object.working },
    objectBy16: classBy16(f),
    whoHolds: stayed
      ? { value: 'Someone close to the owner', working: 'A fixed sign, fixed navāṃśa or vargottama is rising, so the item has not left (6.1).' }
      : { value: 'Not shown', working: 'Nothing shows that it stayed nearby: 6.1 does not apply.' },
    where: {
      place: places[f.drekkanaIndex - 1],
      working: `Drekkāṇa ${f.drekkanaIndex} of ${signName(f.lagna)} at ${f.lagnaDegree.toFixed(1)}° (6.2).`,
    },
    direction,
    distance: {
      steps,
      working: `Navāṃśa ${f.navamsaIndex} against the middle (5th): ${steps} ${steps === 1 ? 'step' : 'steps'}, read in proportion to the setting, not as yojanas (6.4).`,
    },
    whenLost: {
      value: f.lagnaInfo.strongBy === 'day' ? 'Daytime' : 'Night',
      working: `${signName(f.lagna)} is strong by ${f.lagnaInfo.strongBy} (6.5).`,
    },
    personAge: {
      value: age ?? 'No age given in the source',
      working: `Lagna lord ${grahaName(f.lagnaLord)}, age signification per Utpala; read loosely (6.5).`,
    },
  }
}

// ─── Verdict ────────────────────────────────────────────────────────────────

/** Strength over count: only the summed weights matter. Mixed counts half to each side (1.4). */
export function synthesiseVerdict(fired: Pick<FiredRule, 'polarity' | 'weight'>[]): {
  verdict: SatpanchasikaVerdict
  clarity: number
  weights: SatpanchasikaReading['weights']
} {
  const sum = (p: RulePolarity) => fired.filter(r => r.polarity === p).reduce((a, r) => a + r.weight, 0)
  const weights = {
    favourable: sum('favourable'),
    unfavourable: sum('unfavourable'),
    mixed: sum('mixed'),
    noChange: sum('no_change'),
  }
  const fav = weights.favourable + weights.mixed / 2
  const unf = weights.unfavourable + weights.mixed / 2
  const total = fav + unf
  if (total === 0 && weights.noChange === 0) return { verdict: 'insufficient', clarity: 0, weights }
  // 2.1: a fixed lagna means no change, not good. It holds unless one side clearly outweighs it.
  if (weights.noChange > 0 && Math.abs(fav - unf) < weights.noChange * 1.5) {
    return { verdict: 'no_change', clarity: Math.round((weights.noChange / (weights.noChange + total)) * 100), weights }
  }
  const score = fav / total
  const clarity = Math.round(Math.abs(score - 0.5) * 200)
  if (score >= 0.75) return { verdict: 'favourable', clarity, weights }
  if (score >= 0.45) return { verdict: 'with_difficulty', clarity, weights }
  if (score >= 0.25) return { verdict: 'leans_unfavourable', clarity, weights }
  return { verdict: 'unfavourable', clarity, weights }
}

/** Questions answered by a detail, not by weighing rules. */
function detailHeadline(id: SatpanchasikaQuestion, subject: SubjectResult, lost: LostItemDetails | null, timingCount: number): string | null {
  switch (id) {
    case 'whom': return `It concerns ${subject.concerns}`
    case 'object_class': return subject.classBy17
    case 'person_age': return subject.personAge ?? 'No planet on the lagna gives an age'
    case 'lost_who': return lost?.whoHolds.value === 'Not shown' ? '6.1 does not show who took it' : (lost?.whoHolds.value ?? null)
    case 'lost_where': return lost ? `${lost.where.place}, towards the ${lost.direction.value}` : null
    case 'traveller_when':
    case 'opponent_when': return `${timingCount} timing ${timingCount === 1 ? 'method' : 'methods'} below, kept separate`
    default: return null
  }
}

function headlineFor(meta: QuestionMeta, verdict: SatpanchasikaVerdict, fired: FiredRule[]): string {
  if (meta.indicationOnly) {
    return fired.length ? 'Classical indications listed below, no verdict given' : (meta.noSignal ?? 'Details below')
  }
  switch (verdict) {
    case 'favourable': return meta.answers.yes
    case 'with_difficulty': return meta.answers.hard
    case 'leans_unfavourable': return meta.answers.lean
    case 'unfavourable': return meta.answers.no
    case 'no_change': return meta.answers.still
    default: return meta.noSignal ?? 'Too few signals to read'
  }
}

function flipPolarity(p: RulePolarity): RulePolarity {
  return p === 'favourable' ? 'unfavourable' : p === 'unfavourable' ? 'favourable' : p
}

function fireRule(rule: RuleDef, f: ChartFacts, ctx: RuleContext, role: ContestRole): FiredRule | null {
  const outcome = rule.evaluate(f, ctx)
  if (!outcome) return null
  const planets = outcome.planets ?? []
  const strengthFactor = planets.length
    ? planets.reduce((a, id) => a + f.strengthFactor(id), 0) / planets.length
    : 1
  const repeated = rule.repeated === true
  const weight = rule.baseWeight * strengthFactor * (repeated ? REPEATED_MULTIPLIER : 1)
  return {
    ruleId: rule.id,
    slokaId: rule.sloka,
    label: rule.label,
    statement: outcome.statement,
    facts: outcome.facts,
    polarity: rule.sideRelative && role === 'challenger' ? flipPolarity(outcome.polarity) : outcome.polarity,
    step: rule.step,
    baseWeight: rule.baseWeight,
    strengthFactor: Math.round(strengthFactor * 100) / 100,
    repeated,
    weight: Math.round(weight * 100) / 100,
  }
}

// ─── Coverage of all 56 ślokas ──────────────────────────────────────────────

const LOST_DETAIL_QUESTIONS: SatpanchasikaQuestion[] = ['lost_item', 'lost_who', 'lost_where']
const SUBJECT_SLOKAS = ['1.6', '1.7', '7.6', '7.7', '7.8']
const DETAIL_SLOKAS = ['6.2', '6.4', '6.5']
const TIMING_SLOKAS: Record<string, TimingResult['id']> = {
  '2.14': 'strongest_planet', '2.15': 'strongest_planet', '2.16': 'seventh_lord_retro',
  '2.17': 'lagna_to_moon', '5.5': 'first_occupied',
}

function buildSlokaStatus(
  question: SatpanchasikaQuestion,
  fired: FiredRule[],
  notEvaluated: NotEvaluatedRule[],
): Record<string, SlokaStatus> {
  const status: Record<string, SlokaStatus> = {}
  const timingIds = TIMING_BY_QUESTION[question] ?? []
  for (const { id } of SATPANCHASIKA_SLOKAS) {
    if (id === '1.1') status[id] = 'invocation'
    else if (fired.some(r => r.slokaId === id)) status[id] = 'fired'
    else if (notEvaluated.some(r => r.slokaId === id)) status[id] = 'not_evaluated'
    else if (SUBJECT_SLOKAS.includes(id)) status[id] = 'subject'
    else if (DETAIL_SLOKAS.includes(id)) status[id] = LOST_DETAIL_QUESTIONS.includes(question) ? 'detail' : 'other_question'
    else if (TIMING_SLOKAS[id]) status[id] = timingIds.includes(TIMING_SLOKAS[id]) ? 'timing' : 'other_question'
    else status[id] = SATPANCHASIKA_RULES.some(r => r.sloka === id && ruleAppliesTo(r, question)) ? 'not_fired' : 'other_question'
  }
  return status
}

function natureReason(f: ChartFacts, id: GrahaId): string {
  if (id === 'Mo') return f.moonWaxing ? 'Waxing' : 'Waning'
  if (id === 'Me') return f.isBenefic('Me') ? 'Not joined with a malefic' : 'Joined with a malefic'
  return 'By nature'
}

function buildPlanetTable(f: ChartFacts): PlanetRow[] {
  return SEVEN_GRAHAS.map(id => ({
    id,
    name: grahaName(id),
    house: f.house(id),
    sign: signName(f.grahas[id].rashi),
    navamsa: signName(f.navamsaOf(id)),
    nature: f.isBenefic(id) ? 'Benefic' as const : 'Malefic' as const,
    natureReason: natureReason(f, id),
    strength: Math.round(f.strengthFactor(id) * 100) / 100,
    isStrong: f.isStrong(id),
    retrograde: f.grahas[id].isRetro,
    isStrongest: id === f.strongest,
  }))
}

// ─── Pipeline ───────────────────────────────────────────────────────────────

const STEP_TITLES: Record<number, string> = {
  3: 'Lagna type', 4: 'Benefics and malefics by house', 5: 'The Moon', 6: 'Chapter rules for this question',
}
const STEP_SLOKAS: Record<number, string> = { 3: '1.4, 2.1, 2.2', 4: '1.3, 4.1 to 4.3', 5: '1.5, 2.6 to 2.8, 4.4, 4.5', 6: 'By question' }

function buildTimingCaveat(question: SatpanchasikaQuestion, verdict: SatpanchasikaVerdict, adapted: boolean): string | null {
  const parts: string[] = []
  if (['unfavourable', 'leans_unfavourable', 'no_change', 'insufficient'].includes(verdict)) {
    parts.push('This reading does not favour the event, so treat the timing as "if it happens at all".')
  }
  if (adapted) parts.push('The text gives no timing for this question, so this is adapted by analogy and is less reliable.')
  if (question === 'patient') parts.push('Not a medical timeline.')
  return parts.length ? parts.join(' ') : null
}

export function runSatpanchasika(chart: SatpanchasikaChartInput, options: SatpanchasikaOptions): SatpanchasikaReading {
  const f = buildChartFacts(chart)
  const meta = SATPANCHASIKA_QUESTIONS.find(q => q.id === options.question)
  if (!meta) throw new Error(`Unknown Satpanchasika question: ${options.question}`)
  const role = options.contestRole ?? 'defender'
  const judgedHouse = meta.id === 'any_house' && options.house && options.house >= 1 && options.house <= 12
    ? options.house
    : meta.judgedHouse
  const ctx: RuleContext = { question: meta.id, judgedHouse, season: options.season }

  const fired: FiredRule[] = []
  const notEvaluated: NotEvaluatedRule[] = []
  let notFiredCount = 0
  for (const rule of SATPANCHASIKA_RULES) {
    if (!ruleAppliesTo(rule, meta.id)) continue
    const reason = rule.notEvaluated?.(ctx)
    if (reason) {
      notEvaluated.push({ ruleId: rule.id, slokaId: rule.sloka, label: rule.label, reason })
      continue
    }
    const hit = fireRule(rule, f, ctx, role)
    if (hit) fired.push(hit)
    else notFiredCount++
  }
  if (LOST_DETAIL_QUESTIONS.includes(meta.id)) {
    notEvaluated.push(
      { ruleId: '6.5-appearance', slokaId: '6.5', label: 'Drekkāṇa to the person\'s appearance', reason: `Drekkāṇa ${f.drekkanaIndex} is known, but the text gives no table linking drekkāṇas to appearance.` },
      { ruleId: '6.5-place', slokaId: '6.5', label: 'Rising sign to the kind of place', reason: 'The text says the sign shows the place, but gives no table of places.' },
      { ruleId: '6.5-class', slokaId: '6.5', label: 'Lagna lord to the person\'s class', reason: 'Dated social category: kept in the śloka reference and not generated. Only the age signification is used.' },
    )
  }
  fired.sort((a, b) => b.weight - a.weight)

  const indicationOnly = meta.indicationOnly === true
  const synthesis = synthesiseVerdict(fired)
  const verdict: SatpanchasikaVerdict = indicationOnly ? 'indication_only' : synthesis.verdict
  const subject = buildSubject(f)
  const timingIds = TIMING_BY_QUESTION[meta.id] ?? []
  const adaptedIds = ADAPTED_TIMING[meta.id] ?? []
  const timing: TimingResult[] = [
    ...timingIds.map(id => TIMING_FNS[id](f)),
    ...adaptedIds.map(id => {
      const t = TIMING_FNS[id](f)
      return { ...t, basis: 'adapted' as const, purpose: `Adapted for this question: the text gives this for "${t.purpose}"` }
    }),
  ]
  const paceNotes = [...new Set(fired.filter(r => r.polarity === 'favourable' || meta.id === 'opponent').map(r => QUICK_RULES[r.ruleId]).filter(Boolean))]
  const lostItem = LOST_DETAIL_QUESTIONS.includes(meta.id) ? buildLostItem(f) : null

  const retro = SEVEN_GRAHAS.filter(id => f.grahas[id].isRetro)
  const countFor = (step: number) => fired.filter(r => r.step === step)
  const steps: MethodStep[] = [
    {
      step: 1, title: 'The moment of the question', slokas: 'Method',
      summary: `${signName(f.lagna)} ${f.lagnaDegree.toFixed(1)}° rising, drekkāṇa ${f.drekkanaIndex}, navāṃśa ${f.navamsaIndex} (${signName(f.navamsaSign)}). Moon in ${signName(f.grahas.Mo.rashi)}, ${f.moonWaxing ? 'waxing' : 'waning'}${f.moonFull ? ' and full' : ''}. Retrograde: ${retro.length ? listNames(retro) : 'none'}.`,
    },
    {
      step: 2, title: 'Identify the subject', slokas: '1.6, 1.7, 7.7, 7.8',
      summary: `${subject.concernsWorking} It concerns ${subject.concerns}. The rising navāṃśa gives ${subject.classBy17}.`,
    },
    ...[3, 4, 5, 6].map(step => {
      const list = countFor(step)
      return {
        step, title: STEP_TITLES[step], slokas: STEP_SLOKAS[step],
        summary: list.length
          ? list.map(r => `${r.slokaId}: ${r.statement}`).join(' ')
          : 'No rule from this step fired.',
      }
    }),
    {
      step: 7, title: 'Timing', slokas: '2.14 to 2.17, 5.5',
      summary: timing.length ? `${timing.length} method${timing.length > 1 ? 's' : ''} apply, each kept separate.` : 'No event to time for this question.',
    },
    {
      step: 8, title: 'Details for lost items', slokas: '6.2, 6.4, 6.5',
      summary: lostItem ? `${lostItem.object.kind}. ${lostItem.where.place}, towards the ${lostItem.direction.value}.` : 'Not applicable to this question.',
    },
  ]

  const notice = QUESTION_NOTICE[meta.id]
  return {
    question: meta.id,
    questionLabel: meta.label,
    verdict,
    headline: detailHeadline(meta.id, subject, lostItem, timing.length) ?? headlineFor(meta, verdict, fired),
    clarity: indicationOnly ? 0 : synthesis.clarity,
    weights: synthesis.weights,
    fired,
    notEvaluated,
    notFiredCount,
    slokaStatus: buildSlokaStatus(meta.id, fired, notEvaluated),
    timing,
    timingNote: timing.length ? null : 'This question asks who or what, not when, so there is no event to time.',
    timingCaveat: buildTimingCaveat(meta.id, verdict, adaptedIds.length > 0),
    paceNotes,
    lostItem,
    subject,
    steps,
    planets: buildPlanetTable(f),
    strengthSource: f.strengthSource,
    notices: [SATPANCHASIKA_STUDY_NOTE, ...(notice ? [notice] : [])],
  }
}
