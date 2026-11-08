// src/lib/pdf/milanHtml.ts
// Full Kundali Milan compare print — all "All Sections" content, kundali-print style.

import type { ChartOutput, GrahaId, Rashi } from '@/types/astrology'
import type { EngineLang } from '@/lib/engine/lang'
import { fill } from '@/lib/engine/lang'
import { GRAHA_NAMES, RASHI_NAMES, RASHI_SHORT, NAKSHATRA_NAMES } from '@/types/astrology'
import { GRAHA_HI, NAKSHATRA_HI, RASHI_HI, termHi } from '@/i18n/jyotish'
import { getCompatibility, kootaLabels } from '@/lib/engine/compareCompat'
import type { KootaKey } from '@/lib/engine/ashtakoot'
import { getManglikTeaching } from '@/lib/engine/manglikTeaching'
import { MILAN_HTML_HI } from '@/lib/engine/locale/milanHtml.hi'
import type { AshtakootResult } from '@/lib/engine/ashtakoot'
import { calculatePorutham, type PoruthamResult } from '@/lib/engine/porutham'
import { analyzeMilanDeep, type MilanDeepResult } from '@/lib/engine/milanDeepAnalysis'
import {
  analyzeManglikPair,
  analyzeMarriageTiming,
  analyzeDualJaiminiMarriage,
  buildMilanRemedies,
  resolveMilanRoles,
  type MilanRole,
  type ManglikPairVerdict,
  type MarriageTimingResult,
  type MilanRemedy,
  type DualJaiminiMilan,
} from '@/lib/engine/milanSuite'
import { calculateManglik, calculatePapeSamya } from '@/lib/engine/doshas'
import { buildChartSVG } from '@/lib/pdf/chartHtml'
import { analyzeMatchMaking } from '@/lib/engine/matchMaking'
import { analyzeClassicalMarriage } from '@/lib/engine/classicalMarriage'
import { analyzeDivorceEnergy } from '@/lib/engine/divorceEnergy'
import { analyzeMilanMarriedLife } from '@/lib/engine/milanMarriedLife'
import { analyzeMarriageSynastry } from '@/lib/engine/marriageSynastry'
import { analyzePairCaseBrief } from '@/lib/engine/marriageCaseBrief'
import { analyzeVenusJupiterBond, compareVenusJupiterBond } from '@/lib/engine/venusJupiterBond'
import { analyzeMarriageVivah, compareMarriageVivah } from '@/lib/engine/marriageVivah'
import { analyzeMarriageMars, compareMarriageMars } from '@/lib/engine/marriageMars'
import { analyzePartnerNature, comparePartnerNature } from '@/lib/engine/partnerNature'
import { analyzeKarmicDebt, compareKarmicDebt } from '@/lib/engine/karmicDebt'

const THEME = {
  primary: '#9b1b30',
  secondary: '#6b3a0a',
  accent: '#c77d1a',
  accentLight: '#fdf0d5',
  border: '#c4a97d',
  text: '#1a1208',
  muted: '#6d5d4b',
  bg: '#faf5e4',
  surface: '#f2ead2',
  rose: '#8b1a1a',
  temple: '#d4a24e',
  emerald: '#1a6334',
}

const GRAHA_ORDER = ['Su', 'Mo', 'Ma', 'Me', 'Ju', 'Ve', 'Sa', 'Ra', 'Ke'] as const

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

function signOf(deg: number): number {
  return Math.floor((((deg % 360) + 360) % 360) / 30) + 1
}

function signDiff(a: number, b: number): number {
  return ((b - a + 12) % 12) + 1
}

const MILAN_HTML_EN = {
  htmlLang: 'en',
  docTitle: 'Kundali Milan',
  footerBrand: 'Kundali Milan',
  footerConfidential: 'गोपनीय',
  pageLabel: 'पृ.',
  printBarSuffix: 'कुण्डली मिलान (All Sections)',
  exportButton: '⬇ Export Full Milan Report',
  completeDossier: 'Complete Kundali Milan Dossier',
  subTitle: 'All Sections · Ashtakoot to Panchang',
  computedOn: 'Computed on {date} · Swiss Ephemeris',
  gunasDenom: '/ 36 GUNAS',

  badge01: '01 · Ashtakoot (36)',
  titleAshtakoot: 'Detailed Guna Milan',
  thKoota: 'Koota',
  thGroom: 'Groom',
  thBride: 'Bride',
  thScore: 'Score',
  thInsight: 'Insight',

  badge02: '02 · Deep Milan · Porutham · Manglik',
  titleDeepSchools: 'Deep Milan & Schools',
  manglikPairLabel: 'Manglik pair:',
  d9JaiminiLabel: 'D9 / Jaimini:',
  poruthamHeading: 'South Indian Porutham',
  thPorutham: 'Porutham',
  thMatch: 'Match',
  thDetail: 'Detail',
  matchYes: 'Yes',
  matchNo: 'No',

  badge03: '03 · Dosha Analysis',
  titleDosha: 'Manglik & Pape-Samya',
  kujaDosha: 'Kuja Dosha',
  nonManglik: 'Non-Manglik',
  marsInHouse: 'Mars in {nth}th house.',
  cancellationsPrefix: 'Cancellations:',
  noMarsInfluence: 'No difficult influence from Mars.',
  papeSamyaTitle: 'Pape-Samya (Malefic Balance)',
  thPerson: 'Person',
  thMaleficWeight: 'Malefic Weight',
  papeBalanced:
    'Stable balance — pressures from difficult planets are well compensated between both charts.',
  papeImbalancePrefix: 'Imbalance detected',
  papeImbalanceSuffix: 'pts) — may need conscious adjustment.',

  badge04: '04 · Aura Affinity',
  titleAura: 'Aura & Psychological Affinity',
  noAffinity: 'No strong affinity signals computed.',

  badge05: '05 · Side-by-Side Charts',
  titleD1: 'Rashi (D1) Kundali',
  lagnaMoon: 'Lagna {rashi} · Moon {nak}',

  badge06: '06 · Navamsha · Overlay',
  titleD9Synastry: 'D9 Charts & Synastry Note',
  overlayView: 'Overlay view',
  overlayNote:
    'Synastry places {nameB}\'s planets into {nameA}\'s houses. Compare house lords and Venus–Mars chemistry alongside the planetary positions table on the next page.',

  badge07: '07 · Planetary Positions',
  titleGrahaTable: 'Side-by-Side Graha Table',
  thPlanet: 'Planet',
  thRelation: 'Relation',
  relationAxis: '{fwd} / {rev} axis',

  badge08: '08 · Ashtakavarga',
  titleBindu: 'Bindu Matrices',
  avMissing: 'Ashtakavarga data missing.',
  thSign: 'Sign',

  badge09: '09 · Dasha',
  titleDasha: 'Vimshottari Periods',
  dashaMissing: 'Dasha data missing.',
  vimshottari: 'Vimshottari',
  currentDasha: 'Current:',
  thMahadasha: 'Mahadasha',
  thStart: 'Start',
  thEnd: 'End',

  badge10: '10 · Panchang',
  titleNatalPanchang: 'Natal Panchang',
  panchangMissing: 'Panchang data missing.',
  natalPanchang: 'Natal Panchang',
  lblVara: 'Vara',
  lblTithi: 'Tithi',
  lblNakshatra: 'Nakshatra',
  lblYoga: 'Yoga',
  lblKarana: 'Karana',
  lblSunrise: 'Sunrise',
  lblSunset: 'Sunset',

  badge11: '11 · Match-Making',
  titleMatchMaking: 'Match-Making Summary',
  stepsLabel: 'Steps',
  deepMilanLabel: 'Deep Milan:',
  matchMakingUnavailable: 'Match-making summary unavailable.',

  badge12: '12 · Married Life',
  titleMarriedLife: 'Married Life · Classical Notes',
  moonPair: 'Moon pair',
  moonPairUnavailable: 'Moon pair unavailable.',
  dimensionScores: 'Dimension scores',
  classicalUnavailable: 'Classical unavailable',
  separationEnergy: 'Separation energy:',
  crossChartOverlay: 'Cross-chart overlay',
  jaiminiBoth: 'Jaimini (both)',
  venusJupiterPair: 'Venus–Jupiter pair',
  marriageMethod: 'Marriage method',
  marsTwoCharts: 'Mars in the two charts',
  partnerNaturePair: 'Partner nature pair',
  karmicDebtPair: 'Karmic debt pair',

  badge13: '13 · Timing & Remedies',
  titleTimingRemedies: 'Marriage Windows & Upaya',
  thWindow: 'Window',
  thTimingGroom: 'Groom',
  thTimingBride: 'Bride',
  thNote: 'Note',
  remediesHeading: 'Remedies',
  closingDisclaimer:
    'Educational Jyotish summary. Confirm with a qualified astrologer before marriage decisions.',

  intensityHigh: 'High',
  intensityLow: 'Low',
  intensityNone: 'None',
} as const

