// src/lib/engine/marriageSynastry.ts
// True cross-chart overlay: A's planets into B's houses and reverse,
// plus a simple D9×D9 Venus / 7th-lord alignment score.
// Pure engine — no React/DB.

import type { ChartOutput, Dignity, GrahaData, GrahaId, Rashi } from '@/types/astrology'
import { GRAHA_NAMES } from '@/types/astrology'
import type { LifeTone, MarriedLifeNote } from '@/lib/engine/marriedLifeAnalysis'
import { fill, type EngineLang } from '@/lib/engine/lang'
import { gName } from '@/lib/engine/divisionalLang'
import { MS_HI } from '@/lib/engine/locale/marriageSynastry.hi'

export type D9PairScore = 'aligned' | 'mixed' | 'strained'

export interface MarriageSynastryReading {
  headline: string
  summary: string
  overlayAonB: MarriedLifeNote[]
  overlayBonA: MarriedLifeNote[]
  d9: MarriedLifeNote[]
  flags: { d9Score: D9PairScore }
}

const LORDS: Record<number, GrahaId> = {
  1: 'Ma', 2: 'Ve', 3: 'Me', 4: 'Mo', 5: 'Su', 6: 'Me',
  7: 'Ve', 8: 'Ma', 9: 'Ju', 10: 'Sa', 11: 'Sa', 12: 'Ju',
}

const D9_LABEL: Record<'strong' | 'weak' | 'mid', string> = { strong: 'strong', weak: 'under strain', mid: 'moderate' }

const FOCUS: GrahaId[] = ['Ve', 'Ju', 'Mo', 'Ma']
const DIGNIFIED: Dignity[] = ['exalted', 'moolatrikona', 'own']

function houseOf(rashi: number, asc: number): number {
  return ((rashi - asc + 12) % 12) + 1
}

function gn(id: GrahaId | string, lang: EngineLang = 'en'): string {
  const gid = id as GrahaId
  return lang === 'hi' ? gName(gid, 'hi') : (GRAHA_NAMES[gid] ?? id)
}

function note(id: string, title: string, detail: string, tone: LifeTone): MarriedLifeNote {
  return { id, title, detail, tone }
}

function find(list: GrahaData[] | undefined, id: GrahaId): GrahaData | undefined {
  return list?.find(g => g.id === id)
}

function dignified(d: Dignity | undefined): boolean {
  return !!d && DIGNIFIED.includes(d)
}

function weak(d: Dignity | undefined, combust?: boolean): boolean {
  return d === 'debilitated' || d === 'enemy' || d === 'great_enemy' || !!combust
}

function toneForHouse(h: number): LifeTone {
  if (h === 7 || h === 5 || h === 1) return 'supportive'
  if (h === 8 || h === 12 || h === 6) return 'caution'
  return 'mixed'
}

function overlayNotes(
  from: ChartOutput,
  into: ChartOutput,
  fromName: string,
  intoName: string,
  prefix: string,
  lang: EngineLang = 'en',
): MarriedLifeNote[] {
  const intoAsc = into.lagnas?.ascRashi
  if (!intoAsc) return []
  const notes: MarriedLifeNote[] = []
  const ids = [...FOCUS]
  const dk = from.karakas?.DK
  if (dk && !ids.includes(dk)) ids.push(dk)

  for (const id of ids) {
    const g = find(from.grahas, id)
    if (!g) continue
    const h = houseOf(g.rashi, intoAsc)
    if (![1, 5, 6, 7, 8, 12].includes(h)) continue
    const label = id === dk ? `${gn(id, lang)}${lang === 'hi' ? MS_HI.dkSuffix : ' (DK)'}` : gn(id, lang)
    let detail: string
  let title: string
    if (lang === 'hi') {
      let detailKey: keyof typeof MS_HI.overlay = 'other'
      if (h === 7) detailKey = 'h7'
      else if (h === 5) detailKey = 'h5'
      else if (h === 1) detailKey = 'h1'
      else if (h === 8) detailKey = 'h8'
      else if (h === 12) detailKey = 'h12'
      else if (h === 6) detailKey = 'h6'
      detail = fill(MS_HI.overlay[detailKey], { fromName, intoName, label, house: h })
      title = fill(MS_HI.overlayTitle, { label, intoName, house: h })
    } else {
      detail = h === 7 || h === 5 || h === 1 || h === 8 || h === 12 || h === 6
        ? (h === 7
          ? `${fromName}’s ${label} falls in ${intoName}’s 7th house, touching partnership and warmth between you.`
          : h === 5
            ? `${fromName}’s ${label} falls in ${intoName}’s 5th house, touching romance and children.`
            : h === 1
              ? `${fromName}’s ${label} falls on ${intoName}’s lagna, touching identity and presence.`
              : h === 8
                ? `${fromName}’s ${label} falls in ${intoName}’s 8th house, touching intensity, shared challenges and deep bonds.`
                : h === 12
                  ? `${fromName}’s ${label} falls in ${intoName}’s 12th house, touching intimacy, foreign connections and letting go.`
                  : `${fromName}’s ${label} falls in ${intoName}’s 6th house, touching service, effort and occasional friction.`)
        : `${fromName}’s ${label} in house ${h} of ${intoName}.`
      title = `${label} → ${intoName} house ${h}`
    }
    notes.push(note(`${prefix}-${id}-h${h}`, title, detail, toneForHouse(h)))
  }
  return notes
}

