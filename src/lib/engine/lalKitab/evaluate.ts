// ─────────────────────────────────────────────────────────────
//  src/lib/engine/lalKitab/evaluate.ts
//  Runs a rule catalogue over chart facts and returns ranked
//  findings, each with the trail of facts that made it true.
// ─────────────────────────────────────────────────────────────

import type { LkRule } from './catalogue/types'
import { evalCondition, type LkTrailStep } from './conditions'
import type { LkFacts } from './facts'

export interface LkMatch {
  rule: LkRule
  trail: LkTrailStep[]
}

const EFFECT_ORDER = { bad: 0, mixed: 1, good: 2, info: 3 } as const

export function evaluateRules(rules: readonly LkRule[], facts: LkFacts): LkMatch[] {
  const out: LkMatch[] = []
  for (const rule of rules) {
    const r = evalCondition(rule.when, facts)
    if (r.ok) out.push({ rule, trail: r.trail })
  }
  return out.sort((a, b) =>
    b.rule.weight - a.rule.weight
    || EFFECT_ORDER[a.rule.effect] - EFFECT_ORDER[b.rule.effect]
    || a.rule.id.localeCompare(b.rule.id))
}
