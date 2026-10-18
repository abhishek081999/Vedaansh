// ─────────────────────────────────────────────────────────────
//  src/lib/engine/lagnaSpirituality.ts
//  Lagna as spiritual lens — element tattva & per-sign consciousness
//  Teaching reference only — not medical, legal, or death prediction
// ─────────────────────────────────────────────────────────────

import type { Rashi } from '@/types/astrology'
import { RASHI_NAMES, RASHI_SANSKRIT } from '@/types/astrology'

export type LagnaElementId = 'fire' | 'earth' | 'air' | 'water'

export interface LagnaElementProfile {
  id: LagnaElementId
  name: string
  sanskrit: string
  signs: Rashi[]
  birthConsciousness: string
  spiritualPath: string
  understandingMethod: string
  challenge: string
  liberationPath: string
  liberationSanskrit: string
  /** Traditional teaching metaphor for exit awareness — not a prediction. */
  exitPattern: string
  fearPattern: string
}

export interface LagnaSpiritualProfile {
  rashi: Rashi
  name: string
  sanskrit: string
  elementId: LagnaElementId
  primaryConsciousness: string
  subconsciousEnergy: string
  invisibleFear: string
  egoType: string
  purpose: string
  lifePattern: string
  whatBreaksPattern: string
}

export interface LagnaSpiritualPrinciple {
  id: string
  title: string
  body: string
}

export const LAGNA_SPIRITUALITY_NOTE =
  'Lagna is the lens of consciousness through which the soul experiences karma — ' +
  'spiritual direction (not method), ego form, and the pattern that sadhana must address. ' +
  'Teaching reference only; not medical, legal, or lifespan advice.'

/** Sign → element (Agni / Prithvi / Vayu / Jal cycle). */
export const RASHI_TO_LAGNA_ELEMENT: Record<Rashi, LagnaElementId> = {
  1: 'fire',
  2: 'earth',
  3: 'air',
  4: 'water',
  5: 'fire',
  6: 'earth',
  7: 'air',
  8: 'water',
  9: 'fire',
  10: 'earth',
  11: 'air',
  12: 'water',
}

export const LAGNA_ELEMENTS: Record<LagnaElementId, LagnaElementProfile> = {
  fire: {
    id: 'fire',
    name: 'Fire',
    sanskrit: 'Agni Tattva',
    signs: [1, 5, 9],
    birthConsciousness: 'Struggle / action consciousness — incomplete action from the past; need to act now',
    spiritualPath: 'Tapasya, yoga, discipline, tantra, aghora-leaning practices',
    understandingMethod: 'By doing — action first',
    challenge: 'Impatience and aggression',
    liberationPath: 'Stillness / pause; renunciation of compulsive duty-drive',
    liberationSanskrit: 'ठहराव · Tyāga of restless action',
    exitPattern: 'Action-oriented awareness until the end; often senses transition approaching',
    fearPattern: 'Ceasing to exist if they stop moving',
  },
  earth: {
    id: 'earth',
    name: 'Earth',
    sanskrit: 'Prithvi Tattva',
    signs: [2, 6, 10],
    birthConsciousness: 'Responsibility / memory consciousness — duty-bound birth; task-list mentality',
    spiritualPath: 'Seva (service), stable practice, body purification first',
    understandingMethod: 'By creating / building',
    challenge: 'Carrying burdens and unfinished-task memory',
    liberationPath: 'Renunciation (tyāga) — releasing the burden of completion',
    liberationSanskrit: 'त्याग (Tyāga)',
    exitPattern: 'Duty-oriented awareness; body and responsibility themes',
    fearPattern: 'Change or instability destroying them',
  },
  air: {
    id: 'air',
    name: 'Air',
    sanskrit: 'Vayu Tattva',
    signs: [3, 7, 11],
    birthConsciousness: 'Observation / split consciousness — half inside, half outside; did not fully want to descend',
    spiritualPath: 'Jñāna (knowledge), detachment, unconventional methods',
    understandingMethod: 'By comprehending intellectually',
    challenge: 'Avoiding deep immersion; remaining half-in / half-out',
    liberationPath: 'Silence (maun) and acceptance',
    liberationSanskrit: 'मौन (Maun)',
    exitPattern: 'Acceptance and silence; can be sudden yet inwardly peaceful',
    fearPattern: 'Ignorance / not understanding, or losing identity if deeply connected',
  },
  water: {
    id: 'water',
    name: 'Water',
    sanskrit: 'Jal Tattva',
    signs: [4, 8, 12],
    birthConsciousness: 'Emotional / memory immersion — nostalgia and unfinished feeling',
    spiritualPath: 'Bhakti (devotion), compassion, surrender',
    understandingMethod: 'By feeling',
    challenge: 'Emotional overwhelm, nostalgia, sense of loss',
    liberationPath: 'Witnessing everything (sākṣī bhāv)',
    liberationSanskrit: 'साक्षी भाव (Sākṣī Bhāv)',
    exitPattern: 'Emotional acceptance and surrender consciousness',
    fearPattern: 'Emotional breakdown or forgetting who they are',
  },
}

