/**
 * src/lib/pdf/muhurtaHtml.ts
 * Printable HTML report for a muhurta selection (open → print to PDF).
 */

import { MUHURTA_ACTIVITY_LABELS, type MuhurtaActivity, type MuhurtaScore } from '@/lib/engine/muhurtaAnalysis'
import { plainMuhurtaVerdict } from '@/lib/engine/muhurtaVerdict'

export interface MuhurtaReportInput {
  activity: MuhurtaActivity
  locationName: string
  generatedAt: string
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

export function generateMuhurtaHTML(input: MuhurtaReportInput): string {
  const act = MUHURTA_ACTIVITY_LABELS[input.activity]
  const verdict = input.peak
    ? plainMuhurtaVerdict(input.activity, input.peak.score, {
        timeLabel: new Date(input.peak.time).toLocaleString(),
      })
    : null

  const days = (input.dayResults ?? [])
    .slice(0, 12)
    .map(
      d => `
      <tr>
        <td>${d.date}</td>
        <td><strong>${d.grade}</strong> (${Math.round(d.score)})</td>
        <td>${d.windows.slice(0, 3).join('<br/>')}</td>
        <td>${d.avoid.slice(0, 3).join('<br/>')}</td>
      </tr>`,
    )
    .join('')

  const factors = (input.peak?.score.factors ?? [])
    .map(f => `<li>${f}</li>`)
    .join('')

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <title>Muhurta Report — ${act} | Vedaansh</title>
  <style>
    body { font-family: Georgia, serif; color: #1a1a1a; max-width: 800px; margin: 2rem auto; padding: 0 1rem; }
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
  <h1>Muhurta Report — ${act}</h1>
  <p class="meta">Location: ${input.locationName}<br/>Generated: ${input.generatedAt}</p>
  ${
    verdict
      ? `<div class="verdict"><h2>${verdict.headline}</h2><p>${verdict.detail}</p>
         <p><strong>Score:</strong> ${Math.round(input.peak!.score.score)} · ${input.peak!.score.label}</p></div>`
      : ''
  }
  ${input.personalNote ? `<p><em>${input.personalNote}</em></p>` : ''}
  ${
    factors
      ? `<h3>Peak factors</h3><ul>${factors}</ul>`
      : ''
  }
  ${
    days
      ? `<h3>Selected days</h3>
         <table>
           <thead><tr><th>Date</th><th>Grade</th><th>Windows</th><th>Avoid</th></tr></thead>
           <tbody>${days}</tbody>
         </table>`
      : ''
  }
  <footer>Vedaansh Muhurta — classical panchanga election with personal overlays. Regional customs may differ. Not medical or legal advice.</footer>
</body>
</html>`
}
