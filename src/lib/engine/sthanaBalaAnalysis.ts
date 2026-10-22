// ─────────────────────────────────────────────────────────────
//  src/lib/engine/sthanaBalaAnalysis.ts
//  Interpretive Sthana Bala (positional / space strength) layer
//  Soft Virupa bands from practitioner lecture heuristics;
//  classical component floor = 165 Virupas (Parashara-style UI).
// ─────────────────────────────────────────────────────────────

import type { DashaNode, GrahaData, GrahaId, Rashi, ShadbalaPlanet, ShadbalaResult } from '@/types/astrology'
import { GRAHA_NAMES } from '@/types/astrology'

const ORDER: GrahaId[] = ['Su', 'Mo', 'Ma', 'Me', 'Ju', 'Ve', 'Sa']

/** Classical Sthana component minimum (Virupas / Shashtiamsas). */
export const STHANA_CLASSICAL_MIN_VIRUPAS = 165

/** Soft lecture baseline (Virupas). */
export const STHANA_SOFT_BASELINE = 100

/** Soft “above average” when all seven clear this (Saturn uses SATURN_USABLE). */
export const STHANA_SOFT_ABOVE_AVG = 135

/** Saturn-specific usable floor in soft reading. */
export const STHANA_SATURN_USABLE = 110

const SIGN_LORDS: Record<Rashi, GrahaId> = {
  1: 'Ma', 2: 'Ve', 3: 'Me', 4: 'Mo', 5: 'Su', 6: 'Me',
  7: 'Ve', 8: 'Ma', 9: 'Ju', 10: 'Sa', 11: 'Sa', 12: 'Ju',
}

export type SthanaSoftBand =
  | 'exceptional'
  | 'very_high'
  | 'strong'
  | 'above_average'
  | 'usable'
  | 'baseline'
  | 'weak'

export type SthanaLifeProfile = 'above_average' | 'mixed' | 'struggling'

export interface SthanaPlanetAnalysis {
  id: GrahaId
  name: string
  virupas: number
  rupas: number
  classicalRatio: number
  meetsClassicalMin: boolean
  softBand: SthanaSoftBand
  /** Soft rule: Sa usable at ≥110; others follow band ≥ above_average. */
  isSoftStrong: boolean
  bodyCue: string | null
  remedy: string
  spaceThemes: string[]
  breakdown: {
    uccha: number
    saptavargaja: number
    ojhayugma: number
    kendradi: number
    drekkana: number
  } | null
}

export interface SthanaDashaCue {
  role: 'current' | 'next'
  lord: string
  lordName: string
  /** Planet whose Sthana is scored (self or dispositor for Ra/Ke). */
  scoredId: GrahaId | null
  scoredName: string | null
  viaDispositor: boolean
  virupas: number | null
  softBand: SthanaSoftBand | 'unscored'
  note: string
  start?: string
  end?: string
}

export type SthanaPredictionTopic =
  | 'career'
  | 'life_quality'
  | 'property'
  | 'marriage'
  | 'vastu'
  | 'prosperity'
  | 'health'

export type SthanaPredictionTone = 'favorable' | 'supportive' | 'mixed' | 'caution'

export interface SthanaPrediction {
  id: string
  topic: SthanaPredictionTopic
  title: string
  tone: SthanaPredictionTone
  text: string
  /** Planet driving the cue when dasha-timed. */
  basedOn?: string
  virupas?: number | null
}

export interface SthanaBalaAnalysis {
  profile: SthanaLifeProfile
  profileNote: string
  summary: string
  meanVirupas: number
  minVirupas: number
  maxVirupas: number
  dipCount: number
  rows: SthanaPlanetAnalysis[]
  strongestId: GrahaId
  weakestId: GrahaId
  vastuCue: string | null
  dasha: {
    current: SthanaDashaCue | null
    next: SthanaDashaCue | null
  }
  /** Topic predictions from soft Sthana + current/next MD. */
  predictions: SthanaPrediction[]
  applications: string[]
}

type SthanaGraha = 'Su' | 'Mo' | 'Ma' | 'Me' | 'Ju' | 'Ve' | 'Sa' | 'Ra' | 'Ke'

