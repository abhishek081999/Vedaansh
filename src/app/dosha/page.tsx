'use client'
// ─────────────────────────────────────────────────────────────
//  src/app/dosha/page.tsx
//  Shrap / Dosha & Upay — standalone route for the loaded chart
//  Plan gating is enforced inside the panel (planMeetsUiGate).
// ─────────────────────────────────────────────────────────────

import React from 'react'
import dynamic from 'next/dynamic'
import { useSession } from 'next-auth/react'
import { useTranslations } from 'next-intl'
import { useChart } from '@/components/providers/ChartProvider'
import { ChartRequiredPrompt } from '@/components/ui/ChartRequiredPrompt'
import { VedaanshLoader } from '@/components/ui/primitives/VedaanshLoader'

function DoshaLoader() {
  const t = useTranslations('dosha.page')
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 280, padding: '3rem 1rem' }}>
      <VedaanshLoader size={44} message={t('loader')} />
    </div>
  )
}

const ShrapDoshaPanel = dynamic(
  () => import('@/components/ui/ShrapDoshaPanel').then(m => m.ShrapDoshaPanel),
  {
    ssr: false,
    loading: () => <DoshaLoader />,
  },
)

export default function DoshaPage() {
  const t = useTranslations('dosha.page')
  const { chart } = useChart()
  const { data: session } = useSession()
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
      <ShrapDoshaPanel chart={chart} userPlan={userPlan} />
    </div>
  )
}
