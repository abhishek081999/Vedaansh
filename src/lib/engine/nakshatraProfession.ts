// ─────────────────────────────────────────────────────────────
//  src/lib/engine/nakshatraProfession.ts
//  Profession / career profiles for all 27 nakshatras, plus
//  functional groupings, gana career implications, pada styles,
//  and chart-aware career indicator helpers.
// ─────────────────────────────────────────────────────────────

import type { ChartOutput, GrahaId, Rashi } from '@/types/astrology'
import { GRAHA_NAMES, NAKSHATRA_NAMES, RASHI_NAMES } from '@/types/astrology'
import { GRAHA_HI, NAKSHATRA_HI, RASHI_HI, termHi } from '@/i18n/jyotish'
import { fill, type EngineLang } from '@/lib/engine/lang'
import {
  ARIES_PADA_HI,
  ASHWINI_PADA_HI,
  COMBO_NOTES_HI,
  COMBO_SKILL_HI,
  GANA_TEXT_HI,
  GROUP_TEXT_HI,
  HOUSE_WHERE_HI,
  INDICATOR_REVEALS_HI,
  LORD_MEANING_HI,
  NP_DIRECTION_HI,
  NP_FIELD_HI,
  NP_HIDDEN_POWER_HI,
  NP_INDICATOR_LABEL_HI,
  NP_PADA_STYLE_HI,
  NP_SUMMARY_HI,
  PADA_TEXT_HI,
  PLANET_SKILL_TEXT_HI,
  PROFESSION_PROSE_HI,
  SKILL_FALLBACK_HI,
  careerFieldsHi,
} from '@/lib/engine/locale/nakshatraProfession.hi'

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

/**
 * Navamsa (D9) rashi for a nakshatra pada.
 * Each nakshatra spans 4 consecutive navamsas starting at (nak × 4) in the
 * 108-navamsa cycle from Aries — so pada 1 of Ashwini/Bharani/Krittika is
 * Aries/Leo/Sagittarius, then the pattern repeats every 3 nakshatras.
 */
