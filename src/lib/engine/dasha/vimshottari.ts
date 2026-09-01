// ─────────────────────────────────────────────────────────────
//  src/lib/engine/dasha/vimshottari.ts
//  Complete Vimshottari Dasha — all 6 subcycle levels
//  Maha → Antar → Pratyantar → Sukshma → Prana → Deha
// ─────────────────────────────────────────────────────────────

import type { GrahaId, DashaNode } from '@/types/astrology'
import { NAKSHATRA_LORDS } from '@/types/astrology'

// ── Vimshottari Constants ─────────────────────────────────────

export const VIMSHOTTARI_YEARS: Record<string, number> = {
  Ke: 7,  Ve: 20, Su: 6,  Mo: 10,
  Ma: 7,  Ra: 18, Ju: 16, Sa: 19, Me: 17,
}

export const VIMSHOTTARI_TOTAL = 120  // total years

/** One tribhagi segment (120 ÷ 3 = 40 years); each planet’s period is also ÷3 */
export const VIMSHOTTARI_TRIBHAGI_TOTAL = VIMSHOTTARI_TOTAL / 3

export interface VimshottariOptions {
  /** Tribhagi: 3×40-year cycles; each mahadasha duration ÷3 (PyJHora-style) */
  tribhagi?: boolean
  /**
   * When true, build every branch to `depth` (no current-period pruning).
   * Default false: levels 5–6 (Prana/Deha) only on the running branch — keeps JSON ~1MB.
   * Prefer {@link expandVimshottariNode} for on-demand drill-down in the UI.
   */
  expandAllBranches?: boolean
}

/** Year map / cycle total for standard or Tribhagi Vimshottari (for lazy UI expansion). */
export function vimshottariYearParams(tribhagi = false): {
  yearsMap: Record<string, number>
  cycleTotal: number
  useSiderealYear: boolean
} {
  if (!tribhagi) {
    return {
      yearsMap: VIMSHOTTARI_YEARS,
      cycleTotal: VIMSHOTTARI_TOTAL,
      useSiderealYear: true, // JHora / PyJHora default (mean sidereal year)
    }
  }
  return {
    yearsMap: Object.fromEntries(
      Object.entries(VIMSHOTTARI_YEARS).map(([k, v]) => [k, v / 3]),
    ),
    cycleTotal: VIMSHOTTARI_TRIBHAGI_TOTAL,
    useSiderealYear: true,
  }
}

// Sequence of Dasha lords (fixed order)
export const DASHA_SEQUENCE = [
  'Ke','Ve','Su','Mo','Ma','Ra','Ju','Sa','Me',
] as const satisfies readonly GrahaId[]

export type VimshottariLord = (typeof DASHA_SEQUENCE)[number]

/** Each Vimshottari lord’s three nakshatras (fixed groups; used outside tribhagi progression) */
export const LORD_TRIBHAGI_NAKSHATRAS: Record<VimshottariLord, [number, number, number]> = {
  Ke: [0, 9, 18],
  Ve: [1, 10, 19],
  Su: [2, 11, 20],
  Mo: [3, 12, 21],
  Ma: [4, 13, 22],
  Ra: [5, 14, 23],
  Ju: [6, 15, 24],
  Sa: [7, 16, 25],
  Me: [8, 17, 26],
}

// ── Helper ────────────────────────────────────────────────────

/** Tropical year (legacy / display helpers) */
const TROPICAL_YEAR_MS = 365.25 * 24 * 60 * 60 * 1000
/** Mean sidereal year — JHora / PyJHora default for dasha durations */
const SIDEREAL_YEAR_MS = 365.256363004 * 24 * 60 * 60 * 1000

function activeYearMs(useSiderealYear: boolean): number {
  return useSiderealYear ? SIDEREAL_YEAR_MS : TROPICAL_YEAR_MS
}

function yearsToMs(years: number, useSiderealYear: boolean): number {
  return years * activeYearMs(useSiderealYear)
}

/**
 * Tribhagi: each mahadasha steps one nakshatra forward from birth nakshatra
 * (Ashwini→…→Revati cycle), matching JHora “Tribhagi variation” lists.
 */
export function tribhagiMahaNakshatraIndex(
  birthNakshatraIndex: number,
  globalMahaIndex: number,
): number {
  return (birthNakshatraIndex + globalMahaIndex) % 27
}

/**
 * Find the index of a Graha in DASHA_SEQUENCE
 */
function dashaIndex(lord: GrahaId): number {
  return (DASHA_SEQUENCE as readonly GrahaId[]).indexOf(lord)
}

// ── Main Calculator ───────────────────────────────────────────

