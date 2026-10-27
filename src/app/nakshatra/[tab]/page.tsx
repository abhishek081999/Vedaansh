'use client'
import React from 'react'
import dynamic from 'next/dynamic'
import { useParams } from 'next/navigation'
import { useChart } from '@/components/providers/ChartProvider'
import type { NakshatraSubTab } from '@/components/ui/NakshatraPanel'

const NakshatraPanel = dynamic(() => import('@/components/ui/NakshatraPanel').then(m => m.NakshatraPanel), { ssr: false })
const NakshatraEmpty = dynamic(() => import('@/components/ui/NakshatraPanel').then(m => m.NakshatraEmpty), { ssr: false })

const TABS = new Set<NakshatraSubTab>([
  'overview', 'navtara', 'taramandal', 'bestdays', 'muhurta', 'panchaka',
  'planet', 'compat', 'remedies', 'profession', 'medical',
])

export default function NakshatraTabPage() {
  const { tab } = useParams()
  const { chart, openBirthForm } = useChart()
  const raw = Array.isArray(tab) ? tab[0] : tab
  const subTab: NakshatraSubTab = raw && TABS.has(raw as NakshatraSubTab) ? raw as NakshatraSubTab : 'overview'

  if (!chart) {
    return (
      <div className="main-responsive-padding fade-up" style={{ minWidth: 0, padding: 'clamp(1rem, 3vw, 2rem)' }}>
        <NakshatraEmpty
          onOpenBirthForm={openBirthForm}
          detail="Load a birth chart to open this nakshatra section."
        />
      </div>
    )
  }

  return (
    <div className="main-responsive-padding fade-up" style={{ minWidth: 0, padding: 'clamp(1rem, 3vw, 2rem)' }}>
      <NakshatraPanel chart={chart} initialTab={subTab} />
    </div>
  )
}
