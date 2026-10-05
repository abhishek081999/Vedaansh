// ─────────────────────────────────────────────────────────────
//  src/lib/engine/tithiMeta.ts
//  Classical tithi groups (Nanda–Purna), deities, and day guidance.
//  Lunar-day index 1–15 applies to both shukla and krishna paksha.
// ─────────────────────────────────────────────────────────────

import type { Rashi } from '@/types/astrology'
import { RASHI_NAMES } from '@/types/astrology'

export type TithiGroupId = 'Nanda' | 'Bhadra' | 'Jaya' | 'Rikta' | 'Purna'

export type TithiElement = 'Agni' | 'Prithvi' | 'Akash' | 'Vayu' | 'Jal'

export type TithiNature = 'shubh' | 'ashubh'

export interface TithiGroupMeta {
  id:            TithiGroupId
  lunarDays:     readonly [number, number, number]
  element:       TithiElement
  elementLabel:  string
  meaning:       string
  nature:        TithiNature
  peopleTraits:  string
  dayGuidance:   string
}

export interface TithiDayMeta {
  /** 1–15 lunar day within paksha (15 = Purnima or Amavasya) */
  lunarDay:      number
  name:          string
  group:         TithiGroupMeta
  deity:         string
  significance:  string
  bestFor:       string
  /** Graha traditionally linked to this lunar day in some lineages */
  ruler:         string
  temperament:   string
}

const GROUPS: Record<TithiGroupId, TithiGroupMeta> = {
  Nanda: {
    id: 'Nanda',
    lunarDays: [1, 6, 11],
    element: 'Agni',
    elementLabel: 'Agni (Fire)',
    meaning: 'Joyful',
    nature: 'shubh',
    peopleTraits: 'Optimistic, creative, growth-loving',
    dayGuidance: 'Favour creative starts, celebration, and growth-oriented work.',
  },
  Bhadra: {
    id: 'Bhadra',
    lunarDays: [2, 7, 12],
    element: 'Prithvi',
    elementLabel: 'Prithvi (Earth)',
    meaning: 'Auspicious',
    nature: 'shubh',
    peopleTraits: 'Strong willpower, ambitious, overcome challenges',
    dayGuidance: 'Good for steady progress, agreements, and grounded effort.',
  },
  Jaya: {
    id: 'Jaya',
    lunarDays: [3, 8, 13],
    element: 'Akash',
    elementLabel: 'Akash (Ether)',
    meaning: 'Victorious',
    nature: 'shubh',
    peopleTraits: 'Win disputes; suited to leadership and advocacy',
    dayGuidance: 'Supports contests, negotiations, and decisive leadership.',
  },
  Rikta: {
    id: 'Rikta',
    lunarDays: [4, 9, 14],
    element: 'Vayu',
    elementLabel: 'Vayu (Air)',
    meaning: 'Empty',
    nature: 'ashubh',
    peopleTraits: 'Face struggles; need self-evaluation and introspection',
    dayGuidance: 'Avoid lasting foundations; prefer review, austerity, and clearing work.',
  },
  Purna: {
    id: 'Purna',
    lunarDays: [5, 10, 15],
    element: 'Jal',
    elementLabel: 'Jal (Water)',
    meaning: 'Complete',
    nature: 'shubh',
    peopleTraits: 'Balanced, seek completeness, high spiritual potential',
    dayGuidance: 'Favour completion, fulfilment, and spiritually oriented acts.',
  },
}

/** Lunar day 1–15 → group */
const GROUP_BY_LUNAR_DAY: TithiGroupId[] = [
  'Nanda',  // 1 Pratipada
  'Bhadra', // 2
  'Jaya',   // 3
  'Rikta',  // 4
  'Purna',  // 5
  'Nanda',  // 6
  'Bhadra', // 7
  'Jaya',   // 8
  'Rikta',  // 9
  'Purna',  // 10
  'Nanda',  // 11
  'Bhadra', // 12
  'Jaya',   // 13
  'Rikta',  // 14
  'Purna',  // 15 Purnima / Amavasya
]

