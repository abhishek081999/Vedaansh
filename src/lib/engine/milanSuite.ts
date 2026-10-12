// src/lib/engine/milanSuite.ts
// Milan expansions: Manglik pair, marriage timing + Antardasha,
// remedies, Vaidhavya catalog, dual Jaimini D9 summary, role helpers.
// Pure engine — no React/DB.

import type { ChartOutput, DashaNode, GrahaId } from '@/types/astrology'
import { GRAHA_NAMES } from '@/types/astrology'
import { calculateManglik, type ManglikAnalysis } from '@/lib/engine/doshas'
import { analyzeJaiminiMarriage, type JaiminiMarriageAnalysis } from '@/lib/engine/jaiminiMarriageAnalysis'
import type { MilanTone } from '@/lib/engine/milanExtras'

export type MilanRole = 'boy' | 'girl'

export interface MilanRoles {
  boyChart: ChartOutput
  girlChart: ChartOutput
  boyLabel: string
  girlLabel: string
  /** true if chartA was treated as boy */
  aIsBoy: boolean
}

/** Resolve Boy/Girl from explicit roles or chart gender (Person1 default = boy). */
export function resolveMilanRoles(
  chartA: ChartOutput,
  chartB: ChartOutput,
  explicit?: { personA?: MilanRole; personB?: MilanRole },
): MilanRoles {
  let aIsBoy: boolean
  if (explicit?.personA === 'boy' || explicit?.personB === 'girl') aIsBoy = true
  else if (explicit?.personA === 'girl' || explicit?.personB === 'boy') aIsBoy = false
  else if (chartA.meta.gender === 'male' || chartB.meta.gender === 'female') aIsBoy = true
  else if (chartA.meta.gender === 'female' || chartB.meta.gender === 'male') aIsBoy = false
  else aIsBoy = true

  return {
    aIsBoy,
    boyChart: aIsBoy ? chartA : chartB,
    girlChart: aIsBoy ? chartB : chartA,
    boyLabel: (aIsBoy ? chartA : chartB).meta.name || 'Groom',
    girlLabel: (aIsBoy ? chartB : chartA).meta.name || 'Bride',
  }
}

// ── Manglik pair ──────────────────────────────────────────────

export interface ManglikPairVerdict {
  boy: ManglikAnalysis
  girl: ManglikAnalysis
  verdict: 'both_clear' | 'both_manglik' | 'matched_intensity' | 'mismatch' | 'cancelled'
  tone: MilanTone
  label: string
  detail: string
}

export function analyzeManglikPair(boyChart: ChartOutput, girlChart: ChartOutput): ManglikPairVerdict {
  const boy = calculateManglik(boyChart.grahas, [], boyChart.lagnas.ascRashi)
  const girl = calculateManglik(girlChart.grahas, [], girlChart.lagnas.ascRashi)

  const boyActive = boy.isManglik
  const girlActive = girl.isManglik
  const boyCancelled = !boy.isManglik && boy.cancellations.length > 0 && boy.house > 0
  const girlCancelled = !girl.isManglik && girl.cancellations.length > 0 && girl.house > 0

  if (!boyActive && !girlActive && !boyCancelled && !girlCancelled) {
    return {
      boy, girl, verdict: 'both_clear', tone: 'supportive',
      label: 'Both non-Manglik',
      detail: 'Neither chart shows active Kuja Dosha in lagna manglik houses.',
    }
  }

  if ((boyCancelled || !boyActive) && (girlCancelled || !girlActive) && (boyCancelled || girlCancelled)) {
    return {
      boy, girl, verdict: 'cancelled', tone: 'supportive',
      label: 'Manglik cancelled / neutralized',
      detail: `Cancellations present — Boy: ${boy.cancellations.join(', ') || 'clear'}; Girl: ${girl.cancellations.join(', ') || 'clear'}.`,
    }
  }

  if (boyActive && girlActive) {
    const matched = boy.intensity === girl.intensity
    return {
      boy, girl,
      verdict: matched ? 'matched_intensity' : 'both_manglik',
      tone: matched ? 'supportive' : 'mixed',
      label: matched ? 'Both Manglik — intensity matched' : 'Both Manglik — intensity differs',
      detail: `Boy ${boy.intensity} (H${boy.house}) × Girl ${girl.intensity} (H${girl.house}). Classical practice prefers matching Manglik with Manglik.`,
    }
  }

  return {
    boy, girl, verdict: 'mismatch', tone: 'caution',
    label: 'Manglik mismatch',
    detail: `${boyActive ? 'Groom' : 'Bride'} has active Kuja Dosha (${boyActive ? boy.intensity : girl.intensity}); partner does not. Remedies or matching with similar intensity traditionally advised.`,
  }
}

