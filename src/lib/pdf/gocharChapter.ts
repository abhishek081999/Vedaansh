// ─────────────────────────────────────────────────────────────
//  src/lib/pdf/gocharChapter.ts
//  Gochar chapter HTML fragment for the chart PDF dossier
// ─────────────────────────────────────────────────────────────

import type { ChartOutput, Rashi } from '@/types/astrology'
import { GRAHA_NAMES, RASHI_NAMES } from '@/types/astrology'
import { getCurrentTransitPositions } from '@/lib/engine/transits'
import { analyzeSadeSati } from '@/lib/engine/sadeSati'
import { analyzeMoorthyNirnaya } from '@/lib/engine/moorthyNirnaya'
import { analyzeTransitAspects } from '@/lib/engine/transitAspects'

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/**
 * Build HTML for the Gochar (transit) chapter page.
 * Caller wraps with page chrome / footer.
 */
export function buildGocharChapterHtml(chart: ChartOutput): string {
  const moon = chart.grahas.find(g => g.id === 'Mo')
  const moonRashi = (moon?.rashi ?? 1) as Rashi
  const ascRashi = chart.lagnas.ascRashi as Rashi
  const asOf = new Date()

  const positions = getCurrentTransitPositions(ascRashi, asOf)
  const sade = analyzeSadeSati(moonRashi, { asOf, ascRashi, lookbackYears: 2, lookAheadYears: 8 })
  const moorthy = analyzeMoorthyNirnaya(asOf)

  const natalRashis = Object.fromEntries(
    chart.grahas
      .filter(g => ['Su', 'Mo', 'Ma', 'Me', 'Ju', 'Ve', 'Sa', 'Ra', 'Ke'].includes(g.id))
      .map(g => [g.id, g.rashi]),
  ) as Parameters<typeof analyzeTransitAspects>[0]['natalRashis']

  const aspects = analyzeTransitAspects({
    ascRashi,
    natalRashis,
    asOf,
    months: 12,
  })

  const posRows = positions.map(p => `
    <tr>
      <td>${GRAHA_NAMES[p.planetId]}</td>
      <td>${RASHI_NAMES[p.sign]}</td>
      <td>H${p.house}</td>
      <td>${p.nakshatra} P${p.pada}</td>
      <td>${p.isRetro ? 'Rx' : 'Direct'}</td>
    </tr>
  `).join('')

  const moorthyRows = moorthy.map(m => `
    <tr>
      <td>${m.planetName}</td>
      <td>${m.rashiName}</td>
      <td>${m.metalLabel}</td>
      <td>${m.weekday} (${m.ingressIso})</td>
    </tr>
  `).join('')

  const multi = aspects.nowMulti.slice(0, 4).map(w =>
    `<li><strong>${escapeHtml(w.gradeLabel)}</strong> on ${escapeHtml(w.targetLabel)} — ${escapeHtml(w.transitLordNames.join(' + '))}</li>`,
  ).join('') || '<li>No double/triple transit active today.</li>'

  const upcoming = aspects.multiWindows.filter(w => !w.isCurrent).slice(0, 4).map(w =>
    `<li>${escapeHtml(w.startIso)}: ${escapeHtml(w.gradeLabel)} on ${escapeHtml(w.targetLabel)}</li>`,
  ).join('') || '<li>No upcoming multi-transit windows in the next year sample.</li>'

  return `
  <p style="margin-bottom: 0.8rem; font-size: 12px; line-height: 1.6">
    Personal gochar snapshot for <strong>${escapeHtml(asOf.toISOString().slice(0, 10))}</strong>
    from Lagna <strong>${RASHI_NAMES[ascRashi]}</strong> and Moon in <strong>${RASHI_NAMES[moonRashi]}</strong>.
    Pair every window with Vimshottari dasha before acting.
  </p>

  <h3 style="margin: 1rem 0 0.5rem; font-size: 13px">Current transit positions (from Lagna)</h3>
  <table class="data-table">
    <thead><tr><th>Graha</th><th>Sign</th><th>House</th><th>Nakshatra</th><th>Motion</th></tr></thead>
    <tbody>${posRows}</tbody>
  </table>

  <div style="display:grid; grid-template-columns:1fr 1fr; gap:1.2rem; margin-top:1.2rem">
    <div style="padding:12px; border:1px solid #ddd; border-radius:4px">
      <h3 style="margin:0 0 8px; font-size:13px">Saturn–Moon (Sade Sati family)</h3>
      <div style="font-weight:800; font-size:12px; margin-bottom:6px">${escapeHtml(sade.now.label)}</div>
      <p style="font-size:11px; line-height:1.55; margin:0">${escapeHtml(sade.now.summary)}</p>
      ${sade.currentCycle ? `<p style="font-size:10px; color:#666; margin:8px 0 0">Active cycle ${sade.currentCycle.startIso} → ${sade.currentCycle.endIso} (${sade.currentCycle.progressPct}%)</p>` : ''}
      ${sade.softeners.map(s => `<p style="font-size:10px; color:#0a6; margin:6px 0 0">${escapeHtml(s.detail)}</p>`).join('')}
    </div>
    <div style="padding:12px; border:1px solid #ddd; border-radius:4px">
      <h3 style="margin:0 0 8px; font-size:13px">Moorthy Nirnaya (Ju / Sa)</h3>
      <table class="data-table" style="font-size:10px">
        <thead><tr><th>Planet</th><th>Sign</th><th>Moorthy</th><th>Ingress</th></tr></thead>
        <tbody>${moorthyRows}</tbody>
      </table>
    </div>
  </div>

  <h3 style="margin: 1.2rem 0 0.5rem; font-size: 13px">Multi-transit & aspects</h3>
  <p style="font-size:11px; margin:0 0 6px">${escapeHtml(aspects.summary)}</p>
  <div style="display:grid; grid-template-columns:1fr 1fr; gap:1.2rem">
    <div>
      <div style="font-size:10px; font-weight:700; margin-bottom:4px; text-transform:uppercase; letter-spacing:0.04em; color:#666">Active now</div>
      <ul style="font-size:11px; line-height:1.5; margin:0; padding-left:1.1rem">${multi}</ul>
    </div>
    <div>
      <div style="font-size:10px; font-weight:700; margin-bottom:4px; text-transform:uppercase; letter-spacing:0.04em; color:#666">Upcoming</div>
      <ul style="font-size:11px; line-height:1.5; margin:0; padding-left:1.1rem">${upcoming}</ul>
    </div>
  </div>

  <p style="margin-top:1rem; font-size:10px; color:#888; line-height:1.5">
    For the interactive Cosmic Roadmap, Sade Sati tracker, Aspects, Bi-wheel, and monthly calendar, open Transit in Vedaansh.
  </p>
`
}