export function getPadaRashi(nakshatraIndex: number, pada: number): Rashi {
  const nak = ((nakshatraIndex % 27) + 27) % 27
  const p = Math.min(4, Math.max(1, pada))
  return ((((nak * 4) + (p - 1)) % 12) + 12) % 12 + 1 as Rashi
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
    bottomLine: 'The first mover wins; whoever acts fastest succeeds',
    pitfall: 'Over-idealism (Deva)',
  },
  {
    index: 1, name: 'Bharani', lord: 'Ve', signs: 'Aries', gana: 'Manushya',
    coreMeaning: 'Transformation, Control, Endurance',
    workingStyle: 'Works under extreme pressure and can bear pain',
    hiddenPower: 'Endurance = Career Strength',
    careerFields: ['Administration', 'Authority roles', 'Corporate', 'Government', 'High-volume Retail', 'Military'],
    bottomLine: 'High-pressure environments are their domain',
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
    bottomLine: 'Creates and multiplies value — the Wealth Nakshatra',
    pitfall: 'Greed (Manushya)',
  },
  {
    index: 4, name: 'Mrigashira', lord: 'Ma', signs: 'Taurus/Gemini', gana: 'Deva',
    coreMeaning: 'Searching, Exploring, Curiosity',
    workingStyle: 'Endless exploration; the search never stops',
    hiddenPower: 'The Endless Hunt',
    careerFields: ['Research', 'Marketing', 'Sales', 'Product development'],
    bottomLine: 'Exploration that never ends; always aiming higher',
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
    workingStyle: 'A cycle of repeat → improve → repeat',
    hiddenPower: 'Improvisation through Repetition',
    careerFields: ['Teacher', 'Advisor', 'Policy Maker', 'Strategist', 'Consultant'],
    bottomLine: 'Takes years to perfect — but eventually produces a masterpiece',
    pitfall: 'Over-idealism (Deva)',
  },
  {
    index: 7, name: 'Pushya', lord: 'Sa', signs: 'Cancer', gana: 'Deva',
    coreMeaning: 'Nourishment, Silent Support',
    workingStyle: 'Creates support systems quietly',
    hiddenPower: 'Support IS the Power',
    careerFields: ['Support roles', 'Nurturing professions', 'Healthcare infrastructure', 'NGO'],
    bottomLine: 'The invisible backbone that holds everything together',
    pitfall: 'Over-idealism (Deva)',
  },
  {
    index: 8, name: 'Ashlesha', lord: 'Me', signs: 'Cancer', gana: 'Rakshasa',
    coreMeaning: 'Binding, Invisible Control',
    workingStyle: 'Manipulates; binds things invisibly',
    hiddenPower: 'Invisible Control Mechanisms',
    careerFields: ['Politics', 'Psychology', 'Intelligence', 'Covert operations'],
    bottomLine: 'Gets people to act without their realising it',
    pitfall: 'Control obsession (Rakshasa)',
  },
  {
    index: 9, name: 'Magha', lord: 'Ke', signs: 'Leo', gana: 'Rakshasa',
    coreMeaning: 'Legacy, Royal Authority',
    workingStyle: 'Continues and expands inherited power',
    hiddenPower: 'Legacy Power',
    careerFields: ['Bureaucracy', 'Politics', 'Corporate Leadership', 'Business dynasties'],
    bottomLine: 'Carries forward and amplifies the power that came before',
    pitfall: 'Control obsession (Rakshasa)',
  },
  {
    index: 10, name: 'Purva Phalguni', lord: 'Ve', signs: 'Leo', gana: 'Manushya',
    coreMeaning: 'Pleasure, Attraction, Charm',
    workingStyle: 'Attracts through personal charm',
    hiddenPower: 'Charm IS the tool for earning',
    careerFields: ['Media', 'Entertainment', 'Modeling', 'Jewelry', 'Apparel', 'Fashion', 'Management'],
    bottomLine: 'A career built entirely on personal charm and attractiveness',
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
    bottomLine: 'Earns through what the hands can do',
    pitfall: 'Over-idealism (Deva)',
  },
  {
    index: 13, name: 'Chitra', lord: 'Ma', signs: 'Virgo/Libra', gana: 'Rakshasa',
    coreMeaning: 'Creating Beautiful Structures',
    workingStyle: 'Combines beauty with precision',
    hiddenPower: 'Beauty WITH Precision',
    careerFields: ['Architecture', 'Interior Design', 'Product Design', 'Art'],
    bottomLine: 'Creates structures that are both functional and beautiful',
    pitfall: 'Control obsession (Rakshasa)',
  },
  {
    index: 14, name: 'Swati', lord: 'Ra', signs: 'Libra', gana: 'Manushya',
    coreMeaning: 'Independence + Flexibility',
    workingStyle: 'Works best with freedom; adapts easily',
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
    bottomLine: 'Single-minded, obsessive focus; the goal is everything',
    pitfall: 'Control obsession (Rakshasa)',
  },
  {
    index: 16, name: 'Anuradha', lord: 'Sa', signs: 'Scorpio', gana: 'Deva',
    coreMeaning: 'Friendship, Networking',
    workingStyle: 'Builds entirely through relationships',
    hiddenPower: 'Network = Net Worth',
    careerFields: ['Diplomacy', 'HR', 'Politics', 'Business', 'Corporate management'],
    bottomLine: 'Success comes through who you know; the network is everything',
    pitfall: 'Over-idealism (Deva)',
  },
  {
    index: 17, name: 'Jyeshtha', lord: 'Me', signs: 'Scorpio', gana: 'Rakshasa',
    coreMeaning: 'Superiority, Seniority, Secrecy',
    workingStyle: 'Power through concealment',
    hiddenPower: 'Secrecy IS the Power',
    careerFields: ['Intelligence agencies', 'Senior administration', 'CEO/CXO', 'RAW'],
    bottomLine: 'The more secret the work, the more powerful one becomes',
    pitfall: 'Control obsession (Rakshasa)',
  },
  {
    index: 18, name: 'Mula', lord: 'Ke', signs: 'Sagittarius', gana: 'Rakshasa',
    coreMeaning: 'Root Cause, Foundation, Uprooting',
    workingStyle: 'Breaks things down to the root to understand them',
    hiddenPower: 'Root-level Deconstruction',
    careerFields: ['Research', 'System dismantling', 'Innovation', 'Demolition', 'Policy'],
    bottomLine: 'Must destroy in order to understand, then rebuild from the roots',
    pitfall: 'Control obsession (Rakshasa)',
  },
  {
    index: 19, name: 'Purva Ashadha', lord: 'Ve', signs: 'Sagittarius', gana: 'Manushya',
    coreMeaning: 'Victory through Persuasion',
    workingStyle: 'Keeps persuading; never gives up',
    hiddenPower: 'Convincing Power',
    careerFields: ['Marketing', 'Sales', 'Politics', 'Events', 'Concept Selling'],
    bottomLine: 'Success is the ability to persuade; sells the vision before delivering',
    pitfall: 'Greed (Manushya)',
  },
  {
    index: 20, name: 'Uttara Ashadha', lord: 'Su', signs: 'Sag/Capricorn', gana: 'Manushya',
    coreMeaning: 'Permanent Victory through Discipline',
    workingStyle: 'Consistent, disciplined, long-term commitment',
    hiddenPower: 'Consistency = Victory',
    careerFields: ['Government service', 'Long-term corporate', 'Administrative services'],
    bottomLine: 'NEVER switch jobs — staying IS the strategy; leaving is the biggest mistake',
    pitfall: 'Greed (Manushya)',
  },
  {
    index: 21, name: 'Shravana', lord: 'Mo', signs: 'Capricorn', gana: 'Deva',
    coreMeaning: 'Learning through Listening',
    workingStyle: 'Absorbs knowledge by listening deeply',
    hiddenPower: 'Listening = Knowledge = Power',
    careerFields: ['Communication', 'Media', 'Broadcasting', 'Teaching', 'Counseling'],
    bottomLine: 'Must listen deeply; knowledge and success come through the ears',
    pitfall: 'Over-idealism (Deva)',
  },
  {
    index: 22, name: 'Dhanishtha', lord: 'Ma', signs: 'Cap/Aquarius', gana: 'Manushya',
    coreMeaning: 'Rhythm, Timing, Wealth',
    workingStyle: 'Wealth arrives through perfect timing',
    hiddenPower: 'Timing IS Wealth',
    careerFields: ['Music', 'Operations Management', 'Engineering', 'Production'],
    bottomLine: 'Perfect timing means money; timing is the only variable that matters',
    pitfall: 'Greed (Manushya)',
  },
  {
    index: 23, name: 'Shatabhisha', lord: 'Ra', signs: 'Aquarius', gana: 'Manushya',
    coreMeaning: 'Healing through Isolation',
    workingStyle: 'Works alone; discoveries happen in solitude',
    hiddenPower: 'Isolation = Discovery',
    careerFields: ['Medical Research', 'Psychology', 'Graphic Design', 'AI', 'Space Engineering'],
    bottomLine: 'The more isolated, the more discoveries; solitude is the workplace',
    pitfall: 'Greed (Manushya)',
  },
  {
    index: 24, name: 'Purva Bhadrapada', lord: 'Ju', signs: 'Aquarius/Pisces', gana: 'Manushya',
    coreMeaning: 'Extreme Transformation',
    workingStyle: 'Takes things to the absolute extreme for breakthroughs',
    hiddenPower: 'Extremity Creates Breakthroughs',
    careerFields: ['Philosophy', 'Occult', 'Extreme innovation', 'Radical research'],
    bottomLine: 'True breakthroughs come only by going to extremes',
    pitfall: 'Greed (Manushya)',
  },
  {
    index: 25, name: 'Uttara Bhadrapada', lord: 'Sa', signs: 'Pisces', gana: 'Deva',
    coreMeaning: 'Stability leading to Depth',
    workingStyle: 'Deep mastery through sustained stability',
    hiddenPower: 'Depth = Mastery = Success',
    careerFields: ['Deep consulting', 'Philosophy', 'Mastery-requiring fields'],
    bottomLine: 'Cannot succeed without TRUE depth; mastery is everything',
    pitfall: 'Over-idealism (Deva)',
  },
  {
    index: 26, name: 'Revati', lord: 'Me', signs: 'Pisces', gana: 'Deva',
    coreMeaning: 'Completion, Guidance',
    workingStyle: 'Moves forward by giving and receiving guidance',
    hiddenPower: 'Guidance is the Path',
    careerFields: ['Mentoring', 'Spiritual guidance', 'Completion-oriented roles', 'Counseling'],
    bottomLine: 'Career advances through guidance — both giving it AND seeking it',
    pitfall: 'Over-idealism (Deva)',
  },
]