const BODY_CUES: Record<SthanaGraha, string> = {
  Su: 'Overall vitality and leadership hold may need support.',
  Mo: 'Comfort, food, and emotional ease may feel uneven.',
  Ma: 'Heart-related vitality and protective drive may feel strained.',
  Me: 'Metabolism, learning pace, or hormonal rhythm may slow.',
  Ju: 'Stability and knowledge-building may feel deficient.',
  Ve: 'Eyesight, refinement, or relational polish may need care.',
  Sa: 'Clutter, backlog, and workplace drain tend to accumulate.',
  Ra: 'Visibility and boundary stress may dominate space choices.',
  Ke: 'Withdrawal and corner-seeking may limit supportive spaces.',
}

const REMEDIES: Record<SthanaGraha, string> = {
  Su: 'Gayatri, Surya namaskar, jal arpan, and selfless temple or community seva.',
  Mo: 'Stock good food, offer bhog, sankirtan, mother seva, and water tirthas.',
  Ma: 'Care for animals and plants, clean soil work, gym, Hanuman / Narasimha / Durga seva.',
  Me: 'Gardening, parks, learning, morning walks, herbs, and playful skill practice.',
  Ju: 'Open air, high ceilings, greenery, temple, yoga, and pure-prana spaces.',
  Ve: 'Hygiene, fragrance, deity shringar, gau seva, sweet speech, and Lakshmi worship.',
  Sa: 'Clear clutter; respect desk/workplace; clean house areas ruled by Saturn.',
  Ra: 'Prefer visible, high, reflective placements when Rahu runs — use with care.',
  Ke: 'Prefer quiet corners and sober cover when Ketu runs — reduce mirror focus.',
}

const SPACE_THEMES: Record<SthanaGraha, string[]> = {
  Su: ['position', 'leadership', 'temple responsibility'],
  Mo: ['home comfort', 'food stock', 'mother', 'water places'],
  Ma: ['earth energy', 'protection', 'gym', 'land care'],
  Me: ['plants', 'parks', 'schools', 'learning curve'],
  Ju: ['prana', 'open space', 'spiritual association'],
  Ve: ['refinement', 'hygiene', 'bedroom beauty', 'spouse comfort'],
  Sa: ['workplace', 'backlogs', 'service areas'],
  Ra: ['high floors', 'visibility', 'mirrors'],
  Ke: ['ground level', 'corners', 'minimal interaction'],
}

function softBandFor(id: GrahaId, virupas: number): SthanaSoftBand {
  if (virupas >= 250) return 'exceptional'
  if (virupas >= 230) return 'very_high'
  if (virupas >= 150) return 'strong'
  if (virupas >= STHANA_SOFT_ABOVE_AVG) return 'above_average'
  if (id === 'Sa' && virupas >= STHANA_SATURN_USABLE) return 'usable'
  if (virupas >= STHANA_SOFT_BASELINE) return 'baseline'
  return 'weak'
}

function isSoftStrong(id: GrahaId, band: SthanaSoftBand): boolean {
  if (id === 'Sa') return band !== 'weak' && band !== 'baseline'
  return band === 'above_average' || band === 'strong' || band === 'very_high' || band === 'exceptional'
}

function bandLabel(band: SthanaSoftBand | 'unscored'): string {
  switch (band) {
    case 'exceptional': return 'exceptional'
    case 'very_high': return 'very high'
    case 'strong': return 'strong'
    case 'above_average': return 'above average'
    case 'usable': return 'usable (Saturn)'
    case 'baseline': return 'baseline'
    case 'weak': return 'weak'
    default: return 'unscored'
  }
}

