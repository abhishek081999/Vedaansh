// src/lib/engine/milanExtras.ts
// Extra Kundali Milan layers from classical notes:
// 1) Vaidhavya / Vidhur yoga intensity + mutual cancellation
// 2) Dasha-pair impact (current + upcoming Mahadashas)
// 3) Hindi Varnamala (Janma-naam letter animals)
// Pure engine — no React/DB.

import type { ChartOutput, DashaNode, GrahaData, GrahaId, Rashi } from '@/types/astrology'
import { GRAHA_NAMES } from '@/types/astrology'
import { gName, type EngineLang } from '@/lib/engine/divisionalLang'
import { ME_HI } from '@/lib/engine/locale/milanExtras.hi'
import { getPadaNamingSyllable } from '@/lib/engine/astroDetailsDerived'

export type MilanTone = 'supportive' | 'caution' | 'mixed'

const MALEFICS: GrahaId[] = ['Su', 'Ma', 'Sa', 'Ra', 'Ke']
const BENEFICS: GrahaId[] = ['Ju', 'Ve', 'Mo', 'Me']

const RASHI_LORD: Record<number, GrahaId> = {
  1: 'Ma', 2: 'Ve', 3: 'Me', 4: 'Mo', 5: 'Su', 6: 'Me',
  7: 'Ve', 8: 'Ma', 9: 'Ju', 10: 'Sa', 11: 'Sa', 12: 'Ju',
}

const FRIEND_MATRIX: Record<string, Record<string, string>> = {
  Su: { Mo: 'Friend', Ma: 'Friend', Ju: 'Friend', Me: 'Neutral', Ve: 'Enemy', Sa: 'Enemy' },
  Mo: { Su: 'Friend', Me: 'Friend', Ma: 'Neutral', Ju: 'Neutral', Ve: 'Neutral', Sa: 'Neutral' },
  Ma: { Su: 'Friend', Mo: 'Friend', Ju: 'Friend', Ve: 'Neutral', Sa: 'Neutral', Me: 'Enemy' },
  Me: { Su: 'Friend', Ve: 'Friend', Ma: 'Neutral', Ju: 'Neutral', Sa: 'Neutral', Mo: 'Enemy' },
  Ju: { Su: 'Friend', Mo: 'Friend', Ma: 'Friend', Sa: 'Neutral', Me: 'Enemy', Ve: 'Enemy' },
  Ve: { Me: 'Friend', Sa: 'Friend', Ma: 'Neutral', Ju: 'Neutral', Su: 'Enemy', Mo: 'Enemy' },
  Sa: { Me: 'Friend', Ve: 'Friend', Ju: 'Neutral', Su: 'Enemy', Mo: 'Enemy', Ma: 'Enemy' },
}

const ID_TO_NAME: Record<string, string> = {
  Su: 'Sun', Mo: 'Moon', Ma: 'Mars', Me: 'Mercury', Ju: 'Jupiter', Ve: 'Venus', Sa: 'Saturn',
  Ra: 'Rahu', Ke: 'Ketu',
}

function wholeSignHouse(planetRashi: number, ascRashi: number): number {
  return ((planetRashi - ascRashi + 12) % 12) + 1
}

function findGraha(chart: ChartOutput, id: GrahaId): GrahaData | undefined {
  return chart.grahas.find(g => g.id === id)
}

function houseLord(asc: number, house: number): GrahaId {
  const rashi = ((asc - 1 + house - 1) % 12) + 1
  return RASHI_LORD[rashi] ?? 'Su'
}

function grahaAspectsHouse(g: GrahaData, house: number, asc: number): boolean {
  const h = wholeSignHouse(g.rashi, asc)
  if (h === house) return true
  // Special aspects: Mars 4/8, Jupiter 5/9, Saturn 3/10; all have 7th
  const diff = ((house - h + 12) % 12)
  if (diff === 6) return true // 7th aspect
  if (g.id === 'Ma' && (diff === 3 || diff === 7)) return true
  if (g.id === 'Ju' && (diff === 4 || diff === 8)) return true
  if (g.id === 'Sa' && (diff === 2 || diff === 9)) return true
  return false
}

// ── 1. Vaidhavya / Vidhur ─────────────────────────────────────

export type LongevityBand = 'fragile' | 'moderate' | 'strong'

