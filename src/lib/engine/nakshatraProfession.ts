// ─────────────────────────────────────────────────────────────
//  src/lib/engine/nakshatraProfession.ts
//  Profession / career profiles for all 27 nakshatras, plus
//  functional groupings, gana career implications, pada styles,
//  and chart-aware career indicator helpers.
// ─────────────────────────────────────────────────────────────

import type { ChartOutput, GrahaId, Rashi } from '@/types/astrology'
import { GRAHA_NAMES, NAKSHATRA_NAMES, RASHI_NAMES } from '@/types/astrology'

export type CareerGana = 'Deva' | 'Manushya' | 'Rakshasa'
export type CareerPriority = 'PRIMARY' | 'SECONDARY' | 'TERTIARY'

export interface NakshatraProfessionProfile {
  index: number
  name: string
  lord: GrahaId
  signs: string
  gana: CareerGana
  coreMeaning: string
  workingStyle: string
  hiddenPower: string
  careerFields: string[]
  bottomLine: string
  pitfall: string
}

export interface ProfessionFunctionalGroup {
  id: string
  label: string
  nakshatraIndices: number[]
  coreFunction: string
  bestEnvironments: string
}

export interface GanaCareerInfo {
  gana: CareerGana
  theme: string
  strength: string
  pitfall: string
  pitfallDamage: string
  solution: string
  examples: string[]
}

export interface PadaCareerStyle {
  rashi: Rashi
  energy: string
  executionStyle: string
  exampleProfessions: string
}

export interface PlanetCareerSkill {
  planet: GrahaId
  skill: string
  positive: string
  ifWeak: string
}

export interface PlanetNakshatraCareerCombo {
  planet: GrahaId
  skill: string
  nakshatraIndex: number
  expression: string
  notes: string
}

export interface CareerDiagnosisRow {
  nakshatraIndex: number
  behaviorStyle: string
  careerDirection: string
}

export interface CareerIndicatorResult {
  key: 'tenthLord' | 'moon' | 'rahu'
  label: string
  priority: CareerPriority
  reveals: string
  planetId: GrahaId | null
  planetName: string
  nakshatraIndex: number
  nakshatraName: string
  pada: number
  padaRashi: Rashi
  profile: NakshatraProfessionProfile
}

export interface CareerFormulaResult {
  planetSkill: string
  planetName: string
  nakshatraHow: string
  nakshatraName: string
  houseWhere: string
  padaExecution: string
  padaRashiName: string
  summary: string
}

// ── Sign lords (whole-sign) ───────────────────────────────────

const SIGN_LORD: Record<number, GrahaId> = {
  1: 'Ma', 2: 'Ve', 3: 'Me', 4: 'Mo',
  5: 'Su', 6: 'Me', 7: 'Ve', 8: 'Ma',
  9: 'Ju', 10: 'Sa', 11: 'Sa', 12: 'Ju',
}

/** First pada navamsa rashi index (0=Aries) for each nakshatra 0–26 */
const NAK_PADA1_RASHI0: Record<number, number> = {
  0: 0, 1: 0, 2: 1, 3: 1, 4: 2, 5: 2, 6: 3, 7: 3, 8: 4, 9: 5,
  10: 5, 11: 6, 12: 7, 13: 7, 14: 8, 15: 9, 16: 9, 17: 10, 18: 11, 19: 11,
  20: 0, 21: 1, 22: 2, 23: 2, 24: 3, 25: 4, 26: 4,
}

export function getPadaRashi(nakshatraIndex: number, pada: number): Rashi {
  const base = NAK_PADA1_RASHI0[nakshatraIndex] ?? 0
  const p = Math.min(4, Math.max(1, pada))
  return ((((base + p - 1) % 12) + 12) % 12) + 1 as Rashi
}

function rashiOfHouse(house: number, ascRashi: Rashi): Rashi {
  return ((((ascRashi - 1) + (house - 1)) % 12) + 1) as Rashi
}

// ── 27 Profession profiles ────────────────────────────────────

