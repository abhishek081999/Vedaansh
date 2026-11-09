'use client'
// ─────────────────────────────────────────────────────────────
//  src/app/relationship/page.tsx
//  Relationship & Marriage — standalone route for the loaded chart
//  Plan gating is enforced inside the panel (planMeetsUiGate).
// ─────────────────────────────────────────────────────────────

import React from 'react'
import dynamic from 'next/dynamic'
import { useTranslations } from 'next-intl'
import { useSession } from 'next-auth/react'
import { useChart } from '@/components/providers/ChartProvider'
import { ChartRequiredPrompt } from '@/components/ui/ChartRequiredPrompt'
import { VedaanshLoader } from '@/components/ui/primitives/VedaanshLoader'

function RelationshipLoader() {
  const t = useTranslations('relationshipMarriage.page')
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 280, padding: '3rem 1rem' }}>
      <VedaanshLoader size={44} message={t('loader')} />
    </div>
  )
}

const RelationshipMarriagePanel = dynamic(
  () => import('@/components/ui/RelationshipMarriagePanel').then(m => m.RelationshipMarriagePanel),
  {
    ssr: false,
    loading: () => <RelationshipLoader />,
  },
)

export default function RelationshipPage() {
  const { chart } = useChart()
  const { data: session } = useSession()
  const t = useTranslations('relationshipMarriage.page')
  const userPlan = ((session?.user as { plan?: string } | undefined)?.plan ?? 'free') as 'free' | 'gold' | 'platinum'

  if (!chart) {
    return (
      <ChartRequiredPrompt
        title={t('chartRequiredTitle')}
        description={t('chartRequiredDescription')}
      />
    )
  }

  return (
    <div className="fade-up" style={{ width: '100%' }}>
      <RelationshipMarriagePanel chart={chart} userPlan={userPlan} />
    </div>
  )
}