export interface SpouseRiskYoga {
  person: string
  role: 'vaidhavya' | 'vidhur'
  /** 0–10 intensity */
  intensity: number
  band: 'none' | 'low' | 'moderate' | 'high'
  factors: string[]
  longevityBand: LongevityBand
  longevityNote: string
}

export interface VaidhavyaVidhurMatch {
  personA: SpouseRiskYoga
  personB: SpouseRiskYoga
  intensityGap: number
  cancelled: boolean
  tone: MilanTone
  summary: string
}

function longevityBandOf(
  chart: ChartOutput,
  lang: EngineLang = 'en',
): { band: LongevityBand; note: string; score: number } {
  const asc = chart.lagnas.ascRashi
  if (!asc) {
    return {
      band: 'moderate',
      note: lang === 'en' ? 'Lagna missing, so this reading could not be made.' : ME_HI.lagnaMissingFull,
      score: 5,
    }
  }

  let score = 6
  const notes: string[] = []
  const l8 = findGraha(chart, houseLord(asc, 8))
  const sa = findGraha(chart, 'Sa')

  for (const g of chart.grahas) {
    if (!MALEFICS.includes(g.id)) continue
    if (wholeSignHouse(g.rashi, asc) === 8) {
      score -= 1.5
      notes.push(
        lang === 'en'
          ? `${GRAHA_NAMES[g.id]} in the 8th house`
          : ME_HI.spouseFactors.malefic8Note(gName(g.id, lang)),
      )
    }
    if (wholeSignHouse(g.rashi, asc) === 1) {
      score -= 0.5
    }
  }
  if (l8) {
    const h = wholeSignHouse(l8.rashi, asc)
    if ([6, 8, 12].includes(h)) {
      score -= 1.5
      notes.push(
        lang === 'en'
          ? `8th lord in a challenging house (house ${h})`
          : ME_HI.spouseFactors.lord8Challenging(h),
      )
    }
    if (BENEFICS.includes(l8.id as GrahaId) || [1, 4, 5, 7, 9, 10].includes(h)) {
      score += 1
    }
  }
  if (sa) {
    const h = wholeSignHouse(sa.rashi, asc)
    if ([1, 3, 6, 10, 11].includes(h)) {
      score += 0.5
      notes.push(lang === 'en' ? 'Saturn supports endurance' : ME_HI.spouseFactors.saturnEndurance)
    }
  }

  score = Math.max(0, Math.min(10, score))
  const band: LongevityBand = score >= 7 ? 'strong' : score >= 4 ? 'moderate' : 'fragile'
  const note = lang === 'en'
    ? (notes.length
      ? `${band} wellbeing and longevity indicators (${notes.slice(0, 3).join('; ')})`
      : `${band} wellbeing and longevity indicators from the 8th-house scan`)
    : ME_HI.longevityNote(ME_HI.bands[band] ?? band, notes.slice(0, 3).join('; '))
  return {
    band,
    score,
    note,
  }
}

/**
 * Score spouse-risk yoga (Vaidhavya or Vidhur) intensity 0–10.
 * Classical cues: malefics on 7/8, Mars+Saturn on spouse houses, weak 7th lord / Venus.
 */
