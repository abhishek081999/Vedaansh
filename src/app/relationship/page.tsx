'use client'
// ─────────────────────────────────────────────────────────────
//  src/app/relationship/page.tsx
//  Relationship & Marriage — standalone route for the loaded chart
//  Plan gating is enforced inside the panel (planMeetsUiGate).
// ─────────────────────────────────────────────────────────────

import React from 'react'
import dynamic from 'next/dynamic'
import { useSession } from 'next-auth/react'
import { useChart } from '@/components/providers/ChartProvider'
import { ChartRequiredPrompt } from '@/components/ui/ChartRequiredPrompt'
import { VedaanshLoader } from '@/components/ui/primitives/VedaanshLoader'

const RelationshipMarriagePanel = dynamic(
  () => import('@/components/ui/RelationshipMarriagePanel').then(m => m.RelationshipMarriagePanel),
  {
    ssr: false,
    loading: () => (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 280, padding: '3rem 1rem' }}>
        <VedaanshLoader size={44} message="Reading relationship and marriage…" />
      </div>
    ),
  },
)

export default function RelationshipPage() {
  const { chart } = useChart()
  const { data: session } = useSession()
  const userPlan = ((session?.user as { plan?: string } | undefined)?.plan ?? 'free') as 'free' | 'gold' | 'platinum'

  if (!chart) {
    return (
      <ChartRequiredPrompt
        title="Relationship & Marriage"
        description="Load or create your birth chart to read marriage promise, timing, Mars and Vivah factors, and Navamsha analysis."
      />
    )
  }

  return (
    <div className="fade-up" style={{ width: '100%' }}>
      <RelationshipMarriagePanel chart={chart} userPlan={userPlan} />
    </div>
  )
}
