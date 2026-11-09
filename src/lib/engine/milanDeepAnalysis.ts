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
import type { EngineLang } from '@/lib/engine/lang'
import { gName, rName } from '@/lib/engine/divisionalLang'
import { MDA_HI, localizeMilanDeep } from '@/lib/engine/locale/milanDeepAnalysis.hi'

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

function ord(n: number, lang: EngineLang = 'en'): string {
  return lang === 'en'
    ? (n === 1 ? '1st' : n === 2 ? '2nd' : n === 3 ? '3rd' : `${n}th`)
    : MDA_HI.ord(n)
}

function rn(r: number): string {
  return RASHI_NAMES[r as keyof typeof RASHI_NAMES] ?? `R${r}`
}

function aspectTone(rel: number): MilanTone {
  if ([1, 5, 7, 9].includes(rel)) return 'supportive'
  if ([6, 8, 12].includes(rel)) return 'caution'
  return 'mixed'
}

function aspectLabel(rel: number, lang: EngineLang = 'en'): string {
  if (lang === 'hi') return MDA_HI.aspects[rel] ?? MDA_HI.aspectFallback(rel)
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
  lang: EngineLang = 'en',
): PlanetaryLink | null {
  if (!a || !b) return null
  const rel = signCount(a.rashi, b.rashi)
  return {
    from: fromLabel,
    to: toLabel,
    relation: rel,
    label: aspectLabel(rel, lang),
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

function analyzeSeventhRotation(
  chart: ChartOutput,
  forPerson: string,
  readFor: string | undefined,
  lang: EngineLang,
): SeventhRotationView {
  const asc = chart.lagnas.ascRashi as Rashi
  const newLagna = ((((asc - 1 + 6) % 12) + 1) as Rashi) // 7th from lagna
  const notes: string[] = []
  const rnLoc = (r: number) => (lang === 'en' ? rn(r) : rName(r as Rashi, lang))

  const checkHouse = (h: number, labelEn: string, labelHi: string) => {
    if (houseAfflicted(chart, h)) {
      const label = lang === 'en' ? labelEn : labelHi
      const fromPartner = ((h + 5) % 12) + 1
      notes.push(
        lang === 'en'
          ? `${label} (natal house ${h}, house ${fromPartner} from the partner's viewpoint) shows some strain.`
          : MDA_HI.rotation.strain(label, h, fromPartner),
      )
    }
  }
  checkHouse(7, 'Married life (7th)', MDA_HI.rotation.married)
  checkHouse(5, 'Romance / children (5th)', MDA_HI.rotation.romance)
  checkHouse(4, 'Domestic happiness (4th)', MDA_HI.rotation.domestic)
  checkHouse(12, 'Intimacy (12th)', MDA_HI.rotation.intimacy)

  if (notes.length === 0) {
    notes.push(lang === 'en'
      ? 'No significant strain flagged on the 4th, 5th, 7th or 12th house in this view.'
      : MDA_HI.rotation.clear)
  }
  if (readFor) {
    notes.unshift(
      lang === 'en'
        ? `Reading ${forPerson}'s chart with the 7th house as lagna, to see how ${readFor} may experience the marriage.`
        : MDA_HI.rotation.readFor(forPerson, readFor),
    )
  }

  return {
    person: forPerson,
    newLagna,
    newLagnaName: rnLoc(newLagna),
    marriedLifeHouse: 7,
    romanceHouse: 5,
    domesticHouse: 4,
    intimacyHouse: 12,
    notes,
  }
}

function d9LordHarmony(a: ChartOutput, b: ChartOutput, lang: EngineLang): string | null {
  const aD9 = a.vargas?.D9
  const bD9 = b.vargas?.D9
  if (!aD9 || !bD9) return null
  const aMo = aD9.find(g => g.id === 'Mo')
  const bMo = bD9.find(g => g.id === 'Mo')
  if (!aMo || !bMo) return null
  const rel = signCount(aMo.rashi, bMo.rashi)
  const tone = aspectTone(rel)
  const aSign = lang === 'en' ? rn(aMo.rashi) : rName(aMo.rashi as Rashi, lang)
  const bSign = lang === 'en' ? rn(bMo.rashi) : rName(bMo.rashi as Rashi, lang)
  const aspect = aspectLabel(rel, lang)
  if (lang === 'en') {
    return `D9 Moon signs ${aSign} ↔ ${bSign} (${aspect}) — ${
      tone === 'supportive' ? 'a supportive layer of deeper compatibility' : tone === 'caution' ? 'some friction in the deeper values of the marriage' : 'a mixed Navamsha Moon link'
    }.`
  }
  const tail = tone === 'supportive' ? MDA_HI.d9Moon.supportive : tone === 'caution' ? MDA_HI.d9Moon.caution : MDA_HI.d9Moon.mixed
  return MDA_HI.d9Moon.line(aSign, bSign, aspect, tail)
}

/**
 * Full Stage 2–3 Milan analysis from two calculated charts.
 * chartA = Person 1, chartB = Person 2 (order follows the roles chosen in the app).
 */
export function analyzeMilanDeep(
  chartA: ChartOutput,
  chartB: ChartOutput,
  lang: EngineLang = 'en',
): MilanDeepResult {
  const nameA = chartA.meta.name || (lang === 'en' ? 'Person 1' : 'जन 1')
  const nameB = chartB.meta.name || (lang === 'en' ? 'Person 2' : 'जन 2')
  const rnLoc = (r: number) => (lang === 'en' ? rn(r) : rName(r as Rashi, lang))

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
  const g = (id: GrahaId) => gName(id, lang)
  const veLabel = (n: string) => `${n} ${g('Ve')}`
  const maLabel = (n: string) => `${n} ${g('Ma')}`
  const veOwn = (n: string) => (lang === 'en' ? `${n} Venus` : veLabel(n))
  const maOwn = (n: string) => (lang === 'en' ? `${n} Mars` : maLabel(n))

  push(linkPlanets(aVe, bMa, veOwn(nameA), maOwn(nameB), lang))
  push(linkPlanets(bVe, aMa, veOwn(nameB), maOwn(nameA), lang))
  push(linkPlanets(aVe, bVe, veOwn(nameA), veOwn(nameB), lang))
  push(linkPlanets(aMa, bMa, maOwn(nameA), maOwn(nameB), lang))
  push(linkPlanets(aVe, aMa, veOwn(nameA), lang === 'en' ? `${nameA} Mars (own chart)` : MDA_HI.venusMarsOwn(nameA), lang))
  push(linkPlanets(bVe, bMa, veOwn(nameB), lang === 'en' ? `${nameB} Mars (own chart)` : MDA_HI.venusMarsOwn(nameB), lang))

  let chemPts = 0
  for (const l of venusMars) {
    if (l.tone === 'supportive') chemPts += 2
    else if (l.tone === 'mixed') chemPts += 1
  }
  const chemistryScore = Math.min(10, chemPts)
  const chemistryLabel = lang === 'en'
    ? (chemistryScore >= 8 ? 'Strong Venus–Mars chemistry' : chemistryScore >= 5 ? 'Workable chemistry with conscious effort' : 'Chemistry needs careful cultivation')
    : (chemistryScore >= 8 ? MDA_HI.chemistry.strong : chemistryScore >= 5 ? MDA_HI.chemistry.workable : MDA_HI.chemistry.cultivate)

  const stage3Findings: MilanFinding[] = []
  const crossVeMa = venusMars.filter(l =>
    (l.from.includes(g('Ve')) && l.to.includes(g('Ma'))) ||
    (l.from.includes(g('Ma')) && l.to.includes(g('Ve'))) ||
    (lang === 'en' && ((l.from.includes('Venus') && l.to.includes('Mars')) || (l.from.includes('Mars') && l.to.includes('Venus')))),
  )
  const goodCross = crossVeMa.filter(l => l.tone === 'supportive')
  if (goodCross.length >= 1) {
    stage3Findings.push({
      id: 've-ma-attraction',
      title: lang === 'en' ? 'Cross Venus–Mars attraction' : MDA_HI.findings['ve-ma-attraction'].title,
      detail: goodCross.map(l => `${l.from} → ${l.to}: ${l.label}`).join(' · '),
      tone: 'supportive',
      stage: 3,
    })
  } else {
    const weak = MDA_HI.findings['ve-ma-weak']
    stage3Findings.push({
      id: 've-ma-weak',
      title: lang === 'en' ? 'Muted Venus–Mars cross-link' : weak.title,
      detail: lang === 'en'
        ? 'The planets of romance and passion do not form the classical supportive links (1st, 5th, 7th or 9th) across the two charts. Attraction can still grow through shared rituals, time together and patience.'
        : (typeof weak.detail === 'string' ? weak.detail : ''),
      tone: 'caution',
      stage: 3,
    })
  }

  // Mars nakshatra tara (karmic passion link)
  let marsNakTara = {
    fromBoy: '—',
    fromGirl: '—',
    detail: lang === 'en' ? 'Mars nakshatra data is unavailable.' : MDA_HI.marsTara.unavailable,
  }
  if (aMa && bMa) {
    const aNak = aMa.nakshatraIndex >= 0 ? aMa.nakshatraIndex + 1 : Math.floor(aMa.totalDegree / (360 / 27)) + 1
    const bNak = bMa.nakshatraIndex >= 0 ? bMa.nakshatraIndex + 1 : Math.floor(bMa.totalDegree / (360 / 27)) + 1
    const fromBoy = getTaraName(aNak, bNak)
    const fromGirl = getTaraName(bNak, aNak)
    const bad = ['Vipat', 'Pratyari', 'Vadha']
    const tone = bad.includes(fromBoy) || bad.includes(fromGirl) ? 'caution' : 'supportive'
    const taraTail = lang === 'en'
      ? (tone === 'caution' ? 'some friction in how passion is expressed' : 'a supportive rhythm of passion between the two Mars nakshatras')
      : (tone === 'caution' ? MDA_HI.marsTara.caution : MDA_HI.marsTara.support)
    marsNakTara = {
      fromBoy,
      fromGirl,
      detail: lang === 'en'
        ? `Mars Tara ${fromBoy} / ${fromGirl}: ${taraTail}.`
        : MDA_HI.marsTara.detail(fromBoy, fromGirl, taraTail),
    }
    stage3Findings.push({
      id: 'mars-tara',
      title: lang === 'en' ? 'Mars Nakshatra Tara' : MDA_HI.findings['mars-tara'].title,
      detail: marsNakTara.detail,
      tone,
      stage: 3,
    })
  }

  // ── Broader planetary chemistry ─────────────────────────────
  const planetaryChemistry: PlanetaryLink[] = [...venusMars]
  const pl = (n: string, id: GrahaId) => `${n} ${g(id)}`
  const extra = [
    linkPlanets(aJu, bMo, pl(nameA, 'Ju'), pl(nameB, 'Mo'), lang),
    linkPlanets(bJu, aMo, pl(nameB, 'Ju'), pl(nameA, 'Mo'), lang),
    linkPlanets(aSa, bMo, pl(nameA, 'Sa'), pl(nameB, 'Mo'), lang),
    linkPlanets(bSa, aMo, pl(nameB, 'Sa'), pl(nameA, 'Mo'), lang),
    linkPlanets(aMo, bMo, pl(nameA, 'Mo'), pl(nameB, 'Mo'), lang),
  ]
  for (const l of extra) if (l) planetaryChemistry.push(l)

  // ── Stage 2: house affliction matching ──────────────────────
  const houseAfflictions: HouseAfflictionMatch[] = MARRIAGE_HOUSES.map(({ house, name }) => {
    const aAff = houseAfflicted(chartA, house)
    const bAff = houseAfflicted(chartB, house)
    const matched = aAff === bAff
    const hName = lang === 'en' ? name : (MDA_HI.houses[house] ?? name)
    const o = ord(house, lang)
    let note: string
    if (aAff && bAff) {
      note = lang === 'en'
        ? `Both charts show strain on the ${o} house (${hName}); in the classical matching idea (Jatak Parijat), a shared challenge can bring partners closer.`
        : MDA_HI.houseNotes.both(o, hName)
    } else if (aAff && !bAff) {
      note = lang === 'en'
        ? `Only ${nameA}'s chart shows strain on the ${o} house (${hName}); ${nameB} may not feel that same pressure, so open conversation helps.`
        : MDA_HI.houseNotes.onlyA(nameA, o, hName, nameB)
    } else if (!aAff && bAff) {
      note = lang === 'en'
        ? `Only ${nameB}'s chart shows strain on the ${o} house (${hName}); ${nameA} may not feel that same pressure, so open conversation helps.`
        : MDA_HI.houseNotes.onlyB(nameB, o, hName, nameA)
    } else {
      note = lang === 'en'
        ? `Neither chart shows significant strain on the ${o} house, a clearer field for ${hName}.`
        : MDA_HI.houseNotes.neither(o, hName)
    }
    return {
      house,
      name: hName,
      personAAfflicted: aAff,
      personBAfflicted: bAff,
      matched,
      note,
    }
  })

  const mismatchHouses = houseAfflictions.filter(h => !h.matched && (h.personAAfflicted || h.personBAfflicted))
  const stage2Findings: MilanFinding[] = []

  if (mismatchHouses.length === 0) {
    const hm = MDA_HI.findings['house-match']
    stage2Findings.push({
      id: 'house-match',
      title: lang === 'en' ? 'House difficult influence balance' : hm.title,
      detail: lang === 'en'
        ? 'The key marriage houses show matching patterns (or are clear in both charts), which the classical Jatak Parijat approach reads as favourable.'
        : (typeof hm.detail === 'string' ? hm.detail : ''),
      tone: 'supportive',
      stage: 2,
    })
  } else {
    const list = mismatchHouses.map(h => `${ord(h.house, lang)} ${lang === 'en' ? 'house' : 'भाव'} (${h.name})`).join(', ')
    const hm = MDA_HI.findings['house-mismatch']
    stage2Findings.push({
      id: 'house-mismatch',
      title: lang === 'en' ? 'Uneven house difficult influences' : hm.title,
      detail: lang === 'en'
        ? `Uneven strain on: ${list}. Talking these themes through together, with shared remedies or counselling if you wish, can help.`
        : (typeof hm.detail === 'function' ? hm.detail(list) : ''),
      tone: 'caution',
      stage: 2,
    })
  }

  const seventhRotation = [
    analyzeSeventhRotation(chartA, nameA, nameB, lang),
    analyzeSeventhRotation(chartB, nameB, nameA, lang),
  ]

  const d9Summary = d9LordHarmony(chartA, chartB, lang)
  if (d9Summary) {
    const friction = lang === 'en' ? d9Summary.includes('friction') : d9Summary.includes(MDA_HI.d9Moon.caution)
    const support = lang === 'en' ? d9Summary.includes('supportive') : d9Summary.includes(MDA_HI.d9Moon.supportive)
    stage2Findings.push({
      id: 'd9-moon',
      title: lang === 'en' ? 'Navamsha (D9) Moon link' : MDA_HI.findings['d9-moon'].title,
      detail: d9Summary,
      tone: friction ? 'caution' : support ? 'supportive' : 'mixed',
      stage: 2,
    })
  }

  const aL = chartA.lagnas.ascRashi
  const bL = chartB.lagnas.ascRashi
  const lagnaRel = aL && bL ? signCount(aL, bL) : 0
  const d1Summary =
    aL && bL
      ? (lang === 'en'
        ? `D1 Lagnas ${rn(aL)} ↔ ${rn(bL)} (${aspectLabel(lagnaRel, lang)}). The 7th lords and Venus–Mars links usually matter more than the lagna pairing alone.`
        : MDA_HI.d1.summary(rnLoc(aL), rnLoc(bL), aspectLabel(lagnaRel, lang)))
      : (lang === 'en' ? 'D1 lagna data is incomplete.' : MDA_HI.d1.incomplete)

  stage2Findings.push({
    id: 'd1-lagna',
    title: lang === 'en' ? 'D1 lagna relationship' : MDA_HI.findings['d1-lagna'].title,
    detail: d1Summary,
    tone: aspectTone(lagnaRel || 3),
    stage: 2,
  })

  // ── Longevity yogas, dasha pair, Varnamala ──────────────────
  const longevityYogas = matchVaidhavyaVidhur(chartA, chartB, lang)
  const dashaPair = analyzeDashaPair(chartA, chartB, new Date(), lang)
  const varnamala = matchVarnamala(chartA, chartB, lang)

  stage2Findings.push({
    id: 'vaidhavya-vidhur',
    title: lang === 'en' ? 'Partner longevity and wellbeing yogas (Vaidhavya / Vidhur)' : MDA_HI.findings['vaidhavya-vidhur'].title,
    detail: longevityYogas.summary,
    tone: longevityYogas.tone,
    stage: 2,
  })
  stage2Findings.push({
    id: 'varnamala',
    title: lang === 'en' ? 'Birth-name Varnamala (Janma-naam)' : MDA_HI.findings['varnamala'].title,
    detail: varnamala.summary,
    tone: varnamala.tone,
    stage: 2,
  })
  stage3Findings.push({
    id: 'dasha-pair',
    title: lang === 'en' ? 'Dasha-pair timing' : MDA_HI.findings['dasha-pair'].title,
    detail: dashaPair.summary,
    tone: dashaPair.findings[0]?.tone ?? 'mixed',
    stage: 3,
  })

  // ── Overall ─────────────────────────────────────────────────
  const priorities: string[] = lang === 'en'
    ? [
      'Ashtakoot is only the first stage, so the guna total is best read alongside the points below.',
      'Look at the Venus–Mars links between you and the Mars nakshatra tara (Stage 3).',
      'Compare strain on the 2nd, 4th, 5th, 7th, 8th, 9th and 12th houses in both charts (Jatak Parijat).',
      'Read the partner longevity and wellbeing yogas (Vaidhavya / Vidhur) of both charts together; they are tendencies, not predictions.',
      'View each chart with the 7th house as lagna to see how each partner may experience married life, home and intimacy.',
      'Compare the upcoming Mahadasha pairs of both charts when thinking about timing.',
      'Birth-name Varnamala animals use the Moon pada sound, not the name used every day.',
    ]
    : MDA_HI.priorities

  const workable = chemistryScore >= 5 && mismatchHouses.length <= 2
  let stageLabel = lang === 'en' ? 'A full three-stage reading is worthwhile' : MDA_HI.stage.full
  let summary = lang === 'en'
    ? `${chemistryLabel}. Stage 2 house patterns and Stage 3 planetary chemistry ${workable ? 'are broadly workable' : 'deserve a careful, unhurried look'}.`
    : (workable ? MDA_HI.overall.workable(chemistryLabel) : MDA_HI.overall.careful(chemistryLabel))

  if (longevityYogas.tone === 'caution') {
    summary += lang === 'en'
      ? ` Partner longevity and wellbeing yogas: ${longevityYogas.summary}`
      : MDA_HI.overall.longevityAppend(longevityYogas.summary)
  }

  if (chemistryScore >= 8 && mismatchHouses.length <= 1 && longevityYogas.tone !== 'caution') {
    stageLabel = lang === 'en' ? 'Strong Stage 2–3 support' : MDA_HI.stage.strong
    summary = lang === 'en'
      ? 'Venus–Mars chemistry and the balance of house strain support this match beyond the Moon-based gunas.'
      : MDA_HI.overall.strongSummary
  } else if (chemistryScore < 4 || mismatchHouses.length >= 4 || longevityYogas.tone === 'caution') {
    stageLabel = lang === 'en' ? 'Stage 2–3: points to handle with care' : MDA_HI.stage.care
    summary = lang === 'en'
      ? 'Planetary chemistry, partner-wellbeing yogas and/or uneven house strain call for patience, good timing and realistic expectations. The guna score alone does not tell the whole story.'
      : MDA_HI.overall.careSummary
  }

  const enResult: MilanDeepResult = {
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
  if (lang === 'en') return enResult
  return localizeMilanDeep(enResult, lang)
}

/** Short display helper for graha names in UI. */
export function milanGrahaLabel(id: GrahaId): string {
  return GRAHA_NAMES[id] ?? id
}