export function scoreSpouseRiskYoga(
  chart: ChartOutput,
  role: 'vaidhavya' | 'vidhur',
  lang: EngineLang = 'en',
): SpouseRiskYoga {
  const asc = chart.lagnas.ascRashi
  const person = chart.meta.name || (lang === 'en' ? 'Person' : ME_HI.person)
  const factors: string[] = []
  let intensity = 0

  if (!asc) {
    return {
      person, role, intensity: 0, band: 'none', factors: [lang === 'en' ? 'Lagna unavailable for this chart' : ME_HI.spouseFactors.lagnaUnavailable],
      longevityBand: 'moderate', longevityNote: lang === 'en' ? 'Not available' : ME_HI.spouseFactors.longevityUnavailable,
    }
  }

  const ma = findGraha(chart, 'Ma')
  const sa = findGraha(chart, 'Sa')
  const ve = findGraha(chart, 'Ve')
  const ju = findGraha(chart, 'Ju')
  const l7 = findGraha(chart, houseLord(asc, 7))
  const l8 = findGraha(chart, houseLord(asc, 8))

  for (const g of chart.grahas) {
    if (!MALEFICS.includes(g.id)) continue
    const h = wholeSignHouse(g.rashi, asc)
    if (h === 7) {
      intensity += 2
      factors.push(
        lang === 'en'
          ? `${GRAHA_NAMES[g.id]} occupies the 7th house`
          : ME_HI.spouseFactors.malefic7(gName(g.id, lang)),
      )
    }
    if (h === 8) {
      intensity += 1.5
      factors.push(
        lang === 'en'
          ? `${GRAHA_NAMES[g.id]} occupies the 8th house`
          : ME_HI.spouseFactors.malefic8(gName(g.id, lang)),
      )
    }
  }

  if (ma && sa) {
    const maOnSpouse = grahaAspectsHouse(ma, 7, asc) || grahaAspectsHouse(ma, 8, asc)
    const saOnSpouse = grahaAspectsHouse(sa, 7, asc) || grahaAspectsHouse(sa, 8, asc)
    if (maOnSpouse && saOnSpouse) {
      intensity += 2.5
      factors.push(lang === 'en'
        ? 'Mars and Saturn both influence the 7th/8th houses (a classical cue for strain in the partnership, to be read with the whole chart)'
        : ME_HI.spouseFactors.maSaSpouse)
    }
  }

  if (l7) {
    const h = wholeSignHouse(l7.rashi, asc)
    if ([6, 8, 12].includes(h)) {
      intensity += 1.5
      factors.push(lang === 'en' ? `7th lord in a challenging house (house ${h})` : ME_HI.spouseFactors.lord7Dusthana(h))
    }
    if (l7.isCombust) {
      intensity += 1
      factors.push(lang === 'en' ? '7th lord is combust (close to the Sun, so weaker)' : ME_HI.spouseFactors.lord7Combust)
    }
  }

  if (l8) {
    const h = wholeSignHouse(l8.rashi, asc)
    if ([6, 8, 12].includes(h)) {
      intensity += 1
      factors.push(lang === 'en' ? `8th lord in a challenging house (house ${h})` : ME_HI.spouseFactors.lord8Dusthana(h))
    }
  }

  // Venus/Jupiter weakness colours spouse happiness / protection
  if (ve) {
    const h = wholeSignHouse(ve.rashi, asc)
    if ([6, 8, 12].includes(h) || ve.isCombust) {
      intensity += 1
      factors.push(lang === 'en' ? 'Venus, the planet of partnership happiness, is under strain' : ME_HI.spouseFactors.venusStrain)
    }
  }
  if (ju) {
    const h = wholeSignHouse(ju.rashi, asc)
    if ([6, 8, 12].includes(h)) {
      intensity += 0.5
      factors.push(lang === 'en' ? 'Jupiter sits in a challenging house, so its protective support is lighter' : ME_HI.spouseFactors.juStrain)
    }
  }

  intensity = Math.min(10, Math.round(intensity * 10) / 10)
  const band =
    intensity >= 7 ? 'high' : intensity >= 4 ? 'moderate' : intensity >= 1.5 ? 'low' : 'none'

  const lon = longevityBandOf(chart, lang)
  return {
    person,
    role,
    intensity,
    band,
    factors: factors.length ? factors : [lang === 'en' ? 'No strong classical partner-wellbeing factors flagged' : ME_HI.spouseFactors.noFactors],
    longevityBand: lon.band,
    longevityNote: lon.note,
  }
}

/**
 * Compare the classical partner-wellbeing cues for each chart (Vaidhavya for the bride's chart,
 * Vidhur for the groom's chart). Similar intensity points to a balancing tendency in the classical notes.
 * chartA = Person 1 (traditionally the groom), chartB = Person 2 (traditionally the bride).
 */
