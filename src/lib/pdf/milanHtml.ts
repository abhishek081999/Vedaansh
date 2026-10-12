// src/lib/pdf/milanHtml.ts
// Printable Kundali Milan report (open → Print / Save PDF).

import type { AshtakootResult } from '@/lib/engine/ashtakoot'
import type { PoruthamResult } from '@/lib/engine/porutham'
import type { MilanDeepResult } from '@/lib/engine/milanDeepAnalysis'
import type { ManglikPairVerdict, MarriageTimingResult, MilanRemedy, DualJaiminiMilan } from '@/lib/engine/milanSuite'

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

export interface MilanReportInput {
  boyName: string
  girlName: string
  ashtakoot: AshtakootResult
  porutham?: PoruthamResult | null
  deep?: MilanDeepResult | null
  manglik?: ManglikPairVerdict | null
  timing?: MarriageTimingResult | null
  remedies?: MilanRemedy[]
  jaimini?: DualJaiminiMilan | null
  branding?: string
}

export function generateMilanHTML(input: MilanReportInput): string {
  const brand = input.branding || 'Vedaansh'
  const a = input.ashtakoot
  const kootas = [
    ['Varna', a.varna], ['Vashya', a.vashya], ['Tara', a.tara], ['Yoni', a.yoni],
    ['Maitri', a.maitri], ['Gana', a.gana], ['Bhakoot', a.bhakoot], ['Nadi', a.nadi],
  ] as const

  const kootRows = kootas.map(([k, s]) =>
    `<tr><td>${esc(k)}</td><td>${esc(s.p1)}</td><td>${esc(s.p2)}</td><td>${s.points}/${s.max}</td><td>${esc(s.insight)}</td></tr>`,
  ).join('')

  const poruthamBlock = input.porutham
    ? `<h2>South Indian Porutham</h2>
       <p>${esc(input.porutham.summary)}</p>
       <table><thead><tr><th>Porutham</th><th>Match</th><th>Detail</th></tr></thead><tbody>
       ${input.porutham.items.map(i => `<tr><td>${esc(i.name)}</td><td>${i.matched ? 'Yes' : 'No'}</td><td>${esc(i.detail)}</td></tr>`).join('')}
       </tbody></table>`
    : ''

  const manglikBlock = input.manglik
    ? `<h2>Manglik (Kuja) Pair</h2><p><strong>${esc(input.manglik.label)}</strong> — ${esc(input.manglik.detail)}</p>`
    : ''

  const timingBlock = input.timing
    ? `<h2>Marriage Timing</h2><p>${esc(input.timing.summary)}</p>
       <table><thead><tr><th>Window</th><th>Groom</th><th>Bride</th><th>Note</th></tr></thead><tbody>
       ${input.timing.windows.slice(0, 5).map(w =>
         `<tr><td>${w.start} → ${w.end}</td><td>${esc(w.boyLords)}</td><td>${esc(w.girlLords)}</td><td>${esc(w.note)}</td></tr>`,
       ).join('')}
       </tbody></table>`
    : ''

  const remedyBlock = input.remedies?.length
    ? `<h2>Remedies</h2><ul>${input.remedies.map(r =>
        `<li><strong>${esc(r.title)}</strong> (${esc(r.forDosha)}) — ${esc(r.detail)}</li>`,
      ).join('')}</ul>`
    : ''

  const jaiminiBlock = input.jaimini
    ? `<h2>D9 / Jaimini Marriage Snapshot</h2><p>${esc(input.jaimini.summary)}</p>`
    : ''

  const deepBlock = input.deep
    ? `<h2>Deep Milan</h2>
       <p>${esc(input.deep.overall.stageLabel)} — ${esc(input.deep.overall.summary)}</p>
       <p>${esc(input.deep.longevityYogas.summary)}</p>
       <p>${esc(input.deep.varnamala.summary)}</p>`
    : ''

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <title>Kundali Milan — ${esc(input.boyName)} × ${esc(input.girlName)} | ${esc(brand)}</title>
  <style>
    body { font-family: Georgia, serif; color: #1a1a1a; max-width: 900px; margin: 2rem auto; padding: 0 1rem; line-height: 1.5; }
    h1 { color: #8a6d1d; font-size: 1.65rem; margin-bottom: 0.2rem; }
    h2 { color: #8a6d1d; font-size: 1.1rem; margin-top: 1.6rem; border-bottom: 1px solid #e5d9b0; padding-bottom: 0.25rem; }
    .meta { color: #666; font-size: 0.9rem; margin-bottom: 1rem; }
    .score { font-size: 2rem; font-weight: 800; color: #8a6d1d; }
    table { width: 100%; border-collapse: collapse; font-size: 0.82rem; margin-top: 0.5rem; }
    th, td { border: 1px solid #ddd; padding: 0.4rem 0.5rem; text-align: left; vertical-align: top; }
    th { background: #f5f5f5; }
    footer { margin-top: 2rem; font-size: 0.75rem; color: #888; }
    button { background: #8a6d1d; color: #fff; border: none; padding: 0.55rem 1rem; border-radius: 6px; cursor: pointer; margin-bottom: 1rem; }
    @media print { button { display: none; } body { margin: 0; } }
  </style>
</head>
<body>
  <button onclick="window.print()">Print / Save PDF</button>
  <h1>Kundali Milan Report</h1>
  <p class="meta">${esc(brand)} · ${esc(input.boyName)} (Groom) × ${esc(input.girlName)} (Bride) · ${new Date().toLocaleString()}</p>
  <p class="score">${a.total} / 36</p>
  <p>${esc(a.eligibility.label)} — ${esc(a.eligibility.detail)}</p>
  <p><em>${esc(a.disclaimer)}</em></p>

  <h2>Ashtakoot Guna Milan</h2>
  <table><thead><tr><th>Koota</th><th>Groom</th><th>Bride</th><th>Score</th><th>Insight</th></tr></thead>
  <tbody>${kootRows}</tbody></table>

  ${poruthamBlock}
  ${manglikBlock}
  ${jaiminiBlock}
  ${deepBlock}
  ${timingBlock}
  ${remedyBlock}

  <footer>Educational Jyotish summary. Ashtakoot is Moon–Nakshatra Stage 1 only. Confirm with a qualified astrologer before marriage decisions.</footer>
</body>
</html>`
}
