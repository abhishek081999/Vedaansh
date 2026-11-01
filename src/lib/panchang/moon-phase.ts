// ─────────────────────────────────────────────────────────────
//  src/lib/panchang/moon-phase.ts
//  Moon phase geometry shared by the sky wheel and the calendar
// ─────────────────────────────────────────────────────────────

/** Lit limb plus elliptical terminator, centred on 0,0. Waxing lights the right side. */
export function moonLitPath(elongDeg: number, r: number): string {
  const e = ((elongDeg % 360) + 360) % 360
  const cosE = Math.cos((e * Math.PI) / 180)
  const waxing = e < 180
  const crescent = cosE > 0
  const limbSweep = waxing ? 1 : 0
  const terminatorSweep = waxing === crescent ? 0 : 1
  const rx = (r * Math.abs(cosE)).toFixed(2)
  return `M 0 ${-r} A ${r} ${r} 0 0 ${limbSweep} 0 ${r} A ${rx} ${r} 0 0 ${terminatorSweep} 0 ${-r} Z`
}

/** Moon-Sun separation at the middle of a tithi (1–30), each spanning 12°. */
export function elongationForTithi(tithiNumber: number): number {
  return (tithiNumber - 0.5) * 12
}
