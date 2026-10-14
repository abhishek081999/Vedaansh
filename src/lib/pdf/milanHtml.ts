// src/lib/pdf/milanHtml.ts
// Full Kundali Milan compare print — all "All Sections" content, kundali-print style.

import type { ChartOutput, GrahaData, GrahaId, Rashi } from '@/types/astrology'
import { GRAHA_NAMES, RASHI_NAMES, RASHI_SHORT, NAKSHATRA_NAMES } from '@/types/astrology'
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

function rn(s: number): string {
  return RASHI_NAMES[s as keyof typeof RASHI_NAMES] ?? '—'
}

function fmtDate(value?: string | Date | null): string {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return String(value)
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

function fmtDateTime(value?: string | Date | null): string {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  })
}

interface CompatItem {
  label: string
  score: number
  reason: string
  level: 'good' | 'neutral' | 'bad'
}

function getCompatibility(a: ChartOutput, b: ChartOutput): CompatItem[] {
  const items: CompatItem[] = []
  const aMo = a.grahas.find((g: GrahaData) => g.id === 'Mo')
  const bMo = b.grahas.find((g: GrahaData) => g.id === 'Mo')
  const aVe = a.grahas.find((g: GrahaData) => g.id === 'Ve')
  const bVe = b.grahas.find((g: GrahaData) => g.id === 'Ve')
  const aJu = a.grahas.find((g: GrahaData) => g.id === 'Ju')
  const aSu = a.grahas.find((g: GrahaData) => g.id === 'Su')
  const bSu = b.grahas.find((g: GrahaData) => g.id === 'Su')

  if (aMo && bMo) {
    const sA = signOf(aMo.totalDegree)
    const sB = signOf(bMo.totalDegree)
    const diff = signDiff(sA, sB)
    const reverseDiff = signDiff(sB, sA)
    const isGood = [1, 5, 9, 3, 7, 11].includes(diff)
    const isBad = [2, 12, 6, 8].includes(diff)
    items.push({
      label: 'Moon Sign Affinity',
      score: isGood ? 2 : isBad ? -1 : 0,
      level: isGood ? 'good' : isBad ? 'bad' : 'neutral',
      reason: `${rn(sA)} ↔ ${rn(sB)} (${diff}/${reverseDiff} relation)`,
    })
  }

  const aL = a.lagnas.ascRashi
  const bL = b.lagnas.ascRashi
  if (aL && bL) {
    const diff = signDiff(aL, bL)
    const isGood = [1, 5, 9, 3, 7, 11].includes(diff)
    items.push({
      label: 'Ascendant Harmony',
      score: isGood ? 2 : 0,
      level: isGood ? 'good' : 'neutral',
      reason: `${rn(aL)} ↔ ${rn(bL)}`,
    })
  }

  if (aVe && bMo) {
    const d = signDiff(signOf(aVe.totalDegree), signOf(bMo.totalDegree))
    if ([1, 5, 9].includes(d)) {
      items.push({ label: "A's Venus ↔ B's Moon", score: 1.5, level: 'good', reason: 'Strong emotional attraction' })
    }
  }
  if (bVe && aMo) {
    const d = signDiff(signOf(bVe.totalDegree), signOf(aMo.totalDegree))
    if ([1, 5, 9].includes(d)) {
      items.push({ label: "B's Venus ↔ A's Moon", score: 1.5, level: 'good', reason: 'Strong emotional attraction' })
    }
  }
  if (aJu && bMo) {
    const d = signDiff(signOf(aJu.totalDegree), signOf(bMo.totalDegree))
    if ([1, 5, 7, 9].includes(d)) {
      items.push({ label: "A's Jupiter blesses B's Moon", score: 1, level: 'good', reason: 'Fortunate for stability' })
    }
  }
  if (aSu && bSu) {
    const d = signDiff(signOf(aSu.totalDegree), signOf(bSu.totalDegree))
    if ([1, 5, 9].includes(d)) {
      items.push({ label: 'Sun Sign Affinity', score: 1, level: 'good', reason: 'Soul compatibility' })
    }
  }
  return items
}

