'use client'
// ─────────────────────────────────────────────────────────────
//  src/app/dosha/page.tsx
//  Shrap / Dosha & Upay — standalone route for the loaded chart
//  Plan gating is enforced inside the panel (planMeetsUiGate).
// ─────────────────────────────────────────────────────────────

import React from 'react'
import dynamic from 'next/dynamic'
import { useSession } from 'next-auth/react'
import { useChart } from '@/components/providers/ChartProvider'
import { ChartRequiredPrompt } from '@/components/ui/ChartRequiredPrompt'
import { VedaanshLoader } from '@/components/ui/primitives/VedaanshLoader'

const ShrapDoshaPanel = dynamic(
  () => import('@/components/ui/ShrapDoshaPanel').then(m => m.ShrapDoshaPanel),
  {
    ssr: false,
    loading: () => (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 280, padding: '3rem 1rem' }}>
        <VedaanshLoader size={44} message="Reading Shrap and Dosha…" />
      </div>
    ),
  },
)

export default function DoshaPage() {
  const { chart } = useChart()
  const { data: session } = useSession()
  const userPlan = ((session?.user as { plan?: string } | undefined)?.plan ?? 'free') as 'free' | 'gold' | 'platinum'

  if (!chart) {
    return (
      <ChartRequiredPrompt
        title="Dosha & Upay"
        description="Load or create your birth chart to read Pitru, Matru, Sarpa, Guru, and related Shrap flags, plus children focus, lending risk, and remedy timing."
      />
    )
  }

  return (
    <div className="fade-up" style={{ width: '100%' }}>
      <ShrapDoshaPanel chart={chart} userPlan={userPlan} />
    </div>
  )
}