export const NAKSHATRA_PROFESSIONS: NakshatraProfessionProfile[] = [
  {
    index: 0, name: 'Ashwini', lord: 'Ke', signs: 'Aries', gana: 'Deva',
    coreMeaning: 'Initiation, Beginning',
    workingStyle: 'Fast, Instant Action',
    hiddenPower: 'Speed is Success',
    careerFields: ['Doctor', 'Emergency Medicine', 'Healer', 'Startup Founder', 'Disaster Management'],
    bottomLine: 'First-mover wins; whoever acts fastest succeeds',
    pitfall: 'Over-idealism (Deva)',
  },
  {
    index: 1, name: 'Bharani', lord: 'Ve', signs: 'Aries', gana: 'Manushya',
    coreMeaning: 'Transformation, Control, Endurance',
    workingStyle: 'Works under extreme pressure; holds pain',
    hiddenPower: 'Endurance = Career Strength',
    careerFields: ['Administration', 'Authority roles', 'Corporate', 'Government', 'High-volume Retail', 'Military'],
    bottomLine: 'Working in high-pressure environments is the domain',
    pitfall: 'Greed (Manushya)',
  },
  {
    index: 2, name: 'Krittika', lord: 'Su', signs: 'Aries/Taurus', gana: 'Rakshasa',
    coreMeaning: 'Cutting, Purification, Sharp decisions',
    workingStyle: 'Binary — all or nothing (Aar ya Paar)',
    hiddenPower: 'Separation Creates Clarity',
    careerFields: ['Surgeon', 'Military', 'Analyst', 'Judge'],
    bottomLine: 'Sharp cuts bring clarity; separation is the tool',
    pitfall: 'Control obsession (Rakshasa)',
  },
  {
    index: 3, name: 'Rohini', lord: 'Mo', signs: 'Taurus', gana: 'Manushya',
    coreMeaning: 'Growth, Attraction, Beautification',
    workingStyle: 'Beautifies and builds everything',
    hiddenPower: 'Wealth through Multiplication',
    careerFields: ['Design', 'Luxury goods', 'Finance', 'Hospitality', 'Real estate'],
    bottomLine: 'Creating and multiplying value — the Wealth Nakshatra',
    pitfall: 'Greed (Manushya)',
  },
  {
    index: 4, name: 'Mrigashira', lord: 'Ma', signs: 'Taurus/Gemini', gana: 'Deva',
    coreMeaning: 'Searching, Exploring, Curiosity',
    workingStyle: 'Perpetual exploration; search never ends',
    hiddenPower: 'The Endless Hunt',
    careerFields: ['Research', 'Marketing', 'Sales', 'Product development'],
    bottomLine: 'Exploring that never concludes; always higher targets',
    pitfall: 'Over-idealism (Deva)',
  },
  {
    index: 5, name: 'Ardra', lord: 'Ra', signs: 'Gemini', gana: 'Manushya',
    coreMeaning: 'Destruction for Rebuilding, Innovation',
    workingStyle: 'Breaks systems then innovates',
    hiddenPower: 'Destruction → Innovation',
    careerFields: ['IT', 'Technology', 'System disruption', 'Coding', 'Ethical Hacking'],
    bottomLine: 'Creates chaos first, then builds something entirely new',
    pitfall: 'Greed (Manushya)',
  },
  {
    index: 6, name: 'Punarvasu', lord: 'Ju', signs: 'Gemini/Cancer', gana: 'Deva',
    coreMeaning: 'Restoration, Return to Basics',
    workingStyle: 'Repeat → Improve → Repeat cycle',
    hiddenPower: 'Improvisation through Repetition',
    careerFields: ['Teacher', 'Advisor', 'Policy Maker', 'Strategist', 'Consultant'],
    bottomLine: 'Takes years to perfect — but creates masterwork eventually',
    pitfall: 'Over-idealism (Deva)',
  },
  {
    index: 7, name: 'Pushya', lord: 'Sa', signs: 'Cancer', gana: 'Deva',
    coreMeaning: 'Nourishment, Silent Support',
    workingStyle: 'Creates support systems quietly',
    hiddenPower: 'Support IS the Power',
    careerFields: ['Support roles', 'Nurturing professions', 'Healthcare infrastructure', 'NGO'],
    bottomLine: 'Invisible backbone that holds everything together',
    pitfall: 'Over-idealism (Deva)',
  },
  {
    index: 8, name: 'Ashlesha', lord: 'Me', signs: 'Cancer', gana: 'Rakshasa',
    coreMeaning: 'Binding, Invisible Control',
    workingStyle: 'Manipulates; binds things invisibly',
    hiddenPower: 'Invisible Control Mechanisms',
    careerFields: ['Politics', 'Psychology', 'Intelligence', 'Covert operations'],
    bottomLine: 'Making people do things without them realizing it',
    pitfall: 'Control obsession (Rakshasa)',
  },
  {
    index: 9, name: 'Magha', lord: 'Ke', signs: 'Leo', gana: 'Rakshasa',
    coreMeaning: 'Legacy, Royal Authority',
    workingStyle: 'Continues and expands inherited power',
    hiddenPower: 'Legacy Power',
    careerFields: ['Bureaucracy', 'Politics', 'Corporate Leadership', 'Business dynasties'],
    bottomLine: 'Carrying forward and amplifying power that came before',
    pitfall: 'Control obsession (Rakshasa)',
  },
  {
    index: 10, name: 'Purva Phalguni', lord: 'Ve', signs: 'Leo', gana: 'Manushya',
    coreMeaning: 'Pleasure, Attraction, Charm',
    workingStyle: 'Attracts through personal charm',
    hiddenPower: 'Charm IS the Earning Tool',
    careerFields: ['Media', 'Entertainment', 'Modeling', 'Jewelry', 'Apparel', 'Fashion', 'Management'],
    bottomLine: 'Career is built entirely on personal charm and attractiveness',
    pitfall: 'Greed (Manushya)',
  },
  {
    index: 11, name: 'Uttara Phalguni', lord: 'Su', signs: 'Leo/Virgo', gana: 'Manushya',
    coreMeaning: 'Agreement, Structure, Sustainability',
    workingStyle: 'Structured, consistent, disciplined',
    hiddenPower: 'Invisible Discipline',
    careerFields: ['Long-term corporate roles', 'Structured administration', 'Contracts'],
    bottomLine: 'Sustainability over glamour; consistency is the superpower',
    pitfall: 'Greed (Manushya)',
  },
  {
    index: 12, name: 'Hasta', lord: 'Mo', signs: 'Virgo', gana: 'Deva',
    coreMeaning: 'Skill through Hands, Precision',
    workingStyle: 'Hands-on; making livelihood manually',
    hiddenPower: 'Hands = Destiny',
    careerFields: ['Surgery', 'Craft', 'Technology', 'Labor', 'Skilled trades', 'Design'],
    bottomLine: 'Earning through what your hands can do',
    pitfall: 'Over-idealism (Deva)',
  },
  {
    index: 13, name: 'Chitra', lord: 'Ma', signs: 'Virgo/Libra', gana: 'Rakshasa',
    coreMeaning: 'Creating Beautiful Structures',
    workingStyle: 'Combines beauty with precision',
    hiddenPower: 'Beauty WITH Precision',
    careerFields: ['Architecture', 'Interior Design', 'Product Design', 'Art'],
    bottomLine: 'Creating structures that are both functional and beautiful',
    pitfall: 'Control obsession (Rakshasa)',
  },
  {
    index: 14, name: 'Swati', lord: 'Ra', signs: 'Libra', gana: 'Manushya',
    coreMeaning: 'Independence + Flexibility',
    workingStyle: 'Functions best with freedom; adapts easily',
    hiddenPower: 'Freedom Breeds Growth',
    careerFields: ['Business', 'Entrepreneurship', 'Independent trade', 'Freelancing'],
    bottomLine: 'Where there is freedom, there is growth',
    pitfall: 'Greed (Manushya)',
  },
  {
    index: 15, name: 'Vishakha', lord: 'Ju', signs: 'Libra/Scorpio', gana: 'Rakshasa',
    coreMeaning: 'Target, Goal, Destination',
    workingStyle: 'Obsessive focus on goals',
    hiddenPower: 'Obsession = Success',
    careerFields: ['Politics', 'Business', 'Passion-driven careers', 'Goal-oriented roles'],
    bottomLine: 'Single-pointed obsessive focus; the goal is everything',
    pitfall: 'Control obsession (Rakshasa)',
  },
  {
    index: 16, name: 'Anuradha', lord: 'Sa', signs: 'Scorpio', gana: 'Deva',
    coreMeaning: 'Friendship, Networking',
    workingStyle: 'Builds entirely through relationships',
    hiddenPower: 'Network = Net Worth',
    careerFields: ['Diplomacy', 'HR', 'Politics', 'Business', 'Corporate management'],
    bottomLine: 'Success comes through who you know; network is everything',
    pitfall: 'Over-idealism (Deva)',
  },
  {
    index: 17, name: 'Jyeshtha', lord: 'Me', signs: 'Scorpio', gana: 'Rakshasa',
    coreMeaning: 'Superiority, Seniority, Secrecy',
    workingStyle: 'Power through concealment',
    hiddenPower: 'Secrecy IS the Power',
    careerFields: ['Intelligence agencies', 'Senior administration', 'CEO/CXO', 'RAW'],
    bottomLine: 'The more secret your work, the more powerful you become',
    pitfall: 'Control obsession (Rakshasa)',
  },
  {
    index: 18, name: 'Mula', lord: 'Ke', signs: 'Sagittarius', gana: 'Rakshasa',
    coreMeaning: 'Root Cause, Foundation, Uprooting',
    workingStyle: 'Breaks things to root level to understand',
    hiddenPower: 'Root-level Deconstruction',
    careerFields: ['Research', 'System dismantling', 'Innovation', 'Demolition', 'Policy'],
    bottomLine: 'Must destroy to understand; then rebuild from roots',
    pitfall: 'Control obsession (Rakshasa)',
  },
  {
    index: 19, name: 'Purva Ashadha', lord: 'Ve', signs: 'Sagittarius', gana: 'Manushya',
    coreMeaning: 'Victory through Persuasion',
    workingStyle: 'Persistent convincing; never gives up',
    hiddenPower: 'Convincing Power',
    careerFields: ['Marketing', 'Sales', 'Politics', 'Events', 'Concept Selling'],
    bottomLine: 'Success = ability to convince; sells vision before delivery',
    pitfall: 'Greed (Manushya)',
  },
  {
    index: 20, name: 'Uttara Ashadha', lord: 'Su', signs: 'Sag/Capricorn', gana: 'Manushya',
    coreMeaning: 'Permanent Victory through Discipline',
    workingStyle: 'Consistent, disciplined, long-term commitment',
    hiddenPower: 'Consistency = Victory',
    careerFields: ['Government service', 'Long-term corporate', 'Administrative services'],
    bottomLine: 'NEVER switch jobs — staying IS the strategy; leaving = biggest mistake',
    pitfall: 'Greed (Manushya)',
  },
  {
    index: 21, name: 'Shravana', lord: 'Mo', signs: 'Capricorn', gana: 'Deva',
    coreMeaning: 'Learning through Listening',
    workingStyle: 'Absorbs knowledge through hearing deeply',
    hiddenPower: 'Listening = Knowledge = Power',
    careerFields: ['Communication', 'Media', 'Broadcasting', 'Teaching', 'Counseling'],
    bottomLine: 'Must listen deeply; knowledge and success come through ears',
    pitfall: 'Over-idealism (Deva)',
  },
  {
    index: 22, name: 'Dhanishtha', lord: 'Ma', signs: 'Cap/Aquarius', gana: 'Manushya',
    coreMeaning: 'Rhythm, Timing, Wealth',
    workingStyle: 'Wealth arrives through perfect timing',
    hiddenPower: 'Timing IS Wealth',
    careerFields: ['Music', 'Operations Management', 'Engineering', 'Production'],
    bottomLine: 'Perfect timing = money; timing is the only variable that matters',
    pitfall: 'Greed (Manushya)',
  },
  {
    index: 23, name: 'Shatabhisha', lord: 'Ra', signs: 'Aquarius', gana: 'Manushya',
    coreMeaning: 'Healing through Isolation',
    workingStyle: 'Works alone; discoveries happen in solitude',
    hiddenPower: 'Isolation = Discovery',
    careerFields: ['Medical Research', 'Psychology', 'Graphic Design', 'AI', 'Space Engineering'],
    bottomLine: 'More isolated, more discoveries; solitude is the workplace',
    pitfall: 'Greed (Manushya)',
  },
  {
    index: 24, name: 'Purva Bhadrapada', lord: 'Ju', signs: 'Aquarius/Pisces', gana: 'Manushya',
    coreMeaning: 'Extreme Transformation',
    workingStyle: 'Takes things to absolute extreme for breakthroughs',
    hiddenPower: 'Extremity Creates Breakthroughs',
    careerFields: ['Philosophy', 'Occult', 'Extreme innovation', 'Radical research'],
    bottomLine: 'Only by going to extremes can true breakthroughs be achieved',
    pitfall: 'Greed (Manushya)',
  },
  {
    index: 25, name: 'Uttara Bhadrapada', lord: 'Sa', signs: 'Pisces', gana: 'Deva',
    coreMeaning: 'Stability leading to Depth',
    workingStyle: 'Deep mastery through sustained stability',
    hiddenPower: 'Depth = Mastery = Success',
    careerFields: ['Deep consulting', 'Philosophy', 'Mastery-requiring fields'],
    bottomLine: 'Cannot succeed without achieving TRUE depth; mastery is everything',
    pitfall: 'Over-idealism (Deva)',
  },
  {
    index: 26, name: 'Revati', lord: 'Me', signs: 'Pisces', gana: 'Deva',
    coreMeaning: 'Completion, Guidance',
    workingStyle: 'Moves forward through giving and receiving guidance',
    hiddenPower: 'Guidance is the Path',
    careerFields: ['Mentoring', 'Spiritual guidance', 'Completion-oriented roles', 'Counseling'],
    bottomLine: 'Career advances through guidance — giving it AND seeking it',
    pitfall: 'Over-idealism (Deva)',
  },
]

