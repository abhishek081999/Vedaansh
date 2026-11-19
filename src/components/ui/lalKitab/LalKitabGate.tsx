'use client'
// Visual Gold gate for Lal Kitab views. Below Gold only a short teaser is
// rendered (under the PlanGate overlay), so the full reading never ships
// to the page. The engine runs client-side; nothing here is secret.

import React from 'react'
import { useTranslations } from 'next-intl'
import type { UserPlan } from '@/types/astrology'
import { PlanGate } from '@/components/ui/patterns/PlanGate'
import { planMeetsUiGate } from '@/lib/ui/planGate'
import styles from './LalKitab.module.css'

export function useGold(userPlan: UserPlan): boolean {
  return planMeetsUiGate(userPlan, 'gold')
}

export function LalKitabGate({ userPlan, full, teaser }: { userPlan: UserPlan; full: React.ReactNode; teaser: React.ReactNode }) {
  const t = useTranslations('lalKitab.panel')
  if (planMeetsUiGate(userPlan, 'gold')) return <>{full}</>
  // min-height keeps the lock label and button clear of a one-line teaser.
  return (
    <PlanGate userPlan={userPlan} required="gold" featureName={t('gateFeature')} className={`plan-gate ${styles.gate}`}>
      {teaser}
    </PlanGate>
  )
}
