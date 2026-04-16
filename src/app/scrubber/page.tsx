'use client'

import React, { useState } from 'react'
import dynamic from 'next/dynamic'
import { useChart } from '@/components/providers/ChartProvider'
import Link from 'next/link'
import type { GrahaData } from '@/types/astrology'

const TransitScrubber = dynamic(() => import('@/components/dashboard/TransitScrubber').then(m => m.TransitScrubber), { ssr: false })

export default function ScrubberPage() {
  const { chart } = useChart()
  const [transitGrahas, setTransitGrahas] = useState<GrahaData[] | null>(null)

  if (!chart) {
    return (
      <div style={{ display: 'flex', flex: 1, alignItems: 'center', justifyContent: 'center', padding: '4rem 2rem' }}>
        <div className="card" style={{ maxWidth: '500px', width: '100%', textAlign: 'center', padding: '3rem' }}>
          <div style={{ fontSize: '4rem', marginBottom: '1.5rem' }}>⏳</div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.8rem', color: 'var(--text-gold)', marginBottom: '1rem' }}>Birth Data Required</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '2rem', lineHeight: 1.6 }}>
            The Time Scrubber allows you to fast-forward your life cycles. We need your natal chart as the foundation for this analysis.
          </p>
          <Link href="/?new=true" className="btn btn-primary" style={{ padding: '0.75rem 2rem', textDecoration: 'none' }}>
            Enter Birth Details
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="fade-up" style={{ display: 'flex', flexDirection: 'column', gap: '2rem', padding: '2rem' }}>
      <header>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
          <span className="badge-accent">Interactive Engine</span>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-gold)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em' }}>4D Transit Analysis</span>
        </div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2.5rem', fontWeight: 700, margin: 0 }}>
          Planetary Time Scrubber
        </h1>
        <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem', maxWidth: '800px', fontSize: '1.1rem' }}>
          Scrub through years and months to visualize precisely how transiting planets interact with your natal placements in real-time.
        </p>
      </header>

      <div className="card" style={{ padding: '2rem' }}>
        <TransitScrubber natalChart={chart} onTransitChange={setTransitGrahas} />
      </div>

      <div style={{ height: '4rem' }} />
    </div>
  )
}