export function matchVaidhavyaVidhur(
  chartA: ChartOutput,
  chartB: ChartOutput,
  lang: EngineLang = 'en',
): VaidhavyaVidhurMatch {
  const genderA = chartA.meta.gender
  const genderB = chartB.meta.gender

  // Prefer meta gender; else assume A=male (vidhur), B=female (vaidhavya)
  const aIsMale = genderA === 'male' || (genderA !== 'female' && genderB !== 'male')
  const boyChart = aIsMale ? chartA : chartB
  const girlChart = aIsMale ? chartB : chartA

  const vidhur = scoreSpouseRiskYoga(boyChart, 'vidhur', lang)
  const vaidhavya = scoreSpouseRiskYoga(girlChart, 'vaidhavya', lang)

  // Map back to person A/B display order
  const personA = aIsMale ? vidhur : vaidhavya
  const personB = aIsMale ? vaidhavya : vidhur

  const intensityGap = Math.abs(vidhur.intensity - vaidhavya.intensity)
  const bothPresent = vidhur.intensity >= 1.5 && vaidhavya.intensity >= 1.5
  const cancelled = bothPresent && intensityGap <= 2.5

  // Uneven case: a strong cue in one chart against a strong-longevity partner chart is flagged for a closer read
  const critical =
    vaidhavya.intensity >= 6 &&
    vidhur.longevityBand === 'strong' &&
    !cancelled

  let tone: MilanTone = 'mixed'
  let summary: string

  if (cancelled) {
    tone = 'supportive'
    summary = lang === 'en'
      ? `The partner-wellbeing cues in the two charts (${vaidhavya.person} ${vaidhavya.intensity}/10, ${vidhur.person} ${vidhur.intensity}/10) are of similar strength, which classical notes read as a balancing tendency. It is still worth reading alongside the rest of both charts.`
      : ME_HI.vaidhavya.cancelled
  } else if (critical) {
    tone = 'caution'
    summary = lang === 'en'
      ? `One chart (${vaidhavya.person}, ${vaidhavya.intensity}/10) carries stronger partner-wellbeing cues than the other, whose wellbeing indicators read ${vidhur.longevityBand}. Classical notes prefer comparable strength in both charts, so this is a point for gentle attention and a fuller read, not a prediction.`
      : ME_HI.vaidhavya.critical(vaidhavya.person, String(vaidhavya.intensity), ME_HI.bands[vidhur.longevityBand] ?? vidhur.longevityBand)
  } else if (vaidhavya.intensity >= 6 || vidhur.intensity >= 6) {
    tone = 'caution'
    summary = lang === 'en'
      ? `The partner-wellbeing cues are uneven between the two charts (gap ${intensityGap.toFixed(1)}). A fuller reading of both charts, with a trusted astrologer if you wish, can put this in context.`
      : ME_HI.vaidhavya.uneven(intensityGap.toFixed(1))
  } else if (vaidhavya.band === 'none' && vidhur.band === 'none') {
    tone = 'supportive'
    summary = lang === 'en'
      ? 'No strong partner-wellbeing (Vaidhavya / Vidhur) factors flagged in either chart from this scan.'
      : ME_HI.vaidhavya.none
  } else {
    tone = 'mixed'
    summary = lang === 'en'
      ? `Mild partner-wellbeing signals are present (${vaidhavya.person} ${vaidhavya.intensity}/10, ${vidhur.person} ${vidhur.intensity}/10). These are best read together with the longevity indicators and dasha timing.`
      : ME_HI.vaidhavya.mild(vaidhavya.person, String(vaidhavya.intensity), vidhur.person, String(vidhur.intensity))
  }

  return {
    personA,
    personB,
    intensityGap,
    cancelled,
    tone,
    summary,
  }
}

// ── 2. Dasha-pair impact ──────────────────────────────────────

export interface DashaPairWindow {
  personALord: string
  personBLord: string
  overlapStart: string
  overlapEnd: string
  relation: string
  tone: MilanTone
  note: string
}

export interface DashaPairAnalysis {
  currentA: { lord: string; end: string } | null
  currentB: { lord: string; end: string } | null
  windows: DashaPairWindow[]
  findings: { title: string; detail: string; tone: MilanTone }[]
  summary: string
}

function currentAndNextMaha(nodes: DashaNode[] | undefined, now = new Date()): {
  current: DashaNode | null
  next: DashaNode | null
} {
  if (!nodes?.length) return { current: null, next: null }
  const nowMs = now.getTime()
  const level1 = nodes.filter(n => n.level === 1).length ? nodes.filter(n => n.level === 1) : nodes
  let current: DashaNode | null = null
  let currentIdx = -1
  for (let i = 0; i < level1.length; i++) {
    const n = level1[i]
    const s = new Date(n.start).getTime()
    const e = new Date(n.end).getTime()
    if (nowMs >= s && nowMs < e) {
      current = n
      currentIdx = i
      break
    }
  }
  const next = currentIdx >= 0 && currentIdx + 1 < level1.length ? level1[currentIdx + 1] : null
  return { current, next }
}

