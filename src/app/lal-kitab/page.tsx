'use client'

import React from 'react'
import dynamic from 'next/dynamic'
import { useSession } from 'next-auth/react'
import { useTranslations } from 'next-intl'
import { useChart } from '@/components/providers/ChartProvider'
import { ChartRequiredPrompt } from '@/components/ui/ChartRequiredPrompt'
import { VedaanshLoader } from '@/components/ui/primitives/VedaanshLoader'
import type { UserPlan } from '@/types/astrology'

function LalKitabLoader() {
  const t = useTranslations('lalKitab.page')
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 280, padding: '3rem 1rem' }}>
      <VedaanshLoader size={44} message={t('loader')} />
    </div>
  )
}

const LalKitabPanel = dynamic(
  () => import('@/components/ui/LalKitabPanel').then((m) => m.LalKitabPanel),
  { ssr: false, loading: () => <LalKitabLoader /> },
)

export default function LalKitabPage() {
  const t = useTranslations('lalKitab.page')
  const { chart } = useChart()
  const { data: session } = useSession()
  const userPlan = ((session?.user as { plan?: UserPlan } | undefined)?.plan ?? 'free') as UserPlan

  if (!chart) {
    return <ChartRequiredPrompt title={t('chartRequiredTitle')} description={t('chartRequiredDescription')} />
  }

  return (
    <div className="main-responsive-padding fade-up" style={{ width: '100%', minWidth: 0, boxSizing: 'border-box' }}>
      <LalKitabPanel chart={chart} userPlan={userPlan} />
    </div>
  )
}
