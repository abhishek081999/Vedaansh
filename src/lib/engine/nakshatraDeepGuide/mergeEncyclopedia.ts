// ─────────────────────────────────────────────────────────────
//  Merge encyclopedic table columns onto a deep-guide seed.
// ─────────────────────────────────────────────────────────────

import type {
  AbhijitDeepGuide,
  NakshatraDeepGuide,
  NakshatraDeepGuideSeed,
  NakshatraEncyclopediaEntry,
  NakshatraEncyclopediaFields,
} from './types'
import type { AbhijitDeepGuideHi, NakshatraEncyclopediaHi } from '@/lib/engine/locale/nakshatraDeepGuide/types'

export function mergeEncyclopedia(
  seed: NakshatraDeepGuideSeed,
  enc: NakshatraEncyclopediaEntry,
): NakshatraDeepGuide {
  return {
    ...seed,
    guna: enc.guna,
    tattva: enc.tattva,
    coreEnergy: enc.coreEnergy,
    keySignifications: enc.keySignifications,
    coreCharacteristics: enc.coreCharacteristics,
    negativeTendencies: enc.negativeTendencies,
    spiritualTechniques: enc.spiritualTechniques,
    careers: enc.careers,
    specialNotes: enc.specialNotes,
    deity: enc.deity ?? seed.deity,
    symbol: enc.symbol ?? seed.symbol,
    yoni: enc.yoni ?? seed.yoni,
    bodyPart: enc.bodyPart ?? seed.bodyPart,
  }
}

export function mergeEncyclopediaHi(
  guide: NakshatraDeepGuide,
  hi: NakshatraEncyclopediaHi | undefined,
): NakshatraDeepGuide {
  if (!hi) return guide
  const list = (en: string[], overlay: string[] | undefined) =>
    overlay && overlay.length === en.length ? overlay : en
  return {
    ...guide,
    tattva: hi.tattva || guide.tattva,
    coreEnergy: hi.coreEnergy || guide.coreEnergy,
    keySignifications: list(guide.keySignifications, hi.keySignifications),
    coreCharacteristics: list(guide.coreCharacteristics, hi.coreCharacteristics),
    negativeTendencies: list(guide.negativeTendencies, hi.negativeTendencies),
    spiritualTechniques: list(guide.spiritualTechniques, hi.spiritualTechniques),
    careers: list(guide.careers, hi.careers),
    specialNotes: list(guide.specialNotes, hi.specialNotes),
    deity: hi.deity ?? guide.deity,
    symbol: hi.symbol ?? guide.symbol,
    yoni: hi.yoni ?? guide.yoni,
    bodyPart: hi.bodyPart ?? guide.bodyPart,
  }
}

export function localizeAbhijitDeepGuide(
  en: AbhijitDeepGuide,
  hi: AbhijitDeepGuideHi | undefined,
): AbhijitDeepGuide {
  if (!hi) return en
  const list = (a: string[], b: string[] | undefined) =>
    b && b.length === a.length ? b : a
  return {
    ...en,
    keyword: hi.keyword,
    degreeSpan: hi.degreeSpan,
    signs: hi.signs,
    lordName: hi.lordName,
    deity: hi.deity,
    symbol: hi.symbol,
    gana: hi.gana,
    bodyPart: hi.bodyPart,
    tattva: hi.tattva,
    coreEnergy: hi.coreEnergy,
    keySignifications: list(en.keySignifications, hi.keySignifications),
    coreCharacteristics: list(en.coreCharacteristics, hi.coreCharacteristics),
    negativeTendencies: list(en.negativeTendencies, hi.negativeTendencies),
    spiritualTechniques: list(en.spiritualTechniques, hi.spiritualTechniques),
    careers: list(en.careers, hi.careers),
    specialNotes: list(en.specialNotes, hi.specialNotes),
  }
}

/** Ensure a complete encyclopedia block is present (runtime guard for tests). */
export function assertEncyclopediaFields(g: NakshatraEncyclopediaFields): void {
  if (!g.guna || !g.tattva || !g.coreEnergy) {
    throw new Error('Incomplete encyclopedia fields')
  }
}