// ── Marriage timing + Antardasha pair ─────────────────────────

export interface TimingWindow {
  start: string
  end: string
  boyLords: string
  girlLords: string
  score: number
  tone: MilanTone
  note: string
}

export interface MarriageTimingResult {
  windows: TimingWindow[]
  antarPairs: TimingWindow[]
  summary: string
}

function iso(d: Date | number | string): string {
  return new Date(d).toISOString().slice(0, 10)
}

function level1(nodes: DashaNode[] | undefined): DashaNode[] {
  if (!nodes?.length) return []
  return nodes.filter(n => n.level === 1).length ? nodes.filter(n => n.level === 1) : nodes
}

function currentPath(nodes: DashaNode[] | undefined, now: Date): DashaNode[] {
  if (!nodes?.length) return []
  const path: DashaNode[] = []
  const nowMs = now.getTime()
  function walk(list: DashaNode[]): boolean {
    for (const n of list) {
      const s = new Date(n.start).getTime()
      const e = new Date(n.end).getTime()
      if (nowMs >= s && nowMs < e) {
        path.push(n)
        if (n.children?.length) walk(n.children)
        return true
      }
    }
    return false
  }
  walk(level1(nodes).length ? level1(nodes) : nodes)
  return path
}

function lordScore(id: string): number {
  if (id === 'Ve' || id === 'Ju') return 3
  if (id === 'Mo' || id === 'Ma') return 2
  if (id === 'Me') return 1
  if (id === 'Sa' || id === 'Ra' || id === 'Ke') return -1
  return 0
}

export function analyzeMarriageTiming(
  boyChart: ChartOutput,
  girlChart: ChartOutput,
  now = new Date(),
): MarriageTimingResult {
  const boyMaha = level1(boyChart.dashas?.vimshottari)
  const girlMaha = level1(girlChart.dashas?.vimshottari)
  const windows: TimingWindow[] = []
  const horizon = now.getTime() + 12 * 365.25 * 24 * 3600 * 1000

  for (const bm of boyMaha) {
    for (const gm of girlMaha) {
      const start = Math.max(new Date(bm.start).getTime(), new Date(gm.start).getTime(), now.getTime())
      const end = Math.min(new Date(bm.end).getTime(), new Date(gm.end).getTime(), horizon)
      if (end <= start) continue
      const score = lordScore(bm.lord) + lordScore(gm.lord)
      const tone: MilanTone = score >= 4 ? 'supportive' : score <= 0 ? 'caution' : 'mixed'
      windows.push({
        start: iso(start),
        end: iso(end),
        boyLords: GRAHA_NAMES[bm.lord as GrahaId] ?? bm.lord,
        girlLords: GRAHA_NAMES[gm.lord as GrahaId] ?? gm.lord,
        score,
        tone,
        note: `Maha ${GRAHA_NAMES[bm.lord as GrahaId] ?? bm.lord} × ${GRAHA_NAMES[gm.lord as GrahaId] ?? gm.lord} — ${
          tone === 'supportive' ? 'favourable marriage-period colour' : tone === 'caution' ? 'delay / caution window' : 'mixed timing'
        }.`,
      })
    }
  }
  windows.sort((a, b) => b.score - a.score || a.start.localeCompare(b.start))

  // Antardasha pairs from current path
  const antarPairs: TimingWindow[] = []
  const bp = currentPath(boyChart.dashas?.vimshottari, now)
  const gp = currentPath(girlChart.dashas?.vimshottari, now)
  const bAntar = bp[1]
  const gAntar = gp[1]
  if (bp[0] && gp[0] && bAntar && gAntar) {
    const start = Math.max(new Date(bAntar.start).getTime(), new Date(gAntar.start).getTime(), now.getTime())
    const end = Math.min(new Date(bAntar.end).getTime(), new Date(gAntar.end).getTime())
    if (end > start) {
      const score = lordScore(bp[0].lord) + lordScore(gp[0].lord) + lordScore(bAntar.lord) + lordScore(gAntar.lord)
      const tone: MilanTone = score >= 6 ? 'supportive' : score <= 1 ? 'caution' : 'mixed'
      antarPairs.push({
        start: iso(start),
        end: iso(end),
        boyLords: `${GRAHA_NAMES[bp[0].lord as GrahaId]}/${GRAHA_NAMES[bAntar.lord as GrahaId]}`,
        girlLords: `${GRAHA_NAMES[gp[0].lord as GrahaId]}/${GRAHA_NAMES[gAntar.lord as GrahaId]}`,
        score,
        tone,
        note: `Current Antar overlap — finer timing for muhurta / engagement discussions.`,
      })
    }
  }

  // Next few antar overlaps (boy current maha children × girl current maha children)
  if (bp[0]?.children?.length && gp[0]?.children?.length) {
    for (const ba of bp[0].children.slice(0, 4)) {
      for (const ga of gp[0].children.slice(0, 4)) {
        const start = Math.max(new Date(ba.start).getTime(), new Date(ga.start).getTime(), now.getTime())
        const end = Math.min(new Date(ba.end).getTime(), new Date(ga.end).getTime())
        if (end <= start) continue
        if (antarPairs.some(w => w.start === iso(start) && w.end === iso(end))) continue
        const score = lordScore(bp[0].lord) + lordScore(gp[0].lord) + lordScore(ba.lord) + lordScore(ga.lord)
        const tone: MilanTone = score >= 6 ? 'supportive' : score <= 1 ? 'caution' : 'mixed'
        antarPairs.push({
          start: iso(start),
          end: iso(end),
          boyLords: `${GRAHA_NAMES[bp[0].lord as GrahaId]}/${GRAHA_NAMES[ba.lord as GrahaId]}`,
          girlLords: `${GRAHA_NAMES[gp[0].lord as GrahaId]}/${GRAHA_NAMES[ga.lord as GrahaId]}`,
          score,
          tone,
          note: 'Upcoming Antardasha pair within current Mahadashas.',
        })
      }
    }
  }
  antarPairs.sort((a, b) => a.start.localeCompare(b.start))

  const best = windows.filter(w => w.tone === 'supportive').slice(0, 2)
  const summary = best.length
    ? `Favourable Maha windows include ${best.map(w => `${w.start}→${w.end}`).join('; ')}. Refine with Antardasha + muhurta.`
    : 'No strongly supportive Maha overlaps in the next ~12 years from Venus/Jupiter-weighted scan — use Antar detail and muhurta.'

  return {
    windows: windows.slice(0, 8),
    antarPairs: antarPairs.slice(0, 8),
    summary,
  }
}

