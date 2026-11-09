// ─────────────────────────────────────────────────────────────
//  src/i18n/messages.ts
//  Message catalogues live in messages/<locale>/<namespace>.json.
//  English is the source of truth; any key missing from Hindi falls
//  back to English, so a page is never blank while it is being
//  translated (the parity test still reports the gap).
// ─────────────────────────────────────────────────────────────
import type { AppLocale } from './config'
import { DEFAULT_LOCALE } from './config'

/** Every namespace, one JSON file each per locale. Add new ones here. */
export const NAMESPACES = [
  'common', 'nav', 'home', 'panchang', 'horoscope', 'today', 'chart',
  // Chart workspace tabs, one file per area so parallel work never edits the same JSON.
  'dashaPanel', 'planetsA', 'planetsB', 'houseGuide', 'divisional', 'chartTools',
  'relationshipMarriage',
  'careerProfession',
  'compare',
  'muhurta',
  'transit',
] as const
export type Namespace = (typeof NAMESPACES)[number]

/**
 * Namespaces sent to the browser by the root layout. Keep this small:
 * feature pages pass their own namespaces through a nested
 * NextIntlClientProvider (see IntlScope) instead of growing this list.
 */
// 'chart' holds the birth form and chart widgets, which appear on many pages.
export const ROOT_CLIENT_NAMESPACES: Namespace[] = [
  'common', 'nav', 'home', 'horoscope', 'chart',
  'dashaPanel', 'planetsA', 'planetsB', 'houseGuide', 'divisional', 'chartTools',
]

export type Messages = Record<string, unknown>

async function loadCatalogue(locale: AppLocale): Promise<Messages> {
  const entries = await Promise.all(
    NAMESPACES.map(async (ns) => {
      try {
        const mod = await import(`../../messages/${locale}/${ns}.json`)
        return [ns, (mod.default ?? mod) as Messages] as const
      } catch {
        return [ns, {}] as const
      }
    }),
  )
  return Object.fromEntries(entries)
}

function isPlainObject(value: unknown): value is Messages {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/** Deep-merge `override` onto `base`; override wins wherever it has a value. */
export function mergeMessages(base: Messages, override: Messages): Messages {
  const out: Messages = { ...base }
  for (const [key, value] of Object.entries(override)) {
    const prev = out[key]
    out[key] = isPlainObject(prev) && isPlainObject(value) ? mergeMessages(prev, value) : value
  }
  return out
}

export async function loadMessages(locale: AppLocale): Promise<Messages> {
  const base = await loadCatalogue(DEFAULT_LOCALE)
  if (locale === DEFAULT_LOCALE) return base
  return mergeMessages(base, await loadCatalogue(locale))
}

export function pickNamespaces(messages: Messages, namespaces: readonly string[]): Messages {
  return Object.fromEntries(namespaces.filter((ns) => ns in messages).map((ns) => [ns, messages[ns]]))
}