function signsHi(signs: string): string {
  return signs.split('/').map(part => {
    const t = part.trim()
    if (t === 'Sag') return 'धनु'
    if (t === 'Cap') return 'मकर'
    return termHi(t)
  }).join('/')
}

function localizeProfession(en: NakshatraProfessionProfile): NakshatraProfessionProfile {
  const prose = PROFESSION_PROSE_HI[en.index]
  return {
    ...en,
    name: NAKSHATRA_HI[en.index] ?? en.name,
    signs: signsHi(en.signs),
    coreMeaning: prose.coreMeaning,
    workingStyle: prose.workingStyle,
    hiddenPower: NP_HIDDEN_POWER_HI[en.index] ?? en.hiddenPower,
    careerFields: careerFieldsHi(en.careerFields),
    bottomLine: prose.bottomLine,
    pitfall: prose.pitfall,
  }
}

export function getNakshatraProfession(index: number, lang: EngineLang = 'en'): NakshatraProfessionProfile {
  const en = NAKSHATRA_PROFESSIONS[((index % 27) + 27) % 27]
  return lang === 'hi' ? localizeProfession(en) : en
}

// ── Functional groupings ──────────────────────────────────────

export const PROFESSION_FUNCTIONAL_GROUPS: ProfessionFunctionalGroup[] = [
  {
    id: 'starters', label: 'Starters',
    nakshatraIndices: [0, 7, 12],
    coreFunction: 'Initiates, begins and launches new things',
    bestEnvironments: 'Startups, emergency services, new projects',
  },
  {
    id: 'builders', label: 'Builders',
    nakshatraIndices: [3, 11, 20],
    coreFunction: 'Create, construct, sustain long-term',
    bestEnvironments: 'Finance, administration, construction, long-term corporate roles',
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
    bestEnvironments: 'IT, research, innovation labs, demolition',
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
    coreFunction: 'Persuades, performs and transforms through extremes',
    bestEnvironments: 'Entertainment, Marketing, Philosophy',
  },
  {
    id: 'strategists', label: 'Strategists',
    nakshatraIndices: [15, 1, 25],
    coreFunction: 'Plans obsessively, endures and masters deeply',
    bestEnvironments: 'Politics, high-pressure administration, in-depth consulting',
  },
  {
    id: 'listeners', label: 'Listeners',
    nakshatraIndices: [21, 6],
    coreFunction: 'Absorbs, learns and restores through listening',
    bestEnvironments: 'Media, Teaching, Advisory, Policy',
  },
]

