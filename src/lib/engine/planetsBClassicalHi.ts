// ─────────────────────────────────────────────────────────────
//  src/lib/engine/planetsBClassicalHi.ts
//  Hindi for the classical-catalogue bundle shared by the Venus, Saturn,
//  Rahu and Ketu analyses (natal notes, 12 houses, 12 signs, mixed layers).
//  The English catalogues are long multi-source paraphrases; Hindi exists
//  for the first (summary) note of each, so the Hindi bundle shows that
//  note plus the platform house / sign text. Pure — no React/DB imports.
// ─────────────────────────────────────────────────────────────
import type { Rashi } from '@/types/astrology'
import type { ClassicalNote } from '@/lib/engine/classicalInterpretations'
import type { InterpLayer, MixedPlanetPlacement } from '@/lib/engine/planetInterpretationMix'
import { getPlanetInHouse } from '@/lib/engine/houseInterpretations'
import { getPlanetInSign } from '@/lib/engine/rashiInterpretations'
import { fill } from '@/lib/engine/lang'
import { GRAHA_HI, NAKSHATRA_HI, RASHI_HI } from '@/i18n/jyotish'
import { HOUSE_THEMES_HI, NAKSHATRA_INTERPRETATIONS_HI } from '@/lib/engine/locale/interpretations.hi'
import {
  CLASSICAL_HOUSE_SUMMARY_HI,
  CLASSICAL_SIGN_SUMMARY_HI,
  DIGNITY_CLASSICAL_HI,
  RASHI_CORE_HI,
  vakriAstSummaryHi,
} from '@/lib/engine/locale/planetCard.hi'
import { ordObl } from '@/lib/engine/locale/planetsA.util'

export type PlanetsBGraha = 'Ve' | 'Sa' | 'Ra' | 'Ke'

const L = {
  houseTheme: '{nth} भाव के विषय',
  houseGuide: 'भाव मार्गदर्शिका',
  platformHouse: '{graha} {nth} भाव में',
  platform: 'प्लेटफ़ॉर्म',
  classicalHouse: 'शास्त्रीय · {graha} {nth} भाव में',
  classicalSign: 'शास्त्रीय · {graha} {rashi} में',
  classics: 'शास्त्र',
  rashiCore: '{rashi} का स्वभाव',
  rashiGuide: 'राशि मार्गदर्शिका',
  platformSign: '{graha} {rashi} में',
  dignity: 'बल / गरिमा',
  nakshatra: 'नक्षत्र · {nak}',
  vakriAst: 'वक्री / अस्त',
}

function note(source: ClassicalNote['source'], text: string | undefined): ClassicalNote[] {
  return text ? [{ source, text }] : []
}

export function classicalHouseNotesHi(g: PlanetsBGraha, house: number, en: ClassicalNote[]): ClassicalNote[] {
  return note(en[0]?.source ?? 'BPHS', CLASSICAL_HOUSE_SUMMARY_HI[g]?.[house - 1])
}

export function classicalSignNotesHi(
  g: PlanetsBGraha,
  rashi: number,
  en: ClassicalNote[],
  dignity?: string,
): ClassicalNote[] {
  const out = note(en[0]?.source ?? 'BPHS', CLASSICAL_SIGN_SUMMARY_HI[g]?.[rashi - 1])
  if (dignity && DIGNITY_CLASSICAL_HI[dignity]) out.push({ source: 'Teaching', text: DIGNITY_CLASSICAL_HI[dignity] })
  return out
}

export function vakriAstNotesHi(g: PlanetsBGraha, isRetro: boolean, isCombust: boolean): ClassicalNote[] {
  return note('Teaching', vakriAstSummaryHi(g, isRetro, isCombust) ?? undefined)
}

function layer(id: InterpLayer['id'], label: string, provenance: string, texts: Array<string | null | undefined>, classicalNotes?: ClassicalNote[]): InterpLayer | null {
  const cleaned = [...new Set(texts.map((t) => (t ?? '').trim()).filter(Boolean))]
  if (!cleaned.length && !classicalNotes?.length) return null
  return { id, label, provenance, texts: cleaned, ...(classicalNotes?.length ? { classicalNotes } : {}) }
}

export function houseLayersHi(g: PlanetsBGraha, house: number): InterpLayer[] {
  const theme = HOUSE_THEMES_HI[house as keyof typeof HOUSE_THEMES_HI]
  const v = { graha: GRAHA_HI[g], nth: ordObl(house) }
  return [
    layer('house_theme', fill(L.houseTheme, v), L.houseGuide, theme ? [`${theme.english} (${theme.sanskrit}): ${theme.shortThemes}`] : []),
    layer('planet_house_platform', fill(L.platformHouse, v), L.platform, [getPlanetInHouse(g, house, 'full', 'hi'), getPlanetInHouse(g, house, 'summary', 'hi')]),
    layer('planet_house_classical', fill(L.classicalHouse, v), L.classics, [CLASSICAL_HOUSE_SUMMARY_HI[g]?.[house - 1]]),
  ].filter((x): x is InterpLayer => x != null)
}

