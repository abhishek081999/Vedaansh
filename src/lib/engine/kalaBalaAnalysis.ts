// ─────────────────────────────────────────────────────────────
//  src/lib/engine/kalaBalaAnalysis.ts
//  Interpretive Kaal (Kala) Bala — temporal / “time luck” strength
//  Soft Virupa bands from practitioner lecture heuristics;
//  classical component floor = 112 Virupas (Parashara-style UI).
// ─────────────────────────────────────────────────────────────

import type { DashaNode, GrahaData, GrahaId, Rashi, ShadbalaPlanet, ShadbalaResult } from '@/types/astrology'
import { GRAHA_NAMES } from '@/types/astrology'
import { DEBILITATION_SIGN } from '@/lib/engine/dignity'
import { D3, D4, D7, D9, D10, D27 } from '@/lib/engine/vargas'

const ORDER: GrahaId[] = ['Su', 'Mo', 'Ma', 'Me', 'Ju', 'Ve', 'Sa']

/** Classical Kaal component minimum (Virupas). */
export const KALA_CLASSICAL_MIN_VIRUPAS = 112

/** Soft lecture baseline. */
export const KALA_SOFT_BASELINE = 100

/** Soft “good / stable” floor — lecture Top-1% style consistency. */
export const KALA_SOFT_STABLE = 130

/** Soft strong for dasha outcomes. */
export const KALA_SOFT_STRONG = 150

/** Very high Kaal (e.g. Moon “bhog” warning zone starts high). */
export const KALA_SOFT_VERY_HIGH = 200

type KalaGraha = 'Su' | 'Mo' | 'Ma' | 'Me' | 'Ju' | 'Ve' | 'Sa' | 'Ra' | 'Ke'

const SIGN_LORDS: Record<Rashi, GrahaId> = {
  1: 'Ma', 2: 'Ve', 3: 'Me', 4: 'Mo', 5: 'Su', 6: 'Me',
  7: 'Ve', 8: 'Ma', 9: 'Ju', 10: 'Sa', 11: 'Sa', 12: 'Ju',
}

export type KalaSoftBand =
  | 'exceptional'
  | 'very_high'
  | 'strong'
  | 'stable'
  | 'baseline'
  | 'weak'

export type KalaTimeProfile = 'stable' | 'fluctuating' | 'weak'

export type KalaCareerPath = 'job_ok' | 'business_preferred' | 'mixed'

export type KalaPredictionTone = 'favorable' | 'supportive' | 'mixed' | 'caution'

export type KalaPredictionTopic =
  | 'time_quality'
  | 'job_vs_business'
  | 'career'
  | 'curvature'
  | 'exam'
  | 'prosperity'
  | 'moon_bhog'
  | 'business_name'
  | 'health'
  | 'drain'
  | 'guidance'

export interface KalaPlanetAnalysis {
  id: GrahaId
  name: string
  virupas: number
  rupas: number
  classicalRatio: number
  meetsClassicalMin: boolean
  softBand: KalaSoftBand
  isSoftStrong: boolean
  bodyCue: string | null
  remedy: string
  themes: string[]
  breakdown: {
    natha: number
    paksha: number
    tribhaga: number
    vaara: number
    hora: number
    maasa: number
    varsha: number
    ayana: number
  } | null
}

export interface KalaDashaCue {
  role: 'previous' | 'current' | 'next'
  lord: string
  lordName: string
  scoredId: GrahaId | null
  scoredName: string | null
  viaDispositor: boolean
  virupas: number | null
  softBand: KalaSoftBand | 'unscored'
  note: string
  start?: string
  end?: string
}

export interface KalaCurvature {
  fromRole: 'previous' | 'current'
  toRole: 'current' | 'next'
  fromLord: string
  toLord: string
  fromVirupas: number
  toVirupas: number
  delta: number
  pctChange: number
  direction: 'up' | 'down' | 'flat'
  note: string
}

export interface KalaDrainHint {
  varga: string
  label: string
  meaning: string
  active: boolean
  detail: string
}

