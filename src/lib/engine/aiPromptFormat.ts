// ─────────────────────────────────────────────────────────────
//  src/lib/engine/aiPromptFormat.ts
//  Shared Markdown formatters and lookup tables for the AI prompt
//  builders (aiPrompt.ts, aiPromptTopics.ts). Pure.
// ─────────────────────────────────────────────────────────────

import { GRAHA_NAMES, RASHI_NAMES, type GrahaData, type GrahaId, type Rashi } from '@/types/astrology'

export const RASHI_LORD: Record<Rashi, GrahaId> = {
  1: 'Ma', 2: 'Ve', 3: 'Me', 4: 'Mo', 5: 'Su', 6: 'Me',
  7: 'Ve', 8: 'Ma', 9: 'Ju', 10: 'Sa', 11: 'Sa', 12: 'Ju',
}

export const CLASSICAL: GrahaId[] = ['Su', 'Mo', 'Ma', 'Me', 'Ju', 'Ve', 'Sa', 'Ra', 'Ke']

export const KEY_VARGAS: Record<string, string> = {
  D1: 'Rashi (overall life)',
  D2: 'Hora (wealth)',
  D3: 'Drekkana (siblings, courage)',
  D4: 'Chaturthamsha (property, fortune)',
  D7: 'Saptamsha (children)',
  D9: 'Navamsha (spouse, dharma, inner strength)',
  D10: 'Dashamsha (career)',
  D12: 'Dwadashamsha (parents)',
  D16: 'Shodashamsha (vehicles, comforts)',
  D20: 'Vimshamsha (spiritual practice)',
  D24: 'Chaturvimshamsha (education)',
  D27: 'Bhamsha (strengths, weaknesses)',
  D30: 'Trimshamsha (misfortune, health)',
  D40: 'Khavedamsha (maternal legacy)',
  D45: 'Akshavedamsha (paternal legacy, character)',
  D60: 'Shashtiamsha (past karma)',
}

export const DASHA_LABELS: Record<string, string> = {
  vimshottari: 'Vimshottari',
  yogini: 'Yogini',
  ashtottari: 'Ashtottari',
  kalachakra: 'Kalachakra',
  chara: 'Jaimini Chara',
  chara_fe: 'Chara (FE)',
  mandook: 'Mandooka',
  sthir: 'Sthira',
  navamsha: 'Navamsha',
  brahma: 'Brahma',
  narayana: 'Narayana',
  tithi_ashtottari: 'Tithi Ashtottari',
  naisargika: 'Naisargika',
}

export const LEVEL_NAMES = ['Mahadasha', 'Antardasha', 'Pratyantardasha', 'Sookshma', 'Prana', 'Deha']

// ── small formatters ─────────────────────────────────────────

export function dms(deg: number | undefined): string {
  if (deg == null || !Number.isFinite(deg)) return '—'
  const d = Math.floor(deg)
  const mFloat = (deg - d) * 60
  const m = Math.floor(mFloat)
  const s = Math.round((mFloat - m) * 60)
  return `${d}°${String(m).padStart(2, '0')}'${String(s === 60 ? 59 : s).padStart(2, '0')}"`
}

/** Absolute sidereal longitude → "Leo 12°04'10"". */
export function signPos(lon: number | undefined): string {
  if (lon == null || !Number.isFinite(lon)) return '—'
  const norm = ((lon % 360) + 360) % 360
  const rashi = (Math.floor(norm / 30) + 1) as Rashi
  return `${RASHI_NAMES[rashi]} ${dms(norm % 30)}`
}

export function day(value: Date | string | number | undefined | null): string {
  if (value == null) return '—'
  const d = value instanceof Date ? value : new Date(value)
  return Number.isFinite(d.getTime()) ? d.toISOString().slice(0, 10) : '—'
}

export function time(value: Date | string | number | undefined | null, tz?: string): string {
  if (value == null) return '—'
  const d = value instanceof Date ? value : new Date(value)
  if (!Number.isFinite(d.getTime())) return '—'
  try {
    return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: tz })
  } catch {
    return d.toISOString().slice(11, 16) + ' UTC'
  }
}

export function gname(id: string | null | undefined): string {
  if (!id) return '—'
  return GRAHA_NAMES[id as GrahaId] ?? id
}

export function cell(v: unknown): string {
  return String(v ?? '—').replace(/\|/g, '/').replace(/\s+/g, ' ').trim()
}