interface TithiDaySeed {
  name: string
  deity: string
  significance: string
  bestFor: string
  ruler: string
  temperament: string
}

/** Index 0 = lunar day 1 … 14 = lunar day 15 (Purnima). Amavasya overrides name/deity. */
const DAY_SEEDS: TithiDaySeed[] = [
  {
    name: 'Pratipada',
    deity: 'Brahma',
    significance: 'Beginning of creation',
    bestFor: 'New ventures, growth',
    ruler: 'Moon',
    temperament: 'Imaginative and creative; needs patience to finish what is started.',
  },
  {
    name: 'Dwitiya',
    deity: 'Ashwini Kumars',
    significance: 'Healing, stability',
    bestFor: 'Partnerships, agreements',
    ruler: 'Mars',
    temperament: 'Confident and action-oriented; watch impulsiveness.',
  },
  {
    name: 'Tritiya',
    deity: 'Parvati, Mangal',
    significance: 'Akshaya Tritiya, marital happiness',
    bestFor: 'Marriages, creative work',
    ruler: 'Mercury',
    temperament: 'Quick-thinking and communicative; channel restless intellect.',
  },
  {
    name: 'Chaturthi',
    deity: 'Ganesha, Yama',
    significance: 'Wisdom, obstacle removal',
    bestFor: 'Discipline, intelligence work',
    ruler: 'Rahu',
    temperament: 'Investigative and questioning; good for research, not foundations.',
  },
  {
    name: 'Panchami',
    deity: 'Nagas, Brahma',
    significance: 'Protection, wealth',
    bestFor: 'New business, medical treatments',
    ruler: 'Jupiter',
    temperament: 'Expansive and knowledge-seeking; favours learning and teaching.',
  },
  {
    name: 'Shashthi',
    deity: 'Kartikeya',
    significance: 'Victory, power',
    bestFor: 'Leadership, conflict resolution',
    ruler: 'Venus',
    temperament: 'Attractive energy; balance comfort with purposeful action.',
  },
  {
    name: 'Saptami',
    deity: 'Surya',
    significance: 'Energy, health',
    bestFor: 'Travel, treatment starts',
    ruler: 'Sun',
    temperament: 'Leadership drive and vitality; temper ego with service.',
  },
  {
    name: 'Ashtami',
    deity: 'Rudra, Durga, Krishna',
    significance: 'Transformation, balance',
    bestFor: 'Intense effort tasks, quick results',
    ruler: 'Moon',
    temperament: 'Deep and transformative; emotional intensity runs high.',
  },
  {
    name: 'Navami',
    deity: 'Durga, Rama',
    significance: 'Shakti worship, justice',
    bestFor: 'Legal matters, disputes',
    ruler: 'Mars',
    temperament: 'Strong-willed and dynamic; suited to decisive contests.',
  },
  {
    name: 'Dashami',
    deity: 'Yama',
    significance: 'Victory (Dussehra)',
    bestFor: 'Journeys, dharma yatra',
    ruler: 'Mercury',
    temperament: 'Analytical and practical; strong for planning and execution.',
  },
  {
    name: 'Ekadashi',
    deity: 'Vishnu',
    significance: 'Moksha, purification',
    bestFor: 'Fasting, spiritual activities',
    ruler: 'Jupiter',
    temperament: 'High spiritual potential; discipline and sadhana yield results.',
  },
  {
    name: 'Dwadashi',
    deity: 'Vishnu, Surya',
    significance: 'Breaking Ekadashi fast',
    bestFor: 'Charitable works',
    ruler: 'Venus',
    temperament: 'Harmonious and service-minded; good for dana and relationships.',
  },
  {
    name: 'Trayodashi',
    deity: 'Kamadeva, Shiva',
    significance: 'Love, desire fulfilment',
    bestFor: 'Pradosh Vrat, beauty-related work',
    ruler: 'Ketu',
    temperament: 'Sensitive and service-oriented; creative yet grounded.',
  },
  {
    name: 'Chaturdashi',
    deity: 'Shiva',
    significance: 'Struggle, transformation',
    bestFor: 'Overcoming enemies, addictions',
    ruler: 'Saturn',
    temperament: 'Austerity and tapasya; heavy energies favour clearing work.',
  },
  {
    name: 'Purnima',
    deity: 'Chandra, Lakshmi',
    significance: 'Completion, prosperity',
    bestFor: 'Completing projects, festivals',
    ruler: 'Moon',
    temperament: 'Emotionally clear and fulfilled; strong for completion rites.',
  },
]

