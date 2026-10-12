/**
 * src/lib/pdf/numerologyHtml.ts
 * Printable HTML report for Vedic Numerology (open → print to PDF).
 */

import type { NumerologyReport } from '@/lib/engine/numerology/calc'
import { NUMBER_PROFILES } from '@/lib/engine/numerology/data'
import { getCheiroLabels } from '@/lib/engine/numerology/advanced'

export function generateNumerologyHTML(report: NumerologyReport, opts?: { title?: string; branding?: string }): string {
  const name = opts?.title || report.name?.words.map(w => w.word).join(' ') || 'Numerology Report'
  const cheiro = getCheiroLabels(report.moolank.value, report.bhagyank.value)
  const m = NUMBER_PROFILES[report.moolank.value]
  const b = NUMBER_PROFILES[report.bhagyank.value]
  const areas = report.predictions.lifeAreas
    .map(a => `<tr><td>${a.label}</td><td>${a.tone}</td><td>${a.summary}</td></tr>`)
    .join('')
  const remedies = report.remedies.items.slice(0, 12)
    .map(i => `<li><strong>[${i.priority}]</strong> ${i.title} — ${i.detail}</li>`)
    .join('')
  const years = report.upcomingYears
    .map(y => `<tr><td>${y.year}</td><td>${y.personalYear}</td><td>${y.theme}</td><td>${y.harmony}</td></tr>`)
    .join('')

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <title>Vedic Numerology — ${escapeHtml(name)} | Vedaansh</title>
  <style>
    body { font-family: Georgia, serif; color: #1a1a1a; max-width: 860px; margin: 2rem auto; padding: 0 1rem; line-height: 1.5; }
    h1 { color: #8a6d1d; font-size: 1.7rem; margin-bottom: 0.2rem; }
    h2 { color: #8a6d1d; font-size: 1.15rem; margin-top: 1.75rem; border-bottom: 1px solid #e5d9b0; padding-bottom: 0.25rem; }
    .meta { color: #666; font-size: 0.9rem; margin-bottom: 1.25rem; }
    .cards { display: flex; gap: 1rem; flex-wrap: wrap; }
    .card { border: 1px solid #d4c08a; background: #f7f3e8; border-radius: 8px; padding: 0.85rem 1rem; min-width: 140px; }
    .card strong { font-size: 1.6rem; color: #8a6d1d; display: block; }
    table { width: 100%; border-collapse: collapse; font-size: 0.85rem; margin-top: 0.5rem; }
    th, td { border: 1px solid #ddd; padding: 0.4rem 0.55rem; text-align: left; vertical-align: top; }
    th { background: #f5f5f5; }
    ul { font-size: 0.88rem; }
    footer { margin-top: 2rem; font-size: 0.75rem; color: #888; }
    @media print {
      body { margin: 0; }
      button { display: none; }
    }
    button { background: #8a6d1d; color: #fff; border: none; padding: 0.6rem 1.1rem; border-radius: 6px; cursor: pointer; margin-bottom: 1rem; }
  </style>
</head>
<body>
  <button onclick="window.print()">Print / Save PDF</button>
  <h1>Vedic Numerology Report</h1>
  <p class="meta">${escapeHtml(opts?.branding || 'Vedaansh')} · ${escapeHtml(name)} · DOB ${report.date.year}-${String(report.date.month).padStart(2,'0')}-${String(report.date.day).padStart(2,'0')} · Generated ${new Date().toLocaleString()}</p>

  <div class="cards">
    <div class="card"><strong>${report.moolank.value}</strong>Moolank / Driver<br/>${escapeHtml(m.planet)}</div>
    <div class="card"><strong>${report.bhagyank.value}</strong>Bhagyank / Conductor<br/>${escapeHtml(b.planet)}</div>
    ${report.name ? `<div class="card"><strong>${report.name.value}</strong>Namank<br/>Compound ${report.name.compound}</div>` : ''}
    <div class="card"><strong>${cheiro.essence}</strong>Essence<br/>${escapeHtml(NUMBER_PROFILES[cheiro.essence].planet)}</div>
  </div>

  <h2>Number harmony</h2>
  <p>Moolank ↔ Bhagyank: <strong>${report.coreHarmony}</strong>. ${escapeHtml(cheiro.note)}</p>

  <h2>Life area predictions</h2>
  <table><thead><tr><th>Area</th><th>Tone</th><th>Summary</th></tr></thead><tbody>${areas}</tbody></table>

  <h2>Personal year ${report.cycles.personalYear}</h2>
  <p>${escapeHtml(report.predictions.annual.overview)}</p>
  <table><thead><tr><th>Year</th><th>PY</th><th>Theme</th><th>Harmony</th></tr></thead><tbody>${years}</tbody></table>

  <h2>Remedies (top actions)</h2>
  <p>${escapeHtml(report.remedies.summary)}</p>
  <ul>${remedies}</ul>

  <h2>Lucky dates (best)</h2>
  <p>${report.luckyDates.best.join(', ') || '—'}</p>

  <footer>Educational Anka Jyotish summary. Confirm major decisions with full Jyotish (dasha + gochara) and a qualified astrologer.</footer>
</body>
</html>`
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}