// ── Remedies ──────────────────────────────────────────────────

export interface MilanRemedy {
  id: string
  forDosha: string
  title: string
  detail: string
  priority: 'high' | 'medium' | 'low'
}

export function buildMilanRemedies(input: {
  nadiDosha?: boolean
  bhakootDosha?: boolean
  manglikMismatch?: boolean
  ganaHarsh?: boolean
  poruthamCriticalFails?: string[]
}): MilanRemedy[] {
  const out: MilanRemedy[] = []
  if (input.nadiDosha) {
    out.push({
      id: 'nadi',
      forDosha: 'Nadi Dosha',
      title: 'Nadi pacification',
      detail: 'Confirm cancellation rules first. Traditional: Mahamrityunjaya japa, donation of grains/clothes on natal Moon weekday, medical preconception counsel (modern health check). Do not treat remedies as medical advice.',
      priority: 'high',
    })
  }
  if (input.bhakootDosha) {
    out.push({
      id: 'bhakoot',
      forDosha: 'Bhakoot Dosha',
      title: 'Bhakoot / life-path harmony',
      detail: 'Joint charity on full-moon days, strengthen Moon (pearls/silver if suitable), shared travel/home goals to align life direction. Check lord-friendship cancellation before alarm.',
      priority: 'high',
    })
  }
  if (input.manglikMismatch) {
    out.push({
      id: 'manglik',
      forDosha: 'Kuja Dosha mismatch',
      title: 'Manglik matching / Kuja shanti',
      detail: 'Prefer Manglik–Manglik match when intensity is high. Classical Kuja shanti (Tuesday fasting, coral if chart allows, Mars mantra) after a qualified jyotishi reviews cancellations.',
      priority: 'high',
    })
  }
  if (input.ganaHarsh) {
    out.push({
      id: 'gana',
      forDosha: 'Gana mismatch',
      title: 'Temperament bridging',
      detail: 'Conscious communication agreements, delay heated decisions, strengthen Jupiter (Thursday seva) for patience between Deva/Rakshasa styles.',
      priority: 'medium',
    })
  }
  for (const name of input.poruthamCriticalFails ?? []) {
    out.push({
      id: `porutham-${name}`,
      forDosha: `Porutham · ${name}`,
      title: `${name} Porutham care`,
      detail: `South-Indian school flags ${name}. Cross-check with Ashtakoot and D1/D9 before refusing; temple-based shanti varies by region.`,
      priority: 'medium',
    })
  }
  if (out.length === 0) {
    out.push({
      id: 'general',
      forDosha: 'General',
      title: 'Maintain harmony',
      detail: 'No major dosha flags in this scan. Keep muhurta for wedding, and review dashas of both before major moves.',
      priority: 'low',
    })
  }
  return out
}