type MilanHtmlChrome = typeof MILAN_HTML_EN | typeof MILAN_HTML_HI

function milanChrome(lang: EngineLang): MilanHtmlChrome {
  return (lang === 'hi' ? MILAN_HTML_HI : MILAN_HTML_EN) as MilanHtmlChrome
}

function dateLocale(lang: EngineLang): string {
  return lang === 'hi' ? 'hi-IN' : 'en-IN'
}

function rn(s: number, lang: EngineLang): string {
  if (lang === 'hi') return RASHI_HI[s as Rashi] ?? '—'
  return RASHI_NAMES[s as keyof typeof RASHI_NAMES] ?? '—'
}

function gn(id: GrahaId, lang: EngineLang): string {
  if (lang === 'hi') return GRAHA_HI[id] ?? id
  return GRAHA_NAMES[id] ?? id
}

function fmtDate(value: string | Date | null | undefined, lang: EngineLang): string {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return String(value)
  return d.toLocaleDateString(dateLocale(lang), { day: '2-digit', month: 'short', year: 'numeric' })
}

function fmtDateTime(value: string | Date | null | undefined, lang: EngineLang): string {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleString(dateLocale(lang), {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  })
}

function moonNakName(chart: ChartOutput, lang: EngineLang): string {
  const mo = chart.grahas.find(g => g.id === 'Mo')
  if (!mo) return '—'
  const idx = mo.nakshatraIndex >= 0 ? mo.nakshatraIndex : Math.floor(mo.totalDegree / (360 / 27))
  if (lang === 'hi') return NAKSHATRA_HI[idx] ?? termHi(mo.nakshatraName ?? '') ?? '—'
  return NAKSHATRA_NAMES[idx] ?? mo.nakshatraName ?? '—'
}

function manglikIntensityLabel(intensity: 'None' | 'Low' | 'High', c: MilanHtmlChrome): string {
  if (intensity === 'High') return c.intensityHigh
  if (intensity === 'Low') return c.intensityLow
  return c.intensityNone
}

export interface MilanReportInput {
  chartA: ChartOutput
  chartB: ChartOutput
  boyName: string
  girlName: string
  boyBirth?: string
  girlBirth?: string
  ashtakoot: AshtakootResult
  porutham?: PoruthamResult | null
  deep?: MilanDeepResult | null
  manglik?: ManglikPairVerdict | null
  timing?: MarriageTimingResult | null
  remedies?: MilanRemedy[]
  jaimini?: DualJaiminiMilan | null
  branding?: string
  lang?: EngineLang
}

/** Assemble a full printable Milan report from two charts + Ashtakoot. */
export function buildMilanReportInput(
  chartA: ChartOutput,
  chartB: ChartOutput,
  ashtakoot: AshtakootResult,
  roleA: MilanRole = 'boy',
  roleB: MilanRole = 'girl',
  lang: EngineLang = 'en',
): MilanReportInput {
  const roles = resolveMilanRoles(chartA, chartB, { personA: roleA, personB: roleB })
  const boyMo = roles.boyChart.grahas.find(g => g.id === 'Mo')
  const girlMo = roles.girlChart.grahas.find(g => g.id === 'Mo')
  const boyNak = boyMo
    ? (boyMo.nakshatraIndex >= 0 ? boyMo.nakshatraIndex : Math.floor(boyMo.totalDegree / (360 / 27))) + 1
    : 1
  const girlNak = girlMo
    ? (girlMo.nakshatraIndex >= 0 ? girlMo.nakshatraIndex : Math.floor(girlMo.totalDegree / (360 / 27))) + 1
    : 1
  const boySign = boyMo?.rashi ?? 1
  const girlSign = girlMo?.rashi ?? 1

  const porutham = calculatePorutham(boyNak, boySign, girlNak, girlSign, lang)
  const manglik = analyzeManglikPair(roles.boyChart, roles.girlChart, lang)
  const timing = analyzeMarriageTiming(roles.boyChart, roles.girlChart, new Date(), lang)
  const jaimini = analyzeDualJaiminiMarriage(roles.boyChart, roles.girlChart, lang)
  const deep = analyzeMilanDeep(roles.boyChart, roles.girlChart, lang)
  const remedies = buildMilanRemedies({
    nadiDosha: !!ashtakoot.nadi.dosha,
    bhakootDosha: ashtakoot.bhakoot.points === 0,
    manglikMismatch: manglik.verdict === 'mismatch',
    ganaHarsh: ashtakoot.gana.points <= 1,
    poruthamCriticalFails: porutham.items
      .filter(i => i.weight === 'critical' && !i.matched)
      .map(i => i.name),
  }, lang)

  return {
    chartA,
    chartB,
    boyName: roles.boyLabel,
    girlName: roles.girlLabel,
    boyBirth: roles.boyChart.meta.birthDate,
    girlBirth: roles.girlChart.meta.birthDate,
    ashtakoot,
    porutham,
    deep,
    manglik,
    timing,
    remedies,
    jaimini,
    lang,
  }
}

