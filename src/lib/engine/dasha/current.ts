// ─────────────────────────────────────────────────────────────
//  src/lib/engine/dasha/current.ts
//  Live period checks from start/end — do not trust baked isCurrent
//  flags (cached charts and transit “as of” dates go stale).
// ─────────────────────────────────────────────────────────────

import type { DashaNode } from '@/types/astrology'

function toMs(value: Date | string | number): number {
  if (value instanceof Date) return value.getTime()
  if (typeof value === 'number') return value
  return new Date(value).getTime()
}

/** True when `now` falls in [start, end). Matches engine exclusive-end bounds. */
export function isDashaRunning(node: DashaNode, now: number = Date.now()): boolean {
  const start = toMs(node.start)
  const end = toMs(node.end)
  return Number.isFinite(start) && Number.isFinite(end) && now >= start && now < end
}

/** Maha → Antar → … path running at `now`. Walks existing children only. */
export function getDashaPathAt(nodes: DashaNode[], now: number = Date.now()): DashaNode[] {
  const path: DashaNode[] = []
  let current = nodes.find(n => isDashaRunning(n, now))
  while (current) {
    path.push(current)
    current = current.children?.find(c => isDashaRunning(c, now))
  }
  return path
}