export interface KalaPrediction {
  id: string
  topic: KalaPredictionTopic
  title: string
  tone: KalaPredictionTone
  text: string
  basedOn?: string
  virupas?: number | null
}

export interface KalaBalaAnalysis {
  profile: KalaTimeProfile
  profileNote: string
  summary: string
  careerPath: KalaCareerPath
  careerPathNote: string
  meanVirupas: number
  minVirupas: number
  maxVirupas: number
  spreadVirupas: number
  dipCount: number
  rows: KalaPlanetAnalysis[]
  strongestId: GrahaId
  weakestId: GrahaId
  dasha: {
    previous: KalaDashaCue | null
    current: KalaDashaCue | null
    next: KalaDashaCue | null
  }
  curvature: KalaCurvature[]
  drains: KalaDrainHint[]
  predictions: KalaPrediction[]
  goldenRule: string
}

const BODY_CUES: Record<KalaGraha, string> = {
  Su: 'Confidence and leadership hold may feel thin — not medical advice.',
  Mo: 'Food, water, or living comfort quality may be off — not medical advice.',
  Ma: 'Physical drive / mineral balance may need attention — not medical advice.',
  Me: 'Hormones, enzymes, or gut rhythm may feel off — not medical advice.',
  Ju: 'Luck, contentment, or learning appetite may feel low.',
  Ve: 'Harmony, devotion, or relational ease may feel drained.',
  Sa: 'Bone / structure fatigue and career weight may show — Vitamin D3 is a common folk cue, not medical advice.',
  Ra: 'Time may feel amplified and restless.',
  Ke: 'Time may feel broken or withdrawn.',
}

const REMEDIES: Record<KalaGraha, string> = {
  Su: 'Lead small projects, respect seniors/father/government, wake before sunrise, fix fairness and daily discipline.',
  Mo: 'Serve without return, keep home clean, do not waste food/water, feed guests, kindness, Krishna bhog/bhakti.',
  Ma: 'Help without discrimination, protect health, take a stand, check minerals/blood where appropriate.',
  Me: 'Certifications, clean notes/docs, schedules, disciplined communication and accounts.',
  Ju: 'Teach/counsel, charity, Gita/Ramayana/study, satsang, complete courses, associate with wise elders.',
  Ve: 'Jagran/kirtan/puja/shringar, hygiene, respect spouse; heal lineage disrespect toward women; avoid wandering eyes.',
  Sa: 'Serve elderly and dependents, upgrade professional skills/certifications, honest hard work.',
  Ra: 'Keep ambition honest; do not overshare finances in weak windows.',
  Ke: 'Accept breaks; simplify; avoid forcing continuity when Ketu cuts.',
}

const THEMES: Record<KalaGraha, string[]> = {
  Su: ['father', 'leadership', 'discipline', 'government'],
  Mo: ['mother', 'comfort', 'masses', 'nutrition'],
  Ma: ['courage', 'protection', 'targets', 'blood/health'],
  Me: ['papers', 'salary numbers', 'children', 'communication'],
  Ju: ['dharma', 'wisdom', 'luck', 'public support'],
  Ve: ['bhakti', 'luxury', 'spouse', 'domestic harmony'],
  Sa: ['career', 'hard work', 'service to vulnerable'],
  Ra: ['amplification', 'worldly push'],
  Ke: ['breaks', 'solitude', 'detachment'],
}

const DRAIN_DEFS: Array<{ key: string; fn: (lon: number) => number; label: string; meaning: string }> = [
  { key: 'D3', fn: D3, label: 'D3 Drekkana', meaning: 'Mental exhaustion — thought process may be self-poisoning.' },
  { key: 'D27', fn: D27, label: 'D27 Bhamsha', meaning: 'Inner/nakshatra energy drain.' },
  { key: 'D4', fn: D4, label: 'D4 Chaturthamsha', meaning: 'Drain at home / personal space.' },
  { key: 'D10', fn: D10, label: 'D10 Dashamsha', meaning: 'Drain at office / karma field.' },
  { key: 'D7', fn: D7, label: 'D7 Saptamsha', meaning: 'Drain through social circle.' },
  { key: 'D9', fn: D9, label: 'D9 Navamsha', meaning: 'Partner (spouse/business) may be draining you.' },
]