function d9Strength(chart: ChartOutput): { ve: 'strong' | 'weak' | 'mid'; lord: 'strong' | 'weak' | 'mid' } {
  const d9 = chart.vargas?.D9
  const d9Asc = chart.vargaLagnas?.D9
  const ve = find(d9, 'Ve')
  const seventh = d9Asc ? ((((d9Asc - 1 + 6) % 12) + 1) as Rashi) : null
  const lord = seventh ? find(d9, LORDS[seventh]) : undefined
  const band = (g: GrahaData | undefined): 'strong' | 'weak' | 'mid' => {
    if (!g) return 'mid'
    if (dignified(g.dignity) && !g.isCombust) return 'strong'
    if (weak(g.dignity, g.isCombust)) return 'weak'
    return 'mid'
  }
  return { ve: band(ve), lord: band(lord) }
}

export function analyzeMarriageSynastry(
  chartA: ChartOutput | null | undefined,
  chartB: ChartOutput | null | undefined,
  lang: EngineLang = 'en',
): MarriageSynastryReading | null {
  if (!chartA?.lagnas?.ascRashi || !chartB?.lagnas?.ascRashi) return null
  const nameA = chartA.meta?.name?.trim() || 'Chart A'
  const nameB = chartB.meta?.name?.trim() || 'Chart B'

  const overlayAonB = overlayNotes(chartA, chartB, nameA, nameB, 'syn-a', lang)
  const overlayBonA = overlayNotes(chartB, chartA, nameB, nameA, 'syn-b', lang)

  const a9 = d9Strength(chartA)
  const b9 = d9Strength(chartB)
  const scorePoints = [a9.ve, a9.lord, b9.ve, b9.lord].map(s => (s === 'strong' ? 1 : s === 'weak' ? -1 : 0))
  const sum = scorePoints.reduce<number>((acc, n) => acc + n, 0)
  const d9Score: D9PairScore = sum >= 2 ? 'aligned' : sum <= -2 ? 'strained' : 'mixed'

  const d9: MarriedLifeNote[] = [note(
    'syn-d9',
    lang === 'hi'
      ? MS_HI.d9Titles[d9Score]
      : d9Score === 'aligned'
        ? 'Navamsha Venus and the 7th-house lords support each other'
        : d9Score === 'strained'
          ? 'Navamsha Venus and the 7th-house lords are under some strain on both sides'
          : 'Navamsha marriage strength is mixed',
    lang === 'hi'
      ? fill(MS_HI.d9Detail, {
        nameA,
        veA: MS_HI.d9Label[a9.ve],
        lordA: MS_HI.d9Label[a9.lord],
        nameB,
        veB: MS_HI.d9Label[b9.ve],
        lordB: MS_HI.d9Label[b9.lord],
      })
      : `${nameA}: Navamsha (D9) Venus ${D9_LABEL[a9.ve]}, 7th-house lord ${D9_LABEL[a9.lord]}. ${nameB}: Navamsha Venus ${D9_LABEL[b9.ve]}, 7th-house lord ${D9_LABEL[b9.lord]}. Comparing both Navamshas shows the deeper fruit of the marriage; aligned charts tend to hold up better under pressure.`,
    d9Score === 'aligned' ? 'supportive' : d9Score === 'strained' ? 'caution' : 'mixed',
  )]

  const hitCount = overlayAonB.length + overlayBonA.length
  return {
    headline: lang === 'hi'
      ? (hitCount ? fill(MS_HI.headlineHits, { count: hitCount }) : MS_HI.headlineNone)
      : hitCount
        ? `Cross-chart overlay: ${hitCount} marriage-house contacts`
        : 'Cross-chart overlay: no strong contacts on houses 1, 5, 7, 8 or 12',
    summary: lang === 'hi'
      ? fill(MS_HI.summary, { score: MS_HI.d9Score[d9Score] ?? d9Score })
      : `Navamsha-to-Navamsha score: ${d9Score}. The overlay shows where each person’s planets fall in the other’s chart, and what that may feel like.`,
    overlayAonB,
    overlayBonA,
    d9,
    flags: { d9Score },
  }
}
