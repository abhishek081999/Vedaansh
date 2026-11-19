// ─────────────────────────────────────────────────────────────
//  src/lib/engine/functionalNature.ts
//  Functional benefics and malefics by lagna, as taught from
//  Laghu Parashari (Uḍu Dāya Pradīpa) and its standard summaries.
//  The yogakaraka comes from dasha/yogakaraka.ts. Rahu and Ketu are
//  not listed: they act for their dispositor.
//
//  Pure data; safe for the browser and the engine.
// ─────────────────────────────────────────────────────────────

import type { GrahaId, Rashi } from '@/types/astrology'

export interface LagnaFunctionalNature {
  benefics: GrahaId[]
  malefics: GrahaId[]
}

export const FUNCTIONAL_NATURE: Record<Rashi, LagnaFunctionalNature> = {
  1:  { benefics: ['Su', 'Ju', 'Ma'], malefics: ['Me', 'Ve', 'Sa'] },          // Aries
  2:  { benefics: ['Sa', 'Su', 'Me', 'Ve'], malefics: ['Ju', 'Mo'] },          // Taurus (Venus as lagna lord stays auspicious)
  3:  { benefics: ['Ve', 'Me'],       malefics: ['Ma', 'Ju', 'Su'] },          // Gemini
  4:  { benefics: ['Ma', 'Ju', 'Mo'], malefics: ['Ve', 'Me'] },                // Cancer
  5:  { benefics: ['Ma', 'Su', 'Ju'], malefics: ['Me', 'Ve', 'Sa'] },          // Leo
  6:  { benefics: ['Ve', 'Me'],       malefics: ['Ma', 'Ju', 'Mo'] },          // Virgo
  7:  { benefics: ['Sa', 'Me', 'Ve'], malefics: ['Ju', 'Su', 'Ma'] },          // Libra
  8:  { benefics: ['Ju', 'Mo', 'Su', 'Ma'], malefics: ['Me', 'Ve'] },          // Scorpio
  9:  { benefics: ['Ma', 'Su', 'Ju'], malefics: ['Ve', 'Me'] },                // Sagittarius
  10: { benefics: ['Ve', 'Me', 'Sa'], malefics: ['Ma', 'Ju', 'Mo'] },          // Capricorn
  11: { benefics: ['Ve', 'Sa'],       malefics: ['Ju', 'Mo', 'Ma'] },          // Aquarius
  12: { benefics: ['Mo', 'Ma', 'Ju'], malefics: ['Sa', 'Ve', 'Su', 'Me'] },    // Pisces
}

export type FunctionalClass = 'benefic' | 'malefic' | 'neutral'

export function functionalClass(ascRashi: Rashi, graha: GrahaId): FunctionalClass {
  const row = FUNCTIONAL_NATURE[ascRashi]
  if (row.benefics.includes(graha)) return 'benefic'
  if (row.malefics.includes(graha)) return 'malefic'
  return 'neutral'
}