const AMAVASYA_SEED: TithiDaySeed = {
  name: 'Amavasya',
  deity: 'Pitru, Kali',
  significance: 'Ancestral worship',
  bestFor: 'Shradh, spiritual practices',
  ruler: 'Rahu',
  temperament: 'Introspective and powerful for inner work, moksha, and pitru rites.',
}

/**
 * Map absolute tithi 1–30 → lunar day 1–15 within the paksha.
 * 15 = Purnima; 30 = Amavasya (also lunar day 15 for group/element).
 */
export function lunarDayFromTithi(tithiNumber1to30: number): number {
  const n = Math.min(30, Math.max(1, Math.floor(tithiNumber1to30)))
  return ((n - 1) % 15) + 1
}

export function getTithiGroup(tithiNumber1to30: number): TithiGroupMeta {
  const lunarDay = lunarDayFromTithi(tithiNumber1to30)
  return GROUPS[GROUP_BY_LUNAR_DAY[lunarDay - 1]]
}

export function isRiktaTithiNumber(tithiNumber1to30: number): boolean {
  return getTithiGroup(tithiNumber1to30).id === 'Rikta'
}

export function getTithiDayMeta(tithiNumber1to30: number): TithiDayMeta {
  const n = Math.min(30, Math.max(1, Math.floor(tithiNumber1to30)))
  const lunarDay = lunarDayFromTithi(n)
  const group = getTithiGroup(n)
  const seed = n === 30 ? AMAVASYA_SEED : DAY_SEEDS[lunarDay - 1]

  return {
    lunarDay,
    name: seed.name,
    group,
    deity: seed.deity,
    significance: seed.significance,
    bestFor: seed.bestFor,
    ruler: seed.ruler,
    temperament: seed.temperament,
  }
}

/** One-line cosmic-weather blurb for today’s tithi. */
export function formatTithiWeatherLine(meta: TithiDayMeta): string {
  const nature = meta.group.nature === 'shubh' ? 'Shubh' : 'Ashubh'
  return `${meta.group.id} · ${meta.group.elementLabel} · ${nature} — ${meta.group.dayGuidance}`
}

export function listTithiGroups(): TithiGroupMeta[] {
  return [GROUPS.Nanda, GROUPS.Bhadra, GROUPS.Jaya, GROUPS.Rikta, GROUPS.Purna]
}

// ── Tithi × Moon-sign affinity (traditional combination chart) ─
// One affinity rashi per lunar day; strongest when birth Moon is there.

export interface TithiMoonAffinity {
  lunarDay:          number
  tithiName:         string
  groupId:           TithiGroupId
  elementLabel:      string
  affinityRashi:     Rashi
  affinityRashiName: string
  positiveTendency:  string
  healthSensitivity: string
}

export interface TithiMoonComboResult extends TithiMoonAffinity {
  birthMoonRashi:     Rashi | null
  birthMoonRashiName: string | null
  /** True when birth Moon occupies the tithi’s traditional affinity sign */
  moonMatchesAffinity: boolean
  note: string
}

/**
 * Lunar-day affinity rashis from the classical combination chart.
 * 1→Mesha … 12→Mina, then Trayodashi→Mesha, Chaturdashi→Vrishchika,
 * Purnima/Amavasya→Mina.
 */