/** Open Milan report in a new tab (same pattern as chart PDF export). */
export function openMilanPrintPreview(input: MilanReportInput): boolean {
  const html = generateMilanHTML(input)
  const blob = new Blob([html], { type: 'text/html; charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const tab = window.open(url, '_blank')
  if (tab) {
    tab.addEventListener('load', () => {
      setTimeout(() => URL.revokeObjectURL(url), 5000)
    })
    return true
  }
  const a = document.createElement('a')
  a.href = url
  a.download = `milan-${input.boyName}-${input.girlName}`.replace(/[^a-z0-9-_]+/gi, '_') + '.html'
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 5000)
  return false
}

function pageFooter(pageNo: number, brand: string, c: MilanHtmlChrome): string {
  return `<div class="footer-line">
    <div style="display:flex;align-items:center;gap:8px">
      <span style="opacity:0.4;color:${THEME.temple};font-family:'Noto Serif Devanagari',serif">ॐ</span>
      <span>${esc(brand)} · ${esc(c.footerBrand)} · ${esc(c.footerConfidential)}</span>
    </div>
    <div style="color:${THEME.temple}">${esc(c.pageLabel)} ${pageNo}</div>
  </div>`
}

function sectionBadge(text: string): string {
  return `<div class="section-badge">${esc(text)}</div>`
}

function buildAVCompact(chart: ChartOutput, lang: EngineLang, c: MilanHtmlChrome): string {
  if (!chart.ashtakavarga) return `<p style="color:#6d5d4b">${esc(c.avMissing)}</p>`
  const planets = ['Su', 'Mo', 'Ma', 'Me', 'Ju', 'Ve', 'Sa'] as const
  const av = chart.ashtakavarga
  const header = `<tr><th>${esc(c.thSign)}</th>${planets.map(p => `<th>${lang === 'hi' ? GRAHA_SHORT_HI(p) : p}</th>`).join('')}<th>SAV</th></tr>`
  let rows = ''
  for (let r = 1; r <= 12; r++) {
    let cells = ''
    planets.forEach(p => {
      cells += `<td>${av.bav[p]?.bindus[r - 1] ?? 0}</td>`
    })
    const signLabel = lang === 'hi' ? RASHI_HI[r as Rashi] : RASHI_SHORT[r as Rashi]
    rows += `<tr><td style="font-weight:700">${esc(signLabel)}</td>${cells}<td style="background:${THEME.accentLight};font-weight:800">${av.sav[r - 1] || 0}</td></tr>`
  }
  return `
    <div style="font-weight:800;margin-bottom:0.4rem;color:${THEME.primary}">${esc(chart.meta.name)} — SAV ${av.savTotal}</div>
    <table><thead>${header}</thead><tbody>${rows}</tbody></table>
  `
}

function GRAHA_SHORT_HI(id: GrahaId): string {
  return ({ Su: 'सू', Mo: 'चं', Ma: 'मं', Me: 'बु', Ju: 'गु', Ve: 'शु', Sa: 'श' } as Record<string, string>)[id] ?? id
}

function buildDashaCompact(chart: ChartOutput, lang: EngineLang, c: MilanHtmlChrome): string {
  const nodes = chart.dashas.vimshottari ?? []
  if (!nodes.length) return `<p style="color:#6d5d4b">${esc(c.dashaMissing)}</p>`
  const now = new Date()
  const current = nodes.find(m => now >= new Date(m.start) && now <= new Date(m.end))
  const antar = current?.children?.find(m => now >= new Date(m.start) && now <= new Date(m.end))
  const rows = nodes
    .slice(0, 9)
    .map(m => {
      const active = current?.lord === m.lord
      return `<tr style="${active ? `background:${THEME.accentLight}` : ''}">
        <td><strong>${esc(gn(m.lord as GrahaId, lang))}</strong>${active ? ' ●' : ''}</td>
        <td>${fmtDate(m.start, lang)}</td>
        <td>${fmtDate(m.end, lang)}</td>
      </tr>`
    })
    .join('')
  return `
    <div style="font-weight:800;margin-bottom:0.45rem;color:${THEME.primary}">${esc(chart.meta.name)} — ${esc(c.vimshottari)}</div>
    ${
      current
        ? `<p style="font-size:11px;color:${THEME.muted};margin:0 0 0.55rem">
             ${esc(c.currentDasha)} <strong>${esc(gn(current.lord as GrahaId, lang))}</strong>
             ${antar ? ` / ${esc(gn(antar.lord as GrahaId, lang))}` : ''}
           </p>`
        : ''
    }
    <table>
      <thead><tr><th>${esc(c.thMahadasha)}</th><th>${esc(c.thStart)}</th><th>${esc(c.thEnd)}</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
  `
}

function buildPanchangCompact(chart: ChartOutput, lang: EngineLang, c: MilanHtmlChrome): string {
  const p = chart.panchang
  if (!p) return `<p style="color:#6d5d4b">${esc(c.panchangMissing)}</p>`
  const loc = (name?: string) => (lang === 'hi' && name ? termHi(name) : name ?? '—')
  const rows = [
    [c.lblVara, loc(p.vara?.name)],
    [c.lblTithi, p.tithi ? `${loc(p.tithi.name)} (${loc(p.tithi.paksha)})` : '—'],
    [c.lblNakshatra, loc(p.nakshatra?.name)],
    [c.lblYoga, loc(p.yoga?.name)],
    [c.lblKarana, loc(p.karana?.name)],
    [c.lblSunrise, fmtDateTime(p.sunrise, lang)],
    [c.lblSunset, fmtDateTime(p.sunset, lang)],
  ]
    .map(([k, v]) => `<tr><td style="font-weight:700;width:28%">${esc(String(k))}</td><td>${esc(String(v ?? '—'))}</td></tr>`)
    .join('')
  return `
    <div style="font-weight:800;margin-bottom:0.45rem;color:${THEME.primary}">${esc(chart.meta.name)} — ${esc(c.natalPanchang)}</div>
    <table><tbody>${rows}</tbody></table>
  `
}

export function generateMilanHTML(input: MilanReportInput): string {
  const reportLang = input.lang ?? 'en'
  const c = milanChrome(reportLang)
  const brand = (input.branding || 'VEDAANSH').toUpperCase()
  const a = input.ashtakoot
  const { chartA, chartB } = input
  const generated = new Date().toLocaleDateString(dateLocale(reportLang), { dateStyle: 'long' })
  const pct = Math.round((a.total / 36) * 100)
  const eligOk = a.eligibility.traditionallyAccepted
  const compat = getCompatibility(chartA, chartB, reportLang)

  const m1 = calculateManglik(chartA.grahas, [], chartA.lagnas.ascRashi)
  const m2 = calculateManglik(chartB.grahas, [], chartB.lagnas.ascRashi)
  const teachA = getManglikTeaching(m1, chartA.grahas, chartA.lagnas.ascRashi, reportLang)
  const teachB = getManglikTeaching(m2, chartB.grahas, chartB.lagnas.ascRashi, reportLang)
  const p1 = calculatePapeSamya(chartA.grahas, chartA.lagnas.ascRashi)
  const p2 = calculatePapeSamya(chartB.grahas, chartB.lagnas.ascRashi)
  const papeDiff = Math.abs(p1.totalWeight - p2.totalWeight)
  const papeBalanced = papeDiff <= 1.25

  const kootLabels = kootaLabels(reportLang)
  const kootas: [KootaKey, typeof a.varna][] = [
    ['varna', a.varna],
    ['vashya', a.vashya],
    ['tara', a.tara],
    ['yoni', a.yoni],
    ['maitri', a.maitri],
    ['gana', a.gana],
    ['bhakoot', a.bhakoot],
    ['nadi', a.nadi],
  ]

  const kootRows = kootas
    .map(([k, s]) => {
      const weak = s.points === 0 || (k === 'nadi' && s.dosha)
      return `<tr style="${weak ? `background:${THEME.accentLight}` : ''}">
        <td><strong>${esc(kootLabels[k])}</strong><div style="font-size:9px;color:${THEME.muted};margin-top:2px">${esc(s.meaning)}</div></td>
        <td>${esc(s.p1)}</td>
        <td>${esc(s.p2)}</td>
        <td style="white-space:nowrap;font-weight:800;color:${weak ? THEME.rose : THEME.secondary}">
          ${s.points}<span style="color:${THEME.muted};font-weight:500">/${s.max}</span>
        </td>
        <td>${esc(s.insight)}</td>
      </tr>`
    })
    .join('')

  const poruthamRows = input.porutham
    ? input.porutham.items
        .map(
          i => `<tr style="${i.matched ? '' : `background:${THEME.accentLight}`}">
            <td><strong>${esc(i.name)}</strong></td>
            <td style="color:${i.matched ? THEME.emerald : THEME.rose};font-weight:800">${i.matched ? esc(c.matchYes) : esc(c.matchNo)}</td>
            <td>${esc(i.detail)}</td>
          </tr>`,
        )
        .join('')
    : ''

  const timingRows = input.timing
    ? input.timing.windows
        .slice(0, 8)
        .map(
          w => `<tr>
            <td>${esc(w.start)} → ${esc(w.end)}</td>
            <td>${esc(w.boyLords)}</td>
            <td>${esc(w.girlLords)}</td>
            <td>${esc(w.note)}</td>
          </tr>`,
        )
        .join('')
    : ''

  const remedyItems = input.remedies?.length
    ? input.remedies
        .map(
          r => `<li style="margin-bottom:0.5rem">
            <strong style="color:${THEME.primary}">${esc(r.title)}</strong>
            <span style="color:${THEME.muted}"> (${esc(r.forDosha)})</span>
            — ${esc(r.detail)}
          </li>`,
        )
        .join('')
    : ''

  const match = analyzeMatchMaking(chartA, chartB, reportLang)
  const matchMakingBlock = match
    ? `<div class="card" style="margin-bottom:0.75rem">
         <div style="font-weight:800;color:${THEME.secondary};margin-bottom:0.35rem">${esc(match.headline)}</div>
         <p style="font-size:11px;color:${THEME.muted};margin:0 0 0.65rem;line-height:1.5">${esc(match.summary)}</p>
         ${match.pillars.slice(0, 8).map(p => `
           <div style="margin-bottom:0.45rem;padding-left:0.55rem;border-left:3px solid ${p.tone === 'supportive' ? THEME.emerald : p.tone === 'caution' ? THEME.rose : THEME.temple}">
             <strong style="font-size:11px">${esc(p.title)}</strong>
             <span style="font-size:10px;color:${THEME.muted}"> · ${esc(p.mark)}</span>
             <div style="font-size:10px;color:${THEME.muted};margin-top:2px">${esc(p.detail)}</div>
           </div>`).join('')}
         ${match.steps.length ? `
           <div style="margin-top:0.75rem;padding-top:0.55rem;border-top:1px solid ${THEME.border}">
             <div style="font-size:10px;letter-spacing:0.08em;text-transform:uppercase;color:${THEME.muted};margin-bottom:0.4rem">${esc(c.stepsLabel)}</div>
             ${match.steps.slice(0, 8).map((s, i) => `
               <div style="font-size:10px;color:${THEME.muted};margin-bottom:0.35rem;line-height:1.4">
                 <strong style="color:${THEME.text}">${i + 1}. ${esc(s.title)}</strong> — ${esc(s.detail)}
               </div>`).join('')}
           </div>` : ''}
         ${input.deep?.overall ? `<p style="font-size:10px;color:${THEME.muted};margin:0.65rem 0 0"><strong>${esc(c.deepMilanLabel)}</strong> ${esc(input.deep.overall.stageLabel)} — ${esc(input.deep.overall.summary)}</p>` : ''}
       </div>`
    : input.deep?.overall
      ? `<div class="card"><strong>${esc(c.deepMilanLabel.replace(/:$/, ''))}</strong><p style="font-size:11px;color:${THEME.muted};margin:0.35rem 0 0">${esc(input.deep.overall.stageLabel)} — ${esc(input.deep.overall.summary)}</p></div>`
      : `<p style="color:#6d5d4b;font-size:11px">${esc(c.matchMakingUnavailable)}</p>`

  const married = analyzeMilanMarriedLife(chartA, chartB, { lang: reportLang })
  const classicalA = analyzeClassicalMarriage(chartA, reportLang)
  const classicalB = analyzeClassicalMarriage(chartB, reportLang)
  const splitA = analyzeDivorceEnergy(chartA, reportLang)
  const splitB = analyzeDivorceEnergy(chartB, reportLang)
  const syn = analyzeMarriageSynastry(chartA, chartB, reportLang)
  const caseBrief = analyzePairCaseBrief(chartA, chartB, { skipGocharScan: true, lang: reportLang })
  const veJuA = analyzeVenusJupiterBond(chartA, reportLang)
  const veJuB = analyzeVenusJupiterBond(chartB, reportLang)
  const veJuPair = veJuA && veJuB ? compareVenusJupiterBond(veJuA, veJuB, chartA.meta.name, chartB.meta.name, reportLang) : []
  const vivahA = analyzeMarriageVivah(chartA, reportLang)
  const vivahB = analyzeMarriageVivah(chartB, reportLang)
  const vivahPair = vivahA && vivahB ? compareMarriageVivah(vivahA, vivahB, chartA.meta.name, chartB.meta.name, reportLang) : []
  const marsA = analyzeMarriageMars(chartA, {}, reportLang)
  const marsB = analyzeMarriageMars(chartB, {}, reportLang)
  const marsPair = marsA && marsB ? compareMarriageMars(marsA, marsB, chartA.meta.name, chartB.meta.name, reportLang) : []
  const partnerA = analyzePartnerNature(chartA, reportLang)
  const partnerB = analyzePartnerNature(chartB, reportLang)
  const partnerPair = partnerA && partnerB ? comparePartnerNature(partnerA, partnerB, chartA.meta.name, chartB.meta.name, reportLang) : []
  const debtA = analyzeKarmicDebt(chartA, reportLang)
  const debtB = analyzeKarmicDebt(chartB, reportLang)
  const debtPair = debtA && debtB ? compareKarmicDebt(debtA, debtB, chartA.meta.name, chartB.meta.name, reportLang) : []
  const noteList = (notes: { title: string; detail: string }[], limit = 4) =>
    notes.slice(0, limit).map(n => `
      <div style="margin-bottom:0.35rem;padding-left:0.45rem;border-left:2px solid ${THEME.border}">
        <strong style="font-size:10px">${esc(n.title)}</strong>
        <div style="font-size:10px;color:${THEME.muted};line-height:1.4">${esc(n.detail)}</div>
      </div>`).join('')
  const marriedLifeBlock = `
    ${caseBrief ? `<div class="card" style="margin-bottom:0.75rem;border-left:4px solid ${THEME.temple}">
      <div style="font-weight:800;color:${THEME.secondary};margin-bottom:0.35rem">${esc(caseBrief.headline)}</div>
      <div style="margin-top:0.4rem">${noteList(caseBrief.bullets, 5)}</div>
    </div>` : ''}
    <div class="card" style="margin-bottom:0.75rem">
      <div style="font-weight:800;color:${THEME.secondary};margin-bottom:0.35rem">${esc(c.moonPair)}</div>
      <p style="font-size:11px;color:${THEME.muted};margin:0;line-height:1.5">
        ${married ? `${esc(married.moon.signA)} × ${esc(married.moon.signB)} — ${esc(married.moon.detail)}` : esc(c.moonPairUnavailable)}
      </p>
    </div>
    ${married ? `<div class="card" style="margin-bottom:0.75rem">
      <div style="font-size:10px;letter-spacing:0.08em;text-transform:uppercase;color:${THEME.muted};margin-bottom:0.4rem">${esc(c.dimensionScores)}</div>
      ${married.dimensions.map(d => `
        <div style="font-size:10px;margin-bottom:0.3rem;color:${THEME.muted}">
          <strong style="color:${THEME.text}">${esc(d.label)}</strong>
          — ${esc(married.nameA)} ${d.scoreA} · ${esc(married.nameB)} ${d.scoreB}
          ${d.note ? ` · ${esc(d.note)}` : ''}
        </div>`).join('')}
    </div>` : ''}
    <div class="two-col" style="align-items:start;margin-bottom:0.75rem">
      <div class="card">
        <div style="font-size:10px;letter-spacing:0.08em;text-transform:uppercase;color:${THEME.muted}">${esc(chartA.meta.name)}</div>
        <p style="font-size:11px;margin:0.35rem 0;font-weight:700">${classicalA ? esc(classicalA.headline) : esc(c.classicalUnavailable)}</p>
        <p style="font-size:10px;color:${THEME.muted};margin:0;line-height:1.45">${classicalA ? esc(classicalA.summary) : ''}</p>
        <p style="font-size:10px;margin:0.45rem 0 0;color:${splitA?.flags.level === 'held' ? THEME.emerald : THEME.rose}">
          ${esc(c.separationEnergy)} ${esc(splitA?.flags.level ?? '—')}
        </p>
      </div>
      <div class="card">
        <div style="font-size:10px;letter-spacing:0.08em;text-transform:uppercase;color:${THEME.muted}">${esc(chartB.meta.name)}</div>
        <p style="font-size:11px;margin:0.35rem 0;font-weight:700">${classicalB ? esc(classicalB.headline) : esc(c.classicalUnavailable)}</p>
        <p style="font-size:10px;color:${THEME.muted};margin:0;line-height:1.45">${classicalB ? esc(classicalB.summary) : ''}</p>
        <p style="font-size:10px;margin:0.45rem 0 0;color:${splitB?.flags.level === 'held' ? THEME.emerald : THEME.rose}">
          ${esc(c.separationEnergy)} ${esc(splitB?.flags.level ?? '—')}
        </p>
      </div>
    </div>
    ${syn ? `<div class="card" style="margin-bottom:0.75rem"><strong style="color:${THEME.primary}">${esc(c.crossChartOverlay)}</strong>
      <p style="font-size:11px;color:${THEME.muted};margin:0.35rem 0 0;line-height:1.45">${esc(syn.summary)} D9×D9: ${esc(String(syn.flags.d9Score))}.</p></div>` : ''}
    ${input.jaimini ? `<div class="card" style="margin-bottom:0.75rem">
      <strong style="color:${THEME.primary}">${esc(c.jaiminiBoth)}</strong>
      <p style="font-size:11px;color:${THEME.muted};margin:0.35rem 0 0;line-height:1.45">${esc(input.jaimini.summary)}</p>
    </div>` : ''}
    ${veJuPair.length ? `<div class="card" style="margin-bottom:0.75rem">
      <strong style="color:${THEME.primary}">${esc(c.venusJupiterPair)}</strong>
      <div style="margin-top:0.4rem">${noteList(veJuPair)}</div>
    </div>` : ''}
    ${vivahPair.length ? `<div class="card" style="margin-bottom:0.75rem">
      <strong style="color:${THEME.primary}">${esc(c.marriageMethod)}</strong>
      <div style="margin-top:0.4rem">${noteList(vivahPair)}</div>
    </div>` : ''}
    ${marsPair.length ? `<div class="card" style="margin-bottom:0.75rem">
      <strong style="color:${THEME.primary}">${esc(c.marsTwoCharts)}</strong>
      <div style="margin-top:0.4rem">${noteList(marsPair)}</div>
    </div>` : ''}
    ${partnerPair.length ? `<div class="card" style="margin-bottom:0.75rem">
      <strong style="color:${THEME.primary}">${esc(c.partnerNaturePair)}</strong>
      <div style="margin-top:0.4rem">${noteList(partnerPair)}</div>
    </div>` : ''}
    ${debtPair.length ? `<div class="card" style="margin-bottom:0.75rem">
      <strong style="color:${THEME.primary}">${esc(c.karmicDebtPair)}</strong>
      <div style="margin-top:0.4rem">${noteList(debtPair)}</div>
    </div>` : ''}
  `

  const compatCards = compat
    .map(item => {
      const tone = item.level === 'good' ? THEME.emerald : item.level === 'bad' ? THEME.rose : THEME.muted
      return `<div class="card" style="border-left:4px solid ${tone}">
        <div style="font-weight:800;font-size:12px">${esc(item.label)}</div>
        <div style="font-size:10px;color:${THEME.muted};margin-top:3px">${esc(item.reason)}</div>
      </div>`
    })
    .join('')

  const planetRows = GRAHA_ORDER.map(id => {
    const gA = chartA.grahas.find(g => g.id === id)
    const gB = chartB.grahas.find(g => g.id === id)
    if (!gA || !gB) return ''
    const sA = signOf(gA.totalDegree)
    const sB = signOf(gB.totalDegree)
    const diff = signDiff(sA, sB)
    const rev = (14 - diff) % 12 || 12
    return `<tr>
      <td style="font-weight:800">${esc(gn(id, reportLang))}</td>
      <td>${rn(sA, reportLang)} ${gA.totalDegree.toFixed(1)}°</td>
      <td>${rn(sB, reportLang)} ${gB.totalDegree.toFixed(1)}°</td>
      <td>${esc(fill(c.relationAxis, { fwd: diff, rev }))}</td>
    </tr>`
  }).join('')

  const overlaySynopsis = fill(c.overlayNote, { nameA: chartA.meta.name, nameB: chartB.meta.name })
  const computedLine = fill(c.computedOn, { date: generated })

  let page = 1
  const nextFooter = () => pageFooter(page++, brand, c)

  return `<!DOCTYPE html>
<html lang="${c.htmlLang}">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
  <title>${esc(c.docTitle)} — ${esc(input.boyName)} × ${esc(input.girlName)} | ${esc(brand)}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Noto+Serif+Devanagari:wght@400;600;700;900&family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400&family=Outfit:wght@300;400;500;600;700;800;900&display=swap');
    * { box-sizing: border-box; margin: 0; padding: 0; }
    html, body {
      background: ${THEME.surface};
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    body {
      font-family: 'Outfit', 'Noto Serif Devanagari', sans-serif;
      font-size: 12px; color: ${THEME.text}; line-height: 1.65;
    }
    @page { size: A4; margin: 0; }
    .page { position: relative; overflow: hidden; display: flex; flex-direction: column; }
    .page::before {
      content: 'ॐ';
      position: absolute; top: 50%; left: 50%;
      transform: translate(-50%, -50%);
      font-family: 'Noto Serif Devanagari', serif;
      font-size: 14rem; color: ${THEME.temple}; z-index: 0;
      opacity: 0.04; pointer-events: none;
    }
    .page::after {
      content: '';
      position: absolute; inset: 0.7cm;
      border: 3px double ${THEME.temple};
      pointer-events: none; z-index: 10; opacity: 0.5;
    }
    .page > * { position: relative; z-index: 2; }
    @media print {
      body { background: white !important; }
      .no-print { display: none !important; }
      .page {
        width: 210mm; height: 297mm;
        page-break-after: always;
        padding: 1.6cm 2cm;
        background: ${THEME.bg} !important;
        box-shadow: none !important; margin: 0 !important; border: none !important;
      }
      .page:last-child { page-break-after: avoid; }
      table, tr, td, .card { page-break-inside: avoid !important; break-inside: avoid !important; }
    }
    @media screen {
      .page {
        width: 21cm; min-height: 29.7cm; margin: 40px auto; padding: 2cm;
        background: ${THEME.bg};
        box-shadow: 0 8px 40px rgba(100,70,30,0.12), 0 2px 8px rgba(100,70,30,0.08);
        border: 1px solid ${THEME.border};
      }
    }
    .print-bar {
      position: sticky; top: 0; z-index: 999;
      background: linear-gradient(135deg, ${THEME.primary} 0%, #6b1222 100%);
      color: #fff; padding: 14px 2rem;
      display: flex; justify-content: space-between; align-items: center;
      border-bottom: 3px solid ${THEME.temple};
    }
    .print-bar button {
      background: linear-gradient(135deg, ${THEME.accent}, ${THEME.temple});
      color: #fff; border: none; padding: 10px 28px; border-radius: 4px;
      font-weight: 700; cursor: pointer; font-family: inherit;
      letter-spacing: 0.5px; text-transform: uppercase; font-size: 11px;
    }
    .title-page {
      align-items: center; justify-content: center; text-align: center;
      background-image: radial-gradient(ellipse at center, ${THEME.bg} 0%, ${THEME.surface} 70%, ${THEME.bg} 100%);
    }
    .main-title {
      font-family: 'Cormorant Garamond', serif;
      font-size: 2.4rem; font-weight: 700; color: ${THEME.primary};
    }
    .sub-title {
      font-size: 0.9rem; font-weight: 700; color: ${THEME.accent};
      text-transform: uppercase; letter-spacing: 0.4em;
      border-top: 2px solid ${THEME.temple}; border-bottom: 2px solid ${THEME.temple};
      padding: 8px 22px; margin-top: 0.75rem;
    }
    .section-badge {
      display: inline-block;
      background: linear-gradient(135deg, ${THEME.accentLight} 0%, #fce8c0 100%);
      color: ${THEME.secondary}; padding: 5px 14px;
      font-size: 9px; font-weight: 900; text-transform: uppercase;
      letter-spacing: 2.5px; margin-bottom: 10px;
      border: 1px solid ${THEME.temple};
    }
    .section-title {
      font-family: 'Cormorant Garamond', serif; font-size: 1.55rem;
      color: ${THEME.primary}; font-weight: 700; margin-bottom: 0.85rem;
    }
    table { width: 100%; border-collapse: collapse; font-size: 11px; margin-top: 0.35rem; }
    th, td {
      border: 1px solid ${THEME.border};
      padding: 0.4rem 0.5rem;
      text-align: left; vertical-align: top;
    }
    th {
      background: ${THEME.accentLight};
      font-size: 9px; letter-spacing: 1px; text-transform: uppercase;
      color: ${THEME.secondary}; font-weight: 800;
    }
    .score-hero {
      display: grid; grid-template-columns: 120px 1fr; gap: 1.1rem;
      align-items: center; padding: 1rem 1.1rem;
      border: 2px double ${THEME.temple};
      background: linear-gradient(135deg, ${THEME.accentLight}, ${THEME.bg});
      margin: 1rem 0 1.15rem;
    }
    .score-ring {
      width: 110px; height: 110px; border-radius: 50%;
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      background:
        radial-gradient(circle at center, ${THEME.bg} 58%, transparent 59%),
        conic-gradient(${THEME.accent} ${pct}%, ${THEME.border} 0);
      border: 1px solid ${THEME.temple};
    }
    .score-ring .num { font-size: 1.85rem; font-weight: 900; color: ${THEME.primary}; line-height: 1; }
    .score-ring .den { font-size: 8px; letter-spacing: 0.12em; color: ${THEME.muted}; margin-top: 0.15rem; font-weight: 700; }
    .elig {
      display: inline-block; font-size: 10px; font-weight: 800;
      letter-spacing: 0.08em; text-transform: uppercase;
      padding: 0.28rem 0.65rem; color: #fff;
      background: ${eligOk ? THEME.emerald : THEME.rose};
      margin-bottom: 0.4rem;
    }
    .footer-line {
      margin-top: auto; padding-top: 0.85rem;
      border-top: 1px solid ${THEME.border};
      font-size: 10px; color: ${THEME.muted};
      display: flex; justify-content: space-between; gap: 1rem;
    }
    .card {
      border: 1px solid ${THEME.border};
      background: ${THEME.bg};
      padding: 0.75rem 0.9rem;
      margin-bottom: 0.65rem;
    }
    .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
    .chart-wrap { text-align: center; }
    .chart-wrap h3 {
      font-family: 'Cormorant Garamond', serif;
      font-size: 1.05rem; color: ${THEME.primary}; margin-bottom: 0.45rem;
    }
    .compat-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0.55rem; }
  </style>
</head>
<body>

<div class="print-bar no-print">
  <div style="display:flex;align-items:center;gap:12px">
    <span style="font-family:'Noto Serif Devanagari',serif;font-size:1.1rem;opacity:0.7">ॐ</span>
    <span style="font-weight:800;letter-spacing:1px">${esc(brand)} — ${esc(c.printBarSuffix)}</span>
  </div>
  <button type="button" onclick="window.print()">${esc(c.exportButton)}</button>
</div>

<!-- 1 COVER -->
<div class="page title-page">
  <div style="font-family:'Noto Serif Devanagari',serif;color:${THEME.primary};font-size:1.3rem;font-weight:700;letter-spacing:0.15em">॥ श्री गणेशाय नमः ॥</div>
  <div style="margin:1.1rem auto;display:flex;align-items:center;gap:12px;justify-content:center">
    <div style="width:60px;height:2px;background:linear-gradient(to right,transparent,${THEME.temple})"></div>
    <div style="color:${THEME.temple};font-family:'Noto Serif Devanagari',serif;font-size:1.35rem">ॐ</div>
    <div style="width:60px;height:2px;background:linear-gradient(to left,transparent,${THEME.temple})"></div>
  </div>
  <div style="font-family:'Cormorant Garamond',serif;font-size:1.45rem;font-weight:900;color:${THEME.primary};letter-spacing:0.18em;margin-bottom:1.2rem">${esc(brand)}</div>
  <div style="font-family:'Noto Serif Devanagari',serif;font-size:0.88rem;color:${THEME.secondary};letter-spacing:0.4em;text-transform:uppercase;opacity:0.8;margin-bottom:0.45rem">वैवाहिक मिलान प्रतिवेदन</div>
  <div style="font-family:'Cormorant Garamond',serif;font-size:0.9rem;color:${THEME.muted};letter-spacing:0.32em;text-transform:uppercase;margin-bottom:1.5rem">${esc(c.completeDossier)}</div>
  <h1 class="main-title" style="border-top:2px solid ${THEME.temple};border-bottom:2px solid ${THEME.temple};padding:12px 24px">
    ${esc(chartA.meta.name)} × ${esc(chartB.meta.name)}
  </h1>
  <div class="sub-title">${esc(c.subTitle)}</div>
  <div style="margin-top:1.8rem;font-size:2.6rem;font-weight:900;color:${THEME.primary};font-family:'Cormorant Garamond',serif">
    ${a.total} <span style="font-size:1rem;color:${THEME.muted};font-weight:600">/ 36</span>
  </div>
  <div style="margin-top:0.35rem;font-size:0.82rem;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:${eligOk ? THEME.emerald : THEME.rose}">
    ${esc(a.eligibility.label)}
  </div>
  <div style="margin-top:1.5rem;font-size:11px;color:${THEME.muted}">
    ${esc(moonNakName(chartA, reportLang))} · ${esc(moonNakName(chartB, reportLang))}
  </div>
  <div style="margin-top:2rem;opacity:0.15;font-size:4rem;font-family:'Noto Serif Devanagari',serif;color:${THEME.temple}">ॐ</div>
  <div style="margin-top:1.5rem;font-size:10px;color:${THEME.muted}">${esc(computedLine)}</div>
</div>

<!-- 2 ASHTAKOOT -->
<div class="page">
  ${sectionBadge(c.badge01)}
  <h2 class="section-title">${esc(c.titleAshtakoot)}</h2>
  <p style="font-size:11px;color:${THEME.muted};margin-bottom:0.5rem">${esc(a.layers.psychology)}</p>
  <div class="score-hero">
    <div class="score-ring"><span class="num">${a.total}</span><span class="den">${esc(c.gunasDenom)}</span></div>
    <div>
      <div class="elig">${esc(a.eligibility.label)}</div>
      <p style="font-size:12px;color:${THEME.muted};margin:0">${esc(a.eligibility.detail)}</p>
    </div>
  </div>
  <table>
    <thead><tr><th>${esc(c.thKoota)}</th><th>${esc(c.thGroom)}</th><th>${esc(c.thBride)}</th><th>${esc(c.thScore)}</th><th>${esc(c.thInsight)}</th></tr></thead>
    <tbody>${kootRows}</tbody>
  </table>
  ${nextFooter()}
</div>

<!-- 3 DEEP + PORUTHAM + MANGLIK -->
<div class="page">
  ${sectionBadge(c.badge02)}
  <h2 class="section-title">${esc(c.titleDeepSchools)}</h2>
  ${
    input.deep
      ? `<div class="card">
           <div style="font-weight:800;color:${THEME.secondary};margin-bottom:0.3rem">${esc(input.deep.overall.stageLabel)}</div>
           <p style="font-size:12px;margin:0 0 0.4rem">${esc(input.deep.overall.summary)}</p>
           <p style="font-size:11px;color:${THEME.muted};margin:0 0 0.3rem">${esc(input.deep.longevityYogas.summary)}</p>
           <p style="font-size:11px;color:${THEME.muted};margin:0">${esc(input.deep.varnamala.summary)}</p>
         </div>`
      : ''
  }
  ${
    input.manglik
      ? `<div class="card">
           <strong style="color:${THEME.primary}">${esc(c.manglikPairLabel)}</strong> ${esc(input.manglik.label)}
           <div style="font-size:11px;color:${THEME.muted};margin-top:0.3rem">${esc(input.manglik.detail)}</div>
         </div>`
      : ''
  }
  ${
    input.jaimini
      ? `<div class="card"><strong style="color:${THEME.primary}">${esc(c.d9JaiminiLabel)}</strong> ${esc(input.jaimini.summary)}</div>`
      : ''
  }
  ${
    input.porutham
      ? `<h3 style="font-family:'Cormorant Garamond',serif;font-size:1.15rem;color:${THEME.secondary};margin:0.6rem 0 0.4rem">
           ${esc(c.poruthamHeading)} · ${input.porutham.matchedCount}/10 · ${esc(input.porutham.scoreLabel)}
         </h3>
         <p style="font-size:11px;color:${THEME.muted};margin-bottom:0.45rem">${esc(input.porutham.summary)}</p>
         <table><thead><tr><th>${esc(c.thPorutham)}</th><th>${esc(c.thMatch)}</th><th>${esc(c.thDetail)}</th></tr></thead><tbody>${poruthamRows}</tbody></table>`
      : ''
  }
  ${nextFooter()}
</div>

<!-- 4 DOSHAS -->
<div class="page">
  ${sectionBadge(c.badge03)}
  <h2 class="section-title">${esc(c.titleDosha)}</h2>
  <div class="two-col">
    <div class="card">
      <div style="font-size:10px;letter-spacing:0.08em;text-transform:uppercase;color:${THEME.muted}">${esc(chartA.meta.name)}</div>
      <div style="font-weight:800;font-size:14px;margin:0.25rem 0;color:${teachA.status === 'present' ? THEME.rose : THEME.emerald}">
        ${teachA.status === 'present'
    ? `${esc(c.kujaDosha)} · ${esc(manglikIntensityLabel(m1.intensity, c))}`
    : esc(c.nonManglik)}
      </div>
      <p style="font-size:11px;color:${THEME.muted};margin:0">
        ${teachA.cancellationNotes.length
    ? `${esc(c.cancellationsPrefix)} ${esc(teachA.cancellationNotes.join(', '))}`
    : esc(teachA.statusDetail || c.noMarsInfluence)}
      </p>
    </div>
    <div class="card">
      <div style="font-size:10px;letter-spacing:0.08em;text-transform:uppercase;color:${THEME.muted}">${esc(chartB.meta.name)}</div>
      <div style="font-weight:800;font-size:14px;margin:0.25rem 0;color:${teachB.status === 'present' ? THEME.rose : THEME.emerald}">
        ${teachB.status === 'present'
    ? `${esc(c.kujaDosha)} · ${esc(manglikIntensityLabel(m2.intensity, c))}`
    : esc(c.nonManglik)}
      </div>
      <p style="font-size:11px;color:${THEME.muted};margin:0">
        ${teachB.cancellationNotes.length
    ? `${esc(c.cancellationsPrefix)} ${esc(teachB.cancellationNotes.join(', '))}`
    : esc(teachB.statusDetail || c.noMarsInfluence)}
      </p>
    </div>
  </div>
  <div class="card" style="margin-top:0.75rem">
    <div style="font-weight:800;margin-bottom:0.45rem;color:${THEME.secondary}">${esc(c.papeSamyaTitle)}</div>
    <table>
      <thead><tr><th>${esc(c.thPerson)}</th><th>${esc(c.thMaleficWeight)}</th></tr></thead>
      <tbody>
        <tr><td>${esc(chartA.meta.name)}</td><td style="font-weight:800">${p1.totalWeight.toFixed(2)}</td></tr>
        <tr><td>${esc(chartB.meta.name)}</td><td style="font-weight:800">${p2.totalWeight.toFixed(2)}</td></tr>
      </tbody>
    </table>
    <p style="margin:0.65rem 0 0;font-size:11px;color:${papeBalanced ? THEME.emerald : THEME.rose}">
      ${
        papeBalanced
          ? esc(c.papeBalanced)
          : `${esc(c.papeImbalancePrefix)} (${papeDiff.toFixed(2)} ${esc(c.papeImbalanceSuffix)}`
      }
    </p>
  </div>
  ${nextFooter()}
</div>

<!-- 5 AURA AFFINITY -->
<div class="page">
  ${sectionBadge(c.badge04)}
  <h2 class="section-title">${esc(c.titleAura)}</h2>
  <div class="compat-grid">${compatCards || `<p style="color:#6d5d4b">${esc(c.noAffinity)}</p>`}</div>
  ${nextFooter()}
</div>

<!-- 6 SIDE-BY-SIDE CHARTS -->
<div class="page">
  ${sectionBadge(c.badge05)}
  <h2 class="section-title">${esc(c.titleD1)}</h2>
  <div class="two-col" style="align-items:start">
    <div class="chart-wrap">
      <h3>${esc(chartA.meta.name)}</h3>
      ${buildChartSVG(chartA, 'D1', 250)}
      <div style="font-size:10px;color:${THEME.muted};margin-top:0.35rem">${esc(fill(c.lagnaMoon, { rashi: rn(chartA.lagnas.ascRashi, reportLang), nak: moonNakName(chartA, reportLang) }))}</div>
    </div>
    <div class="chart-wrap">
      <h3>${esc(chartB.meta.name)}</h3>
      ${buildChartSVG(chartB, 'D1', 250)}
      <div style="font-size:10px;color:${THEME.muted};margin-top:0.35rem">${esc(fill(c.lagnaMoon, { rashi: rn(chartB.lagnas.ascRashi, reportLang), nak: moonNakName(chartB, reportLang) }))}</div>
    </div>
  </div>
  ${nextFooter()}
</div>

<!-- 7 NAVAMSHA + OVERLAY -->
<div class="page">
  ${sectionBadge(c.badge06)}
  <h2 class="section-title">${esc(c.titleD9Synastry)}</h2>
  <div class="two-col" style="align-items:start;margin-bottom:1rem">
    <div class="chart-wrap">
      <h3>${esc(chartA.meta.name)} — D9</h3>
      ${buildChartSVG(chartA, 'D9', 230)}
    </div>
    <div class="chart-wrap">
      <h3>${esc(chartB.meta.name)} — D9</h3>
      ${buildChartSVG(chartB, 'D9', 230)}
    </div>
  </div>
  <div class="card">
    <strong style="color:${THEME.primary}">${esc(c.overlayView)}</strong>
    <p style="font-size:11px;color:${THEME.muted};margin:0.35rem 0 0">
      ${esc(overlaySynopsis)}
    </p>
  </div>
  ${nextFooter()}
</div>

<!-- 8 PLANETS -->
<div class="page">
  ${sectionBadge(c.badge07)}
  <h2 class="section-title">${esc(c.titleGrahaTable)}</h2>
  <table>
    <thead>
      <tr>
        <th>${esc(c.thPlanet)}</th>
        <th>${esc(chartA.meta.name)}</th>
        <th>${esc(chartB.meta.name)}</th>
        <th>${esc(c.thRelation)}</th>
      </tr>
    </thead>
    <tbody>${planetRows}</tbody>
  </table>
  ${nextFooter()}
</div>

<!-- 9 ASHTAKAVARGA -->
<div class="page">
  ${sectionBadge(c.badge08)}
  <h2 class="section-title">${esc(c.titleBindu)}</h2>
  <div style="margin-bottom:1.1rem">${buildAVCompact(chartA, reportLang, c)}</div>
  <div>${buildAVCompact(chartB, reportLang, c)}</div>
  ${nextFooter()}
</div>

<!-- 10 DASHA -->
<div class="page">
  ${sectionBadge(c.badge09)}
  <h2 class="section-title">${esc(c.titleDasha)}</h2>
  <div class="two-col" style="align-items:start">
    <div>${buildDashaCompact(chartA, reportLang, c)}</div>
    <div>${buildDashaCompact(chartB, reportLang, c)}</div>
  </div>
  ${nextFooter()}
</div>

<!-- 11 PANCHANG -->
<div class="page">
  ${sectionBadge(c.badge10)}
  <h2 class="section-title">${esc(c.titleNatalPanchang)}</h2>
  <div class="two-col" style="align-items:start">
    <div>${buildPanchangCompact(chartA, reportLang, c)}</div>
    <div>${buildPanchangCompact(chartB, reportLang, c)}</div>
  </div>
  ${nextFooter()}
</div>

<!-- 12 MATCH-MAKING -->
<div class="page">
  ${sectionBadge(c.badge11)}
  <h2 class="section-title">${esc(c.titleMatchMaking)}</h2>
  ${matchMakingBlock}
  ${nextFooter()}
</div>

<!-- 13 MARRIED LIFE CLASSICAL -->
<div class="page">
  ${sectionBadge(c.badge12)}
  <h2 class="section-title">${esc(c.titleMarriedLife)}</h2>
  ${marriedLifeBlock}
  ${nextFooter()}
</div>

<!-- 14 TIMING + REMEDIES -->
<div class="page">
  ${sectionBadge(c.badge13)}
  <h2 class="section-title">${esc(c.titleTimingRemedies)}</h2>
  ${
    input.timing
      ? `<p style="font-size:11px;color:${THEME.muted};margin-bottom:0.5rem">${esc(input.timing.summary)}</p>
         <table><thead><tr><th>${esc(c.thWindow)}</th><th>${esc(c.thTimingGroom)}</th><th>${esc(c.thTimingBride)}</th><th>${esc(c.thNote)}</th></tr></thead><tbody>${timingRows}</tbody></table>`
      : ''
  }
  ${
    remedyItems
      ? `<h3 style="font-family:'Cormorant Garamond',serif;font-size:1.15rem;color:${THEME.secondary};margin:1rem 0 0.45rem">${esc(c.remediesHeading)}</h3>
         <ul style="padding-left:1.15rem;font-size:12px">${remedyItems}</ul>`
      : ''
  }
  <div style="margin-top:auto;padding:0.9rem;border:2px double ${THEME.temple};background:${THEME.accentLight};text-align:center">
    <div style="font-family:'Noto Serif Devanagari',serif;color:${THEME.primary};margin-bottom:0.3rem">॥ शुभम् भवतु ॥</div>
    <p style="font-size:10px;color:${THEME.muted};margin:0">
      ${esc(c.closingDisclaimer)}
    </p>
  </div>
  ${nextFooter()}
</div>

</body>
</html>`
}
