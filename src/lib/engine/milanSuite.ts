// src/lib/engine/milanSuite.ts
// Milan expansions: Manglik pair, marriage timing + Antardasha,
// remedies, Vaidhavya catalog, dual Jaimini D9 summary, role helpers.
// Pure engine — no React/DB.

import type { ChartOutput, DashaNode, GrahaId } from '@/types/astrology'
import { GRAHA_NAMES } from '@/types/astrology'
import { calculateManglik, type ManglikAnalysis } from '@/lib/engine/doshas'
import { analyzeJaiminiMarriage, type JaiminiMarriageAnalysis } from '@/lib/engine/jaiminiMarriageAnalysis'
import type { MilanTone } from '@/lib/engine/milanExtras'
import type { EngineLang } from '@/lib/engine/lang'
import { gName } from '@/lib/engine/divisionalLang'
import { JMA_HI } from '@/lib/engine/locale/jaiminiMarriageAnalysis.hi'
import { MSU_HI } from '@/lib/engine/locale/milanSuite.hi'
import { MANGLIK_CANCEL_HI } from '@/lib/engine/locale/dashboardInsights.hi'

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

function manglikDisplay(m: ManglikAnalysis, lang: EngineLang): ManglikAnalysis {
  if (lang === 'en') return m
  return {
    ...m,
    cancellations: m.cancellations.map((c) => MANGLIK_CANCEL_HI[c] ?? c),
  }
}