function lordRelation(a: string, b: string, lang: EngineLang = 'en'): { label: string; tone: MilanTone } {
  if (a === b) {
    return { label: lang === 'en' ? 'Same lord' : ME_HI.dasha.relation.same, tone: 'mixed' }
  }
  const nameA = ID_TO_NAME[a] ?? a
  const nameB = ID_TO_NAME[b] ?? b
  if (a === 'Ra' || a === 'Ke' || b === 'Ra' || b === 'Ke') {
    return { label: lang === 'en' ? 'Rahu/Ketu period, often a restless or karmic phase' : ME_HI.dasha.relation.rahu, tone: 'caution' }
  }
  const rel = FRIEND_MATRIX[nameA]?.[nameB] ?? 'Neutral'
  const rev = FRIEND_MATRIX[nameB]?.[nameA] ?? 'Neutral'
  if (rel === 'Friend' && rev === 'Friend') {
    return { label: lang === 'en' ? 'Mutual friends' : ME_HI.dasha.relation.friends, tone: 'supportive' }
  }
  if (rel === 'Enemy' || rev === 'Enemy') {
    return { label: lang === 'en' ? 'Lords are not natural friends' : ME_HI.dasha.relation.enemy, tone: 'caution' }
  }
  return { label: lang === 'en' ? 'Neutral or mixed' : ME_HI.dasha.relation.neutral, tone: 'mixed' }
}

function iso(d: Date | string | number): string {
  return new Date(d).toISOString().slice(0, 10)
}

function dashaHitsSeventh(chart: ChartOutput, lordId: string): boolean {
  const asc = chart.lagnas.ascRashi
  if (!asc) return false
  const g = findGraha(chart, lordId as GrahaId)
  if (!g) return false
  return grahaAspectsHouse(g, 7, asc) || wholeSignHouse(g.rashi, asc) === 7 || lordId === houseLord(asc, 7)
}