function softBandFor(virupas: number): KalaSoftBand {
  if (virupas >= 250) return 'exceptional'
  if (virupas >= KALA_SOFT_VERY_HIGH) return 'very_high'
  if (virupas >= KALA_SOFT_STRONG) return 'strong'
  if (virupas >= KALA_SOFT_STABLE) return 'stable'
  if (virupas >= KALA_SOFT_BASELINE) return 'baseline'
  return 'weak'
}

function isSoftStrong(band: KalaSoftBand): boolean {
  return band === 'stable' || band === 'strong' || band === 'very_high' || band === 'exceptional'
}

function bandLabel(band: KalaSoftBand | 'unscored'): string {
  switch (band) {
    case 'exceptional': return 'exceptional'
    case 'very_high': return 'very high'
    case 'strong': return 'strong'
    case 'stable': return 'stable'
    case 'baseline': return 'baseline'
    case 'weak': return 'weak'
    default: return 'unscored'
  }
}

function virupasOf(p: ShadbalaPlanet | undefined): number {
  if (!p) return 0
  if (typeof p.componentShash?.kala === 'number' && Number.isFinite(p.componentShash.kala)) {
    return p.componentShash.kala
  }
  return (p.kalaBala ?? 0) * 60
}

function resolveScoredLord(
  lord: string,
  grahas?: GrahaData[],
): { scoredId: GrahaId | null; viaDispositor: boolean } {
  if (ORDER.includes(lord as GrahaId)) {
    return { scoredId: lord as GrahaId, viaDispositor: false }
  }
  if ((lord === 'Ra' || lord === 'Ke') && grahas?.length) {
    const node = grahas.find((g) => g.id === lord)
    if (node?.rashi) {
      return { scoredId: SIGN_LORDS[node.rashi as Rashi], viaDispositor: true }
    }
  }
  return { scoredId: null, viaDispositor: lord === 'Ra' || lord === 'Ke' }
}

function dashaNote(
  role: 'previous' | 'current' | 'next',
  lord: string,
  scoredId: GrahaId | null,
  viaDispositor: boolean,
  virupas: number | null,
  band: KalaSoftBand | 'unscored',
): string {
  const lordName = GRAHA_NAMES[lord as GrahaId] ?? lord
  const roleWord = role === 'previous' ? 'Previous' : role === 'current' ? 'Current' : 'Upcoming'
  if (virupas == null || !scoredId || band === 'unscored') {
    return `${roleWord} ${lordName} mahadasha has no direct Kaal score (use dispositor for Rahu/Ketu).`
  }
  const via = viaDispositor ? ` via ${GRAHA_NAMES[scoredId]}` : ''
  if (band === 'exceptional' || band === 'very_high' || band === 'strong') {
    return `${roleWord} ${lordName}${via}: ${virupas.toFixed(0)} Virupas (${bandLabel(band)}) — time luck is strong; work for yourself and maximize this window.`
  }
  if (band === 'stable') {
    return `${roleWord} ${lordName}${via}: ${virupas.toFixed(0)} Virupas (stable) — consistent time support for effort and job continuity.`
  }
  if (band === 'baseline') {
    return `${roleWord} ${lordName}${via}: ${virupas.toFixed(0)} Virupas (baseline) — usable but not a golden period; save and stay humble.`
  }
  return `${roleWord} ${lordName}${via}: ${virupas.toFixed(0)} Virupas (weak) — time is heavy; save, reduce exposure, hire/partner with stronger-time people if possible.`
}

function pickMahaTriple(
  nodes: DashaNode[],
  asOf: Date,
): { previous: DashaNode | null; current: DashaNode | null; next: DashaNode | null } {
  const maha = nodes
    .filter((n) => n.level === 1)
    .slice()
    .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())
  if (!maha.length) return { previous: null, current: null, next: null }

  const t = asOf.getTime()
  const current =
    maha.find((n) => n.isCurrent) ??
    maha.find((n) => {
      const s = new Date(n.start).getTime()
      const e = new Date(n.end).getTime()
      return t >= s && t <= e
    }) ??
    null

  if (!current) {
    const upcoming = maha.find((n) => new Date(n.start).getTime() > t) ?? null
    const idx = upcoming ? maha.indexOf(upcoming) : -1
    return {
      previous: idx > 0 ? maha[idx - 1] : null,
      current: null,
      next: upcoming,
    }
  }

  const idx = maha.indexOf(current)
  return {
    previous: idx > 0 ? maha[idx - 1] : null,
    current,
    next: idx >= 0 && idx < maha.length - 1 ? maha[idx + 1] : null,
  }
}

