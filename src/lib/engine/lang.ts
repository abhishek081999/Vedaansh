// ─────────────────────────────────────────────────────────────
//  src/lib/engine/lang.ts
//  Output language for engine text. Engine getters that return
//  human-readable strings take an optional `lang` (default 'en') and
//  read Hindi from a same-shaped table in src/lib/engine/locale/*.hi.ts.
//  Ids, enums and anything code compares stay English in every language.
// ─────────────────────────────────────────────────────────────

export type EngineLang = 'en' | 'hi'

/**
 * Overlay translated fields onto an English record. Only string fields
 * present in `hi` are replaced, so ids and numbers always survive.
 */
export function overlay<T extends object>(en: T, hi: Partial<Record<keyof T, string>> | undefined, lang: EngineLang): T {
  if (lang !== 'hi' || !hi) return en
  const out = { ...en } as Record<string, unknown>
  for (const [key, value] of Object.entries(hi)) {
    if (typeof value === 'string' && typeof out[key] === 'string') out[key] = value
  }
  return out as T
}

/** Fill `{name}` slots in a template. */
export function fill(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, k: string) => (k in values ? String(values[k]) : `{${k}}`))
}
