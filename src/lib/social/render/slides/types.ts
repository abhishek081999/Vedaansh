/**
 * Slide specs are plain data: templates describe WHAT is on a slide, the renderer decides
 * WHERE for the chosen frame (4:5 / 1:1 / 9:16). Keep everything serialisable.
 */
import type { GrahaId } from '@/types/astrology'
import type { Tone } from '@/lib/social/render/theme'

export type Lead =
  | { kind: 'planet'; id: GrahaId }
  | { kind: 'medallion'; text: string; font?: 'deva' | 'sym' | 'serif' }
  | { kind: 'swatch'; color: string }

export interface Row {
  title: string
  note?: string
  right?: string
  tone?: Tone
  lead?: Lead
}

export interface Tile {
  label: string
  value: string
  detail?: string
  tone?: Tone
  lead?: Lead
}

export interface Heading {
  kicker?: string
  deva?: string
  title: string
  sub?: string
}

export type Hero =
  | { kind: 'wheel'; planets?: { id: GrahaId; lon: number }[]; highlightNak?: number | null; highlightRashi?: number | null }
  | { kind: 'nakRing'; idx: number; moonLon?: number; big: string; small: string }
  | { kind: 'dayRing'; day: RingSlot[]; night: RingSlot[]; big: string; small: string }
  | { kind: 'glyph'; glyph: string; font?: 'sym' | 'deva' | 'serif' }
  | { kind: 'lotus'; planet?: GrahaId; glyph?: string }

export interface RingSlot {
  tone: Tone
  start: string
  end: string
}

export interface SignCell {
  rashi: number
  value: string
  sub?: string
  swatch?: string
  tone?: Tone
}

export interface RashiCard {
  rashi: number
  english: string
  sanskrit: string
  deva: string
  dateLabel: string
  score: number
  tone: Tone
  toneLabel: string
  headline: string
  summary?: string
  areas: { label: string; score: number; tone: Tone }[]
  lucky: { color: string; swatch: string; number: number; direction: string }
  karya: string[]
  varjya: string[]
}

export interface WeekRow {
  rashi: number
  scores: number[]
  tones: Tone[]
  note?: string
}

export type SlideSpec =
  | { type: 'cover'; head: Heading; hero: Hero; meta?: string; tiles?: Tile[] }
  | { type: 'list'; head: Heading; sections: { heading?: string; rows: Row[] }[]; note?: string }
  | { type: 'tiles'; head: Heading; tiles: Tile[]; cols: 2 | 3; note?: string }
  | { type: 'signGrid'; head: Heading; cells: SignCell[]; note?: string }
  | { type: 'rashi'; card: RashiCard }
  | { type: 'weekGrid'; head: Heading; days: string[]; rows: WeekRow[]; note?: string }
  | { type: 'text'; head: Heading; hero?: Hero; paragraphs: string[]; bullets?: { title?: string; tone?: Tone; items: string[] }[] }
  | { type: 'quote'; head?: Heading; quote: string; deva?: boolean; translation?: string; attribution?: string }
  | { type: 'cta'; title: string; deva?: string; lines: string[] }

export interface BrandSettings {
  name: string
  handle: string
  ctaLine: string
}