export function analyzeManglikPair(
  boyChart: ChartOutput,
  girlChart: ChartOutput,
  lang: EngineLang = 'en',
): ManglikPairVerdict {
  const boyCalc = calculateManglik(boyChart.grahas, [], boyChart.lagnas.ascRashi)
  const girlCalc = calculateManglik(girlChart.grahas, [], girlChart.lagnas.ascRashi)
  const boy = manglikDisplay(boyCalc, lang)
  const girl = manglikDisplay(girlCalc, lang)

  const boyName = boyChart.meta.name || 'The first chart'
  const girlName = girlChart.meta.name || 'The second chart'
  const boyActive = boy.isManglik
  const girlActive = girl.isManglik
  const boyCancelled = !boy.isManglik && boy.cancellations.length > 0 && boy.house > 0
  const girlCancelled = !girl.isManglik && girl.cancellations.length > 0 && girl.house > 0

  if (!boyActive && !girlActive && !boyCancelled && !girlCancelled) {
    const m = MSU_HI.manglik.both_clear
    return {
      boy, girl, verdict: 'both_clear', tone: 'supportive',
      label: lang === 'en' ? 'Neither chart is Manglik' : m.label,
      detail: lang === 'en'
        ? 'Neither chart shows an active Kuja Dosha (Mars in the 1st, 4th, 7th, 8th or 12th house from the lagna).'
        : m.detail,
    }
  }

  if ((boyCancelled || !boyActive) && (girlCancelled || !girlActive) && (boyCancelled || girlCancelled)) {
    const fmtCancel = (list: string[]) =>
      lang === 'en'
        ? list.join(', ')
        : list.map((c) => MANGLIK_CANCEL_HI[c] ?? c).join(', ')
    const boyCancel = fmtCancel(boy.cancellations) || (lang === 'en' ? 'no Mars concern' : 'मंगल चिंता नहीं')
    const girlCancel = fmtCancel(girl.cancellations) || (lang === 'en' ? 'no Mars concern' : 'मंगल चिंता नहीं')
    return {
      boy, girl, verdict: 'cancelled', tone: 'supportive',
      label: lang === 'en' ? 'Manglik effect softened by cancellation' : MSU_HI.manglik.cancelled.label,
      detail: lang === 'en'
        ? `Classical cancellation rules apply, which soften the Mars influence. ${boyName}: ${boyCancel}; ${girlName}: ${girlCancel}.`
        : MSU_HI.manglik.cancelled.detail(boyName, girlName, boyCancel, girlCancel),
    }
  }

  if (boyActive && girlActive) {
    const matched = boy.intensity === girl.intensity
    const bInt = boy.intensity.toLowerCase()
    const gInt = girl.intensity.toLowerCase()
  const bothKey = matched ? 'matched_intensity' : 'both_manglik'
  const bothHi = MSU_HI.manglik[bothKey]
    return {
      boy, girl,
      verdict: matched ? 'matched_intensity' : 'both_manglik',
      tone: matched ? 'supportive' : 'mixed',
      label: lang === 'en'
        ? (matched ? 'Both Manglik, similar strength' : 'Both Manglik, strength differs')
        : bothHi.label,
      detail: lang === 'en'
        ? `${boyName}: ${bInt} Mars influence (house ${boy.house}); ${girlName}: ${gInt} Mars influence (house ${girl.house}). Manglik means Mars sits in a house traditionally linked to extra heat in partnership; when both charts carry it, tradition sees the two as balancing each other.`
        : bothHi.detail(boyName, girlName, bInt, boy.house, gInt, girl.house),
    }
  }

  const activeName = boyActive ? boyName : girlName
  const intensity = (boyActive ? boy.intensity : girl.intensity).toLowerCase()
  return {
    boy, girl, verdict: 'mismatch', tone: 'caution',
    label: lang === 'en' ? 'Manglik in one chart only' : MSU_HI.manglik.mismatch.label,
    detail: lang === 'en'
      ? `${activeName} has an active Kuja Dosha (${intensity} strength); the other chart does not. Manglik means Mars sits in a house traditionally linked to extra heat in partnership. Cancellation rules and age both matter, and this is not a verdict on the relationship; traditional remedies or a closer read can help.`
      : MSU_HI.manglik.mismatch.detail(activeName, intensity),
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
  lang: EngineLang = 'en',
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
      const bLord = gName(bm.lord as GrahaId, lang)
      const gLord = gName(gm.lord as GrahaId, lang)
      const toneText = lang === 'en'
        ? (tone === 'supportive' ? 'a supportive period for marriage' : tone === 'caution' ? 'a period that may call for patience' : 'mixed timing')
        : (tone === 'supportive' ? MSU_HI.timing.mahaNoteSupport : tone === 'caution' ? MSU_HI.timing.mahaNoteCaution : MSU_HI.timing.mahaNoteMixed)
      windows.push({
        start: iso(start),
        end: iso(end),
        boyLords: bLord,
        girlLords: gLord,
        score,
        tone,
        note: lang === 'en'
          ? `Maha ${bLord} × ${gLord} — ${toneText}.`
          : MSU_HI.timing.mahaLine(bLord, gLord, toneText),
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
        boyLords: `${gName(bp[0].lord as GrahaId, lang)}/${gName(bAntar.lord as GrahaId, lang)}`,
        girlLords: `${gName(gp[0].lord as GrahaId, lang)}/${gName(gAntar.lord as GrahaId, lang)}`,
        score,
        tone,
        note: lang === 'en'
          ? 'Current Antardasha overlap, useful for finer timing when planning engagement and muhurta (auspicious-time) discussions.'
          : MSU_HI.timing.antarCurrent,
      })
    }
  }

  // Next few antar overlaps (groom-role current Maha children × bride-role current Maha children)
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
          boyLords: `${gName(bp[0].lord as GrahaId, lang)}/${gName(ba.lord as GrahaId, lang)}`,
          girlLords: `${gName(gp[0].lord as GrahaId, lang)}/${gName(ga.lord as GrahaId, lang)}`,
          score,
          tone,
          note: lang === 'en' ? 'Upcoming Antardasha pair within the current Mahadashas.' : MSU_HI.timing.antarUpcoming,
        })
      }
    }
  }
  antarPairs.sort((a, b) => a.start.localeCompare(b.start))

  const best = windows.filter(w => w.tone === 'supportive').slice(0, 2)
  const summary = best.length
    ? (lang === 'en'
      ? `Supportive Mahadasha windows include ${best.map(w => `${w.start} to ${w.end}`).join('; ')}. Antardasha detail and a muhurta (auspicious-time) check can refine these.`
      : MSU_HI.timing.summaryBest(best.map(w => `${w.start} से ${w.end}`).join('; ')))
    : (lang === 'en'
      ? 'No strongly supportive Mahadasha overlaps appear in the next ~12 years in this Venus/Jupiter-weighted scan. The Antardasha detail and muhurta (auspicious-time) check can still help with timing.'
      : MSU_HI.timing.summaryNone)

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