/**
 * Calculate complete Vimshottari Dasha tree
 *
 * @param moonLonSidereal  Moon's sidereal longitude at birth
 * @param birthDate        Date of birth
 * @param depth            How many levels deep (1=Maha only, 6=all levels)
 * @param startTaraGraha   Override start Tara — default is Moon (for Vela+ users)
 * @param options          tribhagi: divide periods by 3 and repeat the 9-lord cycle thrice
 */
export function calcVimshottari(
  moonLonSidereal: number,
  birthDate: Date,
  depth: number = 6,
  startTaraGraha?: GrahaId,
  options: VimshottariOptions = {},
): DashaNode[] {
  const tribhagi = options.tribhagi === true
  const expandAllBranches = options.expandAllBranches === true
  const { yearsMap, cycleTotal, useSiderealYear } = vimshottariYearParams(tribhagi)
  const cycles = tribhagi ? 3 : 1

  // ── Step 1: Find birth Nakshatra and lord ────────────────
  const NAKSHATRA_SPAN = 360 / 27

  // Which planet's nakshatra to use (default Moon)
  const refLon = moonLonSidereal
  const normalized = ((refLon % 360) + 360) % 360
  const nakshatraIndex = Math.floor(normalized / NAKSHATRA_SPAN)

  // Birth Dasha lord from nakshatra
  const birthLord = startTaraGraha || NAKSHATRA_LORDS[nakshatraIndex]

  // ── Step 2: Calculate Dasha balance at birth ─────────────
  const withinNakshatra = normalized % NAKSHATRA_SPAN
  const traversedFraction = withinNakshatra / NAKSHATRA_SPAN
  const remainingFraction = 1 - traversedFraction

  const balanceYears = remainingFraction * yearsMap[birthLord]

  // ── Step 3: Build Maha Dasha sequence ────────────────────
  const birthLordIdx = dashaIndex(birthLord)
  const nodes: DashaNode[] = []
  const elapsedYears = traversedFraction * yearsMap[birthLord]
  let cursor = tribhagi
    ? birthDate.getTime() - yearsToMs(elapsedYears, true)
    : birthDate.getTime()
  const now  = Date.now()
  let globalMahaIndex = 0

  for (let cycle = 0; cycle < cycles; cycle++) {
    for (let i = 0; i < 9; i++) {
      const lord = DASHA_SEQUENCE[(birthLordIdx + i) % 9]
      // Tribhagi/JHora: backdated start + full slice per lord; standard: balance on first row only
      const years = tribhagi
        ? yearsMap[lord]
        : (cycle === 0 && i === 0 ? balanceYears : yearsMap[lord])
      const durationMs = yearsToMs(years, useSiderealYear)

      const start = new Date(cursor)
      const end   = new Date(cursor + durationMs)

      const nakshatraIdx = tribhagi
        ? tribhagiMahaNakshatraIndex(nakshatraIndex, globalMahaIndex)
        : undefined

      nodes.push({
        lord,
        start,
        end,
        durationMs,
        level: 1,
        isCurrent: now >= start.getTime() && now < end.getTime(),
        ...(nakshatraIdx !== undefined ? { nakshatraIndex: nakshatraIdx } : {}),
        children: depth > 1
          ? buildSubDashas(
              lord, start, end, durationMs, 2, depth, now,
              yearsMap, cycleTotal, useSiderealYear, expandAllBranches,
            )
          : [],
      })

      cursor += durationMs
      globalMahaIndex++
    }
  }

  return nodes
}

/**
 * Lazily build the next sub-period level(s) under a parent node.
 * Used by the UI so Gold/Platinum can drill any lord to Prana/Deha without
 * embedding the full ~600k-node tree in the chart API response.
 *
 * @param parent   Node to expand (e.g. a Sukshma with empty children)
 * @param toDepth  Absolute max level to build (inclusive). Default: one level below parent.
 */
export function expandVimshottariNode(
  parent: DashaNode,
  toDepth: number = parent.level + 1,
  options: { tribhagi?: boolean; now?: number } = {},
): DashaNode[] {
  if (parent.level >= toDepth) return []
  const { yearsMap, cycleTotal, useSiderealYear } = vimshottariYearParams(options.tribhagi === true)
  const start = parent.start instanceof Date ? parent.start : new Date(parent.start)
  const end = parent.end instanceof Date ? parent.end : new Date(parent.end)
  return buildSubDashas(
    parent.lord as GrahaId,
    start,
    end,
    parent.durationMs,
    parent.level + 1,
    toDepth,
    options.now ?? Date.now(),
    yearsMap,
    cycleTotal,
    useSiderealYear,
    true, // expand this branch fully to toDepth
  )
}

/**
 * Recursively build sub-Dasha levels
 * Each sub-period is proportional: (subLordYears / 120) × parentDuration
 */
