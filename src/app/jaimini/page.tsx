'use client'
import React from 'react'
import dynamic from 'next/dynamic'
import { Zap } from 'lucide-react'
import { useChart } from '@/components/providers/ChartProvider'
import { EmptyState } from '@/components/ui/primitives/EmptyState'

const JaiminiPanel = dynamic(() => import('@/components/ui/JaiminiPanel'), { ssr: false })

export default function JaiminiPage() {
  const { chart, setIsFormOpen } = useChart()

  if (!chart) {
    return (
      <EmptyState
        className="main-empty-state"
        icon={<Zap size={40} strokeWidth={1.5} style={{ color: 'var(--text-gold)', opacity: 0.75 }} />}
        title="Jaimini Astrology"
        description="Load or create a birth chart to explore Chara Karakas, Arudha Padas, Rashi Drishti, and Chara Dasha timelines."
        action={{ label: 'Open Birth Form', onClick: () => setIsFormOpen(true) }}
      />
    )
  }

  return (
    <div
      className="main-responsive-padding fade-up jaimini-page"
      style={{ minWidth: 0, maxWidth: '100%', width: '100%', padding: 'clamp(0.5rem, 1.5vw, 1.25rem)', boxSizing: 'border-box' }}
    >
      <JaiminiPanel chart={chart} />
    </div>
  )
}
