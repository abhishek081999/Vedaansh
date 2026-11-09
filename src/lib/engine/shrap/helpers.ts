// ─────────────────────────────────────────────────────────────
//  src/lib/engine/shrap/helpers.ts
//  Shared house/lord/affliction helpers for Shrap / Dosha analysis
// ─────────────────────────────────────────────────────────────

import type { ChartOutput, Dignity, GrahaData, GrahaId, Rashi } from '@/types/astrology'
import { GRAHA_NAMES, RASHI_NAMES } from '@/types/astrology'
import { GRAHA_HI, RASHI_HI } from '@/i18n/jyotish'
import { hasParasharaAspect } from '@/lib/engine/aspects'
import { DIGNITY_HI } from '@/lib/engine/divisionalLang'
import { fill, type EngineLang } from '@/lib/engine/lang'
import { SIGN_LORD_BY_RASHI } from '@/lib/engine/lordshipInterpretations'

export type ShrapSeverity = 'clear' | 'watch' | 'strong'

export interface ShrapIndicator {
  id: string
  text: string
}

export interface ShrapDoshaVerdict {
  id: string
  label: string
  present: boolean
  severity: ShrapSeverity
  summary: string
  indicators: ShrapIndicator[]
  effects: string[]
  remedies: string[]
  primaryPlanet: string
  primaryHouse: string
  keyRemedy: string
}

export const MALEFICS: readonly GrahaId[] = ['Sa', 'Ra', 'Ke', 'Ma', 'Su'] as const
export const NODE_AXIS: readonly GrahaId[] = ['Ra', 'Ke'] as const

export function gn(id: GrahaId, lang: EngineLang = 'en'): string {
  if (lang === 'hi') return GRAHA_HI[id] ?? GRAHA_NAMES[id] ?? id
  return GRAHA_NAMES[id] ?? id
}

export function rn(rashi: Rashi, lang: EngineLang = 'en'): string {
  if (lang === 'hi') return RASHI_HI[rashi] ?? RASHI_NAMES[rashi] ?? String(rashi)
  return RASHI_NAMES[rashi] ?? String(rashi)
}

export function gnList(ids: readonly GrahaId[], lang: EngineLang = 'en'): string {
  return ids.map(id => gn(id, lang)).join(', ')
}

/** English stays the literal. Hindi fills `{slots}` when they are passed. */
export function tx(
  lang: EngineLang,
  en: string,
  hi: string,
  slots?: Record<string, string | number>,
): string {
  if (lang !== 'hi') return en
  return slots ? fill(hi, slots) : hi
}

export function txList(lang: EngineLang, en: readonly string[], hi: readonly string[]): string[] {
  return lang === 'hi' ? [...hi] : [...en]
}

/** Dignity as display text. Missing dignity uses `missing` ('weak' or 'unknown'). */
export function dignityWord(
  d: Dignity | undefined,
  lang: EngineLang = 'en',
  missing: 'weak' | 'unknown' = 'weak',
): string {
  if (!d) return tx(lang, missing, missing === 'unknown' ? 'अज्ञात' : 'कमज़ोर')
  return lang === 'hi' ? (DIGNITY_HI[d] ?? d) : d.replace(/_/g, ' ')
}

export function wholeSignHouse(planetRashi: number, ascRashi: number): number {
  return ((planetRashi - ascRashi + 12) % 12) + 1
}

export function houseSign(ascRashi: Rashi, house: number): Rashi {
  return (((ascRashi - 1 + house - 1) % 12) + 1) as Rashi
}

export function findGraha(chart: ChartOutput, id: GrahaId): GrahaData | undefined {
  return chart.grahas?.find(g => g.id === id)
}

export function houseOf(chart: ChartOutput, id: GrahaId): number | null {
  const g = findGraha(chart, id)
  const asc = chart.lagnas?.ascRashi
  if (!g || !asc) return null
  return wholeSignHouse(g.rashi, asc)
}

export function occupantsOfHouse(chart: ChartOutput, house: number): GrahaData[] {
  const asc = chart.lagnas?.ascRashi
  if (!asc || !chart.grahas?.length) return []
  return chart.grahas.filter(g => wholeSignHouse(g.rashi, asc) === house)
}