export function getNakshatraProfession(index: number): NakshatraProfessionProfile {
  return NAKSHATRA_PROFESSIONS[((index % 27) + 27) % 27]
}

// ── Functional groupings ──────────────────────────────────────

export const PROFESSION_FUNCTIONAL_GROUPS: ProfessionFunctionalGroup[] = [
  {
    id: 'starters', label: 'Starters',
    nakshatraIndices: [0, 7, 12],
    coreFunction: 'Initiate, begin, launch new things',
    bestEnvironments: 'Startups, Emergency services, New projects',
  },
  {
    id: 'builders', label: 'Builders',
    nakshatraIndices: [3, 11, 20],
    coreFunction: 'Create, construct, sustain long-term',
    bestEnvironments: 'Finance, Administration, Construction, Long-term corporate',
  },
  {
    id: 'analyzers', label: 'Analyzers',
    nakshatraIndices: [4, 22],
    coreFunction: 'Research, explore, time perfectly',
    bestEnvironments: 'Research, Sales, Operations, Music',
  },
  {
    id: 'destroyers', label: 'Destroyers',
    nakshatraIndices: [5, 18, 23],
    coreFunction: 'Break down, dismantle, innovate',
    bestEnvironments: 'IT, Research, Innovation labs, Demolition',
  },
  {
    id: 'controllers', label: 'Controllers',
    nakshatraIndices: [8, 17, 9],
    coreFunction: 'Control, dominate, administer',
    bestEnvironments: 'Intelligence, Politics, Senior management',
  },
  {
    id: 'networkers', label: 'Networkers',
    nakshatraIndices: [14, 16, 26],
    coreFunction: 'Connect, collaborate, build relationships',
    bestEnvironments: 'HR, Diplomacy, Business development',
  },
  {
    id: 'performers', label: 'Performers',
    nakshatraIndices: [10, 19, 24],
    coreFunction: 'Persuade, perform, transform through extremes',
    bestEnvironments: 'Entertainment, Marketing, Philosophy',
  },
  {
    id: 'strategists', label: 'Strategists',
    nakshatraIndices: [15, 1, 25],
    coreFunction: 'Plan obsessively, endure, master deeply',
    bestEnvironments: 'Politics, High-pressure admin, Deep consulting',
  },
  {
    id: 'listeners', label: 'Listeners',
    nakshatraIndices: [21, 6],
    coreFunction: 'Absorb, learn, restore through listening',
    bestEnvironments: 'Media, Teaching, Advisory, Policy',
  },
]

