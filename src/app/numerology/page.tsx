'use client'
import React from 'react'
import dynamic from 'next/dynamic'
import { useChart } from '@/components/providers/ChartProvider'

const VedicNumerologyPanel = dynamic(
  () => import('@/components/numerology/VedicNumerologyPanel').then(m => m.VedicNumerologyPanel),
  { ssr: false },
)

export default function NumerologyPage() {
  const { chart } = useChart()

  return (
    <div
      className="main-responsive-padding fade-up"
      style={{ minWidth: 0, maxWidth: '1400px', width: '100%', margin: '0 auto', padding: 'clamp(0.5rem, 1.5vw, 1.25rem)', boxSizing: 'border-box' }}
    >
      <VedicNumerologyPanel chart={chart} />
    </div>
  )
}
