// Hindi string overlays for nakshatraDeepGuide — same list lengths as English.
// Ids, gana/nadi/guna enums, and planet keys stay English.

import type { NakshatraGuidePlanet } from '@/lib/engine/nakshatraDeepGuide/types'

export interface NakshatraPadaGuideHi {
  span: string
  navamsa: string
  summary: string
}

/** Hindi overlay for encyclopedic columns (guna stays English enum). */
export interface NakshatraEncyclopediaHi {
  tattva: string
  coreEnergy: string
  keySignifications: string[]
  coreCharacteristics: string[]
  negativeTendencies: string[]
  spiritualTechniques: string[]
  careers: string[]
  specialNotes: string[]
  deity?: string
  symbol?: string
  yoni?: string
  bodyPart?: string
}

export interface NakshatraDeepGuideHi {
  keyword: string
  degreeSpan: string
  signs: string
  lordName: string
  deity: string
  symbol: string
  yoni: string
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
  /** Replaced by encyclopedia HI when present */
  coreCharacteristics: string[]
  negativeTendencies: string[]
  lagnaNotes: string
  planetEffects: Partial<Record<NakshatraGuidePlanet, string>>
  padas: [NakshatraPadaGuideHi, NakshatraPadaGuideHi, NakshatraPadaGuideHi, NakshatraPadaGuideHi]
  planetPadaResults: Partial<Record<NakshatraGuidePlanet, [string, string, string, string]>>
}

export interface AbhijitDeepGuideHi extends NakshatraEncyclopediaHi {
  keyword: string
  degreeSpan: string
  signs: string
  lordName: string
  deity: string
  symbol: string
  gana: string
  bodyPart: string
}