function virupasOf(p: ShadbalaPlanet | undefined): number {
  if (!p) return 0
  if (typeof p.componentShash?.sthana === 'number' && Number.isFinite(p.componentShash.sthana)) {
    return p.componentShash.sthana
  }
  return (p.sthanaBala ?? 0) * 60
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
  role: 'current' | 'next',
  lord: string,
  scoredId: GrahaId | null,
  viaDispositor: boolean,
  virupas: number | null,
  band: SthanaSoftBand | 'unscored',
): string {
  const lordName = GRAHA_NAMES[lord as GrahaId] ?? lord
  const roleWord = role === 'current' ? 'Current' : 'Upcoming'
  if (virupas == null || !scoredId || band === 'unscored') {
    return `${roleWord} ${lordName} mahadasha has no direct Sthana score (nodes like Rahu/Ketu need a dispositor on the chart).`
  }
  const via = viaDispositor ? ` via ${GRAHA_NAMES[scoredId]} dispositor` : ''
  if (band === 'exceptional' || band === 'very_high') {
    return `${roleWord} ${lordName}${via}: ${virupas.toFixed(0)} Virupas (${bandLabel(band)}) — strong cue for better seat, quarters, and associations when this period runs.`
  }
  if (band === 'strong' || band === 'above_average' || (scoredId === 'Sa' && band === 'usable')) {
    return `${roleWord} ${lordName}${via}: ${virupas.toFixed(0)} Virupas (${bandLabel(band)}) — supportive space and status capacity in this dasha.`
  }
  if (band === 'baseline') {
    return `${roleWord} ${lordName}${via}: ${virupas.toFixed(0)} Virupas (baseline) — usable but not a strong space upgrade by itself.`
  }
  return `${roleWord} ${lordName}${via}: ${virupas.toFixed(0)} Virupas (weak) — expect space stress; pair with house lords and remedies.`
}

function pickMahaWindow(nodes: DashaNode[], asOf: Date): { current: DashaNode | null; next: DashaNode | null } {
  const maha = nodes
    .filter((n) => n.level === 1)
    .slice()
    .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())
  if (!maha.length) return { current: null, next: null }

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
    return { current: null, next: upcoming }
  }

  const idx = maha.indexOf(current)
  const next = idx >= 0 && idx < maha.length - 1 ? maha[idx + 1] : null
  return { current, next }
}

