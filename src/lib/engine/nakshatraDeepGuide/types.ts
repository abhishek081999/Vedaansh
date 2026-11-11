// ─────────────────────────────────────────────────────────────
//  src/lib/engine/nakshatraDeepGuide/types.ts
//  Encyclopedic teaching notes per nakshatra (theory, deity,
//  mythology, padas, planet-in-pada results). Educational only.
// ─────────────────────────────────────────────────────────────

import type { GrahaId } from '@/types/astrology'

/** Planets that appear in pada-result tables (includes nodes). */
export type NakshatraGuidePlanet = Extract<GrahaId, 'Su' | 'Mo' | 'Ma' | 'Me' | 'Ju' | 'Ve' | 'Sa' | 'Ra' | 'Ke'>

export type NakshatraGuna = 'Sattvic' | 'Rajasic' | 'Tamasic'

export interface NakshatraPadaGuide {
  pada: 1 | 2 | 3 | 4
  /** Sidereal span, e.g. "0°00′–3°20′ Aries" */
  span: string
  /** Navamsa sign name */
  navamsa: string
  summary: string
}

/** Encyclopedic columns shared by the 27 guides and Abhijit. */
export interface NakshatraEncyclopediaFields {
  guna: NakshatraGuna
  /** Element, e.g. "Prithvi (Earth)" */
  tattva: string
  /** Long-form CORE energy & essence */
  coreEnergy: string
  keySignifications: string[]
  /** Positive traits */
  coreCharacteristics: string[]
  /** Challenging traits */
  negativeTendencies: string[]
  spiritualTechniques: string[]
  careers: string[]
  specialNotes: string[]
}

/** Optional metadata overrides applied from the encyclopedia table. */
export interface NakshatraEncyclopediaMeta {
  deity?: string
  symbol?: string
  yoni?: string
  bodyPart?: string
}

export type NakshatraEncyclopediaEntry = NakshatraEncyclopediaFields & NakshatraEncyclopediaMeta

/**
 * Authored per-star data before encyclopedic columns are merged.
 * `coreCharacteristics` / `negativeTendencies` are replaced by the encyclopedia table.
 */
export type NakshatraDeepGuideSeed = Omit<
  NakshatraDeepGuide,
  | 'guna'
  | 'tattva'
  | 'coreEnergy'
  | 'keySignifications'
  | 'spiritualTechniques'
  | 'careers'
  | 'specialNotes'
>

export interface NakshatraDeepGuide extends NakshatraEncyclopediaFields {
  /** 0 = Ashwini … 26 = Revati */
  index: number
  name: string
  /** One practical keyword for the star */
  keyword: string
  degreeSpan: string
  /** Rashi coverage, e.g. "Aries" or "Aries–Taurus" */
  signs: string
  lord: NakshatraGuidePlanet
  lordName: string
  deity: string
  symbol: string
  yoni: string
  gana: 'Deva' | 'Manushya' | 'Rakshasa'
  nadi: 'Vata' | 'Pitta' | 'Kapha'
  colour: string
  bodyPart: string
  theory: string[]
  deityNotes: string[]
  rulerNotes: string[]
  rashiNotes: string[]
  symbolNotes: string[]
  mythology: string[]
  animalNotes: string[]
  doshaNotes: string[]
  /** Traditionally favourable ages (years) for natives of this nakshatra */
  goodAges: number[]
  /** Traditionally challenging ages (years) for natives of this nakshatra */
  badAges: number[]
  lagnaNotes: string
  planetEffects: Partial<Record<NakshatraGuidePlanet, string>>
  padas: [NakshatraPadaGuide, NakshatraPadaGuide, NakshatraPadaGuide, NakshatraPadaGuide]
  /** Pada 1–4 result lines per planet when available */
  planetPadaResults: Partial<Record<NakshatraGuidePlanet, [string, string, string, string]>>
}

/** Special 28th muhurta star — not part of the 0–26 index loop. */
export interface AbhijitDeepGuide extends NakshatraEncyclopediaFields {
  name: string
  keyword: string
  degreeSpan: string
  signs: string
  lordName: string
  deity: string
  symbol: string
  gana: string
  bodyPart: string
}