function buildSubDashas(
  mahaLord:   GrahaId,
  parentStart:Date,
  parentEnd:  Date,
  parentMs:   number,
  currentLevel: number,
  maxDepth:   number,
  now:        number,
  yearsMap:   Record<string, number> = VIMSHOTTARI_YEARS,
  cycleTotal: number = VIMSHOTTARI_TOTAL,
  useSiderealYear = false,
  expandAllBranches = false,
): DashaNode[] {
  const mahaIdx = dashaIndex(mahaLord)
  const nodes: DashaNode[] = []
  let cursor = parentStart.getTime()

  for (let i = 0; i < 9; i++) {
    const lord      = DASHA_SEQUENCE[(mahaIdx + i) % 9]
    const fraction  = yearsMap[lord] / cycleTotal
    const durationMs = parentMs * fraction

    const start = new Date(cursor)
    const end   = new Date(cursor + durationMs)
    const isCurrent = now >= cursor && now < cursor + durationMs

    // Optimization: For levels deeper than 4 (Sukshma), only calculate sub-periods
    // for the CURRENT branch to avoid exponential JSON growth (~88MB → ~1MB).
    // expandAllBranches (or lazy expandVimshottariNode) fills non-current paths on demand.
    const shouldGoDeeper =
      currentLevel < maxDepth &&
      (expandAllBranches || currentLevel <= 3 || isCurrent)

    nodes.push({
      lord,
      start,
      end,
      durationMs,
      level: currentLevel,
      isCurrent,
      children: shouldGoDeeper
        ? buildSubDashas(
            lord, start, end, durationMs, currentLevel + 1, maxDepth, now,
            yearsMap, cycleTotal, useSiderealYear, expandAllBranches,
          )
        : [],
    })

    cursor += durationMs
  }

  return nodes
}

// ── Utility Functions ─────────────────────────────────────────

/**
 * Find the currently running Dasha at each level
 * Returns path from Maha → Antar → ... → deepest current
 */
export function getCurrentDasha(
  nodes: DashaNode[],
  now: Date = new Date(),
): DashaNode[] {
  const nowMs = now.getTime()
  const path: DashaNode[] = []

  function traverse(dashas: DashaNode[]): boolean {
    for (const node of dashas) {
      if (nowMs >= new Date(node.start).getTime() && nowMs < new Date(node.end).getTime()) {
        path.push(node)
        if (node.children.length > 0) {
          traverse(node.children)
        }
        return true
      }
    }
    return false
  }

  traverse(nodes)
  return path
}

/**
 * Get time remaining in current Dasha as formatted string
 */
export function getDashaTimeRemaining(node: DashaNode): string {
  const now = Date.now()
  const remaining = new Date(node.end).getTime() - now

  if (remaining <= 0) return 'Completed'

  const years  = Math.floor(remaining / TROPICAL_YEAR_MS)
  const months = Math.floor((remaining % TROPICAL_YEAR_MS) / (30.44 * 24 * 60 * 60 * 1000))
  const days   = Math.floor((remaining % (30.44 * 24 * 60 * 60 * 1000)) / (24 * 60 * 60 * 1000))

  const parts: string[] = []
  if (years  > 0) parts.push(`${years}y`)
  if (months > 0) parts.push(`${months}m`)
  if (days   > 0) parts.push(`${days}d`)

  return parts.join(' ') || '< 1 day'
}

/**
 * Format a Dasha node label (e.g., "Jupiter/Venus/Mercury")
 */
export function formatDashaLabel(path: DashaNode[]): string {
  return path.map(n => n.lord).join('/')
}

/**
 * Get all Dasha periods between two dates (flat list)
 * Useful for timeline visualization
 */
export function getDashasBetween(
  nodes: DashaNode[],
  from: Date,
  to: Date,
  level: number = 1,
): DashaNode[] {
  const result: DashaNode[] = []

  function traverse(dashas: DashaNode[], currentLevel: number): void {
    for (const node of dashas) {
      if (node.end <= from || node.start >= to) continue

      if (currentLevel === level) {
        result.push(node)
      } else if (currentLevel < level && node.children.length > 0) {
        traverse(node.children, currentLevel + 1)
      }
    }
  }

  traverse(nodes, 1)
  return result
}

// Dasha level names
export const DASHA_LEVEL_NAMES = [
  '', 'Maha Dasha', 'Antar Dasha', 'Pratyantar Dasha',
  'Sukshma Dasha', 'Prana Dasha', 'Deha Dasha',
]

export const DASHA_LEVEL_SHORT = [
  '', 'MD', 'AD', 'PD', 'SD', 'PrD', 'DD',
]