function buildDashaCue(
  role: 'current' | 'next',
  node: DashaNode | null,
  shadbala: ShadbalaResult,
  grahas?: GrahaData[],
): SthanaDashaCue | null {
  if (!node?.lord) return null
  const lord = node.lord
  const { scoredId, viaDispositor } = resolveScoredLord(lord, grahas)
  const virupas = scoredId ? virupasOf(shadbala.planets[scoredId]) : null
  const softBand: SthanaSoftBand | 'unscored' =
    scoredId && virupas != null ? softBandFor(scoredId, virupas) : 'unscored'

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

export interface AnalyzeSthanaBalaOptions {
  dashaNodes?: DashaNode[]
  grahas?: GrahaData[]
  asOf?: Date
}

/**
 * Build interpretive Sthana Bala analysis from computed Shadbala.
 * Soft bands are lecture heuristics; classicalRatio uses 165 Virupa floor.
 */
export function analyzeSthanaBala(
  shadbala: ShadbalaResult | null | undefined,
  opts: AnalyzeSthanaBalaOptions = {},
): SthanaBalaAnalysis | null {
  if (!shadbala?.planets) return null

  const rows: SthanaPlanetAnalysis[] = ORDER.map((id) => {
    const p = shadbala.planets[id]
    const virupas = virupasOf(p)
    const softBand = softBandFor(id, virupas)
    const classicalRatio = virupas / STHANA_CLASSICAL_MIN_VIRUPAS
    return {
      id,
      name: GRAHA_NAMES[id],
      virupas: +virupas.toFixed(2),
      rupas: +(virupas / 60).toFixed(3),
      classicalRatio: +classicalRatio.toFixed(3),
      meetsClassicalMin: classicalRatio >= 1,
      softBand,
      isSoftStrong: isSoftStrong(id, softBand),
      bodyCue: softBand === 'weak' ? BODY_CUES[id as SthanaGraha] : null,
      remedy: REMEDIES[id as SthanaGraha],
      spaceThemes: SPACE_THEMES[id as SthanaGraha],
      breakdown: p?.details?.sthana
        ? {
            uccha: p.details.sthana.uccha,
            saptavargaja: p.details.sthana.saptavargaja,
            ojhayugma: p.details.sthana.ojhayugma,
            kendradi: p.details.sthana.kendradi,
            drekkana: p.details.sthana.drekkana,
          }
        : null,
    }
  })

  const vals = rows.map((r) => r.virupas)
  const meanVirupas = vals.reduce((a, b) => a + b, 0) / vals.length
  const minVirupas = Math.min(...vals)
  const maxVirupas = Math.max(...vals)
  const dipCount = rows.filter((r) => r.softBand === 'weak').length
  const allAboveSoft = rows.every((r) =>
    r.id === 'Sa'
      ? r.virupas >= STHANA_SATURN_USABLE
      : r.virupas >= STHANA_SOFT_ABOVE_AVG,
  )

  let profile: SthanaLifeProfile = 'mixed'
  let profileNote = 'Mixed Sthana profile — some planets hold space well, others dip.'
  if (allAboveSoft) {
    profile = 'above_average'
    profileNote = 'All seven clear soft above-average floors (Saturn usable ≥110) — lifelong access to better spaces is indicated.'
  } else if (dipCount >= 3 || (dipCount >= 2 && meanVirupas < STHANA_SOFT_ABOVE_AVG)) {
    profile = 'struggling'
    profileNote = 'Several Sthana dips — chart leans toward space struggle, vastu stress, or delayed comfort until stronger dashas.'
  }

  const strongestId = rows.reduce((a, b) => (b.virupas > a.virupas ? b : a)).id
  const weakestId = rows.reduce((a, b) => (b.virupas < a.virupas ? b : a)).id

  const vastuCue =
    profile === 'struggling' || meanVirupas < STHANA_SOFT_BASELINE
      ? 'Low or uneven Sthana often coincides with vastu discomfort — clean and activate weak planet domains before blaming the plot alone.'
      : profile === 'above_average'
        ? 'Strong overall Sthana usually means fewer chronic vastu-style space problems.'
        : null

  const asOf = opts.asOf ?? new Date()
  const { current, next } = opts.dashaNodes?.length
    ? pickMahaWindow(opts.dashaNodes, asOf)
    : { current: null, next: null }

  const dasha = {
    current: buildDashaCue('current', current, shadbala, opts.grahas),
    next: buildDashaCue('next', next, shadbala, opts.grahas),
  }

  const predictions = buildPredictions({
    profile,
    meanVirupas,
    dipCount,
    strongestId,
    weakestId,
    rows,
    dasha,
    vastuCue,
  })

  const applications: string[] = [
    'Use Sthana of the current or upcoming mahadasha lord for job, house, and marriage timing cues.',
    'Sthana is natal and lifelong; Kala and dasha decide when it activates.',
    'Rahu/Ketu have no native Sthana — score their sign dispositor.',
    'Predictions are capacity cues from Sthana alone — confirm with house ownership, yogas, and full Shadbala.',
  ]
  if (dasha.next) applications.unshift(dasha.next.note)
  else if (dasha.current) applications.unshift(dasha.current.note)

  const summary =
    profile === 'above_average'
      ? `Above-average Sthana (mean ${meanVirupas.toFixed(0)} Virupas). Strongest ${GRAHA_NAMES[strongestId]}, weakest ${GRAHA_NAMES[weakestId]}.`
      : profile === 'struggling'
        ? `Struggling Sthana profile (mean ${meanVirupas.toFixed(0)}, ${dipCount} weak dips). Focus remedies on ${GRAHA_NAMES[weakestId]}.`
        : `Mixed Sthana (mean ${meanVirupas.toFixed(0)} Virupas; range ${minVirupas.toFixed(0)}–${maxVirupas.toFixed(0)}). Strongest ${GRAHA_NAMES[strongestId]}, weakest ${GRAHA_NAMES[weakestId]}.`

  return {
    profile,
    profileNote,
    summary,
    meanVirupas: +meanVirupas.toFixed(2),
    minVirupas: +minVirupas.toFixed(2),
    maxVirupas: +maxVirupas.toFixed(2),
    dipCount,
    rows,
    strongestId,
    weakestId,
    vastuCue,
    dasha,
    predictions,
    applications,
  }
}

function timingLordLabel(cue: SthanaDashaCue): string {
  if (cue.viaDispositor && cue.scoredName) {
    return `${cue.lordName} (via ${cue.scoredName})`
  }
  return cue.lordName
}

function toneFromBand(
  band: SthanaSoftBand | 'unscored',
  scoredId: GrahaId | null,
): SthanaPredictionTone {
  if (band === 'exceptional' || band === 'very_high') return 'favorable'
  if (band === 'strong' || band === 'above_average') return 'supportive'
  if (scoredId === 'Sa' && band === 'usable') return 'supportive'
  if (band === 'baseline' || band === 'unscored') return 'mixed'
  return 'caution'
}

function buildPredictions(input: {
  profile: SthanaLifeProfile
  meanVirupas: number
  dipCount: number
  strongestId: GrahaId
  weakestId: GrahaId
  rows: SthanaPlanetAnalysis[]
  dasha: { current: SthanaDashaCue | null; next: SthanaDashaCue | null }
  vastuCue: string | null
}): SthanaPrediction[] {
  const out: SthanaPrediction[] = []
  const timing = input.dasha.next ?? input.dasha.current
  const timingRole = input.dasha.next ? 'upcoming' : 'current'

  // Life quality — natal profile
  if (input.profile === 'above_average') {
    out.push({
      id: 'life-above',
      topic: 'life_quality',
      title: 'Life quality / space trajectory',
      tone: 'favorable',
      text: `All seven grahas clear soft Sthana floors — expect lifelong access to better homes, workplaces, and associations, even through temporary struggle periods.`,
    })
  } else if (input.profile === 'struggling') {
    out.push({
      id: 'life-struggle',
      topic: 'life_quality',
      title: 'Life quality / space trajectory',
      tone: 'caution',
      text: `${input.dipCount} weak Sthana dips (mean ${input.meanVirupas.toFixed(0)} Virupas) point to a struggling space chart — upgrades come mainly when a strong mahadasha lord runs.`,
    })
  } else {
    out.push({
      id: 'life-mixed',
      topic: 'life_quality',
      title: 'Life quality / space trajectory',
      tone: 'mixed',
      text: `Mixed Sthana — ${GRAHA_NAMES[input.strongestId]} holds space well while ${GRAHA_NAMES[input.weakestId]} lags. Results depend on which mahadasha is active.`,
    })
  }

  // Career — prefer next MD (lecture method)
  if (timing && timing.virupas != null && timing.softBand !== 'unscored') {
    const label = timingLordLabel(timing)
    const tone = toneFromBand(timing.softBand, timing.scoredId)
    let careerText = ''
    if (timing.softBand === 'exceptional' || timing.softBand === 'very_high') {
      careerText = `${timingRole === 'upcoming' ? 'When' : 'While'} ${label} mahadasha runs (${timing.virupas.toFixed(0)} Virupas), selection / status rise, better quarters, and stronger workplace associations are clearly supported.`
    } else if (timing.softBand === 'strong' || timing.softBand === 'above_average') {
      careerText = `${timingRole === 'upcoming' ? 'Upcoming' : 'Current'} ${label} period (${timing.virupas.toFixed(0)} Virupas) supports job progress and a better seat — confirm with 10th-house lords and dasha antars.`
    } else if (timing.scoredId === 'Sa' && timing.softBand === 'usable') {
      careerText = `${label} at ${timing.virupas.toFixed(0)} Virupas is usable for Saturn — growth through hard work and office focus is likely; expect isolation pressure, not luxury ease.`
    } else if (timing.softBand === 'baseline') {
      careerText = `${timingRole === 'upcoming' ? 'Upcoming' : 'Current'} ${label} Sthana is only baseline (${timing.virupas.toFixed(0)}) — career movement is possible but not a strong space/status upgrade by Sthana alone.`
    } else {
      careerText = `${timingRole === 'upcoming' ? 'Upcoming' : 'Current'} ${label} Sthana is weak (${timing.virupas.toFixed(0)} Virupas) — job or posting changes may bring space stress; strengthen that planet’s domain before expecting a breakthrough.`
    }
    out.push({
      id: 'career-md',
      topic: 'career',
      title: timingRole === 'upcoming' ? 'Career / selection (next MD)' : 'Career / status (current MD)',
      tone,
      text: careerText,
      basedOn: label,
      virupas: timing.virupas,
    })

    // Property
    let propertyText = ''
    let propertyTone = tone
    if (tone === 'favorable' || tone === 'supportive') {
      propertyText = `${label} Sthana (${timing.virupas.toFixed(0)}) supports buying or shifting into a better house during this ${timingRole} period.`
    } else if (tone === 'mixed') {
      propertyText = `${label} Sthana is middling — house moves may work but comfort/fit is uneven; inspect vastu and 4th-lord strength.`
    } else {
      propertyText = `Weak ${label} Sthana warns against expecting a comfortable house purchase or stay in this ${timingRole} window — restlessness after buying is a classic cue.`
      propertyTone = 'caution'
    }
    out.push({
      id: 'property-md',
      topic: 'property',
      title: 'Property / house move',
      tone: propertyTone,
      text: propertyText,
      basedOn: label,
      virupas: timing.virupas,
    })

    // Marriage
    let marriageText = ''
    let marriageTone = tone
    if (timing.scoredId === 'Sa' && (timing.softBand === 'usable' || timing.softBand === 'above_average' || timing.softBand === 'strong')) {
      marriageText = `Saturn-period Sthana at ${timing.virupas.toFixed(0)} is still workable for growth in marriage, but expect isolation and a work-heavy spouse/self dynamic.`
      marriageTone = 'supportive'
    } else if (timing.softBand === 'exceptional' || timing.softBand === 'very_high') {
      marriageText = `${label} at ${timing.virupas.toFixed(0)} Virupas during the ${timingRole} mahadasha supports a clear upgrade in married-life space and prosperity (shift to a much better place is a classic reading).`
    } else if (timing.softBand === 'strong' || timing.softBand === 'above_average') {
      marriageText = `${label} Sthana (${timing.virupas.toFixed(0)}) in the ${timingRole} period points to above-average married-life conditions — still confirm Venus/Jupiter and 7th-house factors.`
    } else if (timing.softBand === 'weak') {
      marriageText = `Weak ${label} Sthana in the ${timingRole} period cautions that married-life space and comfort may feel strained until a stronger lord runs.`
      marriageTone = 'caution'
    } else {
      marriageText = `${label} Sthana is baseline in the ${timingRole} period — marriage continues, but do not expect a major space/status lift from Sthana alone.`
      marriageTone = 'mixed'
    }
    out.push({
      id: 'marriage-md',
      topic: 'marriage',
      title: 'Marriage / partnership space',
      tone: marriageTone,
      text: marriageText,
      basedOn: label,
      virupas: timing.virupas,
    })

    // Prosperity / bhagyoday when very high
    if (timing.softBand === 'exceptional' || timing.softBand === 'very_high') {
      out.push({
        id: 'prosperity-md',
        topic: 'prosperity',
        title: 'Prosperity / bhagyoday cue',
        tone: 'favorable',
        text: `${label} at ${timing.virupas.toFixed(0)} Virupas (≥230) is a strong punya/space cue — this ${timingRole} mahadasha can lift household prosperity and living standard sharply.`,
        basedOn: label,
        virupas: timing.virupas,
      })
    }
  } else if (!timing) {
    out.push({
      id: 'career-no-dasha',
      topic: 'career',
      title: 'Career / selection timing',
      tone: 'mixed',
      text: 'Vimshottari mahadasha data is missing — load dashas to time career and house predictions from the next MD lord’s Sthana.',
    })
  } else {
    out.push({
      id: 'career-unscored',
      topic: 'career',
      title: 'Career / selection timing',
      tone: 'mixed',
      text: `${timingLordLabel(timing)} mahadasha has no scored Sthana yet (nodes need a dispositor on the chart). Career timing from Sthana is incomplete.`,
      basedOn: timingLordLabel(timing),
    })
  }

  // Vastu
  if (input.vastuCue) {
    out.push({
      id: 'vastu',
      topic: 'vastu',
      title: 'Vastu / living comfort',
      tone: input.profile === 'struggling' ? 'caution' : input.profile === 'above_average' ? 'favorable' : 'mixed',
      text: input.vastuCue,
    })
  }

  // Health — weak planets only
  const weakBody = input.rows.filter((r) => r.bodyCue)
  if (weakBody.length) {
    out.push({
      id: 'health-weak',
      topic: 'health',
      title: 'Body / karaka stress cues',
      tone: 'caution',
      text: weakBody.map((r) => `${r.name}: ${r.bodyCue}`).join(' '),
    })
  }

  return out
}

export function sthanaSoftBandColor(band: SthanaSoftBand | 'unscored'): string {
  switch (band) {
    case 'exceptional':
    case 'very_high':
      return 'var(--teal)'
    case 'strong':
    case 'above_average':
      return 'var(--text-gold)'
    case 'usable':
      return 'var(--amber)'
    case 'baseline':
      return 'var(--text-muted)'
    case 'weak':
      return 'var(--rose)'
    default:
      return 'var(--text-muted)'
  }
}

export function sthanaSoftBandLabel(band: SthanaSoftBand | 'unscored'): string {
  return bandLabel(band)
}
