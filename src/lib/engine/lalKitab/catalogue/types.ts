// ─────────────────────────────────────────────────────────────
//  src/lib/engine/lalKitab/catalogue/types.ts
//  Shape of a Lal Kitab rule. Rules are data; display text is kept
//  apart in per-language tables keyed by `text`.
// ─────────────────────────────────────────────────────────────

import type { LkCondition } from '../conditions'
import type { LkArea, LkEdition, LkEffect, LkGraha } from '../types'

export interface LkRule {
  /** Stable id. Never shown; never translated. */
  id: string
  /** Key into the text tables. Several rules may share one template. */
  text: string
  when: LkCondition
  effect: LkEffect
  /** 1 (minor) – 5 (decisive). Used for ranking. */
  weight: 1 | 2 | 3 | 4 | 5
  areas: readonly LkArea[]
  /** The planet the finding is about ({planet} in templates). */
  planet?: LkGraha
  edition: LkEdition
}

/** Text for one rule template. Slots: {planet}, {house}, {others}. */
export interface LkRuleText {
  label: string
  text: string
}
