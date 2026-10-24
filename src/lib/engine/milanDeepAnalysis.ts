// src/lib/engine/milanDeepAnalysis.ts
// Stage 2–3 Kundali Milan beyond Ashtakoot:
// Venus–Mars chemistry, house-affliction matching (Jatak Parijat),
// 7th-house rotation, and planetary interaction summary.
// Pure engine — no React/DB.

import type { ChartOutput, GrahaData, GrahaId, Rashi } from '@/types/astrology'
import { RASHI_NAMES, GRAHA_NAMES } from '@/types/astrology'
import { getTaraName } from '@/lib/engine/ashtakoot'
import {
  analyzeDashaPair,
  matchVaidhavyaVidhur,
  matchVarnamala,
  type DashaPairAnalysis,
  type VaidhavyaVidhurMatch,
  type VarnamalaMatch,
} from '@/lib/engine/milanExtras'

export type MilanTone = 'supportive' | 'caution' | 'mixed'

export interface MilanFinding {
  id: string
  title: string
  detail: string
  tone: MilanTone
  stage: 2 | 3
}

export interface PlanetaryLink {
  from: string
  to: string
  relation: number
  label: string
  tone: MilanTone
}

export interface HouseAfflictionMatch {
  house: number
  name: string
  personAAfflicted: boolean
  personBAfflicted: boolean
  matched: boolean
  note: string
}

export interface SeventhRotationView {
  person: string
  newLagna: Rashi
  newLagnaName: string
  marriedLifeHouse: number
  romanceHouse: number
  domesticHouse: number
  intimacyHouse: number
  notes: string[]
}

export interface MilanDeepResult {
  stage2: {
    d1Summary: string
    d9Summary: string | null
    houseAfflictions: HouseAfflictionMatch[]
    seventhRotation: SeventhRotationView[]
    findings: MilanFinding[]
  }
  stage3: {
    venusMars: PlanetaryLink[]
    chemistryScore: number
    chemistryLabel: string
    marsNakTara: { fromBoy: string; fromGirl: string; detail: string }
    findings: MilanFinding[]
  }
  longevityYogas: VaidhavyaVidhurMatch
  dashaPair: DashaPairAnalysis
  varnamala: VarnamalaMatch
  planetaryChemistry: PlanetaryLink[]
  overall: {
    stageLabel: string
    summary: string
    priorities: string[]
  }
}

const MARRIAGE_HOUSES = [
  { house: 2, name: 'Family / Kutumb' },
  { house: 4, name: 'Domestic happiness' },
  { house: 5, name: 'Romance / children' },
  { house: 7, name: 'Marriage / spouse' },
  { house: 8, name: 'Longevity / deep change' },
  { house: 9, name: 'Fortune / dharma' },
  { house: 12, name: 'Intimacy / expenses' },
] as const

const MALEFICS: GrahaId[] = ['Su', 'Ma', 'Sa', 'Ra', 'Ke']

function wholeSignHouse(planetRashi: number, ascRashi: number): number {
  return ((planetRashi - ascRashi + 12) % 12) + 1
}

function signCount(from: number, to: number): number {
  return ((to - from + 12) % 12) + 1
}

function findGraha(chart: ChartOutput, id: GrahaId): GrahaData | undefined {
  return chart.grahas.find(g => g.id === id)
}

function ord(n: number): string {
  return n === 1 ? '1st' : n === 2 ? '2nd' : n === 3 ? '3rd' : `${n}th`
}

function rn(r: number): string {
  return RASHI_NAMES[r as keyof typeof RASHI_NAMES] ?? `R${r}`
}

function aspectTone(rel: number): MilanTone {
  if ([1, 5, 7, 9].includes(rel)) return 'supportive'
  if ([6, 8, 12].includes(rel)) return 'caution'
  return 'mixed'
}

function aspectLabel(rel: number): string {
  const map: Record<number, string> = {
    1: 'Conjunction / same sign',
    2: '2nd / 12th apart (some tension)',
    3: '3rd / 11th apart (some support)',
    4: '4th / 10th apart (neutral)',
    5: 'Trine (5th)',
    6: '6th / 8th apart (friction)',
    7: 'Opposition (7th)',
    8: '8th / 6th apart (friction)',
    9: 'Trine (9th)',
    10: '10th / 4th apart (neutral)',
    11: '11th / 3rd apart (some support)',
    12: '12th / 2nd apart (some tension)',
  }
  return map[rel] ?? `${rel}th relation`
}

