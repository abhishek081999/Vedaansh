// ─────────────────────────────────────────────────────────────
//  src/components/ui/viz/MoonPhase.tsx
//  Lit-fraction Moon disc for a tithi / kala (1–30)
// ─────────────────────────────────────────────────────────────

import React from 'react'

/**
 * @param tithi 1–30 (1–15 Shukla, 16–30 Krishna; 15 = Purnima, 30 = Amavasya)
 */
export function MoonPhase({ tithi, size = 64, label }: { tithi: number; size?: number; label?: string }) {
  const t = ((Math.round(tithi) - 1) % 30 + 30) % 30 + 1
  // Phase angle 0 (new) → π (full) → 2π (new)
  const phase = (t / 30) * Math.PI * 2
  const lit = (1 - Math.cos(phase)) / 2
  const waxing = t <= 15
  const r = size / 2 - 2
  const c = size / 2
  // Terminator ellipse x-radius
  const rx = Math.abs(Math.cos(phase)) * r
  const bright = waxing ? 1 : 0 // waxing: right limb lit
  const sweepOuter = bright
  const sweepInner = lit > 0.5 ? (waxing ? 1 : 0) : (waxing ? 0 : 1)
  const d = `M${c},${c - r} A${r},${r} 0 0 ${sweepOuter} ${c},${c + r} A${rx},${r} 0 0 ${sweepInner} ${c},${c - r} Z`

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label={label ?? `Moon ${Math.round(lit * 100)}% lit`}>
      <circle cx={c} cy={c} r={r} fill="var(--surface-3)" stroke="var(--border)" />
      {t === 30 ? null : t === 15 ? <circle cx={c} cy={c} r={r} fill="var(--gold-light)" /> : <path d={d} fill="var(--gold-light)" />}
    </svg>
  )
}
