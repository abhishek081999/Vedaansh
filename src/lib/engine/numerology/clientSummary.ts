// ─────────────────────────────────────────────────────────────
//  src/lib/engine/numerology/clientSummary.ts
//  Plain-text numerology snapshot for a CRM client note, and the
//  remedies worth carrying into the client's remedy tracker.
//  Server-only (uses the Gold layer).
// ─────────────────────────────────────────────────────────────

import { NUMBER_PROFILES } from './data'
import type { NumerologyReport } from './calc'
import type { RemedyItem } from './remedies'
import { getNameDepth } from './nameDepth'

export function buildClientNumerologyNote(report: NumerologyReport, nameUsed: string | null): string {
  const m = report.moolank.value, b = report.bhagyank.value
  const lines = [
    `Numerology snapshot (${report.today.year}-${String(report.today.month).padStart(2, '0')}-${String(report.today.day).padStart(2, '0')})`,
    `Moolank ${m} (${NUMBER_PROFILES[m].planet}) · Bhagyank ${b} (${NUMBER_PROFILES[b].planet}) · core harmony ${report.coreHarmony}`,
  ]
  if (report.name && nameUsed) {
    lines.push(`Namank ${report.name.value} for "${nameUsed}" (compound ${report.name.compound}${report.name.compoundMeaning ? `, ${report.name.compoundMeaning.title}` : ''})`)
    const depth = getNameDepth(nameUsed)
    if (depth?.karmicLessons.length) lines.push(`Karmic lessons: ${depth.karmicLessons.map(k => k.number).join(', ')}`)
  }
  if (report.kua) lines.push(`Kua ${report.kua.value} (${report.kua.group}) · success ${report.kua.directions.success}`)
  lines.push(`Personal year ${report.cycles.personalYear}: ${report.cycles.yearTheme.theme}`)
  if (report.grid.missing.length) lines.push(`Missing numbers: ${report.grid.missing.map(x => x.number).join(', ')}`)
  if (report.karmicDebts.length) lines.push(`Karmic debt: ${report.karmicDebts.map(k => `${k.number} (${k.source})`).join(', ')}`)
  const yogas = report.predictions.yogas.filter(y => y.present).map(y => y.name)
  if (yogas.length) lines.push(`Number yogas: ${yogas.join(', ')}`)
  lines.push('', report.predictions.annual.overview, '', `Remedies: ${report.remedies.summary}`)
  return lines.join('\n')
}

/** Urgent first, then important; at most `limit`, skipping titles the client already has. */
export function pickClientRemedies(report: NumerologyReport, existingTitles: string[], limit = 5): RemedyItem[] {
  const have = new Set(existingTitles.map(t => t.trim().toLowerCase()))
  const rank = { urgent: 0, important: 1, supportive: 2 } as const
  return report.remedies.items
    .filter(i => i.priority !== 'supportive' && !have.has(i.title.trim().toLowerCase()))
    .sort((a, b) => rank[a.priority] - rank[b.priority])
    .slice(0, limit)
}
