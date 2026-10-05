// ─────────────────────────────────────────────────────────────
//  src/lib/engine/karanaMeta.ts
//  Classical karana characteristics (7 movable + 4 fixed).
//  Name lookup accepts engine spellings and common variants.
// ─────────────────────────────────────────────────────────────

export type KaranaType = 'movable' | 'fixed'

export type KaranaId =
  | 'Bava'
  | 'Balava'
  | 'Kaulava'
  | 'Taitila'
  | 'Garija'
  | 'Vanija'
  | 'Vishti'
  | 'Shakuni'
  | 'Chatushpada'
  | 'Naga'
  | 'Kimstughna'

export interface KaranaMeta {
  id:            KaranaId
  /** Display name used in the engine (`getKarana`) */
  name:          string
  type:          KaranaType
  /** Char (movable) / Sthir (fixed) label for UI */
  typeLabel:     'Char' | 'Sthir'
  meaning:       string
  deity:         string
  nature:        string
  positiveTraits: string
  challenge:     string
  career:        string
  remedy:        string
  /** Vishti / Bhadra — classical caution for lasting acts */
  isBhadra:      boolean
  /** Compact cosmic-weather guidance for today’s karana */
  dayGuidance:   string
}

const KARANAS: Record<KaranaId, KaranaMeta> = {
  Bava: {
    id: 'Bava',
    name: 'Bava',
    type: 'movable',
    typeLabel: 'Char',
    meaning: 'Flowing water',
    deity: 'Indra',
    nature: 'Always seeking new ways to do tasks',
    positiveTraits: 'Creative, innovative, adapts quickly, craft-oriented',
    challenge: 'Too frequent change leading to instability',
    career: 'Creative fields, innovation, craft, R&D, varied consulting',
    remedy: 'Channel “flow” (fountain / aquarium); check Moon & Ketu before water remedies',
    isBhadra: false,
    dayGuidance: 'Favour creative problem-solving and fresh approaches; avoid forcing rigid routines.',
  },
  Balava: {
    id: 'Balava',
    name: 'Balava',
    type: 'movable',
    typeLabel: 'Char',
    meaning: 'Hair / group of children',
    deity: 'Brahma',
    nature: 'Natural connection with children; playful energy',
    positiveTraits: 'Good with children, enthusiastic, playful, inventive gifting',
    challenge: 'Impulsive or childish decision-making',
    career: 'Children’s products, education, pediatrics, animation, hair-related work',
    remedy: 'Mor pankh (peacock feather); prefer children-related constructive outlets',
    isBhadra: false,
    dayGuidance: 'Good for playful creativity and teaching; pause before impulsive choices.',
  },
  Kaulava: {
    id: 'Kaulava',
    name: 'Kaulava',
    type: 'movable',
    typeLabel: 'Char',
    meaning: 'Infamy / bad reputation (badnaami)',
    deity: 'Surya',
    nature: 'Prone to being misunderstood despite good intent',
    positiveTraits: 'Kind, down-to-earth, genuine, loyal once trusted',
    challenge: 'Wrong first impressions and leaked secrets',
    career: 'Roles where actions outweigh perception; careful networking',
    remedy: 'Choose friends carefully; guard secrets; Surya Namaskar / sun worship',
    isBhadra: false,
    dayGuidance: 'Lead with clear, visible integrity; delay sensitive disclosures.',
  },
  Taitila: {
    id: 'Taitila',
    name: 'Taitila',
    type: 'movable',
    typeLabel: 'Char',
    meaning: 'Knot / ulcer / abscess (gaanth)',
    deity: 'Surya',
    nature: 'Strategic planner with a tendency to exaggerate',
    positiveTraits: 'Excellent strategist, SOPs, policy and consulting skill',
    challenge: 'Over-sharing confidential details while self-promoting',
    career: 'Strategic planning, consulting, project / policy management',
    remedy: 'Controlled speech; keep achievements quieter; Surya upasana',
    isBhadra: false,
    dayGuidance: 'Plan and structure well; keep sensitive details private.',
  },
  Garija: {
    id: 'Garija',
    name: 'Garija',
    type: 'movable',
    typeLabel: 'Char',
    meaning: 'Poison / spicy / sharp (vish, teekha)',
    deity: 'Prithvi',
    nature: 'Intensity; affinity with chemicals and precision work',
    positiveTraits: 'Technical expertise, scientific mindset, precision',
    challenge: 'Addiction risk and fear of competition',
    career: 'Medical, pharma, chemicals, perfume, gems, research labs',
    remedy: 'Avoid addictive substances; grounding / Prithvi practices; build competitive confidence',
    isBhadra: false,
    dayGuidance: 'Use precision and focus; stay clear of excess stimulants or rivalry spirals.',
  },
  Vanija: {
    id: 'Vanija',
    name: 'Vanija',
    type: 'movable',
    typeLabel: 'Char',
    meaning: 'Business / trade',
    deity: 'Lakshmi',
    nature: 'Business and expansion mindset by default',
    positiveTraits: 'Natural business acumen, growth and revenue focus',
    challenge: 'Profit over relationships; workaholic tilt',
    career: 'Business ownership, sales, BD, expansion / new verticals',
    remedy: 'Lakshmi puja; charitable giving; ethics-first deals',
    isBhadra: false,
    dayGuidance: 'Favour trade, negotiation, and growth moves — balance profit with fairness.',
  },
  Vishti: {
    id: 'Vishti',
    name: 'Vishti',
    type: 'movable',
    typeLabel: 'Char',
    meaning: 'Weight / labour (majdoori)',
    deity: 'Yamaraj',
    nature: 'Always burdened with work; Bhadra karana',
    positiveTraits: 'Delegation, surveillance, detail, multitasking',
    challenge: 'Overwork, micromanagement, interfering in others’ tasks',
    career: 'Management, supervision, roles that attract extra load',
    remedy: 'Delegate without micromanaging; trust others; seva / charity',
    isBhadra: true,
    dayGuidance: 'Classical caution (Bhadra): avoid lasting foundations; clear backlog without controlling others.',
  },
  Shakuni: {
    id: 'Shakuni',
    name: 'Shakuni',
    type: 'fixed',
    typeLabel: 'Sthir',
    meaning: 'Bird (pakshi)',
    deity: 'Kali',
    nature: 'Sky-high aspirations; easily misunderstands others',
    positiveTraits: 'Unlimited imagination, creative excellence, high success potential',
    challenge: 'Impatience, trivial fights, assuming harm where none exists',
    career: 'Painting, writing, theatre, film, creative arts',
    remedy: 'Build trust slowly; question negative assumptions; Kali worship; patience practice',
    isBhadra: false,
    dayGuidance: 'Channel vision creatively; pause before assuming hostility.',
  },
  Chatushpada: {
    id: 'Chatushpada',
    name: 'Chatushpada',
    type: 'fixed',
    typeLabel: 'Sthir',
    meaning: 'Four-legged animal (chaupaya)',
    deity: 'Rakshas gana',
    nature: 'Practical survival focus; emotional bluntness',
    positiveTraits: 'Practical, direct, strong survival instincts, good with animals',
    challenge: 'Self-centredness; relationship neglect harms career',
    career: 'Transport, breeding, veterinary, railway / vehicle operations',
    remedy: 'Actively respect key relationships; seven running horses symbolism at work',
    isBhadra: false,
    dayGuidance: 'Stay practical; invest deliberately in relationships alongside work.',
  },
  Naga: {
    id: 'Naga',
    name: 'Naga',
    type: 'fixed',
    typeLabel: 'Sthir',
    meaning: 'Snake / reptile',
    deity: 'Sarpa',
    nature: 'Reactive, protective, revenge-sensitive',
    positiveTraits: 'Quick reflexes, alert, protective, deep knowledge',
    challenge: 'Immediate retaliation; provocation and gossip trigger reaction',
    career: 'Paint / coatings, reptile care, toxicology, venom research',
    remedy: 'Regular Shiva puja; Nag Panchami observance; cooling practices',
    isBhadra: false,
    dayGuidance: 'Stay alert but delay reaction; verify gossip before responding.',
  },
  Kimstughna: {
    id: 'Kimstughna',
    name: 'Kimstughna',
    type: 'fixed',
    typeLabel: 'Sthir',
    meaning: 'Promise-breaker / unreliable (paltu)',
    deity: 'Vayu',
    nature: 'Flexible but struggles to keep commitments',
    positiveTraits: 'Adaptable, flexible, good at getting work done',
    challenge: 'Broken promises and self-created trust deficit',
    career: 'Appears across industries; especially marketing-style charm roles',
    remedy: 'Internal change only — keep word, honour help received, fulfil commitments',
    isBhadra: false,
    dayGuidance: 'Under-promise and deliver; one kept commitment outweighs many ideas.',
  },
}

