// ─────────────────────────────────────────────────────────────
//  __tests__/engine/milanRelationshipHiLeak.test.ts
//  Hindi outputs from Milan / relationship analyzers must not
//  leak long English prose when lang=hi.
// ─────────────────────────────────────────────────────────────

import { describe, it, expect, beforeAll } from 'vitest'
import type { ChartOutput } from '@/types/astrology'
import { calculateChart } from '@/lib/engine/calculator'
import { analyzeMarriedLife } from '@/lib/engine/marriedLifeAnalysis'
import { analyzeIntimateLife } from '@/lib/engine/intimateLife'
import { analyzeMatchMaking } from '@/lib/engine/matchMaking'
import { analyzeMilanDeep } from '@/lib/engine/milanDeepAnalysis'
import { analyzeMilanMarriedLife } from '@/lib/engine/milanMarriedLife'
import { calculateAshtakoot } from '@/lib/engine/ashtakoot'
import { analyzeSeventhAxis, seventhAxisMatch } from '@/lib/engine/seventhAxis'
import { analyzeJayaBhava, compareJayaBhava } from '@/lib/engine/jayaBhava'
import { analyzeMarriageClass, compareMarriageClass } from '@/lib/engine/marriageClass'
import { analyzeMarriageHouses, compareMarriageHouses } from '@/lib/engine/marriageHouses'
import { analyzeSeventhLord, compareSeventhLord } from '@/lib/engine/seventhLord'
import { analyzeKarmicDebt, compareKarmicDebt } from '@/lib/engine/karmicDebt'
import { analyzeVenusJupiterBond, compareVenusJupiterBond } from '@/lib/engine/venusJupiterBond'
import { analyzeMarriageVivah, compareMarriageVivah } from '@/lib/engine/marriageVivah'
import { analyzeMarriageMars, compareMarriageMars } from '@/lib/engine/marriageMars'
import { analyzeMarriageGochar, compareMarriageGochar } from '@/lib/engine/marriageGochar'
import { analyzePartnerNature, comparePartnerNature } from '@/lib/engine/partnerNature'
import { analyzeDivorceEnergy, compareDivorceEnergy } from '@/lib/engine/divorceEnergy'
import { analyzeClassicalMarriage, compareClassicalMarriage } from '@/lib/engine/classicalMarriage'
import { analyzeMarriageKarma, compareMarriageKarma } from '@/lib/engine/marriageKarma'
import { analyzeVenusMarriage, compareVenusMarriage } from '@/lib/engine/venusMarriage'
import { analyzeMarriageCaseBrief, analyzePairCaseBrief } from '@/lib/engine/marriageCaseBrief'
import { analyzeJaiminiMarriage } from '@/lib/engine/jaiminiMarriageAnalysis'
import { analyzeMarriageSynastry } from '@/lib/engine/marriageSynastry'
import { calculatePorutham } from '@/lib/engine/porutham'
import {
  analyzeDualJaiminiMarriage,
  analyzeManglikPair,
  analyzeMarriageTiming,
  buildMilanRemedies,
  resolveMilanRoles,
} from '@/lib/engine/milanSuite'
import { buildMilanReportInput, generateMilanHTML } from '@/lib/pdf/milanHtml'

function collectStrings(x: unknown, out: string[] = []): string[] {
  if (typeof x === 'string') out.push(x)
  else if (Array.isArray(x)) x.forEach((v) => collectStrings(v, out))
  else if (x && typeof x === 'object') Object.values(x).forEach((v) => collectStrings(v, out))
  return out
}

/**
 * Allowlist for Latin tokens that legitimately appear in Hindi Milan output:
 * - Divisional / Jaimini codes: D1, D9, DK, UL, …
 * - Graha ids Su, Mo, Ma, Me, Ju, Ve, Sa, Ra, Ke
 * - Pure numbers, ISO dates, short roman abbreviations
 */
const GRAHA_CODE = /^(Su|Mo|Ma|Me|Ju|Ve|Sa|Ra|Ke)$/
const DIV_CODE = /^(D\d{1,2}|DK|UL|AK|AmK|PK|GK|BK)$/
const ISO_DATE = /^\d{4}-\d{2}-\d{2}/
const NUMERIC = /^[\d./\s:%+×\-—,]+$/

const ENGLISH_SENTENCE =
  /\b(The|This|Marriage|Venus|Jupiter|with the|in the)\b/i

const DEVANAGARI = /[\u0900-\u097F]/

function isAllowedLatin(s: string): boolean {
  const t = s.trim()
  if (t.length <= 40) return true
  if (DEVANAGARI.test(t)) return true
  if (ISO_DATE.test(t)) return true
  if (NUMERIC.test(t)) return true
  const tokens = t.split(/\s+/).filter(Boolean)
  if (tokens.every((w) => GRAHA_CODE.test(w) || DIV_CODE.test(w))) return true
  return false
}