export function getFunctionalGroupForNakshatra(index: number): ProfessionFunctionalGroup | undefined {
  return PROFESSION_FUNCTIONAL_GROUPS.find(g => g.nakshatraIndices.includes(((index % 27) + 27) % 27))
}

// ── Gana career implications ──────────────────────────────────

export const GANA_CAREER_INFO: Record<CareerGana, GanaCareerInfo> = {
  Deva: {
    gana: 'Deva',
    theme: 'Growth & Expansion; System Building',
    strength: 'Building and expanding systems; teaching; advising',
    pitfall: 'Over-idealism',
    pitfallDamage: 'Sets unrealistic standards; loses practical grip; disappointed easily',
    solution: 'Ground expectations; accept practical imperfections',
    examples: ['Ashwini', 'Mrigashira', 'Punarvasu', 'Pushya', 'Hasta', 'Anuradha', 'Shravana', 'Revati'],
  },
  Manushya: {
    gana: 'Manushya',
    theme: 'Practical, Business & Execution',
    strength: 'Commerce, media, management, execution',
    pitfall: 'Greed',
    pitfallDamage: 'Spreads too thin; chases everything; cannot commit to one path',
    solution: 'Choose ONE primary path; go deep before going wide',
    examples: ['Bharani', 'Rohini', 'Ardra', 'Purva Phalguni', 'Uttara Phalguni', 'Swati', 'Dhanishtha', 'Shatabhisha', 'Purva Ashadha', 'Uttara Ashadha', 'Purva Bhadrapada'],
  },
  Rakshasa: {
    gana: 'Rakshasa',
    theme: 'Power & Control',
    strength: 'Strategy, intelligence, transformation, politics',
    pitfall: 'Control obsession',
    pitfallDamage: 'Alienates colleagues; micromanages; creates toxic environments',
    solution: 'Learn to delegate; trust the process; release control',
    examples: ['Krittika', 'Ashlesha', 'Magha', 'Chitra', 'Vishakha', 'Jyeshtha', 'Mula'],
  },
}