export function analyzeDashaPair(
  chartA: ChartOutput,
  chartB: ChartOutput,
  now = new Date(),
  lang: EngineLang = 'en',
): DashaPairAnalysis {
  const aTree = chartA.dashas?.vimshottari
  const bTree = chartB.dashas?.vimshottari
  const a = currentAndNextMaha(aTree, now)
  const b = currentAndNextMaha(bTree, now)

  const findings: DashaPairAnalysis['findings'] = []
  const windows: DashaPairWindow[] = []

  const nameA = chartA.meta.name || (lang === 'en' ? 'First chart' : ME_HI.firstChart)
  const nameB = chartB.meta.name || (lang === 'en' ? 'Second chart' : ME_HI.secondChart)
  const pairs: { aNode: DashaNode; bNode: DashaNode; label: string }[] = []
  if (a.current && b.current) {
    pairs.push({ aNode: a.current, bNode: b.current, label: lang === 'en' ? 'Current overlap' : ME_HI.dasha.currentOverlap })
  }
  if (a.current && b.next) {
    pairs.push({ aNode: a.current, bNode: b.next, label: lang === 'en' ? `${nameA} now × ${nameB} next` : ME_HI.dasha.nowNext(nameA, nameB) })
  }
  if (a.next && b.current) {
    pairs.push({ aNode: a.next, bNode: b.current, label: lang === 'en' ? `${nameA} next × ${nameB} now` : ME_HI.dasha.nowNext(nameB, nameA) })
  }
  if (a.next && b.next) {
    pairs.push({ aNode: a.next, bNode: b.next, label: lang === 'en' ? 'Next overlap' : ME_HI.dasha.nextOverlap })
  }

  for (const p of pairs) {
    const start = Math.max(new Date(p.aNode.start).getTime(), new Date(p.bNode.start).getTime(), now.getTime())
    const end = Math.min(new Date(p.aNode.end).getTime(), new Date(p.bNode.end).getTime())
    if (end <= start) continue

    const rel = lordRelation(p.aNode.lord, p.bNode.lord, lang)
    const aHit = dashaHitsSeventh(chartA, p.aNode.lord) || dashaHitsSeventh(chartB, p.aNode.lord)
    const bHit = dashaHitsSeventh(chartB, p.bNode.lord) || dashaHitsSeventh(chartA, p.bNode.lord)
    const marriageActive = aHit || bHit

    const lordA = gName(p.aNode.lord as GrahaId, lang)
    const lordB = gName(p.bNode.lord as GrahaId, lang)
    let note = `${p.label}: ${lordA} × ${lordB} — ${rel.label}.`
    if (marriageActive) note += lang === 'en' ? ' A period lord touches 7th-house themes, so partnership matters may feel more active.' : ME_HI.dasha.marriageTouch
    if (rel.tone === 'caution') note += lang === 'en' ? ' Patience and clear agreements tend to help in this window.' : ME_HI.dasha.patience

    windows.push({
      personALord: lordA,
      personBLord: lordB,
      overlapStart: iso(start),
      overlapEnd: iso(end),
      relation: rel.label,
      tone: marriageActive && rel.tone === 'caution' ? 'caution' : rel.tone,
      note,
    })
  }

  if (a.current && b.current) {
    const rel = lordRelation(a.current.lord, b.current.lord, lang)
    findings.push({
      title: lang === 'en' ? 'Current Mahadasha pair' : ME_HI.dasha.currentPair,
      detail: `${chartA.meta.name || nameA}: ${gName(a.current.lord as GrahaId, lang)} · ${chartB.meta.name || nameB}: ${gName(b.current.lord as GrahaId, lang)} — ${rel.label}.`,
      tone: rel.tone,
    })
  } else {
    findings.push({
      title: lang === 'en' ? 'Dasha data' : 'दशा डेटा',
      detail: lang === 'en'
        ? 'The Vimshottari dasha timeline is incomplete for one or both charts. Recalculate the charts to see the pair timing.'
        : ME_HI.dasha.dataIncomplete,
      tone: 'mixed',
    })
  }

  const cautionWindows = windows.filter(w => w.tone === 'caution')
  const supportWindows = windows.filter(w => w.tone === 'supportive')
  const summary =
    cautionWindows.length > supportWindows.length
      ? (lang === 'en'
        ? 'Upcoming dasha overlaps tendency challenging for harmony between you, so it may help to time big decisions with care.'
        : ME_HI.dasha.summaryCaution)
      : supportWindows.length > 0
        ? (lang === 'en'
          ? 'At least one supportive pairing of dasha lords appears in the near timeline.'
          : ME_HI.dasha.summarySupport)
        : (lang === 'en'
          ? 'The dasha pairing looks mixed; the Antardasha detail gives finer timing.'
          : ME_HI.dasha.summaryMixed)

  return {
    currentA: a.current ? { lord: gName(a.current.lord as GrahaId, lang), end: iso(a.current.end) } : null,
    currentB: b.current ? { lord: gName(b.current.lord as GrahaId, lang), end: iso(b.current.end) } : null,
    windows: windows.slice(0, 6),
    findings,
    summary,
  }
}

// ── 3. Varnamala (Janma-naam letter animals) ───────────────────

export interface VarnamalaGroup {
  index: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8
  letters: string
  animal: string
  animalSa: string
}

export const VARNAMALA_GROUPS: VarnamalaGroup[] = [
  { index: 1, letters: 'अ आ इ ई उ ऊ ए ऐ ओ औ अं अः', animal: 'Snake', animalSa: 'Sarpa' },
  { index: 2, letters: 'क ख ग घ ङ', animal: 'Rat', animalSa: 'Mushak' },
  { index: 3, letters: 'च छ ज झ ञ', animal: 'Deer', animalSa: 'Mriga' },
  { index: 4, letters: 'ट ठ ड ढ ण', animal: 'Ram', animalSa: 'Mesha' },
  { index: 5, letters: 'त थ द ध न', animal: 'Eagle', animalSa: 'Garud' },
  { index: 6, letters: 'प फ ब भ म', animal: 'Cat', animalSa: 'Bil / Bidal' },
  { index: 7, letters: 'य र ल व', animal: 'Lion', animalSa: 'Simha' },
  { index: 8, letters: 'श ष स ह', animal: 'Dog', animalSa: 'Shwan' },
]

/** 5th group from any is enemy (1↔5, 2↔6, 3↔7, 4↔8). */
export function varnamalaEnemyIndex(index: number): number {
  return ((index - 1 + 4) % 8) + 1
}