/** Normalize engine / vernacular spellings to canonical KaranaId. */
const ALIASES: Record<string, KaranaId> = {
  bava: 'Bava',
  balava: 'Balava',
  kaulava: 'Kaulava',
  taitila: 'Taitila',
  taitil: 'Taitila',
  taitula: 'Taitila',
  garija: 'Garija',
  gara: 'Garija',
  vanija: 'Vanija',
  vanij: 'Vanija',
  vishti: 'Vishti',
  bhadra: 'Vishti',
  shakuni: 'Shakuni',
  chatushpada: 'Chatushpada',
  chatushpad: 'Chatushpada',
  chatuhspada: 'Chatushpada',
  naga: 'Naga',
  nagava: 'Naga',
  kimstughna: 'Kimstughna',
  kishtughna: 'Kimstughna',
  kinstughna: 'Kimstughna',
}

export function normalizeKaranaName(name: string): KaranaId | null {
  const key = name.trim().toLowerCase().replace(/[^a-z]/g, '')
  return ALIASES[key] ?? null
}

export function getKaranaMeta(name: string): KaranaMeta | null {
  const id = normalizeKaranaName(name)
  return id ? KARANAS[id] : null
}

export function formatKaranaWeatherLine(meta: KaranaMeta): string {
  const caution = meta.isBhadra ? 'Bhadra · ' : ''
  return `${caution}${meta.typeLabel} · ${meta.meaning} · Deity ${meta.deity} — ${meta.dayGuidance}`
}

export function listKaranaMeta(): KaranaMeta[] {
  return [
    KARANAS.Bava,
    KARANAS.Balava,
    KARANAS.Kaulava,
    KARANAS.Taitila,
    KARANAS.Garija,
    KARANAS.Vanija,
    KARANAS.Vishti,
    KARANAS.Shakuni,
    KARANAS.Chatushpada,
    KARANAS.Naga,
    KARANAS.Kimstughna,
  ]
}
