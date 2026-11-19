// ─────────────────────────────────────────────────────────────
//  src/lib/pdf/lalKitabHtml.ts
//  Printable Lal Kitab report (open → print to PDF). Pure HTML.
// ─────────────────────────────────────────────────────────────

import type { ChartOutput } from '@/types/astrology'
import type { EngineLang } from '@/lib/engine/lang'
import { lkAgeYears, lkCycleAt, lkGrahaName, lkYearOfLife, readLalKitab } from '@/lib/engine/lalKitab'
import { LK_HTML_HI } from '@/lib/pdf/lalKitabHtml.hi'

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

export function generateLalKitabHTML(
  chart: ChartOutput,
  opts?: { branding?: string; lang?: EngineLang },
): string {
  const lang = opts?.lang ?? 'en'
  const hi = lang === 'hi'
  const t = hi ? LK_HTML_HI : null
  const reading = readLalKitab(chart, { lang, ageYears: lkAgeYears(chart.meta.birthDate) })
  const year = lkYearOfLife(lkAgeYears(chart.meta.birthDate))
  const cycle = lkCycleAt(year)
  const name = chart.meta.name || (hi ? 'अनाम' : 'Unnamed')
  const brand = opts?.branding || 'Vedaansh'

  const planetRows = reading.planets.map((p) => `
    <tr>
      <td>${esc(p.name)}</td>
      <td>${p.house}</td>
      <td>${p.dignities.join(', ') || '—'}</td>
      <td>${[p.kayam ? (hi ? 'कायम' : 'Kayam') : '', p.dharmi ? (hi ? 'धर्मी' : 'Dharmi') : '', p.sleeping ? (hi ? 'सोया' : 'Asleep') : ''].filter(Boolean).join(', ') || '—'}</td>
    </tr>`).join('')

  const findings = reading.findings.slice(0, 12).map((f) => `
    <li><strong>${esc(f.label)}</strong> — ${esc(f.text)}
      ${f.why.length ? `<ul>${f.why.slice(0, 3).map((w) => `<li>${esc(w)}</li>`).join('')}</ul>` : ''}
    </li>`).join('')

  const remedies = reading.remedies.top.slice(0, 5).map((c) => `
    <li><strong>${esc(lkGrahaName(c.planet, lang))}</strong>: ${esc(c.upay.text)}</li>`).join('')

  const doshas = reading.findings
    .filter((f) => f.id.startsWith('dosha.') || f.id.startsWith('rin.'))
    .slice(0, 10)
    .map((f) => `<li>${esc(f.label)} — ${esc(f.text)}</li>`)
    .join('')

  const title = hi ? `${t!.title} — ${esc(name)}` : `Lal Kitab — ${esc(name)}`
  const printBtn = hi ? t!.print : 'Print / Save PDF'
  const h1 = hi ? t!.h1 : 'Lal Kitab Report'
  const metaLine = hi
    ? `${esc(brand)} · ${esc(name)} · ${chart.meta.birthDate} · ${t!.yearOfLife} ${year} · ${t!.cycle} ${esc(lkGrahaName(cycle.planet, lang))}`
    : `${esc(brand)} · ${esc(name)} · ${chart.meta.birthDate} · Year of life ${year} · Cycle ${esc(lkGrahaName(cycle.planet, lang))}`

  return `<!DOCTYPE html>
<html lang="${hi ? 'hi' : 'en'}">
<head>
  <meta charset="utf-8"/>
  <title>${title} | Vedaansh</title>
  <style>
    body { font-family: ${hi ? "'Noto Sans Devanagari', " : ''}Georgia, serif; color: #1a1a1a; max-width: 860px; margin: 2rem auto; padding: 0 1rem; line-height: 1.5; }
    h1 { color: #8a6d1d; font-size: 1.7rem; margin-bottom: 0.2rem; }
    h2 { color: #8a6d1d; font-size: 1.15rem; margin-top: 1.6rem; border-bottom: 1px solid #e5d9b0; padding-bottom: 0.25rem; }
    .meta { color: #666; font-size: 0.9rem; margin-bottom: 1.25rem; }
    table { width: 100%; border-collapse: collapse; font-size: 0.85rem; margin-top: 0.5rem; }
    th, td { border: 1px solid #ddd; padding: 0.4rem 0.55rem; text-align: left; vertical-align: top; }
    th { background: #f5f5f5; }
    ul { font-size: 0.88rem; }
    footer { margin-top: 2rem; font-size: 0.75rem; color: #888; }
    button { background: #8a6d1d; color: #fff; border: none; padding: 0.6rem 1.1rem; border-radius: 6px; cursor: pointer; margin-bottom: 1rem; }
    @media print { body { margin: 0; } button { display: none; } }
  </style>
</head>
<body>
  <button onclick="window.print()">${printBtn}</button>
  <h1>${h1}</h1>
  <p class="meta">${metaLine}</p>

  <h2>${hi ? t!.planets : 'Planets in the Teva'}</h2>
  <table>
    <thead><tr><th>${hi ? t!.thPlanet : 'Planet'}</th><th>${hi ? t!.thHouse : 'House'}</th><th>${hi ? t!.thDignity : 'Dignity'}</th><th>${hi ? t!.thState : 'State'}</th></tr></thead>
    <tbody>${planetRows}</tbody>
  </table>

  <h2>${hi ? t!.findings : 'Findings'}</h2>
  <ul>${findings || `<li>${hi ? t!.none : 'None'}</li>`}</ul>

  <h2>${hi ? t!.doshas : 'Doshas and debts'}</h2>
  <ul>${doshas || `<li>${hi ? t!.none : 'None flagged'}</li>`}</ul>

  <h2>${hi ? t!.remedies : 'Top remedies'}</h2>
  <ul>${remedies || `<li>${hi ? t!.noneNeeded : 'No remedy needed'}</li>`}</ul>

  <footer>${hi ? t!.footer : 'Lal Kitab remedies are traditional practices. They are not medical, legal or financial advice. Vedaansh — Swiss Ephemeris chart foundation.'}</footer>
</body>
</html>`
}