// ── Pada execution styles ─────────────────────────────────────

export const PADA_CAREER_STYLES: Record<Rashi, PadaCareerStyle> = {
  1:  { rashi: 1,  energy: 'Action, Risk, Startup energy', executionStyle: 'Fast, aggressive, first-mover', exampleProfessions: 'Emergency doctor, Entrepreneur, Military officer' },
  2:  { rashi: 2,  energy: 'Finance, Value, Assets, Healing', executionStyle: 'Steady, value-building', exampleProfessions: 'Wealth manager, Healer, Asset builder' },
  3:  { rashi: 3,  energy: 'Communication, Ideas, Media', executionStyle: 'Quick ideas, brainstorming', exampleProfessions: 'Startup marketer, Branding expert, Communicator' },
  4:  { rashi: 4,  energy: 'Care, Public, Hospitality, Nurturing', executionStyle: 'Emotional, caring approach', exampleProfessions: 'Therapist, Caregiver, Hospitality professional' },
  5:  { rashi: 5,  energy: 'Authority, Leadership, Command', executionStyle: 'Commanding, visible', exampleProfessions: 'Leader, Director, Public authority figure' },
  6:  { rashi: 6,  energy: 'Analysis, Process, Precision', executionStyle: 'Methodical, detail-oriented', exampleProfessions: 'Analyst, Process engineer, Quality controller' },
  7:  { rashi: 7,  energy: 'Business, Negotiation, Partnerships', executionStyle: 'Balanced, deal-making', exampleProfessions: 'Businessman, Negotiator, Mediator' },
  8:  { rashi: 8,  energy: 'Research, Secrecy, Depth', executionStyle: 'Investigative, hidden', exampleProfessions: 'Researcher, Intelligence officer, Investigator' },
  9:  { rashi: 9,  energy: 'Teaching, Law, Travel, Philosophy', executionStyle: 'Expansive, principled', exampleProfessions: 'Teacher, Lawyer, Traveler, Philosopher' },
  10: { rashi: 10, energy: 'Administration, Structure, Governance', executionStyle: 'Structured, disciplined', exampleProfessions: 'Administrator, Bureaucrat, Manager' },
  11: { rashi: 11, energy: 'Technology, Innovation, Systems', executionStyle: 'Innovative, systemic', exampleProfessions: 'Tech professional, Innovator, System designer' },
  12: { rashi: 12, energy: 'Creativity, Spirituality, Imagination', executionStyle: 'Creative, intuitive', exampleProfessions: 'Artist, Spiritual guide, Creative professional' },
}

/** Ashwini pada detail example (illustrative of pada layering) */
export const ASHWINI_PADA_DETAILS = [
  { pada: 1, navamsa: 'Aries', combo: 'Ashwini (Speed) + Aries (Action)', expression: 'Emergency action roles', roles: 'Emergency doctor, Disaster management, First responder' },
  { pada: 2, navamsa: 'Taurus', combo: 'Ashwini (Healing) + Taurus (Assets/Value)', expression: 'Healing + asset building', roles: 'Healer with practice/clinic ownership, Health asset management' },
  { pada: 3, navamsa: 'Gemini', combo: 'Ashwini (Initiation) + Gemini (Ideas)', expression: 'Fast idea generation', roles: 'Startup founder, Marketing strategist, Branding expert' },
  { pada: 4, navamsa: 'Cancer', combo: 'Ashwini (Care) + Cancer (Nurturing)', expression: 'Emotional healing and care', roles: 'Therapist, Emotional caregiver, Nurturing doctor' },
]

