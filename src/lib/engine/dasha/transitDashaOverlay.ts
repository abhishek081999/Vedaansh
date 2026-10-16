// ─────────────────────────────────────────────────────────────
//  src/lib/engine/dasha/transitDashaOverlay.ts
//  Vimshottari MD/AD bands for Cosmic Roadmap / transit windows
// ─────────────────────────────────────────────────────────────

import type { DashaNode } from '@/types/astrology'
import { GRAHA_NAMES, type GrahaId } from '@/types/astrology'
import { getDashaPathAt } from '@/lib/engine/dasha/current'
import { getDashasBetween } from '@/lib/engine/dasha/vimshottari'

export interface DashaBandSegment {
  lord: string
  lordName: string
  start: Date
  end: Date
  level: 1 | 2
  /** Inclusive start as fraction of [windowStart, windowEnd] (0–1). */
  startFrac: number
  /** Exclusive end as fraction of [windowStart, windowEnd] (0–1). */
  endFrac: number
}

export interface TransitDashaOverlay {
  windowStart: Date
  windowEnd: Date
  maha: DashaBandSegment[]
  antar: DashaBandSegment[]
  currentPath: DashaNode[]
}

function toMs(value: Date | string | number): number {
  if (value instanceof Date) return value.getTime()
  if (typeof value === 'number') return value
  return new Date(value).getTime()
}

function lordDisplay(lord: string): string {
  return GRAHA_NAMES[lord as GrahaId] ?? lord
}

function clamp01(n: number): number {
  if (!Number.isFinite(n)) return 0
  return Math.min(1, Math.max(0, n))
}

function toBand(
  node: DashaNode,
  level: 1 | 2,
  windowStartMs: number,
  windowEndMs: number,
  spanMs: number,
): DashaBandSegment | null {
  const startMs = Math.max(toMs(node.start), windowStartMs)
  const endMs = Math.min(toMs(node.end), windowEndMs)
  if (endMs <= startMs || spanMs <= 0) return null
  return {
    lord: node.lord,
    lordName: lordDisplay(node.lord),
    start: new Date(startMs),
    end: new Date(endMs),
    level,
    startFrac: clamp01((startMs - windowStartMs) / spanMs),
    endFrac: clamp01((endMs - windowStartMs) / spanMs),
  }
}

/**
 * Build MD + AD segments clipped to a transit roadmap window.
 * Uses existing dasha tree children only (no regeneration).
 */
export function buildTransitDashaOverlay(
  nodes: DashaNode[],
  windowStart: Date,
  windowEnd: Date,
  now: number = Date.now(),
): TransitDashaOverlay {
  const from = windowStart
  const to = windowEnd
  const windowStartMs = toMs(from)
  const windowEndMs = toMs(to)
  const spanMs = Math.max(1, windowEndMs - windowStartMs)

  const mahaRaw = getDashasBetween(nodes, from, to, 1)
  const antarRaw = getDashasBetween(nodes, from, to, 2)

  const maha = mahaRaw
    .map(n => toBand(n, 1, windowStartMs, windowEndMs, spanMs))
    .filter((b): b is DashaBandSegment => b != null)
    .sort((a, b) => a.startFrac - b.startFrac)

  const antar = antarRaw
    .map(n => toBand(n, 2, windowStartMs, windowEndMs, spanMs))
    .filter((b): b is DashaBandSegment => b != null)
    .sort((a, b) => a.startFrac - b.startFrac)

  return {
    windowStart: from,
    windowEnd: to,
    maha,
    antar,
    currentPath: getDashaPathAt(nodes, now),
  }
}

/** Short MD/AD label at a moment (e.g. "Jupiter / Venus"). */
export function formatDashaPathAt(nodes: DashaNode[], at: Date | number): string {
  const path = getDashaPathAt(nodes, typeof at === 'number' ? at : at.getTime())
  if (path.length === 0) return ''
  const maha = lordDisplay(path[0].lord)
  const antar = path[1] ? lordDisplay(path[1].lord) : null
  return antar ? `${maha} / ${antar}` : maha
}

export function dashaLordsAt(
  nodes: DashaNode[],
  at: Date | number,
): { maha: string | null; antar: string | null } {
  const path = getDashaPathAt(nodes, typeof at === 'number' ? at : at.getTime())
  return {
    maha: path[0] ? lordDisplay(path[0].lord) : null,
    antar: path[1] ? lordDisplay(path[1].lord) : null,
  }
}