const LAGNA_PROFILES: Record<Rashi, Omit<LagnaSpiritualProfile, 'name' | 'sanskrit'>> = {
  1: {
    rashi: 1,
    elementId: 'fire',
    primaryConsciousness: '"I AM" — self-existence',
    subconsciousEnergy: 'Always in battle / conflict',
    invisibleFear: 'If I stop, I cease to exist',
    egoType: 'Existential ego',
    purpose: 'Awakening self-consciousness',
    lifePattern: 'Action before peace; constant movement',
    whatBreaksPattern: 'Stillness; accepting pause',
  },
  2: {
    rashi: 2,
    elementId: 'earth',
    primaryConsciousness: '"I need to stay grounded"',
    subconsciousEnergy: 'Must remain stable',
    invisibleFear: 'Change will destroy me',
    egoType: 'Stability ego',
    purpose: 'Creating security',
    lifePattern: 'Building, accumulating, holding',
    whatBreaksPattern: 'Letting go; accepting impermanence',
  },
  3: {
    rashi: 3,
    elementId: 'air',
    primaryConsciousness: '"I must understand everything"',
    subconsciousEnergy: 'Split awareness; observing',
    invisibleFear: 'Ignorance will make me lost',
    egoType: 'Intellectual ego',
    purpose: 'Understanding through analysis',
    lifePattern: 'Multiple paths; surface exploration',
    whatBreaksPattern: 'Deep silence; choosing one path',
  },
  4: {
    rashi: 4,
    elementId: 'water',
    primaryConsciousness: '"I must protect / nurture"',
    subconsciousEnergy: 'Maternal memory; saving instinct',
    invisibleFear: 'Feeling deeply will break me',
    egoType: 'Protective ego',
    purpose: 'Emotional security',
    lifePattern: 'Building shields; protecting',
    whatBreaksPattern: 'Witnessing without absorbing',
  },
  5: {
    rashi: 5,
    elementId: 'fire',
    primaryConsciousness: '"I must be seen / recognized"',
    subconsciousEnergy: 'Self-recognition seeking',
    invisibleFear: 'Being nothing if not seen',
    egoType: 'Divine / representative ego',
    purpose: 'Self-expression and representation',
    lifePattern: 'Constant visibility seeking',
    whatBreaksPattern: 'Humility, groundedness, kindness',
  },
  6: {
    rashi: 6,
    elementId: 'earth',
    primaryConsciousness: '"Something is wrong — must fix"',
    subconsciousEnergy: 'Corrective consciousness',
    invisibleFear: 'Disorder will destroy everything',
    egoType: 'Perfection ego',
    purpose: 'Purification and service',
    lifePattern: 'Endless correction and analysis',
    whatBreaksPattern: 'Acceptance of imperfection',
  },
  7: {
    rashi: 7,
    elementId: 'air',
    primaryConsciousness: '"I must balance / harmonize"',
    subconsciousEnergy: 'Mirror consciousness; seeking equilibrium',
    invisibleFear: 'Imbalance equals being alone',
    egoType: 'Balancing ego',
    purpose: 'Finding / creating balance',
    lifePattern: 'Constant adjustment; avoiding decisions',
    whatBreaksPattern: 'Making clear decisions; accepting imbalance',
  },
  8: {
    rashi: 8,
    elementId: 'water',
    primaryConsciousness: '"I have died before"',
    subconsciousEnergy: 'Death–rebirth threshold',
    invisibleFear: 'Going too deep — will not return',
    egoType: 'Transformational ego',
    purpose: 'Deep diving into consciousness',
    lifePattern: 'Intense transformation and crisis',
    whatBreaksPattern: 'Trusting the depth; surrender to change',
  },
  9: {
    rashi: 9,
    elementId: 'fire',
    primaryConsciousness: '"I need meaning / purpose"',
    subconsciousEnergy: 'Constant seeking',
    invisibleFear: 'Meaninglessness equals death',
    egoType: 'Seeker ego',
    purpose: 'Finding truth and higher meaning',
    lifePattern: 'Restless quest and exploration',
    whatBreaksPattern: 'Finding meaning in the ordinary',
  },
  10: {
    rashi: 10,
    elementId: 'earth',
    primaryConsciousness: '"I must complete / achieve"',
    subconsciousEnergy: 'Unfinished duty consciousness',
    invisibleFear: 'Failure equals worthlessness',
    egoType: 'Duty / responsibility ego',
    purpose: 'Completing responsibilities',
    lifePattern: 'Task-driven; achievement focus',
    whatBreaksPattern: 'Accepting incompletion',
  },
  11: {
    rashi: 11,
    elementId: 'air',
    primaryConsciousness: '"I am different / separate"',
    subconsciousEnergy: 'Outsider consciousness',
    invisibleFear: 'Connecting means losing self',
    egoType: 'Detached ego',
    purpose: 'Maintaining uniqueness',
    lifePattern: 'Alone in a crowd; revolutionary lean',
    whatBreaksPattern: 'Connection without losing identity',
  },
  12: {
    rashi: 12,
    elementId: 'water',
    primaryConsciousness: '"I didn\'t want to return"',
    subconsciousEnergy: 'Resistance to incarnation',
    invisibleFear: 'Fully arriving means forgetting the source',
    egoType: 'Dissolution ego',
    purpose: 'Return to source',
    lifePattern: 'Escapism; transcendence seeking',
    whatBreaksPattern: 'Full embodiment; being present',
  },
}