function linkPlanets(
  a: GrahaData | undefined,
  b: GrahaData | undefined,
  fromLabel: string,
  toLabel: string,
): PlanetaryLink | null {
  if (!a || !b) return null
  const rel = signCount(a.rashi, b.rashi)
  return {
    from: fromLabel,
    to: toLabel,
    relation: rel,
    label: aspectLabel(rel),
    tone: aspectTone(rel),
  }
}

function houseAfflicted(chart: ChartOutput, house: number): boolean {
  const asc = chart.lagnas.ascRashi
  if (!asc) return false
  const lordRashi = ((asc - 1 + house - 1) % 12) + 1
  const RASHI_LORD: Record<number, GrahaId> = {
    1: 'Ma', 2: 'Ve', 3: 'Me', 4: 'Mo', 5: 'Su', 6: 'Me',
    7: 'Ve', 8: 'Ma', 9: 'Ju', 10: 'Sa', 11: 'Sa', 12: 'Ju',
  }
  const lordId = RASHI_LORD[lordRashi]
  const lord = lordId ? findGraha(chart, lordId) : undefined

  let score = 0
  // Malefics occupying the house
  for (const g of chart.grahas) {
    if (!MALEFICS.includes(g.id)) continue
    if (wholeSignHouse(g.rashi, asc) === house) score += 2
  }
  // Lord in dusthana (6/8/12)
  if (lord) {
    const lh = wholeSignHouse(lord.rashi, asc)
    if ([6, 8, 12].includes(lh)) score += 2
    if (lord.isCombust) score += 1
  }
  // Empty house with weak lord only counts if lord dusthana
  return score >= 2
}

function analyzeSeventhRotation(chart: ChartOutput, forPerson: string, readFor?: string): SeventhRotationView {
  const asc = chart.lagnas.ascRashi as Rashi
  const newLagna = ((((asc - 1 + 6) % 12) + 1) as Rashi) // 7th from lagna
  const notes: string[] = []

  const checkHouse = (h: number, label: string) => {
    if (houseAfflicted(chart, h)) {
      notes.push(`${label} (natal house ${h}, house ${((h + 5) % 12) + 1} from the partner's viewpoint) shows some strain.`)
    }
  }
  // From natal: 7=married life, 5=romance; from the 7th-as-lagna view these become 1, 11, 10, 6
  // We report natal houses relative to the partner's perspective
  checkHouse(7, 'Married life (7th)')
  checkHouse(5, 'Romance / children (5th)')
  checkHouse(4, 'Domestic happiness (4th)')
  checkHouse(12, 'Intimacy (12th)')

  if (notes.length === 0) {
    notes.push('No significant strain flagged on the 4th, 5th, 7th or 12th house in this view.')
  }
  if (readFor) {
    notes.unshift(`Reading ${forPerson}'s chart with the 7th house as lagna, to see how ${readFor} may experience the marriage.`)
  }

  return {
    person: forPerson,
    newLagna,
    newLagnaName: rn(newLagna),
    marriedLifeHouse: 7,
    romanceHouse: 5,
    domesticHouse: 4,
    intimacyHouse: 12,
    notes,
  }
}

function d9LordHarmony(a: ChartOutput, b: ChartOutput): string | null {
  const aD9 = a.vargas?.D9
  const bD9 = b.vargas?.D9
  if (!aD9 || !bD9) return null
  const aMo = aD9.find(g => g.id === 'Mo')
  const bMo = bD9.find(g => g.id === 'Mo')
  if (!aMo || !bMo) return null
  const rel = signCount(aMo.rashi, bMo.rashi)
  const tone = aspectTone(rel)
  return `D9 Moon signs ${rn(aMo.rashi)} ↔ ${rn(bMo.rashi)} (${aspectLabel(rel)}) — ${
    tone === 'supportive' ? 'a supportive layer of deeper compatibility' : tone === 'caution' ? 'some friction in the deeper values of the marriage' : 'a mixed Navamsha Moon link'
  }.`
}

