// ─────────────────────────────────────────────────────────────
//  src/lib/chart/tags.ts
//  Normalize and validate chart hashtag labels
// ─────────────────────────────────────────────────────────────

import { z } from 'zod'

export const chartTagsSchema = z
  .array(z.string().trim().min(1).max(50))
  .max(20)
  .optional()

/** Strip #, lowercase, dedupe — e.g. "#Career" → "career" */
export function normalizeTags(raw: string[]): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  for (const t of raw) {
    const norm = t.trim().replace(/^#+/, '').toLowerCase()
    if (!norm || seen.has(norm)) continue
    seen.add(norm)
    out.push(norm)
    if (out.length >= 20) break
  }
  return out
}

/** Display form with leading # */
export function formatTagLabel(tag: string): string {
  return tag.startsWith('#') ? tag : `#${tag}`
}
