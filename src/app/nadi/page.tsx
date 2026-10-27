'use client'

import React from 'react'
import dynamic from 'next/dynamic'
import { useSession } from 'next-auth/react'
import { useChart } from '@/components/providers/ChartProvider'
import { ChartRequiredPrompt } from '@/components/ui/ChartRequiredPrompt'
import { VedaanshLoader } from '@/components/ui/primitives/VedaanshLoader'
import type { UserPlan } from '@/types/astrology'

const NadiPanel = dynamic(
  () => import('@/components/ui/NadiPanel').then((m) => m.NadiPanel),
  {
    ssr: false,
    loading: () => (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 280, padding: '3rem 1rem' }}>
        <VedaanshLoader size={44} message="Opening Nadi Astrology…" />
      </div>
    ),
  },
)

export default function NadiPage() {
  const { chart } = useChart()
  const { data: session } = useSession()
  const userPlan = ((session?.user as { plan?: UserPlan } | undefined)?.plan ?? 'free') as UserPlan

  if (!chart) {
    return (
      <ChartRequiredPrompt
        title="Nadi Astrology"
        description="Load or create a birth chart to open the Nadi workspace: the chart, planetary positions, dasha, and the twelve houses."
      />
    )
  }

  return (
    <div className="main-responsive-padding fade-up" style={{ width: '100%', minWidth: 0, boxSizing: 'border-box' }}>
      <NadiPanel chart={chart} userPlan={userPlan} />
    </div>
  )
}