function localizeGroup(en: ProfessionFunctionalGroup): ProfessionFunctionalGroup {
  const hi = GROUP_TEXT_HI[en.id]
  return hi ? { ...en, ...hi } : en
}

export function getFunctionalGroupForNakshatra(index: number, lang: EngineLang = 'en'): ProfessionFunctionalGroup | undefined {
  const en = PROFESSION_FUNCTIONAL_GROUPS.find(g => g.nakshatraIndices.includes(((index % 27) + 27) % 27))
  if (!en || lang !== 'hi') return en
  return localizeGroup(en)
}

export function listProfessionFunctionalGroups(lang: EngineLang = 'en'): ProfessionFunctionalGroup[] {
  return lang === 'hi' ? PROFESSION_FUNCTIONAL_GROUPS.map(localizeGroup) : PROFESSION_FUNCTIONAL_GROUPS
}

export function ganaCareerInfo(gana: CareerGana, lang: EngineLang = 'en'): GanaCareerInfo {
  const en = GANA_CAREER_INFO[gana]
  if (lang !== 'hi') return en
  return { ...en, ...GANA_TEXT_HI[gana], examples: en.examples.map(name => termHi(name)) }
}

export function padaCareerStyle(rashi: Rashi, lang: EngineLang = 'en'): PadaCareerStyle {
  const en = PADA_CAREER_STYLES[rashi]
  if (lang !== 'hi') return en
  const hi = PADA_TEXT_HI[rashi]
  return { ...en, energy: hi.energy, executionStyle: NP_PADA_STYLE_HI[rashi] ?? en.executionStyle, exampleProfessions: hi.exampleProfessions }
}

export function listAshwiniPadaDetails(lang: EngineLang = 'en') {
  if (lang !== 'hi') return ASHWINI_PADA_DETAILS
  return ASHWINI_PADA_DETAILS.map((row, i) => ({
    ...row,
    navamsa: termHi(row.navamsa),
    ...ASHWINI_PADA_HI[i],
  }))
}

export function listAriesPadaComparison(lang: EngineLang = 'en') {
  if (lang !== 'hi') return ARIES_PADA_COMPARISON
  return ARIES_PADA_COMPARISON.map(row => ({ ...row, ...ARIES_PADA_HI[row.nakshatraIndex] }))
}

// ── Gana career implications ──────────────────────────────────

export const GANA_CAREER_INFO: Record<CareerGana, GanaCareerInfo> = {
  Deva: {
    gana: 'Deva',
    theme: 'Growth and expansion; building systems',
    strength: 'Building and expanding systems; teaching; advising',
    pitfall: 'Over-idealism',
    pitfallDamage: 'Sets unrealistic standards, loses practical grip and is easily disappointed',
    solution: 'Keep expectations grounded and accept practical imperfections',
    examples: ['Ashwini', 'Mrigashira', 'Punarvasu', 'Pushya', 'Hasta', 'Anuradha', 'Shravana', 'Revati'],
  },
  Manushya: {
    gana: 'Manushya',
    theme: 'Practical, Business & Execution',
    strength: 'Commerce, media, management, execution',
    pitfall: 'Greed',
    pitfallDamage: 'Spreads too thin, chases everything and cannot commit to one path',
    solution: 'Choose ONE main path; go deep before going wide',
    examples: ['Bharani', 'Rohini', 'Ardra', 'Purva Phalguni', 'Uttara Phalguni', 'Swati', 'Dhanishtha', 'Shatabhisha', 'Purva Ashadha', 'Uttara Ashadha', 'Purva Bhadrapada'],
  },
  Rakshasa: {
    gana: 'Rakshasa',
    theme: 'Power & Control',
    strength: 'Strategy, intelligence, transformation, politics',
    pitfall: 'Control obsession',
    pitfallDamage: 'Alienates colleagues, micromanages and creates toxic environments',
    solution: 'Learn to delegate, trust the process and let go of control',
    examples: ['Krittika', 'Ashlesha', 'Magha', 'Chitra', 'Vishakha', 'Jyeshtha', 'Mula'],
  },
}