function buildDashaCue(
  role: 'previous' | 'current' | 'next',
  node: DashaNode | null,
  shadbala: ShadbalaResult,
  grahas?: GrahaData[],
): KalaDashaCue | null {
  if (!node?.lord) return null
  const lord = node.lord
  const { scoredId, viaDispositor } = resolveScoredLord(lord, grahas)
  const virupas = scoredId ? virupasOf(shadbala.planets[scoredId]) : null
  const softBand: KalaSoftBand | 'unscored' =
    scoredId && virupas != null ? softBandFor(virupas) : 'unscored'

  return {
    role,
    lord,
    lordName: GRAHA_NAMES[lord as GrahaId] ?? lord,
    scoredId,
    scoredName: scoredId ? GRAHA_NAMES[scoredId] : null,
    viaDispositor,
    virupas,
    softBand,
    note: dashaNote(role, lord, scoredId, viaDispositor, virupas, softBand),
    start: node.start ? new Date(node.start).toISOString() : undefined,
    end: node.end ? new Date(node.end).toISOString() : undefined,
  }
}

function buildCurvature(a: KalaDashaCue | null, b: KalaDashaCue | null): KalaCurvature | null {
  if (!a || !b || a.virupas == null || b.virupas == null) return null
  const delta = b.virupas - a.virupas
  const pctChange = a.virupas === 0 ? (b.virupas > 0 ? 100 : 0) : (delta / a.virupas) * 100
  const direction: KalaCurvature['direction'] =
    Math.abs(delta) < 8 ? 'flat' : delta > 0 ? 'up' : 'down'
  const note =
    direction === 'up'
      ? `Curvature ${a.lordName} (${a.virupas.toFixed(0)}) → ${b.lordName} (${b.virupas.toFixed(0)}): upward ~${pctChange.toFixed(0)}%. Hard phase pays off later — keep applying.`
      : direction === 'down'
        ? `Curvature ${a.lordName} (${a.virupas.toFixed(0)}) → ${b.lordName} (${b.virupas.toFixed(0)}): downward ~${Math.abs(pctChange).toFixed(0)}%. Save 6+ months before the drop; do not inflate lifestyle.`
        : `Curvature ${a.lordName} → ${b.lordName} is nearly flat (${a.virupas.toFixed(0)} → ${b.virupas.toFixed(0)}).`

  return {
    fromRole: a.role === 'next' ? 'current' : a.role,
    toRole: b.role === 'previous' ? 'current' : b.role,
    fromLord: a.lordName,
    toLord: b.lordName,
    fromVirupas: a.virupas,
    toVirupas: b.virupas,
    delta: +delta.toFixed(2),
    pctChange: +pctChange.toFixed(1),
    direction,
    note,
  }
}

function houseFromAsc(planetRashi: number, ascRashi: number): number {
  return ((planetRashi - ascRashi + 12) % 12) + 1
}

function scanDrains(planetId: GrahaId, grahas?: GrahaData[]): KalaDrainHint[] {
  const g = grahas?.find((x) => x.id === planetId)
  if (!g || typeof g.totalDegree !== 'number') {
    return DRAIN_DEFS.map((d) => ({
      varga: d.key,
      label: d.label,
      meaning: d.meaning,
      active: false,
      detail: 'Add natal longitudes to scan varga drain points.',
    }))
  }
  const debil = DEBILITATION_SIGN[planetId]
  return DRAIN_DEFS.map((d) => {
    const sign = d.fn(g.totalDegree) as Rashi
    const active = debil != null && sign === debil
    return {
      varga: d.key,
      label: d.label,
      meaning: d.meaning,
      active,
      detail: active
        ? `${GRAHA_NAMES[planetId]} is debilitated in ${d.key} (sign ${sign}) — treat this life area as a Kaal leakage point.`
        : `${GRAHA_NAMES[planetId]} is not debilitated in ${d.key} (sign ${sign}).`,
    }
  })
}