/** Same Aries (1st) pada across different nakshatras */
export const ARIES_PADA_COMPARISON = [
  { nakshatraIndex: 0, base: 'Speed, Initiation', ariesAdds: 'Aggressive action', expression: 'Emergency doctor, Disaster management, Fast first-mover' },
  { nakshatraIndex: 3, base: 'Growth, Value multiplication', ariesAdds: 'Aggressive growth', expression: 'Business aggressive growth, Out-of-turn promotions (IPS, Paramilitary)' },
  { nakshatraIndex: 6, base: 'Restore, Improve', ariesAdds: 'Action-oriented consulting', expression: 'Consultant who quickly restarts/rebuilds organizations' },
  { nakshatraIndex: 9, base: 'Legacy, Authority', ariesAdds: 'Aggressive authority', expression: 'Politics, Assertive authority roles' },
  { nakshatraIndex: 12, base: 'Hands-on skill', ariesAdds: 'Skilled fast action', expression: 'Skilled craftsperson with speed, Action-oriented designer' },
  { nakshatraIndex: 15, base: 'Obsessive goal', ariesAdds: 'Aggressive goal pursuit', expression: 'High-performance sales, Aggressive politics' },
]

// ── Planet skills ─────────────────────────────────────────────

export const PLANET_CAREER_SKILLS: PlanetCareerSkill[] = [
  { planet: 'Su', skill: 'Authority, Command', positive: 'Leadership, Government, Direction', ifWeak: 'Cannot hold authority; loses positions' },
  { planet: 'Mo', skill: 'Public connection, Emotion', positive: 'Mass appeal, Public-facing roles', ifWeak: 'Dissatisfied; no emotional fulfillment' },
  { planet: 'Ma', skill: 'Action, Drive, Energy', positive: 'Execution, military precision, sports', ifWeak: 'Cannot execute; paralysis' },
  { planet: 'Me', skill: 'Intelligence, Communication', positive: 'Analysis, writing, tech, trade', ifWeak: 'Poor communication; missed opportunities' },
  { planet: 'Ju', skill: 'Wisdom, Expansion', positive: 'Teaching, advising, philosophy', ifWeak: 'Poor judgment; misguided decisions' },
  { planet: 'Ve', skill: 'Attraction, Charm, Beauty', positive: 'Art, luxury, entertainment', ifWeak: 'Unattractive output; lacks appeal' },
  { planet: 'Sa', skill: 'Structure, Discipline', positive: 'Administration, long-term building', ifWeak: 'No structure; chaotic work' },
  { planet: 'Ra', skill: 'Innovation, Disruption', positive: 'Technology, foreign, unconventional', ifWeak: 'Erratic; unstable unconventional path' },
  { planet: 'Ke', skill: 'Detachment, Insight', positive: 'Research, spirituality, deep focus', ifWeak: 'Cannot let go; scattered depth' },
]

export function getPlanetCareerSkill(id: GrahaId): PlanetCareerSkill | undefined {
  return PLANET_CAREER_SKILLS.find(p => p.planet === id)
}

// ── Planet + nakshatra career combinations ────────────────────