// ── Pada execution styles ─────────────────────────────────────

export const PADA_CAREER_STYLES: Record<Rashi, PadaCareerStyle> = {
  1:  { rashi: 1,  energy: 'Action, Risk, Startup energy', executionStyle: 'Fast, aggressive, first-mover', exampleProfessions: 'Emergency doctor, entrepreneur, military officer' },
  2:  { rashi: 2,  energy: 'Finance, Value, Assets, Healing', executionStyle: 'Steady, value-building', exampleProfessions: 'Wealth manager, healer, asset builder' },
  3:  { rashi: 3,  energy: 'Communication, Ideas, Media', executionStyle: 'Quick ideas, brainstorming', exampleProfessions: 'Startup marketer, branding expert, communicator' },
  4:  { rashi: 4,  energy: 'Care, Public, Hospitality, Nurturing', executionStyle: 'Emotional, caring approach', exampleProfessions: 'Therapist, Caregiver, Hospitality professional' },
  5:  { rashi: 5,  energy: 'Authority, Leadership, Command', executionStyle: 'Commanding, visible', exampleProfessions: 'Leader, director, public authority figure' },
  6:  { rashi: 6,  energy: 'Analysis, Process, Precision', executionStyle: 'Methodical, detail-oriented', exampleProfessions: 'Analyst, process engineer, quality controller' },
  7:  { rashi: 7,  energy: 'Business, Negotiation, Partnerships', executionStyle: 'Balanced, deal-making', exampleProfessions: 'Businessman, Negotiator, Mediator' },
  8:  { rashi: 8,  energy: 'Research, Secrecy, Depth', executionStyle: 'Investigative, hidden', exampleProfessions: 'Researcher, Intelligence officer, Investigator' },
  9:  { rashi: 9,  energy: 'Teaching, Law, Travel, Philosophy', executionStyle: 'Expansive, principled', exampleProfessions: 'Teacher, Lawyer, Traveler, Philosopher' },
  10: { rashi: 10, energy: 'Administration, Structure, Governance', executionStyle: 'Structured, disciplined', exampleProfessions: 'Administrator, Bureaucrat, Manager' },
  11: { rashi: 11, energy: 'Technology, Innovation, Systems', executionStyle: 'Innovative, systemic', exampleProfessions: 'Tech professional, innovator, system designer' },
  12: { rashi: 12, energy: 'Creativity, Spirituality, Imagination', executionStyle: 'Creative, intuitive', exampleProfessions: 'Artist, spiritual guide, creative professional' },
}

/** Ashwini pada detail example (illustrative of pada layering) */
export const ASHWINI_PADA_DETAILS = [
  { pada: 1, navamsa: 'Aries', combo: 'Ashwini (speed) + Aries (action)', expression: 'Emergency action roles', roles: 'Emergency doctor, disaster management, first responder' },
  { pada: 2, navamsa: 'Taurus', combo: 'Ashwini (healing) + Taurus (assets and value)', expression: 'Healing + asset building', roles: 'A healer who owns a practice or clinic; managing health assets' },
  { pada: 3, navamsa: 'Gemini', combo: 'Ashwini (initiation) + Gemini (ideas)', expression: 'Fast idea generation', roles: 'Startup founder, marketing strategist, branding expert' },
  { pada: 4, navamsa: 'Cancer', combo: 'Ashwini (care) + Cancer (nurturing)', expression: 'Emotional healing and care', roles: 'Therapist, emotional caregiver, nurturing doctor' },
]

/** Same Aries (1st) pada across different nakshatras */
export const ARIES_PADA_COMPARISON = [
  { nakshatraIndex: 0, base: 'Speed, Initiation', ariesAdds: 'Aggressive action', expression: 'Emergency doctor, disaster management, fast first mover' },
  { nakshatraIndex: 3, base: 'Growth, Value multiplication', ariesAdds: 'Aggressive growth', expression: 'Aggressive business growth; out-of-turn promotions (IPS, paramilitary)' },
  { nakshatraIndex: 6, base: 'Restore, Improve', ariesAdds: 'Action-oriented consulting', expression: 'A consultant who quickly restarts or rebuilds organisations' },
  { nakshatraIndex: 9, base: 'Legacy, Authority', ariesAdds: 'Aggressive authority', expression: 'Politics, Assertive authority roles' },
  { nakshatraIndex: 12, base: 'Hands-on skill', ariesAdds: 'Skilled fast action', expression: 'A skilled, fast craftsperson; an action-oriented designer' },
  { nakshatraIndex: 15, base: 'Obsessive goal', ariesAdds: 'Aggressive goal pursuit', expression: 'High-performance sales, Aggressive politics' },
]

// ── Planet skills ─────────────────────────────────────────────