function findEnglishLeaks(strings: string[]): string[] {
  const leaks: string[] = []
  for (const s of strings) {
    if (isAllowedLatin(s)) continue
    if (s.length > 40 && ENGLISH_SENTENCE.test(s)) leaks.push(s.slice(0, 160))
  }
  return [...new Set(leaks)]
}

function stripHtmlText(html: string): string[] {
  const text = html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&[a-z]+;/gi, ' ')
  return text.split(/\s+/).filter((w) => w.length > 0)
}

function moonAshtakoot(chart: ChartOutput) {
  const mo = chart.grahas.find((g) => g.id === 'Mo')
  if (!mo) return { nak: 1, sign: 1 as const, degree: 0, pada: 1 }
  const nak =
    mo.nakshatraIndex >= 0
      ? mo.nakshatraIndex + 1
      : Math.floor((((mo.totalDegree % 360) + 360) % 360) / (360 / 27)) + 1
  return {
    nak,
    sign: mo.rashi,
    degree: mo.totalDegree,
    pada: mo.pada ?? 1,
  }
}

let chartA: ChartOutput
let chartB: ChartOutput

beforeAll(async () => {
  chartA = await calculateChart({
    name: 'Aarav',
    birthDate: '1990-05-15',
    birthTime: '10:30',
    utcDate: '1990-05-15',
    utcTime: '05:00:00',
    birthPlace: 'New Delhi',
    latitude: 28.61,
    longitude: 77.21,
    timezone: 'Asia/Kolkata',
    gender: 'male',
  })
  chartB = await calculateChart({
    name: 'Meera',
    birthDate: '1992-08-20',
    birthTime: '14:15',
    utcDate: '1992-08-20',
    utcTime: '08:45:00',
    birthPlace: 'Mumbai',
    latitude: 19.08,
    longitude: 72.88,
    timezone: 'Asia/Kolkata',
    gender: 'female',
  })
})

function nameA() {
  return chartA.meta.name ?? 'A'
}

function nameB() {
  return chartB.meta.name ?? 'B'
}