export function table(head: string[], rows: unknown[][]): string {
  return [
    `| ${head.join(' | ')} |`,
    `| ${head.map(() => '---').join(' | ')} |`,
    ...rows.map((r) => `| ${r.map(cell).join(' | ')} |`),
  ].join('\n')
}

export function num(v: number | undefined, digits = 2): string {
  return v == null || !Number.isFinite(v) ? '—' : v.toFixed(digits)
}

export function houseFrom(asc: Rashi, rashi: Rashi): number {
  return ((rashi - asc + 12) % 12) + 1
}

// ── graha drishti (whole-sign Parashari aspects) ─────────────

/** Houses counted from the planet that it aspects. Every planet has the 7th;
 *  Mars, Jupiter and Saturn have their special aspects. Rahu/Ketu are given
 *  5/7/9 (common practice; some schools use only the 7th). */
export const ASPECT_OFFSETS: Partial<Record<GrahaId, number[]>> = {
  Ma: [4, 7, 8],
  Ju: [5, 7, 9],
  Sa: [3, 7, 10],
  Ra: [5, 7, 9],
  Ke: [5, 7, 9],
}

export const DRISHTI_NOTE =
  'Aspects are whole-sign graha drishti: every planet aspects the 7th sign from itself; Mars also the 4th and 8th, Jupiter the 5th and 9th, Saturn the 3rd and 10th; Rahu and Ketu are given 5th, 7th and 9th (some schools use only the 7th).'

export function signOfHouse(asc: Rashi, house: number): Rashi {
  return ((((asc - 1) + (house - 1)) % 12) + 1) as Rashi
}

export function aspectOffsets(id: GrahaId): number[] {
  return ASPECT_OFFSETS[id] ?? [7]
}

/** True when planet g casts a full aspect on the sign `rashi`. */
export function aspectsSign(g: GrahaData, rashi: Rashi): boolean {
  return aspectOffsets(g.id).includes(houseFrom(g.rashi, rashi))
}

/** Classical planets (not in that sign) aspecting `rashi`, excluding `except`. */
export function aspectersOf(grahas: GrahaData[], rashi: Rashi, except?: GrahaId): GrahaData[] {
  return grahas.filter((g) => CLASSICAL.includes(g.id) && g.id !== except && !isNodePair(g.id, except) && g.rashi !== rashi && aspectsSign(g, rashi))
}

/** Rahu and Ketu are always opposite; their "aspect" on each other is not read. */
export function isNodePair(a?: GrahaId, b?: GrahaId): boolean {
  return (a === 'Ra' && b === 'Ke') || (a === 'Ke' && b === 'Ra')
}

/** Planets sharing a sign with g (conjunction). */
export function conjunctWith(grahas: GrahaData[], g: GrahaData): GrahaData[] {
  return grahas.filter((x) => CLASSICAL.includes(x.id) && x.id !== g.id && x.rashi === g.rashi)
}

// ── Shadbala in rupas ────────────────────────────────────────

export interface ShadbalaLike {
  total: number
  required: number
  ratio?: number
  isStrong?: boolean
  qualityBand?: string
}

/** "8.28 of 7.00 rupas (118%, strong)": total vs the BPHS minimum, never a bare ratio. */
export function shadbalaRupas(p: ShadbalaLike | undefined | null): string {
  if (!p || !Number.isFinite(p.total) || !Number.isFinite(p.required) || p.required <= 0) return '—'
  const pct = Math.round((p.total / p.required) * 100)
  const verdict = p.qualityBand ?? (p.isStrong ? 'strong' : 'weak')
  return `${num(p.total, 2)} of ${num(p.required, 2)} rupas (${pct}%, ${verdict})`
}

export const SHADBALA_NOTE = [
  'Shadbala is measured in **rupas** (1 rupa = 60 virupas). Each planet has a classical minimum from BPHS: Sun 6.5, Moon 6, Mars 5, Mercury 7, Jupiter 6.5, Venus 5.5, Saturn 5.',
  '"% of minimum" = total ÷ minimum. 100% or more means the planet meets its minimum and can deliver its results; below 100% means it is weak by Shadbala.',
  'When you quote Shadbala, always give rupas against the minimum, for example "Mercury 8.28 rupas (needs 7.00, 118%)". Do not quote a bare ratio such as 1.18.',
].join(' ')
