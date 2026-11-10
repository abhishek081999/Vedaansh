// ─────────────────────────────────────────────────────────────
//  src/lib/engine/nakshatraDeepGuide/types.ts
//  Encyclopedic teaching notes per nakshatra (theory, deity,
//  mythology, padas, planet-in-pada results). Educational only.
// ─────────────────────────────────────────────────────────────

import type { GrahaId } from '@/types/astrology'

/** Planets that appear in pada-result tables (includes nodes). */
export type NakshatraGuidePlanet = Extract<GrahaId, 'Su' | 'Mo' | 'Ma' | 'Me' | 'Ju' | 'Ve' | 'Sa' | 'Ra' | 'Ke'>

export interface NakshatraPadaGuide {
  pada: 1 | 2 | 3 | 4
  /** Sidereal span, e.g. "0°00′–3°20′ Aries" */
  span: string
  /** Navamsa sign name */
  navamsa: string
  summary: string
}

export interface NakshatraDeepGuide {
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
  lagnaNotes: string
  planetEffects: Partial<Record<NakshatraGuidePlanet, string>>
  padas: [NakshatraPadaGuide, NakshatraPadaGuide, NakshatraPadaGuide, NakshatraPadaGuide]
  /** Pada 1–4 result lines per planet when available */
  planetPadaResults: Partial<Record<NakshatraGuidePlanet, [string, string, string, string]>>
}