export function buildMilanRemedies(
  input: {
    nadiDosha?: boolean
    bhakootDosha?: boolean
    manglikMismatch?: boolean
    ganaHarsh?: boolean
    poruthamCriticalFails?: string[]
  },
  lang: EngineLang = 'en',
): MilanRemedy[] {
  const out: MilanRemedy[] = []
  const hi = (id: keyof typeof MSU_HI.remedies) => {
    const r = MSU_HI.remedies[id]
    return typeof r === 'object' && r && 'title' in r ? r as { forDosha: string; title: string; detail: string } : null
  }
  if (input.nadiDosha) {
    const r = lang === 'en' ? null : hi('nadi')
    out.push({
      id: 'nadi',
      forDosha: lang === 'en' ? 'Nadi Dosha' : r!.forDosha,
      title: lang === 'en' ? 'Nadi pacification' : r!.title,
      detail: lang === 'en'
        ? 'Check first whether Nadi cancellation rules apply. Traditional steps include Mahamrityunjaya japa and donating grains or clothes on the weekday of the natal Moon; a routine pre-marriage health check is also sensible. Traditional remedies are not medical advice.'
        : r!.detail,
      priority: 'high',
    })
  }
  if (input.bhakootDosha) {
    const r = lang === 'en' ? null : hi('bhakoot')
    out.push({
      id: 'bhakoot',
      forDosha: lang === 'en' ? 'Bhakoot Dosha' : r!.forDosha,
      title: lang === 'en' ? 'Bhakoot / life-path harmony' : r!.title,
      detail: lang === 'en'
        ? 'Traditional steps include joint charity on full-moon days, strengthening the Moon (pearl or silver, if suitable), and shared travel or home goals to align life direction. Bhakoot is often softened when the sign lords are friends, so check that first. Traditional remedies are not medical advice.'
        : r!.detail,
      priority: 'high',
    })
  }
  if (input.manglikMismatch) {
    const r = lang === 'en' ? null : hi('manglik')
    out.push({
      id: 'manglik',
      forDosha: lang === 'en' ? 'Kuja Dosha in one chart' : r!.forDosha,
      title: lang === 'en' ? 'Manglik balance / Kuja shanti' : r!.title,
      detail: lang === 'en'
        ? 'Manglik effects are often softened by cancellation rules and by age. Classical Kuja shanti includes Tuesday fasting, a Mars mantra and, if the chart suits it, coral; a close read of both charts helps decide what fits. Traditional remedies are not medical advice.'
        : r!.detail,
      priority: 'high',
    })
  }
  if (input.ganaHarsh) {
    const r = lang === 'en' ? null : hi('gana')
    out.push({
      id: 'gana',
      forDosha: lang === 'en' ? 'Gana mismatch' : r!.forDosha,
      title: lang === 'en' ? 'Temperament bridging' : r!.title,
      detail: lang === 'en'
        ? 'Clear communication agreements, pausing before heated decisions, and strengthening Jupiter (Thursday seva) can help with patience between the Deva and Rakshasa temperaments. Traditional remedies are not medical advice.'
        : r!.detail,
      priority: 'medium',
    })
  }
  for (const name of input.poruthamCriticalFails ?? []) {
    const r = lang === 'en' ? null : MSU_HI.remedies.porutham(name)
    out.push({
      id: `porutham-${name}`,
      forDosha: lang === 'en' ? `Porutham · ${name}` : r!.forDosha,
      title: lang === 'en' ? `${name} Porutham care` : r!.title,
      detail: lang === 'en'
        ? `The South Indian Porutham system flags ${name}. It is worth cross-checking with Ashtakoot and the D1/D9 charts before drawing conclusions; temple-based shanti practices vary by region. Traditional remedies are not medical advice.`
        : r!.detail,
      priority: 'medium',
    })
  }
  if (out.length === 0) {
    const r = lang === 'en' ? null : hi('general')
    out.push({
      id: 'general',
      forDosha: lang === 'en' ? 'General' : r!.forDosha,
      title: lang === 'en' ? 'Maintain harmony' : r!.title,
      detail: lang === 'en'
        ? 'No major dosha flags in this scan. A wedding muhurta (auspicious time) and a look at both dasha timelines before big decisions are still worthwhile.'
        : r!.detail,
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

/** Named classical partner-wellbeing cues (simplified detection, not exhaustive). */
export function catalogVaidhavyaCues(chart: ChartOutput, lang: EngineLang = 'en'): VaidhavyaCatalogItem[] {
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
  const v = MSU_HI.vaidhavya
  items.push({
    id: 'ma-sa-78',
    name: lang === 'en' ? 'Mars or Saturn in the 7th/8th house' : v['ma-sa-78'].name,
    present: !!(ma7 || sa7),
    detail: ma7 || sa7
      ? (lang === 'en'
        ? 'Mars or Saturn sits in the partnership or longevity houses, a classical cue for extra strain in the partnership. It is read with the whole chart and is not a prediction of loss.'
        : v['ma-sa-78'].yes)
      : (lang === 'en' ? 'Neither Mars nor Saturn sits in the 7th or 8th house from the lagna.' : v['ma-sa-78'].no),
  })

  items.push({
    id: 'rahu-7',
    name: lang === 'en' ? 'Rahu in 7th' : v['rahu-7'].name,
    present: !!(ra && wholeSignHouse(ra.rashi, asc) === 7),
    detail: ra && wholeSignHouse(ra.rashi, asc) === 7
      ? (lang === 'en'
        ? 'Rahu in the 7th house points to an unconventional partnership; some texts link it to periods of distance, which good communication can ease.'
        : v['rahu-7'].yes)
      : (lang === 'en' ? 'Rahu is not in the 7th house.' : v['rahu-7'].no),
  })

  const veH = ve ? wholeSignHouse(ve.rashi, asc) : 0
  items.push({
    id: 've-dusthana',
    name: lang === 'en' ? 'Venus in a challenging house (6th, 8th or 12th)' : v['ve-dusthana'].name,
    present: !!(ve && [6, 8, 12].includes(veH)),
    detail: ve && [6, 8, 12].includes(veH)
      ? (lang === 'en'
        ? `Venus is in the ${veH}th house, so the planet of partnership happiness is under some strain.`
        : v['ve-dusthana'].yes(veH))
      : (lang === 'en' ? 'Venus is not in the 6th, 8th or 12th house.' : v['ve-dusthana'].no),
  })

  if (ju) {
    const jh = wholeSignHouse(ju.rashi, asc)
    // Whole-sign: Jupiter aspects 5th, 7th, 9th from itself
    const aspects7 = [4, 6, 8].includes((7 - jh + 12) % 12) || jh === 7
    items.push({
      id: 'ju-weak-protect',
      name: lang === 'en' ? 'Jupiter not supporting the 7th house' : v['ju-weak-protect'].name,
      present: !aspects7,
      detail: aspects7
        ? (lang === 'en' ? 'Jupiter influences the 7th house, a classical sign of protective support.' : v['ju-weak-protect'].yes)
        : (lang === 'en'
          ? 'Jupiter does not occupy or aspect the 7th house in the classical way, so that protective support is lighter.'
          : v['ju-weak-protect'].no),
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

export function analyzeDualJaiminiMarriage(
  boyChart: ChartOutput,
  girlChart: ChartOutput,
  lang: EngineLang = 'en',
): DualJaiminiMilan {
  const boy = analyzeJaiminiMarriage(boyChart, lang)
  const girl = analyzeJaiminiMarriage(girlChart, lang)
  if (!boy && !girl) {
    return {
      boy: null,
      girl: null,
      summary: lang === 'en' ? 'D9 and Upapada data are incomplete for both charts.' : JMA_HI.dualIncomplete,
      tone: 'mixed',
    }
  }
  const parts: string[] = []
  const boyName = boyChart.meta.name || (lang === 'en' ? 'The first chart' : JMA_HI.dualChartA)
  const girlName = girlChart.meta.name || (lang === 'en' ? 'The second chart' : JMA_HI.dualChartB)
  const bandLabel = (band: string) =>
    lang === 'en' ? band : (JMA_HI.qualityBand[band as keyof typeof JMA_HI.qualityBand] ?? band)
  const watchLabel = lang === 'en' ? 'points to watch' : JMA_HI.dualWatch
  if (boy) {
    parts.push(`${boyName}: ${bandLabel(boy.qualityBand)} — ${boy.qualitySummary}`)
    if (boy.activeRedFlagCount > 0) parts.push(`${boyName}, ${watchLabel}: ${boy.activeRedFlagCount}`)
  }
  if (girl) {
    parts.push(`${girlName}: ${bandLabel(girl.qualityBand)} — ${girl.qualitySummary}`)
    if (girl.activeRedFlagCount > 0) parts.push(`${girlName}, ${watchLabel}: ${girl.activeRedFlagCount}`)
  }
  const flags = (boy?.activeRedFlagCount ?? 0) + (girl?.activeRedFlagCount ?? 0)
  return {
    boy,
    girl,
    summary: parts.join(' · '),
    tone: flags >= 3 ? 'caution' : flags >= 1 ? 'mixed' : 'supportive',
  }
}
