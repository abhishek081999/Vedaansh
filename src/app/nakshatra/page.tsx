'use client'
import React from 'react'
import dynamic from 'next/dynamic'
import { useChart } from '@/components/providers/ChartProvider'

const NakshatraPanel = dynamic(() => import('@/components/ui/NakshatraPanel').then(m => m.NakshatraPanel), { ssr: false })
const NakshatraEmpty = dynamic(() => import('@/components/ui/NakshatraPanel').then(m => m.NakshatraEmpty), { ssr: false })

export default function NakshatraPage() {
  const { chart, openBirthForm } = useChart()

  if (!chart) {
    return (
      <div className="main-responsive-padding fade-up" style={{ minWidth: 0, padding: 'clamp(1rem, 3vw, 2rem)' }}>
        <NakshatraEmpty onOpenBirthForm={openBirthForm} />
      </div>
    )
  }

  return (
    <div className="main-responsive-padding fade-up" style={{ minWidth: 0, padding: 'clamp(1rem, 3vw, 2rem)' }}>
      <NakshatraPanel chart={chart} initialTab="overview" />
    </div>
  )
}