export const PLANET_CAREER_SKILLS: PlanetCareerSkill[] = [
  { planet: 'Su', skill: 'Authority, Command', positive: 'Leadership, Government, Direction', ifWeak: 'Cannot hold on to authority; loses positions' },
  { planet: 'Mo', skill: 'Public connection, Emotion', positive: 'Mass appeal, Public-facing roles', ifWeak: 'Dissatisfied; no emotional fulfillment' },
  { planet: 'Ma', skill: 'Action, Drive, Energy', positive: 'Execution, military precision, sports', ifWeak: 'Cannot execute; paralysis' },
  { planet: 'Me', skill: 'Intelligence, Communication', positive: 'Analysis, writing, tech, trade', ifWeak: 'Poor communication; missed opportunities' },
  { planet: 'Ju', skill: 'Wisdom, Expansion', positive: 'Teaching, advising, philosophy', ifWeak: 'Poor judgment; misguided decisions' },
  { planet: 'Ve', skill: 'Attraction, Charm, Beauty', positive: 'Art, luxury, entertainment', ifWeak: 'Unattractive output; lacks appeal' },
  { planet: 'Sa', skill: 'Structure, Discipline', positive: 'Administration, long-term building', ifWeak: 'No structure; chaotic work' },
  { planet: 'Ra', skill: 'Innovation, Disruption', positive: 'Technology, foreign, unconventional', ifWeak: 'Erratic; unstable unconventional path' },
  { planet: 'Ke', skill: 'Detachment, Insight', positive: 'Research, spirituality, deep focus', ifWeak: 'Cannot let go; depth gets scattered' },
]

export function getPlanetCareerSkill(id: GrahaId, lang: EngineLang = 'en'): PlanetCareerSkill | undefined {
  const en = PLANET_CAREER_SKILLS.find(p => p.planet === id)
  if (!en || lang !== 'hi') return en
  const hi = PLANET_SKILL_TEXT_HI[id]
  return hi?.skill ? { ...en, ...hi } : en
}

export function listPlanetCareerSkills(lang: EngineLang = 'en'): PlanetCareerSkill[] {
  return lang === 'hi'
    ? PLANET_CAREER_SKILLS.map(p => getPlanetCareerSkill(p.planet, 'hi') ?? p)
    : PLANET_CAREER_SKILLS
}

function localizeCombo(en: PlanetNakshatraCareerCombo): PlanetNakshatraCareerCombo {
  return {
    ...en,
    skill: COMBO_SKILL_HI[en.skill] ?? en.skill,
    expression: NP_FIELD_HI[en.expression] ?? en.expression,
    notes: COMBO_NOTES_HI[`${en.planet}:${en.nakshatraIndex}`] ?? en.notes,
  }
}

export function listPlanetNakshatraCareerCombos(lang: EngineLang = 'en'): PlanetNakshatraCareerCombo[] {
  return lang === 'hi' ? PLANET_NAKSHATRA_CAREER_COMBOS.map(localizeCombo) : PLANET_NAKSHATRA_CAREER_COMBOS
}

export function listCareerDiagnosis(lang: EngineLang = 'en'): CareerDiagnosisRow[] {
  if (lang !== 'hi') return CAREER_DIAGNOSIS
  return CAREER_DIAGNOSIS.map(row => ({
    nakshatraIndex: row.nakshatraIndex,
    behaviorStyle: PROFESSION_PROSE_HI[row.nakshatraIndex].workingStyle,
    careerDirection: NP_DIRECTION_HI[row.nakshatraIndex] ?? row.careerDirection,
  }))
}

export function listNakshatraLordChain(lang: EngineLang = 'en') {
  if (lang !== 'hi') return NAKSHATRA_LORD_CHAIN
  return NAKSHATRA_LORD_CHAIN.map(row => ({ ...row, meaning: LORD_MEANING_HI[row.lord] || row.meaning }))
}

// ── Planet + nakshatra career combinations ────────────────────

