'use client'
// ─────────────────────────────────────────────────────────────
//  src/components/ui/patterns/PlanGate.tsx
//  Visual plan gate — API must enforce access separately
// ─────────────────────────────────────────────────────────────

import { Link } from '@/i18n/navigation'
import React from 'react'
import { Lock } from 'lucide-react'
import type { UserPlan } from '@/types/astrology'
import { planGateLabel, planMeetsUiGate, type UiPlanGate } from '@/lib/ui/planGate'
import { Button } from '@/components/ui/primitives/Button'
import { useTranslations } from 'next-intl'

export interface PlanGateProps {
  userPlan: UserPlan
  required: UiPlanGate
  featureName?: string
  children: React.ReactNode
  className?: string
}

export function PlanGate({
  userPlan,
  required,
  featureName,
  children,
  className,
}: PlanGateProps) {
  const t = useTranslations('chartTools.planGate')
  if (planMeetsUiGate(userPlan, required)) {
    return <>{children}</>
  }

  const tier = planGateLabel(required)

  return (
    <div className={className ?? 'plan-gate'}>
      <div className="plan-gate__content">{children}</div>
      <div className="plan-gate__overlay">
        <span className="plan-gate__label">
          <Lock size={16} aria-hidden />
          {featureName ? t('requires', { feature: featureName, tier }) : t('required', { tier })}
        </span>
        <Link href="/pricing" style={{ pointerEvents: 'auto' }}>
          <Button variant="primary" size="sm">
            {t('viewPlans')}
          </Button>
        </Link>
      </div>
    </div>
  )
}