export function signLayersHi(g: PlanetsBGraha, rashi: number): InterpLayer[] {
  const v = { graha: GRAHA_HI[g], rashi: RASHI_HI[rashi as Rashi] }
  return [
    layer('rashi_core', fill(L.rashiCore, v), L.rashiGuide, [RASHI_CORE_HI[rashi - 1]]),
    layer('planet_sign_platform', fill(L.platformSign, v), L.platform, [getPlanetInSign(g, rashi, 'summary', 'hi')]),
    layer('planet_sign_classical', fill(L.classicalSign, v), L.classics, [CLASSICAL_SIGN_SUMMARY_HI[g]?.[rashi - 1]]),
  ].filter((x): x is InterpLayer => x != null)
}

function natalMixedHi(m: MixedPlanetPlacement, g: PlanetsBGraha, isRetro: boolean, isCombust: boolean, nakIdx: number): MixedPlanetPlacement {
  const extra = [
    layer('dignity', L.dignity, L.classics, [DIGNITY_CLASSICAL_HI[m.dignity]]),
    layer('nakshatra', fill(L.nakshatra, { nak: NAKSHATRA_HI[nakIdx] ?? '' }), L.platform, [NAKSHATRA_INTERPRETATIONS_HI[nakIdx]]),
    layer('vakri_ast', L.vakriAst, L.classics, [vakriAstSummaryHi(g, isRetro, isCombust)]),
  ].filter((x): x is InterpLayer => x != null)
  const layers = [...houseLayersHi(g, m.house), ...signLayersHi(g, m.rashi), ...extra]
  return {
    ...m,
    grahaName: GRAHA_HI[g],
    rashiName: RASHI_HI[m.rashi],
    nakshatraName: NAKSHATRA_HI[nakIdx] ?? m.nakshatraName,
    layers,
    blendedSummary: layers.map((l) => l.texts[0]).filter(Boolean).join(' '),
  }
}

interface BundleLike {
  natalHouseClassical: ClassicalNote[]
  natalSignClassical: ClassicalNote[]
  vakriAst: ClassicalNote[]
  allHouses: Array<{ house: number; classical: ClassicalNote[]; platformFull: string | null; platformSummary: string | null; mixedLayers: InterpLayer[] }>
  allSigns: Array<{ rashi: Rashi; rashiName: string; classical: ClassicalNote[]; platformFull: string | null; platformSummary: string | null; mixedLayers: InterpLayer[] }>
  platformNatalHouseFull: string | null
  platformNatalSignFull: string | null
  natalMixed: MixedPlanetPlacement | null
}

/** Hindi copy of a planet's classical bundle (same shape, ids and numbers unchanged). */
export function classicalBundleHi<B extends BundleLike>(
  b: B,
  g: PlanetsBGraha,
  natal: { house: number; rashi: Rashi; dignity: string; isRetro: boolean; isCombust: boolean; nakshatraIndex: number },
): B {
  return {
    ...b,
    natalHouseClassical: classicalHouseNotesHi(g, natal.house, b.natalHouseClassical),
    natalSignClassical: classicalSignNotesHi(g, natal.rashi, b.natalSignClassical, natal.dignity),
    vakriAst: b.vakriAst.length ? vakriAstNotesHi(g, natal.isRetro, natal.isCombust) : [],
    allHouses: b.allHouses.map((h) => ({
      ...h,
      classical: classicalHouseNotesHi(g, h.house, h.classical),
      platformFull: getPlanetInHouse(g, h.house, 'full', 'hi'),
      platformSummary: getPlanetInHouse(g, h.house, 'summary', 'hi'),
      mixedLayers: houseLayersHi(g, h.house),
    })),
    allSigns: b.allSigns.map((s) => ({
      ...s,
      rashiName: RASHI_HI[s.rashi],
      classical: classicalSignNotesHi(g, s.rashi, s.classical),
      platformFull: getPlanetInSign(g, s.rashi, 'summary', 'hi'),
      platformSummary: getPlanetInSign(g, s.rashi, 'summary', 'hi'),
      mixedLayers: signLayersHi(g, s.rashi),
    })),
    platformNatalHouseFull: getPlanetInHouse(g, natal.house, 'full', 'hi'),
    platformNatalSignFull: getPlanetInSign(g, natal.rashi, 'summary', 'hi'),
    natalMixed: b.natalMixed ? natalMixedHi(b.natalMixed, g, natal.isRetro, natal.isCombust, natal.nakshatraIndex) : null,
  }
}
