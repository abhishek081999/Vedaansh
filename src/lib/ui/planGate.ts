import type { UserPlan } from '@/types/astrology'

export type UiPlanGate = 'gold' | 'platinum'

const PLAN_RANK: Record<UserPlan, number> = {
  free: 0,
  gold: 1,
  platinum: 2,
}

const GATE_RANK: Record<UiPlanGate, number> = {
  gold: 1,
  platinum: 2,
}

/** Client-safe plan gate check — mirrors server `planMeetsGate` without DB imports. */
export function planMeetsUiGate(plan: UserPlan, gate: UiPlanGate): boolean {
  return PLAN_RANK[plan] >= GATE_RANK[gate]
}

export function planGateLabel(gate: UiPlanGate): string {
  return gate === 'gold' ? 'Gold' : 'Platinum'
}