function toneFromBand(band: KalaSoftBand | 'unscored'): KalaPredictionTone {
  if (band === 'exceptional' || band === 'very_high') return 'favorable'
  if (band === 'strong' || band === 'stable') return 'supportive'
  if (band === 'baseline' || band === 'unscored') return 'mixed'
  return 'caution'
}

function timingLabel(cue: KalaDashaCue): string {
  if (cue.viaDispositor && cue.scoredName) return `${cue.lordName} (via ${cue.scoredName})`
  return cue.lordName
}

function buildPredictions(input: {
  profile: KalaTimeProfile
  careerPath: KalaCareerPath
  careerPathNote: string
  meanVirupas: number
  dipCount: number
  rows: KalaPlanetAnalysis[]
  dasha: { previous: KalaDashaCue | null; current: KalaDashaCue | null; next: KalaDashaCue | null }
  curvature: KalaCurvature[]
  drains: KalaDrainHint[]
  mercuryInKendra: boolean | null
}): KalaPrediction[] {
  const out: KalaPrediction[] = []

  out.push({
    id: 'time-quality',
    topic: 'time_quality',
    title: 'How your time is running',
    tone:
      input.profile === 'stable' ? 'favorable' : input.profile === 'weak' ? 'caution' : 'mixed',
    text:
      input.profile === 'stable'
        ? `Kaal stays consistently high (mean ${input.meanVirupas.toFixed(0)}, min clears ~${KALA_SOFT_STABLE}) — Top-tier time luck: effort converts even from ordinary circumstances.`
        : input.profile === 'weak'
          ? `Weak / dip-heavy Kaal (mean ${input.meanVirupas.toFixed(0)}, ${input.dipCount} weak planets) — even good ventures can turn to dust until a stronger MD runs.`
          : `Fluctuating Kaal (mean ${input.meanVirupas.toFixed(0)}) — life shows clear ups and downs; time quality changes with mahadasha.`,
  })

  out.push({
    id: 'job-vs-biz',
    topic: 'job_vs_business',
    title: 'Job vs business',
    tone:
      input.careerPath === 'job_ok'
        ? 'supportive'
        : input.careerPath === 'business_preferred'
          ? 'caution'
          : 'mixed',
    text: input.careerPathNote,
  })

  const timing = input.dasha.next ?? input.dasha.current
  const timingRole = input.dasha.next ? 'upcoming' : 'current'

  if (timing && timing.virupas != null && timing.softBand !== 'unscored') {
    const label = timingLabel(timing)
    const tone = toneFromBand(timing.softBand)
    let careerText = ''
    if (timing.softBand === 'exceptional' || timing.softBand === 'very_high' || timing.softBand === 'strong') {
      careerText = `${timingRole === 'upcoming' ? 'When' : 'While'} ${label} runs (${timing.virupas.toFixed(0)} Virupas), work for yourself, apply widely (exams/roles), and bank surplus — golden-time rule.`
    } else if (timing.softBand === 'stable') {
      careerText = `${timingRole === 'upcoming' ? 'Upcoming' : 'Current'} ${label} (${timing.virupas.toFixed(0)}) supports steady job continuity and consistent output.`
    } else if (timing.lord === 'Sa' || timing.scoredId === 'Sa') {
      careerText = `Saturn-timed Kaal at ${timing.virupas.toFixed(0)} is heavy — layoffs, stalled promotions, manager pressure, or lonely overtime are classic. No relative saves you; save early and keep patience.`
    } else if (timing.softBand === 'weak') {
      careerText = `Weak ${label} Kaal (${timing.virupas.toFixed(0)}) — prefer not to force prestige jobs; partner/hire people with better time luck; cut lifestyle inflation.`
    } else {
      careerText = `${label} Kaal is baseline (${timing.virupas.toFixed(0)}) — usable but start saving before any weaker successor period.`
    }
    out.push({
      id: 'career-md',
      topic: 'career',
      title: timingRole === 'upcoming' ? 'Career timing (next MD)' : 'Career timing (current MD)',
      tone: timing.lord === 'Sa' || timing.scoredId === 'Sa' ? 'caution' : tone,
      text: careerText,
      basedOn: label,
      virupas: timing.virupas,
    })

    if (timing.softBand === 'strong' || timing.softBand === 'very_high' || timing.softBand === 'exceptional') {
      out.push({
        id: 'exam-md',
        topic: 'exam',
        title: 'Exams / selection window',
        tone: 'favorable',
        text: `Rising/strong ${label} Kaal (${timing.virupas.toFixed(0)}) supports clearing exams and selections — apply even to “lower” posts in a good window; switch later if needed.`,
        basedOn: label,
        virupas: timing.virupas,
      })
      out.push({
        id: 'prosperity-md',
        topic: 'prosperity',
        title: 'Bhagyodaya cue',
        tone: 'favorable',
        text: `Strong overall timing under ${label} — needs tend to get met; maximize the period rather than under-using it.`,
        basedOn: label,
        virupas: timing.virupas,
      })
    }

    // Strong Moon warning
    if ((timing.lord === 'Mo' || timing.scoredId === 'Mo') && timing.virupas >= KALA_SOFT_VERY_HIGH) {
      out.push({
        id: 'moon-bhog',
        topic: 'moon_bhog',
        title: 'Strong Moon Kaal warning',
        tone: 'mixed',
        text: `Moon Kaal is very high (${timing.virupas.toFixed(0)}) — may force “sit at home / enjoy punya” dynamics: interviews stall at finals, income via rent/investments/mother/social help more than grind.`,
        basedOn: label,
        virupas: timing.virupas,
      })
    }
  } else if (!timing) {
    out.push({
      id: 'career-no-dasha',
      topic: 'career',
      title: 'Career timing',
      tone: 'mixed',
      text: 'Load Vimshottari mahadashas to time Kaal predictions from previous → current → next lords.',
    })
  }

  for (const c of input.curvature) {
    out.push({
      id: `curve-${c.fromLord}-${c.toLord}`,
      topic: 'curvature',
      title: `Curvature ${c.fromLord} → ${c.toLord}`,
      tone: c.direction === 'up' ? 'favorable' : c.direction === 'down' ? 'caution' : 'mixed',
      text: c.note,
      basedOn: `${c.fromLord}→${c.toLord}`,
      virupas: c.toVirupas,
    })
  }

  const me = input.rows.find((r) => r.id === 'Me')
  if (me) {
    const tone = me.isSoftStrong && input.mercuryInKendra ? 'favorable' : me.isSoftStrong ? 'supportive' : 'mixed'
    out.push({
      id: 'biz-name',
      topic: 'business_name',
      title: 'Business name / Mercury',
      tone,
      text:
        me.isSoftStrong && input.mercuryInKendra
          ? `Mercury Kaal is strong (${me.virupas.toFixed(0)}) and Mercury sits in a kendra — favorable for putting this native’s name on a business.`
          : me.isSoftStrong
            ? `Mercury Kaal is strong (${me.virupas.toFixed(0)}) — good for business paperwork/accounts; kendra placement would further favor naming.`
            : `Mercury Kaal is only ${me.virupas.toFixed(0)} — prefer a family member with stronger Mercury Kaal for business naming if possible.`,
      basedOn: 'Mercury',
      virupas: me.virupas,
    })
  }

  const weakBody = input.rows.filter((r) => r.bodyCue)
  if (weakBody.length) {
    out.push({
      id: 'health',
      topic: 'health',
      title: 'Body / nutrition cues',
      tone: 'caution',
      text: weakBody.map((r) => `${r.name}: ${r.bodyCue}`).join(' '),
    })
  }

  const activeDrains = input.drains.filter((d) => d.active)
  if (activeDrains.length) {
    out.push({
      id: 'drain',
      topic: 'drain',
      title: 'Kaal drain points (vargas)',
      tone: 'caution',
      text: activeDrains.map((d) => `${d.label}: ${d.meaning}`).join(' '),
    })
  }

  out.push({
    id: 'guidance-weak',
    topic: 'guidance',
    title: 'Weak-time conduct',
    tone: 'mixed',
    text: 'In weak Kaal windows: create distance, do not overshare finances, save aggressively, keep patience — “jitna neeche gaya hai utna upar bhi aata hai.” Prefer partners whose Kaal is running well.',
  })

  return out
}

