// ─────────────────────────────────────────────────────────────
//  src/components/ui/viz/geometry.ts
//  Pure SVG geometry helpers shared by the viz kit
// ─────────────────────────────────────────────────────────────

/** Point on a circle; angle in radians, 0 = 12 o'clock, clockwise. */
export function polar(cx: number, cy: number, r: number, angle: number): [number, number] {
  return [cx + Math.sin(angle) * r, cy - Math.cos(angle) * r]
}

/** SVG path for a ring slice between two angles (radians, clockwise from top). */
export function arcPath(cx: number, cy: number, rOuter: number, rInner: number, a0: number, a1: number): string {
  const span = a1 - a0
  if (span <= 0) return ''
  // A full circle cannot be drawn by a single arc — split it.
  if (span >= Math.PI * 2 - 1e-6) {
    const mid = a0 + Math.PI
    return `${arcPath(cx, cy, rOuter, rInner, a0, mid)} ${arcPath(cx, cy, rOuter, rInner, mid, a1 - 1e-6)}`
  }
  const large = span > Math.PI ? 1 : 0
  const [x0, y0] = polar(cx, cy, rOuter, a0)
  const [x1, y1] = polar(cx, cy, rOuter, a1)
  const [x2, y2] = polar(cx, cy, rInner, a1)
  const [x3, y3] = polar(cx, cy, rInner, a0)
  return [
    `M${x0.toFixed(2)},${y0.toFixed(2)}`,
    `A${rOuter},${rOuter} 0 ${large} 1 ${x1.toFixed(2)},${y1.toFixed(2)}`,
    `L${x2.toFixed(2)},${y2.toFixed(2)}`,
    `A${rInner},${rInner} 0 ${large} 0 ${x3.toFixed(2)},${y3.toFixed(2)}`,
    'Z',
  ].join(' ')
}

export function clamp(v: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, v))
}

/** Value → tone token: ≥ good is teal, ≤ bad is rose, else gold. */
export function toneFor(ratio: number, good = 0.66, bad = 0.4): string {
  if (!Number.isFinite(ratio)) return 'var(--text-muted)'
  if (ratio >= good) return 'var(--teal)'
  if (ratio <= bad) return 'var(--rose)'
  return 'var(--gold)'
}

export function toMs(d: Date | string | number): number {
  return d instanceof Date ? d.getTime() : typeof d === 'number' ? d : new Date(d).getTime()
}
