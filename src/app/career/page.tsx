'use client'
// ─────────────────────────────────────────────────────────────
//  src/app/career/page.tsx
//  Career & Profession — standalone route for the loaded chart
//  Plan gating is enforced inside the panel (planMeetsUiGate).
// ─────────────────────────────────────────────────────────────

import React from 'react'
import dynamic from 'next/dynamic'
import { useSession } from 'next-auth/react'
import { useChart } from '@/components/providers/ChartProvider'
import { ChartRequiredPrompt } from '@/components/ui/ChartRequiredPrompt'
import { VedaanshLoader } from '@/components/ui/primitives/VedaanshLoader'

const CareerProfessionPanel = dynamic(
  () => import('@/components/ui/CareerProfessionPanel').then(m => m.CareerProfessionPanel),
  {
    ssr: false,
    loading: () => (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 280, padding: '3rem 1rem' }}>
        <VedaanshLoader size={44} message="Reading career and profession…" />
      </div>
    ),
  },
)

export default function CareerPage() {
  const { chart } = useChart()
  const { data: session } = useSession()
  const userPlan = ((session?.user as { plan?: string } | undefined)?.plan ?? 'free') as 'free' | 'gold' | 'platinum'

  if (!chart) {
    return (
      <ChartRequiredPrompt
        title="Career & Profession"
        description="Load or create your birth chart to read career direction, Dashamsha strength, and the professional method for your profession."
      />
    )
  }

  return (
    <div className="fade-up" style={{ width: '100%' }}>
      <CareerProfessionPanel chart={chart} userPlan={userPlan} />
    </div>
  )
}