const AFFINITY_BY_LUNAR_DAY: Array<{
  rashi: Rashi
  positiveTendency: string
  healthSensitivity: string
}> = [
  { rashi: 1,  positiveTendency: 'Energetic, leadership qualities',        healthSensitivity: 'Headache, stress' },
  { rashi: 2,  positiveTendency: 'Emotional stability, grounded',          healthSensitivity: 'Digestive issues' },
  { rashi: 3,  positiveTendency: 'Versatile communication',                healthSensitivity: 'Dark thoughts, blood pressure' },
  { rashi: 4,  positiveTendency: 'Creative expression',                    healthSensitivity: 'Nervous system disorders' },
  { rashi: 5,  positiveTendency: 'Expressiveness, love',                   healthSensitivity: 'Hormonal imbalance' },
  { rashi: 6,  positiveTendency: 'High energy, expansion',                 healthSensitivity: 'Muscle strain' },
  { rashi: 7,  positiveTendency: 'Harmony, balance',                       healthSensitivity: 'Joint pain' },
  { rashi: 8,  positiveTendency: 'Deep transformation',                    healthSensitivity: 'Injuries, accidents' },
  { rashi: 9,  positiveTendency: 'Philosophical thinking',                 healthSensitivity: 'Breathing issues' },
  { rashi: 10, positiveTendency: 'Wisdom, practicality',                   healthSensitivity: 'Sleep disturbances' },
  { rashi: 11, positiveTendency: 'Detachment, spirituality',               healthSensitivity: 'Weakness from fasting / austerity' },
  { rashi: 12, positiveTendency: 'Compassion, service',                    healthSensitivity: 'Liver / bowel imbalance' },
  { rashi: 1,  positiveTendency: 'Wealth acquisition drive',               healthSensitivity: 'Hyperactivity' },
  { rashi: 8,  positiveTendency: 'Transformation power',                   healthSensitivity: 'Insomnia, ego issues, surgery sensitivity' },
  { rashi: 12, positiveTendency: 'Liberation (moksha) orientation',        healthSensitivity: 'Generally balanced' },
]

export function getTithiMoonAffinity(tithiNumber1to30: number): TithiMoonAffinity {
  const dayMeta = getTithiDayMeta(tithiNumber1to30)
  const row = AFFINITY_BY_LUNAR_DAY[dayMeta.lunarDay - 1]
  return {
    lunarDay: dayMeta.lunarDay,
    tithiName: dayMeta.name,
    groupId: dayMeta.group.id,
    elementLabel: dayMeta.group.elementLabel,
    affinityRashi: row.rashi,
    affinityRashiName: RASHI_NAMES[row.rashi],
    positiveTendency: row.positiveTendency,
    healthSensitivity: row.healthSensitivity,
  }
}

/**
 * Natal combination: birth tithi affinity vs actual birth Moon rashi.
 * Health lines are traditional sensitivities, not medical diagnosis.
 */
export function getTithiMoonCombo(
  tithiNumber1to30: number,
  birthMoonRashi?: Rashi | null,
): TithiMoonComboResult {
  const affinity = getTithiMoonAffinity(tithiNumber1to30)
  const moon = birthMoonRashi ?? null
  const matches = moon != null && moon === affinity.affinityRashi

  let note: string
  if (moon == null) {
    note = `Traditional affinity for ${affinity.tithiName} is ${affinity.affinityRashiName} Moon.`
  } else if (matches) {
    note = `Birth Moon in ${affinity.affinityRashiName} aligns with this tithi’s classical affinity — tendencies below are emphasised.`
  } else {
    note = `Birth Moon is in ${RASHI_NAMES[moon]}; classical ${affinity.tithiName} affinity is ${affinity.affinityRashiName}. Read both Moon sign and tithi temperament together.`
  }

  return {
    ...affinity,
    birthMoonRashi: moon,
    birthMoonRashiName: moon != null ? RASHI_NAMES[moon] : null,
    moonMatchesAffinity: matches,
    note,
  }
}