function moonNakName(chart: ChartOutput): string {
  const mo = chart.grahas.find(g => g.id === 'Mo')
  if (!mo) return '—'
  const idx = mo.nakshatraIndex >= 0 ? mo.nakshatraIndex : Math.floor(mo.totalDegree / (360 / 27))
  return NAKSHATRA_NAMES[idx] ?? mo.nakshatraName ?? '—'
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
}

/** Assemble a full printable Milan report from two charts + Ashtakoot. */
export function buildMilanReportInput(
  chartA: ChartOutput,
  chartB: ChartOutput,
  ashtakoot: AshtakootResult,
  roleA: MilanRole = 'boy',
  roleB: MilanRole = 'girl',
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

  const porutham = calculatePorutham(boyNak, boySign, girlNak, girlSign)
  const manglik = analyzeManglikPair(roles.boyChart, roles.girlChart)
  const timing = analyzeMarriageTiming(roles.boyChart, roles.girlChart)
  const jaimini = analyzeDualJaiminiMarriage(roles.boyChart, roles.girlChart)
  const deep = analyzeMilanDeep(roles.boyChart, roles.girlChart)
  const remedies = buildMilanRemedies({
    nadiDosha: !!ashtakoot.nadi.dosha,
    bhakootDosha: ashtakoot.bhakoot.points === 0,
    manglikMismatch: manglik.verdict === 'mismatch',
    ganaHarsh: ashtakoot.gana.points <= 1,
    poruthamCriticalFails: porutham.items
      .filter(i => i.weight === 'critical' && !i.matched)
      .map(i => i.name),
  })

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

function pageFooter(pageNo: number, brand: string): string {
  return `<div class="footer-line">
    <div style="display:flex;align-items:center;gap:8px">
      <span style="opacity:0.4;color:${THEME.temple};font-family:'Noto Serif Devanagari',serif">ॐ</span>
      <span>${esc(brand)} · Kundali Milan · गोपनीय</span>
    </div>
    <div style="color:${THEME.temple}">पृ. ${pageNo}</div>
  </div>`
}

function sectionBadge(text: string): string {
  return `<div class="section-badge">${esc(text)}</div>`
}

function buildAVCompact(chart: ChartOutput): string {
  if (!chart.ashtakavarga) return '<p style="color:#6d5d4b">Ashtakavarga data missing.</p>'
  const planets = ['Su', 'Mo', 'Ma', 'Me', 'Ju', 'Ve', 'Sa']
  const av = chart.ashtakavarga
  const header = `<tr><th>Sign</th>${planets.map(p => `<th>${p}</th>`).join('')}<th>SAV</th></tr>`
  let rows = ''
  for (let r = 1; r <= 12; r++) {
    let cells = ''
    planets.forEach(p => {
      cells += `<td>${av.bav[p]?.bindus[r - 1] ?? 0}</td>`
    })
    rows += `<tr><td style="font-weight:700">${RASHI_SHORT[r as Rashi]}</td>${cells}<td style="background:${THEME.accentLight};font-weight:800">${av.sav[r - 1] || 0}</td></tr>`
  }
  return `
    <div style="font-weight:800;margin-bottom:0.4rem;color:${THEME.primary}">${esc(chart.meta.name)} — SAV ${av.savTotal}</div>
    <table><thead>${header}</thead><tbody>${rows}</tbody></table>
  `
}

function buildDashaCompact(chart: ChartOutput): string {
  const nodes = chart.dashas.vimshottari ?? []
  if (!nodes.length) return '<p style="color:#6d5d4b">Dasha data missing.</p>'
  const now = new Date()
  const current = nodes.find(m => now >= new Date(m.start) && now <= new Date(m.end))
  const antar = current?.children?.find(m => now >= new Date(m.start) && now <= new Date(m.end))
  const rows = nodes
    .slice(0, 9)
    .map(m => {
      const active = current?.lord === m.lord
      return `<tr style="${active ? `background:${THEME.accentLight}` : ''}">
        <td><strong>${esc(GRAHA_NAMES[m.lord as GrahaId] ?? m.lord)}</strong>${active ? ' ●' : ''}</td>
        <td>${fmtDate(m.start)}</td>
        <td>${fmtDate(m.end)}</td>
      </tr>`
    })
    .join('')
  return `
    <div style="font-weight:800;margin-bottom:0.45rem;color:${THEME.primary}">${esc(chart.meta.name)} — Vimshottari</div>
    ${
      current
        ? `<p style="font-size:11px;color:${THEME.muted};margin:0 0 0.55rem">
             Current: <strong>${esc(GRAHA_NAMES[current.lord as GrahaId] ?? current.lord)}</strong>
             ${antar ? ` / ${esc(GRAHA_NAMES[antar.lord as GrahaId] ?? antar.lord)}` : ''}
           </p>`
        : ''
    }
    <table>
      <thead><tr><th>Mahadasha</th><th>Start</th><th>End</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
  `
}

function buildPanchangCompact(chart: ChartOutput): string {
  const p = chart.panchang
  if (!p) return '<p style="color:#6d5d4b">Panchang data missing.</p>'
  const rows = [
    ['Vara', p.vara?.name],
    ['Tithi', p.tithi ? `${p.tithi.name} (${p.tithi.paksha})` : '—'],
    ['Nakshatra', p.nakshatra?.name],
    ['Yoga', p.yoga?.name],
    ['Karana', p.karana?.name],
    ['Sunrise', fmtDateTime(p.sunrise)],
    ['Sunset', fmtDateTime(p.sunset)],
  ]
    .map(([k, v]) => `<tr><td style="font-weight:700;width:28%">${esc(String(k))}</td><td>${esc(String(v ?? '—'))}</td></tr>`)
    .join('')
  return `
    <div style="font-weight:800;margin-bottom:0.45rem;color:${THEME.primary}">${esc(chart.meta.name)} — Natal Panchang</div>
    <table><tbody>${rows}</tbody></table>
  `
}

export function generateMilanHTML(input: MilanReportInput): string {
  const brand = (input.branding || 'VEDAANSH').toUpperCase()
  const a = input.ashtakoot
  const { chartA, chartB } = input
  const generated = new Date().toLocaleDateString('en-IN', { dateStyle: 'long' })
  const pct = Math.round((a.total / 36) * 100)
  const eligOk = a.eligibility.traditionallyAccepted
  const compat = getCompatibility(chartA, chartB)

  const m1 = calculateManglik(chartA.grahas, [], chartA.lagnas.ascRashi)
  const m2 = calculateManglik(chartB.grahas, [], chartB.lagnas.ascRashi)
  const p1 = calculatePapeSamya(chartA.grahas, chartA.lagnas.ascRashi)
  const p2 = calculatePapeSamya(chartB.grahas, chartB.lagnas.ascRashi)
  const papeDiff = Math.abs(p1.totalWeight - p2.totalWeight)
  const papeBalanced = papeDiff <= 1.25

  const kootas = [
    ['Varna', a.varna],
    ['Vashya', a.vashya],
    ['Tara', a.tara],
    ['Yoni', a.yoni],
    ['Maitri', a.maitri],
    ['Gana', a.gana],
    ['Bhakoot', a.bhakoot],
    ['Nadi', a.nadi],
  ] as const

  const kootRows = kootas
    .map(([k, s]) => {
      const weak = s.points === 0 || (k === 'Nadi' && s.dosha)
      return `<tr style="${weak ? `background:${THEME.accentLight}` : ''}">
        <td><strong>${esc(k)}</strong><div style="font-size:9px;color:${THEME.muted};margin-top:2px">${esc(s.meaning)}</div></td>
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
            <td style="color:${i.matched ? THEME.emerald : THEME.rose};font-weight:800">${i.matched ? 'Yes' : 'No'}</td>
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
    return `<tr>
      <td style="font-weight:800">${esc(GRAHA_NAMES[id] ?? id)}</td>
      <td>${rn(sA)} ${gA.totalDegree.toFixed(1)}°</td>
      <td>${rn(sB)} ${gB.totalDegree.toFixed(1)}°</td>
      <td>${diff} / ${(14 - diff) % 12 || 12} axis</td>
    </tr>`
  }).join('')

  let page = 1
  const nextFooter = () => pageFooter(page++, brand)

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
  <title>Kundali Milan — ${esc(input.boyName)} × ${esc(input.girlName)} | ${esc(brand)}</title>
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
    <span style="font-weight:800;letter-spacing:1px">${esc(brand)} — कुण्डली मिलान (All Sections)</span>
  </div>
  <button type="button" onclick="window.print()">⬇ Export Full Milan Report</button>
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
  <div style="font-family:'Cormorant Garamond',serif;font-size:0.9rem;color:${THEME.muted};letter-spacing:0.32em;text-transform:uppercase;margin-bottom:1.5rem">Complete Kundali Milan Dossier</div>
  <h1 class="main-title" style="border-top:2px solid ${THEME.temple};border-bottom:2px solid ${THEME.temple};padding:12px 24px">
    ${esc(chartA.meta.name)} × ${esc(chartB.meta.name)}
  </h1>
  <div class="sub-title">All Sections · Ashtakoot to Panchang</div>
  <div style="margin-top:1.8rem;font-size:2.6rem;font-weight:900;color:${THEME.primary};font-family:'Cormorant Garamond',serif">
    ${a.total} <span style="font-size:1rem;color:${THEME.muted};font-weight:600">/ 36</span>
  </div>
  <div style="margin-top:0.35rem;font-size:0.82rem;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:${eligOk ? THEME.emerald : THEME.rose}">
    ${esc(a.eligibility.label)}
  </div>
  <div style="margin-top:1.5rem;font-size:11px;color:${THEME.muted}">
    ${esc(moonNakName(chartA))} · ${esc(moonNakName(chartB))}
  </div>
  <div style="margin-top:2rem;opacity:0.15;font-size:4rem;font-family:'Noto Serif Devanagari',serif;color:${THEME.temple}">ॐ</div>
  <div style="margin-top:1.5rem;font-size:10px;color:${THEME.muted}">Computed on ${esc(generated)} · Swiss Ephemeris</div>
</div>

<!-- 2 ASHTAKOOT -->
<div class="page">
  ${sectionBadge('01 · Ashtakoot (36)')}
  <h2 class="section-title">Detailed Guna Milan</h2>
  <p style="font-size:11px;color:${THEME.muted};margin-bottom:0.5rem">${esc(a.layers.psychology)}</p>
  <div class="score-hero">
    <div class="score-ring"><span class="num">${a.total}</span><span class="den">/ 36 GUNAS</span></div>
    <div>
      <div class="elig">${esc(a.eligibility.label)}</div>
      <p style="font-size:12px;color:${THEME.muted};margin:0">${esc(a.eligibility.detail)}</p>
    </div>
  </div>
  <table>
    <thead><tr><th>Koota</th><th>Groom</th><th>Bride</th><th>Score</th><th>Insight</th></tr></thead>
    <tbody>${kootRows}</tbody>
  </table>
  ${nextFooter()}
</div>

<!-- 3 DEEP + PORUTHAM + MANGLIK -->
<div class="page">
  ${sectionBadge('02 · Deep Milan · Porutham · Manglik')}
  <h2 class="section-title">Deep Milan &amp; Schools</h2>
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
           <strong style="color:${THEME.primary}">Manglik pair:</strong> ${esc(input.manglik.label)}
           <div style="font-size:11px;color:${THEME.muted};margin-top:0.3rem">${esc(input.manglik.detail)}</div>
         </div>`
      : ''
  }
  ${
    input.jaimini
      ? `<div class="card"><strong style="color:${THEME.primary}">D9 / Jaimini:</strong> ${esc(input.jaimini.summary)}</div>`
      : ''
  }
  ${
    input.porutham
      ? `<h3 style="font-family:'Cormorant Garamond',serif;font-size:1.15rem;color:${THEME.secondary};margin:0.6rem 0 0.4rem">
           South Indian Porutham · ${input.porutham.matchedCount}/10 · ${esc(input.porutham.scoreLabel)}
         </h3>
         <p style="font-size:11px;color:${THEME.muted};margin-bottom:0.45rem">${esc(input.porutham.summary)}</p>
         <table><thead><tr><th>Porutham</th><th>Match</th><th>Detail</th></tr></thead><tbody>${poruthamRows}</tbody></table>`
      : ''
  }
  ${nextFooter()}
</div>

<!-- 4 DOSHAS -->
<div class="page">
  ${sectionBadge('03 · Dosha Analysis')}
  <h2 class="section-title">Manglik &amp; Pape-Samya</h2>
  <div class="two-col">
    <div class="card">
      <div style="font-size:10px;letter-spacing:0.08em;text-transform:uppercase;color:${THEME.muted}">${esc(chartA.meta.name)}</div>
      <div style="font-weight:800;font-size:14px;margin:0.25rem 0;color:${m1.isManglik ? THEME.rose : THEME.emerald}">
        ${m1.isManglik ? `Kuja Dosha · ${esc(m1.intensity)}` : 'Non-Manglik'}
      </div>
      <p style="font-size:11px;color:${THEME.muted};margin:0">
        ${m1.isManglik ? `Mars in ${m1.house}th house.` : m1.cancellations?.length ? `Cancellations: ${esc(m1.cancellations.join(', '))}` : 'No focal Martian affliction.'}
      </p>
    </div>
    <div class="card">
      <div style="font-size:10px;letter-spacing:0.08em;text-transform:uppercase;color:${THEME.muted}">${esc(chartB.meta.name)}</div>
      <div style="font-weight:800;font-size:14px;margin:0.25rem 0;color:${m2.isManglik ? THEME.rose : THEME.emerald}">
        ${m2.isManglik ? `Kuja Dosha · ${esc(m2.intensity)}` : 'Non-Manglik'}
      </div>
      <p style="font-size:11px;color:${THEME.muted};margin:0">
        ${m2.isManglik ? `Mars in ${m2.house}th house.` : m2.cancellations?.length ? `Cancellations: ${esc(m2.cancellations.join(', '))}` : 'No focal Martian affliction.'}
      </p>
    </div>
  </div>
  <div class="card" style="margin-top:0.75rem">
    <div style="font-weight:800;margin-bottom:0.45rem;color:${THEME.secondary}">Pape-Samya (Malefic Balance)</div>
    <table>
      <thead><tr><th>Person</th><th>Malefic Weight</th></tr></thead>
      <tbody>
        <tr><td>${esc(chartA.meta.name)}</td><td style="font-weight:800">${p1.totalWeight.toFixed(2)}</td></tr>
        <tr><td>${esc(chartB.meta.name)}</td><td style="font-weight:800">${p2.totalWeight.toFixed(2)}</td></tr>
      </tbody>
    </table>
    <p style="margin:0.65rem 0 0;font-size:11px;color:${papeBalanced ? THEME.emerald : THEME.rose}">
      ${
        papeBalanced
          ? 'Stable balance — malefic burdens are well compensated between both charts.'
          : `Imbalance detected (${papeDiff.toFixed(2)} pts) — may need conscious adjustment.`
      }
    </p>
  </div>
  ${nextFooter()}
</div>

<!-- 5 AURA AFFINITY -->
<div class="page">
  ${sectionBadge('04 · Aura Affinity')}
  <h2 class="section-title">Aura &amp; Psychological Affinity</h2>
  <div class="compat-grid">${compatCards || '<p style="color:#6d5d4b">No strong affinity signals computed.</p>'}</div>
  ${nextFooter()}
</div>

<!-- 6 SIDE-BY-SIDE CHARTS -->
<div class="page">
  ${sectionBadge('05 · Side-by-Side Charts')}
  <h2 class="section-title">Rashi (D1) Kundali</h2>
  <div class="two-col" style="align-items:start">
    <div class="chart-wrap">
      <h3>${esc(chartA.meta.name)}</h3>
      ${buildChartSVG(chartA, 'D1', 250)}
      <div style="font-size:10px;color:${THEME.muted};margin-top:0.35rem">Lagna ${rn(chartA.lagnas.ascRashi)} · Moon ${esc(moonNakName(chartA))}</div>
    </div>
    <div class="chart-wrap">
      <h3>${esc(chartB.meta.name)}</h3>
      ${buildChartSVG(chartB, 'D1', 250)}
      <div style="font-size:10px;color:${THEME.muted};margin-top:0.35rem">Lagna ${rn(chartB.lagnas.ascRashi)} · Moon ${esc(moonNakName(chartB))}</div>
    </div>
  </div>
  ${nextFooter()}
</div>

<!-- 7 NAVAMSHA + OVERLAY -->
<div class="page">
  ${sectionBadge('06 · Navamsha · Overlay')}
  <h2 class="section-title">D9 Charts &amp; Synastry Note</h2>
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
    <strong style="color:${THEME.primary}">Overlay view</strong>
    <p style="font-size:11px;color:${THEME.muted};margin:0.35rem 0 0">
      Synastry places ${esc(chartB.meta.name)}&apos;s planets into ${esc(chartA.meta.name)}&apos;s houses.
      Compare house lords and Venus–Mars chemistry alongside the planetary positions table on the next page.
    </p>
  </div>
  ${nextFooter()}
</div>

<!-- 8 PLANETS -->
<div class="page">
  ${sectionBadge('07 · Planetary Positions')}
  <h2 class="section-title">Side-by-Side Graha Table</h2>
  <table>
    <thead>
      <tr>
        <th>Planet</th>
        <th>${esc(chartA.meta.name)}</th>
        <th>${esc(chartB.meta.name)}</th>
        <th>Relation</th>
      </tr>
    </thead>
    <tbody>${planetRows}</tbody>
  </table>
  ${nextFooter()}
</div>

<!-- 9 ASHTAKAVARGA -->
<div class="page">
  ${sectionBadge('08 · Ashtakavarga')}
  <h2 class="section-title">Bindu Matrices</h2>
  <div style="margin-bottom:1.1rem">${buildAVCompact(chartA)}</div>
  <div>${buildAVCompact(chartB)}</div>
  ${nextFooter()}
</div>

<!-- 10 DASHA -->
<div class="page">
  ${sectionBadge('09 · Dasha')}
  <h2 class="section-title">Vimshottari Periods</h2>
  <div class="two-col" style="align-items:start">
    <div>${buildDashaCompact(chartA)}</div>
    <div>${buildDashaCompact(chartB)}</div>
  </div>
  ${nextFooter()}
</div>

<!-- 11 PANCHANG -->
<div class="page">
  ${sectionBadge('10 · Panchang')}
  <h2 class="section-title">Natal Panchang</h2>
  <div class="two-col" style="align-items:start">
    <div>${buildPanchangCompact(chartA)}</div>
    <div>${buildPanchangCompact(chartB)}</div>
  </div>
  ${nextFooter()}
</div>

<!-- 12 TIMING + REMEDIES -->
<div class="page">
  ${sectionBadge('11 · Timing & Remedies')}
  <h2 class="section-title">Marriage Windows &amp; Upaya</h2>
  ${
    input.timing
      ? `<p style="font-size:11px;color:${THEME.muted};margin-bottom:0.5rem">${esc(input.timing.summary)}</p>
         <table><thead><tr><th>Window</th><th>Groom</th><th>Bride</th><th>Note</th></tr></thead><tbody>${timingRows}</tbody></table>`
      : ''
  }
  ${
    remedyItems
      ? `<h3 style="font-family:'Cormorant Garamond',serif;font-size:1.15rem;color:${THEME.secondary};margin:1rem 0 0.45rem">Remedies</h3>
         <ul style="padding-left:1.15rem;font-size:12px">${remedyItems}</ul>`
      : ''
  }
  <div style="margin-top:auto;padding:0.9rem;border:2px double ${THEME.temple};background:${THEME.accentLight};text-align:center">
    <div style="font-family:'Noto Serif Devanagari',serif;color:${THEME.primary};margin-bottom:0.3rem">॥ शुभम् भवतु ॥</div>
    <p style="font-size:10px;color:${THEME.muted};margin:0">
      Educational Jyotish summary. Confirm with a qualified astrologer before marriage decisions.
    </p>
  </div>
  ${nextFooter()}
</div>

</body>
</html>`
}
