import { NextResponse } from 'next/server'
import connectDB from '@/lib/db/mongodb'
import { User } from '@/lib/db/models/User'
import { getEffectivePlan } from '@/lib/subscription/entitlements'
import type { UserPlan } from '@/types/astrology'

export type PlanGate = 'gold' | 'platinum'

export async function getEffectivePlanForUserId(userId: string): Promise<UserPlan | null> {
  await connectDB()
  const user = await User.findById(userId).select('plan planExpiresAt').lean() as {
    plan?: string
    planExpiresAt?: Date | null
  } | null
  if (!user) return null
  return getEffectivePlan(user.plan, user.planExpiresAt)
}

export function planMeetsGate(plan: UserPlan, gate: PlanGate): boolean {
  if (gate === 'gold') return plan === 'gold' || plan === 'platinum'
  return plan === 'platinum'
}

export function planGateJsonResponse(gate: PlanGate): NextResponse {
  const isGold = gate === 'gold'
  return NextResponse.json(
    {
      success: false,
      error: isGold
        ? 'This feature requires Gold or Platinum plan'
        : 'This feature requires Platinum plan',
      upgradeRequired: true,
      upgradeUrl: isGold ? '/account?upgrade=gold' : '/account?upgrade=platinum',
    },
    { status: 403 },
  )
}

/**
 * Reads plan from MongoDB (not JWT) and returns 403 when the gate is not met.
 */
export async function requirePlanGate(userId: string, gate: PlanGate): Promise<NextResponse | null> {
  const plan = await getEffectivePlanForUserId(userId)
  if (!plan || !planMeetsGate(plan, gate)) {
    return planGateJsonResponse(gate)
  }
  return null
}