export const PLANET_NAKSHATRA_CAREER_COMBOS: PlanetNakshatraCareerCombo[] = [
  { planet: 'Su', skill: 'Authority', nakshatraIndex: 9,  expression: 'IAS, IFS, administrative services, corporate authority', notes: 'Government/Corporate authority' },
  { planet: 'Su', skill: 'Authority', nakshatraIndex: 20, expression: 'Administrative service, disciplined authority', notes: 'Long-term government roles' },
  { planet: 'Su', skill: 'Authority', nakshatraIndex: 15, expression: 'Political strategist, Policy maker', notes: 'Strategic authority' },
  { planet: 'Su', skill: 'Authority', nakshatraIndex: 21, expression: 'Public speaker, authority figure in the media', notes: 'Communication authority' },
  { planet: 'Su', skill: 'Authority', nakshatraIndex: 8,  expression: 'Hidden power, Intelligence roles', notes: 'Covert authority' },
  { planet: 'Mo', skill: 'Public emotion', nakshatraIndex: 3,  expression: 'Luxury, Hospitality industry', notes: 'Value + care combined' },
  { planet: 'Mo', skill: 'Public emotion', nakshatraIndex: 14, expression: 'Business, Trade', notes: 'Independent commerce' },
  { planet: 'Mo', skill: 'Public emotion', nakshatraIndex: 23, expression: 'Psychology and healing — always healing something', notes: 'Isolated healing' },
  { planet: 'Mo', skill: 'Public emotion', nakshatraIndex: 16, expression: 'Networking-based career', notes: 'Relationship-driven work' },
  { planet: 'Ma', skill: 'Action, Drive', nakshatraIndex: 2,  expression: 'Surgeon, Military (direction matters)', notes: 'Sharp cutting action' },
  { planet: 'Ma', skill: 'Action, Drive', nakshatraIndex: 22, expression: 'Operations, engineering, production management, teaching music or dance', notes: 'Timed action' },
  { planet: 'Ma', skill: 'Action, Drive', nakshatraIndex: 18, expression: 'Demolition, research based on deconstruction, breaking down systems', notes: 'Root-level action' },
  { planet: 'Ma', skill: 'Action, Drive', nakshatraIndex: 17, expression: 'Intelligence work, senior administration, secretive positions of power', notes: 'Intelligent covert action' },
  { planet: 'Me', skill: 'Intelligence', nakshatraIndex: 0,  expression: 'Startup founder — quick, intelligent moves', notes: 'Fast intelligent initiation' },
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
  { planet: 'Sa', skill: 'Structure', nakshatraIndex: 23, expression: 'Solitary research, creative work done alone', notes: 'Structured isolation' },
  { planet: 'Sa', skill: 'Structure', nakshatraIndex: 16, expression: 'Corporate management, structured team environments', notes: 'Networked structure' },
  { planet: 'Ra', skill: 'Innovation', nakshatraIndex: 5,  expression: 'Revolution in tech or any field; complete disruption', notes: 'Disruptive innovation' },
  { planet: 'Ra', skill: 'Innovation', nakshatraIndex: 14, expression: 'Global business, Global organizations', notes: 'Independent global innovation' },
  { planet: 'Ra', skill: 'Innovation', nakshatraIndex: 23, expression: 'AI, space engineering, cutting-edge research', notes: 'Future-tech innovation' },
  { planet: 'Ke', skill: 'Detachment', nakshatraIndex: 18, expression: 'Occult, Deep root-level research', notes: 'Detached deep inquiry' },
  { planet: 'Ke', skill: 'Detachment', nakshatraIndex: 0,  expression: 'Spiritual healer', notes: 'Healing through detachment' },
  { planet: 'Ke', skill: 'Detachment', nakshatraIndex: 26, expression: 'Guide, counsellor, one who shows the path to moksha', notes: 'Completion through guidance' },
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
  0: 'Speed-based roles in that planet’s domain',
  1: 'Roles of authority or pressure in that planet’s domain',
  2: 'Surgical or analytical roles in that planet’s domain',
  3: 'Value-creating roles in that planet’s domain',
  4: 'Research or sales roles in that planet’s domain',
  5: 'Tech or disruptive roles in that planet’s domain',
  6: 'Teaching or advisory roles in that planet’s domain',
  7: 'Supportive or nurturing roles in that planet’s domain',
  8: 'Political or psychological roles in that planet’s domain',
  9: 'Leadership or legacy roles in that planet’s domain',
  10: 'Entertainment or media roles in that planet’s domain',
  11: 'Long-term, structured roles in that planet’s domain',
  12: 'Manual or craft roles in that planet’s domain',
  13: 'Design or architectural roles in that planet’s domain',
  14: 'Entrepreneurial roles in that planet’s domain',
  15: 'Goal-driven roles in that planet’s domain',
  16: 'Relationship-based roles in that planet’s domain',
  17: 'Covert or senior roles in that planet’s domain',
  18: 'Research or demolition roles in that planet’s domain',
  19: 'Persuasion or marketing roles in that planet’s domain',
  20: 'Long-term government or corporate roles in that planet’s domain',
  21: 'Communication or media roles in that planet’s domain',
  22: 'Operations or music roles in that planet’s domain',
  23: 'Solitary research roles in that planet’s domain',
  24: 'Extreme or philosophical roles in that planet’s domain',
  25: 'Roles of deep mastery in that planet’s domain',
  26: 'Mentoring or guiding roles in that planet’s domain',
}

for (const row of CAREER_DIAGNOSIS) {
  const override = DIAGNOSIS_OVERRIDES[row.nakshatraIndex]
  if (override) row.careerDirection = override
}

// ── Nakshatra lord chain ──────────────────────────────────────