export function lordOfHouse(chart: ChartOutput, house: number): GrahaId | null {
  const asc = chart.lagnas?.ascRashi
  if (!asc) return null
  return SIGN_LORD_BY_RASHI[houseSign(asc, house)]
}

export function isWeakDignity(d: Dignity | undefined): boolean {
  return d === 'debilitated' || d === 'enemy' || d === 'great_enemy'
}

export function isDebilitated(d: Dignity | undefined): boolean {
  return d === 'debilitated'
}

export function onNodeAxis(chart: ChartOutput, id: GrahaId): boolean {
  const g = findGraha(chart, id)
  if (!g) return false
  const ra = findGraha(chart, 'Ra')
  const ke = findGraha(chart, 'Ke')
  return (!!ra && g.rashi === ra.rashi) || (!!ke && g.rashi === ke.rashi)
}

export function conjunct(a: GrahaData | undefined, b: GrahaData | undefined): boolean {
  return !!a && !!b && a.rashi === b.rashi
}

/** Malefics that occupy or aspect a house sign (nodes count as occupation only). */
export function maleficsOnHouse(chart: ChartOutput, house: number): GrahaId[] {
  const asc = chart.lagnas?.ascRashi
  if (!asc) return []
  const target = houseSign(asc, house)
  const hits = new Set<GrahaId>()

  for (const g of chart.grahas ?? []) {
    if (!MALEFICS.includes(g.id as GrahaId) && g.id !== 'Sa' && g.id !== 'Ra' && g.id !== 'Ke') continue
    const id = g.id as GrahaId
    if (!['Su', 'Ma', 'Sa', 'Ra', 'Ke'].includes(id)) continue
    if (g.rashi === target) {
      hits.add(id)
      continue
    }
    if (hasParasharaAspect(g.rashi, id, target)) hits.add(id)
  }
  return [...hits]
}

export function lordAfflictedByNodesOrSaturn(chart: ChartOutput, lordId: GrahaId): GrahaId[] {
  const lord = findGraha(chart, lordId)
  if (!lord) return []
  const hits: GrahaId[] = []
  for (const id of ['Ra', 'Ke', 'Sa'] as GrahaId[]) {
    const m = findGraha(chart, id)
    if (!m) continue
    if (m.rashi === lord.rashi || hasParasharaAspect(m.rashi, id, lord.rashi)) hits.push(id)
  }
  return hits
}

export function vargaSlice(chart: ChartOutput, code: string): { grahas: GrahaData[]; asc: Rashi | null } {
  const grahas = chart.vargas?.[code] ?? []
  const asc = (chart.vargaLagnas?.[code] as Rashi | undefined) ?? null
  return { grahas, asc }
}

export function vargaHouseOf(
  chart: ChartOutput,
  code: string,
  id: GrahaId,
): number | null {
  const { grahas, asc } = vargaSlice(chart, code)
  if (!asc || !grahas.length) return null
  const g = grahas.find(x => x.id === id)
  if (!g) return null
  return wholeSignHouse(g.rashi, asc)
}

export function vargaMaleficsOnHouse(chart: ChartOutput, code: string, house: number): GrahaId[] {
  const { grahas, asc } = vargaSlice(chart, code)
  if (!asc || !grahas.length) return []
  const target = houseSign(asc, house)
  const hits = new Set<GrahaId>()
  for (const g of grahas) {
    const id = g.id as GrahaId
    if (!['Su', 'Ma', 'Sa', 'Ra', 'Ke'].includes(id)) continue
    if (g.rashi === target) hits.add(id)
    else if (hasParasharaAspect(g.rashi, id, target)) hits.add(id)
  }
  return [...hits]
}

export function severityFromScore(score: number): ShrapSeverity {
  if (score >= 3) return 'strong'
  if (score >= 1) return 'watch'
  return 'clear'
}

export function emptyVerdict(
  id: string,
  label: string,
  primaryPlanet: string,
  primaryHouse: string,
  keyRemedy: string,
  clearSummary: string,
  effects: string[],
  remedies: string[],
): ShrapDoshaVerdict {
  return {
    id,
    label,
    present: false,
    severity: 'clear',
    summary: clearSummary,
    indicators: [],
    effects,
    remedies,
    primaryPlanet,
    primaryHouse,
    keyRemedy,
  }
}