/**
 * Full Stage 2–3 Milan analysis from two calculated charts.
 * chartA = Person 1, chartB = Person 2 (order follows the roles chosen in the app).
 */
export function analyzeMilanDeep(chartA: ChartOutput, chartB: ChartOutput): MilanDeepResult {
  const nameA = chartA.meta.name || 'Person 1'
  const nameB = chartB.meta.name || 'Person 2'

  const aVe = findGraha(chartA, 'Ve')
  const bVe = findGraha(chartB, 'Ve')
  const aMa = findGraha(chartA, 'Ma')
  const bMa = findGraha(chartB, 'Ma')
  const aJu = findGraha(chartA, 'Ju')
  const bJu = findGraha(chartB, 'Ju')
  const aSa = findGraha(chartA, 'Sa')
  const bSa = findGraha(chartB, 'Sa')
  const aMo = findGraha(chartA, 'Mo')
  const bMo = findGraha(chartB, 'Mo')

  // ── Stage 3: Venus–Mars chemistry ───────────────────────────
  const venusMars: PlanetaryLink[] = []
  const push = (l: PlanetaryLink | null) => { if (l) venusMars.push(l) }

  push(linkPlanets(aVe, bMa, `${nameA} Venus`, `${nameB} Mars`))
  push(linkPlanets(bVe, aMa, `${nameB} Venus`, `${nameA} Mars`))
  push(linkPlanets(aVe, bVe, `${nameA} Venus`, `${nameB} Venus`))
  push(linkPlanets(aMa, bMa, `${nameA} Mars`, `${nameB} Mars`))
  push(linkPlanets(aVe, aMa, `${nameA} Venus`, `${nameA} Mars (own chart)`))
  push(linkPlanets(bVe, bMa, `${nameB} Venus`, `${nameB} Mars (own chart)`))

  let chemPts = 0
  for (const l of venusMars) {
    if (l.tone === 'supportive') chemPts += 2
    else if (l.tone === 'mixed') chemPts += 1
  }
  const chemistryScore = Math.min(10, chemPts)
  const chemistryLabel =
    chemistryScore >= 8 ? 'Strong Venus–Mars chemistry' :
    chemistryScore >= 5 ? 'Workable chemistry with conscious effort' :
    'Chemistry needs careful cultivation'

  const stage3Findings: MilanFinding[] = []
  const crossVeMa = venusMars.filter(l =>
    (l.from.includes('Venus') && l.to.includes('Mars')) ||
    (l.from.includes('Mars') && l.to.includes('Venus')),
  )
  const goodCross = crossVeMa.filter(l => l.tone === 'supportive')
  if (goodCross.length >= 1) {
    stage3Findings.push({
      id: 've-ma-attraction',
      title: 'Cross Venus–Mars attraction',
      detail: goodCross.map(l => `${l.from} → ${l.to}: ${l.label}`).join(' · '),
      tone: 'supportive',
      stage: 3,
    })
  } else {
    stage3Findings.push({
      id: 've-ma-weak',
      title: 'Muted Venus–Mars cross-link',
      detail: 'The planets of romance and passion do not form the classical supportive links (1st, 5th, 7th or 9th) across the two charts. Attraction can still grow through shared rituals, time together and patience.',
      tone: 'caution',
      stage: 3,
    })
  }

  // Mars nakshatra tara (karmic passion link)
  let marsNakTara = {
    fromBoy: '—',
    fromGirl: '—',
    detail: 'Mars nakshatra data is unavailable.',
  }
  if (aMa && bMa) {
    const aNak = aMa.nakshatraIndex >= 0 ? aMa.nakshatraIndex + 1 : Math.floor(aMa.totalDegree / (360 / 27)) + 1
    const bNak = bMa.nakshatraIndex >= 0 ? bMa.nakshatraIndex + 1 : Math.floor(bMa.totalDegree / (360 / 27)) + 1
    const fromBoy = getTaraName(aNak, bNak)
    const fromGirl = getTaraName(bNak, aNak)
    const bad = ['Vipat', 'Pratyari', 'Vadha']
    const tone = bad.includes(fromBoy) || bad.includes(fromGirl) ? 'caution' : 'supportive'
    marsNakTara = {
      fromBoy,
      fromGirl,
      detail: `Mars Tara ${fromBoy} / ${fromGirl}: ${tone === 'caution' ? 'some friction in how passion is expressed' : 'a supportive rhythm of passion between the two Mars nakshatras'}.`,
    }
    stage3Findings.push({
      id: 'mars-tara',
      title: 'Mars Nakshatra Tara',
      detail: marsNakTara.detail,
      tone,
      stage: 3,
    })
  }

  // ── Broader planetary chemistry ─────────────────────────────
  const planetaryChemistry: PlanetaryLink[] = [...venusMars]
  const extra = [
    linkPlanets(aJu, bMo, `${nameA} Jupiter`, `${nameB} Moon`),
    linkPlanets(bJu, aMo, `${nameB} Jupiter`, `${nameA} Moon`),
    linkPlanets(aSa, bMo, `${nameA} Saturn`, `${nameB} Moon`),
    linkPlanets(bSa, aMo, `${nameB} Saturn`, `${nameA} Moon`),
    linkPlanets(aMo, bMo, `${nameA} Moon`, `${nameB} Moon`),
  ]
  for (const l of extra) if (l) planetaryChemistry.push(l)

  // ── Stage 2: house affliction matching ──────────────────────
  const houseAfflictions: HouseAfflictionMatch[] = MARRIAGE_HOUSES.map(({ house, name }) => {
    const aAff = houseAfflicted(chartA, house)
    const bAff = houseAfflicted(chartB, house)
    const matched = aAff === bAff
    let note: string
    if (aAff && bAff) {
      note = `Both charts show strain on the ${ord(house)} house (${name}); in the classical matching idea (Jatak Parijat), a shared challenge can bring partners closer.`
    } else if (aAff && !bAff) {
      note = `Only ${nameA}'s chart shows strain on the ${ord(house)} house (${name}); ${nameB} may not feel that same pressure, so open conversation helps.`
    } else if (!aAff && bAff) {
      note = `Only ${nameB}'s chart shows strain on the ${ord(house)} house (${name}); ${nameA} may not feel that same pressure, so open conversation helps.`
    } else {
      note = `Neither chart shows significant strain on the ${ord(house)} house, a clearer field for ${name}.`
    }
    return {
      house,
      name,
      personAAfflicted: aAff,
      personBAfflicted: bAff,
      matched,
      note,
    }
  })

  const mismatchHouses = houseAfflictions.filter(h => !h.matched && (h.personAAfflicted || h.personBAfflicted))
  const stage2Findings: MilanFinding[] = []

  if (mismatchHouses.length === 0) {
    stage2Findings.push({
      id: 'house-match',
      title: 'House affliction balance',
      detail: 'The key marriage houses show matching patterns (or are clear in both charts), which the classical Jatak Parijat approach reads as favourable.',
      tone: 'supportive',
      stage: 2,
    })
  } else {
    stage2Findings.push({
      id: 'house-mismatch',
      title: 'Uneven house afflictions',
      detail: `Uneven strain on: ${mismatchHouses.map(h => `${ord(h.house)} house (${h.name})`).join(', ')}. Talking these themes through together, with shared remedies or counselling if you wish, can help.`,
      tone: 'caution',
      stage: 2,
    })
  }

  const seventhRotation = [
    analyzeSeventhRotation(chartA, nameA, nameB),
    analyzeSeventhRotation(chartB, nameB, nameA),
  ]

  const d9Summary = d9LordHarmony(chartA, chartB)
  if (d9Summary) {
    stage2Findings.push({
      id: 'd9-moon',
      title: 'Navamsha (D9) Moon link',
      detail: d9Summary,
      tone: d9Summary.includes('friction') ? 'caution' : d9Summary.includes('supportive') ? 'supportive' : 'mixed',
      stage: 2,
    })
  }

  const aL = chartA.lagnas.ascRashi
  const bL = chartB.lagnas.ascRashi
  const lagnaRel = aL && bL ? signCount(aL, bL) : 0
  const d1Summary =
    aL && bL
      ? `D1 Lagnas ${rn(aL)} ↔ ${rn(bL)} (${aspectLabel(lagnaRel)}). The 7th lords and Venus–Mars links usually matter more than the lagna pairing alone.`
      : 'D1 lagna data is incomplete.'

  stage2Findings.push({
    id: 'd1-lagna',
    title: 'D1 lagna relationship',
    detail: d1Summary,
    tone: aspectTone(lagnaRel || 3),
    stage: 2,
  })

  // ── Longevity yogas, dasha pair, Varnamala ──────────────────
  const longevityYogas = matchVaidhavyaVidhur(chartA, chartB)
  const dashaPair = analyzeDashaPair(chartA, chartB)
  const varnamala = matchVarnamala(chartA, chartB)

  stage2Findings.push({
    id: 'vaidhavya-vidhur',
    title: 'Partner longevity and wellbeing yogas (Vaidhavya / Vidhur)',
    detail: longevityYogas.summary,
    tone: longevityYogas.tone,
    stage: 2,
  })
  stage2Findings.push({
    id: 'varnamala',
    title: 'Birth-name Varnamala (Janma-naam)',
    detail: varnamala.summary,
    tone: varnamala.tone,
    stage: 2,
  })
  stage3Findings.push({
    id: 'dasha-pair',
    title: 'Dasha-pair timing',
    detail: dashaPair.summary,
    tone: dashaPair.findings[0]?.tone ?? 'mixed',
    stage: 3,
  })

  // ── Overall ─────────────────────────────────────────────────
  const priorities: string[] = [
    'Ashtakoot is only the first stage, so the guna total is best read alongside the points below.',
    'Look at the Venus–Mars links between you and the Mars nakshatra tara (Stage 3).',
    'Compare strain on the 2nd, 4th, 5th, 7th, 8th, 9th and 12th houses in both charts (Jatak Parijat).',
    'Read the partner longevity and wellbeing yogas (Vaidhavya / Vidhur) of both charts together; they are tendencies, not predictions.',
    'View each chart with the 7th house as lagna to see how each partner may experience married life, home and intimacy.',
    'Compare the upcoming Mahadasha pairs of both charts when thinking about timing.',
    'Birth-name Varnamala animals use the Moon pada sound, not the name used every day.',
  ]

  let stageLabel = 'A full three-stage reading is worthwhile'
  let summary = `${chemistryLabel}. Stage 2 house patterns and Stage 3 planetary chemistry ${
    chemistryScore >= 5 && mismatchHouses.length <= 2 ? 'are broadly workable' : 'deserve a careful, unhurried look'
  }.`

  if (longevityYogas.tone === 'caution') {
    summary += ` Partner longevity and wellbeing yogas: ${longevityYogas.summary}`
  }

  if (chemistryScore >= 8 && mismatchHouses.length <= 1 && longevityYogas.tone !== 'caution') {
    stageLabel = 'Strong Stage 2–3 support'
    summary = 'Venus–Mars chemistry and the balance of house strain support this match beyond the Moon-based gunas.'
  } else if (chemistryScore < 4 || mismatchHouses.length >= 4 || longevityYogas.tone === 'caution') {
    stageLabel = 'Stage 2–3: points to handle with care'
    summary = 'Planetary chemistry, partner-wellbeing yogas and/or uneven house strain call for patience, good timing and realistic expectations. The guna score alone does not tell the whole story.'
  }

  return {
    stage2: {
      d1Summary,
      d9Summary,
      houseAfflictions,
      seventhRotation,
      findings: stage2Findings,
    },
    stage3: {
      venusMars,
      chemistryScore,
      chemistryLabel,
      marsNakTara,
      findings: stage3Findings,
    },
    longevityYogas,
    dashaPair,
    varnamala,
    planetaryChemistry,
    overall: {
      stageLabel,
      summary,
      priorities,
    },
  }
}

/** Short display helper for graha names in UI. */
export function milanGrahaLabel(id: GrahaId): string {
  return GRAHA_NAMES[id] ?? id
}
