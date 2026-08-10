'use client'

import React, { useState } from 'react'
import dynamic from 'next/dynamic'
import { useChart } from '@/components/providers/ChartProvider'
import { BREAKPOINTS } from '@/lib/ui/breakpoints'
import Link from 'next/link'
import type { GrahaData } from '@/types/astrology'

const TransitScrubber = dynamic(() => import('@/components/dashboard/TransitScrubber').then(m => m.TransitScrubber), { ssr: false })

export default function ScrubberPage() {
  const { chart } = useChart()
  const [transitGrahas, setTransitGrahas] = useState<GrahaData[] | null>(null)
  const [isMobile, setIsMobile] = useState(false)

  React.useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < BREAKPOINTS.lg)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  if (!chart) {
    return (
      <div style={{ display: 'flex', flex: 1, alignItems: 'center', justifyContent: 'center', padding: '4rem 2rem' }}>
        <div className="card" style={{ maxWidth: '500px', width: '100%', textAlign: 'center', padding: '3rem' }}>
          <div style={{ fontSize: '4rem', marginBottom: '1.5rem' }}>⏳</div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.8rem', color: 'var(--text-gold)', marginBottom: '1rem' }}>Birth Data Required</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '2rem', lineHeight: 1.6 }}>
            Transit lets you shift through time and see how planets move against your natal chart. Enter your birth details to get started.
          </p>
          <Link href="/?new=true" className="btn btn-primary" style={{ padding: '0.75rem 2rem', textDecoration: 'none' }}>
            Enter Birth Details
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="fade-up" style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? '0.85rem' : '1rem', padding: isMobile ? '0.85rem' : '1rem 1.5rem 2.5rem', maxWidth: 1280, margin: '0 auto', width: '100%' }}>
      <header style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'baseline', gap: '0.5rem 0.85rem' }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: isMobile ? '1.35rem' : '1.65rem', fontWeight: 700, margin: 0, lineHeight: 1.2, color: 'var(--text-primary)' }}>
          Planetary Transit
        </h1>
        <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '0.8rem', lineHeight: 1.4 }}>
          Scrub date &amp; time against your natal chart
        </p>
      </header>

      <TransitScrubber natalChart={chart} onTransitChange={setTransitGrahas} />
    </div>
  )
}