// ── Vaidhavya catalog (classical cue list) ────────────────────

export interface VaidhavyaCatalogItem {
  id: string
  name: string
  present: boolean
  detail: string
}

function wholeSignHouse(planetRashi: number, ascRashi: number): number {
  return ((planetRashi - ascRashi + 12) % 12) + 1
}

/** Named classical cues (simplified detection for counselling — not exhaustive shastra eng.). */
export function catalogVaidhavyaCues(chart: ChartOutput): VaidhavyaCatalogItem[] {
  const asc = chart.lagnas.ascRashi
  const items: VaidhavyaCatalogItem[] = []
  if (!asc) return items
  const ma = chart.grahas.find(g => g.id === 'Ma')
  const sa = chart.grahas.find(g => g.id === 'Sa')
  const ra = chart.grahas.find(g => g.id === 'Ra')
  const ve = chart.grahas.find(g => g.id === 'Ve')
  const ju = chart.grahas.find(g => g.id === 'Ju')

  const ma7 = ma && [7, 8].includes(wholeSignHouse(ma.rashi, asc))
  const sa7 = sa && [7, 8].includes(wholeSignHouse(sa.rashi, asc))
  items.push({
    id: 'ma-sa-78',
    name: 'Mars/Saturn on 7–8',
    present: !!(ma7 || sa7),
    detail: ma7 || sa7
      ? 'Malefic occupation of spouse/longevity houses — classical widowhood watch-point.'
      : 'No Mars/Saturn occupation of 7th/8th from lagna.',
  })

  items.push({
    id: 'rahu-7',
    name: 'Rahu in 7th',
    present: !!(ra && wholeSignHouse(ra.rashi, asc) === 7),
    detail: ra && wholeSignHouse(ra.rashi, asc) === 7
      ? 'Rahu in 7th — unconventional spouse karma; some texts link to separation themes.'
      : 'Rahu not in 7th.',
  })

  items.push({
    id: 've-dusthana',
    name: 'Venus in dusthana',
    present: !!(ve && [6, 8, 12].includes(wholeSignHouse(ve.rashi, asc))),
    detail: ve && [6, 8, 12].includes(wholeSignHouse(ve.rashi, asc))
      ? `Venus in H${wholeSignHouse(ve.rashi, asc)} — spouse happiness karaka challenged.`
      : 'Venus not in 6/8/12.',
  })

  if (ju) {
    const jh = wholeSignHouse(ju.rashi, asc)
    // Whole-sign: Jupiter aspects 5th, 7th, 9th from itself
    const aspects7 = [4, 6, 8].includes((7 - jh + 12) % 12) || jh === 7
    items.push({
      id: 'ju-weak-protect',
      name: 'Jupiter not protecting 7th',
      present: !aspects7,
      detail: aspects7
        ? 'Jupiter influences 7th — protective grace present.'
        : 'Jupiter does not classically aspect/occupy 7th — weaker protection.',
    })
  }

  return items
}

// ── Dual Jaimini / D9 ─────────────────────────────────────────

export interface DualJaiminiMilan {
  boy: JaiminiMarriageAnalysis | null
  girl: JaiminiMarriageAnalysis | null
  summary: string
  tone: MilanTone
}

export function analyzeDualJaiminiMarriage(boyChart: ChartOutput, girlChart: ChartOutput): DualJaiminiMilan {
  const boy = analyzeJaiminiMarriage(boyChart)
  const girl = analyzeJaiminiMarriage(girlChart)
  if (!boy && !girl) {
    return { boy: null, girl: null, summary: 'D9 / Upapada data incomplete for both charts.', tone: 'mixed' }
  }
  const parts: string[] = []
  if (boy) {
    parts.push(`Groom: ${boy.qualityBand} — ${boy.qualitySummary}`)
    if (boy.activeRedFlagCount > 0) parts.push(`Groom red flags: ${boy.activeRedFlagCount}`)
  }
  if (girl) {
    parts.push(`Bride: ${girl.qualityBand} — ${girl.qualitySummary}`)
    if (girl.activeRedFlagCount > 0) parts.push(`Bride red flags: ${girl.activeRedFlagCount}`)
  }
  const flags = (boy?.activeRedFlagCount ?? 0) + (girl?.activeRedFlagCount ?? 0)
  return {
    boy,
    girl,
    summary: parts.join(' · '),
    tone: flags >= 3 ? 'caution' : flags >= 1 ? 'mixed' : 'supportive',
  }
}