/** All lang=hi engine blobs used by RelationshipMarriagePanel + Milan panels. */
function collectRelationshipHiBlobs(): unknown[] {
  const lang = 'hi' as const
  const moA = moonAshtakoot(chartA)
  const moB = moonAshtakoot(chartB)
  const roles = resolveMilanRoles(chartA, chartB, { personA: 'boy', personB: 'girl' })

  const gocharOpts = { skipScan: true, scanYears: 8 as const }

  const jayaA = analyzeJayaBhava(chartA, lang)
  const jayaB = analyzeJayaBhava(chartB, lang)
  const classA = analyzeMarriageClass(chartA, lang)
  const classB = analyzeMarriageClass(chartB, lang)
  const housesA = analyzeMarriageHouses(chartA, lang)
  const housesB = analyzeMarriageHouses(chartB, lang)
  const lordA = analyzeSeventhLord(chartA, lang)
  const lordB = analyzeSeventhLord(chartB, lang)
  const karmicA = analyzeKarmicDebt(chartA, lang)
  const karmicB = analyzeKarmicDebt(chartB, lang)
  const vjA = analyzeVenusJupiterBond(chartA, lang)
  const vjB = analyzeVenusJupiterBond(chartB, lang)
  const vivahA = analyzeMarriageVivah(chartA, lang)
  const vivahB = analyzeMarriageVivah(chartB, lang)
  const marsA = analyzeMarriageMars(chartA, {}, lang)
  const marsB = analyzeMarriageMars(chartB, {}, lang)
  const gocharA = analyzeMarriageGochar(chartA, gocharOpts, lang)
  const gocharB = analyzeMarriageGochar(chartB, gocharOpts, lang)
  const partnerA = analyzePartnerNature(chartA, lang)
  const partnerB = analyzePartnerNature(chartB, lang)
  const divorceA = analyzeDivorceEnergy(chartA, lang)
  const divorceB = analyzeDivorceEnergy(chartB, lang)
  const classicalA = analyzeClassicalMarriage(chartA, lang)
  const classicalB = analyzeClassicalMarriage(chartB, lang)
  const karmaA = analyzeMarriageKarma(chartA, lang)
  const karmaB = analyzeMarriageKarma(chartB, lang)
  const venusA = analyzeVenusMarriage(chartA, lang)
  const venusB = analyzeVenusMarriage(chartB, lang)

  const compares: unknown[] = []
  if (jayaA && jayaB) compares.push(compareJayaBhava(jayaA, jayaB, nameA(), nameB(), lang))
  if (classA && classB) compares.push(compareMarriageClass(classA, classB, nameA(), nameB(), lang))
  if (housesA && housesB) compares.push(compareMarriageHouses(housesA, housesB, nameA(), nameB(), lang))
  if (lordA && lordB) compares.push(compareSeventhLord(lordA, lordB, nameA(), nameB(), lang))
  if (karmicA && karmicB) compares.push(compareKarmicDebt(karmicA, karmicB, nameA(), nameB(), lang))
  if (vjA && vjB) compares.push(compareVenusJupiterBond(vjA, vjB, nameA(), nameB(), lang))
  if (vivahA && vivahB) compares.push(compareMarriageVivah(vivahA, vivahB, nameA(), nameB(), lang))
  if (marsA && marsB) compares.push(compareMarriageMars(marsA, marsB, nameA(), nameB(), lang))
  if (gocharA && gocharB) compares.push(compareMarriageGochar(gocharA, gocharB, nameA(), nameB(), lang))
  if (partnerA && partnerB) compares.push(comparePartnerNature(partnerA, partnerB, nameA(), nameB(), lang))
  if (divorceA && divorceB) compares.push(compareDivorceEnergy(divorceA, divorceB, nameA(), nameB(), lang))
  if (classicalA && classicalB) {
    compares.push(compareClassicalMarriage(classicalA, classicalB, nameA(), nameB(), lang))
  }
  if (karmaA && karmaB) compares.push(compareMarriageKarma(karmaA, karmaB, nameA(), nameB(), lang))
  if (venusA && venusB) compares.push(compareVenusMarriage(venusA, venusB, nameA(), nameB(), lang))

  return [
    analyzeMarriedLife(chartA, lang),
    analyzeMarriedLife(chartB, lang),
    analyzeIntimateLife(chartA, lang),
    analyzeIntimateLife(chartB, lang),
    analyzeSeventhAxis(chartA, lang),
    analyzeSeventhAxis(chartB, lang),
    jayaA,
    jayaB,
    classA,
    classB,
    housesA,
    housesB,
    lordA,
    lordB,
    karmicA,
    karmicB,
    vjA,
    vjB,
    vivahA,
    vivahB,
    marsA,
    marsB,
    gocharA,
    gocharB,
    partnerA,
    partnerB,
    divorceA,
    divorceB,
    classicalA,
    classicalB,
    karmaA,
    karmaB,
    venusA,
    venusB,
    analyzeMarriageCaseBrief(chartA, { skipGocharScan: true, lang }),
    analyzeMarriageCaseBrief(chartB, { skipGocharScan: true, lang }),
    analyzePairCaseBrief(chartA, chartB, { skipGocharScan: true, lang }),
    analyzeJaiminiMarriage(chartA, lang),
    analyzeJaiminiMarriage(chartB, lang),
    analyzeDualJaiminiMarriage(roles.boyChart, roles.girlChart, lang),
    analyzeMatchMaking(chartA, chartB, lang),
    analyzeMilanDeep(chartA, chartB, lang),
    analyzeMilanMarriedLife(chartA, chartB, { lang }),
    analyzeMarriageSynastry(chartA, chartB, lang),
    seventhAxisMatch(chartA, chartB, lang),
    calculateAshtakoot(moA.nak, moA.sign, moB.nak, moB.sign, {
      boyMoonDegree: moA.degree,
      girlMoonDegree: moB.degree,
      boyPada: moA.pada,
      girlPada: moB.pada,
    }, lang),
    calculatePorutham(moA.nak, moA.sign, moB.nak, moB.sign, lang),
    analyzeManglikPair(roles.boyChart, roles.girlChart, lang),
    analyzeMarriageTiming(roles.boyChart, roles.girlChart, new Date('2025-06-01'), lang),
    buildMilanRemedies({
      nadiDosha: true,
      bhakootDosha: true,
      manglikMismatch: true,
      ganaHarsh: true,
      poruthamCriticalFails: ['rajju', 'vedha'],
    }, lang),
    ...compares,
  ]
}

// These smoke tests run the full Milan / relationship analyzer surface twice
// (plus HTML generation). Default Vitest 5s is fine locally (~4–5s) but CI
// runners often land around 10s — give them headroom.
const HI_LEAK_TIMEOUT_MS = 30_000

describe('Milan / relationship Hindi leak smoke', () => {
  it('major analyzers (lang=hi) avoid English sentence leaks', () => {
    const strings = collectStrings(collectRelationshipHiBlobs())
    const leaks = findEnglishLeaks(strings)
    expect(leaks, `English leaks (${leaks.length}):\n${leaks.join('\n---\n')}`).toEqual([])
  }, HI_LEAK_TIMEOUT_MS)

  it('generateMilanHTML (lang=hi) avoids English sentence leaks in visible text', () => {
    const moA = moonAshtakoot(chartA)
    const moB = moonAshtakoot(chartB)
    const ashtakoot = calculateAshtakoot(moA.nak, moA.sign, moB.nak, moB.sign, {
      boyMoonDegree: moA.degree,
      girlMoonDegree: moB.degree,
      boyPada: moA.pada,
      girlPada: moB.pada,
    }, 'hi')
    const input = buildMilanReportInput(chartA, chartB, ashtakoot, 'boy', 'girl', 'hi')
    const html = generateMilanHTML(input)
    const words = stripHtmlText(html)
    const longTokens = words.filter((w) => w.length > 40)
    const leaks = findEnglishLeaks(longTokens)
    expect(leaks, `HTML text leaks (${leaks.length}):\n${leaks.join('\n---\n')}`).toEqual([])
  }, HI_LEAK_TIMEOUT_MS)
})
