// Deep text overlay for the Planets-tab engine results (Sun, Moon, Mars,
// Mercury, Jupiter). A Hindi table mirrors the English record but holds
// only display strings: ids, enums and numbers are never in it, so they
// always come from the English side.

/** Same shape as T, but only string leaves (all optional). */
export type TextOf<T> = T extends string
  ? string
  : T extends readonly (infer U)[]
    ? ReadonlyArray<TextOf<U> | undefined>
    : T extends object
      ? { readonly [K in keyof T]?: TextOf<T[K]> }
      : never

/** Replace string leaves of `en` with those found in `hi`; everything else is kept. */
export function mergeHi<T>(en: T, hi: TextOf<T> | undefined): T {
  if (hi === undefined || hi === null) return en
  if (typeof en === 'string') return (typeof hi === 'string' ? hi : en) as T
  if (Array.isArray(en)) {
    const h = hi as ReadonlyArray<unknown>
    return en.map((v, i) => mergeHi(v, h[i] as never)) as T
  }
  if (en && typeof en === 'object') {
    const out: Record<string, unknown> = { ...(en as Record<string, unknown>) }
    for (const [k, v] of Object.entries(hi as Record<string, unknown>)) {
      if (k in out) out[k] = mergeHi(out[k], v as never)
    }
    return out as T
  }
  return en
}

/** Oblique ordinal for "{n} भाव में" phrasing. */
const ORD = ['', 'पहले', 'दूसरे', 'तीसरे', 'चौथे', 'पाँचवें', 'छठे', 'सातवें', 'आठवें', 'नौवें', 'दसवें', 'ग्यारहवें', 'बारहवें']
export function ordObl(n: number): string {
  return ORD[n] ?? `${n}वें`
}

/** Dignity labels (engine ids → Hindi). */
export const DIGNITY_LABEL_HI: Record<string, string> = {
  exalted: 'उच्च',
  moolatrikona: 'मूलत्रिकोण',
  own: 'स्वराशि',
  great_friend: 'अधिमित्र',
  friend: 'मित्र राशि',
  neutral: 'सम',
  enemy: 'शत्रु राशि',
  great_enemy: 'अधिशत्रु',
  debilitated: 'नीच',
}

export function dignityHi(d: string | undefined | null): string {
  const key = d || 'neutral'
  return DIGNITY_LABEL_HI[key] ?? key.replace('_', ' ')
}

/** True when the text contains Devanagari. */
export function hasDevanagari(s: string): boolean {
  return /[ऀ-ॿ]/.test(s)
}