export interface AnalyzeKalaBalaOptions {
  dashaNodes?: DashaNode[]
  grahas?: GrahaData[]
  ascRashi?: Rashi
  asOf?: Date
}

/**
 * Interpretive Kaal Bala analysis from computed Shadbala.
 */
export function analyzeKalaBala(
  shadbala: ShadbalaResult | null | undefined,
  opts: AnalyzeKalaBalaOptions = {},
): KalaBalaAnalysis | null {
  if (!shadbala?.planets) return null

  const rows: KalaPlanetAnalysis[] = ORDER.map((id) => {
    const p = shadbala.planets[id]
    const virupas = virupasOf(p)
    const softBand = softBandFor(virupas)
    const classicalRatio = virupas / KALA_CLASSICAL_MIN_VIRUPAS
    return {
      id,
      name: GRAHA_NAMES[id],
      virupas: +virupas.toFixed(2),
      rupas: +(virupas / 60).toFixed(3),
      classicalRatio: +classicalRatio.toFixed(3),
      meetsClassicalMin: classicalRatio >= 1,
      softBand,
      isSoftStrong: isSoftStrong(softBand),
      bodyCue: softBand === 'weak' ? BODY_CUES[id as KalaGraha] : null,
      remedy: REMEDIES[id as KalaGraha],
      themes: THEMES[id as KalaGraha],
      breakdown: p?.details?.kala
        ? {
            natha: p.details.kala.natha,
            paksha: p.details.kala.paksha,
            tribhaga: p.details.kala.tribhaga,
            vaara: p.details.kala.vaara,
            hora: p.details.kala.hora,
            maasa: p.details.kala.maasa,
            varsha: p.details.kala.varsha,
            ayana: p.details.kala.ayana,
          }
        : null,
    }
  })

  const vals = rows.map((r) => r.virupas)
  const meanVirupas = vals.reduce((a, b) => a + b, 0) / vals.length
  const minVirupas = Math.min(...vals)
  const maxVirupas = Math.max(...vals)
  const spreadVirupas = maxVirupas - minVirupas
  const dipCount = rows.filter((r) => r.softBand === 'weak').length
  const allStable = rows.every((r) => r.virupas >= KALA_SOFT_STABLE)

  let profile: KalaTimeProfile = 'fluctuating'
  let profileNote = 'Kaal fluctuates across planets — career and luck show clear ups and downs with dasha changes.'
  if (allStable) {
    profile = 'stable'
    profileNote = `All seven Kaal values stay ≥${KALA_SOFT_STABLE} — stable “Top ~1%” time chart; continuous good karma application converts.`
  } else if (dipCount >= 3 || meanVirupas < KALA_SOFT_BASELINE) {
    profile = 'weak'
    profileNote = 'Several weak Kaal dips — time luck is inconsistent; protect finances and prefer business flexibility over rigid jobs.'
  }

  let careerPath: KalaCareerPath = 'mixed'
  let careerPathNote = 'Mixed Kaal consistency — job is possible in stable MD windows; business absorbs ups and downs better overall.'
  if (profile === 'stable' && spreadVirupas < 80) {
    careerPath = 'job_ok'
    careerPathNote = 'Consistent Kaal suits salaried/job paths — fewer sudden time collapses if you stay disciplined.'
  } else if (profile === 'weak' || spreadVirupas >= 100 || dipCount >= 2) {
    careerPath = 'business_preferred'
    careerPathNote = 'Inconsistent Kaal (wide spread / dips) — lecture rule: prefer business over job; jobs punish time valleys with layoff/EMI shocks.'
  }

  const strongestId = rows.reduce((a, b) => (b.virupas > a.virupas ? b : a)).id
  const weakestId = rows.reduce((a, b) => (b.virupas < a.virupas ? b : a)).id

  const asOf = opts.asOf ?? new Date()
  const triple = opts.dashaNodes?.length
    ? pickMahaTriple(opts.dashaNodes, asOf)
    : { previous: null, current: null, next: null }

  const dasha = {
    previous: buildDashaCue('previous', triple.previous, shadbala, opts.grahas),
    current: buildDashaCue('current', triple.current, shadbala, opts.grahas),
    next: buildDashaCue('next', triple.next, shadbala, opts.grahas),
  }

  const curvature = [
    buildCurvature(dasha.previous, dasha.current),
    buildCurvature(dasha.current, dasha.next),
  ].filter(Boolean) as KalaCurvature[]

  // Drain scan for weakest Kaal planet, or current MD scored planet
  const drainPlanet =
    dasha.current?.scoredId ??
    dasha.next?.scoredId ??
    weakestId
  const drains = scanDrains(drainPlanet, opts.grahas)

  let mercuryInKendra: boolean | null = null
  if (opts.ascRashi && opts.grahas) {
    const me = opts.grahas.find((g) => g.id === 'Me')
    if (me?.rashi) {
      const h = houseFromAsc(me.rashi, opts.ascRashi)
      mercuryInKendra = [1, 4, 7, 10].includes(h)
    }
  }

  const predictions = buildPredictions({
    profile,
    careerPath,
    careerPathNote,
    meanVirupas,
    dipCount,
    rows,
    dasha,
    curvature,
    drains,
    mercuryInKendra,
  })

  const summary =
    profile === 'stable'
      ? `Stable Kaal (mean ${meanVirupas.toFixed(0)} Virupas). Strongest ${GRAHA_NAMES[strongestId]}, weakest ${GRAHA_NAMES[weakestId]}.`
      : profile === 'weak'
        ? `Weak Kaal profile (mean ${meanVirupas.toFixed(0)}, ${dipCount} dips). Focus remedies on ${GRAHA_NAMES[weakestId]}.`
        : `Fluctuating Kaal (mean ${meanVirupas.toFixed(0)}; spread ${spreadVirupas.toFixed(0)}). Strongest ${GRAHA_NAMES[strongestId]}, weakest ${GRAHA_NAMES[weakestId]}.`

  return {
    profile,
    profileNote,
    summary,
    careerPath,
    careerPathNote,
    meanVirupas: +meanVirupas.toFixed(2),
    minVirupas: +minVirupas.toFixed(2),
    maxVirupas: +maxVirupas.toFixed(2),
    spreadVirupas: +spreadVirupas.toFixed(2),
    dipCount,
    rows,
    strongestId,
    weakestId,
    dasha,
    curvature,
    drains,
    predictions,
    goldenRule:
      'When Kaal is strong, work for yourself. When Kaal is weak, partner with or hire people whose time luck is running well.',
  }
}

export function kalaSoftBandColor(band: KalaSoftBand | 'unscored'): string {
  switch (band) {
    case 'exceptional':
    case 'very_high':
      return 'var(--teal)'
    case 'strong':
    case 'stable':
      return 'var(--text-gold)'
    case 'baseline':
      return 'var(--text-muted)'
    case 'weak':
      return 'var(--rose)'
    default:
      return 'var(--text-muted)'
  }
}

export function kalaSoftBandLabel(band: KalaSoftBand | 'unscored'): string {
  return bandLabel(band)
}

export function kalaPredictionToneColor(tone: KalaPredictionTone): string {
  if (tone === 'favorable') return 'var(--teal)'
  if (tone === 'supportive') return 'var(--text-gold)'
  if (tone === 'caution') return 'var(--rose)'
  return 'var(--amber)'
}

export function kalaPredictionToneLabel(tone: KalaPredictionTone): string {
  if (tone === 'favorable') return 'Favorable'
  if (tone === 'supportive') return 'Supportive'
  if (tone === 'caution') return 'Caution'
  return 'Mixed'
}