export const NAKSHATRA_LORD_CHAIN: { lord: GrahaId; nakshatraIndices: number[]; meaning: string }[] = [
  { lord: 'Ke', nakshatraIndices: [0, 9, 18], meaning: 'Spiritual direction and detachment from the mainstream' },
  { lord: 'Ve', nakshatraIndices: [1, 10, 19], meaning: 'Attraction, luxury and pleasure in career' },
  { lord: 'Su', nakshatraIndices: [2, 11, 20], meaning: 'Authority, government, structured power' },
  { lord: 'Mo', nakshatraIndices: [3, 12, 21], meaning: 'Public, emotion, mass connection' },
  { lord: 'Ma', nakshatraIndices: [4, 13, 22], meaning: 'Action, engineering, rhythm' },
  { lord: 'Ra', nakshatraIndices: [5, 14, 23], meaning: 'Innovation, technology, disruption' },
  { lord: 'Ju', nakshatraIndices: [6, 15, 24], meaning: 'Wisdom, teaching, philosophy' },
  { lord: 'Sa', nakshatraIndices: [7, 16, 25], meaning: 'Structure, discipline, long-term mastery' },
  { lord: 'Me', nakshatraIndices: [8, 17, 26], meaning: 'Intelligence, communication, guidance' },
]

// ── Chart-aware helpers ───────────────────────────────────────

export function getCareerIndicators(chart: ChartOutput, lang: EngineLang = 'en'): CareerIndicatorResult[] {
  const hi = lang === 'hi'
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
    const profile = getNakshatraProfession(nakIdx, lang)
    return {
      key,
      label: hi ? NP_INDICATOR_LABEL_HI[key] : label,
      priority,
      reveals: hi ? INDICATOR_REVEALS_HI[key] : reveals,
      planetId,
      planetName: planetId ? (hi ? GRAHA_HI[planetId] : GRAHA_NAMES[planetId]) : '—',
      nakshatraIndex: nakIdx,
      nakshatraName: hi ? (NAKSHATRA_HI[nakIdx] ?? profile.name) : (NAKSHATRA_NAMES[nakIdx] ?? profile.name),
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
      'Career Blueprint — the overall design and direction of the profession',
      tenthLordId,
      tenthLord?.nakshatraIndex ?? 0,
      tenthLord?.pada ?? 1,
    ),
    make(
      'moon',
      'Moon',
      'SECONDARY',
      'Satisfaction, passion and emotional fulfilment — will there be joy?',
      'Mo',
      moon?.nakshatraIndex ?? 0,
      moon?.pada ?? 1,
    ),
    make(
      'rahu',
      'Rahu',
      'TERTIARY',
      'An unconventional path — a sudden rise OR a sudden fall',
      'Ra',
      rahu?.nakshatraIndex ?? 0,
      rahu?.pada ?? 1,
    ),
  ]
}

export function buildCareerFormula(chart: ChartOutput, lang: EngineLang = 'en'): CareerFormulaResult {
  const hi = lang === 'hi'
  const indicators = getCareerIndicators(chart, lang)
  const primary = indicators[0]
  const skill = getPlanetCareerSkill(primary.planetId ?? 'Sa', lang)
  const padaStyle = padaCareerStyle(primary.padaRashi, lang)
  const diagnosis = (hi ? listCareerDiagnosis('hi') : CAREER_DIAGNOSIS)[primary.nakshatraIndex]

  const planetName = primary.planetName
  const planetSkill = skill?.skill ?? (hi ? SKILL_FALLBACK_HI : 'Skill')
  const nakshatraHow = primary.profile.hiddenPower
  const nakshatraName = primary.nakshatraName
  const houseWhere = hi ? HOUSE_WHERE_HI : 'The 10th house — the domain of public career'
  const padaExecution = padaStyle.executionStyle
  const padaRashiName = hi ? RASHI_HI[primary.padaRashi] : RASHI_NAMES[primary.padaRashi]

  return {
    planetSkill,
    planetName,
    nakshatraHow,
    nakshatraName,
    houseWhere,
    padaExecution,
    padaRashiName,
    summary: hi
      ? fill(NP_SUMMARY_HI, {
        planet: planetName,
        skill: planetSkill,
        nakshatra: nakshatraName,
        how: nakshatraHow,
        style: padaExecution,
        pada: padaRashiName,
        direction: diagnosis.careerDirection,
      })
      : `${planetName} (${planetSkill}) via ${nakshatraName} (${nakshatraHow}) in ${houseWhere}, executed ${padaExecution.toLowerCase()} (${padaRashiName} pada) → ${diagnosis.careerDirection}`,
  }
}

export function getMatchingCombosForChart(chart: ChartOutput, lang: EngineLang = 'en'): PlanetNakshatraCareerCombo[] {
  const grahas = chart.grahas.filter(g => !['Ur', 'Ne', 'Pl'].includes(g.id))
  return grahas.flatMap(g => {
    const hit = findPlanetNakshatraCombo(g.id, g.nakshatraIndex)
    if (!hit) return []
    return [lang === 'hi' ? localizeCombo(hit) : hit]
  })
}