export const PLANET_NAKSHATRA_CAREER_COMBOS: PlanetNakshatraCareerCombo[] = [
  { planet: 'Su', skill: 'Authority', nakshatraIndex: 9,  expression: 'IAS, IFS, Administrative services, Corporate authority', notes: 'Government/Corporate authority' },
  { planet: 'Su', skill: 'Authority', nakshatraIndex: 20, expression: 'Administrative service, disciplined authority', notes: 'Long-term government roles' },
  { planet: 'Su', skill: 'Authority', nakshatraIndex: 15, expression: 'Political strategist, Policy maker', notes: 'Strategic authority' },
  { planet: 'Su', skill: 'Authority', nakshatraIndex: 21, expression: 'Public speaker, Media authority figure', notes: 'Communication authority' },
  { planet: 'Su', skill: 'Authority', nakshatraIndex: 8,  expression: 'Hidden power, Intelligence roles', notes: 'Covert authority' },
  { planet: 'Mo', skill: 'Public emotion', nakshatraIndex: 3,  expression: 'Luxury, Hospitality industry', notes: 'Value + care combined' },
  { planet: 'Mo', skill: 'Public emotion', nakshatraIndex: 14, expression: 'Business, Trade', notes: 'Independent commerce' },
  { planet: 'Mo', skill: 'Public emotion', nakshatraIndex: 23, expression: 'Psychology, Healing — always healing something', notes: 'Isolated healing' },
  { planet: 'Mo', skill: 'Public emotion', nakshatraIndex: 16, expression: 'Networking-based career', notes: 'Relationship-driven work' },
  { planet: 'Ma', skill: 'Action, Drive', nakshatraIndex: 2,  expression: 'Surgeon, Military (direction matters)', notes: 'Sharp cutting action' },
  { planet: 'Ma', skill: 'Action, Drive', nakshatraIndex: 22, expression: 'Operations, Engineering, Production Management, Music/Dance instruction', notes: 'Timed action' },
  { planet: 'Ma', skill: 'Action, Drive', nakshatraIndex: 18, expression: 'Demolition, Deconstruction-based research, Breaking systems', notes: 'Root-level action' },
  { planet: 'Ma', skill: 'Action, Drive', nakshatraIndex: 17, expression: 'Intelligence, Senior administration, Secretive power roles', notes: 'Intelligent covert action' },
  { planet: 'Me', skill: 'Intelligence', nakshatraIndex: 0,  expression: 'Startup founder — quick intelligent moves', notes: 'Fast intelligent initiation' },
  { planet: 'Me', skill: 'Intelligence', nakshatraIndex: 5,  expression: 'IT, Coding, Ethical Hacking', notes: 'Tech intelligence' },
  { planet: 'Me', skill: 'Intelligence', nakshatraIndex: 12, expression: 'Skill-based work, Design', notes: 'Hands-on intelligence' },
  { planet: 'Me', skill: 'Intelligence', nakshatraIndex: 21, expression: 'Communication, Media', notes: 'Verbal intelligence' },
  { planet: 'Ju', skill: 'Wisdom', nakshatraIndex: 6,  expression: 'Advisor, Teacher', notes: 'Restorative wisdom' },
  { planet: 'Ju', skill: 'Wisdom', nakshatraIndex: 15, expression: 'Political advisor', notes: 'Strategic wisdom' },
  { planet: 'Ju', skill: 'Wisdom', nakshatraIndex: 25, expression: 'Philosopher, Deep consultant', notes: 'Deep stable wisdom' },
  { planet: 'Ve', skill: 'Attraction', nakshatraIndex: 3,  expression: 'Luxury businesses — works excellently', notes: 'Beauty + value' },
  { planet: 'Ve', skill: 'Attraction', nakshatraIndex: 10, expression: 'Entertainment industry', notes: 'Pure charm expression' },
  { planet: 'Ve', skill: 'Attraction', nakshatraIndex: 13, expression: 'Design, Architecture', notes: 'Aesthetic precision' },
  { planet: 'Sa', skill: 'Structure', nakshatraIndex: 20, expression: 'Administration, Disciplined long-term roles', notes: 'Structured discipline' },
  { planet: 'Sa', skill: 'Structure', nakshatraIndex: 23, expression: 'Isolated research, Creative work done alone', notes: 'Structured isolation' },
  { planet: 'Sa', skill: 'Structure', nakshatraIndex: 16, expression: 'Corporate management, Structured team environments', notes: 'Networked structure' },
  { planet: 'Ra', skill: 'Innovation', nakshatraIndex: 5,  expression: 'Revolution in Tech or any field; total disruption', notes: 'Disruptive innovation' },
  { planet: 'Ra', skill: 'Innovation', nakshatraIndex: 14, expression: 'Global business, Global organizations', notes: 'Independent global innovation' },
  { planet: 'Ra', skill: 'Innovation', nakshatraIndex: 23, expression: 'AI, Space Engineering, Cutting-edge research', notes: 'Future-tech innovation' },
  { planet: 'Ke', skill: 'Detachment', nakshatraIndex: 18, expression: 'Occult, Deep root-level research', notes: 'Detached deep inquiry' },
  { planet: 'Ke', skill: 'Detachment', nakshatraIndex: 0,  expression: 'Spiritual healer', notes: 'Healing through detachment' },
  { planet: 'Ke', skill: 'Detachment', nakshatraIndex: 26, expression: 'Guide, Counselor, Moksha path shower', notes: 'Completion through guidance' },
]

export function findPlanetNakshatraCombo(planet: GrahaId, nakIndex: number): PlanetNakshatraCareerCombo | undefined {
  return PLANET_NAKSHATRA_CAREER_COMBOS.find(c => c.planet === planet && c.nakshatraIndex === nakIndex)
}

// ── Quick career diagnosis ────────────────────────────────────

export const CAREER_DIAGNOSIS: CareerDiagnosisRow[] = NAKSHATRA_PROFESSIONS.map(p => ({
  nakshatraIndex: p.index,
  behaviorStyle: p.workingStyle,
  careerDirection: `${p.careerFields.slice(0, 3).join('/')} roles in that planet's domain`,
}))

// Override with sharper diagnosis copy from the source table
const DIAGNOSIS_OVERRIDES: Partial<Record<number, string>> = {
  0: 'Speed-based roles in that planet\'s domain',
  1: 'Authority/pressure roles in that planet\'s domain',
  2: 'Surgical/analytical roles in that planet\'s domain',
  3: 'Value-creation roles in that planet\'s domain',
  4: 'Research/sales roles in that planet\'s domain',
  5: 'Tech/breaking roles in that planet\'s domain',
  6: 'Teaching/advising roles in that planet\'s domain',
  7: 'Support/nurturing roles in that planet\'s domain',
  8: 'Political/psychological roles in that planet\'s domain',
  9: 'Leadership/legacy roles in that planet\'s domain',
  10: 'Entertainment/media roles in that planet\'s domain',
  11: 'Long-term structured roles in that planet\'s domain',
  12: 'Manual/craft roles in that planet\'s domain',
  13: 'Design/architectural roles in that planet\'s domain',
  14: 'Entrepreneurial roles in that planet\'s domain',
  15: 'Goal-driven roles in that planet\'s domain',
  16: 'Relationship-based roles in that planet\'s domain',
  17: 'Covert/senior roles in that planet\'s domain',
  18: 'Research/demolition roles in that planet\'s domain',
  19: 'Convincing/marketing roles in that planet\'s domain',
  20: 'Long-term government/corporate in that planet\'s domain',
  21: 'Communication/media roles in that planet\'s domain',
  22: 'Operations/music roles in that planet\'s domain',
  23: 'Isolated research roles in that planet\'s domain',
  24: 'Extreme/philosophical roles in that planet\'s domain',
  25: 'Deep mastery roles in that planet\'s domain',
  26: 'Mentoring/guiding roles in that planet\'s domain',
}

