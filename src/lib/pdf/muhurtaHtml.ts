/**
 * src/lib/pdf/muhurtaHtml.ts
 * Printable HTML report for a muhurta selection (open → print to PDF).
 */

import type { EngineLang } from '@/lib/engine/lang'
import { muhurtaActivityLabel, type MuhurtaActivity, type MuhurtaScore } from '@/lib/engine/muhurtaAnalysis'
import { plainMuhurtaVerdict } from '@/lib/engine/muhurtaVerdict'
import { MUHURTA_HTML_HI } from '@/lib/engine/locale/muhurtaHtml.hi'

export interface MuhurtaReportInput {
  activity: MuhurtaActivity
  locationName: string
  generatedAt: string
  lang?: EngineLang
  peak?: { time: string; score: MuhurtaScore }
  dayResults?: {
    date: string
    score: number
    grade: string
    windows: string[]
    avoid: string[]
    reasons: string[]
  }[]
  personalNote?: string
}

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

export function generateMuhurtaHTML(input: MuhurtaReportInput): string {
  const lang = input.lang ?? 'en'
  const hi = lang === 'hi'
  const act = muhurtaActivityLabel(input.activity, lang)
  const locale = hi ? 'hi-IN' : 'en-IN'
  const verdict = input.peak
    ? plainMuhurtaVerdict(input.activity, input.peak.score, {
        timeLabel: new Date(input.peak.time).toLocaleString(locale, { timeZone: 'Asia/Kolkata' }),
        lang,
      })
    : null

  const days = (input.dayResults ?? [])
    .slice(0, 12)
    .map(
      d => `
      <tr>
        <td>${esc(d.date)}</td>
        <td><strong>${esc(d.grade)}</strong> (${Math.round(d.score)})</td>
        <td>${d.windows.slice(0, 3).map(esc).join('<br/>')}</td>
        <td>${d.avoid.slice(0, 3).map(esc).join('<br/>')}</td>
      </tr>`,
    )
    .join('')

  const factors = (input.peak?.score.factors ?? [])
    .map(f => `<li>${esc(f)}</li>`)
    .join('')

  const htmlLang = hi ? MUHURTA_HTML_HI.htmlLang : 'en'
  const title = hi
    ? `${MUHURTA_HTML_HI.titleSuffix} — ${act} | Vedaansh`
    : `Muhurta Report — ${act} | Vedaansh`
  const h1 = hi ? `${MUHURTA_HTML_HI.titleSuffix} — ${act}` : `Muhurta Report — ${act}`
  const locLabel = hi ? MUHURTA_HTML_HI.location : 'Location'
  const genLabel = hi ? MUHURTA_HTML_HI.generated : 'Generated'
  const scoreLabel = hi ? MUHURTA_HTML_HI.score : 'Score'
  const peakH = hi ? MUHURTA_HTML_HI.peakFactors : 'Peak factors'
  const daysH = hi ? MUHURTA_HTML_HI.selectedDays : 'Selected days'
  const thDate = hi ? MUHURTA_HTML_HI.thDate : 'Date'
  const thGrade = hi ? MUHURTA_HTML_HI.thGrade : 'Grade'
  const thWin = hi ? MUHURTA_HTML_HI.thWindows : 'Windows'
  const thAvoid = hi ? MUHURTA_HTML_HI.thAvoid : 'Avoid'
  const footer = hi
    ? MUHURTA_HTML_HI.footer
    : 'Vedaansh Muhurta — classical panchanga election with personal overlays. Regional customs may differ. Not medical or legal advice.'

  return `<!DOCTYPE html>
<html lang="${htmlLang}">
<head>
  <meta charset="utf-8"/>
  <title>${esc(title)}</title>
  <style>
    body { font-family: ${hi ? 'Noto Sans Devanagari, ' : ''}Georgia, serif; color: #1a1a1a; max-width: 800px; margin: 2rem auto; padding: 0 1rem; }
    h1 { color: #8a6d1d; font-size: 1.75rem; margin-bottom: 0.25rem; }
    .meta { color: #666; font-size: 0.9rem; margin-bottom: 1.5rem; }
    .verdict { background: #f7f3e8; border: 1px solid #d4c08a; border-radius: 8px; padding: 1rem 1.25rem; margin-bottom: 1.5rem; }
    .verdict h2 { margin: 0 0 0.35rem; font-size: 1.15rem; }
    table { width: 100%; border-collapse: collapse; font-size: 0.85rem; }
    th, td { border: 1px solid #ddd; padding: 0.5rem 0.6rem; vertical-align: top; text-align: left; }
    th { background: #f5f5f5; }
    ul { font-size: 0.9rem; }
    footer { margin-top: 2rem; font-size: 0.75rem; color: #888; }
    @media print { body { margin: 0; } }
  </style>
</head>
<body>
  <h1>${esc(h1)}</h1>
  <p class="meta">${esc(locLabel)}: ${esc(input.locationName)}<br/>${esc(genLabel)}: ${esc(input.generatedAt)}</p>
  ${
    verdict
      ? `<div class="verdict"><h2>${esc(verdict.headline)}</h2><p>${esc(verdict.detail)}</p>
         <p><strong>${esc(scoreLabel)}:</strong> ${Math.round(input.peak!.score.score)} · ${esc(input.peak!.score.label)}</p></div>`
      : ''
  }
  ${input.personalNote ? `<p><em>${esc(input.personalNote)}</em></p>` : ''}
  ${
    factors
      ? `<h3>${esc(peakH)}</h3><ul>${factors}</ul>`
      : ''
  }
  ${
    days
      ? `<h3>${esc(daysH)}</h3>
         <table>
           <thead><tr><th>${esc(thDate)}</th><th>${esc(thGrade)}</th><th>${esc(thWin)}</th><th>${esc(thAvoid)}</th></tr></thead>
           <tbody>${days}</tbody>
         </table>`
      : ''
  }
  <footer>${esc(footer)}</footer>
</body>
</html>`
}