export const LAGNA_SPIRITUAL_PRINCIPLES: LagnaSpiritualPrinciple[] = [
  {
    id: 'lens',
    title: 'Lagna is a lens, not the soul',
    body:
      'Lagna is not the soul’s nature and is not automatically good or bad by house placement. ' +
      'It is the mask, fatigue pattern, and code of how karma is experienced — spiritual direction, not method.',
  },
  {
    id: 'comfort',
    title: 'Comfort zone is the obstacle',
    body:
      'What feels easy for the lagna element often creates the biggest spiritual obstacle: ' +
      'fire must learn stillness, earth renunciation, air silence, water witnessing without drowning.',
  },
  {
    id: 'fear',
    title: 'Invisible fear is the gateway',
    body:
      'Each lagna carries a subconscious fear from birth that is often unrecognized. ' +
      'Traditional teaching holds that befriending this fear — not fighting it — opens the path of liberation. ' +
      'Sadhana should address the lagna-specific fear.',
  },
  {
    id: 'cycle',
    title: 'Pattern vs form across lives',
    body:
      'Forms and roles change across lifetimes; energy patterns repeat. ' +
      'Awareness dissolves karma: recognize the pattern, accept the fear, practice the element-appropriate medicine, ' +
      'and meet smaller life “deaths” (ego losses) consciously.',
  },
  {
    id: 'order',
    title: 'Reading order for spiritual context',
    body:
      'First weigh blessings (9th house and its condition), then lagna element and fear pattern, ' +
      'then planetary form. Dharma trikona teaching also pairs D1–D9–D20 for outer life, inner self, and spiritual evolution.',
  },
  {
    id: 'bhakti',
    title: 'Bhakti can transcend the chart',
    body:
      'Genuine devotion may lift the native above ordinary planetary and nakṣatra rules — ' +
      'life manifestation can diverge from textbook phalita. Ritual alone is not enough; surrender transforms meaning.',
  },
  {
    id: 'ninth',
    title: 'Blessings live in the 9th',
    body:
      'Every chart has grace somewhere; the 9th shows level and frequency of blessings. ' +
      'Even Saturn, Rahu, or Ketu there can indicate spiritual power when the full chart supports it.',
  },
]

const ELEMENT_ORDER: LagnaElementId[] = ['fire', 'earth', 'air', 'water']
const RASHI_ORDER: Rashi[] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]

function withNames(
  base: Omit<LagnaSpiritualProfile, 'name' | 'sanskrit'>,
): LagnaSpiritualProfile {
  return {
    ...base,
    name: RASHI_NAMES[base.rashi],
    sanskrit: RASHI_SANSKRIT[base.rashi],
  }
}

export function getLagnaElement(rashi: Rashi): LagnaElementProfile {
  return LAGNA_ELEMENTS[RASHI_TO_LAGNA_ELEMENT[rashi]]
}

export function getLagnaSpiritualProfile(rashi: Rashi): LagnaSpiritualProfile {
  return withNames(LAGNA_PROFILES[rashi])
}

export function getLagnaElementRows(): LagnaElementProfile[] {
  return ELEMENT_ORDER.map((id) => LAGNA_ELEMENTS[id])
}

export function getLagnaSpiritualRows(): LagnaSpiritualProfile[] {
  return RASHI_ORDER.map((r) => withNames(LAGNA_PROFILES[r]))
}

export interface ChartLagnaSpirituality {
  lagna: LagnaSpiritualProfile
  element: LagnaElementProfile
  principles: LagnaSpiritualPrinciple[]
  note: string
}

/** Chart-personalized spiritual lagna snapshot for UI. */
export function getChartLagnaSpirituality(ascRashi: Rashi): ChartLagnaSpirituality {
  return {
    lagna: getLagnaSpiritualProfile(ascRashi),
    element: getLagnaElement(ascRashi),
    principles: LAGNA_SPIRITUAL_PRINCIPLES,
    note: LAGNA_SPIRITUALITY_NOTE,
  }
}