for (const row of CAREER_DIAGNOSIS) {
  const override = DIAGNOSIS_OVERRIDES[row.nakshatraIndex]
  if (override) row.careerDirection = override
}

// ── Nakshatra lord chain ──────────────────────────────────────

export const NAKSHATRA_LORD_CHAIN: { lord: GrahaId; nakshatraIndices: number[]; meaning: string }[] = [
  { lord: 'Ke', nakshatraIndices: [0, 9, 18], meaning: 'Spiritual direction, detachment from mainstream' },
  { lord: 'Ve', nakshatraIndices: [1, 10, 19], meaning: 'Attraction, luxury, pleasure in career' },
  { lord: 'Su', nakshatraIndices: [2, 11, 20], meaning: 'Authority, government, structured power' },
  { lord: 'Mo', nakshatraIndices: [3, 12, 21], meaning: 'Public, emotion, mass connection' },
  { lord: 'Ma', nakshatraIndices: [4, 13, 22], meaning: 'Action, engineering, rhythm' },
  { lord: 'Ra', nakshatraIndices: [5, 14, 23], meaning: 'Innovation, technology, disruption' },
  { lord: 'Ju', nakshatraIndices: [6, 15, 24], meaning: 'Wisdom, teaching, philosophy' },
  { lord: 'Sa', nakshatraIndices: [7, 16, 25], meaning: 'Structure, discipline, long-term mastery' },
  { lord: 'Me', nakshatraIndices: [8, 17, 26], meaning: 'Intelligence, communication, guidance' },
]

// ── Chart-aware helpers ───────────────────────────────────────

export function getCareerIndicators(chart: ChartOutput): CareerIndicatorResult[] {
  const asc = chart.lagnas.ascRashi
  const tenthRashi = rashiOfHouse(10, asc)
  const tenthLordId = SIGN_LORD[tenthRashi]
  const tenthLord = chart.grahas.find(g => g.id === tenthLordId) ?? null
  const moon = chart.grahas.find(g => g.id === 'Mo') ?? null
  const rahu = chart.grahas.find(g => g.id === 'Ra') ?? null

  const make = (
    key: CareerIndicatorResult['key'],
    label: string,
    priority: CareerPriority,
    reveals: string,
    planetId: GrahaId | null,
    nakIdx: number,
    pada: number,
  ): CareerIndicatorResult => {
    const profile = getNakshatraProfession(nakIdx)
    return {
      key, label, priority, reveals,
      planetId,
      planetName: planetId ? GRAHA_NAMES[planetId] : '—',
      nakshatraIndex: nakIdx,
      nakshatraName: NAKSHATRA_NAMES[nakIdx] ?? profile.name,
      pada,
      padaRashi: getPadaRashi(nakIdx, pada),
      profile,
    }
  }

  return [
    make(
      'tenthLord',
      '10th Lord',
      'PRIMARY',
      'Career Blueprint — overall design and direction of profession',
      tenthLordId,
      tenthLord?.nakshatraIndex ?? 0,
      tenthLord?.pada ?? 1,
    ),
    make(
      'moon',
      'Moon',
      'SECONDARY',
      'Satisfaction, passion, emotional fulfillment — will there be joy?',
      'Mo',
      moon?.nakshatraIndex ?? 0,
      moon?.pada ?? 1,
    ),
    make(
      'rahu',
      'Rahu',
      'TERTIARY',
      'Unconventional trajectory — sudden rise OR sudden fall',
      'Ra',
      rahu?.nakshatraIndex ?? 0,
      rahu?.pada ?? 1,
    ),
  ]
}

export function buildCareerFormula(chart: ChartOutput): CareerFormulaResult {
  const indicators = getCareerIndicators(chart)
  const primary = indicators[0]
  const skill = getPlanetCareerSkill(primary.planetId ?? 'Sa')
  const padaStyle = PADA_CAREER_STYLES[primary.padaRashi]
  const diagnosis = CAREER_DIAGNOSIS[primary.nakshatraIndex]

  const planetName = primary.planetName
  const planetSkill = skill?.skill ?? 'Skill'
  const nakshatraHow = primary.profile.hiddenPower
  const nakshatraName = primary.nakshatraName
  const houseWhere = '10th House — public career domain'
  const padaExecution = padaStyle.executionStyle
  const padaRashiName = RASHI_NAMES[primary.padaRashi]

  return {
    planetSkill,
    planetName,
    nakshatraHow,
    nakshatraName,
    houseWhere,
    padaExecution,
    padaRashiName,
    summary: `${planetName} (${planetSkill}) via ${nakshatraName} (${nakshatraHow}) in ${houseWhere}, executed ${padaExecution.toLowerCase()} (${padaRashiName} pada) → ${diagnosis.careerDirection}`,
  }
}

export function getMatchingCombosForChart(chart: ChartOutput): PlanetNakshatraCareerCombo[] {
  const grahas = chart.grahas.filter(g => !['Ur', 'Ne', 'Pl'].includes(g.id))
  return grahas.flatMap(g => {
    const hit = findPlanetNakshatraCombo(g.id, g.nakshatraIndex)
    return hit ? [hit] : []
  })
}