/** Compact chapter fragment for the Platinum chart email / full dossier. */
export function buildLalKitabChapterHtml(chart: ChartOutput, lang: EngineLang = 'en'): string {
  const hi = lang === 'hi'
  const t = hi ? LK_HTML_HI : null
  const reading = readLalKitab(chart, { lang, ageYears: lkAgeYears(chart.meta.birthDate) })
  const year = lkYearOfLife(lkAgeYears(chart.meta.birthDate))
  const cycle = lkCycleAt(year)
  const top = reading.findings.slice(0, 6).map((f) => `<li><strong>${esc(f.label)}</strong> — ${esc(f.text)}</li>`).join('')
  const remedies = reading.remedies.top.slice(0, 3).map((c) => `<li>${esc(lkGrahaName(c.planet, lang))}: ${esc(c.upay.text)}</li>`).join('')
  return `
  <div class="page">
    <div class="section-badge">${hi ? t!.chapterBadge : 'Lal Kitab'}</div>
    <h2 class="section-title"><span>LK</span> ${hi ? t!.chapterTitle : 'Lal Kitab overview'}</h2>
    <p style="font-size:12px;color:#555;margin:0.4rem 0 0.8rem">
      ${hi ? t!.yearOfLife : 'Year of life'} ${year} · ${hi ? t!.cycle : 'Cycle'} ${esc(lkGrahaName(cycle.planet, lang))} ·
      ${hi ? t!.chartType : 'Chart type'}: ${reading.states.chartTypes.length ? reading.states.chartTypes.join(', ') : (hi ? 'सामान्य' : 'ordinary')}
    </p>
    <h3 class="section-badge">${hi ? t!.findings : 'Findings'}</h3>
    <ul style="font-size:12px;line-height:1.45">${top || `<li>${hi ? t!.none : 'None'}</li>`}</ul>
    <h3 class="section-badge" style="margin-top:0.8rem">${hi ? t!.remedies : 'Remedies'}</h3>
    <ul style="font-size:12px;line-height:1.45">${remedies || `<li>${hi ? t!.noneNeeded : 'None needed'}</li>`}</ul>
  </div>`
}