/** Map Roman pada syllable → Varnamala group index. */
export function syllableToVarnamalaIndex(syllable: string): number | null {
  const s = syllable.trim().toLowerCase()
  if (!s || s === '—') return null

  // Group 1 — pure vowels
  if (/^[aeiou]/.test(s) && !/^[vy]/.test(s)) return 1

  // Group 8 before 2 (sha/sa/ha vs ka)
  if (/^(sh|ṣ|s|h|kh)/.test(s)) return 8

  // Group 2 — ka/ga
  if (/^(k|g|ng|gh)/.test(s)) return 2

  // Group 3 — cha/ja
  if (/^(ch|j|jh|ñ)/.test(s)) return 3

  // Group 4 — retroflex (rare in Roman tables; ṭ ḍ)
  if (/^(ṭ|ḍ|ṇ|ṭ|ḍ)/.test(s)) return 4

  // Group 6 — pa/ba/ma/bha (before dental ta)
  if (/^(p|f|b|bh|m)/.test(s)) return 6

  // Group 7 — ya/ra/la/va
  if (/^(y|r|l|v|w)/.test(s)) return 7

  // Group 5 — dental ta/da/na (default for t/d/n)
  if (/^(t|d|n|th|dh)/.test(s)) return 5

  return null
}

export interface VarnamalaPerson {
  person: string
  janmaSyllable: string
  group: VarnamalaGroup | null
  enemyGroup: VarnamalaGroup | null
  nakshatraIndex: number
  pada: number
}

export interface VarnamalaMatch {
  personA: VarnamalaPerson
  personB: VarnamalaPerson
  compatible: boolean
  tone: MilanTone
  summary: string
}

function varnamalaForChart(chart: ChartOutput): VarnamalaPerson {
  const mo = findGraha(chart, 'Mo')
  const nak = mo?.nakshatraIndex ?? 0
  const pada = mo?.pada ?? 1
  const syllable = getPadaNamingSyllable(nak, pada)
  const idx = syllableToVarnamalaIndex(syllable)
  const group = idx ? VARNAMALA_GROUPS[idx - 1] ?? null : null
  const enemy = group ? VARNAMALA_GROUPS[varnamalaEnemyIndex(group.index) - 1] ?? null : null
  return {
    person: chart.meta.name || 'Person',
    janmaSyllable: syllable,
    group,
    enemyGroup: enemy,
    nakshatraIndex: nak,
    pada,
  }
}

/**
 * Janma-naam Varnamala animal match from Moon pada syllable (not common-use name).
 * Enemy = 5th letter-group.
 */
export function matchVarnamala(chartA: ChartOutput, chartB: ChartOutput, lang: EngineLang = 'en'): VarnamalaMatch {
  const personA = varnamalaForChart(chartA)
  const personB = varnamalaForChart(chartB)

  if (!personA.group || !personB.group) {
    return {
      personA,
      personB,
      compatible: true,
      tone: 'mixed',
      summary: lang === 'en'
        ? 'The birth-name syllable of one or both charts could not be matched to a Varnamala group.'
        : ME_HI.varnamala.missing,
    }
  }

  const enemies =
    personA.group.index === personB.enemyGroup?.index ||
    personB.group.index === personA.enemyGroup?.index

  if (enemies) {
    return {
      personA,
      personB,
      compatible: false,
      tone: 'caution',
      summary: lang === 'en'
        ? `The birth-name animals sit in opposing groups: ${personA.group.animalSa} (${personA.janmaSyllable}) and ${personB.group.animalSa} (${personB.janmaSyllable}). This is a mild, traditional point drawn from the Moon pada sound, not the name you use every day.`
        : ME_HI.varnamala.enemies(personA.group.animalSa, personA.janmaSyllable, personB.group.animalSa, personB.janmaSyllable),
    }
  }

  const same = personA.group.index === personB.group.index
  return {
    personA,
    personB,
    compatible: true,
    tone: same ? 'supportive' : 'mixed',
    summary: same
      ? (lang === 'en'
        ? `Same Varnamala animal (${personA.group.animalSa}) from the birth-name syllables ${personA.janmaSyllable} and ${personB.janmaSyllable}.`
        : ME_HI.varnamala.same(personA.group.animalSa, personA.janmaSyllable, personB.janmaSyllable))
      : (lang === 'en'
        ? `${personA.group.animalSa} (${personA.janmaSyllable}) and ${personB.group.animalSa} (${personB.janmaSyllable}) are not in opposing groups, so this point is comfortable.`
        : ME_HI.varnamala.comfortable(personA.group.animalSa, personA.janmaSyllable, personB.group.animalSa, personB.janmaSyllable)),
  }
}
