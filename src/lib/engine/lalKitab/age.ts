// ─────────────────────────────────────────────────────────────
//  src/lib/engine/lalKitab/age.ts
//  Lal Kitab planet maturity: the age at which each planet starts to
//  give its full result. Source: 1952 edition. The 35-year cycle and
//  Varshphal are added in Phase 6.
// ─────────────────────────────────────────────────────────────

import type { LkGraha } from './types'

export const LK_MATURITY_AGE: Record<LkGraha, number> = {
  Ju: 16, Su: 22, Mo: 24, Ve: 25, Ma: 28, Me: 34, Sa: 36, Ra: 42, Ke: 48,
}
